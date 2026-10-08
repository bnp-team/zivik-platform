/**
 * The HTTP security headers every public page is served with.
 *
 * Shared by both builds: next.config.ts returns them from `headers()`, and the
 * Cloudflare build writes them into the static asset server's `_headers`
 * file (see astro.config.mjs). One policy, so the two deployments cannot
 * drift apart on what a reader's browser is told to allow.
 */

import {
  analyticsEnabled,
  CF_BEACON_ORIGIN,
  CF_REPORT_ORIGIN,
  heatmapsEnabled,
  POSTHOG_API_ORIGIN,
  POSTHOG_APP_ORIGIN,
  POSTHOG_ASSETS_ORIGIN,
} from "./analytics";

/**
 * Search engines are kept out until SITE_INDEXABLE=true – see `isIndexable`
 * in lib/seo.ts.
 */
const indexable = process.env.SITE_INDEXABLE === "true";

/**
 * Content-Security-Policy.
 *
 * The note that used to sit here said a real policy "needs per-request
 * nonces, which turns every page dynamic". That was the right worry about the
 * wrong directive. Nonces buy one thing: dropping `'unsafe-inline'` from
 * `script-src`. Everything else a CSP does here – `frame-ancestors`,
 * `base-uri`, `form-action`, `object-src`, and pinning every fetch to this
 * origin – costs nothing and needs no nonce, and the site was shipping none
 * of it.
 *
 * So this is the static policy: strict everywhere it can be, `'unsafe-inline'`
 * only where Next's own output requires it, and every page still prerendered.
 *
 * Why the two loose directives are honest rather than lazy:
 *  - `script-src 'unsafe-inline'` – a prerendered Next page carries 13 inline
 *    `self.__next_f.push(...)` blocks whose contents are the RSC payload, so
 *    they differ per page and per build. Hashing them means regenerating the
 *    header on every build for every route; nonces mean per-request rendering.
 *    Neither is worth it *here*, because there is no injection sink to defend:
 *    no database, no user content, no query parameter that reaches markup, and
 *    the one `dangerouslySetInnerHTML` is escaped JSON-LD (`jsonLdHtml` in
 *    lib/seo.ts). Revisit this the day the archive takes input from anyone.
 *  - `style-src 'unsafe-inline'` – 74 `style=""` attributes on the home page
 *    alone, from React inline styles. `style-src-attr` has no nonce mechanism.
 *
 * What it does buy, all of it real:
 *  - `default-src`/`connect-src`/`img-src`/`font-src 'self'` – this site loads
 *    nothing from anywhere else (fonts are self-hosted by next/font, the map
 *    is inline SVG, the old unpkg/jsdelivr fetches are gone). The policy now
 *    says so, so an injected `<img src=https://…>` beacon cannot exfiltrate.
 *  - `frame-ancestors 'self'` – the modern X-Frame-Options, kept alongside it
 *    for the browsers that only read the old one.
 *  - `base-uri 'self'` – an injected `<base>` cannot silently repoint every
 *    relative script and link on the page at another origin.
 *  - `form-action 'self'` – the site has no forms; if one ever appears by
 *    accident it cannot post off-origin.
 *  - `object-src 'none'`, `frame-src 'none'` – no plugins, no iframes.
 */
const vercelPreview =
  process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development";

/**
 * Vercel's preview toolbar (comments, the deployment bar) loads from
 * vercel.live and talks to Pusher. Production must not allow either, and does
 * not – the production HTML references neither – but blocking them on preview
 * would break the review tooling the team uses before launch, and someone
 * would then delete the whole policy to get it back.
 */
const previewSources = vercelPreview
  ? {
      script: " https://vercel.live",
      connect: " https://vercel.live wss://ws-us3.pusher.com",
      frame: " https://vercel.live",
      img: " https://vercel.live https://vercel.com",
    }
  : { script: "", connect: "", frame: "", img: "" };

/**
 * Cloudflare Web Analytics – лише коли збірка має токен (`lib/analytics.ts`).
 *
 * Два джерела й нічого більше: скрипт маячка з static.cloudflareinsights.com
 * і його звіти на cloudflareinsights.com. Без токена їх у політиці немає –
 * «default-src 'self'» вище лишається правдою буквально, а не «плюс сервіс,
 * якого ми не вмикали». Політика збирається під час збірки (next.config.ts
 * повертає її з `headers()`, astro.config.mjs пише в `_headers`), тож
 * увімкнення аналітики – це нова збірка, як і для самого маячка.
 */
const heatmapSources = heatmapsEnabled
  ? { script: ` ${POSTHOG_ASSETS_ORIGIN}`, connect: ` ${POSTHOG_API_ORIGIN} ${POSTHOG_ASSETS_ORIGIN}`, frame: ` ${POSTHOG_APP_ORIGIN}` }
  : { script: "", connect: "", frame: "" };

const analyticsSources = analyticsEnabled
  ? { script: ` ${CF_BEACON_ORIGIN}`, connect: ` ${CF_REPORT_ORIGIN}` }
  : { script: "", connect: "" };

export const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${analyticsSources.script}${heatmapSources.script}${previewSources.script}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data:${previewSources.img}`,
  "font-src 'self'",
  `connect-src 'self'${analyticsSources.connect}${heatmapSources.connect}${previewSources.connect}`,
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  `frame-src ${vercelPreview ? `'self'${previewSources.frame}` : "'none'"}`,
  `frame-ancestors 'self'${heatmapSources.frame}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

export interface Header {
  key: string;
  value: string;
}

/**
 * Baseline security headers.
 *
 * Nothing here is exploitable today – the site is static and takes no user
 * input – but this is an archive meant to be cited in filings, and these are
 * the headers a reader's security team expects to find. Vercel already sends
 * HSTS.
 */
export const securityHeaders: Header[] = [
  { key: "Content-Security-Policy", value: csp },
  // Stop browsers second-guessing declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin to other sites, the full path only to our own –
  // decision-page URLs name the case being read.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nobody needs to frame us. Kept alongside `frame-ancestors` above
  // for the browsers that only read the older header. (The comment
  // that used to sit here said "the map is a same-origin iframe" – it
  // has not been an iframe since EventsMap became inline SVG.)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // No page here uses a camera, a microphone or a location.
  //
  // `browsing-topics=()` joins them because `interest-cohort=()` had
  // stopped denying anything: FLoC never shipped past its origin trial
  // and was withdrawn in 2022, so no browser reads that token today.
  // The Topics API is what replaced it and what is actually live in
  // Chrome, so the opt-out this line was always meant to express has
  // to name it. `interest-cohort` stays alongside – a directive
  // nothing understands costs nothing, and Chromium forks kept FLoC
  // for a while.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
  },
  // Kept out of search until launch. See `isIndexable` in lib/seo.ts
  // for why this is a noindex rather than a robots.txt Disallow.
  ...(indexable
    ? []
    : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
];
