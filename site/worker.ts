import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";
import { defaultLocale, isLocale } from "../src/i18n/config";
import { COLLECTIONS } from "./content/collections";
import { requestRebuild } from "./emdash/deploy-hook";

declare const __NSV_SNAPSHOT_PULLED_AT__: string | null;
declare const __NSV_STAGING__: boolean;

export { PluginBridge };

/**
 * What reaches the Worker: the EmDash admin and its API, `/`, and 404s. The
 * public pages are static assets and never get here.
 *
 * The cron also retries a publish whose rebuild was lost – see
 * `retryMissedPublish`.
 *
 * Four things are settled before EmDash sees the request (the fourth, the
 * health probe's version, is below with its reason):
 *
 *   - `/` → `/uk` or `/en` by Accept-Language. Through EmDash it cost a setup
 *     probe and seven more D1 queries (~660 ms) to answer every visitor who
 *     types the bare domain. It is the same rule site/pages/index.ts states.
 *   - `/_emdash/api/search*` without a session is a 404. EmDash makes search
 *     public for sites that render from D1 at request time; this one searches
 *     a static index, so the endpoint served nobody but could make anyone's
 *     request cost 8–11 s of Worker time and D1 reads. The admin, which does
 *     use it, always carries the session cookie.
 *   - HSTS on everything the Worker answers. `_headers` covers the static
 *     files only; on a custom domain nothing else would add it to the admin.
 *   - The admin's pages get /admin-guide.js, the step-by-step tour for a
 *     first-time editor (public/admin-guide.js). EmDash's admin is a built
 *     app we do not fork; the tour sits on top of it. Its CSP allows scripts
 *     from 'self', and the file is a static asset.
 *   - A POST to `/_emdash/api/auth/*` is capped at 10 a minute per address
 *     (AUTH_LIMIT in wrangler.jsonc), then 429. Sign-in sends a magic-link
 *     email: unlimited, a stranger could spend the Resend quota and lock the
 *     editors out, or walk through invite and passkey endpoints at leisure.
 *     The zone's one rate-limit rule belongs to the shared bnp.works demos.
 *   - `X-Robots-Tag: noindex` on the admin, and no `Server-Timing` anywhere.
 *     The login page had neither a robots tag nor a header, so a crawler that
 *     ignores robots.txt could list it; and EmDash's Server-Timing told any
 *     visitor how long each D1 step took – a free map of the runtime.
 */
const HSTS = "max-age=63072000; includeSubDomains";

/* The reader's preferred site language, by the weights they sent: `uk;q=0,
   en;q=1` is English, not Ukrainian because it came first. A weight of 0
   means «not this one». Ties keep the reader's order. */
function preferredLocale(header: string): string {
  let best: { locale: string; q: number } | null = null;
  for (const part of header.split(",")) {
    const [range, ...params] = part.split(";");
    const tag = range.trim().slice(0, 2).toLowerCase();
    if (!isLocale(tag)) continue;
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (!(q > 0)) continue;
    if (!best || q > best.q) best = { locale: tag, q };
  }
  return best?.locale ?? defaultLocale;
}

function localeRedirect(request: Request): Response {
  const locale = preferredLocale(request.headers.get("accept-language") ?? "");
  return new Response(null, {
    status: 307,
    headers: {
      location: `/${locale}`,
      /* The answer depends on the reader's language: no shared cache may
         hand one reader's redirect to the next. */
      vary: "Accept-Language",
      "cache-control": "private, no-store",
      "strict-transport-security": HSTS,
    },
  });
}

const emdashScheduled = createScheduledHandler();

/**
 * A publish whose rebuild never happened, retried once.
 *
 * The publish plugin calls the deploy hook and logs the outcome, and that is
 * all it can do: if the call is lost – a network error, a 5xx, a secret that
 * was being replaced at that moment – the entry reads «Опубліковано» and the
 * site never changes. This cron already runs every five minutes for EmDash's
 * own scheduled publishing, so it also compares the newest live revision in D1
 * with the moment this deployment's snapshot was taken. A publish newer than
 * the snapshot and 10–15 minutes old means no build picked it up; one cron
 * tick falls in that window, so the hook is called once – never in a loop, so
 * a publish that fails the build does not start a build every five minutes.
 */
async function retryMissedPublish(env: { DB: D1Database }) {
  const pulledAt = __NSV_SNAPSHOT_PULLED_AT__;
  if (!pulledAt) return;
  let latest: string | null = null;
  try {
    /* Only the tables that exist: a collection added after the seed (the
       blog) has none until its schema is created. */
    const { results } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'ec_%'",
    ).all<{ name: string }>();
    const present = new Set(results.map((r) => r.name));
    /* One query per collection in a batch: a single UNION ALL over all of
       them is more compound terms than D1 allows ("too many terms in
       compound SELECT"), and the cron failed on it every five minutes. */
    const queries = COLLECTIONS.filter((c) => present.has(`ec_${c.slug}`)).map((c) =>
      env.DB.prepare(
        `SELECT MAX(r.created_at) AS t FROM revisions r JOIN "ec_${c.slug}" e ON e.live_revision_id = r.id ` +
          "WHERE e.status = 'published' AND e.deleted_at IS NULL",
      ),
    );
    if (!queries.length) return;
    const times = (await env.DB.batch<{ t: string | null }>(queries))
      .map((r) => r.results[0]?.t)
      .filter((t): t is string => typeof t === "string");
    latest = times.length ? times.reduce((a, b) => (a > b ? a : b)) : null;
  } catch (error) {
    console.error(`[rebuild-retry] could not read D1: ${error instanceof Error ? error.message : error}`);
    return;
  }
  if (!latest) return;
  // SQLite's datetime('now') text is UTC without a zone marker.
  const published = Date.parse(latest.includes("T") ? latest : `${latest.replace(" ", "T")}Z`);
  const age = Date.now() - published;
  if (published <= Date.parse(pulledAt)) return;
  if (age < 10 * 60_000 || age >= 15 * 60_000) return;
  await requestRebuild(`retry: published ${latest} UTC, deployed snapshot ${pulledAt}`, {
    info: (m) => console.log(`[rebuild-retry] ${m}`),
    error: (m) => console.error(`[rebuild-retry] ${m}`),
  });
}

/* A cheap first filter only: it saves the Worker from waking EmDash for a
   visitor with no cookie at all. A cookie of any value passes it, so the
   decision – a signed-in user – is made again in site/middleware.ts, after
   EmDash has resolved the session. */
const hasSession = (request: Request) =>
  /(?:^|;\s*)astro-session=/.test(request.headers.get("cookie") ?? "");

/* The path EmDash routes on: Astro decodes it and folds `//` before matching,
   so `/_emdash/api/%73earch` and `//_emdash/api/search` are search too. */
function routedPath(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURI(pathname);
  } catch {
    /* a malformed escape is routed as it stands */
  }
  return path.replace(/\/{2,}/g, "/");
}

export default {
  ...handler,
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/") return localeRedirect(request);
    /* Search Console ownership file. Served here, not from public/: the
       static layer drops ".html" with a 307, and Google will not follow it. */
    if (pathname === "/googlecbc3798074ebaa75.html") {
      return new Response("google-site-verification: googlecbc3798074ebaa75.html", {
        headers: { "content-type": "text/html; charset=utf-8", "strict-transport-security": HSTS },
      });
    }
    const routed = routedPath(pathname);
    if (routed.startsWith("/_emdash/api/search") && !hasSession(request)) {
      return new Response("Not found", { status: 404, headers: { "strict-transport-security": HSTS } });
    }
    /* The health probe answers anyone, and EmDash's answer names its exact
       version – a free lookup against the next advisory. A monitor needs to
       know it is up, not which release; the admin, with its session, still
       gets the full reply. */
    if (/^\/_emdash\/api\/health\/?$/.test(routed) && !hasSession(request)) {
      return Response.json(
        { success: true, data: { product: "emdash" } },
        { headers: { "cache-control": "no-store", "strict-transport-security": HSTS } },
      );
    }
    if (request.method === "POST" && routed.startsWith("/_emdash/api/auth/")) {
      const limiter = (env as unknown as { AUTH_LIMIT?: RateLimit }).AUTH_LIMIT;
      const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
      const { success } = (await limiter?.limit({ key: `${new URL(request.url).host}|${ip}` })) ?? { success: true };
      if (!success) {
        return Response.json(
          { error: { code: "RATE_LIMITED", message: "Забагато спроб. Спробуйте за хвилину." } },
          { status: 429, headers: { "retry-after": "60", "cache-control": "no-store", "strict-transport-security": HSTS } },
        );
      }
    }
    let response = await handler.fetch!(request, env, ctx);
    if (response.status === 101) return response;
    /* A missing /en/… page answers in English (site/pages/[locale]/404.astro);
       the default 404 is Ukrainian. Still a 404 – only the text changes. */
    if (response.status === 404 && /^\/en(\/|$)/.test(routed) && response.headers.get("content-type")?.startsWith("text/html")) {
      const assets = (env as unknown as { ASSETS?: Fetcher }).ASSETS;
      const en = await assets?.fetch(new URL("/en/404", request.url)).catch(() => null);
      if (en?.ok) response = new Response(en.body, { status: 404, headers: en.headers });
    }
    const out = new Response(response.body, response);
    if (!out.headers.has("strict-transport-security")) out.headers.set("strict-transport-security", HSTS);
    out.headers.delete("server-timing");
    if (pathname.startsWith("/_emdash/")) out.headers.set("x-robots-tag", "noindex, nofollow");
    if (pathname.startsWith("/_emdash/admin") && out.headers.get("content-type")?.startsWith("text/html")) {
      return new HTMLRewriter()
        .on("head", {
          element(head) {
            head.append('<script src="/admin-guide.js" defer></script><script src="/admin-tweaks.js" defer></script>', {
              html: true,
            });
          },
        })
        .transform(out);
    }
    return out;
  },
  async scheduled(controller, env, ctx) {
    /* Scheduled publishing and cleanup belong to production alone. */
    if (__NSV_STAGING__) return;
    await emdashScheduled(controller, env, ctx);
    ctx.waitUntil(retryMissedPublish(env as unknown as { DB: D1Database }));
  },
} satisfies ExportedHandler;
