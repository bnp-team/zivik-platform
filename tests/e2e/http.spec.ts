/**
 * What the deployed site answers before any page is drawn: the Worker's
 * redirect and admin, the headers, and the files crawlers read. Read-only
 * GETs against public URLs – no sign-in, no cookies, nothing written.
 *
 * Skipped against the local build: none of this is in dist/client's HTML, and
 * the local static server does not pretend to be the Worker (serve.mjs).
 */
import type { APIResponse } from "@playwright/test";
import { expect, test } from "./fixtures";
import { LIVE, LIVE_ONLY, ORIGIN } from "./env";

test.skip(!LIVE, LIVE_ONLY);

const get = (request: import("@playwright/test").APIRequestContext, path: string, headers: Record<string, string> = {}) =>
  request.get(path, { maxRedirects: 0, headers, failOnStatusCode: false });

const header = (res: APIResponse, name: string) => res.headers()[name.toLowerCase()] ?? "";

test("/ redirects by Accept-Language (307, Vary: Accept-Language)", async ({ request }) => {
  for (const [accept, target] of [
    ["uk-UA,uk;q=0.9,en;q=0.8", "/uk"],
    ["en-GB,en;q=0.9", "/en"],
    ["de-DE,de;q=0.9", "/uk"],
  ] as const) {
    const res = await get(request, "/", { "accept-language": accept });
    expect(res.status(), `/ for ${accept}`).toBe(307);
    expect(new URL(header(res, "location"), ORIGIN).pathname, `Location for ${accept}`).toBe(target);
    expect(header(res, "vary").toLowerCase()).toContain("accept-language");
    /* One reader's language must not be cached for the next. */
    expect(header(res, "cache-control")).toMatch(/private|no-store/);
  }
});

test("security headers on a public page", async ({ request }) => {
  const res = await get(request, "/uk");
  expect(res.status()).toBe(200);
  const csp = header(res, "content-security-policy");
  expect(csp, "Content-Security-Policy").toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toMatch(/frame-ancestors '(self|none)'/);
  const hsts = header(res, "strict-transport-security");
  expect(Number(hsts.match(/max-age=(\d+)/)?.[1] ?? 0), `HSTS «${hsts}»`).toBeGreaterThanOrEqual(31_536_000);
  expect(header(res, "x-content-type-options")).toBe("nosniff");
  expect(header(res, "referrer-policy"), "Referrer-Policy").toBe("strict-origin-when-cross-origin");
});

test("robots.txt keeps crawlers out of the admin and blocks CCBot", async ({ request }) => {
  const res = await get(request, "/robots.txt");
  expect(res.status()).toBe(200);
  expect(header(res, "content-type")).toContain("text/plain");

  /* Groups: consecutive User-Agent lines, then their rules. */
  const groups: { agents: string[]; disallow: string[] }[] = [];
  let open = false;
  for (const raw of (await res.text()).split("\n")) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (/^user-agent$/i.test(key)) {
      if (!open) groups.push({ agents: [], disallow: [] });
      groups.at(-1)!.agents.push(value.toLowerCase());
      open = true;
    } else {
      open = false;
      if (/^disallow$/i.test(key) && groups.length) groups.at(-1)!.disallow.push(value);
    }
  }
  const rulesFor = (agent: string) => groups.find((g) => g.agents.includes(agent.toLowerCase()))?.disallow ?? [];
  expect(rulesFor("*"), "User-Agent: *").toContain("/_emdash/");
  expect(rulesFor("CCBot"), "User-Agent: CCBot").toContain("/");
});

test("sitemap.xml parses, and indexing is either fully on or fully off", async ({ request, page }) => {
  const res = await get(request, "/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(header(res, "content-type")).toMatch(/xml/);
  const xml = await res.text();
  const parsed = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) return null;
    return {
      root: doc.documentElement.localName,
      locs: [...doc.getElementsByTagNameNS("*", "loc")].map((e) => (e.textContent ?? "").trim()),
    };
  }, xml);
  expect(parsed, "sitemap.xml is well-formed XML").not.toBeNull();
  expect(parsed!.root).toBe("urlset");
  for (const loc of parsed!.locs) expect(loc.startsWith(`${ORIGIN}/`), `sitemap <loc> ${loc}`).toBe(true);

  /* The site is closed to search engines until launch (src/lib/seo.ts,
     SITE_INDEXABLE): an empty sitemap and noindex on every page. Half of that
     – a sitemap full of pages that say noindex, or indexable pages with no
     sitemap – is a misconfigured launch, whichever half it is. */
  const indexable = parsed!.locs.length > 0;
  const home = await get(request, "/uk");
  expect(header(home, "x-robots-tag").includes("noindex"), "X-Robots-Tag noindex on /uk").toBe(!indexable);
  const meta = (await home.text()).match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";
  expect(meta.includes("noindex"), '<meta name="robots"> noindex on /uk').toBe(!indexable);
});

test("security.txt names a contact and has not expired", async ({ request }) => {
  const res = await get(request, "/.well-known/security.txt");
  expect(res.status()).toBe(200);
  expect(header(res, "content-type")).toContain("text/plain");
  const text = await res.text();
  expect(text).toMatch(/^Contact:\s*(mailto:|https:)\S+/m);
  const expires = text.match(/^Expires:\s*(\S+)/m)?.[1];
  expect(expires, "Expires field").toBeTruthy();
  const when = Date.parse(expires!);
  expect(Number.isNaN(when), `Expires «${expires}» is a date`).toBe(false);
  expect(when, `Expires ${expires} is in the future (renew it yearly, docs/LAUNCH.md)`).toBeGreaterThan(Date.now());
});

test("favicon.ico is an image", async ({ request }) => {
  const res = await get(request, "/favicon.ico");
  expect(res.status()).toBe(200);
  expect(header(res, "content-type")).toMatch(/^image\//);
  expect((await res.body()).length).toBeGreaterThan(0);
});

test("admin sign-in: not indexed, carries the editor's guide", async ({ request }) => {
  const res = await get(request, "/_emdash/admin/login");
  expect(res.status()).toBe(200);
  expect(header(res, "x-robots-tag")).toContain("noindex");
  expect(header(res, "server-timing"), "no Server-Timing map of the runtime").toBe("");
  const html = await res.text();
  expect(html).toContain('src="/admin-guide.js"');
  expect(html).toContain('src="/admin-tweaks.js"');

  for (const file of ["/admin-guide.js", "/admin-tweaks.js"]) {
    const script = await get(request, file);
    expect(script.status(), file).toBe(200);
    expect(header(script, "content-type"), file).toMatch(/javascript/);
  }
});

test("admin search API without a session is a 404", async ({ request }) => {
  const res = await get(request, "/_emdash/api/search?q=test");
  expect(res.status()).toBe(404);
});

test("health probe answers without naming a version", async ({ request }) => {
  const res = await get(request, "/_emdash/api/health");
  expect(res.status()).toBe(200);
  const text = await res.text();
  const body = JSON.parse(text) as unknown;
  const keys: string[] = [];
  const walk = (v: unknown) => {
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        keys.push(k);
        walk(x);
      }
    }
  };
  walk(body);
  expect(keys.filter((k) => /version/i.test(k)), "version fields").toEqual([]);
  expect(text, "no x.y.z version string").not.toMatch(/\d+\.\d+\.\d+/);
});
