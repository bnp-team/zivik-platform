"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { defaultLocale, foreignLang, isLocale } from "@/i18n/config";
import { plural, type PluralForms } from "@/i18n/plural";
import {
  OUTCOME_ORDER,
  STAGE_ORDER,
  type CaseDate,
  type CaseOutcomeKey,
  type CaseStageKey,
} from "@/content/types";

/* ============================================================================
   Search normalisation.

   Thirty-nine rows in memory: a well-chosen set of fields plus normalisation
   beats a search library, and leaves the matching auditable. Lower-case, strip
   combining marks (so "Одеса" and "Одеса" agree however they were typed), turn
   every punctuation run into a space – that is what makes "36958/21", "ICJ GL
   182" and "PCA 2015-07" behave as ordinary token queries.
   ========================================================================== */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // ʼ / ' / ’ are the same apostrophe to a reader typing "об'єкти".
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Cheap Latin ⇄ Cyrillic tolerance. Only pairs the record already contains in
 * both scripts – a reader typing «Гаага» must reach English-titled rows, and a
 * reader typing "ECHR" must reach rows filed under «ЄСПЛ». This expands the
 * *query*, never the data, so nothing here can put a word into the archive.
 */
const ALIASES: ReadonlyArray<readonly string[]> = [
  ["espl", "yespl", "ecthr", "echr", "єспл"].map(norm),
  ["mks", "мкс", "icc"].map(norm),
  ["ms oon", "мс оон", "icj"].map(norm),
  ["gaaga", "гаага", "hague"].map(norm),
  ["strasburg", "страсбург", "strasbourg"].map(norm),
  ["krym", "крим", "crimea"].map(norm),
  ["naftogaz", "нафтогаз"].map(norm),
  ["gazprom", "газпром"].map(norm),
  ["oschadbank", "ощадбанк"].map(norm),
  ["ukraina", "україна", "ukraine"].map(norm),
  ["rosiia", "Росія", "Russia"].map(norm),
];

/** Every spelling a token should also be tried under. */
function expand(token: string): string[] {
  const group = ALIASES.find((g) => g.includes(token));
  return group ? [...group] : [token];
}

/**
 * Tokens match at the start of a word, so "naftog" still finds Naftogaz but
 * "art" does not find "quartz". The haystack is already a space-separated
 * normalised string, so a leading space is all the boundary needed.
 */
function hits(hay: string, token: string): boolean {
  return expand(token).some((v) => ` ${hay}`.includes(` ${v}`));
}

/* ============================================================================
   Row model
   ========================================================================== */

/** One case, already localized to plain strings on the server. */
export interface RegRow {
  id: string;
  courtId: string;
  /** Abbreviation in the active locale – the visible court cell. */
  court: string;
  /** Sort position of the institution, so "by court" follows the archive. */
  courtOrder: number;
  name: string;
  /**
   * The same case in Ukrainian, where the caption is not. Empty in the English
   * locale: there the citation is already in the reader's language.
   */
  nameUk: string;
  note: string;
  /** Procedural posture; null where the record does not fix one. */
  stage: CaseStageKey | null;
  stageLabel: string | null;
  /** What the forum issued; null where the record names no act. */
  outcome: CaseOutcomeKey | null;
  outcomeLabel: string | null;
  /** Full status wording, in the active locale. */
  status: string;
  /** Year the proceeding was commenced. */
  year: number | null;
  /**
   * Decision date where the record fixes an exact day. A year-only record
   * cannot produce one – a bare year stays in `year`, and is never widened
   * into 1 January, which would be a fabricated fact and a corrupted sort.
   */
  decided: Extract<CaseDate, { precision: "day" }> | null;
  /** `decided`, already formatted for the locale. */
  decidedLabel: string | null;
  lit: boolean;
  /** Summary slug where one exists – the key into the content index. */
  slug: string | null;
  /**
   * The court's own document, where the record holds a link to one – twenty-
   * two of the thirty-nine.
   *
   * It used to arrive as a bare boolean, because the only thing the table did
   * with it was let the «Матеріали» filter narrow to rows that had one. That
   * left the reader who used that filter holding twenty-two rows and no way
   * to open a single document without going into each case first – one extra
   * navigation in front of the most valuable act this archive supports.
   */
  docUrl: string | null;
  /**
   * Amount at stake in USD, signed, or null. Thirteen rows carry one, up to
   * five billion. Print it through `content/money.ts`, which explains why the
   * sign never reaches the reader and why these are never summed.
   */
  /** Decision page, when a summary is published. Otherwise `/cases/{id}`. */
  href: string | null;
  /**
   * Acts folded into this proceeding, printed under its name.
   *
   * The ICC's six arrest warrants in ICC-01/22 are the case this exists for:
   * they are six acts of one proceeding, they were six rows, and the library
   * counted seven where the honest answer is one situation carrying six
   * warrants. `href` on an act is the Court's own page for it, when there is
   * one – these have no page here.
   */
  acts: { id: string; name: string; href: string | null }[];
  /** «6 ордерів», already counted and pluralised. Null when there are none. */
  actsLabel: string | null;
  /** The asterisk's footnote – what the count is and is not. */
  actsNote: string | null;
  /** Raw searchable text, grouped so a match can say where it came from. */
  find: {
    /** Case name and note – the two fields the row shows. */
    visible: string;
    /** Institution abbreviation, name and seat, in *both* locales. */
    court: string;
    /** Free-text status plus both tag labels, in both locales. */
    status: string;
    /** Subject-matter type, in both locales. */
    type: string;
    /** Years and dates as digits. */
    date: string;
  };
}

type FindGroup = keyof RegRow["find"];
const HIDDEN_GROUPS: FindGroup[] = ["court", "status", "type", "date"];

/* ============================================================================
   Content search – the write-ups, not just the row.

   The index is built at build time (`content/search-index.ts`); everything
   here is the read side. The shape is deliberately dumb: a sorted array of
   truncated term keys, and for each key a string of two-character postings
   (case index, then section index, both base 36). Nothing is parsed until a
   reader types.
   ========================================================================== */

/**
 * What the server hands over: eight section labels, and where the rest is.
 *
 * The postings used to come with it. They are the archive's largest single
 * block of data and they were in the document whether or not the reader ever
 * typed – 24,137 gzipped bytes of a 53,379-byte page. They are a file now,
 * fetched on the reader's first move towards the field.
 *
 * The labels stay: there are eight of them, they are localized, and they are
 * needed to render a row's «Знайдено в» line the moment a match exists.
 */
export interface ContentIndexProp {
  /** Section ids and their labels, in posting order. */
  sections: Array<{ id: string; label: string }>;
  /** The static asset carrying the postings. `CONTENT_INDEX_PATH`. */
  url: string;
}

/**
 * The fetched half. Kept structural so the type is not imported from a module
 * that would drag the summaries into the client graph.
 *
 * `cases` travels with `terms` rather than staying on the page, even though it
 * is eight strings: a posting is an offset into it, so the two are one fact.
 * Split across a prop and a fetch they could disagree between a cached file
 * and a new deployment, and the failure would be a hit rendered against the
 * wrong case – the worst kind of wrong an archive can be.
 */
export interface ContentIndexFile {
  /** Summary slugs, in posting order. */
  cases: string[];
  /** Sorted term prefixes → concatenated postings. */
  terms: Record<string, string>;
  /** Characters kept per term. A query token is truncated the same way. */
  prefix: number;
}

/** Index of the first key that is >= `needle`, over a sorted array. */
function lowerBound(keys: string[], needle: string): number {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid] < needle) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Sections that carry one query token, as case index → set of section indices.
 *
 * A token is truncated to the index's prefix length and then matched as a
 * PREFIX over the key set, which is what makes a short query behave: three
 * letters reach every term that starts with them. A token at or past the
 * prefix length can only match its own key, because no key is longer than the
 * prefix – so one code path covers both.
 */
function tokenHits(
  idx: ContentIndexFile,
  keys: string[],
  token: string,
): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  for (const variant of expand(token)) {
    const needle = variant.slice(0, idx.prefix);
    if (!needle) continue;
    for (let i = lowerBound(keys, needle); i < keys.length; i++) {
      const key = keys[i];
      if (!key.startsWith(needle)) break;
      const postings = idx.terms[key];
      for (let j = 0; j + 1 < postings.length; j += 2) {
        const ci = parseInt(postings[j], 36);
        const si = parseInt(postings[j + 1], 36);
        let set = out.get(ci);
        if (!set) out.set(ci, (set = new Set()));
        set.add(si);
      }
    }
  }
  return out;
}

/**
 * Which cases carry EVERY token somewhere in their write-up, and which of
 * their sections to point the reader at.
 *
 * Two levels of AND, and the difference matters. A case qualifies when each
 * token appears somewhere in it – that is what puts the row in the table. The
 * sections named on the row are the ones where every token appears *together*,
 * because that is the screen the reader wants; when the tokens are scattered
 * across different sections there is no such screen, so the union is named
 * instead and the reader is told the truth by being given more than one place
 * to look.
 */
function contentMatches(
  idx: ContentIndexFile,
  keys: string[],
  tokens: string[],
): Map<number, number[]> {
  const out = new Map<number, number[]>();
  if (tokens.length === 0) return out;
  const perToken = tokens.map((t) => tokenHits(idx, keys, t));
  const first = perToken[0];
  for (const [ci, sections] of first) {
    if (!perToken.every((m) => m.has(ci))) continue;
    let together = [...sections];
    for (const m of perToken.slice(1)) {
      const other = m.get(ci)!;
      together = together.filter((si) => other.has(si));
    }
    if (together.length === 0) {
      const union = new Set<number>();
      for (const m of perToken) for (const si of m.get(ci)!) union.add(si);
      together = [...union];
    }
    out.set(ci, together.sort((a, b) => a - b));
  }
  return out;
}

/* ============================================================================
   Sorting
   ========================================================================== */

export type SortKey =
  | "year"
  | "decided"
  | "court"
  | "stage"
  | "outcome"
  | "readable"
  | "name";
type SortDir = "asc" | "desc";

/** Absent dimensions rank after every present one, in either direction. */
function rank<T>(order: readonly T[], value: T | null): number {
  if (value == null) return order.length;
  const i = order.indexOf(value);
  return i < 0 ? order.length : i;
}

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

/**
 * Every axis is a *primary* key only. The tail below runs after it, so equal
 * values never shuffle between renders and a second dimension is always doing
 * useful work: court, then most recent, then name, then id. That is the
 * "multiple parameters" the registry needed – several axes to choose from,
 * each with a fixed, meaningful secondary and a total tie-break.
 */
function tail(a: RegRow, b: RegRow): number {
  return (
    a.courtOrder - b.courtOrder ||
    (b.year ?? -Infinity) - (a.year ?? -Infinity) ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  );
}

function compare(a: RegRow, b: RegRow, { key, dir }: SortState): number {
  const sign = dir === "asc" ? 1 : -1;
  let primary = 0;
  switch (key) {
    case "year":
      primary = (a.year ?? -Infinity) - (b.year ?? -Infinity);
      break;
    case "decided": {
      // A row with no decision date has nothing to sort by: it goes last in
      // both directions rather than pretending to be the oldest or the newest.
      if (!a.decided && !b.decided) return tail(a, b);
      if (!a.decided) return 1;
      if (!b.decided) return -1;
      primary = a.decided.iso.localeCompare(b.decided.iso);
      break;
    }
    case "court":
      primary = a.courtOrder - b.courtOrder;
      break;
    case "stage":
      primary = rank(STAGE_ORDER, a.stage) - rank(STAGE_ORDER, b.stage);
      break;
    case "outcome":
      primary = rank(OUTCOME_ORDER, a.outcome) - rank(OUTCOME_ORDER, b.outcome);
      break;
    case "readable":
      primary = Number(a.lit) - Number(b.lit);
      break;
    case "name":
      primary = a.name.localeCompare(b.name);
      break;
  }
  return primary * sign || tail(a, b);
}

/* ============================================================================
   The reader's state, in the URL.

   Two things this buys, and the page had neither. A narrowed view is a link
   again – «усі справи ЄСПЛ у стадії виконання» is the sort of thing a lawyer
   sends to a colleague – and a reader who follows a row into a decision page
   and comes back lands on the view they left rather than on all thirty-nine.

   It is deliberately NOT `useSearchParams()`, which is how the incoming
   `?court=` used to be read. That hook makes a statically rendered page bail
   out to client-side rendering, and the cost was measured on this exact
   route: the built HTML for /uk/registry carried an 815-byte <main> holding
   the masthead and a BAILOUT_TO_CLIENT_SIDE_RENDERING marker where the table
   should be. No rows, no toolbar, no case names, no court names – on the one
   page this archive most needs indexed, and the only route on the site with
   that marker in it. The data still shipped, as 195KB of RSC payload inside
   <script> tags; it just never became markup.

   So: the URL is read from `window.location` once the tree has hydrated, and
   written back with `history.replaceState`, which does not go through the
   router and therefore cannot re-render, re-fetch or add a history entry per
   keystroke. The page prerenders in full again.
   ========================================================================== */

/** Layout phase on the client, plain effect on the server (where there is
 *  neither a layout phase nor a `window`). See the read effect for why the
 *  difference matters. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/* By court. The reader arrives at a docket of thirty-nine proceedings across
   twelve bodies, and the first question the page is asked is which forum a
   case sits in – «дефолтне сортування за Судом». Newest-first is still one
   press away and is the second option in the control. */
const DEFAULT_SORT: SortState = { key: "court", dir: "asc" };

const SORT_KEYS: SortKey[] = [
  "year",
  "decided",
  "court",
  "stage",
  "outcome",
  "readable",
  "name",
];

/** Everything the toolbar holds, in one shape, because the URL carries it all. */
interface UrlState {
  q: string;
  court: string[];
  stage: string[];
  outcome: string[];
  material: string[];
  sort: SortState;
}

/** The values each list filter is allowed to hold – the options actually on
 *  the page. A query string is user input like any other. */
interface Allowed {
  court: Set<string>;
  stage: Set<string>;
  outcome: Set<string>;
}

/**
 * Parse `window.location.search`.
 *
 * Every value is checked against the options the page is showing, and unknown
 * ones are dropped rather than emptying the table – a stale link to a court
 * that has since been renamed should still open the library.
 */
function readUrl(allow: Allowed): UrlState {
  const p = new URLSearchParams(window.location.search);
  const list = (name: string, ok: (v: string) => boolean) =>
    (p.get(name) ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v !== "" && ok(v));
  const [key, dir] = (p.get("sort") ?? "").split(":");
  return {
    q: p.get("q") ?? "",
    /* `court` keeps its name: the home page's court bands and the map's seat
       cards have been handing out `?court=icj,icc,pca` for a long time and
       those links are already in the world. */
    court: list("court", (v) => allow.court.has(v)),
    stage: list("stage", (v) => allow.stage.has(v)),
    outcome: list("outcome", (v) => allow.outcome.has(v)),
    material: list("material", (v) => v === "lit" || v === "wip"),
    sort:
      (SORT_KEYS as string[]).includes(key) && (dir === "asc" || dir === "desc")
        ? { key: key as SortKey, dir }
        : DEFAULT_SORT,
  };
}

/**
 * Write the state back, or clear the query string when nothing is narrowing.
 *
 * `replaceState`, not `pushState`: a history entry per keystroke would make
 * the back button a way to un-type a search rather than a way to leave.
 */
function writeUrl(s: UrlState): void {
  const p = new URLSearchParams();
  if (s.q.trim() !== "") p.set("q", s.q);
  if (s.court.length) p.set("court", s.court.join(","));
  if (s.stage.length) p.set("stage", s.stage.join(","));
  if (s.outcome.length) p.set("outcome", s.outcome.join(","));
  if (s.material.length) p.set("material", s.material.join(","));
  if (s.sort.key !== DEFAULT_SORT.key || s.sort.dir !== DEFAULT_SORT.dir) {
    p.set("sort", `${s.sort.key}:${s.sort.dir}`);
  }
  /* A comma is legal in a query string and these are lists the reader can
     read; `URLSearchParams` escapes them to %2C anyway, which turns
     `?court=icj,icc` into something nobody would paste into a message. */
  const query = p.toString().replace(/%2C/g, ",");
  const { pathname, search, hash } = window.location;
  const next = `${pathname}${query ? `?${query}` : ""}${hash}`;
  if (next !== `${pathname}${search}${hash}`) {
    window.history.replaceState(window.history.state, "", next);
  }
}

/* ============================================================================
   Labels
   ========================================================================== */

/**
 * Moved to `@/i18n/plural`, and re-exported here so `registry/page.tsx` keeps
 * importing it from where it always has. It was defined in this file and
 * needed in three: the map's court caseload was the surface that went without,
 * and printed «1 проваджень» on six of nine courts because of it.
 */
export { plural };
export type { PluralForms };

export interface RegistryLabels {
  search: string;
  searchLabel: string;
  /** The grid's own name. It used to borrow `searchLabel`, so the table
   *  announced itself as "Search the registry, table". */
  tableLabel: string;
  courts: string;
  courtsAll: string;
  stages: string;
  stagesAll: string;
  outcomes: string;
  outcomesAll: string;
  /* What a reader can actually open. Two facts the record already fixes: a
     row has a summary on this site (`lit`), and a row has a link to the
     court's own document (`decisionUrl`). Seventeen of thirty-nine have no
     document link, which is exactly the thing a reader of a legal archive
     wants to filter on before citing. */
  materials: string;
  materialsAll: string;
  matLit: string;
  matWip: string;
  /** The link on a row that opens the court's own document. */
  doc: string;
  /** Assistive-technology prefix on the figure: «Сума у спорі: $5,0 млрд». */
  /* The name on the control that folds the five filters away below 640. Just
     «Фільтри»: ordering sits outside it and is not one. */
  filters: string;
  sort: string;
  /* Ключами – саме ті порядки, що є в `SORTS`, а не будь-який рядок.
     Індексна сигнатура казала, що будь-який ключ на місці, і через це
     компілятор не побачив, як `yearDesc` зник зі словника, а контрол і далі
     просив у нього підпис: тип сказав «рядок», tsc промовчав, прод показав
     `undefined`. Тепер прибраний порядок ламає збірку в обох кінцях –
     і там, де його дають, і там, де просять. */
  sortOpt: Record<SortId, string>;
  colCourt: string;
  colCase: string;
  /* The tag column used to be called «Теги», which named the widget rather
     than the facts in it. It is two columns now, each named for the dimension
     it carries and each sortable in its own right. */
  colStage: string;
  colOutcome: string;
  colDate: string;
  sortAsc: string;
  sortDesc: string;
  sortNone: string;
  results: PluralForms;
  ofTotal: string;
  combine: string;
  reset: string;
  /** Accessible name of the active-filter list. */
  activeFilters: string;
  /** Verb on each active-filter chip: «Прибрати фільтр: Суди – ЄСПЛ». */
  clearFilter: string;
  clearSearch: string;
  emptyHead: string;
  emptyBody: string;
  /** The write-up index is on its way; the query is running on rows alone. */
  searchLoading: string;
  /** It is not coming. Same half-answer, and it will not fill in. */
  searchNoIndex: string;
  matched: string;
  /** Prefix on the line that names which part of a write-up matched. */
  matchedIn: string;
  group: Record<FindGroup, string>;
  decidedOn: string;
  noDate: string;
  stageName: string;
  outcomeName: string;
}

/** The axes offered by the sort control, in the order they are listed. */
/* Тільки те, чого не вміють заголовки колонок.

   У списку було девʼять порядків, і шість із них – за судом, за назвою, за
   станом розгляду, за типом рішення, спершу нові, спершу давні – це рівно
   те, що дає натискання на «СУД», «СПРАВА», «СТАН РОЗГЛЯДУ», «ТИП РІШЕННЯ»
   і «РІК». Той самий порядок, двома різними органами. Власниця: «забери
   зайві сортування».

   Лишилося три: сортування за судом (воно ж стан за замовчуванням, і
   контрол мусить уміти його показати), за датою рішення – колонки з нею
   немає – і «спершу опрацьовані», якої в таблиці теж немає колонки. Порядок
   за сумами пішов разом із сумами. */
const SORTS = [
  /* Перший – той, що за замовчуванням: `DEFAULT_SORT_ID` читає його звідси,
     а не називає своїм рядком. Доти контрол тричі згадував «yearDesc» –
     підписом, ознакою «не за замовчуванням» і станом, у який повертався при
     знятті вибору, – і коли той порядок прибрали зі списку, підпис став
     undefined, а зняття вибору кидало таблицю в порядок, якого в меню вже
     немає. Та сама помилка, що й у `active` нижче, і те саме лікування:
     одне джерело. */
  { id: "court", key: "court", dir: "asc" },
  { id: "decidedDesc", key: "decided", dir: "desc" },
  { id: "readable", key: "readable", dir: "desc" },
] as const satisfies ReadonlyArray<{ id: string; key: SortKey; dir: SortDir }>;
/** Ідентифікатор кожного порядку, який контрол уміє показати. */
type SortId = (typeof SORTS)[number]["id"];
/** Порядок за замовчуванням, названий так, як його називає контрол. */
const DEFAULT_SORT_ID: SortId = SORTS[0].id;

/* ============================================================================
   Listbox – a real one.

   A native <select> cannot be styled past its closed state (the open popup is
   the OS's, not the page's) and `<select multiple>` is a scrolling box, not a
   dropdown. So: button + role="listbox", aria-activedescendant, full keyboard.
   ========================================================================== */

interface Opt {
  value: string;
  label: string;
  /** How many of the loaded rows carry this value. */
  count?: number;
}

function Listbox({
  label,
  allLabel,
  options,
  selected,
  onChange,
  multi,
  variant = "filter",
  summaryOverride,
  activeOverride,
}: {
  label: string;
  allLabel: string;
  options: Opt[];
  selected: string[];
  onChange: (next: string[]) => void;
  multi: boolean;
  /**
   * Filtering and ordering are different acts, so they do not wear the same
   * control. A `filter` is an enclosed pill that names its dimension and
   * carries a count when it is narrowing; `sort` is an underlined text control
   * at the other end of the row that shows the order itself.
   */
  variant?: "filter" | "sort";
  /**
   * The sort state can also be set by clicking a column heading, and a heading
   * clicked twice reaches a direction no preset names. The control says what
   * the order actually is rather than falling back to «Спершу нові».
   */
  summaryOverride?: string;
  /**
   * Whether the control counts as "doing something". A filter decides that for
   * itself – anything chosen is narrowing – but every list is in some order,
   * so only the caller knows which order is the default one.
   */
  activeOverride?: boolean;
}) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trigRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ buf: "", at: 0 });

  /* "Усі суди" is an option rather than a second control: one idiom for
     clearing, matching the СКИНУТИ button rather than competing with it.
     Ordering has no "all": every list is in *some* order, and the synthetic
     row listed «Спершу нові» twice – once as the clear-everything row and
     once as the preset that means exactly the same thing. */
  const rows: Opt[] = useMemo(
    () =>
      variant === "sort" ? options : [{ value: "", label: allLabel }, ...options],
    [allLabel, options, variant],
  );

  const chosen = rows.filter((r) => r.value !== "" && selected.includes(r.value));
  /* What the closed control shows. The sort control shows the order; a filter
     shows its own dimension plus a count, because *which* values are chosen is
     spelled out by the removable chips under the toolbar – repeating them
     inside the trigger is what made these read as form fields. */
  const summary =
    variant === "sort"
      ? (summaryOverride ?? chosen[0]?.label ?? allLabel)
      : label;
  const readback =
    variant === "sort"
      ? (summaryOverride ?? chosen[0]?.label ?? allLabel)
      : chosen.length === 0
        ? allLabel
        : chosen.map((c) => c.label).join(", ");
  const on = activeOverride ?? chosen.length > 0;

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) trigRef.current?.focus();
  }, []);

  const openAt = useCallback(
    (index: number) => {
      setActive(index);
      setOpen(true);
    },
    [],
  );

  // Focus follows the popup so the keyboard never lands on the page body.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      // The popup is about to be unmounted. If it is holding focus, hand it
      // back to the trigger first – otherwise focus falls to <body> and the
      // keyboard user is dropped at the top of the document. The browser still
      // moves focus on to whatever was clicked, when that is focusable.
      const inside = listRef.current?.contains(document.activeElement);
      setOpen(false);
      if (!inside) return;
      trigRef.current?.focus();
      /* …and again after the browser has run mousedown's own default action,
         which overrides the line above. Measured: focus did not fall all the
         way to <body>, but it did land on `main[tabindex="-1"]` – the nearest
         programmatically-focusable ancestor – so the keyboard user was still
         dropped out of the toolbar. Anything the reader actually clicked into
         is a real tab stop (tabIndex >= 0) and keeps the focus it just won. */
      requestAnimationFrame(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el.tabIndex < 0) trigRef.current?.focus();
      });
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (value: string) => {
    if (value === "") {
      onChange([]);
      if (!multi) close(true);
      return;
    }
    if (!multi) {
      onChange([value]);
      close(true);
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const scrollActive = (index: number) => {
    const el = document.getElementById(`${listId}-${index}`);
    el?.scrollIntoView({ block: "nearest" });
  };

  const move = (index: number) => {
    const next = Math.max(0, Math.min(rows.length - 1, index));
    setActive(next);
    requestAnimationFrame(() => scrollActive(next));
  };

  const onTriggerKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAt(Math.max(0, rows.findIndex((r) => selected.includes(r.value))));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAt(rows.length - 1);
    }
  };

  const onListKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(active + 1);
        return;
      case "ArrowUp":
        e.preventDefault();
        move(active - 1);
        return;
      case "Home":
        e.preventDefault();
        move(0);
        return;
      case "End":
        e.preventDefault();
        move(rows.length - 1);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        toggle(rows[active].value);
        return;
      case "Escape":
        e.preventDefault();
        close(true);
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        break;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      typed.current.buf =
        now - typed.current.at > 600 ? e.key : typed.current.buf + e.key;
      typed.current.at = now;
      const needle = norm(typed.current.buf);
      const hit = rows.findIndex((r) => norm(r.label).startsWith(needle));
      if (hit >= 0) move(hit);
    }
  };

  return (
    <div className="reg-lb" data-variant={variant} ref={wrapRef}>
      <button
        type="button"
        ref={trigRef}
        className="reg-trig"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${readback}`}
        data-on={on ? "1" : undefined}
        onClick={() =>
          open
            ? close(false)
            : openAt(Math.max(0, rows.findIndex((r) => selected.includes(r.value))))
        }
        onKeyDown={onTriggerKey}
      >
        {variant === "sort" && (
          <span className="ts" aria-hidden="true">
            ↕
          </span>
        )}
        <span className="tv">{summary}</span>
        {/* The count is a numeral, not a colour: a filter that is narrowing
            says so in a way that survives a monochrome screen. */}
        {variant === "filter" && chosen.length > 0 && (
          <span className="tn" aria-hidden="true">
            {chosen.length}
          </span>
        )}
        <span className="tc" aria-hidden="true" />
      </button>
      {open && (
        <div
          className="reg-pop"
          role="listbox"
          id={listId}
          ref={listRef}
          tabIndex={-1}
          aria-label={label}
          aria-multiselectable={multi || undefined}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
        >
          {rows.map((r, i) => {
            const isSel =
              r.value === "" ? selected.length === 0 : selected.includes(r.value);
            return (
              <div
                key={r.value || "__all"}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSel}
                className="reg-opt"
                data-active={i === active ? "1" : undefined}
                data-all={r.value === "" ? "1" : undefined}
                /* Move, not enter. A popup that opens under a pointer parked
                   from an earlier click fires mouseenter on whatever lands
                   beneath it, which threw the keyboard's active option away:
                   measured at 390px, End and Home both landed on whichever
                   row the stationary cursor happened to be over. mousemove
                   only fires when the pointer really moves. */
                onMouseMove={() => setActive(i)}
                onClick={() => toggle(r.value)}
              >
                <span className="ok" aria-hidden="true">
                  {isSel ? "✓" : ""}
                </span>
                <span className="ol">{r.label}</span>
                {r.count != null && (
                  <span className="oc" aria-hidden="true">
                    {r.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   Highlighting
   ========================================================================== */

/** Wrap the query's tokens where they occur verbatim in a visible field. */
function highlight(text: string, tokens: string[]): ReactNode {
  if (tokens.length === 0) return text;
  const escaped = tokens
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (escaped.length === 0) return text;
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  const re = new RegExp(`^(?:${escaped.join("|")})$`, "i");
  return parts.map((part, i) =>
    re.test(part) ? <mark key={i}>{part}</mark> : part,
  );
}

/* ============================================================================
   The table
   ========================================================================== */

export default function RegistryTable({
  rows,
  courts,
  stages,
  outcomes,
  content,
  t,
}: {
  rows: RegRow[];
  courts: Array<{ id: string; abbr: string }>;
  stages: Array<{ key: CaseStageKey; label: string }>;
  outcomes: Array<{ key: CaseOutcomeKey; label: string }>;
  /** The build-time index over the eight write-ups. */
  content: ContentIndexProp;
  t: RegistryLabels;
}) {
  /* Rows without a summary link to `/[locale]/cases/{id}`, and the row data is
     already localized to strings, so the locale comes off the path this table
     is mounted on (`/uk/registry`) rather than a prop the server would have to
     thread through. `usePathname` is safe here in a way `useSearchParams` is
     not: it does not bail the route out of prerendering. */
  const seg = usePathname().split("/")[1];
  const locale = isLocale(seg) ? seg : defaultLocale;

  /* Every state below starts at its default on BOTH sides of hydration, which
     is what lets the server render the whole table into the HTML. The
     reader's own view arrives from the URL in the layout effect further
     down. */
  const [q, setQ] = useState("");
  const [court, setCourt] = useState<string[]>([]);
  const [stage, setStage] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<string[]>([]);
  const [material, setMaterial] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  /* Below 640 the five filters fold away behind one control. Shut by default:
     the reader came for the cases. */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();

  /* ── The index over the eight write-ups, as a file ──────────────────────
     It used to arrive with the page: 24,137 gzipped bytes of postings in a
     53,379-byte document, downloaded by every reader who opened the library
     and read only by the ones who searched it. It is asked for now the first
     time a reader reaches for the field – hovering it, focusing it, or
     arriving with a ?q= in the URL.

     What the field does before it lands: it works. The thirty-nine rows and
     their five haystacks are already here – name, note, court, status, field,
     date – and that half of the search needs nothing fetched. What is missing
     is the other half, the summaries behind eight of the rows, and a search
     that quietly returns a short answer is the failure this index was built
     to fix in the first place. So while it is in flight, or if it never
     arrives, the count line says which half is running. It is never disabled:
     a field that refuses to take a query it could answer is a worse lie than
     a slow one. */
  const [index, setIndex] = useState<ContentIndexFile | null>(null);
  const [indexState, setIndexState] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("idle");
  const indexAsked = useRef(false);
  const wantIndex = useCallback(() => {
    if (indexAsked.current) return;
    indexAsked.current = true;
    setIndexState("loading");
    fetch(content.url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: ContentIndexFile) => {
        setIndex(d);
        setIndexState("ready");
      })
      .catch(() => setIndexState("failed"));
  }, [content.url]);

  /** The values a query string may name – the options this page is showing. */
  const allow: Allowed = useMemo(
    () => ({
      court: new Set(courts.map((c) => c.id)),
      stage: new Set<string>(stages.map((x) => x.key)),
      outcome: new Set<string>(outcomes.map((x) => x.key)),
    }),
    [courts, stages, outcomes],
  );

  /* Read the URL – a *layout* effect, not an ordinary one.

     It runs after hydration has matched the server's markup and before the
     browser paints, so React flushes the resulting re-render in the same
     frame: a reader arriving at ?court=icj never sees all thirty-nine rows
     flash past on the way to three. `useEffect` would paint the unfiltered
     table first and then correct it.

     Mount only. The URL is the way *in*; after that this component owns the
     state and the writer below owns the URL. Re-running this on a prop change
     would throw away whatever the reader had narrowed to. */
  useIsomorphicLayoutEffect(() => {
    const u = readUrl(allow);
    /* Set only what the URL actually named. Calling every setter would hand
       React six fresh array identities and force a re-render for a link that
       carried no query string at all. */
    if (u.q !== "") {
      setQ(u.q);
      /* A shared filtered link is a query nobody is going to retype, and its
         reader never touches the field – so the field's own triggers would
         never fire and the write-ups would never be searched. */
      wantIndex();
    }
    if (u.court.length) setCourt(u.court);
    if (u.stage.length) setStage(u.stage);
    if (u.outcome.length) setOutcome(u.outcome);
    if (u.material.length) setMaterial(u.material);
    if (u.sort.key !== DEFAULT_SORT.key || u.sort.dir !== DEFAULT_SORT.dir) {
      setSort(u.sort);
    }
  }, []);

  /* Back and forward. Our own writes use replaceState and so create no
     history entries, but the browser can still hand this component a
     different query string underneath it – a soft navigation back from a
     decision page that keeps the tree mounted, or a reader editing the
     address bar. Then the URL is authoritative again, defaults included. */
  useEffect(() => {
    const onPop = () => {
      const u = readUrl(allow);
      if (u.q !== "") wantIndex();
      setQ(u.q);
      setCourt(u.court);
      setStage(u.stage);
      setOutcome(u.outcome);
      setMaterial(u.material);
      setSort(u.sort);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [allow, wantIndex]);

  /* Write the URL. Skipped exactly once: on mount this runs with the defaults
     still in place – the reader's values are set by the layout effect above
     and land on the next render – so writing here would erase the ?court=
     they arrived with before anything had read it. */
  const firstWrite = useRef(true);
  useEffect(() => {
    if (firstWrite.current) {
      firstWrite.current = false;
      return;
    }
    writeUrl({ q, court, stage, outcome, material, sort });
  }, [q, court, stage, outcome, material, sort]);

  /* «Щось звужено» – це відхилення від стану за замовчуванням, тож і
     порівнювати треба з ним. Тут стояло `!== "year" || !== "desc"` –
     дефолт, який був до того, як він став «за судом». Відколи став,
     свіжовідкрита сторінка вважалася звуженою, і кнопка «Скинути» стояла
     під кожним першим переглядом, не маючи чого скидати. Те саме число,
     що в `writeUrl`, де воно від початку читається з `DEFAULT_SORT`. */
  const active =
    q.trim() !== "" ||
    court.length > 0 ||
    stage.length > 0 ||
    outcome.length > 0 ||
    material.length > 0 ||
    sort.key !== DEFAULT_SORT.key ||
    sort.dir !== DEFAULT_SORT.dir;

  /** Normalise once per row, not once per keystroke per row. */
  const haystacks = useMemo(
    () =>
      new Map(
        rows.map((r) => [
          r.id,
          {
            visible: norm(r.find.visible),
            court: norm(r.find.court),
            status: norm(r.find.status),
            type: norm(r.find.type),
            date: norm(r.find.date),
          } as Record<FindGroup, string>,
        ]),
      ),
    [rows],
  );

  const tokens = useMemo(
    () => norm(q).split(" ").filter(Boolean),
    [q],
  );

  /** The index's own key list, sorted once rather than per keystroke. */
  const termKeys = useMemo(
    () => (index ? Object.keys(index.terms) : []),
    [index],
  );

  /** slug → the sections of its write-up that carry the whole query. */
  const inWriteup = useMemo(() => {
    const out = new Map<string, string[]>();
    if (!index) return out;
    const byIndex = contentMatches(index, termKeys, tokens);
    for (const [ci, sections] of byIndex) {
      const slug = index.cases[ci];
      if (!slug) continue;
      out.set(
        slug,
        sections.map((si) => content.sections[si]?.id).filter(Boolean) as string[],
      );
    }
    return out;
  }, [index, content.sections, termKeys, tokens]);

  const view = useMemo(() => {
    const out = rows.filter((r) => {
      // Several values inside one filter mean OR; the filters are ANDed.
      if (court.length && !court.includes(r.courtId)) return false;
      if (stage.length && !(r.stage && stage.includes(r.stage))) return false;
      if (outcome.length && !(r.outcome && outcome.includes(r.outcome)))
        return false;
      if (
        material.length &&
        !material.some((m) => (m === "lit" ? r.lit : !r.lit))
      )
        return false;
      if (tokens.length === 0) return true;
      const hay = haystacks.get(r.id)!;
      const all = Object.values(hay).join(" ");
      /* Metadata OR content: a row earns its place either because the query
         is in what the row shows, or because it is somewhere in the write-up
         behind it. Before the index existed only the first half was possible,
         and a search for «депортація дітей» returned nothing from an archive
         with a whole ICC page about it. */
      if (tokens.every((tok) => hits(all, tok))) return true;
      return r.slug != null && inWriteup.has(r.slug);
    });
    return out.sort((a, b) => compare(a, b, sort));
  }, [
    rows,
    court,
    stage,
    outcome,
    material,
    tokens,
    haystacks,
    inWriteup,
    sort,
  ]);

  /** Which hidden fields earned a row its place, when the visible ones did not. */
  const why = useCallback(
    (r: RegRow): string[] => {
      if (tokens.length === 0) return [];
      const hay = haystacks.get(r.id)!;
      const groups = new Set<FindGroup>();
      for (const tok of tokens) {
        if (hits(hay.visible, tok)) continue;
        for (const g of HIDDEN_GROUPS) {
          if (hits(hay[g], tok)) groups.add(g);
        }
      }
      return [...groups].map((g) => t.group[g]);
    },
    [tokens, haystacks, t],
  );

  /* Where the keyboard goes when the control it was on is about to stop
     existing.

     Three controls on this page delete themselves as their own last act: a
     chip removes the value it names, «Скинути» clears the state that put it
     on the page, and the search field's ✕ clears the query that made it
     appear. Only the third had ever been handled – it puts the caret back in
     the field it emptied. The other two dropped focus on <body>, which sends
     a keyboard reader back to the top of the document to tab in again, and
     the chips are exactly the control a keyboard reader uses most: one Enter
     per value they want gone.

     A ref rather than state: this is not something the page renders, and it
     must survive the render that removes the button without causing one. */
  const focusAfter = useRef<
    null | { kind: "chip"; index: number } | { kind: "search" }
  >(null);
  const chipsRef = useRef<HTMLUListElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  /* No dependency list. It has to run after *any* render that might have
     removed the control, and it clears its own instruction, so an empty run
     costs one null check. */
  useEffect(() => {
    const want = focusAfter.current;
    if (!want) return;
    focusAfter.current = null;
    if (want.kind === "search") {
      document.getElementById("reg-q")?.focus();
      return;
    }
    /* The chip that took the removed one's place, so a reader clearing four
       values presses Enter four times without moving their hands. Past the
       end of a shortened list, the last chip; past the last chip, the
       toolbar, because there is nothing left to clear. */
    const list = chipsRef.current?.querySelectorAll<HTMLElement>(".reg-chip");
    const next = list?.length
      ? list[Math.min(want.index, list.length - 1)]
      : toolbarRef.current?.querySelector<HTMLElement>("button, input");
    next?.focus();
  });

  const reset = () => {
    setQ("");
    setCourt([]);
    setStage([]);
    setOutcome([]);
    setMaterial([]);
    setSort(DEFAULT_SORT);
    /* «Скинути» is the last control standing after it runs – it takes itself
       off the page along with the chips and, in the empty state, the panel it
       sits in. The search field is where the instrument starts. */
    focusAfter.current = { kind: "search" };
  };

  const sortId = SORTS.find((s) => s.key === sort.key && s.dir === sort.dir)?.id;
  const sortOptions: Opt[] = SORTS.map((s) => ({
    value: s.id,
    label: t.sortOpt[s.id],
  }));

  /* A heading clicked twice reverses its axis, and four of those reversals –
     court, name, stage and outcome descending – are states no preset in SORTS
     names. The control used to fall back to its "all" label and claim «Спершу
     нові» while the table was ordered by something else; it now reads the real
     state off the column's own name. */
  const COL: Partial<Record<SortKey, string>> = {
    court: t.colCourt,
    name: t.colCase,
    stage: t.colStage,
    outcome: t.colOutcome,
    year: t.colDate,
  };
  const sortSummary = sortId
    ? undefined
    : `${COL[sort.key] ?? ""} – ${sort.dir === "asc" ? t.sortAsc : t.sortDesc}`;

  /* The active filters, spelled out. A reader who has narrowed to two courts
     can see which two without opening anything, and each chip clears its own
     value in one click – «Скинути» stays the one action that clears
     everything, the search and the ordering included. */
  const courtLabel = (id: string) =>
    courts.find((c) => c.id === id)?.abbr ?? id;
  const chips: Array<{ id: string; dim: string; label: string; clear: () => void }> = [
    ...court.map((v) => ({
      id: `court:${v}`,
      dim: t.courts,
      label: courtLabel(v),
      clear: () => setCourt(court.filter((x) => x !== v)),
    })),
    ...stage.map((v) => ({
      id: `stage:${v}`,
      dim: t.stages,
      label: stages.find((s) => s.key === v)?.label ?? v,
      clear: () => setStage(stage.filter((x) => x !== v)),
    })),
    ...outcome.map((v) => ({
      id: `outcome:${v}`,
      dim: t.outcomes,
      label: outcomes.find((o) => o.key === v)?.label ?? v,
      clear: () => setOutcome(outcome.filter((x) => x !== v)),
    })),
    ...material.map((v) => ({
      id: `material:${v}`,
      dim: t.materials,
      label: v === "lit" ? t.matLit : t.matWip,
      clear: () => setMaterial(material.filter((x) => x !== v)),
    })),
  ];

  /** Clicking a heading takes that axis; clicking it again flips direction. */
  const head = (key: SortKey, defaultDir: SortDir, label: string) => {
    const on = sort.key === key;
    const dir = on ? sort.dir : defaultDir;
    return (
      <div
        role="columnheader"
        aria-sort={on ? (dir === "asc" ? "ascending" : "descending") : "none"}
        className="reg-th"
      >
        <button
          type="button"
          className="reg-sortbtn"
          onClick={() =>
            setSort(
              on
                ? { key, dir: dir === "asc" ? "desc" : "asc" }
                : { key, dir: defaultDir },
            )
          }
        >
          {label}
          <span className="sd" aria-hidden="true">
            {on ? (dir === "asc" ? "▲" : "▼") : "↕"}
          </span>
          <span className="sr-only">
            {on ? (dir === "asc" ? t.sortAsc : t.sortDesc) : t.sortNone}
          </span>
        </button>
      </div>
    );
  };

  const multiCount =
    (court.length > 1 ? 1 : 0) +
    (stage.length > 1 ? 1 : 0) +
    (outcome.length > 1 ? 1 : 0) +
    (material.length > 1 ? 1 : 0);

  return (
    <section className="reg-page">
      <div className="reg-toolbar" ref={toolbarRef}>
        {/* The search is a line of the instrument, not a box sitting next to
            it: a rule under it, a glyph in front of it and the same edge
            colour the pills carry. A boxed field in one idiom beside pills in
            another is what made the toolbar read as a form. */}
        <div className="reg-searchwrap">
          <label className="sr-only" htmlFor="reg-q">
            {t.searchLabel}
          </label>
          <span className="reg-si" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="17" height="17" focusable="false">
              <circle
                cx="6.8"
                cy="6.8"
                r="4.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M10.3 10.3 L14 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id="reg-q"
            className="reg-search"
            type="search"
            placeholder={t.search}
            value={q}
            /* Three chances to have the postings in hand before the first
               keystroke lands, in the order a reader gets there: the pointer
               arriving over the field, the field taking focus (which covers
               the keyboard and a tap), and the keystroke itself as the
               backstop. All three run through one ref, so this is one request
               however many of them fire. */
            onPointerEnter={wantIndex}
            onFocus={wantIndex}
            onChange={(e) => {
              wantIndex();
              setQ(e.target.value);
            }}
          />
          {q !== "" && (
            <button
              type="button"
              className="reg-x"
              aria-label={t.clearSearch}
              onClick={() => {
                setQ("");
                document.getElementById("reg-q")?.focus();
              }}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
        <div className="reg-filters">
          {/* Below 640 the five filters fold behind one control.

              Stacked full width they ran to 292px, and with the masthead
              above them that put the first case row at 921px on an 812px
              screen: the library opened on no library at all, a full screen
              of chrome before a reader saw a single proceeding. Folded, they
              are one pill carrying its own count, and the chips under the
              toolbar still name every value that is narrowing whether this is
              open or shut – so nothing becomes invisible, only quiet.

              Ordering stays outside it. Under 900px the column headings are
              gone from the page, which makes this control the only way to
              reorder, and it is not a filter. */}
          <button
            type="button"
            className="reg-trig reg-fbtn"
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            data-on={chips.length > 0 ? "1" : undefined}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <span className="tv">{t.filters}</span>
            {chips.length > 0 && (
              <span className="tn" aria-hidden="true">
                {chips.length}
              </span>
            )}
            <span className="tc" aria-hidden="true" />
          </button>
          <div
            className="reg-fset"
            id={filtersId}
            data-open={filtersOpen ? "1" : undefined}
          >
          <Listbox
            label={t.courts}
            allLabel={t.courtsAll}
            multi
            options={courts.map((c) => ({
              value: c.id,
              label: c.abbr,
              count: rows.filter((r) => r.courtId === c.id).length,
            }))}
            selected={court}
            onChange={setCourt}
          />
          <Listbox
            label={t.stages}
            allLabel={t.stagesAll}
            multi
            options={stages.map((s) => ({
              value: s.key,
              label: s.label,
              count: rows.filter((r) => r.stage === s.key).length,
            }))}
            selected={stage}
            onChange={setStage}
          />
          <Listbox
            label={t.outcomes}
            allLabel={t.outcomesAll}
            multi
            options={outcomes.map((o) => ({
              value: o.key,
              label: o.label,
              count: rows.filter((r) => r.outcome === o.key).length,
            }))}
            selected={outcome}
            onChange={setOutcome}
          />
          {/* Де рядок у нас: огляд готовий, або ми його пишемо. Дві
              половини однієї величини (`lit`), а не два незалежні прапорці,
              тож разом вони дають усі тридцять девʼять – вибрати обидві те
              саме, що не вибрати жодної, і рахунки це показують. */}
          <Listbox
            label={t.materials}
            allLabel={t.materialsAll}
            multi
            options={[
              { value: "lit", label: t.matLit, count: rows.filter((r) => r.lit).length },
              {
                value: "wip",
                label: t.matWip,
                count: rows.filter((r) => !r.lit).length,
              },
            ]}
            selected={material}
            onChange={setMaterial}
          />
          </div>
          {/* Ordering is not narrowing, so it does not wear a filter's pill:
              it sits at the far end of the row as an underlined text control.
              It stays on wide screens even though the heading row sorts too –
              two of its axes, the decision date and "ready to read first",
              have no column to click. */}
          <div className="reg-sort">
            <Listbox
              label={t.sort}
              allLabel={t.sortOpt[DEFAULT_SORT_ID]}
              multi={false}
              variant="sort"
              summaryOverride={sortSummary}
              activeOverride={sortId !== DEFAULT_SORT_ID}
              options={sortOptions}
              selected={sortId ? [sortId] : []}
              onChange={(next) => {
                const picked = SORTS.find((s) => s.id === next[0]);
                setSort(
                  picked
                    ? { key: picked.key, dir: picked.dir }
                    : DEFAULT_SORT,
                );
              }}
            />
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="reg-active" ref={chipsRef} aria-label={t.activeFilters}>
          {chips.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className="reg-chip"
                aria-label={`${t.clearFilter}: ${c.dim} – ${c.label}`}
                onClick={() => {
                  focusAfter.current = { kind: "chip", index: i };
                  c.clear();
                }}
              >
                <span className="cd" aria-hidden="true">
                  {c.dim}
                </span>
                <span className="cv" aria-hidden="true">
                  {c.label}
                </span>
                <span className="cx" aria-hidden="true">
                  ✕
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="reg-count">
        <p aria-live="polite">
          <b>{view.length}</b> {plural(view.length, t.results, locale)}
          <span className="of"> · {t.ofTotal.replace("{total}", String(rows.length))}</span>
        </p>
        {multiCount > 0 && <p className="reg-combine">{t.combine}</p>}
        {/* Which half of the search is running. Only ever shown while there is
            a query to be half-answered – with the field empty the reader is
            looking at all thirty-nine rows and nothing is missing. */}
        {tokens.length > 0 && indexState !== "ready" && (
          <p className="reg-partial">
            {indexState === "failed" ? t.searchNoIndex : t.searchLoading}
          </p>
        )}
        {active && (
          <button type="button" className="reg-reset" onClick={reset}>
            {t.reset}
          </button>
        )}
      </div>

      {view.length === 0 ? (
        <div className="reg-empty">
          <p className="eh">{t.emptyHead}</p>
          <p>{t.emptyBody}</p>
          <button type="button" className="reg-reset" onClick={reset}>
            {t.reset}
          </button>
        </div>
      ) : (
        <div className="reg-list" role="table" aria-label={t.tableLabel}>
          <div role="rowgroup" className="reg-thead">
            <div role="row" className="reg-row reg-hrow">
              {head("court", "asc", t.colCourt)}
              {head("name", "asc", t.colCase)}
              {head("stage", "asc", t.colStage)}
              {head("outcome", "asc", t.colOutcome)}
              {head("year", "desc", t.colDate)}
            </div>
          </div>
          <div role="rowgroup">
            {view.map((r) => {
              // Every proceeding is addressable: a summary opens the decision
              // page, the rest open the pending page. The lit/unlit dot, not a
              // dead row, is what says which is which.
              const href = r.href ?? `/${locale}/cases/${r.id}`;
              const reasons = why(r);
              /* Where in the write-up the query landed. A row is a case, but
                 the match may be in a chronology entry three screens down, so
                 each section named here is a link that lands on it. */
              const inDocAll = r.slug ? (inWriteup.get(r.slug) ?? []) : [];
              /* Capped. A one-word query can land in every band of a long
                 write-up – oschadbank matches «крим» in all six – and six
                 links under a table row is a second navigation, not a hint.
                 Four, in page order, and the rest counted rather than
                 dropped silently. */
              const inDoc = inDocAll.slice(0, 4);
              const inDocMore = inDocAll.length - inDoc.length;
              return (
                <div
                  role="row"
                  key={r.id}
                  className={`reg-row reg-drow ${r.lit ? "is-lit" : ""}`}
                >
                  <span role="cell" className="reg-court">
                    <span className="dot" aria-hidden="true" />
                    {r.court}
                  </span>
                  <span role="cell" className="reg-main">
                    {/* The link sits in the case cell and its ::after covers
                        the row, so the whole row stays clickable without a
                        link wrapping table rows. */}
                    {/* Ukrainian leads, because the page is in Ukrainian.

                        This is what the commit that introduced `nameUk` said
                        it was doing – "Ukrainian leads because Ukrainian is
                        what the page is in… the caption is still there, in
                        full, one line down" – and the markup did the
                        opposite: the English citation was the link, set large,
                        and the Ukrainian sat under it at 12.5px. The comment
                        here was then written to describe the result rather
                        than the decision, which is how the two stayed at odds
                        for as long as they did.

                        The citation has not gone anywhere: it is the line
                        below, which is where a thing you quote belongs once
                        the reader has found the row. `lang` on each, because
                        neither is guaranteed to be the page's language – see
                        foreignLang(); a Ukrainian voice reading a Latin-script
                        caption phonetically is unintelligible.

                        All 33 proceedings carry `nameUk`, so no row loses its
                        link: where one did not, the citation would take the
                        lead again, which is the right fallback. */}
                    <a
                      className="reg-name"
                      href={href}
                      lang={foreignLang(r.nameUk || r.name, locale)}
                    >
                      {highlight(r.nameUk || r.name, tokens)}
                    </a>
                    {r.nameUk && (
                      <span className="reg-name-uk" lang={foreignLang(r.name, locale)}>
                        {highlight(r.name, tokens)}
                      </span>
                    )}
                    {r.note && (
                      <span className="reg-note" lang={foreignLang(r.note, locale)}>
                        {highlight(r.note, tokens)}
                      </span>
                    )}
                    {/* The acts this proceeding carries, named on its row.

                        They were rows themselves – six ICC warrants beside
                        the situation they were issued in, so the library's
                        ICC group counted seven proceedings where there is
                        one. Printed here the count is the warrants' («6
                        ордерів»), the row is the proceeding's, and both are
                        things a reader can check by looking.

                        Each name links to the Court's own page for that
                        accused, so it sits above `.reg-name::after` – the
                        overlay that makes the whole row one target – the
                        same way `.reg-doc` does. */}
                    {r.acts.length > 0 && (
                      <span className="reg-acts">
                        <b className="reg-acts-n">
                          {r.actsLabel}
                          {r.actsNote && (
                            <sup className="reg-acts-star" aria-hidden="true">*</sup>
                          )}
                        </b>
                        <span className="reg-acts-list">
                          {r.acts.map((a, i) => (
                            <span key={a.id}>
                              {i > 0 && <span aria-hidden="true"> · </span>}
                              {a.href ? (
                                <a
                                  href={a.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {highlight(a.name, tokens)}
                                </a>
                              ) : (
                                highlight(a.name, tokens)
                              )}
                            </span>
                          ))}
                        </span>
                        {r.actsNote && (
                          <i className="reg-acts-note">
                            <span aria-hidden="true">* </span>
                            {r.actsNote}
                          </i>
                        )}
                      </span>
                    )}
                    {reasons.length > 0 && (
                      <span className="reg-why">
                        {t.matched} {reasons.join(" · ")}
                      </span>
                    )}
                    {/* The court's own document, one click from the list.

                        It sits above `.reg-name::after` – the overlay that
                        makes the whole row one target – the same way the
                        write-up section links do, which is what `position:
                        relative; z-index: 1` buys in the stylesheet. Without
                        that it would be underneath the row link and
                        unclickable. */}
                    {r.docUrl && (
                      <a
                        className="reg-doc"
                        href={r.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.doc}
                      </a>
                    )}
                    {inDoc.length > 0 && (
                      <span className="reg-inwrite">
                        <span className="rw-l">{t.matchedIn}</span>
                        {inDoc.map((id) => (
                          <a key={id} className="rw-s" href={`${href}#${id}`}>
                            {content.sections.find((x) => x.id === id)?.label ?? id}
                          </a>
                        ))}
                        {inDocMore > 0 && (
                          <span className="rw-l">+{inDocMore}</span>
                        )}
                      </span>
                    )}
                    {/* The full status wording sits with the case name rather
                        than in the outcome cell: a row whose record names no
                        act can then leave that cell genuinely empty, and the
                        stacked layout drops it instead of keeping a 1px
                        sliver of it. */}
                    <span className="sr-only">{r.status}</span>
                  </span>
                  {/* Two cells, not one: the stage of the proceedings and the
                      act the forum issued are different facts, each with its
                      own heading and its own aria-sort. The visually-hidden
                      prefix stays on the chip itself, so the dimension is
                      still named below 820px where the heading row is gone. */}
                  <span role="cell" className="reg-tags reg-cstage chip">
                    {r.stageLabel && (
                      <span className="tag tag-stage">
                        <span className="sr-only">{t.stageName}: </span>
                        {r.stageLabel}
                      </span>
                    )}
                  </span>
                  <span role="cell" className="reg-tags reg-coutcome chip">
                    {r.outcomeLabel && (
                      <span className="tag tag-outcome">
                        <span className="sr-only">{t.outcomeName}: </span>
                        {r.outcomeLabel}
                      </span>
                    )}
                  </span>
                  {/* The figures column: the docket year, the day a decision
                      was handed down where one was, and the sum in dispute
                      where the record fixes one. Thirteen rows of thirty-nine
                      carry that last line, which is why it is a line here and
                      not a sixth column standing empty on the other twenty-
                      six. */}
                  <span role="cell" className="reg-when">
                    <span className="reg-year">{r.year ?? t.noDate}</span>
                    {r.decidedLabel && (
                      <span className="reg-decided">
                        <span className="dl">{t.decidedOn}</span>
                        {"\u00a0"}
                        {r.decidedLabel}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
