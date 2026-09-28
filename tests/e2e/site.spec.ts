/**
 * The rest of what a reader meets: the map, a wrong address, and a blog that
 * is not there until there is something in it.
 */
import { expect, test } from "./fixtures";
import { LIVE } from "./env";
import { blogIn, locales } from "./routes";

/* A 404 document logs its own status in the console; that one is expected. */
const notFoundConsole = [/status of 404/];

test("map page draws the map", async ({ page }) => {
  await page.goto("/uk/map");
  const svg = page.locator("svg.emap-svg");
  await expect(svg).toBeVisible();
  /* `img` where the pointer is coarse, `group` where its seats are controls (EventsMap.tsx). */
  await expect(svg).toHaveAttribute("role", /^(img|group)$/);
  await expect(svg).toHaveAttribute("aria-label", /\S/);
  expect(await svg.locator("path").count(), "country outlines").toBeGreaterThan(10);
  const box = await svg.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(300);
  expect(box?.height ?? 0).toBeGreaterThan(100);
});

test.describe("unknown address", () => {
  test.use({ consoleAllow: notFoundConsole });

  test("/uk/nope shows the 404 page", async ({ page }) => {
    const res = await page.goto("/uk/nope");
    /* The status is the Worker's (or the asset server's) to give; the local
       static server's 404 would only test itself. */
    if (LIVE) expect(res?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toContainText("404");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    /* A way on: the library and the home page. */
    await expect(page.locator('main a[href="/uk/registry"]')).toBeVisible();
    await expect(page.locator('main a[href="/uk"]')).toBeVisible();
  });
});

for (const locale of locales) {
  test.describe(`blog (${locale})`, () => {
    test.use({ consoleAllow: notFoundConsole });

    test(`/${locale}/blog exists exactly when the menu offers «Блог»`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const navBlog = page.locator(`#nsv-mobnav a[href="/${locale}/blog"], nav.nsv-nav a[href="/${locale}/blog"]`);
      const inNav = (await navBlog.count()) > 0;
      /* The local build is made from src/content, so the files decide; a
         deployed site may have posts from the CMS, so there the menu and the
         page only have to agree with each other. */
      if (!LIVE) expect(inNav, "«Блог» in the menu").toBe(blogIn(locale));

      const res = await page.goto(`/${locale}/blog`);
      if (inNav) {
        expect(res?.status()).toBe(200);
        await expect(page.locator("h1")).toBeVisible();
      } else {
        if (LIVE) expect(res?.status()).toBe(404);
        await expect(page.locator("main")).toContainText("404");
      }
    });
  });
}
