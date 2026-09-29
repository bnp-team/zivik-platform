/**
 * The pages under test, read from the same modules the build reads – so a
 * decision added to src/content/summaries is tested the day it is added, and
 * nobody has to remember to list it here.
 */
import { locales, type Locale } from "@/i18n/config";
import { registryCases, registryProceedings } from "@/content/cases";
import { SUMMARIES } from "@/content/summaries";
import { postsIn } from "@/content/blog";

export { locales, type Locale };

/** Pages every language has, after `/{locale}`. */
export const staticPaths = ["", "/registry", "/map", "/about", "/team", "/privacy", "/terms"] as const;

/** Every written-up decision: /{locale}/cases/{slug}. */
export const decisionSlugs = Object.keys(SUMMARIES);

/**
 * Proceedings with a page but no summary yet – the dark pending page. The
 * same rule `generateStaticParams` uses in src/app/[locale]/cases/[slug]:
 * no `summarySlug`, and not an act folded into another proceeding.
 */
export const pendingIds = registryCases.filter((c) => !c.summarySlug && !c.partOf).map((c) => c.id);

/**
 * A sample of them rather than all thirty-odd: one per court or tribunal,
 * in registry order, so each forum's variant of the page (docket, amount,
 * documents) is seen at least once. Deterministic – the same sample every run.
 */
export const pendingSample: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of registryCases) {
    if (c.summarySlug || c.partOf || seen.has(c.institutionId)) continue;
    seen.add(c.institutionId);
    out.push(c.id);
  }
  return out.slice(0, 6);
})();

/** Rows the library lists with no filter on. */
export const proceedingCount = registryProceedings.length;

/** Whether the build from these files has a blog in this language. */
export const blogIn = (locale: Locale) => postsIn(locale).length > 0;

export type RouteKind = "home" | "static" | "decision" | "pending";

export interface Route {
  path: string;
  locale: Locale;
  kind: RouteKind;
}

export const routes: Route[] = locales.flatMap((locale) => [
  ...staticPaths.map((p) => ({
    path: `/${locale}${p}`,
    locale,
    kind: (p === "" ? "home" : "static") as RouteKind,
  })),
  ...decisionSlugs.map((slug) => ({ path: `/${locale}/cases/${slug}`, locale, kind: "decision" as const })),
  ...pendingSample.map((id) => ({ path: `/${locale}/cases/${id}`, locale, kind: "pending" as const })),
]);
