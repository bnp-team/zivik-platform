/**
 * The shapes of the eight JSON fields of a decision summary, described for
 * the admin editor (./admin.tsx) – which draws a form from them instead of a
 * box of raw JSON.
 *
 * Each shape mirrors a type in src/content/summaries/types.ts; the labels are
 * the admin's words for it. Keys the description does not name are kept as
 * they are when the entry is saved, so a field the editor does not know yet
 * is never lost – it just is not shown.
 */

export type Shape =
  /** A plain string. */
  | { kind: "text"; label: string; multiline?: boolean; optional?: boolean; hint?: string }
  /** `{ uk, en }`. */
  | { kind: "loc"; label: string; multiline?: boolean; optional?: boolean; hint?: string }
  /** `string | { uk, en }` – one value for both languages, or a pair. */
  | { kind: "either"; label: string; optional?: boolean; hint?: string }
  | { kind: "number"; label: string; optional?: boolean; hint?: string }
  | { kind: "bool"; label: string; optional?: boolean; hint?: string }
  | { kind: "select"; label: string; options: { value: string; label: string }[]; optional?: boolean }
  /** `string[]`, one per line. */
  | { kind: "lines"; label: string; optional?: boolean; hint?: string }
  | {
      kind: "object";
      label?: string;
      fields: Record<string, Shape>;
      optional?: boolean;
      /**
       * Fields shown only when a sibling has one of these values – the review
       * text's «Назва в змісті» only on an h3. A field that already holds a
       * value is shown whatever the sibling says, so nothing is hidden away.
       */
      when?: Record<string, { key: string; in: string[] }>;
    }
  | {
      kind: "list";
      label: string;
      item: Shape;
      optional?: boolean;
      /** What a collapsed row says – the first filled of these keys. */
      title?: string[];
      /** «Додати …» */
      noun?: string;
      /** «+» on every row adds a new one right below it, not only at the end. */
      insert?: boolean;
      /** A collapsed row's line when keys are not enough. */
      format?: (v: never) => string;
    };

const loc = (label: string, extra: Partial<{ multiline: boolean; optional: boolean; hint: string }> = {}): Shape => ({
  kind: "loc",
  label,
  ...extra,
});
const text = (label: string, extra: Partial<{ multiline: boolean; optional: boolean; hint: string }> = {}): Shape => ({
  kind: "text",
  label,
  ...extra,
});
const num = (label: string, extra: Partial<{ optional: boolean; hint: string }> = {}): Shape => ({
  kind: "number",
  label,
  ...extra,
});

const metric: Shape = {
  kind: "object",
  fields: {
    label: loc("Підпис"),
    value: { kind: "either", label: "Значення", hint: "Число однакове для обох мов – впишіть лише UA." },
    percent: num("Частка, % (смужка)", { optional: true }),
    restLabel: loc("Підпис решти смужки", { optional: true }),
    count: num("Кількість", { optional: true }),
    partOfAbove: { kind: "bool", label: "Частина рядка вище (з відступом)", optional: true },
    group: loc("Група (заголовок над рядками)", { optional: true }),
    note: loc("Примітка", { multiline: true, optional: true }),
    alt: {
      kind: "object",
      label: "Інша оцінка",
      optional: true,
      fields: { label: loc("Підпис"), value: loc("Значення") },
    },
  },
};

const money: Shape = {
  kind: "object",
  fields: {
    label: loc("Підпис"),
    display: { kind: "either", label: "Як показати суму", hint: "Напр. «$1,11 млрд»" },
    amount: num("Сума числом", { hint: "Без пробілів і ком: 1111300729" }),
    currency: {
      kind: "select",
      label: "Валюта",
      optional: true,
      options: [
        { value: "USD", label: "USD" },
        { value: "EUR", label: "EUR" },
      ],
    },
    after: { kind: "bool", label: "Після рішення (виконання, стягнення)", optional: true },
    estimated: { kind: "bool", label: "Оцінка, не точна сума", optional: true },
    note: loc("Примітка", { multiline: true, optional: true }),
    parts: {
      kind: "list",
      label: "Складові суми",
      optional: true,
      noun: "складову",
      title: ["label"],
      item: {
        kind: "object",
        fields: {
          label: loc("Підпис"),
          display: { kind: "either", label: "Як показати" },
          amount: num("Сума числом"),
        },
      },
    },
  },
};

const objection: Shape = {
  kind: "object",
  fields: {
    ground: loc("Підстава заперечення"),
    latin: text("Латиною", { optional: true, hint: "Напр. ratione materiae" }),
    objection: loc("Що заперечувала сторона", { multiline: true }),
    outcome: {
      kind: "select",
      label: "Рішення суду",
      options: [
        { value: "rejected", label: "Відхилено" },
        { value: "upheld", label: "Підтримано" },
      ],
    },
    reasoning: loc("Мотиви суду", { multiline: true }),
    votes: {
      kind: "list",
      label: "Голосування",
      optional: true,
      noun: "голосування",
      format: (v: { for?: number; against?: number; scope?: { uk?: string } }) =>
        [`за ${v.for ?? "?"} · проти ${v.against ?? "?"}`, v.scope?.uk].filter(Boolean).join(" – "),
      item: {
        kind: "object",
        fields: {
          for: num("За"),
          against: num("Проти"),
          scope: loc("Щодо чого", { optional: true }),
        },
      },
    },
  },
};

const person: Shape = {
  kind: "object",
  fields: {
    name: loc("Ім'я"),
    role: loc("Посада"),
    born: text("Рік народження", { optional: true }),
    rung: num("Щабель у вертикалі (номер)", { optional: true }),
    charges: {
      kind: "list",
      label: "Обвинувачення",
      noun: "обвинувачення",
      title: ["art", "label"],
      item: {
        kind: "object",
        fields: {
          art: text("Стаття", { hint: "Напр. 8(2)(a)(vii)" }),
          label: loc("Назва"),
          kind: {
            kind: "select",
            label: "Вид",
            options: [
              { value: "war-crime", label: "Воєнний злочин" },
              { value: "cah", label: "Злочин проти людяності" },
            ],
          },
        },
      },
    },
    modes: {
      kind: "list",
      label: "Форми відповідальності",
      noun: "форму",
      title: ["art", "label"],
      item: { kind: "object", fields: { art: text("Стаття"), label: loc("Назва") } },
    },
  },
};

/** `SummaryBlockKind` in src/content/summaries/types.ts, in the editor's words. */
const BLOCK_KINDS = [
  { value: "p", label: "p – звичайний абзац" },
  { value: "lead", label: "lead – вступний абзац" },
  { value: "h2", label: "h2 – нумерований розділ" },
  { value: "h3", label: "h3 – підзаголовок" },
  { value: "h4", label: "h4 – пункт (a)/(b)/(c)" },
  { value: "dispositif", label: "dispositif – пункт резолютивної частини" },
  { value: "findings", label: "findings – таблиця висновків" },
  { value: "position", label: "position – висновок суду з пункту вище" },
  { value: "claim", label: "claim – аргумент сторони" },
  { value: "note", label: "note – пояснення від нас, не слова суду" },
  { value: "subject", label: "subject – предмет спору" },
  { value: "link", label: "link – посилання на джерело" },
];

const VERDICT_OUTCOMES = [
  { value: "violation", label: "Порушення" },
  { value: "no-violation", label: "Без порушення" },
  { value: "granted", label: "Задоволено" },
  { value: "rejected", label: "Відхилено" },
  { value: "not-decided", label: "Не вирішено" },
  { value: "convicted", label: "Засуджено" },
  { value: "acquitted", label: "Виправдано" },
];

const KIND_SHORT = Object.fromEntries(BLOCK_KINDS.map((k) => [k.value, k.value]));

export const SHAPES: Record<string, Shape> = {
  /**
   * The review text: one row per paragraph, both languages side by side
   * (`pair` in site/content/collections.ts stores it so). The type and the
   * verdict are one for both languages; everything else is a UA | EN pair.
   */
  summaryText: {
    kind: "list",
    label: "Абзаци",
    noun: "абзац",
    insert: true,
    format: (v: { kind?: string; text?: { uk?: string; en?: string } }) =>
      `${KIND_SHORT[v.kind ?? ""] ?? "?"} · ${v.text?.uk || v.text?.en || ""}`,
    item: {
      kind: "object",
      fields: {
        kind: { kind: "select", label: "Тип", options: BLOCK_KINDS },
        text: loc("Текст", { multiline: true, hint: "Український і англійський – той самий абзац." }),
        nav: loc("Назва в змісті", { optional: true, hint: "Коротша назва в бічному змісті. Порожньо – як заголовок." }),
        navOff: { kind: "bool", label: "Назва в змісті: не показувати", optional: true },
        measure: loc("Захід", { optional: true, hint: "Який тимчасовий захід цей пункт перевіряє." }),
        outcome: { kind: "select", label: "Результат", options: VERDICT_OUTCOMES, optional: true },
        outcomes: { kind: "lines", label: "Результати частин (по рядку)", optional: true },
        instrument: text("Інструмент", { optional: true, hint: "Напр. ICSFT або CERD." }),
        place: loc("Місце", { optional: true }),
      },
      when: {
        nav: { key: "kind", in: ["h3"] },
        navOff: { key: "kind", in: ["h3"] },
        measure: { key: "kind", in: ["h4"] },
        outcome: { key: "kind", in: ["h4"] },
        outcomes: { key: "kind", in: ["findings"] },
        instrument: { key: "kind", in: ["subject"] },
        place: { key: "kind", in: ["subject"] },
      },
    },
  },
  theatres: {
    kind: "list",
    label: "Театри подій",
    noun: "театр",
    title: ["place"],
    item: {
      kind: "object",
      fields: {
        place: loc("Місце"),
        tag: { kind: "either", label: "Мітка" },
        summary: loc("Що сталося", { multiline: true }),
        markerKeys: { kind: "lines", label: "Маркери на мапі (ключі, по одному в рядку)" },
        ground: {
          kind: "select",
          label: "Показати як",
          optional: true,
          options: [
            { value: "points", label: "Точки" },
            { value: "area", label: "Область" },
          ],
        },
        areas: {
          kind: "lines",
          label: "Області (country / crimea / east, по одній у рядку)",
          optional: true,
        },
        markerNames: {
          kind: "list",
          label: "Підписи маркерів",
          optional: true,
          noun: "підпис",
          title: ["label"],
          item: {
            kind: "object",
            fields: {
              label: loc("Підпис"),
              dx: num("Зсув по горизонталі", { optional: true }),
              dy: num("Зсув по вертикалі", { optional: true }),
            },
          },
        },
        labelDx: num("Зсув підпису по горизонталі", { optional: true }),
        labelDy: num("Зсув підпису по вертикалі", { optional: true }),
      },
    },
  },
  mapFocus: {
    kind: "object",
    fields: {
      forumKey: text("Місто суду (ключ)", { hint: "Напр. hague, strasbourg" }),
      reachTo: text("Лінія до (ключ)", { optional: true }),
    },
  },
  takings: {
    kind: "object",
    fields: {
      heading: loc("Заголовок"),
      lead: loc("Вступ", { multiline: true, optional: true }),
      note: loc("Примітка", { multiline: true, optional: true }),
      metrics: { kind: "list", label: "Показники", noun: "показник", title: ["label"], item: metric },
    },
  },
  amounts: {
    kind: "object",
    fields: {
      note: loc("Примітка", { multiline: true, optional: true }),
      figures: { kind: "list", label: "Суми", noun: "суму", title: ["label"], item: money },
    },
  },
  attribution: {
    kind: "object",
    fields: {
      respondent: loc("Відповідач"),
      note: loc("Примітка", { multiline: true }),
      routes: {
        kind: "list",
        label: "Підстави відповідальності",
        optional: true,
        noun: "підставу",
        title: ["basis"],
        item: {
          kind: "object",
          fields: { basis: text("Ключ підстави"), label: loc("Назва") },
        },
      },
      nodes: {
        kind: "list",
        label: "Ланки ланцюга",
        noun: "ланку",
        title: ["actor"],
        item: {
          kind: "object",
          fields: {
            actor: loc("Хто"),
            did: loc("Що зробив", { multiline: true }),
            basis: text("Підстава (ключ з «Підстави відповідальності»)"),
            basisNote: loc("Пояснення підстави", { multiline: true }),
          },
        },
      },
    },
  },
  objections: {
    kind: "object",
    fields: {
      heading: loc("Заголовок"),
      note: loc("Примітка", { multiline: true }),
      benchSize: num("Суддів у складі", { optional: true }),
      items: { kind: "list", label: "Заперечення", noun: "заперечення", title: ["ground"], item: objection },
    },
  },
  afterlife: {
    kind: "object",
    fields: {
      heading: loc("Заголовок"),
      note: loc("Примітка", { multiline: true }),
      stages: {
        kind: "list",
        label: "Етапи",
        noun: "етап",
        title: ["year", "title"],
        item: {
          kind: "object",
          fields: {
            year: text("Рік"),
            iso: text("Дата (РРРР-ММ-ДД)", { optional: true }),
            title: loc("Що сталося"),
            note: loc("Пояснення", { multiline: true }),
            standing: {
              kind: "select",
              label: "Рішення стоїть?",
              options: [
                { value: "yes", label: "Так" },
                { value: "no", label: "Ні" },
              ],
            },
          },
        },
      },
    },
  },
  warrants: {
    kind: "object",
    fields: {
      heading: loc("Заголовок"),
      note: loc("Примітка", { multiline: true }),
      waves: {
        kind: "list",
        label: "Хвилі ордерів",
        noun: "хвилю",
        title: ["date", "theme"],
        item: {
          kind: "object",
          fields: {
            date: loc("Дата (як показати)"),
            iso: text("Дата (РРРР-ММ-ДД)"),
            theme: loc("Тема"),
            summary: loc("Коротко", { multiline: true }),
            url: text("Посилання на джерело"),
            line: text("Лінія (ключ з «Лінії»)", { optional: true }),
            persons: { kind: "list", label: "Особи", noun: "особу", title: ["name"], item: person },
          },
        },
      },
      rungs: {
        kind: "list",
        label: "Щаблі вертикалі",
        optional: true,
        noun: "щабель",
        item: loc("Щабель"),
      },
      lines: {
        kind: "list",
        label: "Лінії",
        optional: true,
        noun: "лінію",
        title: ["key", "label"],
        item: {
          kind: "object",
          fields: { key: text("Ключ"), label: loc("Назва"), summary: loc("Коротко", { multiline: true }) },
        },
      },
    },
  },
};

/* ── The other collections' JSON fields ─────────────────────────────────── */

const linkList = (lang: string): Shape => ({
  kind: "list",
  label: `Посилання – ${lang}`,
  noun: "посилання",
  title: ["text"],
  item: {
    kind: "object",
    fields: {
      text: text("Фрагмент абзацу", {
        hint: "Має дослівно збігатися з частиною абзацу вище – інакше збірка зупиниться.",
      }),
      href: text("Адреса", { hint: "https://…" }),
    },
  },
});

Object.assign(SHAPES, {
  /* Провадження → «Дата рішення» (CaseDate in src/content/types.ts). */
  decidedOn: {
    kind: "object",
    fields: {
      precision: {
        kind: "select",
        label: "Точність",
        options: [
          { value: "day", label: "Відомий день" },
          { value: "year", label: "Відомий лише рік" },
        ],
      },
      iso: text("Дата (РРРР-ММ-ДД)", { optional: true, hint: "Лише коли відомий день." }),
      year: num("Рік"),
    },
  },
  /* Про проєкт → «Посилання в тексті». */
  aboutLinks: { kind: "object", fields: { uk: linkList("UA"), en: linkList("EN") } },
  /* Мапа: ключі міст судів (MAP_COURTS) – події й країни. */
  courtKeys: { kind: "lines", label: "Міста судів (ключі, по одному в рядку)", hint: "Напр. hague, strasbourg, paris" },
  /* Мапа: події → «Огляди». */
  caseSlugs: { kind: "lines", label: "Огляди (slug, по одному в рядку)", hint: "Напр. icj-genocide" },
  /* Мапа: суди. */
  institutionIds: { kind: "lines", label: "Інституції (id з реєстру, по одному в рядку)", hint: "Напр. icj, icc" },
  seats: {
    kind: "list",
    label: "Суди в цьому місті",
    noun: "суд",
    title: ["name"],
    item: {
      kind: "object",
      fields: {
        name: loc("Назва"),
        abbr: { kind: "either", label: "Скорочення", optional: true },
        institutionId: text("Інституція (id з реєстру)", { optional: true }),
      },
    },
  },
  offAt: {
    kind: "object",
    fields: {
      x: num("Напрям по горизонталі (x)"),
      y: num("Напрям по вертикалі (y)"),
    },
  },
  /* Юридичні сторінки → «Розділи» (LegalSection in src/content/legal-docs.ts). */
  legalSections: {
    kind: "list",
    label: "Розділи",
    noun: "розділ",
    title: ["heading"],
    item: {
      kind: "object",
      fields: {
        id: text("Код розділу", { hint: "Латиницею, без пробілів: для посилань на розділ. Уже наявні не змінюйте." }),
        heading: loc("Заголовок розділу"),
        auto: {
          kind: "select",
          label: "Текст пише код",
          optional: true,
          options: [{ value: "cookies", label: "Так – розділ про cookie й аналітику (текст залежить від збірки)" }],
        },
        blocks: {
          kind: "list",
          label: "Абзаци й списки",
          noun: "абзац чи список",
          format: (v: { kind?: string; text?: { uk?: string }; items?: { uk?: string[] } }) =>
            v.kind === "ul" ? `Список: ${v.items?.uk?.[0] ?? ""}` : (v.text?.uk ?? ""),
          item: {
            kind: "object",
            fields: {
              kind: {
                kind: "select",
                label: "Що це",
                options: [
                  { value: "p", label: "Абзац" },
                  { value: "ul", label: "Маркований список" },
                ],
              },
              text: loc("Текст абзацу", { multiline: true, optional: true }),
              link: {
                kind: "object",
                label: "Посилання в кінці абзацу",
                optional: true,
                fields: {
                  label: loc("Підпис посилання"),
                  to: text("Куди", { hint: "Сторінка сайту без мови: privacy, terms, registry…" }),
                },
              },
              noAnalytics: loc("Текст, якщо на сайті вимкнено аналітику", { multiline: true, optional: true }),
              items: {
                kind: "object",
                label: "Пункти списку (по одному в рядку)",
                optional: true,
                fields: {
                  uk: { kind: "lines", label: "UA" },
                  en: { kind: "lines", label: "EN" },
                },
              },
              itemsNoAnalytics: {
                kind: "object",
                label: "Пункти, якщо на сайті вимкнено аналітику",
                optional: true,
                fields: {
                  uk: { kind: "lines", label: "UA" },
                  en: { kind: "lines", label: "EN" },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Record<string, Shape>);

/* ── Values ───────────────────────────────────────────────────────────── */

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Is this value «nothing» for an optional field – so the key is left out? */
export function isEmpty(shape: Shape, v: Json): boolean {
  if (v === undefined || v === null || v === "") return true;
  switch (shape.kind) {
    case "loc":
      return isObj(v) && !String(v.uk ?? "").trim() && !String(v.en ?? "").trim();
    case "either":
      return typeof v === "string" ? !v.trim() : isObj(v) && !String(v.uk ?? "").trim() && !String(v.en ?? "").trim();
    case "lines":
    case "list":
      return Array.isArray(v) && v.length === 0;
    case "bool":
      return v === false;
    case "object":
      return isObj(v) && Object.entries(shape.fields).every(([k, s]) => isEmpty(s, v[k]));
    default:
      return false;
  }
}

/**
 * The value as the site reads it: optional fields that are empty are dropped,
 * required ones stay (the build reports them), keys the shape does not know
 * are kept untouched.
 */
export function clean(shape: Shape, v: Json): Json {
  if (shape.kind === "object") {
    if (!isObj(v)) return v;
    const out: Record<string, Json> = {};
    for (const [k, val] of Object.entries(v)) {
      const s = shape.fields[k];
      if (!s) {
        out[k] = val;
        continue;
      }
      if (s.optional && isEmpty(s, val)) continue;
      out[k] = clean(s, val);
    }
    return out;
  }
  if (shape.kind === "list") return Array.isArray(v) ? v.map((x) => clean(shape.item, x)) : v;
  if (shape.kind === "either" && isObj(v) && !String(v.en ?? "").trim()) return v.uk ?? "";
  return v;
}

/** A fresh, empty value for a new list item or a newly opened optional part. */
export function blank(shape: Shape): Json {
  switch (shape.kind) {
    case "text":
      return "";
    case "loc":
      return { uk: "", en: "" };
    case "either":
      return "";
    case "number":
      return 0;
    case "bool":
      return false;
    case "select":
      return shape.options[0]?.value ?? "";
    case "lines":
    case "list":
      return [];
    case "object": {
      const out: Record<string, Json> = {};
      for (const [k, s] of Object.entries(shape.fields)) if (!s.optional) out[k] = blank(s);
      return out;
    }
  }
}
