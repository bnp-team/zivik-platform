/**
 * A decision page, the archive's reason to exist: its contents lead
 * somewhere, the chronology is there, and the judgment itself is one click
 * away.
 */
import { SUMMARIES } from "@/content/summaries";
import { pick } from "@/content/types";
import { expect, test } from "./fixtures";
import { LIVE } from "./env";
import { decisionSlugs } from "./routes";

for (const slug of decisionSlugs) {
  test(`decision page: ${slug}`, async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === "mobile";
    await page.goto(`/uk/cases/${slug}`);

    /* «На цій сторінці»: a rail beside the text at 1366px, a fold at the top
       under 1000px. Both carry the same list; every anchor in it must land
       on something. */
    const rail = page.locator("aside.toc-rail");
    const fold = page.locator("details.toc-fold");
    await expect(mobile ? fold : rail).toBeVisible();
    await expect(mobile ? rail : fold).toBeHidden();

    const anchors = await page
      .locator(".toc-rail nav a, .toc-fold nav a")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(anchors.length, "contents entries").toBeGreaterThan(2);
    const missing = await page.evaluate(
      (hrefs) => hrefs.filter((h) => !h.startsWith("#") || !document.getElementById(decodeURIComponent(h.slice(1)))),
      anchors,
    );
    expect(missing, "contents links whose target is not on the page").toEqual([]);

    /* The chronology, with its entries. */
    const chron = page.locator("section#chronology");
    await expect(chron).toBeAttached();
    await expect(chron.locator("h2")).toBeVisible();
    const entries = chron.locator(".ctl-row");
    expect(await entries.count(), "chronology entries").toBeGreaterThan(0);
    if (!LIVE) await expect(entries).toHaveCount(SUMMARIES[slug].timeline.length);

    /* «Читати рішення» — or the summary's own label for it — opens the
       judgment in a new tab. */
    const read = page.locator("a.hm-cta:not(.hm-cta-2)");
    await expect(read).toHaveCount(1);
    await expect(read).toHaveAttribute("href", /^https?:\/\/\S+$/);
    await expect(read).toHaveAttribute("target", "_blank");
    await expect(read).toHaveAttribute("rel", /noopener/);
    if (!LIVE) {
      const label = pick(SUMMARIES[slug].judgment.readLabel ?? { uk: "Читати рішення", en: "Read the judgment" }, "uk");
      await expect(read).toContainText(label);
      await expect(read).toHaveAttribute("href", SUMMARIES[slug].judgment.url);
    }

    /* Following a contents entry scrolls to it. */
    if (mobile) {
      await fold.locator("summary").click();
      await fold.locator('nav a[href="#chronology"]').click();
    } else {
      await rail.locator('nav a[href="#chronology"]').click();
    }
    await expect(page).toHaveURL(/#chronology$/);
    await expect(chron.locator("h2")).toBeInViewport();
  });
}
