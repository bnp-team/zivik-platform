import type { DecisionSummary } from "./types";
import { registryCases } from "@/content/cases";
import { icjCerdIcsft } from "./icj-cerd-icsft";
import { icjGenocide } from "./icj-genocide";
import { oschadbank } from "./oschadbank";
import { iccUkraine } from "./icc-ukraine";
import { dtekKrymenergo } from "./dtek-krymenergo";
import { echrUkraineNetherlands } from "./echr-ukraine-netherlands";
import { finlandTorden } from "./finland-torden";
import { hagueMh17 } from "./hague-mh17";

/**
 * Slug → decision summary: the one list of pages that exist. The page
 * template renders from it, the sitemap enumerates it – one place to add a
 * case, one place for both consumers to see it.
 *
 * SECURITY – the null prototype is load-bearing, not a style choice.
 *
 * `app/[locale]/cases/[slug]/page.tsx` does `SUMMARIES[slug]` with `slug`
 * straight off the URL, and this route has `dynamicParams` on, so a slug that
 * was never built still reaches the lookup. On an ordinary object literal that
 * lookup walks up to `Object.prototype`, so five URLs a visitor can simply
 * type – /cases/constructor, /cases/toString, /cases/valueOf,
 * /cases/hasOwnProperty, /cases/__proto__ – returned a *truthy* inherited
 * value instead of undefined. The page took that as a real summary, skipped
 * the `if (!summary)` branch that renders the pending page, and died on
 * `masthead.parties`: HTTP 500, verified against the built server.
 *
 * Not an injection – the body is Next's bare "Internal Server Error" and
 * nothing of the object is rendered – but it is an unauthenticated 500 on a
 * public route of a site meant to be cited, one server invocation per request,
 * reachable by anyone who can type a URL.
 *
 * `Object.create(null)` has no prototype, so those five keys are absent like
 * any other unknown slug and the pending/404 path handles them. It also fixes
 * `slug in SUMMARIES`, used in content/map-links.ts and content/legal.ts,
 * which had the same blind spot. Keep the null prototype if this map is ever
 * rebuilt.
 */
export const SUMMARIES: Record<string, DecisionSummary> = Object.assign(
  Object.create(null) as Record<string, DecisionSummary>,
  {
    "icj-cerd-icsft": icjCerdIcsft,
    "icj-genocide": icjGenocide,
    oschadbank: oschadbank,
    "icc-ukraine": iccUkraine,
    "dtek-krymenergo": dtekKrymenergo,
    "echr-ukraine-netherlands": echrUkraineNetherlands,
    "finland-torden": finlandTorden,
    "hague-mh17": hagueMh17,
  },
);

/**
 * The registry (`cases.ts`) links cases by `summarySlug`; SUMMARIES is what
 * actually renders. A typo on either side used to build green and 404 in
 * production – so this module refuses to build while they disagree.
 */
{
  const linked = registryCases
    .map((c) => c.summarySlug)
    .filter((x): x is string => Boolean(x));
  const orphanLinks = linked.filter((slug) => !(slug in SUMMARIES));
  const orphanPages = Object.entries(SUMMARIES).filter(
    ([, s]) => !registryCases.some((c) => c.id === s.caseId),
  );
  const unlinkedPages = Object.keys(SUMMARIES).filter((slug) => !linked.includes(slug));
  if (orphanLinks.length || orphanPages.length || unlinkedPages.length) {
    throw new Error(
      `Registry ↔ SUMMARIES out of sync. ` +
        `summarySlug without a page: [${orphanLinks}]; ` +
        `page whose caseId is not in the registry: [${orphanPages.map(([k]) => k)}]; ` +
        `page no registry row links to: [${unlinkedPages}]`,
    );
  }
}

/**
 * Provenance invariants. Each of these was a live defect before it was a
 * guard, so the build refuses rather than shipping the next one quietly.
 */
{
  const bad: string[] = [];
  for (const [slug, s] of Object.entries(SUMMARIES)) {
    // The provisional-measures instrument used to caption every page's
    // measures "Order of 19 April 2017", hardcoded in the template. The
    // caption now comes from the data, so the data has to carry it.
    if (s.provisionalMeasures?.length && !s.provisionalMeasuresOrder) {
      bad.push(`${slug}: provisionalMeasures without provisionalMeasuresOrder`);
    }
    // A search snippet is cut off around 160 characters. `metaDesc` exists so
    // that the cut never lands mid-sentence; one over the line defeats it.
    for (const loc of ["uk", "en"] as const) {
      const d = s.metaDesc?.[loc];
      if (d && d.length > 160) {
        bad.push(`${slug}: metaDesc.${loc} is ${d.length} characters (max 160)`);
      }
      // The same for the result's title line; past ~70 it is cut, which is
      // the one thing `seoTitle` is for.
      const t = s.seoTitle?.[loc];
      if (t && t.length > 70) {
        bad.push(`${slug}: seoTitle.${loc} is ${t.length} characters (max 70)`);
      }
    }
  }
  if (bad.length) {
    throw new Error(`Summary provenance invariants violated:\n  ${bad.join("\n  ")}`);
  }
}

/** Freshness of a page: its context-verification date, else the decision date. */
export function summaryLastModified(slug: string): string | undefined {
  const s = SUMMARIES[slug];
  return s?.asOf ?? s?.judgment.date;
}

/**
 * Найсвіжіша з дат `summaryLastModified` по всіх оглядах – коли востаннє
 * змінився зміст архіву.
 *
 * Для сторінок, що зібрані з оглядів, але своєї дати не мають: головна й
 * бібліотека в sitemap стояли без `lastModified` зовсім, тож краулер не мав
 * жодного сигналу, що вони змінилися, коли з'явився новий огляд. Дати – ISO
 * 8601 (YYYY-MM-DD), тож найбільша рядком – найпізніша.
 */
export function latestSummaryLastModified(): string | undefined {
  let latest: string | undefined;
  for (const slug of Object.keys(SUMMARIES)) {
    const d = summaryLastModified(slug);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}
