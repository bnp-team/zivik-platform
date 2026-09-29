import { MAP_EVENTS, MAP_COURTS, MAP_COUNTRIES, seatsList } from "./map";
import { moneyCompact } from "@/content/money";
import { registryCases, registryProceedings } from "./cases";
import { SUMMARIES } from "./summaries";
import { pick } from "./types";
import type { Locale } from "@/i18n/config";
import type { CaseStageKey } from "./types";

/**
 * Map event → the decisions it leads to.
 *
 * `summaries/index.ts` already refuses to build when the registry and the
 * pages disagree; this does the same for the map. A slug that no longer has a
 * page would otherwise ship as a link to a 404, and the map is the one place
 * on the site where a reader clicks without having read a case name first.
 */
{
  const missing = MAP_EVENTS.flatMap((e) =>
    (e.cases ?? []).filter((slug) => !(slug in SUMMARIES)).map((slug) => `${e.key} → ${slug}`),
  );
  if (missing.length) {
    throw new Error(
      `map.ts links to decisions that do not exist:\n  ${missing.join("\n  ")}`,
    );
  }
}

/**
 * Every registry institution must be seated on the map, or be named here as
 * deliberately absent from it.
 *
 * The archive holds 33 proceedings, and before this the ten heard by the Dutch
 * courts, the ICAO Council, the ICC arbitration court, Lithuania and the EU
 * appeared nowhere. A court answers for its own caseload now, which is only
 * true while every institution has a seat – so the build checks it.
 *
 * The list below is the escape hatch, and it is a list rather than a softened
 * check for a reason: the guard exists to catch the institution somebody
 * forgot, and a check that simply tolerates absence catches nothing. An
 * institution off the map has to be put here by hand, with the reason.
 */
const OFF_MAP_INSTITUTIONS: Record<string, string> = {
  /* The ICAO Council sits in Montreal, which is on another continent: the
     projection would have to shrink Europe to nothing to reach it, and the
     dock-at-the-edge treatment it used to get was what the Atlantic framing
     existed to undo. The owner's decision is that the map stays European. The
     proceeding is in the registry, where a reader looking for it will be, and
     the appeal against the Council's decision went to the ICJ – which is on
     the map. */
  icao: "Montreal is off the European frame; the proceeding stays in the registry",
  /* Euroclear, where the Russian central-bank assets are immobilised. It is
     an enforcement measure and not a proceeding, and the EU is not a court –
     so on a map about the states whose courts hear these cases it was a marker
     that could never have a lit country under it. The measure is in the
     registry; the map stays about courts. */
  eu: "the EU is not a court; the asset immobilisation stays in the registry",
};

{
  const seated = MAP_COURTS.flatMap((c) => c.institutionIds);
  const dupes = seated.filter((id, i) => seated.indexOf(id) !== i);
  const orphans = [...new Set(registryProceedings.map((c) => c.institutionId))].filter(
    (id) => !seated.includes(id) && !(id in OFF_MAP_INSTITUTIONS),
  );
  if (orphans.length || dupes.length) {
    throw new Error(
      [
        orphans.length && `institutions with no seat on the map: ${orphans.join(", ")}`,
        dupes.length && `institutions seated twice: ${dupes.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

export interface MapCaseLink {
  slug: string;
  title: string;
  forum: string;
  /**
   * Where the proceeding stands, and what is at stake in it.
   *
   * The map counted rows and said nothing about consequences: every card gave
   * a number of proceedings and none of them gave a figure or a posture, while
   * the registry beside it carries both on every row. The largest award in the
   * collection – $1.1bn in Oschadbank – appeared nowhere on the map at all.
   *
   * `stage` is the registry's own key, resolved to a label by the render site,
   * which has the dictionary. `amount` is already formatted: the sign in the
   * source encodes which way the money ran, and that is not something a tag
   * can caption honestly, so this is the magnitude and the label calls it the
   * sum in dispute – the same wording, from the same reasoning, as the pending
   * case page.
   */
  stage?: CaseStageKey;
  amount?: string;
}

/**
 * Amount at stake, short. See `MapCaseLink`.
 *
 * Compact rather than the grouped figure the pending case page prints. That
 * page sets the amount as a field in a definition list with the width of the
 * page behind it; here it is a tag inside a 300px card, and «1 100 000 000
 * USD» is thirteen digits and a currency across a column that also has to hold
 * the name of the case. `compact` gives «1,1 млрд $» and "$1.1B" – the same
 * number, at the precision a tag can carry.
 *
 * The magnitude, not the signed value: the sign in the source encodes which
 * way the money ran – the gas sales arbitration is recorded as −2.02bn – and
 * that is not something a tag can caption honestly, so the label calls it the
 * sum in dispute and leaves the direction to the case.
 */
const money = moneyCompact;

/** The registry row a summary was written from, if the registry has one. */
const rowFor = (slug: string) => registryCases.find((c) => c.summarySlug === slug);

/** Resolved once per render, on the server, so the client gets one language. */
export function caseLinksFor(eventKey: string, locale: Locale): MapCaseLink[] {
  const event = MAP_EVENTS.find((e) => e.key === eventKey);
  return (event?.cases ?? []).map((slug) => {
    const s = SUMMARIES[slug];
    const row = rowFor(slug);
    return {
      slug,
      stage: row?.stage,
      amount: row?.amountUsd != null ? money(row.amountUsd, locale) : undefined,
      // `title` is optional on DecisionSummary; the masthead parties are
      // what the case is filed as, so they stand in when it is absent.
      title: s.title ? pick(s.title, locale) : s.masthead.parties,
      // Forum is institution + seat; the row shows the institution alone,
      // since the seat is already what the marker's line points at.
      forum: s.forum ? pick(s.forum.institution, locale) : "",
    };
  });
}

/** What a court hears, from the registry rather than from the six map sites. */
/**
 * The seats of a marker, each with how much of the archive it holds.
 *
 * `seatsList` lives in map.ts, next to the markers; the count cannot, because
 * it is a fact about the registry and map.ts has no business importing the
 * caseload. So the two are joined here, where both are already in scope, and
 * every surface takes the joined rows rather than counting again.
 *
 * A seat with no institution – Paris holds the PCA as the *venue* of the
 * Oschadbank arbitration, and the PCA itself sits in The Hague – gets no
 * count, for the same reason it gets no link: it is a fact about where
 * something sat, not a court with a caseload.
 */
export function seatRows(courtKey: string, locale: Locale) {
  const court = MAP_COURTS.find((c) => c.key === courtKey);
  if (!court) throw new Error(`no court "${courtKey}" on the map`);
  return seatsList(court, locale).map((s) => ({
    ...s,
    count: s.id ? registryProceedings.filter((c) => c.institutionId === s.id).length : undefined,
  }));
}

export function courtCaseloadFor(courtKey: string, locale: Locale) {
  const court = MAP_COURTS.find((c) => c.key === courtKey);
  const cases = registryProceedings.filter((c) =>
    (court?.institutionIds ?? []).includes(c.institutionId),
  );
  return {
    /**
     * The registry institutions this seat stands for, so a card can hand the
     * reader the rest of the caseload instead of printing it. `/registry`
     * opens filtered on `?court=`, and takes several ids separated by commas –
     * The Hague alone seats four (ICJ, ICC, PCA, the Dutch courts).
     */
    courtIds: court?.institutionIds ?? [],
    total: cases.length,
    /** The ones a reader can actually open. */
    written: cases
      .filter((c) => c.summarySlug && c.summarySlug in SUMMARIES)
      .map((c) => {
        const s = SUMMARIES[c.summarySlug as string];
        return {
          slug: c.summarySlug as string,
          title: s.title ? pick(s.title, locale) : s.masthead.parties,
          stage: c.stage,
          amount: c.amountUsd != null ? money(c.amountUsd, locale) : undefined,
        };
      }),
    /**
     * The rest, by name. A card that said «2 провадження у бібліотеці» and
     * then «ці провадження не привʼязані до жодного з шести місць» told the
     * reader a number and a negative and left them asking what Stockholm was
     * doing on the map at all. Naming them answers it: two Naftogaz–Gazprom
     * arbitrations, an asset immobilisation, an extradition. The registry's
     * own name and docket, nothing composed here.
     */
    listed: cases
      .filter((c) => !(c.summarySlug && c.summarySlug in SUMMARIES))
      .map((c) => ({
        id: c.id,
        // The citation, and – for a Ukrainian reader – the same case said in
        // Ukrainian. Never both in the English locale: there the caption is
        // already in the reader's language and a second line would repeat it.
        name: c.nameShort ?? c.name,
        nameUk: locale === "uk" ? c.nameUk : undefined,
        note: pick(c.note, locale),
        stage: c.stage,
        amount: c.amountUsd != null ? money(c.amountUsd, locale) : undefined,
      })),
  };
}

/**
 * What the panel says when a reader presses a lit country.
 *
 * The same answer pressing a city gives – the courts that sit there, as a
 * list, and how much of the archive they hold – gathered for the country
 * instead of the dot. France is why this exists as a merge rather than a
 * lookup: the ECtHR in Strasbourg and the ICC's Court of Arbitration in Paris
 * are two markers in one shape, and a reader who presses France is asking
 * about both.
 *
 * Resolved on the server, like everything else `EventsMap` is handed: it is a
 * client component, so a `Localized` pair crossing into it would ship both
 * languages to every reader.
 */
export function countryPanelsFor(locale: Locale) {
  return MAP_COUNTRIES.map((co) => {
    const seated = co.courts.map((key) => {
      const court = MAP_COURTS.find((c) => c.key === key);
      /* Unreachable – the guard in map.ts fails the build on an unknown court
         – and thrown rather than filtered, because a country that quietly
         dropped one of its two courts would show a panel that is simply short
         by a court, which is the kind of wrong that looks right. */
      if (!court) throw new Error(`country "${co.key}" names court "${key}", which is not on the map`);
      return court;
    });
    return {
      key: co.key,
      label: pick(co.name, locale),
      at: pick(co.at, locale),
      seatList: seated.flatMap((c) => seatRows(c.key, locale)),
      /* Every institution seated in this country, so the card's way out
         opens the registry on the same set the card just counted. France
         holds two markers and four institutions between them. */
      courtIds: seated.flatMap((c) => c.institutionIds),
      total: seated.reduce((n, c) => n + courtCaseloadFor(c.key, locale).total, 0),
    };
  });
}
