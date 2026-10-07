// @ts-check
/**
 * The Cloudflare build of насвітло: Astro + EmDash on Workers, D1 and R2.
 *
 * It lives beside the Next app rather than replacing it in one go. `site/` is
 * Astro's source directory and holds only what is Astro's own — routes, the
 * document shell, the island runtime and the EmDash content adapter. The
 * components, stylesheets, dictionaries and SEO helpers are the same files the
 * Next app renders (`src/`), so a change on main reaches both builds and the
 * two cannot drift apart while the switch is under way. See docs/CLOUDFLARE.md.
 */
import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { clientIslands } from "./site/islands/vite-plugin.mjs";
import { contentSnapshot } from "./site/content/vite-plugin.mjs";
import { adminLocales } from "./site/emdash/admin-locales.mjs";
import { revisionKeep } from "./site/emdash/revision-keep.mjs";
import { securityHeaders } from "./src/lib/security-headers.ts";
import { appendFileSync, readFileSync } from "node:fs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Build-time flags, inlined the way `next build` inlines them into a
 * prerendered page. They decide what a deployment publishes, so they belong to
 * the build, not to whichever Worker isolate happens to serve the request.
 */
const buildEnv = [
  "SITE_INDEXABLE",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_ENV",
  /* Вмикають те, що вимкнено до запуску: маячок Cloudflare Web Analytics
     (src/lib/analytics.ts) і мета-тег підтвердження Google Search Console
     (`verificationMetadata` у src/lib/seo.ts). Без значення — нічого з цього в HTML
     немає. Див. docs/LAUNCH.md. */
  "NEXT_PUBLIC_CF_ANALYTICS_TOKEN",
  "GOOGLE_SITE_VERIFICATION",
];
const define = Object.fromEntries(
  buildEnv.map((k) => [`process.env.${k}`, JSON.stringify(process.env[k])]),
);
/* When the content snapshot this build compiles was taken, for the Worker's
   cron to compare against the latest publish in D1 (site/worker.ts). Null
   when the build ran from the files — then there is nothing to compare. */
{
  let pulledAt = null;
  try {
    pulledAt = JSON.parse(readFileSync(here("./.emdash/snapshot.json"), "utf8")).pulledAt ?? null;
  } catch {
    /* no snapshot: a build from src/content */
  }
  define.__NSV_SNAPSHOT_PULLED_AT__ = JSON.stringify(pulledAt);
}
/* The staging build (package.json cf:build:staging). Staging is a second
   Worker on the same D1: its cron would run EmDash's scheduled publishing
   and cleanup a second time, against production data. */
define.__NSV_STAGING__ = JSON.stringify(process.env.NSV_STAGING === "1");
/* Who may publish from the admin (site/emdash/review-policy.ts): an EmDash
   role level, 50 (administrator) unless the build says otherwise. */
define.__NSV_PUBLISH_MIN_ROLE__ = JSON.stringify(
  [20, 30, 40, 50].includes(Number(process.env.PUBLISH_MIN_ROLE)) ? Number(process.env.PUBLISH_MIN_ROLE) : 50,
);

/**
 * The Next build's security headers, for Cloudflare's static asset server.
 *
 * Every public page is a prerendered file, and Cloudflare serves files
 * without running the Worker, so the headers go where the asset server reads
 * them: `_headers`. The admin (/_emdash/*) is rendered by the Worker and keeps
 * EmDash's own policy — this CSP would break its editor.
 *
 * HSTS is added here because Vercel sent it on its own and Cloudflare does
 * not; the Next policy relies on that (see src/lib/security-headers.ts).
 */
const headersFile = {
  name: "nsv-security-headers",
  hooks: {
    "astro:build:done": ({ dir }) => {
      const lines = [
        "",
        "/*",
        ...securityHeaders.map((h) => `  ${h.key}: ${h.value}`),
        "  Strict-Transport-Security: max-age=63072000; includeSubDomains",
        "",
        /* Portraits and logos are unhashed files that change about once a
           year. Left at the asset server's max-age=0 they were revalidated on
           every visit; a day is short enough that a replaced photo shows up
           tomorrow without anyone renaming it. */
        "/team/*",
        "  Cache-Control: public, max-age=86400",
        "",
        "/logos/*",
        "  Cache-Control: public, max-age=86400",
        "",
        "/favicon.ico",
        "  Cache-Control: public, max-age=86400",
        "",
        /* Uploads written by the build (scripts/cf/media.mts): named by
           their content, so a replaced picture is a new file. */
        "/media/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        "",
        /* The admin tour: small, unhashed, and changed with the admin — so
           revalidated on every load rather than cached stale for a day. */
        "/admin-guide.js",
        "  Cache-Control: no-cache",
        "",
        "/admin-tweaks.js",
        "  Cache-Control: no-cache",
        "",
      ];
      appendFileSync(new URL("_headers", dir), lines.join("\n"));
    },
  },
};

export default defineConfig({
  srcDir: "./site",
  publicDir: "./public",
  output: "server",
  adapter: cloudflare(),
  trailingSlash: "never",
  /* `/uk/about` is written as uk/about.html, not uk/about/index.html, so the
     static asset server answers the URL Next answers — no slash, no redirect. */
  build: { format: "file" },
  integrations: [
    headersFile,
    react(),
    emdash({
      database: d1({ binding: "DB", session: "auto" }),
      storage: r2({ binding: "MEDIA" }),
      plugins: [
        {
          id: "nsv-rebuild-on-publish",
          version: "1.0.0",
          entrypoint: here("./site/emdash/rebuild-on-publish.ts"),
          format: "native",
          capabilities: ["content:read"],
        },
        /* Email for sign-in links, recovery and invitations — only once the
           build says a provider is set up (see site/emdash/email-resend.ts). */
        ...(process.env.EMAIL_PROVIDER === "resend"
          ? [
              {
                id: "nsv-email-resend",
                version: "1.0.0",
                entrypoint: here("./site/emdash/email-resend.ts"),
                format: /** @type {const} */ ("native"),
                capabilities: /** @type {any} */ (["email:provide"]),
              },
            ]
          : []),
        {
          id: "nsv-staging-on-save",
          version: "1.0.0",
          entrypoint: here("./site/emdash/staging-on-save.ts"),
          format: "native",
          capabilities: ["content:read"],
        },
        {
          id: "nsv-review-policy",
          version: "1.0.0",
          entrypoint: here("./site/emdash/review-policy.ts"),
          format: "native",
          capabilities: ["hooks.content-policy:register"],
        },
        /* Form editors instead of raw JSON boxes for the summaries' JSON
           fields — admin only (site/emdash/json-editors). */
        {
          id: "nsv-json-editors",
          version: "1.0.0",
          entrypoint: here("./site/emdash/json-editors/index.ts"),
          adminEntry: here("./site/emdash/json-editors/admin.tsx"),
          format: "native",
          capabilities: [],
        },
        {
          id: "nsv-validate-content",
          version: "1.0.0",
          entrypoint: here("./site/emdash/validate-content.ts"),
          format: "native",
          capabilities: ["content:write"],
        },
        /* Saving a scheduled entry and trashing a published one – the two
           ways around the publish threshold (site/emdash/live-guard.ts). */
        {
          id: "nsv-live-guard",
          version: "1.0.0",
          entrypoint: here("./site/emdash/live-guard.ts"),
          format: "native",
          capabilities: ["content:write"],
        },
      ],
    }),
  ],
  devToolbar: { enabled: false },
  vite: {
    define,
    plugins: [
      clientIslands({ root: here("./src"), serverOnly: ["components/nasvitlo/HeroMap.tsx"] }),
      contentSnapshot({ snapshot: here("./.emdash/snapshot.json"), root: here(".") }),
      adminLocales({ keep: ["en", "uk"] }),
      /* History: 1000 saved versions per entry, not EmDash's 50. */
      revisionKeep({ keep: 1000 }),
    ],
    resolve: {
      alias: [
        { find: /^@\//, replacement: here("./src/") },
        { find: /^next\/link$/, replacement: here("./site/shims/link.tsx") },
        { find: /^next\/navigation$/, replacement: here("./site/shims/navigation.ts") },
        { find: /^next\/image$/, replacement: here("./site/shims/image.tsx") },
      ],
      dedupe: ["react", "react-dom"],
    },
  },
});
