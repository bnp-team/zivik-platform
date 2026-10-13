import path from "node:path";
import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

/**
 * Search engines are kept out until SITE_INDEXABLE=true. Announced on every
 * build: the expensive mistake is not blocking a test site, it is launching
 * one that is still blocked, and a silent flag is how that happens.
 */
const indexable = process.env.SITE_INDEXABLE === "true";
console.log(
  indexable
    ? "  SITE_INDEXABLE=true — this build may be indexed by search engines"
    : "  SITE_INDEXABLE is not set — this build serves noindex to search engines",
);

const nextConfig: NextConfig = {
  /**
   * Pin the Turbopack root to this package.
   *
   * Turbopack finds the root by walking up for a lockfile, and there is a
   * stray `~/package-lock.json` on this machine, so it was picking the home
   * directory. That only printed a warning during `next build`, but in `next
   * dev` started from outside the project it broke module resolution outright
   * — every route 500'd on "Can't resolve
   * next/dist/esm/build/adapter/setup-node-env.external".
   *
   * Pinning it makes the dev server independent of the directory it is
   * launched from, and silences the build warning.
   */
  turbopack: {
    root: path.join(__dirname),
  },

  /**
   * The old Vercel addresses move to the site's home for good: 308, path
   * kept. Only these two hosts – preview deployments
   * (nasvitlo-git-…vercel.app) and the Vercel staging project keep serving
   * themselves, under the noindex below. Vercel cannot redirect a domain to
   * one outside the project, so this lives here rather than in its dashboard.
   */
  async redirects() {
    return ["nasvitlo.vercel.app", "zivik-platform.vercel.app"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
      destination: "https://nasvitlo.ucu.edu.ua/:path*",
      permanent: true,
    }));
  },

  /** Baseline security headers — see src/lib/security-headers.ts. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      /* The Vercel deployment is the old home (zivik-platform.vercel.app,
         nasvitlo.vercel.app); the site lives on nasvitlo.ucu.edu.ua. Its
         copies stay out of the index whatever SITE_INDEXABLE says there –
         until the dashboard redirects them for good (docs/LAUNCH.md). */
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.+)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
