/**
 * Decision-summary content model.
 *
 * The prose is authored elsewhere (the source .docx) and ingested VERBATIM into
 * `*.verbatim.json` – never edited by hand. A sibling module adds a thin
 * visualization layer (facts, timeline, verdict matrix, theatres) whose every
 * value is traceable to a statement in that same verbatim text. Components read
 * `DecisionSummary`; a future Payload collection will return the same shape.
 */

/** One block of the verbatim summary, tagged with its structural role. */
export type SummaryBlockKind =
  | "lead" // opening paragraph
  | "h2" // numbered top-level heading
  | "h3" // sub-heading
  | "h4" // (a)/(b)/(c) label
  | "p" // body paragraph
  | "dispositif" // an operative finding in the Court's disposition
  | "findings" // a multi-part findings table (newline-separated blocks)
  /**
   * What the forum held on the point above, set apart from the argument that
   * led to it – the page gives it its own ground and a gold edge.
   *
   * A kind rather than a guess. The write-ups do mark these: the paragraph
   * opens «Суд доходить висновку, що…», "The Court concludes that…". But a
   * rule that promoted a leading phrase or a leading verb was measured over
   * all 390 paragraphs in the archive and fired on 18, of which 4 were the
   * thing wanted; the rest were ordinary sentences, and one of them cut
   * «On 23 June 2016, the PCA received from H.E» at the initials. Guessing
   * at legal prose damages it, so the seam is recorded instead.
   */
  | "position"
  /**
   * One party's argument on the point the heading above it names.
   *
   * A run of these – each with its own h3 – is set as one row of boxes on a
   * hairline grid rather than as a stack of headings and paragraphs. Two
   * claims side by side are compared; stacked, they are only read in turn,
   * which is the wrong shape for «Вимоги України за ICSFT» and «…за CERD».
   *
   * A kind rather than a guess, for the same reason `position` is one: the
   * write-ups do not mark which of their paragraphs are a party's case in a
   * way any rule could find without damaging the prose.
   */
  | "claim"
  /**
   * The write-up speaking in its own voice, about what the Court just did.
   *
   * «Іншими словами, Суд розмежував два висновки: заборона Меджлісу не
   * становить порушення CERD по суті – але вона становить порушення Наказу
   * про тимчасові заходи.» That sentence is the most useful one on the page
   * and it was set exactly like the Court's own, so a reader had no way to
   * tell whose distinction it was. Marked, it is set apart as ours.
   */
  | "note"
  /**
   * What is in dispute under the instrument the claim beside it is brought
   * under – the half of «Предмет спору» that belongs to this column.
   *
   * The write-up states both aspects of the subject-matter in one paragraph
   * and then states Ukraine's claims under each instrument separately, so
   * the same division – ICSFT, then CERD – is drawn twice, ten lines apart,
   * and a reader has to hold the first half in their head to read the
   * second. Split at the author's own sentence boundary and seated with the
   * claims it is about, each column says what was in dispute and what was
   * asked. Not a word changes.
   */
  | "subject"
  | "link"; // a source / further-reading URL

export interface SummaryBlock {
  kind: SummaryBlockKind;
  text: string;
  /**
   * What the contents rail does with this heading. `h3` only.
   *
   * Absent, an h3 is listed under its part with its own words. `false` keeps
   * it out, and a string lists it under that label instead.
   *
   * The rail is not a list of every heading in the prose – it is a list of
   * places a reader jumps to. «Висновки за CERD» heads a band of eight
   * findings and is one; «Предмет спору» titles a single paragraph read in
   * order and is not. Nothing in a heading says which it is, so it is
   * recorded rather than guessed – and the default is to list it, so a
   * write-up nobody has been through keeps the navigation it had.
   *
   * A string also lets the rail be shorter than the text: «Наказ про
   * тимчасові заходи від 19 квітня 2017 року» is the heading the Court's
   * text gives, and a 46-character line in a 250px rail wraps to three.
   */
  nav?: string | false;
  /**
   * How the forum disposed of the point this heading opens. `h4` only.
   *
   * The (a)/(b)/(c) limbs of the Order on provisional measures each got an
   * answer – breached, not breached, breached – and the write-up gives each
   * answer in a quotation several paragraphs down. The index at the top of
   * the page already carries all three; here the heading carries its own, in
   * the same word and the same chip the index uses.
   *
   * Recorded, not read out of the prose: the answer is in the Court's quoted
   * words and a rule that went looking for it there would be guessing at
   * legal meaning, which this page does not do.
   */
  /**
   * What this limb of an order actually required. `h4` only.
   *
   * The write-up quotes the Order's measures once, together, in one
   * paragraph of § 376, and then discusses each limb under a heading as
   * terse as «(a) Меджліс». Between the quotation and the discussion a
   * reader has to carry three measures in their head to know which one is
   * being answered. Stated on the heading, each limb says what was ordered
   * before it says what happened.
   */
  measure?: string;
  outcome?: Outcome;
  /**
   * How each finding in a `findings` block went, in the order its head lines
   * appear. `findings` only.
   *
   * One entry per head, and data-check holds them to that count – an array
   * keyed by position is only honest while something is counting.
   *
   * Read out of the write-up, not out of a rule. Ten of this decision's
   * twelve findings end on the Court's own formula – «Суд доходить висновку,
   * що не було встановлено, що…» – and two (law-enforcement measures,
   * culturally significant gatherings) do not; those two rest on the
   * dispositif, which rejects every claim under each convention but the one
   * it upholds. Neither reading belongs in a regular expression.
   */
  /**
   * The name of each finding in an enumerated block, in the author's order.
   *
   * The archive has one device for a finding that carries its own answer –
   * a head, a result chip beside it, and the exchange under it – and it was
   * reachable by exactly one decision out of eight, because the renderer
   * found its heads by looking for the literal strings «ICSFT –» and
   * «CERD –» at the start of a line. Four decisions record their findings as
   * a list the author already numbered – the ECtHR's ten violations by
   * article, MH17's two charges, Finland's five counts, DTEK's four
   * objections – and none of them could say how any single one of them went.
   *
   * So the head is recorded rather than guessed, which is the rule this
   * archive keeps everywhere else. One entry per enumerated line, and
   * `outcomes` then runs parallel to it. Absent, nothing changes: the block
   * renders as it did.
   */
  heads?: string[];
  /** How each finding in this block went – one per head, in order. */
  outcomes?: Outcome[];
  /**
   * The head of the column this block opens. `subject` only.
   *
   * This case is two cases: a terrorism-financing claim about eastern
   * Ukraine under the ICSFT, and a racial-discrimination claim about Crimea
   * under CERD. The page says so three times – in the theatres, on the map,
   * in the index – and said it nowhere at the point where the two tracks are
   * introduced, so the reader met two columns of prose and had to work out
   * from the sentences that they were parallel.
   *
   * Both values restate `theatres` in summaries/*.ts, which is the record
   * for this join; nothing here is new about the case. They are per-locale
   * because the blocks are.
   */
  instrument?: string;
  /** The theatre that instrument's claim is about – see `instrument`. */
  place?: string;
}

/** Raw verbatim payload as ingested from the .docx (shape of the JSON file). */
export interface VerbatimSummary {
  id: string;
  caseId: string;
  masthead: { official: string; parties: string; judgment: string };
  /** Source-language body (English – the language of the judgment). */
  blocks: SummaryBlock[];
  /**
   * Ukrainian translation of the body. Still a draft pending legal review –
   * that remains true and is why the field is documented this way.
   *
   * It is deliberately NOT surfaced to the reader. A notice saying so was
   * rendered on every Ukrainian decision page and the owner had it removed:
   * how the faculty's own translations are reviewed is her editorial process
   * to describe, not this site's to announce. Do not put the notice back on
   * the strength of this comment – the fact being true is not the question.
   */
  blocksUk?: SummaryBlock[];
}

import type { Localized } from "@/content/types";

/** A headline metric tile for the outcome dashboard. */
export interface Stat {
  /** A bare numeral reads the same in both locales; anything with a word in
   *  it ("$1.1B" / "$1,1 млрд") must be localized. */
  value: string | Localized;
  label: Localized;
  /** Give this tile the accent treatment – one per dashboard. */
  em?: boolean;
  /**
   * A qualification on the figure, set under it with an asterisk on the
   * number.
   *
   * For the case where a count is exact but not complete, and saying the bare
   * number would overstate what is known. The review asked for one on the
   * ICC's arrest warrants – «додати вказівку з зірочкою, що це 6, про які
   * публічно відомо» – and the distinction it draws is the important one: the
   * note says what *we* know, not what the Court does. A claim about the
   * Court's own practice would need a source; this needs only honesty about
   * the figure's edge.
   */
  note?: Localized;
}

/**
 * A single key/value fact for the "at a glance" instrument.
 *
 * ── The order is the contract ──────────────────────────────────────────────
 * Every card reads in the same sequence, so a reader who learns its shape on
 * one decision can carry that to the next. Skip what a case does not have;
 * never reorder what it does:
 *
 *   1. the sides        – who brought it, who answers
 *   2. the forum        – the institution, its composition, where it sat
 *   3. the basis        – the rules or the head of jurisdiction it runs on
 *   4. the identifier   – the docket, the applications, the situation number
 *   5. the period       – what stretch of events the case is about
 *   6. the dates        – filed, heard, decided
 *   7. what it settled  – votes, status, what survives, what was cut off
 *
 * The cards were authored in whatever order each was written: one opened with
 * the parties, another with the docket number, a third with the situation. The
 * genocide case put five outcome facts among its identifiers, which is why its
 * card ran to eleven entries reading as one undifferentiated list; under this
 * order they fall to the end where they belong.
 *
 * Labels are NOT normalised across cases, and that is deliberate. «Установа»,
 * «Суд» and «Орган» name three different kinds of body – an arbitral
 * institution is not a court and a Pre-Trial Chamber is neither. «Загальний
 * список», «Номер справи» and «Ідентифікатор» are the ICJ's General List, the
 * PCA's case number and an ECLI: each registry's own name for its own
 * reference. Flattening those would make the cards look consistent by making
 * them less accurate.
 */
export interface GlanceFact {
  label: Localized;
  value: Localized;
}

/** A dated event for the timeline instrument. */
export interface TimelineEvent {
  date: Localized;
  label: Localized;
  kind?: "filing" | "order" | "judgment" | "context";
  /**
   * Optional filter group for the interactive timeline (e.g. "arbitration",
   * "french-courts"). Events without a track render in every filter.
   */
  track?: string;
  /** One sentence of detail, revealed when the reader opens the entry. */
  note?: Localized;
  /** Sort key, ISO 8601 – the visible `date` may be a range or a month. */
  iso?: string;
}

/** A named filter for the interactive timeline. */
export interface TimelineTrack {
  id: string;
  label: Localized;
}

/**
 * How a claim was disposed of. `violation`/`no-violation` are the court-style
 * pair; `granted`/`rejected`/`not-decided` fit an arbitral dispositif, where a
 * tribunal may uphold jurisdiction, reject an objection, or leave alternative
 * claims undecided for judicial economy.
 */
export type Outcome =
  | "violation"
  | "no-violation"
  | "granted"
  | "rejected"
  | "not-decided"
  // criminal verdicts (national courts trying individuals)
  | "convicted"
  | "acquitted";

/** One measured quantity in the "what was taken" instrument. */
export interface Metric {
  label: Localized;
  /** Localize anything a locale writes differently ("16.5%" / "16,5%"). */
  value: string | Localized;
  /** Share of a whole, 0–100 – draws a bar instead of a plain figure. */
  percent?: number;
  /**
   * What the unfilled part of that bar is.
   *
   * A share of something terrible has two sides and the bar was only drawing
   * one: 9.5% of the deported children returned read as a small gold gain on
   * an empty track, when the finding is the 90.5% still held. Naming the
   * remainder gives the empty part of the bar its meaning.
   *
   * Deliberately a label and not a number. The whole it is a share of is
   * often itself a floor – "19,546+" – so subtracting would state an exact
   * figure that no source does.
   */
  restLabel?: Localized;
  /** Countable units – draws one mark per unit (capped in the component). */
  count?: number;
  /**
   * This figure is a part of the one declared before it.
   *
   * The two were separate tiles in a two-column grid, which put the whole and
   * its share side by side with nothing saying so – and set the eye reading
   * down the left column instead, where «19 546+ дітей» was followed by «2
   * держави не виконали ордер», a different subject entirely. The band said
   * three unrelated things in no order.
   *
   * Marked as a part, the figure is drawn inside the tile of the whole it
   * divides, under it, and the pair takes the full width. The sequence then
   * reads: скільки вивезено → скільки з них повернуто → і лише потім
   * окремий предмет, виконання ордерів. Owner: «не зрозуміло що ми хочемо
   * сказати. Послідовності інформації».
   */
  partOfAbove?: boolean;
  /**
   * The subject this figure belongs to, written on the first of its run.
   *
   * «Що було втрачено» held six figures of four different kinds: what the
   * bank *was* in Crimea – 294 outlets, 45% of lending, 16.5% of deposits –
   * and what was *taken* – the ActivSolar facilities, 85 leases, the cash and
   * gold seized in the raids. The heading promises the second; half the grid
   * answers the first, and nothing stood between them. Named, the two runs
   * stop being one undifferentiated field of numbers.
   */
  group?: Localized;
  note?: Localized;
  /**
   * Another measure of the same quantity, where the sources disagree.
   *
   * «19 546+» is what the official database holds; ombudspersons put the
   * number of children at 150,000–300,000. That is not a footnote about
   * the figure, it is a second figure – an order of magnitude larger – and
   * it was buried in a note under a caveat about where the numbers come
   * from, where a reader met it after they had already taken 19,546 as the
   * answer. It belongs to the metric it disagrees with.
   */
  alt?: {
    label: Localized;
    value: Localized;
  };
}

/** A sum of money the decision turns on, optionally split into parts. */
export interface MoneyFigure {
  /**
   * This figure is not part of what the forum decided.
   *
   * «Суми» stood under «Що вирішив арбітраж» and held four figures, two of
   * which the tribunal never decided: the award's value with interest accrued
   * to 2025 – the tribunal set the rate, someone else did the arithmetic, and
   * the row is marked `estimated` and labelled «за даними 2025 року» – and the
   * €87 million attached in France in April 2025, which is a different forum,
   * a different year and enforcement rather than a holding. Owner: «чи це
   * дійсно те що вирішив суд?». It is not.
   *
   * Marked, they are drawn with what came after the award instead, and each
   * scale then compares like with like: the seizure no longer reads as a
   * fraction of a dollar award it is not denominated in.
   */
  after?: boolean;
  label: Localized;
  /** Display value, already formatted; localize when locales format it differently. */
  display: string | Localized;
  /** Magnitude, used to scale the bars. Same unit as `currency`. */
  amount: number;
  /**
   * The unit `amount` is in. Omitted means USD, which every award here is.
   *
   * A figure in another currency cannot be drawn against the others: the
   * French seizure is recorded in euros because that is the currency the
   * seizure is in, and converting it would invent a rate and a date. Naming
   * the currency lets the component leave that figure off the shared scale
   * instead of drawing a bar and printing a share that compares two units.
   */
  currency?: "USD" | "EUR";
  parts?: { label: Localized; display: string | Localized; amount: number }[];
  /** Render as an open-ended / estimated bar rather than a solid one. */
  estimated?: boolean;
  note?: Localized;
}

/** A body whose conduct was attributed to the respondent State. */
export interface AttributionNode {
  actor: Localized;
  /** The rule relied on, e.g. "ILC art. 4". */
  basis: string;
  basisNote: Localized;
  did: Localized;
}

/** One vote in an operative clause: a majority against a minority. */
export interface Vote {
  for: number;
  against: number;
  /** What this vote covered, when one claim was voted on more than once. */
  scope?: Localized;
}

/** A jurisdictional objection and how it fared. */
export interface Objection {
  ground: Localized;
  /** Latin tag, e.g. "ratione temporis". */
  latin?: string;
  objection: Localized;
  outcome: "rejected" | "upheld";
  reasoning: Localized;
  /** How the bench divided, where the dispositif records a vote. */
  votes?: Vote[];
}

/** One charge on an arrest warrant, tied to its Rome Statute article. */
export interface Charge {
  /** Statute article, e.g. "8(2)(a)(vii)". */
  art: string;
  label: Localized;
  /** "war-crime" | "crime-against-humanity" – sets the chip colour. */
  kind: "war-crime" | "cah";
}

/** One suspect on a warrant of arrest. */
export interface WarrantPerson {
  name: Localized;
  role: Localized;
  born?: string;
  charges: Charge[];
  /** Modes of individual responsibility, e.g. "25(3)(a)". */
  modes: { art: string; label: Localized }[];
  /** Rung of the chain of command this person sits on (index into `rungs`). */
  rung?: number;
}

/** One wave of warrants issued the same day on one theory of the case. */
export interface WarrantWave {
  /** Which accusation line this batch belongs to – see `lines`. */
  line?: string;
  date: Localized;
  iso: string;
  theme: Localized;
  /** What the wave is about, in one sentence. */
  summary: Localized;
  persons: WarrantPerson[];
  /** The Court's announcement of this wave. */
  url: string;
}

/** One step in the life of a decision after it was rendered. */
export interface Stage {
  /**
   * The chronology entry this step is, where the page carries one.
   *
   * The French rounds are told twice on Oschadbank – as four dated events in
   * the chronology and as four cards here – and the two tellings are not
   * redundant: the chronology says when, these say whether the award was
   * standing after it. What was missing was the seam between them. With an
   * iso the year becomes a link into the chronology, the way the verdict
   * index already links to it. Owner: «роби всі три».
   */
  iso?: string;
  year: string;
  title: Localized;
  note: Localized;
  /** Did this step keep the decision standing? */
  standing: "yes" | "no";
}

/** A geographic theatre the case concerns, anchored to the map. */
export interface Theatre {
  place: Localized;
  /**
   * Short over-title tag on the map – a treaty acronym ("CERD"), a campaign
   * ("ЕНЕРГОСИСТЕМА") or a scene ("МІСЦЕ ПУСКУ"). Localize words; acronyms
   * stay strings. (Named `treaty` until the tags outgrew treaties.)
   */
  tag: string | Localized;
  /** Map marker key in `ukraine-map.json` this theatre highlights. */
  markerKeys: string[];
  /**
   * What each of those marks is called, index-parallel to `markerKeys`.
   *
   * The marks were unnamed circles: a reader saw five dots in the east and
   * had no way to learn that one of them is Kherson. The theatre's own name
   * sits over the group and answers a different question – what the case is
   * about there, not where there is. Owner: «жодна точка не підписана –
   * Київ, Херсон, Запоріжжя, Донбас, Крим лишаються безіменними кружечками;
   * підпиши».
   *
   * `dx`/`dy` nudge a name off its mark in projection units, for the two or
   * three places where five names in one oblast-width would otherwise sit on
   * each other. Absent, the name sits above its mark.
   */
  markerNames?: { label: Localized; dx?: number; dy?: number }[];
  /**
   * Whether this theatre's ground is those points or the whole of an area.
   *
   * «Два театри, але другий театр – це ж не одна точка»: the missile campaign
   * against the grid is not a place at all – the summary itself says «по всій
   * країні» – and it was drawn as a single dot beside Kyiv, sitting in a row
   * with five occupied oblasts as though it were a sixth. With "area" the
   * dots are not drawn: the ground carries the theatre, the beam ends in it,
   * and the name stands over the country rather than over a point in it.
   */
  ground?: "points" | "area";
  /**
   * The ground this theatre is about, where a dot is not the whole truth.
   *
   * The map drew every theatre as a point with a halo, and most of them are
   * not points: «Крим», «Донбас із 2014», «Східна Україна», «Окуповані
   * території», «Уся Україна з 2022» are territories, and a dot standing for
   * one is a claim the record does not make. The dot stays – a reader needs
   * somewhere to look – and the ground behind it lights.
   *
   * "country" is Ukraine's own outline; the rest name a path in
   * `ukraine-map.json`'s `areas`. Several, because a theatre can be about more
   * than one: the ICC's deportations are the occupied territories, which is
   * Crimea and the east together.
   *
   * NOT SET where the record really does fix a point, and two of the eleven
   * do: the Buk's launch site at Pervomaiskyi in the MH17 judgment, and the
   * ambush on the Aidar battalion that Finland tried Petrovsky for. Lighting a
   * territory for either would be the same error in the other direction.
   */
  areas?: ("country" | "crimea" | "east")[];
  summary: Localized;
  /** Nudge the label off a collision with the seat, a city or a neighbour. */
  labelDx?: number;
  labelDy?: number;
}

/** A treaty the case turns on, linked to its official text. */
export interface Instrument {
  /** Short label; localize when it is a phrase ("КК Фінляндії"), not an acronym. */
  abbr: string | Localized;
  name: Localized;
  year: number;
  /** Official published text of the convention. */
  url: string;
}

/** The judgment itself, on the court's own site. */
export interface JudgmentSource {
  court: Localized;
  /** Direct link to the judgment document (PDF). */
  url: string;
  /** The court's case-overview page. */
  caseUrl: string;
  /**
   * What `url` actually points at, when it is NOT the court's own text of the
   * decision. Same vocabulary as `Citation.type` ("blog post",
   * "news/insight", …), and normally the very entry in `sources` that carries
   * this URL, so the page can name its publisher.
   *
   * Absent means the link is the court's own document, and the page says so:
   * it prints `court` under the button and tells search engines, through
   * `isBasedOn`, that the article is based on that document. A summary whose
   * judgment is not published must set this, or the page will caption a blog
   * post with the name of a court – which is what finland-torden did.
   */
  urlType?: string;
  /** The same, for `caseUrl`. Absent means the court's own case page. */
  caseUrlType?: string;
  /** Delivery date as ISO 8601 (YYYY-MM-DD) – used in structured data. */
  date: string;
  /** Label for the primary action, when "read the judgment" does not fit. */
  readLabel?: Localized;
  /** Label for the secondary action (the institution's case file). */
  fileLabel?: Localized;
}

/** The institution that decided, and where it sat – shown in the masthead. */
export interface Forum {
  /** Institution, e.g. "Permanent Court of Arbitration". */
  institution: Localized;
  /** Seat of the proceedings, e.g. "Paris". */
  seat: Localized;
}

/** Plain-language framing for non-lawyers. */
export interface PlainLanguage {
  /** 2–3 sentence "what this is and how it ended", in everyday words. */
  tldr: Localized;
}

/** A doctrinal ruling the Court settled on a point of law. */
export interface Interpretation {
  term: Localized;
  ruling: Localized;
}

/** A provisional measure from the interim Order and its compliance finding. */
export interface ProvisionalMeasure {
  measure: Localized;
  order: "violated" | "complied";
  note?: Localized;
}

/** A cited commentary or analysis, with bibliographic metadata. */
export interface Citation {
  url: string;
  title: string;
  /**
   * Optional: a wire report or an institutional page has no byline, and the
   * agency's name belongs in `publication`. Filling both with it printed
   * «Interfax-Ukraine · Interfax-Ukraine · 2025». The renderer already drops
   * empty parts of the meta line.
   */
  authors?: string;
  publication: string;
  date: string;
  /** "blog post" | "journal article" | "news/insight" | "preprint/repository" */
  type: string;
}

/**
 * Everything a decision page renders.
 *
 * The required fields are the ones every decision has: prose, parties, a
 * dispositif, a date. The optional ones are instruments a particular decision
 * earns – an inter-State judgment brings provisional measures and treaty
 * theatres; an investment award brings money, attribution and a set-aside
 * history. A page renders only the instruments its case actually fills.
 */
export interface DecisionSummary extends VerbatimSummary {
  /**
   * Localized display title for the masthead H1 and page metadata. The
   * verbatim masthead stays English (the language of the record); the H1 is
   * chrome, and a UA reader should not lose the page's headline. `en`
   * normally repeats the verbatim parties line.
   */
  title?: Localized;
  /**
   * The page's name for a browser tab, a search result and a shared link –
   * `<title>`, `og:title`, the Article `headline`. Only where the full title
   * runs past what a result shows (about 60–70 characters): the two ICJ
   * cases carry a whole convention in their names, and a result cut after
   * «Застосування Міжнародної конвенції про боротьбу з…» never reached the
   * court. The page itself keeps the full title in its H1, and the structured
   * data keeps it as `alternativeHeadline` – a lawyer searches by the full
   * caption, and it has to be there to be found.
   */
  seoTitle?: Localized;
  /**
   * The masthead's two verbatim lines, said in Ukrainian.
   *
   * `masthead.official` and `masthead.judgment` come out of the verbatim
   * ingest and are the decision's own words: the caption it files itself under
   * and the line naming what it is and when. They are the record and they stay
   * English in `masthead` – the citation block reproduces them unchanged,
   * because a citation that translates a caption cannot be looked up.
   *
   * But they are also the two largest pieces of type under the H1, and on the
   * Ukrainian page they read as eight lines of English capitals. This is the
   * Ukrainian rendering, shown in the masthead only: `official` under the
   * title, `judgment` in the eyebrow beside the forum and the seat. Where a
   * treaty or a court has an established Ukrainian name it is used – «Угода
   * … про заохочення та взаємний захист інвестицій», «Арбітражний регламент
   * ЮНСІТРАЛ» – rather than a fresh translation of the English.
   *
   * NEEDS THE OWNER'S REVIEW: these are renderings, not official texts.
   */
  mastheadUk?: { official?: string; judgment?: string };
  /**
   * The three lines of the share card, /og/cases/<slug>.png – Ukrainian only,
   * because one card serves both locales.
   *
   * The card is drawn at build time by scripts/og-cards.mts. Each part left
   * empty is derived, so a summary made in the admin still gets a card:
   *   title   ← `seoTitle` up to « – », else `title`
   *   eyebrow ← the forum's institution · `mastheadUk.judgment`
   *   kicker  ← the accented stat tile, value and label
   * The derivation is presentable, not good: the full ICJ captions run to
   * three lines of 64px and end in «…», and «0 підозрюваних під вартою» is
   * a fact but not the headline. Written by hand, the title is the case as a
   * reader would say it, the eyebrow the court and the date, the kicker the
   * one result that makes the link worth opening.
   */
  card?: { title?: string; eyebrow?: string; kicker?: string };
  /**
   * Date the page's context layer was last verified against its sources
   * (ISO 8601). For live dockets – an ICC situation, an enforcement stage –
   * it renders next to the out-of-record figures and feeds `dateModified` in
   * the structured data.
   */
  asOf?: string;
  /**
   * Search-result description, under 160 characters in both locales.
   *
   * `plain.tldr` used to serve as this, and it is a three-to-four-sentence
   * paragraph: every decision page's snippet ran 300–496 characters and was
   * cut off mid-sentence. Written from the same record the tldr is written
   * from – what the case is and how it ended – not from marketing copy.
   */
  metaDesc?: Localized;
  plain: PlainLanguage;
  judgment: JudgmentSource;
  instruments: Instrument[];
  stats: Stat[];
  glance: GlanceFact[];
  timeline: TimelineEvent[];
  interpretations: Interpretation[];
  sources: Citation[];

  /** Institution and seat; defaults to the ICJ in The Hague when absent. */
  forum?: Forum;
  /**
   * Which bands the page renders. Absent → all of them.
   *
   * `"four"` leaves the full summary, the chronology, the map and the
   * sources, and nothing else. It exists because the corrections document
   * asks for exactly that on one decision – «ЗАЛИШАТИ ХРОНОЛОГІЮ, МІСЦЕ
   * РОЗГЛЯДУ, ОГЛЯД ТА ДЖЕРЕЛА» – and then, once it had been applied to all
   * eight, the owner asked for the rest to be put back: «поверни назад блоки
   * в рішення де не просять прибрати секції». So it is a per-decision
   * choice, made in the data, not a rule of the template.
   *
   * The one decision is `icj-genocide`, which is where that line stands in
   * the document. It sat on `icj-cerd-icsft` for a while, and that was a
   * misreading of which block of the document the line belonged to – the
   * same document asks the opposite for that page, «а потім би вже йшли
   * вкладки про тлумачення, тимчасові заходи тощо». Check the decision the
   * instruction is under, not the decision nearest the cursor.
   *
   * The edits that were asked for site-wide are NOT here: «Хто є хто» and
   * «Часті запитання» are gone from the template for every decision, as are
   * the reading-time estimate and the PDF page count.
   */
  bands?: "four";
  /**
   * Which part of the write-up the map closes, counting h2s from nought.
   *
   * The map answers «де це було», and it answers it where the reader has just
   * been told what happened – at the end of the factual part. Which part that
   * is differs: five write-ups open with it, oschadbank puts the procedural
   * history first, and three have no factual part at all (the charges, the
   * prosecution's position, jurisdiction in the situation). Where this is
   * absent the map closes the whole write-up.
   *
   * Recorded, not matched. The first version of this read the heading text –
   * `/(фактичн[іи] обставин|the facts)/` – and it worked in Ukrainian and
   * matched nothing at all in English, because the English write-ups say
   * «Factual background». Four decisions drew the map in the middle of the
   * page in one language and at the foot of it in the other. That is the
   * failure `position` and `heads` above are each written to avoid, in the
   * same words: the archive records the seam rather than guessing at it.
   *
   * The number is an index into the parts, so it is the same in both
   * languages by construction – the two renderings of a write-up carry the
   * same sections in the same order, which `data-check` enforces.
   */
  mapAfterPart?: number;

  /**
   * Individual sections this decision does not render, by the id the band
   * carries on the page.
   *
   * The opposite instrument to `bands`, and the one the corrections actually
   * ask for most often. `bands: "four"` is a whitelist – it names the four
   * that stay and silences everything else, so putting one section back means
   * putting all of them back. When the owner asked for the submissions matrix
   * on icj-genocide while still wanting «Забрати Key rulings on the law» and
   * «Забрати Overview – не має ніякої цінності», a whitelist could not say it.
   *
   * Ids are the section ids in `pageSections`, which are also the anchors the
   * contents rail links to – the union below is the list. The write-up, the
   * chronology, the map and the sources are not among them: a decision page
   * without its own text is not a page. Nor is "related", which left the
   * template altogether in 49de66a; a band no decision draws is not a band
   * this list can hide.
   *
   * Hiding a section hides its chip in the contents too, and the ground
   * alternation closes over the gap, so no band is left stranded on the same
   * paper as its neighbour.
   */
  hideSections?: Array<
    | "overview"
    | "rulings"
    | "measures"
    | "machinery"
    | "scale"
  >;
  /**
   * What to call the forum's own voice, where «Суд» is wrong.
   *
   * The gold box over a holding is captioned «Позиція Суду» on every page.
   * Two of the eight were decided by an arbitral tribunal under UNCITRAL
   * rules – Oschadbank and DTEK Krymenergo – and there the caption names an
   * institution that did not sit: the Permanent Court of Arbitration
   * administers the case, it does not decide it, and the body that decided
   * is a tribunal of three. The page says «Трибунал» in its own prose and
   * «Суд» in the caption over the same paragraph.
   */
  positionLabel?: Localized;
  /** Filters for the timeline. Absent → a plain, unfiltered timeline. */
  timelineTracks?: TimelineTrack[];
  provisionalMeasures?: ProvisionalMeasure[];
  /**
   * Which Order these provisional measures come from – the sub-label of the
   * instrument. Required whenever `provisionalMeasures` is set (enforced in
   * `summaries/index.ts`): the template used to hardcode "Order of 19 April
   * 2017", which was right only for as long as icj-cerd-icsft was the only
   * page with the instrument.
   */
  provisionalMeasuresOrder?: Localized;
  theatres?: Theatre[];
  /**
   * Map framing: which marker is the seat, and where the reach line points.
   * Defaults to The Hague → Kyiv. The labels come from `forum`.
   */
  mapFocus?: { forumKey: string; reachTo?: string };
  takings?: {
    heading: Localized;
    /**
     * The band's own argument, at reading size, before the figures.
     *
     * It used to be the last line of the band in caption grey: «кримська
     * філія була другою за депозитами і першою за кредитуванням на
     * півострові. Примусове закриття прибрало найбільшого кредитора регіону
     * за один квартал». That is the thing the figures are evidence for, and
     * it was set as a footnote to them.
     */
    lead?: Localized;
    note?: Localized;
    metrics: Metric[];
  };
  attribution?: {
    respondent: Localized;
    note: Localized;
    /**
     * The routes, in the order they should be drawn.
     *
     * The nodes carry a `basis` each – "ILC art. 4", "ILC art. 8" – and those
     * are not five parallel facts but two doctrinal routes with three bodies
     * on one and two on the other. The drawing showed five equal siblings, so
     * the only thing worth drawing a tree for was the thing it did not draw.
     *
     * The labels are not authored here: they are lifted out of `note`, which
     * already said "article 4 for organs of the State, article 8 for conduct
     * directed or controlled by it". Promoting them to a field lets the stems
     * carry what the paragraph underneath was carrying alone.
     */
    routes?: { basis: string; label: Localized }[];
    nodes: AttributionNode[];
  };
  amounts?: { note?: Localized; figures: MoneyFigure[] };
  objections?: {
    heading: Localized;
    note: Localized;
    items: Objection[];
    /** Judges sitting, so a vote reads as a proportion of the bench. */
    benchSize?: number;
  };
  afterlife?: { heading: Localized; note: Localized; stages: Stage[] };
  /**
   * Warrants of arrest – the core instrument of an ICC page. `waves` group the
   * suspects by issuance date and theory of the case; `rungs`, when present,
   * name the levels of the chain of command and turn the wall into a ladder:
   * one spine of power, each suspect pinned to their rung, coloured by wave.
   */
  warrants?: {
    heading: Localized;
    note: Localized;
    waves: WarrantWave[];
    rungs?: Localized[];
    /**
     * The lines of accusation, each with its own ladder.
     *
     * The band drew one vertical and called it one: «Шість ордерів – одна
     * вертикаль влади», from the commander-in-chief down to the commanders of
     * the aviation and the fleet. The record does not say that. The warrants
     * for the deportation of children name the head of state and the
     * children's commissioner; the warrants for the campaign against the grid
     * name the Defence Minister, the General Staff and two operational
     * commanders – and no warrant names the head of state for the grid. Two
     * verticals of two rungs each, not one of four, and the drawing was
     * asserting a chain that no document draws.
     *
     * So each line gets its own ladder and its own numbering, and the true
     * statement – how high the Court reached in each – becomes the thing the
     * reader sees. A wave points at its line with `line`.
     */
    lines?: { key: string; label: Localized; summary: Localized }[];
  };
}
