/**
 * The doors to the public site that review-policy.ts and live-guard.ts do not
 * see.
 *
 * Those two plugins hold publishing, unpublishing, scheduling, saving a
 * scheduled entry and trashing a live one to «an administrator publishes»
 * (PUBLISH_MIN_ROLE). EmDash has more ways to change what the next build puts
 * on the site, and none of them runs a publish hook:
 *
 *   - a content PUT with `status: "draft"` takes a live entry off the site;
 *   - a content PUT with a `slug` and no `data` writes the live address
 *     straight to the published row (with data, the slug waits in the draft);
 *   - restoring a revision of a scheduled entry changes what the scheduler
 *     publishes, and the scheduler is not checked again;
 *   - replacing or deleting a media file changes the picture on every
 *     published page that shows it – the build fetches it by its key;
 *   - the assistant (MCP) reaches the same handlers, and its plain
 *     content_update carries no «this is the assistant» mark for live-guard.
 *
 * So the same threshold is held here, at the request: this middleware runs
 * after EmDash's own (registered "pre"), when `locals.user` is known. Anyone at
 * or above the threshold is not stopped – they may publish anyway.
 *
 * Two reads are narrowed to the role that may see drafts (Contributor, 20):
 * the dashboard lists the ten latest entries of every status, and an entry's
 * terms answer for drafts too – EmDash checks only `content:read` on both.
 *
 * The OAuth consent page names the requesting application only by a random
 * id, hides where the code goes, and ticks every permission – while anyone can
 * register an application. The page is rewritten to show the registered name
 * (marked as unverified: it is whatever the registrant typed), the host the
 * code is sent to, and to leave the administrative permissions unticked.
 *
 * And search and the full health reply need a signed-in user. site/worker.ts
 * turns them away when there is no session cookie, but a cookie of any value,
 * or an encoded path (`%73earch`, `//`), got past it; here the path is the one
 * EmDash routes on and the user is the one it resolved.
 */
import { defineMiddleware } from "astro:middleware";

declare const __NSV_PUBLISH_MIN_ROLE__: number;

const READ_DRAFTS = 20; // Contributor – EmDash's content:read_drafts

type Emdash = {
  handleContentGet(collection: string, id: string): Promise<{ success: boolean; data?: { item?: Entry } }>;
  handleRevisionGet(id: string): Promise<{ success: boolean; data?: { item?: { collection?: string; entryId?: string } } }>;
};
type Entry = { status?: string };

const refuse = (message: string, status = 403) =>
  Response.json({ error: { code: "FORBIDDEN", message } }, { status, headers: { "cache-control": "no-store" } });

const notFound = () => Response.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });

const ASK = "Збережіть чернетку й попросіть адміністратора опублікувати.";

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.clone().json();
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function entryStatus(emdash: Emdash, collection: string, id: string): Promise<string | undefined> {
  const result = await emdash.handleContentGet(collection, id).catch(() => null);
  return result?.success ? result.data?.item?.status : undefined;
}

const isLive = (status: string | undefined) => status === "published" || status === "scheduled";

/** What a content update would do to a live entry, or null if nothing the gate cares about. */
async function contentUpdateRefusal(
  emdash: Emdash,
  collection: string,
  id: string,
  input: Record<string, unknown>,
  assistant: boolean,
): Promise<string | null> {
  const status = await entryStatus(emdash, collection, id);
  if (assistant && status === "scheduled") {
    return "Запис заплановано на публікацію – асистент його не змінює. Попросіть адміністратора скасувати розклад.";
  }
  if (!isLive(status)) return null;
  if (input.status !== undefined) return `Зняти запис із сайту може лише адміністратор. ${ASK}`;
  if (input.slug !== undefined && input.data === undefined) {
    return `Адресу опублікованого запису змінює лише адміністратор. ${ASK}`;
  }
  return null;
}

/** The assistant's tool calls that reach the same doors. */
async function mcpRefusal(emdash: Emdash, call: Record<string, unknown>, below: boolean): Promise<string | null> {
  if (call.method !== "tools/call") return null;
  const params = (call.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
  const args = params.arguments ?? {};
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  switch (params.name) {
    case "content_update":
      return contentUpdateRefusal(emdash, str(args.collection), str(args.id), args, true);
    case "revision_restore": {
      const rev = await emdash.handleRevisionGet(str(args.revisionId)).catch(() => null);
      const item = rev?.success ? rev.data?.item : undefined;
      if (!item?.collection || !item.entryId) return null;
      return (await entryStatus(emdash, item.collection, item.entryId)) === "scheduled"
        ? "Запис заплановано на публікацію – асистент не відновлює його версії."
        : null;
    }
    case "media_create":
    case "media_delete":
      return below ? "Файли медіатеки реєструє й видаляє лише адміністратор." : null;
    default:
      return null;
  }
}

/* Permissions an application should be given only when someone means it. */
const HIGH_RISK = ["admin", "mcp:tools", "schema:write", "settings:manage", "transfer:export", "transfer:analyze", "transfer:execute"];

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function clientName(id: string): Promise<string | null> {
  /* Loaded here, not at the top: the middleware also runs while pages are
     prerendered, where there is no Worker environment to import. */
  const { env } = await import("cloudflare:workers").catch(() => ({ env: {} }));
  const db = (env as { DB?: D1Database }).DB;
  if (!db || !id) return null;
  try {
    const row = await db.prepare("SELECT name FROM _emdash_oauth_clients WHERE id = ?").bind(id).first<{ name: string }>();
    return row?.name ?? null;
  } catch {
    return null;
  }
}

async function explainConsent(url: URL, response: Response): Promise<Response> {
  if (response.status !== 200 || !response.headers.get("content-type")?.startsWith("text/html")) return response;
  let host = "";
  try {
    host = new URL(url.searchParams.get("redirect_uri") ?? "").host;
  } catch {
    return response;
  }
  const name = await clientName(url.searchParams.get("client_id") ?? "");
  const who =
    `<p class="client-id"><strong>${esc(name ?? "Невідомий застосунок")}</strong> – назву вказав сам застосунок, її ніхто не перевіряв.</p>` +
    `<p class="client-id">Після згоди доступ отримає <strong>${esc(host)}</strong>. Погоджуйтеся, лише якщо самі щойно підключали цей застосунок.</p>`;
  let html = await response.text();
  html = html.replace(/(<p class="client-id">[^<]*<\/p>)/, `$1${who}`);
  for (const scope of HIGH_RISK) {
    html = html.replace(`value="${esc(scope)}" checked>`, `value="${esc(scope)}">`);
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  return new Response(html, { status: response.status, headers });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (pathname === "/_emdash/oauth/authorize" && context.request.method === "GET") {
    return explainConsent(context.url, await next());
  }
  if (!pathname.startsWith("/_emdash/api/")) return next();

  const { request, locals } = context;
  const user = (locals as { user?: { role: number } }).user;
  const emdash = (locals as { emdash?: Emdash }).emdash;
  const role = user?.role ?? 0;
  const below = role < __NSV_PUBLISH_MIN_ROLE__;
  const method = request.method;

  if (pathname.startsWith("/_emdash/api/search") && !user) return notFound();
  if (/^\/_emdash\/api\/health\/?$/.test(pathname) && !user) {
    return Response.json({ success: true, data: { product: "emdash" } }, { headers: { "cache-control": "no-store" } });
  }

  if (!user || !emdash) return next();

  if (role < READ_DRAFTS) {
    if (pathname === "/_emdash/api/dashboard") return refuse("Огляд доступний редакторам.");
    if (/^\/_emdash\/api\/content\/[^/]+\/[^/]+\/terms\//.test(pathname)) return notFound();
  }

  /* The assistant is checked at every role: it never changes a scheduled
     entry, whoever's token it holds. */
  if (method === "POST" && pathname === "/_emdash/api/mcp") {
    const input = await body(request);
    for (const call of Array.isArray(input) ? input : input ? [input] : []) {
      const why = await mcpRefusal(emdash, call as Record<string, unknown>, below);
      if (why) return refuse(why);
    }
  }

  if (!below) return next();

  let m: RegExpMatchArray | null;
  if (method === "PUT" && (m = pathname.match(/^\/_emdash\/api\/content\/([^/]+)\/([^/]+)\/?$/))) {
    const input = await body(request);
    const why = input && (await contentUpdateRefusal(emdash, decodeURIComponent(m[1]), decodeURIComponent(m[2]), input, false));
    if (why) return refuse(why);
  }
  if (method === "POST" && (m = pathname.match(/^\/_emdash\/api\/revisions\/([^/]+)\/restore\/?$/))) {
    const rev = await emdash.handleRevisionGet(decodeURIComponent(m[1])).catch(() => null);
    const item = rev?.success ? rev.data?.item : undefined;
    if (item?.collection && item.entryId && (await entryStatus(emdash, item.collection, item.entryId)) === "scheduled") {
      return refuse("Запис заплановано на публікацію – відновити версію може лише адміністратор. Попросіть скасувати розклад.");
    }
  }
  if (
    (method === "PUT" && /^\/_emdash\/api\/media\/[^/]+\/replace\/?$/.test(pathname)) ||
    (method === "DELETE" && /^\/_emdash\/api\/media\/[^/]+\/?$/.test(pathname))
  ) {
    return refuse("Файл може бути на опублікованих сторінках – замінює й видаляє його лише адміністратор. Завантажте новий і попросіть опублікувати.");
  }
  return next();
});
