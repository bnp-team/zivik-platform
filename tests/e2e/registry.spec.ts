/**
 * The library (RegistryTable): filters narrow the rows, say so in the URL and
 * the count, and «Скинути» brings every proceeding back.
 */
import type { Page } from "@playwright/test";
import { registryCases } from "@/content/cases";
import { expect, hydrated, test } from "./fixtures";
import { LIVE } from "./env";
import { decisionSlugs, proceedingCount } from "./routes";

const rows = (page: Page) => page.locator(".reg-list .reg-drow");
const shown = (page: Page) => page.locator(".reg-count p[aria-live] b");

/** Rows in the list and the number the count line prints – which must agree. */
async function expectRows(page: Page, n: number) {
  await expect(rows(page)).toHaveCount(n);
  await expect(shown(page)).toHaveText(String(n));
}

async function openRegistry(page: Page, query = ""): Promise<number> {
  await page.goto(`/uk/registry${query}`);
  await hydrated(page);
  /* A deployed site's library is built from the CMS, so its size is whatever
     the editors have published; the local build's comes from src/content. */
  return LIVE ? Number(await shown(page).textContent()) : proceedingCount;
}

/** Under 640px the filters are folded behind one «Фільтри» control. */
async function showFilters(page: Page) {
  const fold = page.locator("button.reg-fbtn");
  if (await fold.isVisible()) {
    if ((await fold.getAttribute("aria-expanded")) !== "true") await fold.click();
    await expect(fold).toHaveAttribute("aria-expanded", "true");
  }
}

test("all proceedings are listed with no filter", async ({ page }) => {
  const total = await openRegistry(page);
  expect(total).toBeGreaterThan(decisionSlugs.length);
  await expectRows(page, total);
  await expect(page.locator(".reg-count .reg-reset")).toHaveCount(0);
});

test("a court filter narrows the list and «reset» restores it", async ({ page }) => {
  const total = await openRegistry(page);
  await showFilters(page);

  const courts = page.locator(".reg-fset .reg-lb").first();
  await courts.locator("button.reg-trig").click();
  const listbox = courts.getByRole("listbox");
  await expect(listbox).toBeVisible();

  /* The first real court (option 0 is «all courts»), with the count the
     option itself promises. */
  const option = listbox.getByRole("option").nth(1);
  const promised = Number(await option.locator(".oc").textContent());
  expect(promised).toBeGreaterThan(0);
  expect(promised).toBeLessThan(total);
  await option.click();
  await expect(option).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();

  await expectRows(page, promised);
  await expect(page).toHaveURL(/[?&]court=[^&]+/);
  await expect(page.locator(".reg-active .reg-chip")).toHaveCount(1);

  await page.locator(".reg-count .reg-reset").click();
  await expectRows(page, total);
  await expect(page).toHaveURL(/\/uk\/registry$/);
  await expect(page.locator(".reg-active .reg-chip")).toHaveCount(0);
});

test("a link with ?material=lit opens only the written-up decisions", async ({ page }) => {
  await openRegistry(page, "?material=lit");
  await expectRows(page, decisionSlugs.length);
  const hrefs = await rows(page).locator("a.reg-name").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.sort()).toEqual(decisionSlugs.map((s) => `/uk/cases/${s}`).sort());

  /* Removing the chip is the other way back. */
  await page.locator(".reg-active .reg-chip").click();
  await expect(rows(page)).not.toHaveCount(decisionSlugs.length);
  await expect(page).toHaveURL(/\/uk\/registry$/);
});

test("search finds a case by name; a query with no match offers a reset", async ({ page }) => {
  const total = await openRegistry(page);
  const slug = decisionSlugs[0];
  const entry = registryCases.find((c) => c.summarySlug === slug);
  expect(entry, `registry row for ${slug}`).toBeTruthy();
  const name = (entry!.nameUk || entry!.name).split(/\s+/).slice(0, 3).join(" ");

  const search = page.locator("#reg-q");
  await search.fill(name);
  await expect(page).toHaveURL(/[?&]q=/);
  await expect(rows(page).locator(`a.reg-name[href="/uk/cases/${slug}"]`)).toHaveCount(1);
  expect(await rows(page).count()).toBeLessThan(total);

  await search.fill("жжжщщщ-немає-такого");
  await expect(page.locator(".reg-empty")).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  await page.locator(".reg-empty .reg-reset").click();
  await expectRows(page, total);
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
});

test("a row opens its page", async ({ page }) => {
  await openRegistry(page);
  const link = rows(page).first().locator("a.reg-name");
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/uk\/cases\/[\w-]+$/);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.locator("h1")).toBeVisible();
});
