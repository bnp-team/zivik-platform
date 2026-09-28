/**
 * Functional tests of the public site and the editor's entry point
 * (tests/e2e, see tests/e2e/README.md).
 *
 *   npm run test:e2e        builds (npx astro build), then tests dist/client
 *   npm run test:e2e:live   the deployed site (BASE_URL, or DEFAULT_LIVE_URL in env.ts)
 *
 * Two viewports, because layout is where this site breaks: 390px is a phone
 * (the header collapses to a burger under 1080, the registry folds its filters
 * under 640, the decision page's contents rail becomes a fold under 1000) and
 * 1366px is the most common laptop width. Checks that do not depend on layout
 * — HTTP answers, headers, robots.txt — run once, in the `http` project.
 */
import { defineConfig } from "@playwright/test";
import { BASE_URL, LIVE, LOCAL_PORT } from "./tests/e2e/env";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  /* A live run crosses the network; one retry separates a dropped connection
     from a real regression (the report marks a pass-on-retry as flaky). The
     local build has no network to blame, so a failure there is a failure. */
  retries: LIVE ? 1 : 0,
  workers: process.env.CI ? 2 : "75%",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    /* The live site is reached through whatever proxy the machine has; some
       re-sign TLS with their own CA. The site's own certificate is not what
       these tests are about. */
    ignoreHTTPSErrors: true,
    locale: "uk-UA",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /http\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 1366, height: 900 } },
    },
    {
      name: "mobile",
      testIgnore: /http\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "http",
      testMatch: /http\.spec\.ts/,
      use: { browserName: "chromium" },
    },
  ],
  webServer: LIVE
    ? undefined
    : {
        command: "node tests/e2e/serve.mjs",
        url: `${BASE_URL}/uk`,
        env: { PORT: String(LOCAL_PORT) },
        reuseExistingServer: !process.env.CI,
        timeout: 20_000,
      },
});
