/**
 * «Аналітика» в адмінці: Cloudflare Web Analytics і хітмапи PostHog на одній
 * сторінці, українською, для людей без доступу до жодного з кабінетів.
 *
 * Сторінку малює ./admin.tsx; цифри дає маршрут цього плагіна
 * (`/_emdash/api/plugins/nsv-analytics/summary?days=30`). Ключі обох API –
 * секрети Worker-а, лише на читання, і до браузера не потрапляють:
 *   CF_ANALYTICS_API_TOKEN    – Cloudflare, Account Analytics: Read (botsDev);
 *   POSTHOG_PERSONAL_API_KEY  – PostHog, Query: Read (проєкт НаСвітло).
 * Без ключа відповідний розділ сторінки пише, що він не підключений.
 *
 * Відповідь кешується на годину (Cache API): статистика не змінюється
 * щохвилини, а обидва API мають ліміти запитів.
 */
import { definePlugin, type PluginContext } from "emdash";
import { env } from "cloudflare:workers";

const CF_ACCOUNT = "5f1d89c39916440b30eed21bc37c1efd";
/** Сайт у Cloudflare Web Analytics (botsDev → Web analytics → nasvitlo.ucu.edu.ua). */
const CF_SITE_TAG_DEFAULT = "51fa88a41ac945fcb21512f80cc4bce6";
const POSTHOG_PROJECT = "298314";
const POSTHOG_API = "https://eu.posthog.com";
const SITE = "https://nasvitlo.ucu.edu.ua";
const CACHE_SECONDS = 3600;

type Vars = Record<string, string | undefined>;
type Row = { label: string; value: number };
type Section<T> = { ok: true; data: T } | { ok: false; reason: string };

/* ── Cloudflare Web Analytics (GraphQL, набір rumPageloadEventsAdaptiveGroups) ── */

type Group = { count: number; sum?: { visits?: number }; dimensions?: Record<string, string> };

async function cfQuery(token: string, siteTag: string, start: string, end: string) {
  const filter = `{ AND: [{ siteTag: $site }, { datetime_geq: $start }, { datetime_lt: $end }, { bot: 0 }] }`;
  const group = (alias: string, dim: string | null, limit: number, order = "count_DESC") =>
    `${alias}: rumPageloadEventsAdaptiveGroups(limit: ${limit}, filter: ${filter}${dim ? `, orderBy: [${order}]` : ""}) { count sum { visits }${dim ? ` dimensions { ${dim} }` : ""} }`;
  const query = `query($account: string!, $site: string!, $start: Time!, $end: Time!) {
    viewer { accounts(filter: { accountTag: $account }) {
      ${group("total", null, 1)}
      ${group("pages", "requestPath", 15)}
      ${group("referers", "refererHost", 10)}
      ${group("countries", "countryName", 10)}
      ${group("devices", "deviceType", 5)}
      ${group("days", "date", 100, "date_ASC")}
    } } }`;
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { account: CF_ACCOUNT, site: siteTag, start, end } }),
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { viewer?: { accounts?: Record<string, Group[]>[] } };
    errors?: { message: string }[] | null;
  } | null;
  if (!res.ok || body?.errors?.length) {
    throw new Error(`Cloudflare ${res.status}: ${body?.errors?.map((e) => e.message).join("; ") ?? "немає відповіді"}`);
  }
  return body?.data?.viewer?.accounts?.[0] ?? {};
}

const rows = (groups: Group[] | undefined, dim: string, by: "count" | "visits" = "count"): Row[] =>
  (groups ?? []).map((g) => ({
    label: g.dimensions?.[dim] || "—",
    value: by === "visits" ? (g.sum?.visits ?? 0) : g.count,
  }));

async function cloudflare(vars: Vars, days: number) {
  const token = vars.CF_ANALYTICS_API_TOKEN?.trim();
  if (!token) return { ok: false as const, reason: "Не підключено: немає секрету CF_ANALYTICS_API_TOKEN." };
  const siteTag = vars.CF_ANALYTICS_SITE_TAG?.trim() || CF_SITE_TAG_DEFAULT;
  const now = Date.now();
  const span = days * 86_400_000;
  const iso = (t: number) => new Date(t).toISOString();
  const [cur, prev] = await Promise.all([
    cfQuery(token, siteTag, iso(now - span), iso(now)),
    cfQuery(token, siteTag, iso(now - 2 * span), iso(now - span)),
  ]);
  const total = (a: Record<string, Group[]>) => ({ views: a.total?.[0]?.count ?? 0, visits: a.total?.[0]?.sum?.visits ?? 0 });
  return {
    ok: true as const,
    data: {
      current: total(cur),
      previous: total(prev),
      /* Без адмінки, і без переходів зі сторінки на сторінку сайту – ті
         не «звідки прийшли». */
      pages: rows(cur.pages, "requestPath").filter((r) => !r.label.startsWith("/_emdash")),
      referers: rows(cur.referers, "refererHost", "visits").filter((r) => r.label !== new URL(SITE).host),
      countries: rows(cur.countries, "countryName", "visits"),
      devices: rows(cur.devices, "deviceType", "visits"),
      days: rows(cur.days, "date", "visits"),
    },
  };
}

/* ── PostHog (HogQL) ── */

async function hogql(key: string, query: string): Promise<unknown[][]> {
  const res = await fetch(`${POSTHOG_API}/api/projects/${POSTHOG_PROJECT}/query/`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  const body = (await res.json().catch(() => null)) as { results?: unknown[][]; detail?: string } | null;
  if (!res.ok) throw new Error(`PostHog ${res.status}: ${body?.detail ?? "немає відповіді"}`);
  return body?.results ?? [];
}

async function posthog(vars: Vars, days: number) {
  const key = vars.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!key) return { ok: false as const, reason: "Не підключено: немає секрету POSTHOG_PERSONAL_API_KEY." };
  const since = `timestamp >= now() - toIntervalDay(${days})`;
  const [clicks, scroll] = await Promise.all([
    hogql(
      key,
      `SELECT properties.$pathname AS path, count() AS n FROM events
       WHERE event = '$autocapture' AND ${since} GROUP BY path ORDER BY n DESC LIMIT 10`,
    ),
    hogql(
      key,
      `SELECT properties.$prev_pageview_pathname AS path,
              round(avg(toFloat(properties.$prev_pageview_max_scroll_percentage)) * 100) AS depth,
              count() AS n
       FROM events
       WHERE event = '$pageleave' AND ${since} AND properties.$prev_pageview_max_scroll_percentage IS NOT NULL
       GROUP BY path HAVING n >= 3 ORDER BY n DESC LIMIT 10`,
    ),
  ]);
  return {
    ok: true as const,
    data: {
      clicks: clicks.map(([path, n]) => ({ label: String(path ?? "—"), value: Number(n) })),
      scroll: scroll.map(([path, depth, n]) => ({ label: String(path ?? "—"), value: Number(depth), views: Number(n) })),
      heatmapsUrl: `${POSTHOG_API}/project/${POSTHOG_PROJECT}/heatmaps`,
      site: SITE,
    },
  };
}

/* ── Назви сторінок замість адрес ── */

const FIXED: Record<string, string> = {
  "": "Головна",
  about: "Про проєкт",
  registry: "Реєстр",
  map: "Мапа",
  team: "Команда",
  blog: "Блог",
  privacy: "Політика конфіденційності",
  terms: "Умови користування",
};

async function titles(ctx: PluginContext): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [lang, name] of [["uk", "UA"], ["en", "EN"]] as const) {
    for (const [slug, label] of Object.entries(FIXED)) out[`/${lang}${slug ? `/${slug}` : ""}`] = `${label} (${name})`;
  }
  for (const [collection, base] of [["summaries", "cases"], ["posts", "blog"]] as const) {
    try {
      const page = await ctx.content?.list(collection, { limit: 200 });
      for (const item of page?.items ?? []) {
        const d = item.data as Record<string, unknown>;
        const label = String(d.list_label ?? d.title_uk ?? item.slug ?? "");
        if (!item.slug || !label) continue;
        out[`/uk/${base}/${item.slug}`] = `${label} (UA)`;
        out[`/en/${base}/${item.slug}`] = `${label} (EN)`;
      }
    } catch {
      /* без назв – покажемо адреси */
    }
  }
  return out;
}

const why = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function summary(ctx: PluginContext & { request: Request }) {
  const days = [7, 30, 90].includes(Number(new URL(ctx.request.url).searchParams.get("days")))
    ? Number(new URL(ctx.request.url).searchParams.get("days"))
    : 30;
  const cacheKey = new Request(`${SITE}/__nsv-analytics/v3/summary?days=${days}`);
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const hit = await cache?.match(cacheKey).catch(() => undefined);
  if (hit) return hit.json();

  const vars = env as unknown as Vars;
  const settle = async <T,>(job: () => Promise<Section<T>>): Promise<Section<T>> => {
    try {
      return await job();
    } catch (error) {
      ctx.log.error(`analytics: ${why(error)}`);
      return { ok: false, reason: why(error) };
    }
  };
  const [cf, ph, names] = await Promise.all([
    settle(() => cloudflare(vars, days)),
    settle(() => posthog(vars, days)),
    titles(ctx),
  ]);
  const result = { days, generatedAt: new Date().toISOString(), titles: names, cloudflare: cf, posthog: ph };
  /* Лише повна відповідь: помилку (новий ключ, збій API) не тримати годину. */
  if (cf.ok && ph.ok) {
    await cache
      ?.put(cacheKey, new Response(JSON.stringify(result), { headers: { "cache-control": `max-age=${CACHE_SECONDS}` } }))
      .catch(() => undefined);
  }
  return result;
}

export function createPlugin() {
  return definePlugin({
    id: "nsv-analytics",
    version: "1.0.0",
    capabilities: ["content:read"],
    routes: {
      summary: {
        permission: "content:read",
        handler: async (ctx) => summary(ctx),
      },
    },
  });
}

export default createPlugin;
