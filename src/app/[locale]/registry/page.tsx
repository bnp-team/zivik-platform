import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Crumbs from "@/components/nasvitlo/Crumbs";
import {
  alternateOpenGraphLocales,
  isLocale,
  locales,
  localeOpenGraph,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getContentRepository } from "@/content/repository";
import {
  OUTCOME_ORDER,
  pick,
  STAGE_ORDER,
  type CaseDate,
  type Localized,
} from "@/content/types";
import { actsOf } from "@/content/cases";
import { plural } from "@/i18n/plural";
import { registryTotal } from "@/content/legal";
import { SUMMARIES } from "@/content/summaries";
import {
  defaultOgImage,
  ogImage,
  pathAlternates,
  siteUrl,
} from "@/lib/seo";
import RegistryTable, {
  type RegRow,
} from "@/components/nasvitlo/RegistryTable";
import { CONTENT_INDEX_PATH, SECTIONS } from "@/content/search-index";
import "./registry.css";
import { txt } from "@/lib/ui-texts";

/** Localized page chrome (the case data itself is localized from content). */
const T = {
  title: txt("library.title", { uk: "Бібліотека рішень", en: "Library of decisions" }),
  /* The standfirst on the page. It runs to 222 characters in Ukrainian and 279
     in English because it does a job on the page – it tells the reader that a
     row's date is the year the proceeding opened, not the year of the
     judgment, and that the tags run on two axes. Both facts stop the table
     from being misread, so neither is cut.
     It used to double as the meta description, which put 279 characters into a
     field that is truncated at about 160. They are two strings now, the way
     /about already splits them. */
  /* Not «Усі провадження». The review's question is the right one – «чи
     правильно буде писати про КОЖНЕ провадження. А якщо ми щось пропустимо?
     Похибка можлива» – and it is the same correction the home band's heading
     already took, where «Кожне провадження проти Росії» became «Провадження
     проти Росії». One proceeding nobody has reached yet makes a claim of
     completeness false, and this page is the one a reader would cite it from.
     What the sentence can say without risk is what the library holds and what
     each row carries. */
  lede: txt("library.lede", {
    /* «Росії», не «РФ»: це перше, що читач зустрічає на сторінці, і решта
       сайту пише державу словом. І «тип рішення», а не «тип» – колонка
       зветься так, відколи власниця її перейменувала, а лід лишався
       поясненням до попередньої таблиці. */
    uk: "Провадження проти Росії у міжнародних судах, трибуналах та арбітражах. Кожен рядок має рік відкриття провадження, а де рішення вже ухвалене – його точну дату. Дві окремі колонки кажуть, на якому етапі провадження – стан розгляду – і що саме суд ухвалив – тип рішення.",
    en: "Proceedings against Russia across international courts, tribunals and arbitrations. Each row carries the year the proceeding was opened and, where a decision has been handed down, its exact date. Two separate columns carry the stage of the proceedings and the type of decision the court issued.",
  }),
  /* The meta description: about 133 / 147 characters, both inside the ~160 a
     search result shows. Says what the page holds and what can be done with
     it. The figure is `{n}` rather than a literal – it was typed as 39 and
     went stale the moment the six ICC warrants stopped being rows, which is
     the whole argument for `registryTotal` in content/legal.ts. */
  metaDesc: txt("library.metaDesc", {
    uk: "{n} проваджень проти Росії в міжнародних судах, трибуналах і арбітражах – з фільтрами за судом, станом розгляду і типом рішення.",
    en: "{n} proceedings against Russia before international courts, tribunals and arbitrations, filterable by court, by stage of proceedings and by type of decision.",
  }),
  // The wordmark is «НаСвітло» / "NaSvitlo" everywhere – see i18n/dictionaries/uk.ts.
  // Team and map both say "Home"/"На головну" – so does this now.
  back: txt("library.back", { uk: "На головну", en: "Home" }),
  search: txt("library.search", {
    uk: "Сторона, суд, номер справи, рік, тема…",
    en: "Party, court, docket number, year, subject…",
  }),
  searchLabel: txt("library.searchLabel", { uk: "Пошук у бібліотеці", en: "Search the library" }),
  courts: txt("library.courts", { uk: "Суди", en: "Courts" }),
  courtsAll: txt("library.courtsAll", { uk: "Усі суди", en: "All courts" }),
  /* The filter over a column is named for the column. «Етап» and «Ухвалено»
     named neither the data nor the heading above it; the library calls these
     two dimensions «стан розгляду» and «тип» everywhere now – the column
     heading, the filter, the sort axis and the tag's assistive-technology
     prefix all say the same words. It was «тип рішення» until the owner cut
     it: the column stands beside «Стан розгляду» in a table of decisions,
     so «рішення» was the one word on the row that told the reader nothing
     they had not been told by the page they were on. */
  stages: txt("library.stages", { uk: "Стан розгляду", en: "Stage" }),
  stagesAll: txt("library.stagesAll", { uk: "Будь-який стан", en: "Any stage" }),
  /* «Тип» саме по собі нічого не називало – поруч стояли «Стан розгляду»
     і «Галузь», і три з них читалися як три таксономії без предмета.
     Власниця: «не тип а тип рішення». Так само зветься і колонка. */
  outcomes: txt("library.outcomes", { uk: "Тип рішення", en: "Decision type" }),
  outcomesAll: txt("library.outcomesAll", { uk: "Будь-який тип рішення", en: "Any decision type" }),
  /* ── «Галузь» прибрано як критерій ──────────────────────────────────────
     Власниця: «галузь як критурій пошуку прибрати». Випав увесь фасет –
     список, стан у рядку адреси, чип, предикат і обидва рядки. Сама
     величина лишилася в записі (`type` у content/cases.ts) і далі
     відповідає на текстовий запит: прибрано критерій-контрол, а не слово,
     яке треба зробити незнайденним. */
  /* ── «Матеріали» стали «Станом опрацювання» ─────────────────────────────
     Власниця: «Матеріали фільтр - заміни на стан опрацювання: є огляд і в
     процесі опрацювання». Фільтр питав, що в рядка є – огляд, документ
     суду; тепер він питає, на чому рядок стоїть у нас. Це та сама одна
     величина `lit`, але названа з боку читача: або огляд готовий, або ми
     його пишемо. Посилання на документ суду нікуди не поділося – воно на
     самому рядку, просто перестало бути критерієм. */
  materials: txt("library.materials", { uk: "Стан опрацювання", en: "Editorial state" }),
  materialsAll: txt("library.materialsAll", { uk: "Будь-який стан", en: "Any state" }),
  /* The control that folds the five filters away on a phone. See the note in
     RegistryTable for why it exists and why the sort control is not inside
     it. */
  filters: txt("library.filters", { uk: "Фільтри", en: "Filters" }),
  matLit: txt("library.matLit", { uk: "Є огляд", en: "Summary ready" }),
  matWip: txt("library.matWip", { uk: "В процесі опрацювання", en: "Being worked on" }),
  /* The link itself, in the wording `dict.pending.official` already uses on
     the page a row without a summary leads to – the reader meets the same
     three words in the list and at the destination. */
  doc: txt("library.doc", { uk: "Документ суду", en: "The court's document" }),
  sort: txt("library.sort", { uk: "Порядок", en: "Sort" }),
  sortOpt: {
    decidedDesc: txt("library.sortOpt.decidedDesc", { uk: "За датою рішення", en: "By decision date" }),
    readable: txt("library.sortOpt.readable", { uk: "Спершу опрацьовані", en: "Ready to read first" }),
    /* Thirteen rows carry a sum and the largest is five billion; until now
       the figure was in the record and on no surface that lists these cases. */
    court: txt("library.sortOpt.court", { uk: "За судом", en: "By court" }),
  },
  colCourt: txt("library.colCourt", { uk: "Суд", en: "Court" }),
  colCase: txt("library.colCase", { uk: "Справа", en: "Case" }),
  /* «Теги» named the widget, not the facts. Two columns now, each named for
     what it holds, and each sortable on its own axis. */
  colStage: txt("library.colStage", { uk: "Стан розгляду", en: "Stage" }),
  colOutcome: txt("library.colOutcome", { uk: "Тип рішення", en: "Decision type" }),
  colDate: txt("library.colDate", { uk: "Рік", en: "Year" }),
  sortAsc: txt("library.sortAsc", { uk: "за зростанням", en: "sorted ascending" }),
  sortDesc: txt("library.sortDesc", { uk: "за спаданням", en: "sorted descending" }),
  sortNone: txt("library.sortNone", { uk: "не сортовано", en: "not sorted" }),
  /* Ukrainian counts in three forms, and the teens all take the "many" one,
     which is why 11 and 21 disagree: 1 справа, 2 справи, 5 справ, 11 справ,
     21 справа, 22 справи. */
  results: {
    uk: { one: "справа", few: "справи", many: "справ" },
    en: { one: "case", few: "cases", many: "cases" },
  },
  ofTotal: txt("library.ofTotal", { uk: "з {total}", en: "of {total}" }),
  /* The acts folded into a proceeding's row. Today that is the ICC's six
     arrest warrants in ICC-01/22: the library counts them – the row says
     «6 ордерів» – and shows them here rather than as six rows of their own.
     Keyed by `outcome`, so the next kind of act that folds has to be named
     before it can appear. */
  actWord: {
    warrant: {
      uk: { one: "ордер", few: "ордери", many: "ордерів" },
      en: { one: "warrant", few: "warrants", many: "warrants" },
    },
  },
  /* Review: «додати вказівку з зірочкою, що це 6, про які публічно відомо».
     The Court does not publish every warrant it issues – some stay under
     seal – so the figure is what is on the public record, not a total. */
  actsNote: txt("library.actsNote", {
    uk: "про які відомо публічно",
    en: "those on the public record",
  }),
  combine: txt("library.combine", {
    uk: "Кілька значень в одному фільтрі – будь-яке з них; різні фільтри діють разом.",
    en: "Several values in one filter mean any of them; different filters apply together.",
  }),
  reset: txt("library.reset", { uk: "Скинути", en: "Reset" }),
  /* Per-filter clearing and the blanket reset are two different acts and are
     kept apart: a chip drops one value, «Скинути» drops every filter, the
     search box and the ordering with them. */
  activeFilters: txt("library.activeFilters", { uk: "Активні фільтри", en: "Active filters" }),
  clearFilter: txt("library.clearFilter", { uk: "Прибрати фільтр", en: "Remove filter" }),
  clearSearch: txt("library.clearSearch", { uk: "Очистити пошук", en: "Clear search" }),
  emptyHead: txt("library.emptyHead", { uk: "Нічого не знайдено", en: "Nothing found" }),
  emptyBody: txt("library.emptyBody", {
    uk: "Спробуйте змінити фільтри або пошуковий запит.",
    en: "Try adjusting the filters or the search query.",
  }),
  /* The two states the search can be in while it is only half itself.

     The index over the eight write-ups is a file now (`/search-index.json`),
     asked for the moment a reader reaches for the field. Until it lands, a
     query runs against the thirty-three rows and nothing else – which is what
     the library did before the index existed, and which finds «Ощадбанк» but
     not «депортація дітей». A search that answers short without saying so is
     the exact failure the index was built to end, so the count line says
     which half is running rather than letting the reader conclude the archive
     holds nothing. */
  searchLoading: txt("library.searchLoading", {
    uk: "Пошук поки що лише в рядках – покажчик конспектів ще завантажується.",
    en: "Searching the rows only for now – the write-up index is still loading.",
  }),
  searchNoIndex: txt("library.searchNoIndex", {
    uk: "Покажчик конспектів не завантажився – пошук лише в рядках.",
    en: "The write-up index did not load – this is searching the rows only.",
  }),
  matched: txt("library.matched", { uk: "збіг:", en: "matched:" }),
  /* Distinct from `matched`, which names a hidden field of the *row*. This one
     names a part of the write-up behind the row, and each part is a link. */
  matchedIn: txt("library.matchedIn", { uk: "в огляді:", en: "in the write-up:" }),
  /* The decision page's own bands, in its own words – these labels have to be
     the ones a reader sees on arriving at the anchor, or the link lies about
     where it goes. Copied from `T` and `pageSections` in
     app/[locale]/cases/[slug]/page.tsx.

     One does not travel cleanly: `#machinery` is titled «Ордери» / "Warrants"
     on the ICC page and «Розбір рішення» / "Anatomy" everywhere else, because
     that band renders warrants on one page and attribution/objections on the
     others. The label here is the majority one. Making it exact would mean
     shipping a per-case label table for a single band; it is noted rather than
     built, and it is the only place these two lists differ. */
  section: {
    /* «Картка справи»: секція, на яку веде цей чип, тепер зветься так –
       реквізити справи, а під ними речення про неї. «Якщо коротко» більше
       не заголовок нічого. */
    overview: txt("library.section.overview", { uk: "Картка справи", en: "Case at a glance" }),
    chronology: txt("library.section.chronology", { uk: "Хронологія", en: "Timeline" }),
    machinery: txt("library.section.machinery", { uk: "Розбір рішення", en: "Anatomy" }),
    rulings: txt("library.section.rulings", { uk: "Тлумачення", en: "Key rulings" }),
    measures: txt("library.section.measures", { uk: "Тимчасові заходи", en: "Provisional measures" }),
    /* `questions` and `related` both stood here. Each band is gone from the
       decision page, and a hit pointing at #questions or #related would land
       on nothing. Neighbouring decisions are this page's own job: the docket
       filters by court, ground and date. */
    fulltext: txt("library.section.fulltext", { uk: "Повний огляд", en: "Full summary" }),
  },
  group: {
    court: txt("library.group.court", { uk: "суд", en: "court" }),
    status: txt("library.group.status", { uk: "статус", en: "status" }),
    type: txt("library.group.type", { uk: "галузь", en: "field" }),
    date: txt("library.group.date", { uk: "дата", en: "date" }),
    visible: txt("library.group.visible", { uk: "назва", en: "name" }),
  },
  decidedOn: txt("library.decidedOn", { uk: "рішення", en: "decided" }),
  noDate: txt("library.noDate", { uk: "–", en: "–" }),
  mProceedings: txt("library.mProceedings", { uk: "проваджень", en: "proceedings" }),
  /* Twelve bodies, and one of them – EU / Belgium enforcement measures – is
     not a court: `content/institutions.ts` files it as `executive`. "Courts"
     counted them wrongly and "instances" is a false friend for «інстанція»
     (a court instance is a level of jurisdiction, not an item). "Institutions"
     is the noun `content/institutions.ts` and `content/stats.ts` already use. */
  mInstitutions: txt("library.mInstitutions", { uk: "інстанцій", en: "institutions" }),
  mAnalysed: txt("library.mAnalysed", { uk: "опрацьовано", en: "analysed" }),
  /* The state of the collection, said in words under the figures.

     Review's instruction: «на сторінці бібліотека додати вказівку конкретну
     про те, що не всі рішення є проаналізовані – бо це зразу не зрозуміло,
     якщо попередньо людина не прочитала розділ про нас». It was not: the page
     printed «8 опрацьовано» beside «39 проваджень» and left the reader to
     draw the conclusion from two numbers. A figure is not a statement, and
     the reader who most needs this one is the reader who arrived here first.

     The sentence itself came off /about in the same review – it was «Стан
     бібліотеки» there – and this is where it was supposed to land. The claim
     it makes is the one content/legal.ts already makes, so the two cannot
     disagree.

     One clause came off it on the way. It read «у бібліотеці та на мапі вони
     позначені як такі», which was true when it was written and had not been
     for some time: the map carried a marker per case then, and it was
     re-conceived as the states whose courts hear these proceedings – no case
     markers, and a legend that names only a court and a forum State. The
     sentence outlived the thing it described, which is what a claim about
     another surface does unless something checks it. Checked here rather than
     assumed: 40 rows in the library, 8 of them marked as written up, a filter
     for them and the words «Огляд у підготовці»; on the map, zero markers.
     So it points at the list under it, which is the surface it is on.

     Shorter than it was, too. The first version ran three ideas through one
     sentence and reached the reader as «дуже дивне формулювання»: it opened
     on the library rather than on the reader's question, and «провадження
     вносимо до неї раніше, ніж встигаємо їх опрацювати» is a process
     described where an outcome was wanted. Two sentences now, each with one
     job – what the marks in the list mean, and what an absence does not
     mean.

     The first sentence had the mark the wrong way round, which is the whole
     reason for this pass. It said «провадження без огляду – вони позначені
     окремо», and nothing in the list marks a row for lacking a summary: the
     mark is on the rows that have one – `.reg-drow.is-lit .reg-court .dot`
     is the lit gold dot, grey on every other row – and «Документ суду»
     appears on any row with a court document, summarised or not. A reader
     hunting for a "no summary yet" badge would have found none.

     The owner's own sentence, after four drafts and four continuations. It
     opens on the proceedings already summarised rather than on the ones that
     are not – the same facts in the order that does not read as an apology –
     and it is one clause and a comma rather than two sentences.

     It also drops the growth clause the earlier drafts all carried
     («список далі поповнюємо новими справами»). That was the note's second
     job: telling a reader who cannot find a case that the list is still
     being added to. It is not said here any more, deliberately – flagged to
     the owner rather than smuggled back in.

     And it is said in the first person – owner's instruction, «давай від
     себе писати». The archive is kept by people and the rest of the site
     already says so («ми проливаємо на них світло», «ми шукаємо
     інституції»); a passive «бібліотека наповнюється» was the one line that
     described the work as weather. So: ми опрацювали, ми читаємо, ми
     поповнюємо.

     «Підсвітили», not «позначили золотим» – owner's word, and the better
     one. The archive is called НаСвітло, its footer says «ми проливаємо на
     них світло», and the mark this sentence points at is a lit gold dot.
     One verb now carries both the fact (that row has a summary) and the
     figure the whole site is built on, where the earlier phrasing described
     a colour and left the figure on the floor.

     Whatever the verb, it has to point the right way: it names the rows we
     have lit, not – as the sentence had it before this pass – a badge on
     the rows that lack a summary. Nothing marks those. */
  state: txt("library.state", {
    uk: "Частину проваджень ми вже опрацювали й підсвітили, над іншими ще працюємо.",
    en: "We have already worked through some of these proceedings and lit them up; we are still working on the others.",
  }),
} as const;

/**
 * The exact date of a case's operative decision, or null.
 *
 * `cases.ts` records a bare year – the year the proceeding was commenced, which
 * is why it disagrees with the judgment year on every summarised case (ICJ GL
 * 166 was filed in 2017 and decided in 2024). The only precise dates the
 * archive holds are `judgment.date` on the eight published summaries, so those
 * are read straight from the summary rather than transcribed a second time.
 * Nothing here widens a year into a day.
 */
function decisionDate(
  slug: string | undefined,
  explicit: CaseDate | undefined,
): Extract<CaseDate, { precision: "day" }> | null {
  if (explicit?.precision === "day") return explicit;
  const iso = slug ? SUMMARIES[slug]?.judgment.date : undefined;
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));
  return Number.isFinite(year) ? { precision: "day", iso, year } : null;
}

/** «31.01.2024» / «31 Jan 2024» – the day is a fact, so it is shown as one. */
function formatDay(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-");
  return locale === "uk"
    ? `${d}.${m}.${y}`
    : new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

/** Both locales of a localized value, for the search haystack. */
function both(v: Localized | null | undefined): string {
  return v ? `${v.uk} ${v.en}` : "";
}


/**
 * Resolve a whole table of localized strings, keeping its keys.
 *
 * `Object.fromEntries` loses them – it returns `{ [k: string]: string }`, and
 * an index signature satisfies any `Record<Something, string>` the caller
 * asks for whether the keys are there or not. That is how the sort control
 * came to ask for a label the dictionary no longer had: the types agreed all
 * the way down and the reader got `undefined`. Keeping `K` means a preset
 * without a label now fails the build at the call site.
 */
function pickAll<K extends string>(
  table: Record<K, Localized>,
  locale: Locale,
): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const k of Object.keys(table) as K[]) out[k] = pick(table[k], locale);
  return out;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const path = `/${locale}/registry`;
  const title = pick(T.title, locale);
  const description = pick(T.metaDesc, locale).replace("{n}", String(registryTotal));
  /*
   * `openGraph` and `twitter` are replaced wholesale, not merged, by the
   * nearest generateMetadata that sets them. This block used to set og:title,
   * og:description, og:url and og:type only – which dropped the layout's
   * og:image and og:site_name – and set no twitter key at all, so the Twitter
   * card fell all the way back to the layout's home-page card: the home
   * title, the home description and the home image on a link to the registry.
   * Same shape as /map and /team, plus the twitter block they are also
   * missing.
   */
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: path,
      languages: pathAlternates((l) => `/${l}/registry`),
    },
    openGraph: {
      type: "website",
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: path,
      siteName: dict.brand.wordmark,
      title,
      description,
      images: [ogImage(defaultOgImage, dict.meta.ogAlt)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  /* Both dictionaries: the row's own labels come from the active locale, but
     the search haystack carries the other language's wording too. */
  const repo = getContentRepository();
  const [dictUk, dictEn, institutions, cases] = await Promise.all([
    getDictionary("uk"),
    getDictionary("en"),
    repo.getInstitutions(),
    repo.getCases(),
  ]);
  const dict = locale === "uk" ? dictUk : dictEn;

  const instById = new Map(institutions.map((i) => [i.id, i]));

  const rows: RegRow[] = cases.map((c) => {
    const inst = instById.get(c.institutionId);
    const decided = decisionDate(c.summarySlug, c.decidedOn);
    const stageLabels = c.stage
      ? { uk: dictUk.registry.stage[c.stage], en: dictEn.registry.stage[c.stage] }
      : null;
    /* Acts folded into this proceeding – see `partOf` in content/types.ts. */
    const actRows = actsOf(c.id);
    const acts = actRows.map((a) => ({
      id: a.id,
      name: a.actName ? pick(a.actName, locale) : (a.nameShort ?? a.name),
      href: a.decisionUrl ?? null,
    }));
    const actText = actRows
      .map((a) => `${a.name} ${a.nameUk ?? ""} ${both(a.actName)} ${both(a.note)}`)
      .join(" ");
    const outcomeLabels = c.outcome
      ? {
          uk: dictUk.registry.outcome[c.outcome],
          en: dictEn.registry.outcome[c.outcome],
        }
      : null;
    return {
      id: c.id,
      courtId: c.institutionId,
      court: inst ? pick(inst.abbr, locale) : c.institutionId,
      courtOrder: inst ? inst.order : Number.MAX_SAFE_INTEGER,
      /* The heading is the short name where there is one; the full caption
         stays in `find.visible` below, so a claimant who appears only in it is
         still reachable by search. */
      name: c.nameShort ?? c.name,
      nameUk: locale === "uk" ? (c.nameUk ?? "") : "",
      note: pick(c.note, locale),
      stage: c.stage ?? null,
      stageLabel: stageLabels ? pick(stageLabels, locale) : null,
      outcome: c.outcome ?? null,
      outcomeLabel: outcomeLabels ? pick(outcomeLabels, locale) : null,
      status: pick(c.status, locale),
      year: c.year,
      decided,
      decidedLabel: decided ? formatDay(decided.iso, locale) : null,
      lit: c.lit,
      slug: c.summarySlug ?? null,
      docUrl: c.decisionUrl,
      href: c.summarySlug ? `/${locale}/cases/${c.summarySlug}` : null,
      /* Both locales go into every group. Most case names are recorded only in
         English while the interface is Ukrainian, and until `nameUk` a reader
         typing «Нафтогаз» or «Укренерго» could not reach the row that is about
         it – only the institution's Ukrainian abbreviation and seat were
         searchable, not the title. The Ukrainian line goes into the search
         whatever locale is being read, so a Ukrainian query finds the case on
         the English page too. */
      acts,
      actsLabel: acts.length
        ? `${acts.length} ${plural(acts.length, T.actWord.warrant[locale === "uk" ? "uk" : "en"], locale)}`
        : null,
      actsNote: acts.length ? pick(T.actsNote, locale) : null,
      /* The acts' own text goes into the parent's haystack. Six warrant
         records left the list; a reader typing «Шойгу» still has to land on
         the proceeding that holds his warrant, and the charges paragraph is
         the only place several of the Rome Statute articles are written. */
      find: {
        visible: `${c.name} ${c.nameShort ?? ""} ${c.nameUk ?? ""} ${both(c.note)} ${actText}`,
        court: `${both(inst?.abbr)} ${both(inst?.name)} ${both(inst?.seat)} ${c.institutionId}`,
        status: `${both(c.status)} ${both(stageLabels)} ${both(outcomeLabels)}`,
        type: both(c.type),
        date: `${c.year ?? ""} ${decided ? `${decided.iso} ${decided.year}` : ""}`,
      },
    };
  });

  // Court filter options: institutions that actually have cases, in order.
  const withCases = new Set(cases.map((c) => c.institutionId));
  const courts = institutions
    .filter((i) => withCases.has(i.id))
    .map((i) => ({ id: i.id, abbr: pick(i.abbr, locale) }));

  // Tag filter options: only the values the 39 rows actually carry.
  const presentStages = new Set(cases.map((c) => c.stage));
  const stages = STAGE_ORDER.filter((k) => presentStages.has(k)).map((key) => ({
    key,
    label: dict.registry.stage[key],
  }));
  const presentOutcomes = new Set(cases.map((c) => c.outcome));
  const outcomes = OUTCOME_ORDER.filter((k) => presentOutcomes.has(k)).map(
    (key) => ({ key, label: dict.registry.outcome[key] }),
  );

  /* What is left of the content index on this page: eight section labels.

     The postings are language-agnostic – both locales of every field went into
     them – but the page carrying them was not, so the same 24,137 gzipped
     bytes shipped inside /uk/registry and again inside /en/registry, to every
     reader who opened the library and not only to the ones who searched it.
     They are one static file now, fetched once, cached, and shared by both
     locales; the labels stay because they are localized and tiny. */
  const content = {
    sections: SECTIONS.map((id) => ({ id, label: pick(T.section[id], locale) })),
    url: CONTENT_INDEX_PATH,
  };

  const analysed = cases.filter((c) => c.lit).length;

  return (
    <div className="page registrypage">

      <main id="content" tabIndex={-1} className="reg-wrap">
        <header className="reg-mast">
          <Crumbs locale={locale as Locale} linkClass="reg-back" here={pick(T.title, locale)} />
          <h1>{pick(T.title, locale)}</h1>
          <p className="reg-lede">{pick(T.lede, locale)}</p>
          <div className="reg-meta">
            <div className="m gilt">
              <span className="mv">{cases.length}</span>
              <span className="ml">{pick(T.mProceedings, locale)}</span>
            </div>
            <div className="m">
              <span className="mv">{courts.length}</span>
              <span className="ml">{pick(T.mInstitutions, locale)}</span>
            </div>
            <div className="m">
              <span className="mv">{analysed}</span>
              <span className="ml">{pick(T.mAnalysed, locale)}</span>
            </div>
          </div>
          {/* Under the figures, because it is the figures that raise the
              question: 8 of 39 is a fact a reader has to interpret, and this
              is the interpretation. */}
          <p className="reg-state">{pick(T.state, locale)}</p>
        </header>

        {/* No Suspense boundary, and that is the point.

            There used to be one, wrapping this table with `fallback={null}`,
            because `RegistryTable` read the incoming `?court=` through
            `useSearchParams()`. The comment here claimed the fallback was
            never seen. It was seen by every reader and every crawler in
            production: `useSearchParams` bails a statically rendered route
            out to client-side rendering, and the built HTML for this page
            carried an 815-byte <main> – masthead, then a
            BAILOUT_TO_CLIENT_SIDE_RENDERING marker where thirty-three
            proceedings should have been. Dev renders on demand, so the hole
            only existed in the artefact nobody was reading.

            The table now reads the URL after hydration instead (see the
            state block in RegistryTable), so nothing here suspends and the
            whole ledger is in the HTML again. */}
        <RegistryTable
          rows={rows}
          courts={courts}
          stages={stages}
          outcomes={outcomes}
          content={content}
          t={{
            search: pick(T.search, locale),
            searchLabel: pick(T.searchLabel, locale),
            tableLabel: pick(T.title, locale),
            courts: pick(T.courts, locale),
            courtsAll: pick(T.courtsAll, locale),
            stages: pick(T.stages, locale),
            stagesAll: pick(T.stagesAll, locale),
            outcomes: pick(T.outcomes, locale),
            outcomesAll: pick(T.outcomesAll, locale),
            materials: pick(T.materials, locale),
            materialsAll: pick(T.materialsAll, locale),
            matLit: pick(T.matLit, locale),
            matWip: pick(T.matWip, locale),
            doc: pick(T.doc, locale),
            filters: pick(T.filters, locale),
            sort: pick(T.sort, locale),
            sortOpt: pickAll(T.sortOpt, locale),
            colCourt: pick(T.colCourt, locale),
            colCase: pick(T.colCase, locale),
            colStage: pick(T.colStage, locale),
            colOutcome: pick(T.colOutcome, locale),
            colDate: pick(T.colDate, locale),
            sortAsc: pick(T.sortAsc, locale),
            sortDesc: pick(T.sortDesc, locale),
            sortNone: pick(T.sortNone, locale),
            results: T.results[locale],
            ofTotal: pick(T.ofTotal, locale),
            combine: pick(T.combine, locale),
            reset: pick(T.reset, locale),
            activeFilters: pick(T.activeFilters, locale),
            clearFilter: pick(T.clearFilter, locale),
            clearSearch: pick(T.clearSearch, locale),
            emptyHead: pick(T.emptyHead, locale),
            emptyBody: pick(T.emptyBody, locale),
            searchLoading: pick(T.searchLoading, locale),
            searchNoIndex: pick(T.searchNoIndex, locale),
            matched: pick(T.matched, locale),
            matchedIn: pick(T.matchedIn, locale),
            group: {
              visible: pick(T.group.visible, locale),
              court: pick(T.group.court, locale),
              status: pick(T.group.status, locale),
              type: pick(T.group.type, locale),
              date: pick(T.group.date, locale),
            },
            decidedOn: pick(T.decidedOn, locale),
            noDate: pick(T.noDate, locale),
            stageName: dict.registry.stageName,
            outcomeName: dict.registry.outcomeName,
          }}
        />
      </main>

      {/* No sign-off band here either.

          It was the home page's support ask, brought over so that a reader who
          arrives from a shared filtered link is asked something too. The ask is
          in the top bar on every page now – which is that same reasoning
          carried further – and the band's heading and paragraph are the text
          the owner asked to remove. One ask, one place, one appearance. */}
    </div>
  );
}
