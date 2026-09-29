/**
 * The bar on every page: where its links go, the burger that replaces them
 * under 1080px, and the language switch.
 */
import type { Page } from "@playwright/test";
import { expect, hydrated, test } from "./fixtures";
import { blogIn, decisionSlugs, locales, pendingSample } from "./routes";

const isMobile = (name: string) => name === "mobile";

const burger = (page: Page) => page.locator("button.nsv-burger");
const drawer = (page: Page) => page.locator("#nsv-mobnav");

async function openDrawer(page: Page) {
  await hydrated(page);
  await burger(page).click();
  await expect(drawer(page)).toHaveAttribute("data-open", "yes");
  await expect(burger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(drawer(page)).toBeVisible();
}

for (const locale of locales) {
  test(`nav links resolve (${locale})`, async ({ page }, testInfo) => {
    await page.goto(`/${locale}/about`);
    if (isMobile(testInfo.project.name)) await openDrawer(page);
    const nav = isMobile(testInfo.project.name) ? drawer(page) : page.locator("nav.nsv-nav");
    await expect(nav).toBeVisible();

    const hrefs = await nav.locator(":scope > a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    const expected = [`/${locale}`, `/${locale}/about`, `/${locale}/registry`, `/${locale}/map`, `/${locale}/team`];
    if (blogIn(locale)) expected.push(`/${locale}/blog`);
    expect(hrefs).toEqual(expected);

    for (const href of hrefs) {
      const res = await page.request.get(href);
      expect(res.status(), `${href}`).toBe(200);
    }
    /* The page being read is marked as such in the bar. */
    if (!isMobile(testInfo.project.name)) {
      await expect(nav.locator(`a[href="/${locale}/about"]`)).toHaveAttribute("aria-current", "page");
    }
  });
}

test("burger opens and closes the menu; Escape closes it", async ({ page }, testInfo) => {
  await page.goto("/uk/registry");
  if (!isMobile(testInfo.project.name)) {
    /* 1366px: the full nav is in the bar and the burger is not offered. */
    await expect(page.locator("nav.nsv-nav")).toBeVisible();
    await expect(burger(page)).toBeHidden();
    await expect(drawer(page)).toBeHidden();
    return;
  }
  await expect(page.locator("nav.nsv-nav")).toBeHidden();
  await expect(burger(page)).toBeVisible();
  await expect(drawer(page)).toBeHidden();

  await openDrawer(page);
  await burger(page).click();
  await expect(drawer(page)).toHaveAttribute("data-open", "no");
  await expect(drawer(page)).toBeHidden();
  await expect(burger(page)).toHaveAttribute("aria-expanded", "false");

  await openDrawer(page);
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toBeHidden();
  /* Focus goes back to the control that opened the menu, not to <body>. */
  await expect(burger(page)).toBeFocused();

  /* Following an item closes the menu and goes there. */
  await openDrawer(page);
  await drawer(page).locator('a[href="/uk/team"]').click();
  await expect(page).toHaveURL(/\/uk\/team$/);
  await expect(drawer(page)).toBeHidden();
});

test("burger works on a page without React (the header-only script)", async ({ page }, testInfo) => {
  test.skip(!isMobile(testInfo.project.name), "the burger is shown under 1080px only");
  /* /about hydrates nothing but the bar, so it runs site/islands/header.ts
     instead of React – the same control, a different implementation. */
  await page.goto("/uk/about");
  await openDrawer(page);
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toBeHidden();
  await expect(burger(page)).toBeFocused();
});

/* The same page in the other language, not the other language's home page. */
const switchPaths = [
  "/registry",
  "/about",
  `/cases/${decisionSlugs[0]}`,
  ...(pendingSample.length ? [`/cases/${pendingSample[0]}`] : []),
];

for (const path of switchPaths) {
  test(`language switch keeps the page: ${path}`, async ({ page }, testInfo) => {
    await page.goto(`/uk${path}`);
    if (isMobile(testInfo.project.name)) await openDrawer(page);
    await page.locator('.nsv-langsw a[hreflang="en"]:visible').click();
    await expect(page).toHaveURL(new RegExp(`/en${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    /* `lang` is in the HTML, so it is true before the stylesheet has arrived;
       until then the mobile drawer is not hidden yet and `:visible` finds two
       switches. Wait for `load`, which waits for the stylesheets. */
    await page.waitForLoadState("load");

    if (isMobile(testInfo.project.name)) await openDrawer(page);
    await page.locator('.nsv-langsw a[hreflang="uk"]:visible').click();
    await expect(page).toHaveURL(new RegExp(`/uk${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  });
}
