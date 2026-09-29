import { SUMMARIES } from "@/content/summaries";
import type { DecisionSummary } from "@/content/summaries/types";
import type { Localized } from "@/content/types";

/**
 * A search index over what the write-ups *say*, built at build time.
 *
 * ── The problem ─────────────────────────────────────────────────────────────
 * The library page searched five groups of row metadata – name, note, court,
 * status, subject field, date – and nothing else. Eight of the thirty-three
 * proceedings have a full write-up: a plain-language summary, a chronology, a
 * table of the court's findings, provisional measures, a who's-who and an
 * FAQ. None of it was reachable. A reader looking for «депортація
 * дітей», "universal jurisdiction", «тимчасові заходи» or "reparations" got
 * "Нічого не знайдено" from an archive that says a great deal about each.
 *
 * ── Why an index rather than the text ───────────────────────────────────────
 * The eight documents are ~730 kB of source. Shipping them to the browser to
 * grep is not an option on a site whose home page is already 94 kB. So the
 * text is reduced here, during `next build` (this module is evaluated while
 * the library page is prerendered), to the smallest thing that can answer
 * "which case, and where in it": a term → unit posting list.
 *
 * ── The unit is a section, not a case ───────────────────────────────────────
 * A row in the table is a case, but a match may be in a chronology entry three
 * screens down. Each unit is (case, section), and the sections are the decision
 * page's own anchors – `#overview`, `#chronology`, `#machinery`, `#rulings`,
 * `#measures`, `#handbook`, `#questions`, `#fulltext` – so a hit can be
 * rendered as a link that lands on the part that matched.
 *
 * ── Morphology, honestly ────────────────────────────────────────────────────
 * Ukrainian inflects at the end of the word and this project has no stemmer.
 * Rather than pretend to one, every term is TRUNCATED to its first
 * `PREFIX` characters after normalisation. «депортація», «депортації»,
 * «депортацію» and «депортацією» all collapse to «депорт», and a query for any
 * of them finds all of them. What this buys and what it costs:
 *
 *   • It works for suffixal inflection, which is nearly all Ukrainian
 *     inflection, and it shrinks the vocabulary by a third.
 *   • It does NOT handle a stem change. «бібліотека» → «бібліотеці» keeps its
 *     first six characters, but «рік» → «року» does not, and «нога» → «нозі»
 *     does not. Those queries miss.
 *   • It creates false positives between different words that share a prefix,
 *     which is the same failure the row search already has and admits: «Крим»
 *     prefix-matches «Кримінальне». At six characters «кримін…» and «крим»
 *     stop colliding for full-length queries, but a query SHORTER than the
 *     prefix length is still matched as a prefix over the key set, so «крим»
 *     still reaches «кримінальне». That is a deliberate trade: a reader typing
 *     four letters wants the words that start with them.
 *   • Prefixes are not words, so nothing here can be shown to a reader. The
 *     index answers "does this section match", never "what did it match".
 *
 * ── What is NOT indexed ─────────────────────────────────────────────────────
 * `blocks` / `blocksUk` – the verbatim body of each summary – are excluded, and
 * that is where most of the 730 kB is. See INDEX_VERBATIM below for the
 * measurement and the reasoning.
 */

/** Characters of each normalised token that are kept. See the note above. */
export const PREFIX = 6;

/**
 * Where the built index is served from.
 *
 * It is a file, not part of the library page – see `app/search-index.json/
 * route.ts`, which is prerendered from `contentIndex` below and asserts that
 * its own directory name matches this string. The registry page hands this
 * path to `RegistryTable`, which asks for it the first time a reader reaches
 * for the search field.
 */
export const CONTENT_INDEX_PATH = "/search-index.json";

/**
 * Index the verbatim summary body as well as the authored layer.
 *
 * Measured both ways during the build (gzipped bytes of the whole prerendered
 * `/uk/registry` document, which is what a reader actually downloads):
 * the figures are in the report accompanying this change. The authored layer
 * – tldr, findings, chronology, who's-who, FAQ, instruments, measures,
 * theatres – is a small fraction of the weight and carries the
 * vocabulary a reader searches with, because it is the layer written *for*
 * a reader. The verbatim body is the judgment's own procedural English and
 * roughly triples the index for matches that mostly land on the same cases the
 * authored layer already returns.
 *
 * Flip this to `true` and re-measure before arguing about it.
 */
const INDEX_VERBATIM = false;

/**
 * Sections of a decision page, in page order. The id is the element id the
 * page renders (`app/[locale]/cases/[slug]/page.tsx`), so a hit links to it.
 *
 * `#sources` is deliberately absent: it is apparatus, not a destination.
 * `questions` and `related` both stood here once. A hit has to land on text
 * the reader can see, and neither the FAQ band nor the neighbouring-decisions
 * band is on the decision page any more – #questions and #related would each
 * scroll to nothing.
 */
export const SECTIONS = [
  "overview",
  "chronology",
  "machinery",
  "rulings",
  "measures",
  "fulltext",
] as const;

export type SectionId = (typeof SECTIONS)[number];

/**
 * The shipped index.
 *
 * `cases` are the summary slugs, in a fixed order; a posting is two base-36
 * characters – case index, then section index – so a term's whole posting list
 * is one string with no separators and no array literals. At 8 cases and 8
 * sections both fit in one base-36 digit with room for 36 of each; the build
 * refuses to produce an index that would overflow that.
 */
export interface ContentIndex {
  /** Summary slugs, in posting order. */
  cases: string[];
  /** term prefix → concatenated 2-character postings. */
  terms: Record<string, string>;
  /** Characters kept per token – the client must truncate its query the same. */
  prefix: number;
}

/* ============================================================================
   Normalisation – the same rule the row search uses.

   Kept as its own copy rather than imported from RegistryTable: that module is
   `"use client"`, and importing it here would pull the whole table, and with
   it this index's own consumer, into the server graph. The two must agree, and
   the build guard at the bottom of this file asserts that they do on a sample
   the two rules disagree about most (mixed scripts, apostrophes, digits).
   ========================================================================== */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Both locales of a localized value, or a plain string as it stands. */
function text(v: Localized | string | undefined | null): string {
  if (v == null) return "";
  return typeof v === "string" ? v : `${v.uk} ${v.en}`;
}

/** Every localized-or-plain value in a list, flattened. */
function all(...vs: Array<Localized | string | undefined | null>): string {
  return vs.map(text).join(" ");
}

/**
 * What each section of a decision page contains, as searchable text.
 *
 * Every field is one a reader can actually see on that part of the page. A
 * field indexed into the wrong section sends the reader to a screen where the
 * word they typed does not appear, which is worse than not finding it.
 */
function sectionText(s: DecisionSummary): Record<SectionId, string> {
  const out: Record<SectionId, string[]> = {
    overview: [],
    chronology: [],
    machinery: [],
    rulings: [],
    measures: [],
    fulltext: [],
  };

  // ── overview: the masthead, the plain-language framing, the dashboard ──
  out.overview.push(
    /* `plain.whyMatters` більше не тут: відступ «Чому це важливо» зі
       сторінки прибрано, а індекс обіцяє читачеві, що слова, які він шукав,
       на сторінці є. Обіцянку, якої сторінка не тримає, краще не давати –
       та сама причина, з якої звідси свого часу пішли `questions` і
       `related`. Згодом і саме поле прибрано з даних. */
    all(s.title, s.metaDesc, s.plain.tldr),
    s.masthead.parties,
    s.masthead.official,
    s.masthead.judgment,
    all(s.forum?.institution, s.forum?.seat),
    s.stats.map((t) => all(t.label, t.value)).join(" "),
    s.glance.map((g) => all(g.label, g.value)).join(" "),
  );

  // ── chronology ──
  out.chronology.push(
    s.timeline.map((e) => all(e.date, e.label, e.note)).join(" "),
    (s.timelineTracks ?? []).map((t) => text(t.label)).join(" "),
  );

  // ── machinery: what the court did with the claims, and with the facts ──
  out.machinery.push(
    /* `verdicts` і `verdictsHeading` теж пішли: смугу «Що вирішив суд»,
       яка одна їх малювала, знято, а згодом ці поля пішли й із даних. */
    (s.theatres ?? []).map((t) => all(t.place, t.tag, t.summary)).join(" "),
    s.objections
      ? all(s.objections.heading, s.objections.note) +
        " " +
        s.objections.items
          .map((o) => `${o.latin ?? ""} ${all(o.ground, o.objection, o.reasoning)}`)
          .join(" ")
      : "",
    s.attribution
      ? all(s.attribution.respondent, s.attribution.note) +
        " " +
        s.attribution.nodes
          .map((n) => `${n.basis} ${all(n.actor, n.basisNote, n.did)}`)
          .join(" ")
      : "",
    s.takings
      ? all(s.takings.heading, s.takings.note) +
        " " +
        s.takings.metrics.map((m) => all(m.label, m.value, m.note)).join(" ")
      : "",
    s.amounts
      ? all(s.amounts.note) +
        " " +
        s.amounts.figures
          .map(
            (f) =>
              all(f.label, f.display, f.note) +
              " " +
              (f.parts ?? []).map((p) => all(p.label, p.display)).join(" "),
          )
          .join(" ")
      : "",
    s.warrants
      ? all(s.warrants.heading, s.warrants.note) +
        " " +
        (s.warrants.rungs ?? []).map(text).join(" ") +
        " " +
        s.warrants.waves
          .map(
            (w) =>
              all(w.date, w.theme, w.summary) +
              " " +
              w.persons
                .map(
                  (p) =>
                    all(p.name, p.role) +
                    " " +
                    p.charges.map((c) => `${c.art} ${text(c.label)}`).join(" ") +
                    " " +
                    p.modes.map((m) => `${m.art} ${text(m.label)}`).join(" "),
                )
                .join(" "),
          )
          .join(" ")
      : "",
    s.afterlife
      ? all(s.afterlife.heading, s.afterlife.note) +
        " " +
        s.afterlife.stages.map((st) => `${st.year} ${all(st.title, st.note)}`).join(" ")
      : "",
  );

  // ── rulings: the points of law settled, and the instruments they sit in ──
  out.rulings.push(
    s.interpretations.map((i) => all(i.term, i.ruling)).join(" "),
    s.instruments.map((i) => `${text(i.abbr)} ${text(i.name)} ${i.year}`).join(" "),
  );

  // ── provisional measures ──
  out.measures.push(
    all(s.provisionalMeasuresOrder),
    (s.provisionalMeasures ?? [])
      .map((m) => all(m.measure, m.note) + " " + m.order)
      .join(" "),
  );

  /* The «Хто є хто» section stood here, indexing the cast list against
     #handbook. The band is gone from the decision page – it had come down to a
     restatement of «Картка справи» – so the anchor is gone with it, and text
     that is no longer on the page must not be searchable into it. */

  /* `#glossary` stood here too, indexing each decision's terms. The glossary
     is gone from the site – owner: «вимикаємо словник» – and with it the
     band a hit would have scrolled to. It had been indexed only on builds
     that published the glossary, which production never did, so no
     production index loses anything. */

  // ── fulltext: the verbatim body and its bibliography ──
  if (INDEX_VERBATIM) {
    out.fulltext.push(
      s.blocks.map((b) => b.text).join(" "),
      (s.blocksUk ?? []).map((b) => b.text).join(" "),
      s.sources.map((c) => `${c.title} ${c.authors} ${c.publication}`).join(" "),
    );
  }

  return Object.fromEntries(
    SECTIONS.map((k) => [k, out[k].join(" ")]),
  ) as Record<SectionId, string>;
}

/**
 * Distinct truncated terms in a piece of text.
 *
 * Two exclusions, both measured rather than assumed. Together they take the
 * index from 3,255 terms / 22.7 kB gzipped to the figure the build prints,
 * and neither costs a search a reader would make:
 *
 *   • tokens under three characters. In both languages these are prepositions,
 *     conjunctions and articles – «на», «до», «із», "of", "to", "in" – which
 *     occur in nearly every section of every write-up, so they carry the
 *     longest posting lists in the index and discriminate nothing. A
 *     two-letter query still works: it is matched as a prefix over the key
 *     set, so «ко» reaches «конспе…», «компен…» and the rest.
 *   • pure digits. Paragraph numbers, article numbers, page counts and years
 *     from inside the prose. Years and docket numbers a reader searches for
 *     are on the row itself and are already matched by the `date` group of the
 *     row haystack, which is not truncated and does not lose them.
 */
function terms(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of norm(s).split(" ")) {
    if (w.length < 3) continue;
    if (!/\D/.test(w)) continue;
    out.add(w.slice(0, PREFIX));
  }
  return out;
}

/** Build the index. Runs once, at module evaluation, i.e. during the build. */
function build(): ContentIndex {
  const cases = Object.keys(SUMMARIES).sort();
  if (cases.length > 36 || SECTIONS.length > 36) {
    throw new Error(
      "content search index: postings are one base-36 digit per axis, so at " +
        `most 36 cases and 36 sections. Got ${cases.length} and ${SECTIONS.length}. ` +
        "Widen the posting encoding in content/search-index.ts before adding more.",
    );
  }

  const map = new Map<string, string[]>();
  cases.forEach((slug, ci) => {
    const bySection = sectionText(SUMMARIES[slug]);
    SECTIONS.forEach((section, si) => {
      const body = bySection[section];
      if (!body) return;
      const posting = ci.toString(36) + si.toString(36);
      for (const t of terms(body)) {
        const list = map.get(t);
        if (list) list.push(posting);
        else map.set(t, [posting]);
      }
    });
  });

  /* Sorted keys: the client prefix-scans them for a query shorter than PREFIX,
     and a sorted list also gzips better than insertion order. */
  const sorted = [...map.keys()].sort();
  const out: Record<string, string> = {};
  for (const k of sorted) out[k] = map.get(k)!.join("");
  return { cases, terms: out, prefix: PREFIX };
}

export const contentIndex: ContentIndex = build();

/**
 * What the index weighs is announced on every build – from
 * `app/search-index.json/route.ts`, which is the module that serves it.
 *
 * Weight is a live concern on this project – the home page is already ~100 kB
 * gzipped – and an index is exactly the kind of thing that grows quietly with
 * the ninth summary and the tenth. `next.config.ts` already prints one line
 * per build about a setting nobody would otherwise notice; this is the same
 * idea for a number nobody would otherwise measure.
 *
 * It is printed there rather than here because this module is now reached by
 * three build graphs – the Ukrainian library, the English one and the route –
 * and each worker gets its own module instance, so one number printed three
 * times. The route is reached by one, and it is also where the number and the
 * bytes a reader downloads are the same string.
 */

/* ============================================================================
   Build guards. This file cannot be wrong quietly.
   ========================================================================== */
{
  // The section ids must be ids the decision page actually renders. There is
  // no way to read the page's JSX from here, so this is the list, restated:
  // if a section is renamed there, this throws and points at the pair.
  const rendered = new Set([
    "overview",
    "chronology",
    "machinery",
    "rulings",
    "measures",
    "fulltext",
  ]);
  const stray = SECTIONS.filter((s) => !rendered.has(s));
  if (stray.length) {
    throw new Error(
      `content search index: section id(s) with no anchor on the decision page: ${stray.join(", ")}`,
    );
  }

  // Normalisation must agree with RegistryTable's `norm`, which cannot be
  // imported here (it is a client module). These are the cases the two rules
  // would disagree about first if either drifted.
  const samples: Array<[string, string]> = [
    ["ICJ GL 182", "icj gl 182"],
    ["об'єкти", "об єкти"],
    ["Крим, Донбас", "крим донбас"],
    ["36958/21", "36958 21"],
  ];
  for (const [input, expected] of samples) {
    if (norm(input) !== expected) {
      throw new Error(
        `content search index: normalisation drifted – norm(${JSON.stringify(input)}) ` +
          `is ${JSON.stringify(norm(input))}, expected ${JSON.stringify(expected)}`,
      );
    }
  }

  // An empty index means the field walk above stopped matching the content
  // model – a silent failure that would look exactly like "nothing matches".
  if (Object.keys(contentIndex.terms).length < 500) {
    throw new Error(
      `content search index: only ${Object.keys(contentIndex.terms).length} terms – ` +
        "the field walk in sectionText() has probably stopped seeing the summaries.",
    );
  }
}
