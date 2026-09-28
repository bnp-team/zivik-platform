/**
 * Every kind of public page, at both widths: it answers, it has its heading,
 * the browser raised no error (fixtures.ts), and nothing pushes the document
 * wider than the window. At the desktop width — the markup does not change
 * with it — also the basics a search engine and a citation manager read.
 */
import { META_MAX, META_MIN } from "@/lib/seo";
import { defaultLocale, localeHtmlLang } from "@/i18n/config";
import { expect, overflow, test } from "./fixtures";
import { LIVE, ORIGIN } from "./env";
import { routes, type Route } from "./routes";

/** `/uk/cases/x` → `/en/cases/x`. */
const inLocale = (path: string, locale: string) => path.replace(/^\/[a-z]{2}(?=\/|$)/, `/${locale}`);

/** Relaxed luminance of a computed `rgb(...)` colour, 0 (black) to 1 (white). */
function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? ["255", "255", "255"]).slice(0, 3).map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

async function checkSeo(page: import("@playwright/test").Page, route: Route) {
  const title = await page.title();
  expect(title.trim(), "<title>").not.toBe("");

  /* Canonical and hreflang carry the build's own origin (NEXT_PUBLIC_SITE_URL):
     on a deployed site that is the site; a local build has a placeholder, so
     there only the path is compared. */
  const abs = (p: string) => (LIVE ? `${ORIGIN}${p}` : p);
  const norm = (href: string | null) => {
    expect(href, "link href").toBeTruthy();
    const u = new URL(href!, ORIGIN);
    return LIVE ? `${u.origin}${u.pathname}` : u.pathname;
  };

  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical, "exactly one canonical").toHaveCount(1);
  expect(norm(await canonical.getAttribute("href")), "canonical").toBe(abs(route.path));

  for (const [lang, target] of [
    ["uk", inLocale(route.path, "uk")],
    ["en", inLocale(route.path, "en")],
    ["x-default", inLocale(route.path, defaultLocale)],
  ] as const) {
    const alt = page.locator(`link[rel="alternate"][hreflang="${lang}"]`);
    await expect(alt, `hreflang=${lang}`).toHaveCount(1);
    expect(norm(await alt.getAttribute("href")), `hreflang=${lang}`).toBe(abs(target));
  }

  const description = page.locator('meta[name="description"]');
  await expect(description, "exactly one meta description").toHaveCount(1);
  const text = ((await description.getAttribute("content")) ?? "").trim();
  expect(text.length, `meta description «${text}»`).toBeLessThanOrEqual(META_MAX);
  /* META_MIN is the floor the decision pages build their description to
     (src/app/[locale]/cases/[slug]/page.tsx); the other pages are written by
     hand and only have to say something. */
  expect(text.length, `meta description «${text}»`).toBeGreaterThanOrEqual(route.kind === "decision" ? META_MIN : 1);

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = new Set<string>();
  for (const raw of blocks) {
    let data: unknown;
    expect(() => (data = JSON.parse(raw)), `JSON-LD parses: ${raw.slice(0, 80)}…`).not.toThrow();
    const nodes = (data as { "@graph"?: unknown[] })["@graph"] ?? [data];
    for (const n of nodes as { "@type"?: string | string[] }[]) [n["@type"] ?? []].flat().forEach((t) => types.add(t));
  }
  if (route.kind === "decision") {
    expect([...types], "JSON-LD on a decision page").toEqual(expect.arrayContaining(["Article", "BreadcrumbList"]));
  }
}

/**
 * Defects the suite has found and that are not fixed yet, by path. Each is an
 * expected failure (`test.fail`) at the desktop width, where the SEO checks
 * run: the report lists it as such, and the day it is fixed the test "passes
 * unexpectedly" and fails the run until its line here is deleted. Nothing
 * else about the page is excused — every check before the failing one still
 * runs.
 */
const KNOWN_DEFECTS: Record<string, string> = {};

for (const route of routes) {
  test(`${route.path} (${route.kind})`, async ({ page }, testInfo) => {
    const defect = KNOWN_DEFECTS[route.path];
    test.fail(Boolean(defect) && testInfo.project.name === "desktop", defect);
    const response = await page.goto(route.path);
    expect(response?.status(), "HTTP status").toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", localeHtmlLang[route.locale]);

    const h1 = page.locator("h1");
    await expect(h1, "exactly one <h1>").toHaveCount(1);
    await expect(h1).toBeVisible();
    expect((await h1.innerText()).trim(), "<h1> text").not.toBe("");

    if (route.kind === "pending") {
      /* A proceeding without a summary is its own dark page (docs/DESIGN.md,
         «a case the light has not reached yet»), not a decision template
         with holes in it. */
      const pending = page.locator(".pendingpage");
      await expect(pending).toBeVisible();
      await expect(page.locator(".casepage")).toHaveCount(0);
      const ground = await pending.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(luminance(ground), `pending page ground ${ground}`).toBeLessThan(0.2);
    }
    if (route.kind === "decision") {
      await expect(page.locator(".casepage")).toBeVisible();
      await expect(page.locator(".pendingpage")).toHaveCount(0);
    }

    const o = await overflow(page);
    expect(o.scrollWidth, `document wider than the window: ${o.culprits.join("; ")}`).toBeLessThanOrEqual(o.innerWidth);

    if (testInfo.project.name === "desktop") await checkSeo(page, route);
  });
}
