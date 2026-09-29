/**
 * The `test` every spec imports: Playwright's, plus three things each page
 * visit needs.
 *
 *   - Browser errors fail the test. Every console error and uncaught
 *     exception on any page the test opened is collected and asserted empty
 *     at the end, so no spec has to remember to look. A test that expects one
 *     (a 404 document logs its own status) lists it in `consoleAllow`.
 *   - Nothing leaves for a third party. The only outside script the site can
 *     carry is Cloudflare's analytics beacon; it is answered with an empty
 *     body, so a run does not count as a visit and a blocked beacon host does
 *     not show up as a console error.
 *   - On the live site, every same-origin request is fetched by Playwright
 *     and handed to the browser (`route.fetch`). Headless Chromium's own
 *     connection through an intercepting proxy was answered differently from
 *     everyone else's (the admin came back 403), and fetching from the test
 *     runner is what a reader's browser sees.
 */
import { test as base, expect, type Page } from "@playwright/test";
import { LIVE, ORIGIN } from "./env";

type Fixtures = {
  /** Console errors that this test expects and does not count. */
  consoleAllow: RegExp[];
  /** Collected browser errors; asserted empty after the test. */
  browserErrors: string[];
};

export const test = base.extend<Fixtures>({
  consoleAllow: [[], { option: true }],

  context: async ({ context }, provide) => {
    await context.route(
      (url) => url.origin !== ORIGIN || LIVE,
      async (route) => {
        try {
          const url = new URL(route.request().url());
          if (url.origin !== ORIGIN) {
            await route.fulfill({ status: 204, body: "" });
            return;
          }
          await route.fulfill({ response: await route.fetch() });
        } catch {
          /* The page or context closed while the request was in flight. */
        }
      },
    );
    await provide(context);
    await context.unrouteAll({ behavior: "ignoreErrors" });
  },

  browserErrors: [
    async ({ context, consoleAllow }, provide, testInfo) => {
      const errors: string[] = [];
      const watch = (page: Page) => {
        page.on("console", (msg) => {
          if (msg.type() !== "error") return;
          const text = msg.text();
          if (consoleAllow.some((re) => re.test(text))) return;
          errors.push(`console: ${text} (${msg.location().url || page.url()})`);
        });
        page.on("pageerror", (err) => errors.push(`pageerror: ${err.message} (${page.url()})`));
      };
      context.pages().forEach(watch);
      context.on("page", watch);
      await provide(errors);
      if (testInfo.status === testInfo.expectedStatus) {
        expect(errors, "browser console errors and uncaught exceptions").toEqual([]);
      }
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Wait until the page's islands can answer a click.
 *
 * Pages whose only island is the header run a small script instead of React
 * (site/islands/header.ts), and module scripts run before `load`. Any other
 * island means React hydrates every island on the page, and `hydrateRoot`
 * marks its container synchronously – so once every top-level island carries
 * React's container key, each has been handed to React and a click on it
 * reaches a handler (one that lands mid-hydration is replayed).
 */
export async function hydrated(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.waitForFunction(() => {
    const top = [...document.querySelectorAll("nsv-island")].filter(
      (el) => !el.parentElement?.closest("nsv-island"),
    );
    const react = top.some((el) => el.getAttribute("data-k") !== "components/nasvitlo/Header.tsx#default");
    if (!react) return true;
    return top.every((el) => Object.keys(el).some((k) => k.startsWith("__reactContainer")));
  });
}

/** Whether the document is wider than the window – the horizontal scroll a phone reader sees. */
export async function overflow(page: Page): Promise<{ scrollWidth: number; innerWidth: number; culprits: string[] }> {
  return page.evaluate(() => {
    const innerWidth = window.innerWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const culprits: string[] = [];
    if (scrollWidth > innerWidth) {
      for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
        const r = el.getBoundingClientRect();
        if (r.right > innerWidth + 1 && r.width > 0) {
          culprits.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${[...el.classList].join(".")} → ${Math.round(r.right)}px`);
          if (culprits.length >= 5) break;
        }
      }
    }
    return { scrollWidth, innerWidth, culprits };
  });
}
