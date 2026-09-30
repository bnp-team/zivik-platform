/**
 * The archive's content model in EmDash, and the two-way mapping between an
 * EmDash row and the value `src/content/*.ts` exports.
 *
 * One description per collection drives three things:
 *   - the EmDash schema (`seedSchema`) – the collections and fields editors
 *     see in /_emdash/admin;
 *   - the seed (`toRow`) – today's file content, imported into EmDash;
 *   - the build snapshot (`fromRow`) – published rows, turned back into
 *     exactly the value the file exports, so every consumer, derivation and
 *     build-time check in src/content keeps working unchanged.
 *
 * The round trip is checked: `npm run cf:content -- --check` asserts that
 * `fromRow(toRow(x))` deep-equals `x` for every record. A field added to a
 * type in src/content/types.ts and not described here fails that check
 * instead of quietly disappearing from the Cloudflare build.
 *
 * Bilingual strings (`Localized`) become a pair of fields, `name_uk` and
 * `name_en`, side by side in one entry. EmDash's own i18n (a row per locale)
 * is not used: nearly every record here mixes translated text with facts
 * that must not differ between languages – an amount, a docket year, a
 * status – and a row per locale would make every such fact editable twice.
 * It would also force the Ukrainian pages off their `/uk` prefix.
 */

export type FieldType =
  | "string"
  | "text"
  | "url"
  | "integer"
  | "number"
  | "boolean"
  | "select"
  | "multiSelect"
  | "json"
  | "repeater"
  | "image";

/** One property of the exported value, stored as one field (or two, if localized). */
export interface Prop {
  /**
   * Property name on the exported value. A dotted path (`judgment.court`)
   * reaches into a nested object; the object is created on the way back only
   * if one of its properties has a value, so an optional group that was
   * absent stays absent.
   */
  path: string;
  /** Admin label. */
  label: string;
  type: FieldType;
  /** `{ uk, en }` in the value, `<slug>_uk` + `<slug>_en` in EmDash. */
  localized?: boolean;
  /** Field slug in EmDash; defaults to `path` in snake_case. */
  slug?: string;
  required?: boolean;
  /** The value may be an explicit `null` (as opposed to absent). */
  nullable?: boolean;
  options?: readonly string[];
  /** For `text`: an array of paragraphs, stored as text separated by blank lines. */
  paragraphs?: boolean;
  /** For `text`: an array of short strings, one per line. */
  lines?: boolean;
  /**
   * `string | Localized` in the value – a figure like "298" that needs no
   * translation, or a phrase that does. Stored as a pair like `localized`; an
   * empty EN field means the value is one string for both languages.
   */
  either?: boolean;
  /**
   * `string | false` in the value. `false` (e.g. "leave this heading out of
   * the contents") is a separate checkbox, `<slug>_off`.
   */
  allowFalse?: boolean;
  /** For `repeater`: the properties of one item. */
  items?: Prop[];
  /** An empty string is a value here, not an absence (e.g. a source with no named author). */
  blankOk?: boolean;
  /** Admin help text. */
  help?: string;
  /**
   * For `string`/`text`: the most characters the site accepts. The admin
   * shows a live «N / max» counter under the field and stops typing at the
   * limit – the one hint it renders (it does not show `help`).
   */
  maxLength?: number;
  /** Admin editor from a plugin, "<plugin id>:<widget>" (site/emdash/json-editors). */
  widget?: string;
  /**
   * For `image`: a picture uploaded in the admin (EmDash's media library, R2)
   * that stands in for the path property `into`. The Cloudflare build
   * (scripts/cf/pull.mts → media.mts) fetches it, sizes it for `profile` and
   * writes it under /media/, so the site keeps serving a static file and the
   * page code keeps reading a path. An upload wins over the path; the path
   * stays for pictures already in the repository.
   */
  upload?: { into: string; profile: "portrait" | "logo" | "cover" };
}

/**
 * The admin form, in the order of the page it edits.
 *
 * EmDash draws an entry as one long column of fields in `sortOrder`, with no
 * sections or tabs, and does not render help text. So the sections are
 * written into the labels – «2 · Шапка – Суд (UA)» – and the order follows
 * the page top to bottom, which is how an editor looks for a field: by where
 * its text sits on the page. `cf:content check` fails if a top-level
 * property is missing here or listed twice.
 */
export interface FormSection {
  title: string;
  /** Prop paths, or `[path, label]` to give the field a shorter label here. */
  fields: (string | [string, string])[];
}

export interface CollectionSpec {
  /** EmDash collection slug. */
  slug: string;
  label: string;
  labelSingular: string;
  /** How the value is exported: an ordered array, a record keyed by slug, or one object. */
  shape: "array" | "record" | "single";
  /** Where the value lives today – the snapshot replaces this export's initializer. */
  source: { file: string; export: string };
  /** The entry slug for a value (array/single shapes). */
  key?: (value: Record<string, unknown>, index: number) => string;
  /** Field slug shown as the entry's title in the admin list. */
  titleField: string;
  /** Admin sidebar folder. */
  group: string;
  /**
   * Where "Live View" in the admin opens an entry. EmDash requires `{slug}`;
   * collections with no page per entry point at the page that lists them,
   * the slug riding along as a fragment the page may or may not have.
   */
  urlPattern: string;
  props: Prop[];
  /**
   * A collection added after the database was seeded. Until it exists in D1
   * (`cf:content -- schema --yes`, or by hand in Content types) the build
   * reads its value from the file instead of failing on the missing table.
   */
  optional?: boolean;
  /**
   * A field that exists only to make the admin list readable. Written by the
   * seed; never read back, so editing it changes nothing on the site.
   */
  listLabel?: (value: Record<string, unknown>, key: string) => string;
  /** The admin form's sections – see `FormSection`. */
  form?: FormSection[];
  /** Up to four field slugs shown as columns in the admin list. */
  listColumns?: string[];
}

/** Slug of the `listLabel` field, and of the array-order field. */
export const LIST_LABEL = "list_label";
export const POSITION = "position";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const slugOf = (p: Prop) => p.slug ?? snake(p.path);

type L = { uk: string; en: string };

const GROUP_LIBRARY = "Бібліотека";
const GROUP_MAP = "Мапа";
const GROUP_SITE = "Сайт";
const GROUP_BLOG = "Блог";

const STAGES = [
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
const OUTCOMES = ["judgment", "award", "verdict", "liability", "upheld", "warrant", "procedural"] as const;

/* ─── Decision summaries ───────────────────────────────────────────────────
 * DecisionSummary (src/content/summaries/types.ts) as editor-facing fields.
 *
 * Flat parts become ordinary fields; lists of flat records – the text of the
 * write-up itself, the chronology, the FAQ, the sources – become repeaters,
 * one row per item. The parts that nest a list inside a list
 * (warrants → waves → persons → charges, objections → votes, the map's
 * theatres) stay JSON, one field per section: a repeater cannot hold another
 * repeater. */

const BLOCK_KINDS = [
  "lead", "h2", "h3", "h4", "p", "dispositif", "findings",
  "position", "claim", "note", "subject", "link",
] as const;
const VERDICT_OUTCOMES = [
  "violation", "no-violation", "granted", "rejected", "not-decided", "convicted", "acquitted",
] as const;

const blockItems: Prop[] = [
  { path: "kind", label: "Тип", type: "select", options: BLOCK_KINDS, required: true },
  { path: "text", label: "Текст", type: "text", required: true },
  { path: "nav", label: "Назва в змісті", type: "string", allowFalse: true },
  { path: "measure", label: "Захід (dispositif)", type: "string" },
  { path: "outcome", label: "Результат", type: "select", options: VERDICT_OUTCOMES },
  { path: "heads", label: "Заголовки частин (по рядку)", type: "text", lines: true },
  { path: "outcomes", label: "Результати частин (по рядку)", type: "text", lines: true },
  { path: "instrument", label: "Інструмент", type: "string" },
  { path: "place", label: "Місце", type: "string" },
];

/**
 * The summary's admin form, top to bottom in the order of the decision page
 * (src/app/[locale]/cases/[slug]/page.tsx): the masthead, then the overview
 * band, the chronology, the map, the text, the findings and so on down to the
 * sources. What is not on the page – the search and share lines, the page
 * switches – is grouped at the top and the bottom. Owner's request: «зручніший
 * вигляд адмінки для огляду рішення».
 */
const SUMMARY_FORM: FormSection[] = [
  {
    title: "Службове",
    fields: [
      ["id", "Адреса сторінки (slug)"],
      ["caseId", "Провадження в реєстрі (id)"],
      ["asOf", "Станом на (РРРР-ММ-ДД)"],
    ],
  },
  {
    title: "Шапка",
    fields: [
      ["title", "Повна назва (заголовок сторінки)"],
      ["masthead.official", "Офіційна назва мовою суду"],
      ["mastheadUk.official", "Офіційна назва українською"],
      ["masthead.parties", "Сторони"],
      ["masthead.judgment", "Рішення (рядок під назвою)"],
      ["mastheadUk.judgment", "Рішення українською"],
      ["judgment.court", "Суд"],
      ["judgment.date", "Дата рішення (РРРР-ММ-ДД)"],
      ["forum.institution", "Інституція"],
      ["forum.seat", "Місто"],
    ],
  },
  {
    title: "Google і соцмережі",
    fields: [
      ["seoTitle", "Коротка назва для Google (порожньо – повна)"],
      ["metaDesc", "Опис для Google"],
      ["card.title", "Картка: назва (до ~45 знаків)"],
      ["card.eyebrow", "Картка: суд і дата"],
      ["card.kicker", "Картка: головний результат"],
    ],
  },
  {
    title: "Коротко",
    fields: [
      ["plain.tldr", "Коротко"],
      ["glance", "Коротко про справу (таблиця)"],
      ["stats", "Цифри"],
    ],
  },
  {
    title: "Документ суду",
    fields: [
      ["judgment.url", "Посилання на рішення"],
      ["judgment.urlType", "Тип документа"],
      ["judgment.caseUrl", "Сторінка справи на сайті суду"],
      ["judgment.caseUrlType", "Тип сторінки справи"],
      ["judgment.readLabel", "Підпис кнопки «читати»"],
      ["judgment.fileLabel", "Підпис файлу"],
    ],
  },
  { title: "Хронологія", fields: [["timeline", "Події"], ["timelineTracks", "Доріжки"]] },
  {
    title: "Мапа і масштаб",
    fields: [
      ["theatres", "Театри подій"],
      ["mapFocus", "Фокус мапи"],
      ["mapAfterPart", "Мапа після частини №"],
      ["takings", "Втрати в цифрах"],
    ],
  },
  {
    title: "Текст огляду",
    fields: [
      ["blocks", "Англійський оригінал"],
      ["blocksUk", "Українською"],
      ["positionLabel", "Підпис над позицією суду («Позиція Суду»)"],
    ],
  },
  {
    title: "Тлумачення",
    fields: [["interpretations", "Як суд витлумачив терміни"]],
  },
  {
    title: "Тимчасові заходи",
    fields: [
      ["provisionalMeasuresOrder", "Наказ"],
      ["provisionalMeasures", "Заходи"],
    ],
  },
  {
    title: "Механізм",
    fields: [
      ["instruments", "Міжнародні інструменти"],
      ["attribution", "Ланцюг відповідальності"],
      ["amounts", "Суми"],
      ["warrants", "Ордери"],
    ],
  },
  { title: "Заперечення", fields: [["objections", "Заперечення"]] },
  { title: "Що було далі", fields: [["afterlife", "Що було далі"]] },
  {
    title: "Джерела",
    fields: [
      ["sources", "Джерела"],
    ],
  },
  {
    title: "Вигляд сторінки",
    fields: [
      ["bands", "Смуги сторінки"],
      ["hideSections", "Приховати розділи"],
    ],
  },
];

const SUMMARY_PROPS: Prop[] = [
  { path: "id", slug: "key", label: "Ідентифікатор (slug сторінки)", type: "string", required: true },
  { path: "caseId", label: "Провадження (id у реєстрі)", type: "string", required: true },
  { path: "title", label: "Заголовок", type: "string", localized: true },
  {
    path: "seoTitle",
    label: "Коротка назва для пошуку (до 70 знаків)",
    type: "string",
    localized: true,
    maxLength: 70,
    help: "Лише для вкладки браузера, Google і соцмереж. На сторінці лишається повний заголовок. Порожнє – береться повний.",
  },
  { path: "metaDesc", label: "Опис для пошуковиків (до 160 знаків)", type: "text", localized: true, maxLength: 160 },
  { path: "asOf", label: "Станом на (РРРР-ММ-ДД)", type: "string" },

  { path: "masthead.official", slug: "masthead_official", label: "Шапка: офіційна назва", type: "text", required: true },
  { path: "masthead.parties", slug: "masthead_parties", label: "Шапка: сторони", type: "string", required: true },
  { path: "masthead.judgment", slug: "masthead_judgment", label: "Шапка: рішення", type: "string", required: true },
  { path: "mastheadUk.official", slug: "masthead_uk_official", label: "Шапка (укр.): офіційна назва", type: "text" },
  { path: "mastheadUk.judgment", slug: "masthead_uk_judgment", label: "Шапка (укр.): рішення", type: "string" },

  /* The share card's three lines (scripts/og-cards.mts draws it at build
     time). Optional: without them the card derives its text, and a D1 that
     does not have these columns yet reads as all three empty. */
  {
    path: "card.title",
    slug: "card_title",
    label: "Картка для соцмереж: заголовок",
    type: "string",
    help: "Назва справи на картці, до ~45 знаків. Порожнє – коротка назва для пошуку або заголовок.",
  },
  {
    path: "card.eyebrow",
    slug: "card_eyebrow",
    label: "Картка для соцмереж: суд і дата",
    type: "string",
    help: "Напр. «ЄСПЛ, Велика палата · 9 липня 2025». Порожнє – інституція і рядок «Шапка (укр.): рішення».",
  },
  {
    path: "card.kicker",
    slug: "card_kicker",
    label: "Картка для соцмереж: підсумок",
    type: "string",
    help: "Один рядок під назвою: головний результат. Порожнє – виділена цифра з «Цифри».",
  },

  { path: "plain.tldr", slug: "tldr", label: "Коротко", type: "text", localized: true, required: true },

  { path: "judgment.court", slug: "judgment_court", label: "Рішення: суд", type: "string", localized: true, required: true },
  { path: "judgment.date", slug: "judgment_date", label: "Рішення: дата", type: "string", required: true },
  { path: "judgment.url", slug: "judgment_url", label: "Рішення: посилання на документ", type: "string", required: true },
  { path: "judgment.urlType", slug: "judgment_url_type", label: "Рішення: тип документа", type: "string" },
  { path: "judgment.caseUrl", slug: "judgment_case_url", label: "Рішення: сторінка справи", type: "string", required: true },
  { path: "judgment.caseUrlType", slug: "judgment_case_url_type", label: "Рішення: тип сторінки справи", type: "string" },
  { path: "judgment.readLabel", slug: "judgment_read_label", label: "Рішення: підпис «читати»", type: "string", localized: true },
  { path: "judgment.fileLabel", slug: "judgment_file_label", label: "Рішення: підпис файлу", type: "string", localized: true },

  { path: "forum.institution", slug: "forum_institution", label: "Форум: інституція", type: "string", localized: true },
  { path: "forum.seat", slug: "forum_seat", label: "Форум: місто", type: "string", localized: true },

  {
    path: "blocks",
    label: "Текст огляду (англійський оригінал)",
    type: "repeater",
    required: true,
    items: blockItems,
    help: "Абзац за абзацом, у порядку на сторінці.",
  },
  {
    path: "blocksUk",
    label: "Текст огляду (українською)",
    type: "repeater",
    items: blockItems,
    help: "Має йти паралельно до англійського: той самий порядок і типи абзаців.",
  },

  {
    path: "stats",
    label: "Цифри",
    type: "repeater",
    required: true,
    items: [
      { path: "value", label: "Значення", type: "string", either: true, required: true },
      { path: "label", label: "Підпис", type: "string", localized: true, required: true },
      { path: "em", label: "Виділити", type: "boolean" },
      { path: "note", label: "Примітка", type: "text", localized: true },
    ],
  },
  {
    path: "glance",
    label: "Коротко про справу",
    type: "repeater",
    required: true,
    items: [
      { path: "label", label: "Що", type: "string", localized: true, required: true },
      { path: "value", label: "Значення", type: "text", localized: true, required: true },
    ],
  },
  {
    path: "timeline",
    label: "Хронологія",
    type: "repeater",
    required: true,
    items: [
      { path: "date", label: "Дата", type: "string", localized: true, required: true },
      { path: "iso", label: "Дата для сортування (РРРР-ММ-ДД)", type: "string" },
      { path: "label", label: "Подія", type: "text", localized: true, required: true },
      { path: "kind", label: "Тип", type: "select", options: ["filing", "order", "judgment", "context"] },
      { path: "track", label: "Доріжка", type: "string" },
      { path: "note", label: "Примітка", type: "text", localized: true },
    ],
  },
  {
    path: "timelineTracks",
    label: "Хронологія: доріжки",
    type: "repeater",
    items: [
      { path: "id", label: "Ідентифікатор", type: "string", required: true },
      { path: "label", label: "Назва", type: "string", localized: true, required: true },
    ],
  },
  { path: "positionLabel", label: "Підпис позиції сторони", type: "string", localized: true },
  {
    path: "interpretations",
    label: "Тлумачення",
    type: "repeater",
    required: true,
    items: [
      { path: "term", label: "Термін", type: "string", localized: true, required: true },
      { path: "ruling", label: "Як суд витлумачив", type: "text", localized: true, required: true },
    ],
  },
  { path: "provisionalMeasuresOrder", label: "Тимчасові заходи: наказ", type: "string", localized: true },
  {
    path: "provisionalMeasures",
    label: "Тимчасові заходи",
    type: "repeater",
    items: [
      { path: "measure", label: "Захід", type: "text", localized: true, required: true },
      { path: "order", label: "Виконано?", type: "select", options: ["violated", "complied"], required: true },
      { path: "note", label: "Примітка", type: "text", localized: true },
    ],
  },
  {
    path: "instruments",
    label: "Міжнародні інструменти",
    type: "repeater",
    required: true,
    items: [
      { path: "abbr", label: "Абревіатура", type: "string", either: true, required: true },
      { path: "name", label: "Назва", type: "string", localized: true, required: true },
      { path: "year", label: "Рік", type: "integer", required: true },
      { path: "url", label: "Посилання", type: "string", required: true },
    ],
  },
  {
    path: "sources",
    label: "Джерела",
    type: "repeater",
    required: true,
    items: [
      { path: "title", label: "Назва", type: "text", required: true },
      { path: "authors", label: "Автори", type: "string", blankOk: true },
      { path: "publication", label: "Видання", type: "string", required: true },
      { path: "date", label: "Дата", type: "string", blankOk: true },
      { path: "type", label: "Тип", type: "string", required: true },
      { path: "url", label: "Посилання", type: "string", required: true },
    ],
  },

  { path: "bands", label: "Смуги сторінки", type: "select", options: ["four"] },
  { path: "mapAfterPart", label: "Мапа після частини №", type: "integer" },
  {
    path: "hideSections",
    label: "Приховати розділи",
    type: "multiSelect",
    options: [
      "overview",
      "rulings",
      "measures",
      "machinery",
      "scale",
      "afterlife",
      "attribution",
      "objections",
      "warrants",
      "amounts",
      "glance",
    ],
  },

  /* Nested sections: JSON, one field each. */
  { path: "theatres", label: "Мапа: театри подій (JSON)", type: "json", widget: "nsv-json-editors:theatres" },
  { path: "mapFocus", label: "Мапа: фокус (JSON)", type: "json", widget: "nsv-json-editors:mapFocus", help: '{"forumKey":"hague","reachTo":"…"}' },
  { path: "takings", label: "Втрати в цифрах (JSON)", type: "json", widget: "nsv-json-editors:takings" },
  { path: "amounts", label: "Суми (JSON)", type: "json", widget: "nsv-json-editors:amounts" },
  { path: "attribution", label: "Ланцюг відповідальності (JSON)", type: "json", widget: "nsv-json-editors:attribution" },
  { path: "objections", label: "Заперечення (JSON)", type: "json", widget: "nsv-json-editors:objections" },
  { path: "afterlife", label: "Що було далі (JSON)", type: "json", widget: "nsv-json-editors:afterlife" },
  { path: "warrants", label: "Ордери (JSON)", type: "json", widget: "nsv-json-editors:warrants" },
];

export const COLLECTIONS: CollectionSpec[] = [
  {
    slug: "institutions",
    label: "Інституції",
    labelSingular: "Інституція",
    shape: "array",
    source: { file: "src/content/institutions.ts", export: "institutions" },
    key: (v) => String(v.id),
    titleField: "name_uk",
    group: GROUP_LIBRARY,
    urlPattern: "/uk/registry#{slug}",
    props: [
      { path: "id", label: "Ідентифікатор", type: "string", required: true, slug: "key" },
      { path: "abbr", label: "Абревіатура", type: "string", localized: true, required: true },
      { path: "name", label: "Назва", type: "string", localized: true, required: true },
      { path: "seat", label: "Місто", type: "string", localized: true, nullable: true },
      {
        path: "category",
        label: "Категорія",
        type: "select",
        options: ["international", "arbitration", "national", "executive"],
        required: true,
      },
      { path: "phase1", label: "У реєстрі на головній (фаза 1)", type: "boolean" },
      { path: "order", label: "Порядок", type: "integer", required: true, slug: "rank" },
    ],
  },
  {
    slug: "cases",
    label: "Провадження",
    labelSingular: "Провадження",
    shape: "array",
    source: { file: "src/content/cases.ts", export: "registryCases" },
    key: (v) => String(v.id),
    titleField: LIST_LABEL,
    group: GROUP_LIBRARY,
    urlPattern: "/uk/registry#{slug}",
    listLabel: (v) => String(v.nameUk ?? v.nameShort ?? v.name),
    props: [
      { path: "id", label: "Ідентифікатор", type: "string", required: true, slug: "key" },
      { path: "institutionId", label: "Інституція (id)", type: "string", required: true },
      { path: "partOf", label: "Частина провадження (id)", type: "string" },
      { path: "actName", label: "Назва акту в рядку батьківського провадження", type: "string", localized: true },
      { path: "name", label: "Офіційна назва (цитування)", type: "text", required: true },
      { path: "nameShort", label: "Коротка назва", type: "string" },
      { path: "nameUk", label: "Назва українською", type: "string" },
      { path: "type", label: "Тип", type: "string", localized: true, required: true },
      { path: "stage", label: "Стадія", type: "select", options: STAGES },
      { path: "outcome", label: "Результат", type: "select", options: OUTCOMES },
      { path: "status", label: "Статус", type: "text", localized: true, required: true },
      { path: "year", label: "Рік початку", type: "integer", nullable: true },
      {
        path: "decidedOn",
        label: "Дата рішення",
        type: "json",
        widget: "nsv-json-editors:decidedOn",
        help: "Точність (день або лише рік), дата РРРР-ММ-ДД, рік.",
      },
      { path: "amountUsd", label: "Сума у спорі, USD", type: "number", nullable: true },
      { path: "note", label: "Примітка", type: "text", localized: true, required: true },
      { path: "pages", label: "Сторінок у рішенні", type: "integer", nullable: true },
      { path: "decisionUrl", label: "Посилання на рішення", type: "url", nullable: true },
      {
        path: "decisionUrlKind",
        label: "Що за посиланням",
        type: "select",
        options: ["press-release", "case-page", "party", "database", "report"],
      },
      { path: "summarySlug", label: "Огляд (slug)", type: "string" },
      { path: "lit", label: "Опрацьовано («освітлено»)", type: "boolean" },
    ],
  },
  {
    slug: "partners",
    label: "Партнери",
    labelSingular: "Партнер",
    shape: "array",
    source: { file: "src/content/partners.ts", export: "partners" },
    key: (v) => String(v.id),
    titleField: "name_uk",
    group: GROUP_SITE,
    urlPattern: "/uk#{slug}",
    props: [
      { path: "id", label: "Ідентифікатор", type: "string", required: true, slug: "key" },
      { path: "name", label: "Назва", type: "string", localized: true, required: true },
      { path: "blurb", label: "Хто це", type: "text", localized: true },
      {
        path: "logoFile",
        slug: "logo_file",
        label: "Логотип – завантажити",
        type: "image",
        upload: { into: "logo", profile: "logo" },
      },
      { path: "logo", label: "Логотип – шлях у /public (якщо не завантажено)", type: "string" },
      { path: "url", label: "Сайт", type: "url" },
    ],
  },
  {
    slug: "team",
    label: "Команда",
    labelSingular: "Учасник команди",
    shape: "array",
    source: { file: "src/content/team.ts", export: "team" },
    key: (v) =>
      (v.name as L).en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    titleField: "name_uk",
    group: GROUP_SITE,
    urlPattern: "/uk/team#{slug}",
    props: [
      { path: "name", label: "Ім'я", type: "string", localized: true, required: true },
      {
        path: "role",
        label: "Роль",
        type: "string",
        localized: true,
        required: true,
        help: "Англійська роль – ключ групи на /about (див. teamGroups у src/content/team.ts).",
      },
      {
        path: "photoFile",
        slug: "photo_file",
        label: "Фото – завантажити",
        type: "image",
        upload: { into: "photo", profile: "portrait" },
      },
      { path: "photo", label: "Фото – шлях у /public/team (якщо не завантажено)", type: "string" },
      {
        path: "focusY",
        slug: "focus_y",
        label: "Кадрування: де центр по вертикалі, %",
        type: "integer",
        help: "0 – показати верх фото, 100 – низ. Для портрета «голова й плечі» підійде 10–25 (порожньо = 20). Якщо голову обрізає зверху – зменште число; якщо видно забагато низу – збільште.",
      },
    ],
  },
  {
    slug: "about",
    label: "Про проєкт",
    labelSingular: "Про проєкт",
    shape: "single",
    source: { file: "src/content/about.ts", export: "about" },
    key: () => "about",
    titleField: "title_uk",
    group: GROUP_SITE,
    urlPattern: "/uk/about#{slug}",
    props: [
      { path: "title", label: "Заголовок", type: "string", localized: true, required: true },
      {
        path: "paragraphs",
        label: "Абзаци",
        type: "text",
        localized: true,
        paragraphs: true,
        required: true,
        help: "Абзаци розділяються порожнім рядком.",
      },
      {
        path: "links",
        label: "Посилання в тексті",
        type: "json",
        widget: "nsv-json-editors:aboutLinks",
        help: "Фрагмент абзацу, дослівно, і адреса – окремо для UA і EN.",
      },
    ],
  },
  {
    slug: "map_events",
    label: "Мапа: події",
    labelSingular: "Подія на мапі",
    shape: "array",
    source: { file: "src/content/map.ts", export: "MAP_EVENTS" },
    key: (v) => String(v.key),
    titleField: "title_uk",
    group: GROUP_MAP,
    urlPattern: "/uk/map#{slug}",
    props: [
      { path: "key", label: "Ідентифікатор", type: "string", required: true },
      { path: "area", label: "Територія", type: "select", options: ["country", "crimea", "east"] },
      { path: "weight", label: "Вага (розмір маркера)", type: "number", required: true },
      { path: "when", label: "Коли", type: "string", localized: true, required: true },
      { path: "title", label: "Заголовок", type: "string", localized: true, required: true },
      { path: "note", label: "Опис", type: "text", localized: true, required: true },
      { path: "courts", label: "Міста судів", type: "json", required: true, widget: "nsv-json-editors:courtKeys" },
      { path: "forums", label: "Форуми", type: "text", localized: true, required: true },
      { path: "count", label: "Скільки", type: "string", localized: true, required: true },
      { path: "cases", label: "Огляди", type: "json", widget: "nsv-json-editors:caseSlugs" },
      { path: "linksOutsideCount", label: "Посилання виходять за межі лічильника", type: "boolean" },
    ],
  },
  {
    slug: "map_courts",
    label: "Мапа: суди",
    labelSingular: "Суд на мапі",
    shape: "array",
    source: { file: "src/content/map.ts", export: "MAP_COURTS" },
    key: (v) => String(v.key),
    titleField: "city_uk",
    group: GROUP_MAP,
    urlPattern: "/uk/map#{slug}",
    props: [
      { path: "key", label: "Ідентифікатор", type: "string", required: true },
      { path: "city", label: "Місто", type: "string", localized: true, required: true },
      { path: "at", label: "«У місті»", type: "string", localized: true, required: true },
      { path: "institutionIds", label: "Інституції", type: "json", required: true, widget: "nsv-json-editors:institutionIds" },
      { path: "seats", label: "Суди в цьому місті", type: "json", required: true, widget: "nsv-json-editors:seats" },
      { path: "offMap", label: "Поза рамкою мапи", type: "boolean" },
      { path: "offAt", label: "Напрям поза рамкою", type: "json", widget: "nsv-json-editors:offAt" },
      { path: "labelDy", label: "Зсув підпису", type: "number" },
    ],
  },
  {
    slug: "map_countries",
    label: "Мапа: країни",
    labelSingular: "Країна на мапі",
    shape: "array",
    source: { file: "src/content/map.ts", export: "MAP_COUNTRIES" },
    key: (v) => String(v.key).toLowerCase(),
    titleField: "name_uk",
    group: GROUP_MAP,
    urlPattern: "/uk/map#{slug}",
    props: [
      { path: "key", label: "Ідентифікатор (назва в europe-map.json)", type: "string", required: true },
      { path: "name", label: "Назва", type: "string", localized: true, required: true },
      { path: "at", label: "«У країні»", type: "string", localized: true, required: true },
      { path: "courts", label: "Міста судів", type: "json", required: true, widget: "nsv-json-editors:courtKeys" },
    ],
  },
  {
    slug: "summaries",
    label: "Огляди рішень",
    labelSingular: "Огляд рішення",
    shape: "record",
    source: { file: "src/content/summaries/index.ts", export: "SUMMARIES" },
    titleField: LIST_LABEL,
    group: GROUP_LIBRARY,
    urlPattern: "/uk/cases/{slug}",
    listLabel: (v, key) => (v.title as L | undefined)?.uk ?? key,
    props: SUMMARY_PROPS,
    form: SUMMARY_FORM,
    listColumns: ["judgment_court_uk", "judgment_date", "as_of"],
  },
  /* Блог – сторінки src/app/[locale]/blog; див. src/content/blog.ts. */
  {
    slug: "posts",
    label: "Блог",
    labelSingular: "Допис",
    shape: "array",
    source: { file: "src/content/blog.ts", export: "posts" },
    key: (v) => String(v.slug),
    titleField: "title_uk",
    group: GROUP_BLOG,
    urlPattern: "/uk/blog/{slug}",
    optional: true,
    props: [
      {
        path: "slug",
        slug: "key",
        label: "Адреса (slug, латиницею через дефіс)",
        type: "string",
        required: true,
        help: "Стане частиною адреси: /uk/blog/<slug>. Після публікації краще не змінювати.",
      },
      { path: "title", label: "Заголовок", type: "string", localized: true, required: true },
      {
        path: "excerpt",
        label: "Анонс (до 160 знаків)",
        type: "text",
        localized: true,
        required: true,
        help: "Показується в списку дописів і в Google.",
      },
      {
        path: "body",
        label: "Текст",
        type: "text",
        localized: true,
        paragraphs: true,
        required: true,
        help: "Абзаци розділяйте порожнім рядком.",
      },
      { path: "date", label: "Дата (РРРР-ММ-ДД)", type: "string", required: true },
      { path: "author", label: "Автор", type: "string", localized: true },
      {
        path: "coverFile",
        slug: "cover_file",
        label: "Обкладинка – завантажити",
        type: "image",
        upload: { into: "cover", profile: "cover" },
      },
      { path: "cover", label: "Обкладинка – шлях у /public/blog (якщо не завантажено)", type: "string" },
      { path: "coverAlt", label: "Опис обкладинки для незрячих", type: "string", localized: true },
      { path: "tags", label: "Теги (по одному в рядку)", type: "text", lines: true },
      {
        path: "relatedCases",
        label: "Пов'язані огляди (slug, по одному в рядку)",
        type: "text",
        lines: true,
        help: "Наприклад: icj-genocide",
      },
    ],
  },

  /* Тексти сайту – кожен підпис, заголовок і речення інтерфейсу, що не є
     текстом самого рішення; див. src/lib/ui-texts.ts. Рядки беруться з
     каталогу, який пише `npm run ui-texts`. */
  {
    slug: "ui_texts",
    label: "Тексти сайту",
    labelSingular: "Текст сайту",
    shape: "array",
    source: { file: "src/content/ui-texts.ts", export: "uiTexts" },
    /* Slug of an entry is the id with the dots turned into dashes; `check`
       fails if two ids collapse into one. */
    key: (v) =>
      String(v.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    titleField: "text_uk",
    group: GROUP_SITE,
    urlPattern: "/uk",
    optional: true,
    listColumns: ["place", "text_uk", "text_en", "base_uk"],
    props: [
      {
        path: "id",
        slug: "key",
        label: "Код тексту (не змінювати)",
        type: "string",
        required: true,
      },
      { path: "group", slug: "place", label: "Де на сайті", type: "string", required: true },
      {
        path: "text",
        label: "Текст",
        type: "text",
        localized: true,
        required: true,
        help: "Змініть лише те, що хочете змінити. Слова у фігурних дужках ({n}, {w}, {at}…) не чіпайте: сайт підставляє на їхнє місце число чи назву.",
      },
      {
        path: "base",
        label: "Початково (з коду, не змінювати)",
        type: "text",
        localized: true,
        required: true,
        help: "Що було на сайті до редагування. За цим видно, чи текст змінено.",
      },
    ],
  },

  /* Юридичні сторінки – «Умови» і «Політика конфіденційності»; див.
     src/content/legal-docs.ts. Адреса, телефон і числа в тексті стоять у
     фігурних дужках – {email}, {phone}, {total}, {summarised} – і їх
     підставляє код. */
  {
    slug: "legal_documents",
    label: "Юридичні сторінки",
    labelSingular: "Юридична сторінка",
    shape: "array",
    source: { file: "src/content/legal-docs.ts", export: "legalDocs" },
    key: (v) => String(v.slug),
    titleField: "title_uk",
    group: GROUP_SITE,
    urlPattern: "/uk/{slug}",
    optional: true,
    props: [
      { path: "slug", slug: "key", label: "Сторінка (privacy чи terms – не змінювати)", type: "string", required: true },
      { path: "title", label: "Заголовок", type: "string", localized: true, required: true },
      { path: "lede", label: "Вступ під заголовком", type: "text", localized: true, required: true },
      {
        path: "revised",
        label: "Дата редакції (РРРР-ММ-ДД)",
        type: "string",
        help: "Змінюйте, коли міняєте текст. Порожньо – сайт покаже дату зі збірки.",
      },
      {
        path: "sections",
        label: "Розділи",
        type: "json",
        required: true,
        widget: "nsv-json-editors:legalSections",
        help: "Адреса, телефон і числа пишіть у фігурних дужках: {email}, {phone}, {total}, {summarised}.",
      },
    ],
  },

  /* Мапа: міста-орієнтири – Київ, Львів. Крапка й назва, без клікабельності;
     див. src/content/map-places.ts. */
  {
    slug: "map_places",
    label: "Міста на мапі",
    labelSingular: "Місто на мапі",
    shape: "array",
    source: { file: "src/content/map-places.ts", export: "mapPlaces" },
    key: (v) => String(v.key),
    titleField: "city_uk",
    group: GROUP_MAP,
    urlPattern: "/uk/map#{slug}",
    optional: true,
    listColumns: ["city_uk", "city_en", "lon", "lat"],
    props: [
      { path: "key", label: "Ідентифікатор (латиницею, напр. kharkiv)", type: "string", required: true },
      { path: "city", label: "Назва", type: "string", localized: true, required: true },
      {
        path: "lon",
        label: "Довгота (градуси на схід, напр. 36.23)",
        type: "number",
        required: true,
      },
      {
        path: "lat",
        label: "Широта (градуси на північ, напр. 49.99)",
        type: "number",
        required: true,
      },
    ],
  },
];

/* ─── Row ⇄ value ──────────────────────────────────────────────────────── */

export type Row = Record<string, unknown>;
type Obj = Record<string, unknown>;

function getIn(obj: Obj, path: string): unknown {
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Obj)[k];
  }
  return cur;
}

function setIn(obj: Obj, path: string, v: unknown) {
  const keys = path.split(".");
  let cur = obj;
  for (const k of keys.slice(0, -1)) cur = (cur[k] ??= {}) as Obj;
  cur[keys[keys.length - 1]] = v;
}

function encode(p: Prop, v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (p.type === "json" || p.type === "multiSelect" || p.type === "image") return v;
  if (p.type === "repeater") return (v as Obj[]).map((item) => encodeProps(p.items!, item));
  if (p.paragraphs) return (v as string[]).join("\n\n");
  if (p.lines) return (v as string[]).join("\n");
  return v;
}

function decode(p: Prop, v: unknown): unknown {
  if (p.type === "repeater") {
    const list = (typeof v === "string" ? JSON.parse(v) : v) as Row[] | null | undefined;
    /* An empty list is kept as an empty list, and a missing one as missing –
       except that a required list is always there. */
    if (!list) return p.required ? [] : undefined;
    return list.map((item) => decodeProps(p.items!, item));
  }
  if (v === "" && p.blankOk) return "";
  if (v === undefined || v === null || v === "") return p.nullable ? null : undefined;
  switch (p.type) {
    case "image":
    case "json":
    case "multiSelect":
      return typeof v === "string" ? JSON.parse(v) : v;
    case "boolean":
      return v === true || v === 1 || v === "1" || v === "true";
    case "integer":
    case "number":
      return typeof v === "number" ? v : Number(v);
    default:
      if (p.paragraphs) return String(v).split(/\n\s*\n/);
      if (p.lines) return String(v).split("\n");
      return v;
  }
}

function encodeProps(props: Prop[], value: Obj): Row {
  const row: Row = {};
  for (const p of props) {
    const slug = slugOf(p);
    if (p.path === "") {
      row[slug] = value;
      continue;
    }
    const v = getIn(value, p.path);
    if (p.localized || p.either) {
      const plain = p.either && typeof v === "string";
      const l = v as L | null | undefined;
      row[`${slug}_uk`] = encode(p, plain ? v : l?.uk);
      row[`${slug}_en`] = encode(p, plain ? null : l?.en);
    } else if (p.allowFalse) {
      row[slug] = v === false ? null : encode(p, v);
      row[`${slug}_off`] = v === false;
    } else {
      row[slug] = encode(p, v);
    }
  }
  return row;
}

function decodeProps(props: Prop[], row: Row): Obj {
  const out: Obj = {};
  for (const p of props) {
    const slug = slugOf(p);
    if (p.path === "") return decode(p, row[slug]) as Obj;
    let v: unknown;
    if (p.localized || p.either) {
      const a = decode(p, row[`${slug}_uk`]);
      const b = decode(p, row[`${slug}_en`]);
      if (a == null && b == null) v = p.nullable ? null : undefined;
      else if (p.either && b == null) v = a;
      else v = { uk: a, en: b };
    } else if (p.allowFalse && decode({ ...p, type: "boolean" }, row[`${slug}_off`])) {
      v = false;
    } else {
      v = decode(p, row[slug]);
    }
    if (v !== undefined) setIn(out, p.path, v);
  }
  return out;
}

/** The exported value → the fields of an EmDash entry. */
export function toRow(spec: CollectionSpec, value: Obj): Row {
  return encodeProps(spec.props, value);
}

/** An EmDash entry's fields → the value the file would have exported. */
export function fromRow(spec: CollectionSpec, row: Row): Obj {
  return decodeProps(spec.props, row);
}

/** EmDash field definitions for a list of properties (fields or repeater sub-fields). */
function fieldDefs(props: Prop[], sub: boolean): Record<string, unknown>[] {
  const fields: Record<string, unknown>[] = [];
  for (const p of props) {
    const slug = slugOf(p);
    const validation: Record<string, unknown> = {};
    if (p.options && !sub) validation.options = [...p.options];
    if (p.type === "repeater") validation.subFields = fieldDefs(p.items!, true);
    if (p.maxLength && !sub) validation.maxLength = p.maxLength;
    const base = {
      type: p.type,
      ...(Object.keys(validation).length ? { validation } : {}),
      /* Repeater sub-fields take their choices directly. */
      ...(p.options && sub ? { options: [...p.options] } : {}),
      ...(p.help && !sub ? { options: { helpText: p.help } } : {}),
      ...(p.widget && !sub ? { widget: p.widget } : {}),
    };
    /* A repeater may be empty even where the list is required: the site
       tells "none" from "absent" by `required`, not by the editor. */
    const required = !!p.required && p.type !== "repeater";
    if (p.localized || p.either) {
      fields.push({ ...base, slug: `${slug}_uk`, label: `${p.label} (UA)`, required });
      fields.push({
        ...base,
        slug: `${slug}_en`,
        label: p.either ? `${p.label} (EN; порожньо – те саме, що UA)` : `${p.label} (EN)`,
        required: required && !p.either,
      });
    } else {
      fields.push({ ...base, slug, label: p.label, required });
      if (p.allowFalse) {
        fields.push({ slug: `${slug}_off`, label: `${p.label}: не показувати`, type: "boolean" });
      }
    }
  }
  return fields;
}

/**
 * The props in form order, each labelled «N · Section – label». Props the
 * form does not name keep their place after it; `formProblems` reports them.
 */
function arranged(spec: CollectionSpec): Prop[] {
  if (!spec.form) return spec.props;
  const byPath = new Map(spec.props.map((p) => [p.path, p]));
  const out: Prop[] = [];
  const placed = new Set<string>();
  spec.form.forEach((section, i) => {
    for (const entry of section.fields) {
      const [path, label] = typeof entry === "string" ? [entry, undefined] : entry;
      const p = byPath.get(path);
      if (!p || placed.has(path)) continue;
      placed.add(path);
      out.push({ ...p, label: `${i + 1} · ${section.title} – ${label ?? p.label}` });
    }
  });
  for (const p of spec.props) if (!placed.has(p.path)) out.push(p);
  return out;
}

/** Top-level props the form leaves out, lists twice, or names wrongly. */
export function formProblems(spec: CollectionSpec): string[] {
  if (!spec.form) return [];
  const out: string[] = [];
  const paths = new Set(spec.props.map((p) => p.path));
  const seen = new Set<string>();
  for (const section of spec.form) {
    for (const entry of section.fields) {
      const path = typeof entry === "string" ? entry : entry[0];
      if (!paths.has(path)) out.push(`${spec.slug}: form names «${path}», which is not a property`);
      if (seen.has(path)) out.push(`${spec.slug}: form lists «${path}» twice`);
      seen.add(path);
    }
  }
  for (const p of spec.props) if (!seen.has(p.path)) out.push(`${spec.slug}: «${p.path}» is not in the form`);
  const slugs = new Set(seedFields(spec).map((f) => String(f.slug)));
  for (const c of spec.listColumns ?? []) if (!slugs.has(c)) out.push(`${spec.slug}: list column «${c}» is not a field`);
  if ((spec.listColumns?.length ?? 0) > 4) out.push(`${spec.slug}: EmDash shows at most four list columns`);
  return out;
}

/** EmDash seed field definitions for a collection, `sortOrder` included. */
export function seedFields(spec: CollectionSpec): Record<string, unknown>[] {
  const fields: Record<string, unknown>[] = [];
  if (spec.listLabel) {
    fields.push({
      slug: LIST_LABEL,
      /* The hint is in the label: the admin does not render help text. */
      label: spec.form ? "0 · Назва в списку адмінки (на сайт не впливає)" : "Назва в списку адмінки",
      type: "string",
      options: { helpText: "Лише для списку в адмінці; на сайт не впливає." },
    });
  }
  if (spec.shape === "array") {
    fields.push({
      slug: POSITION,
      label: "Позиція в списку",
      type: "integer",
      required: true,
      indexed: true,
      options: { helpText: "Порядок, у якому записи йдуть на сайті (менше – вище)." },
    });
  }
  for (const f of fieldDefs(arranged(spec), false)) {
    const localizedText = /_(uk|en)$/.test(String(f.slug)) && f.type !== "json" && f.type !== "repeater";
    fields.push(localizedText ? { ...f, searchable: true } : f);
  }
  return fields.map((f, i) => ({ ...f, sortOrder: i }));
}
