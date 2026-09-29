/**
 * Content models for the насвітло archive.
 *
 * Backed today by typed files (`src/content/*.ts`); a `PayloadRepository` will
 * later return the same shapes from the CMS, so components never change. Every
 * human-facing string is `Localized` so content is authored per language.
 * Official case citations are single strings (identical across locales).
 */
import type { Locale } from "@/i18n/config";

/** A value provided in every supported locale, e.g. `{ uk: "Гаага", en: "The Hague" }`. */
export type Localized<T = string> = Record<Locale, T>;

/** Resolve a `Localized` value for the active locale. */
export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

/**
 * Where the proceedings stand – the first of the two tag dimensions.
 *
 * It replaced a single `CaseStatusKey` – decided / progress / warrant /
 * settled / enforcement / frozen / rejected – which mixed procedural posture
 * with disposition ("progress" and "warrant" answer different questions), so a
 * row could only ever carry one of the two facts. That key and the field that
 * held it are gone: they had survived the split as a `statusKey` on all
 * thirty-nine records that no surface read and no comparator sorted on, and
 * every value it held is recoverable from `stage`, `outcome` and `status`.
 *
 * Every key here is a phrase the source `status` text actually uses; a case
 * whose record does not fix a stage carries none.
 */
export type CaseStageKey =
  | "preliminary" // «попередній етап»
  | "investigation" // «розслідування»
  | "merits" // «розгляд по суті»
  | "satisfaction" // «очікує сатисфакції»
  | "appeal" // «оскаржується»
  | "remitted" // «повернуто на новий розгляд»
  | "enforcement" // «виконання»
  | "suspended" // «призупинено»
  | "frozen" // «заморожено»
  | "upcoming" // «до арбітражу» / «до суду»
  | "concluded"; // the record states a final disposition

/**
 * What the court, tribunal or prosecutor actually issued – the second tag
 * dimension. Absent where the record names no act.
 */
export type CaseOutcomeKey =
  | "judgment" // «рішення винесено»
  | "award" // «остаточне рішення» (arbitration)
  | "verdict" // «вирок»
  | "liability" // «відповідальність встановлена»
  | "warrant" // «ордер видано»
  | "upheld" // «арбітраж залишено»
  /* «Процедурні рішення» – одна корзина замість «врегульовано» і
     «відхилено». Власниця: «і відхилено і врегульовано заміни на процедурні
     рішення, бо відхилено це не тип рішення». Обидва казали, чим скінчилося
     провадження, а не що суд вирішив. Сюди ж зайшли і «процедурні накази»:
     наказ – це хід справи, а не її результат, і поруч із «процедурними
     рішеннями» він читався як те саме іншими словами. Сам факт нікуди не
     дівся: у чотирьох рядків, яких це стосується, `status` і далі каже
     «Відхилено (Правило 39)», «Врегульовано 2019» і «лише процедурні
     накази». */
  | "procedural"; // «процедурні рішення»

/**
 * The order the stages are offered and sorted in – the life-cycle, not an
 * alphabet, so "by stage" reads as a proceeding moving through a court.
 *
 * Here rather than in a component because two surfaces need the same answer:
 * the filter list the server builds in `registry/page.tsx` and the comparator
 * the client sorts with in `RegistryTable`. They each carried a private copy
 * of this array and of `OUTCOME_ORDER` below – identical, and one edit away
 * from disagreeing, which would have shown up as a filter listing the stages
 * in one order while the table sorted them in another.
 */
export const STAGE_ORDER: readonly CaseStageKey[] = [
  "upcoming",
  "preliminary",
  "investigation",
  "merits",
  "satisfaction",
  "appeal",
  "remitted",
  "enforcement",
  "suspended",
  "frozen",
  "concluded",
] as const;

/** Weight of the act, heaviest first. Same two consumers as `STAGE_ORDER`. */
export const OUTCOME_ORDER: readonly CaseOutcomeKey[] = [
  "judgment",
  "award",
  "verdict",
  "liability",
  "upheld",
  "warrant",
  "procedural",
] as const;

/**
 * A date whose precision is part of the fact.
 *
 * The archive records a bare year for most proceedings and an exact day only
 * where a document fixes one. Widening a year into `YYYY-01-01` would invent a
 * date and corrupt any sort built on it, so the two are different shapes and a
 * consumer has to decide what to do with each.
 */
export type CaseDate =
  | { precision: "day"; iso: string; year: number }
  | { precision: "year"; year: number };

export type InstitutionCategory =
  | "international"
  | "arbitration"
  | "national"
  | "executive";

/**
 * The one line a surface shows when it has room for one line.
 *
 * Three of them do: the home page's list of proceedings, a pending page's
 * heading, and the rows of neighbours under it. They take Ukrainian where the
 * record has it, and the heading name – `nameShort ?? name` – otherwise. The
 * library is the exception and keeps both lines: there the English caption is
 * the record and the Ukrainian line sits under it, which is how a reader who
 * knows the case by either name finds it.
 *
 * The rule lived in CasePending as a local const while the home page printed
 * `name` straight, so the same case read «Ощадбанк проти РФ» on one surface
 * and «JSC Oschadbank v. The Russian Federation, PCA Case No. 2016-14» on the
 * other.
 */
export function caseName(
  c: Pick<RegistryCase, "name" | "nameShort" | "nameUk">,
  locale: string,
): string {
  return locale === "uk" && c.nameUk ? c.nameUk : (c.nameShort ?? c.name);
}

/** A court, tribunal or body that hears cases against Russia. */
export interface Institution {
  /** Stable slug, e.g. `"ecthr"`. */
  id: string;
  /** Abbreviation shown as the badge – may differ by locale (ЄСПЛ ↔ ECtHR). */
  abbr: Localized;
  name: Localized;
  /** Seat city, or null for national/EU groupings. */
  seat: Localized | null;
  category: InstitutionCategory;
  /** Whether this institution appears in the homepage registry (Phase 1). */
  phase1: boolean;
  order: number;
}

/** A single case in the registry. */
export interface RegistryCase {
  id: string;
  /* `num` – the row number from "Cases for the platform.xlsx" – was here and
     is gone. It addressed a spreadsheet, not a proceeding; `id` is what every
     route, link and filter on the site uses. */
  /** References `Institution.id`. */
  institutionId: string;
  /**
   * The proceeding this record is an act *within*, by `id`.
   *
   * Six of these records are the ICC's arrest warrants in ICC-01/22. They are
   * not six proceedings – they are six acts of one, and listing them as rows
   * made the library's ICC group read seven where the answer a reader wants
   * is six warrants in one situation. A record with `partOf` set is not a row
   * of the library and has no page of its own: it is printed on its parent's
   * row and reached through the parent's write-up. It stays a record because
   * its text is the search haystack – a reader typing «Шойгу» has to land
   * somewhere, and that somewhere is now the situation.
   *
   * Owner's decision: «ордери рахуємо як 6 але відображаємо в 1 вкладці».
   */
  partOf?: string;
  /**
   * How this act is named on its parent's row – required with `partOf`.
   *
   * Not `nameUk`, which is the full filing line («Ордер на арешт: Владімір
   * Путін»): six of those under one row is a paragraph. Not `nameShort`
   * either, which is one string for both locales and holds the English
   * surname. This is the person, in the reader's language, and it is
   * authored rather than sliced off another field so that nothing here
   * depends on a prefix staying spelled the way it is today.
   */
  actName?: Localized;
  /**
   * Official citation – identical in both locales, and as the forum files it.
   *
   * The whole caption: every party, the docket, the reporter where there is
   * one. Nothing here is shortened, because for eleven of these records this
   * string is the only place a fact lives – the ten co-claimants of pca-25,
   * the PCA docket of the naval-vessels arbitration, the dates of the ICAO
   * Council decision. It is also the registry's search haystack, so a reader
   * who types a claimant's name reaches the row that is about it.
   *
   * What a heading shows is `nameShort`.
   */
  name: string;
  /**
   * The same proceeding, said short enough for a heading.
   *
   * The captions run to forty words: the pending page's title was «…v. PJSC
   * «Gazprom», SCC Arbitration No. V 2014/129 - Gas Transit Arbitration» over
   * three lines, with the docket repeated in the DOCKET row directly under it
   * and in the note on every list that links here. This is the same case with
   * the apparatus taken off – the parties and, where two proceedings share
   * them, whatever distinguishes the two («– Gas Transit Arbitration» against
   * «– Gas Sales Arbitration»).
   *
   * Optional: a caption already short enough is its own heading. Every surface
   * that displays a case name takes `nameShort ?? name`; every surface that
   * searches or cites one takes `name`.
   */
  nameShort?: string;
  /**
   * The same case, said in Ukrainian.
   *
   * Not a translation of the citation and not a replacement for it: the
   * caption is what the case is filed as and it does not change language. This
   * is the line a Ukrainian reader needs beside it, because the surfaces that
   * list these rows are Ukrainian and the rows are not – the map's «Які саме»
   * block put twenty-two English arbitration styles, forty words apiece, into
   * a card whose every other word was Ukrainian.
   *
   * Ukrainian only, and optional. A row whose caption is already Ukrainian
   * needs nothing, and the English locale never shows this: there the citation
   * is in the reader's own language and a second line would be a repetition.
   *
   * NEEDS THE OWNER'S REVIEW where a name had to be rendered rather than
   * copied – the company names in the PCA arbitrations are transliterated back
   * from the English caption and the statutory Ukrainian name may differ, and
   * the ICC warrants are given as the first and last name the Court's own
   * warrants use, without the patronymic.
   */
  nameUk?: string;
  type: Localized;
  /** Procedural posture. Omitted where the record does not fix one. */
  stage?: CaseStageKey;
  /** What the forum issued. Omitted where the record names no act. */
  outcome?: CaseOutcomeKey;
  /** Full status wording. */
  status: Localized;
  /** Year the proceeding was commenced (docket year), not the decision year. */
  year: number | null;
  /**
   * Date of the operative decision, where the record fixes one on this row.
   * For the summarised cases the date comes from the summary's `judgment.date`
   * instead, so it is never transcribed twice; nothing sets this today.
   */
  decidedOn?: CaseDate;
  /**
   * Amount at stake in USD – the sum claimed, not the sum awarded.
   *
   * That is what the field is labelled as everywhere it renders («Сума у
   * спорі» / "Amount in dispute"), and it is the only meaning that works
   * across all thirty-three rows: twenty-five of them have no award to state.
   *
   * TWO ROWS DISAGREE WITH THAT AND NEED THE OWNER. `pca-28` (DTEK) holds
   * 207,800,000, which is exactly the sum awarded – its own write-up records
   * the claim as ≥ USD 421,198,000. `pca-23` (Oschadbank) holds 1,100,000,000,
   * which is the award of 1,111,300,729 rounded. Neither claim figure can be
   * sourced from this repository for both rows, so nothing was changed: a
   * registry that sorts and filters on this column must not have two of its
   * rows quietly measuring something else, and picking a number to make the
   * column consistent would be worse than the inconsistency.
   */
  amountUsd: number | null;
  /** Short context / docket reference. */
  note: Localized;
  /**
   * Page count of the decision, if known – four of the thirty-three.
   *
   * It has a surface now: `components/cases/CasePending.tsx` prints it as
   * «Обсяг рішення» on the page of a proceeding that has no write-up yet,
   * where how long the unread document is turns out to be worth saying. That
   * covers one of the four (pca-20); the other three – icj-1, icj-2, ecthr-5
   * – carry a summary, and there the figure the page prints is
   * `judgment.pages`, a different field. The checker holds the two together
   * where a row has both.
   */
  pages: number | null;
  /** Link to the decision or case page. */
  decisionUrl: string | null;
  /**
   * What is actually at the other end of `decisionUrl`.
   *
   * The button offering it says "Документ суду", and for a while everything it
   * pointed at was one. It cannot stay that way: of the seventeen records that
   * had no link, only some can be given the decision itself. Five of the
   * Crimea arbitrations keep their awards confidential and the most the
   * tribunal has published is a press release; two proceedings do not exist
   * yet and the only public account is the claimant's own notice; one is
   * traceable solely through a case database; one is known only from the
   * national broadcaster because the prosecution's page is unreachable.
   *
   * Those are all worth linking and none of them is a court document. The kind
   * travels with the link so the label can say what the reader is about to
   * open, rather than promising a judgment and delivering a press release.
   *
   * Omitted where the link is the decision or the forum's own case page, which
   * is what the default label already describes.
   */
  decisionUrlKind?:
    | "press-release"
    | "case-page"
    | "party"
    | "database"
    | "report";
  /** Slug of the on-site decision page, when a summary has been published. */
  summarySlug?: string;
  /** True once a summary/timeline/documents exist ("lit" vs merely registered). */
  lit: boolean;
}

/** A headline statistic in the intro band. */
export interface Stat {
  value: string;
  label: Localized;
  gilt?: boolean;
}

/** A partner organisation. */
export interface Partner {
  id: string;
  name: Localized;
  /** One or two sentences saying who they are and what the tie to this
   *  archive is. The name above stays as the partner writes it – a mark that
   *  spells "Institut für Auslandsbeziehungen" must not be captioned with a
   *  translation of itself – so any gloss a reader needs belongs here. */
  blurb?: Localized;
  logo?: string;
  url?: string;
}

/**
 * One outbound link inside the about prose.
 *
 * `text` is a literal substring of one of the paragraphs, not a separate
 * label: the sentence names the document – «резолюція «Територіальна
 * цілісність України»» – and the name itself is what the reader clicks. A
 * `text` that no paragraph contains renders as nothing, which is why
 * `checkAbout` in content/about.ts fails the build on one.
 */
export interface AboutLink {
  text: string;
  href: string;
}

/** "About the library" prose, per locale. */
export interface AboutContent {
  title: Localized;
  paragraphs: Localized<string[]>;
  /** Optional; absent means the paragraphs are plain text. */
  links?: Localized<AboutLink[]>;
}
