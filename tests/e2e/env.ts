/**
 * Which site the suite is looking at.
 *
 * `BASE_URL` unset: the local build (`dist/client`) served by serve.mjs –
 * content from src/content, no Worker. `BASE_URL` set to a deployed origin:
 * that site, Worker and all. The Worker-only checks key off `LIVE`, so a run
 * against the local build skips them with a reason instead of failing on
 * behaviour the static server was never meant to have.
 */
export const LOCAL_PORT = Number(process.env.E2E_PORT ?? 4319);

/** The deployed site `npm run test:e2e:live` checks when no BASE_URL is given. */
export const DEFAULT_LIVE_URL = "https://nasvitlo.ucu.edu.ua";

/* `npm run test:e2e:live` picks the live site through the script's own name
   (npm sets `npm_lifecycle_event` on every platform) rather than through
   `BASE_URL=… playwright test`, which Windows' shell cannot run. */
const liveScript = process.env.npm_lifecycle_event === "test:e2e:live";

export const BASE_URL = (
  process.env.BASE_URL || (liveScript ? DEFAULT_LIVE_URL : `http://127.0.0.1:${LOCAL_PORT}`)
).replace(/\/+$/, "");

export const ORIGIN = new URL(BASE_URL).origin;

/** A deployed site rather than the local static server. */
export const LIVE = !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(ORIGIN);

export const LIVE_ONLY =
  "Worker behaviour (redirects, headers, admin, files the Worker serves) exists only on a deployed site – run with BASE_URL=https://… (npm run test:e2e:live)";
