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
  | { kind: "object"; label?: string; fields: Record<string, Shape>; optional?: boolean }
  | {
      kind: "list";
      label: string;
      item: Shape;
      optional?: boolean;
      /** What a collapsed row says – the first filled of these keys. */
      title?: string[];
      /** «Додати …» */
      noun?: string;
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

export const SHAPES: Record<string, Shape> = {
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
