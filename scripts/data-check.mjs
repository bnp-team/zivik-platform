/**
 * Internal consistency of the archive's own record.
 *
 *     node scripts/data-check.mjs
 *
 * ── What this can and cannot tell you ──────────────────────────────────────
 * It checks the record against ITSELF, in two passes.
 *
 * The registry (`cases.ts`): that `lit` and `summarySlug` agree, that a docket
 * year is not in the future, that a proceeding recorded as concluded names
 * what concluded it, that an act the record names has a document behind it,
 * that no id or slug is used twice, that a stage does not contradict the
 * status text it was derived from, and that an amount is plausibly
 * denominated.
 *
 * The write-ups (`summaries/*.ts`) against the registry and against the pages
 * that render them: that a related card leads to a case that exists, that a
 * citation's kind is one the decision page can name, that the seat the map
 * draws is the seat the summary names, that every chronology entry carries a
 * sort key and that the key falls inside the date printed above it, that a
 * verdict track is authored in one run and that a track keyed to a day has
 * that day in the chronology, that the row and the summary agree about the
 * document's length and about which came first, and that the library's search
 * captions a decision page's band with the name that band actually wears.
 *
 * It reads the source files as TEXT – the same crude method the registry pass
 * uses, and for the same reason: these are TypeScript modules with path
 * aliases and plain `node` cannot import them. So it knows what a file SAYS,
 * and a change to the shape of these files (an entry reindented, a field split
 * across lines) can make a rule stop seeing its subject rather than fail. When
 * a rule is added, break something on purpose and watch it fire.
 *
 * It CANNOT tell you whether any of it is true. Whether ICJ GL 182 really was
 * decided on 2 February 2024, whether the Naftogaz award really was 4.63bn,
 * whether the ICC warrant really names those articles of the Rome Statute –
 * none of that is in this file's reach. Those are checks against the courts'
 * own documents, one case at a time, and a green run here says nothing about
 * them. Nor does it reach a claim made in prose: the «≈6% основної суми» that
 * stood in Oschadbank's `amounts.note` for months was a sentence, and no rule
 * here divides one number in a sentence by another. It came out by hand, when
 * a person did the division.
 */
import { readFileSync, readdirSync } from "node:fs";

const cases = readFileSync("src/content/cases.ts", "utf8");
const TODAY = "2026-08-26";

/* crude but sufficient: split on the record boundary the file actually uses */
const records = cases
  .split(/\n  \{\n/)
  .slice(1)
  .map((r) => r.split(/\n  \},?/)[0]);

const field = (r, name) => {
  const m = r.match(new RegExp(`^\\s*${name}:\\s*(.+?),?\\s*$`, "m"));
  return m ? m[1].replace(/,$/, "") : null;
};
const strField = (r, name) => {
  const v = field(r, name);
  if (!v) return null;
  const m = v.match(/^"(.*)"$/);
  return m ? m[1] : v;
};
const uk = (r, name) => {
  const m = r.match(new RegExp(`${name}:\\s*\\{[^}]*uk:\\s*"([^"]*)"`, "s"));
  return m ? m[1] : null;
};

const issues = [];
const flag = (id, kind, msg) => issues.push({ id, kind, msg });

const ids = new Set();
const slugs = new Set();
/** summarySlug → the row's own `pages` / `year`, for the write-up pass below. */
const rowPages = new Map();
const rowYear = new Map();

for (const r of records) {
  const id = strField(r, "id");
  if (!id) continue;
  if (ids.has(id)) flag(id, "duplicate-id", "two records share this id");
  ids.add(id);

  const stage = strField(r, "stage");
  const outcome = strField(r, "outcome");
  const status = uk(r, "status") ?? "";
  const year = field(r, "year");
  const lit = field(r, "lit") === "true";
  const slug = strField(r, "summarySlug");
  const url = strField(r, "decisionUrl");
  const amount = field(r, "amountUsd");
  const pages = field(r, "pages");

  if (slug) {
    if (slugs.has(slug)) flag(id, "duplicate-slug", `slug ${slug} used twice`);
    slugs.add(slug);
    /* Kept for the write-up pass below: the row and the summary each record a
       page count and they are two transcriptions of one document. */
    rowPages.set(slug, pages && pages !== "null" ? Number(pages) : null);
    rowYear.set(slug, year && year !== "null" ? Number(year) : null);
  }

  // 1. lit and summarySlug must agree – one says "there is a write-up", the
  //    other is the write-up.
  if (lit && !slug) flag(id, "lit-no-summary", "lit: true with no summarySlug");
  if (!lit && slug) flag(id, "summary-not-lit", `summarySlug ${slug} but lit: false`);

  // 2. a docket year in the future is a typo, not a fact
  if (year && year !== "null" && Number(year) > Number(TODAY.slice(0, 4)))
    flag(id, "future-year", `year ${year} is after ${TODAY}`);

  // 3. the free-text status and the two keyed dimensions have to agree.
  //    These are the phrases DESIGN-level comments say each key stands for.
  const says = {
    concluded: /рішення винесено|врегульован|завершен|відхилен|вирок|остаточне|залишено/i,
    merits: /по суті/i,
    investigation: /розслідуванн/i,
    preliminary: /попередн/i,
    enforcement: /виконанн/i,
    satisfaction: /сатисфакц/i,
    appeal: /оскаржу/i,
    frozen: /заморож/i,
    suspended: /призупин/i,
    upcoming: /до розгляду|до арбітражу|до суду/i,
  };
  if (stage && says[stage] && !says[stage].test(status))
    flag(id, "stage-vs-status", `stage "${stage}" but status reads «${status}»`);

  /* `outcome` is deliberately NOT checked against the free-text status, and
     the first draft of this file was wrong to try. The two answer different
     questions by design – ecthr-5 carries outcome "judgment" (the Court
     delivered one) with status «Очікує сатисфакції» (just satisfaction is
     still pending), and both are true at once. That is the whole reason the
     single `statusKey` was split into `stage` + `outcome`. A checker that
     demands they echo each other is checking for the bug the model was
     rewritten to remove. */

  // 4. an act was issued but nothing links to it
  if (outcome && !url)
    flag(id, "act-no-document", `outcome "${outcome}" with decisionUrl: null`);

  // 5. a concluded proceeding that names no act at all
  if (stage === "concluded" && !outcome)
    flag(id, "concluded-no-outcome", "stage concluded with no outcome");

  // 6. amounts: sign and magnitude sanity
  if (amount && amount !== "null") {
    const n = Number(amount);
    if (!Number.isFinite(n)) flag(id, "amount-unparseable", amount);
    else if (Math.abs(n) < 1000)
      flag(id, "amount-suspicious", `${n} – is this dollars or millions?`);
  }
}

/* every summary file must have a row, and vice versa */
const index = readFileSync("src/content/summaries/index.ts", "utf8");
const summaryKeys = [...index.matchAll(/^\s*"?([a-z0-9-]+)"?:\s*[A-Za-z_]/gm)].map(
  (m) => m[1],
);
for (const s of slugs)
  if (summaryKeys.length && !summaryKeys.includes(s))
    flag(s, "slug-no-file", "summarySlug has no entry in summaries/index.ts");


/* ============================================================================
   The write-ups, against the registry and against themselves.

   Same method as above and the same limits: this reads the source files as
   text, so it knows what they SAY, never whether it is true. Each rule below
   is one contradiction the archive actually shipped, or the shape of one.
   ========================================================================== */

const summarySrc = new Map();
for (const slug of summaryKeys) {
  try {
    summarySrc.set(slug, readFileSync(`src/content/summaries/${slug}.ts`, "utf8"));
  } catch {
    flag(slug, "summary-file-missing", `summaries/index.ts names ${slug} and no module exists`);
  }
}

/** The text of a top-level `  key: [ … ],` / `  key: { … },` in a summary. */
const listOf = (src, key, open = "[", close = "]") => {
  const start = src.indexOf(`\n  ${key}: ${open}\n`);
  if (start < 0) return null;
  const end = src.indexOf(`\n  ${close},`, start);
  return end < 0 ? null : src.slice(start, end);
};
/** The object literals directly inside such a list – four spaces of indent. */
const itemsOf = (list) =>
  list ? list.split(/\n    \{\n/).slice(1).map((e) => e.split(/\n    \},?/)[0]) : [];
const each = (text, re) => [...(text ?? "").matchAll(re)].map((m) => m[1]);

/* The vocabulary the decision page can label. A `Citation.type` outside it
   falls through to the raw key and prints "official/court" at the reader. */
const casePage = readFileSync("src/app/[locale]/cases/[slug]/page.tsx", "utf8");
const typeBlock = casePage.slice(
  casePage.indexOf("const TYPE_LABEL"),
  casePage.indexOf("\n};", casePage.indexOf("const TYPE_LABEL")),
);
const CITATION_TYPES = new Set(each(typeBlock, /^\s*"([^"]+)":/gm));

/* Where each seat on the map is. `mapFocus.forumKey` picks the marker a
   decision page draws its seat on, and the label beside it comes from
   `forum.seat` – so the two have to name the same city. */
const mapSrc = readFileSync("src/content/map.ts", "utf8");
const cityOfCourt = new Map(
  [...mapSrc.matchAll(/key: "([a-z]+)",[\s\S]{0,1200}?city: \{ uk: "([^"]+)"/g)].map(
    (m) => [m[1], m[2]],
  ),
);
const markers = new Set(
  Object.keys(JSON.parse(readFileSync("src/content/europe-map.json", "utf8")).markers),
);

for (const [slug, src] of summarySrc) {
  /* 7. a related card that names a decision must lead to it. Every registry
        row is addressable, so "#registry" – the fallback from before that was
        true – now lands a reader on the home page's preview of all 39. */
  for (const href of each(listOf(src, "related"), /^\s*href: "([^"]+)"/gm)) {
    const m = /^\/cases\/([a-z0-9-]+)$/.exec(href);
    if (!m) flag(slug, "related-not-a-case", `related href "${href}" is not /cases/<slug|id>`);
    else if (!summaryKeys.includes(m[1]) && !ids.has(m[1]))
      flag(slug, "related-dead-end", `related href "${href}" names neither a write-up nor a row`);
  }

  /* 8. a citation kind the page cannot name is printed raw to the reader. */
  for (const t of each(listOf(src, "sources"), /^\s*type: "([^"]+)"/gm))
    if (!CITATION_TYPES.has(t))
      flag(slug, "citation-type-unlabelled", `source type "${t}" has no entry in TYPE_LABEL`);

  /* 9. the seat drawn and the seat named have to be one city. echr's map
        printed «Страсбург» over The Hague's point because `forumKey` was
        left at the default. */
  const forumKey = /\n  mapFocus: \{ forumKey: "([^"]+)"/.exec(src)?.[1] ?? "hague";
  const seat = /\n  forum: \{[\s\S]*?seat: \{ uk: "([^"]+)"/.exec(src)?.[1];
  if (!markers.has(forumKey))
    flag(slug, "seat-no-marker", `mapFocus.forumKey "${forumKey}" is not a point in europe-map.json`);
  else if (seat && cityOfCourt.get(forumKey) !== seat)
    flag(
      slug,
      "seat-mismatch",
      `forum.seat is «${seat}» but mapFocus draws it on ${forumKey} («${cityOfCourt.get(forumKey) ?? "?"}»)`,
    );

  /* 10. every dated event needs its sort key. Without `iso` the chronology
         falls back to authoring order, the year rail does not draw at all,
         and the `#ev-<iso>` anchor the verdict matrix links to is absent.

         A key may be a year or a month rather than a day. The rule used to
         demand YYYY-MM-DD, which left two entries on icj-cerd-icsft keyless –
         «поч. 2014» and «2017», a season and a year – and keyless entries sort
         last, so the chronology printed its two oldest events under the 2024
         judgment. `TimelineEvent.iso` is documented as a sort key whose
         printed date «may be a range or a month», and CaseTimeline already
         reads a four-character key at year precision. What the check is for is
         that a key exists and agrees with the date above it; demanding a day
         that the source does not have was the reason two were missing. */
  const events = itemsOf(listOf(src, "timeline"));
  const isos = new Set();
  for (const e of events) {
    const iso = /^\s*iso: "(\d{4}(?:-\d{2}(?:-\d{2})?)?)"/m.exec(e)?.[1];
    const date = /date: \{ uk: "([^"]*)", en: "([^"]*)" \}/.exec(e);
    const label = date ? date[2] : (/^\s*iso: "([^"]*)"/m.exec(e)?.[1] ?? "?");
    if (!iso) {
      flag(slug, "event-no-iso", `chronology entry «${label}» carries no iso sort key`);
      continue;
    }
    isos.add(iso);
    /* 11. and the key has to agree with the date printed above it. A visible
           date may be a range – «2014–2022», "Nov 2013 – Feb 2014" – and the
           key is then a moment inside it, so the test is containment and not
           equality. */
    if (date) {
      const years = [...`${date[1]} ${date[2]}`.matchAll(/\b(\d{4})\b/g)].map((m) =>
        Number(m[1]),
      );
      const y = Number(iso.slice(0, 4));
      if (years.length && (y < Math.min(...years) || y > Math.max(...years)))
        flag(slug, "iso-vs-date", `entry «${date[2]}» sorts as ${iso}`);
    }
  }

  /* 12. the verdict matrix prints a track on the row that opens a run of it
         and leaves it empty underneath, so a track split across the array
         renders as two groups with the same name. The grouping is authoring
         order; nothing sorts it. */
  const tracks = each(listOf(src, "verdicts"), /^\s{6}track: "([^"]+)"/gm);
  const opened = new Set();
  tracks.forEach((t, i) => {
    if (opened.has(t) && tracks[i - 1] !== t)
      flag(slug, "verdict-track-split", `track "${t}" is authored in two runs`);
    opened.add(t);
  });

  /* 13. a track keyed to a day links down to that day in the chronology, and
         the join is made only where both sides carry it. A track whose day is
         not in the chronology loses the link silently. */
  for (const t of new Set(tracks)) {
    const d = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t);
    if (d && !isos.has(`${d[3]}-${d[2]}-${d[1]}`))
      flag(slug, "track-no-event", `verdict track "${t}" has no chronology entry to link to`);
  }

  /* 14. the row and the write-up each transcribe the document's length. */
  const jPages = /\n  judgment: \{[\s\S]*?\n    pages: (\d+),/.exec(src)?.[1];
  const rPages = rowPages.get(slug);
  if (jPages != null && rPages != null && Number(jPages) !== rPages)
    flag(slug, "pages-disagree", `registry says ${rPages} pages, judgment.pages says ${jPages}`);

  /* 15. a proceeding cannot be decided before the year it was commenced in. */
  const jDate = /\n  judgment: \{[\s\S]*?\n    date: "(\d{4})-\d{2}-\d{2}",/.exec(src)?.[1];
  const rYear = rowYear.get(slug);
  if (jDate && rYear != null && Number(jDate) < rYear)
    flag(slug, "decided-before-filed", `row year ${rYear}, judgment ${jDate}`);
}

/* 16. the library's search offers a hit as a link into a band of a decision
       page, captioned with that band's name. The two lists are separate
       literals in two files, and they drifted: `#handbook` was still offered
       as «Що варто знати» / "What to know" after the band it lands on was
       retitled «Хто є хто» / "Who's who". */
{
  const pairs = {
    overview: "overview",
    chronology: "timeline",
    machinery: "navAnatomy",
    rulings: "navRulings",
    measures: "provMeasures",
    handbook: "navHandbook",
    questions: "faqH",
    fulltext: "navFulltext",
  };
  const label = (src, key) => {
    const m = new RegExp(
      `^\\s*${key}: \\{ uk: "([^"]*)", en: "([^"]*)" \\},$`,
      "m",
    ).exec(src);
    return m ? `${m[1]} / ${m[2]}` : null;
  };
  const registrySrc = readFileSync("src/app/[locale]/registry/page.tsx", "utf8");
  const sectionBlock = registrySrc.slice(
    registrySrc.indexOf("\n  section: {"),
    registrySrc.indexOf("\n  },", registrySrc.indexOf("\n  section: {")),
  );
  for (const [id, key] of Object.entries(pairs)) {
    const said = label(sectionBlock, id);
    const band = label(casePage, key);
    if (said && band && said !== band)
      flag(
        id,
        "section-label-drift",
        `the library calls #${id} «${said}»; the decision page heads it «${band}»`,
      );
  }
}

/* ── the contact address, in the two places that state it ──────────────────
   `content/legal.ts` mirrors `footer.email` by hand and says so in a comment.
   They drifted anyway: the footer moved to the research centre's address and
   the legal pages kept the old project mailbox, so the privacy policy named an
   address the site no longer gave. A constant that must equal another constant
   is a check, not a comment. */
{
  const legal = readFileSync("src/content/legal.ts", "utf8");
  const said = /legalEmail = "([^"]+)"/.exec(legal)?.[1];
  for (const loc of ["uk", "en"]) {
    const dict = readFileSync(`src/i18n/dictionaries/${loc}.ts`, "utf8");
    const footer = /\n\s{4}email: "([^"]+)"/.exec(dict)?.[1];
    if (!footer) {
      flag(loc, "contact-address", "no footer.email found in the dictionary");
    } else if (footer !== said) {
      flag(
        loc,
        "contact-address",
        `footer.email is "${footer}" but legalEmail is "${said}"`,
      );
    }
  }
}

/* `partOf`: a record that is an act within another proceeding.
 *
 * Three ways it can be wrong, and all three are silent at runtime. A parent id
 * that does not exist drops the act off every surface – it is not a row, and
 * nothing prints it either. A missing `actName` makes the parent's row fall
 * back to an English surname on a Ukrainian page. And an act pointing at
 * another act would build a chain the row renderer does not walk. */
{
  const src = readFileSync("src/content/cases.ts", "utf8");
  const parents = new Map();
  for (const m of src.matchAll(
    /\n    id: "([^"]+)",\n    institutionId: "[^"]+",\n(    partOf: "([^"]+)",\n)?(    actName:)?/g,
  )) {
    parents.set(m[1], { partOf: m[3] ?? null, named: Boolean(m[4]) });
  }
  for (const [id, r] of parents) {
    if (!r.partOf) continue;
    if (!parents.has(r.partOf))
      flag(id, "partof-unknown", `partOf "${r.partOf}" is not a record id`);
    else if (parents.get(r.partOf).partOf)
      flag(id, "partof-chained", `partOf "${r.partOf}" is itself an act`);
    if (!r.named)
      flag(id, "partof-unnamed", "partOf without actName – the parent's row would print the citation");
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   A findings block's `outcomes` against its own head lines.

   The array is keyed by position – one entry per «ICSFT – …» / «CERD – …»
   line, in order – and an array keyed by position is only honest while
   something counts it. Insert a finding and the outcomes slide one heading
   to the left, silently, and the page prints «ПОРУШЕНО» over a claim that
   was rejected. That is the kind of error this archive cannot ship.
   ────────────────────────────────────────────────────────────────────── */
{
  const dir = "src/content/summaries";
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    let doc;
    try {
      doc = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    } catch {
      flag(f, "summary-json-unreadable", "file does not parse as JSON");
      continue;
    }
    (doc.blocks ?? []).forEach((b, i) => {
      if (!b || !Array.isArray(b.outcomes)) return;
      if (b.kind !== "findings") {
        flag(f, "outcomes-wrong-kind", `block ${i} is "${b.kind}", not findings`);
        return;
      }
      /* Two ways a block can name its findings, and the count has to hold
         for whichever one it uses. Written into the prose, the head is the
         treaty acronym at the start of a line; recorded, it is an entry in
         `heads`, one per enumerated line. The second is the general one –
         see the note on `heads` in summaries/types.ts. */
      const lines = String(b.text ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const inProse = lines.filter((l) => /^(ICSFT|CERD)\s*[-\u2013\u2014]/.test(l)).length;
      /* Three shapes, one rule: the head written into the prose, the head
         recorded in `heads`, or a list the author enumerated himself – where
         the answer sits on the line and there is no head at all. */
      const ENUM = /^\s*(?:[\u2013\u2014-]\s+|\d{1,2}[.)]\s+)/;
      const enumerated =
        inProse === 0 && lines.length > 1 && lines.every((l) => ENUM.test(l))
          ? lines.length
          : 0;
      const heads = Array.isArray(b.heads)
        ? b.heads.length
        : inProse || enumerated;
      if (Array.isArray(b.heads) && b.heads.length !== lines.length) {
        flag(
          f,
          "heads-miscounted",
          `block ${i} names ${b.heads.length} finding(s) over ${lines.length} line(s)`,
        );
      }
      if (heads !== b.outcomes.length) {
        flag(
          f,
          "outcomes-miscounted",
          `block ${i} has ${heads} finding(s) and ${b.outcomes.length} outcome(s)`,
        );
      }
    });
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Who said it.

   A findings block that names its findings is drawn as an exchange: each
   line is either the party's case or the forum's answer, and the page puts
   them in different columns under different captions. The line says which
   by the marker it opens with.

   It used to say so only for the forum, and an unmarked line fell through
   to the party. That was safe while the renderer read "everything after the
   first marker is the forum" – and the day it changed to "every change of
   voice opens a block", five paragraphs of the Court's reasoning in
   icj-cerd-icsft began printing under «Сторона твердила», including the
   only CERD violation it found. Nothing failed, because nothing was
   watching: the lint reads type and colour, and the data check read the
   records against each other. Neither can see an attribution.

   So the absence of a decision is what fails here, not a wrong one –
   detecting a wrong one would mean reading legal prose and guessing, which
   is the thing this archive does not do. Every line carries a marker or the
   build stops, and the next change to the reader cannot quietly re-assign a
   paragraph to the party that did not say it.

   Blocks with no head lines are left alone: they render as prose, no
   columns, no voices to get wrong.
   ────────────────────────────────────────────────────────────────────── */
{
  const dir = "src/content/summaries";
  const HEAD = /^\s*(ICSFT|CERD)\s*[-\u2013\u2014]/;
  const VOICE = /^(The Court['\u2019]s position:|\u041fози\u0446ія Суду:|The party argued:|Сторона твердила:)/;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    let doc;
    try {
      doc = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    } catch {
      continue; // already flagged by the outcomes pass above
    }
    (doc.blocks ?? []).forEach((b, i) => {
      if (b?.kind !== "findings") return;
      const lines = String(b.text ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.some((l) => HEAD.test(l))) return;
      let head = "?";
      for (const l of lines) {
        if (HEAD.test(l)) {
          head = l.replace(HEAD, "").replace(/^\s*/, "");
          continue;
        }
        if (!VOICE.test(l)) {
          flag(
            f,
            "voice-unmarked",
            `block ${i}, «${head.slice(0, 40)}»: a line opens with neither voice – ` +
              `«${l.slice(0, 56)}…»`,
          );
        }
      }
    });
  }
}

/* ──────────────────────────────────────────────────────────────────────
   `mapAfterPart` names a part the write-up actually has.

   The field is an index into the write-up's h2s: the map is drawn at the end
   of that part, and the contents rail puts its chip after the same one. Two
   walks read one number, which is the point of recording it – but only while
   the number is in range. Out of range the page still draws the map, from the
   tail case, and the rail never emits the chip at all: a band on the page
   with nothing in the contents pointing at it.

   The two renderings of a write-up carry the same sections in the same order,
   so one count answers for both; the Ukrainian file is the one read here
   because it is the one every summary has.
   ────────────────────────────────────────────────────────────────────── */
{
  const dir = "src/content/summaries";
  for (const [slug, src] of summarySrc) {
    const m = src.match(/\n\s*mapAfterPart:\s*(-?\d+)\s*,/);
    if (!m) continue;
    const want = Number(m[1]);
    let doc;
    try {
      doc = JSON.parse(readFileSync(`${dir}/${slug}.uk.json`, "utf8"));
    } catch {
      continue; // flagged elsewhere
    }
    const parts = (doc.blocks ?? []).filter((b) => b?.kind === "h2").length;
    if (want < 0 || want >= parts) {
      flag(
        slug,
        "map-after-part-out-of-range",
        `mapAfterPart is ${want} and the write-up has ${parts} part(s) – ` +
          `the map would draw at the foot of the article with no chip in the contents`,
      );
    }
  }
}

console.log(
  `checked ${ids.size} records, ${summarySrc.size} write-ups, ` +
    `${slugs.size} links between them\n`,
);
if (!issues.length) {
  console.log("no internal contradictions found.");
} else {
  const by = new Map();
  for (const i of issues) {
    if (!by.has(i.kind)) by.set(i.kind, []);
    by.get(i.kind).push(i);
  }
  for (const [kind, list] of [...by].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`── ${kind} (${list.length})`);
    for (const i of list) console.log(`   ${i.id}: ${i.msg}`);
    console.log("");
  }
  /* And it stops the build.
     It never did. Every contradiction this script has ever found – a
     summary that names a record that is not there, a verdict count that
     does not match its findings, and now a paragraph with no voice – was
     printed into a passing run and scrolled past. `npm run check` chains
     on &&, so a script that exits 0 is a script that only ever advised.
     The tree is clean as this lands, so nothing starts failing today that
     was not already wrong. */
  process.exitCode = 1;
}
