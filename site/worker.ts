import handler, { createScheduledHandler, PluginBridge } from "@emdash-cms/cloudflare/worker";
import { defaultLocale, isLocale } from "../src/i18n/config";
import { COLLECTIONS } from "./content/collections";
import { requestRebuild } from "./emdash/deploy-hook";

declare const __NSV_SNAPSHOT_PULLED_AT__: string | null;

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
 *   - `X-Robots-Tag: noindex` on the admin, and no `Server-Timing` anywhere.
 *     The login page had neither a robots tag nor a header, so a crawler that
 *     ignores robots.txt could list it; and EmDash's Server-Timing told any
 *     visitor how long each D1 step took – a free map of the runtime.
 */
const HSTS = "max-age=63072000; includeSubDomains";

function localeRedirect(request: Request): Response {
  let locale: string = defaultLocale;
  for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
    const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) {
      locale = tag;
      break;
    }
  }
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
    const live = COLLECTIONS.filter((c) => present.has(`ec_${c.slug}`))
      .map((c) => `SELECT live_revision_id AS id FROM "ec_${c.slug}" WHERE status = 'published' AND deleted_at IS NULL`)
      .join(" UNION ALL ");
    if (!live) return;
    const row = await env.DB.prepare(
      `SELECT MAX(created_at) AS t FROM revisions WHERE id IN (${live})`,
    ).first<{ t: string | null }>();
    latest = row?.t ?? null;
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

const hasSession = (request: Request) =>
  /(?:^|;\s*)astro-session=/.test(request.headers.get("cookie") ?? "");

export default {
  ...handler,
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === "/") return localeRedirect(request);
    if (pathname.startsWith("/_emdash/api/search") && !hasSession(request)) {
      return new Response("Not found", { status: 404, headers: { "strict-transport-security": HSTS } });
    }
    /* The health probe answers anyone, and EmDash's answer names its exact
       version – a free lookup against the next advisory. A monitor needs to
       know it is up, not which release; the admin, with its session, still
       gets the full reply. */
    if (pathname === "/_emdash/api/health" && !hasSession(request)) {
      return Response.json(
        { success: true, data: { product: "emdash" } },
        { headers: { "cache-control": "no-store", "strict-transport-security": HSTS } },
      );
    }
    const response = await handler.fetch!(request, env, ctx);
    if (response.status === 101) return response;
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
    await emdashScheduled(controller, env, ctx);
    ctx.waitUntil(retryMissedPublish(env as unknown as { DB: D1Database }));
  },
} satisfies ExportedHandler;
