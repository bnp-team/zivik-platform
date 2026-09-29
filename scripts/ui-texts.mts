/**
 * The catalog of interface texts the admin can edit.
 *
 *   npm run ui-texts           rewrite src/content/ui-texts.catalog.ts
 *   npm run ui-texts -- --check  fail if the file is not what the code says
 *
 * Two places hold interface text: the two dictionaries (src/i18n/dictionaries)
 * and the `txt("id", { uk, en })` calls beside the pages. This reads both and
 * writes one list – id, group, and the code's wording in both languages – which
 * is what «Тексти сайту» is seeded from and what the site falls back to.
 *
 * A text added or reworded in the code changes the catalog; run this, commit
 * the result, and (for a new text to show up in the admin) bring the running
 * EmDash up to date with `npm run cf:content -- push`.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";
import ukModule from "../src/i18n/dictionaries/uk";
import enModule from "../src/i18n/dictionaries/en";

const ROOT = resolve(".");
const OUT = resolve("src/content/ui-texts.catalog.ts");

/** What an editor calls the place a text is on, by the first part of its id. */
const GROUPS: Record<string, string> = {
  "dict.meta": "Назва сайту для пошуку й соцмереж",
  "dict.nav": "Меню й шапка",
  "dict.brand": "Назва й логотип",
  "dict.hero": "Головна: шапка",
  "dict.intro": "Головна: вступ",
  "dict.about": "Головна: «Про проєкт»",
  "dict.pending": "Сторінка «Ще досліджуємо» (загальне)",
  "dict.quote": "Головна: цитата",
  "dict.mapSection": "Мапа",
  "dict.registry": "Бібліотека рішень: стадії й типи",
  "dict.newsletter": "Розсилка",
  "dict.partners": "Головна: партнери",
  "dict.footer": "Футер",
  case: "Сторінка рішення: підписи",
  library: "Бібліотека рішень: сторінка",
  about: "Про проєкт: сторінка",
  team: "Команда: сторінка",
  terms: "Умови користування: підписи",
  privacy: "Політика приватності: підписи",
  pend: "Сторінка «Ще досліджуємо»: підписи",
  blog: "Блог",
};

const groupOf = (id: string): string => {
  const parts = id.split(".");
  return GROUPS[`${parts[0]}.${parts[1]}`] ?? GROUPS[parts[0]] ?? parts[0];
};

type Entry = { id: string; group: string; text: { uk: string; en: string }; base: { uk: string; en: string } };

/** Every string leaf of a dictionary, by dotted path; lists by index. */
function leaves(value: unknown, path: string[] = [], out = new Map<string, string>()) {
  if (typeof value === "string") out.set(path.join("."), value);
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, [...path, String(i)], out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) leaves(v, [...path, k], out);
  }
  return out;
}

function fromDictionaries(): Entry[] {
  const unwrap = (m: unknown) => ((m as { default?: unknown }).default ?? m) as unknown;
  const uk = leaves(unwrap(ukModule));
  const en = leaves(unwrap(enModule));
  const out: Entry[] = [];
  for (const [path, ukText] of uk) {
    const enText = en.get(path);
    if (enText === undefined) throw new Error(`dictionary: "${path}" is in uk.ts and not in en.ts`);
    const id = `dict.${path}`;
    out.push({ id, group: groupOf(id), text: { uk: ukText, en: enText }, base: { uk: ukText, en: enText } });
  }
  for (const path of en.keys()) if (!uk.has(path)) throw new Error(`dictionary: "${path}" is in en.ts and not in uk.ts`);
  return out;
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

function fromCode(): Entry[] {
  const out: Entry[] = [];
  const seen = new Map<string, string>();
  for (const file of walkFiles(join(ROOT, "src"))) {
    if (/ui-texts(\.catalog)?\.ts$/.test(file)) continue;
    const src = readFileSync(file, "utf8");
    if (!src.includes("txt(")) continue;
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const str = (n: ts.Node): string | null =>
      ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : null;
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "txt") {
        const where = `${relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
        const id = n.arguments[0] && str(n.arguments[0]);
        const obj = n.arguments[1];
        if (!id || !obj || !ts.isObjectLiteralExpression(obj)) throw new Error(`${where}: txt() wants a literal id and a literal { uk, en }`);
        const pair: Record<string, string> = {};
        for (const p of obj.properties) {
          if (ts.isPropertyAssignment(p)) {
            const v = str(p.initializer);
            if (v !== null) pair[p.name.getText()] = v;
          }
        }
        if (typeof pair.uk !== "string" || typeof pair.en !== "string") throw new Error(`${where}: txt("${id}") needs plain strings for uk and en`);
        if (seen.has(id)) throw new Error(`${where}: txt id "${id}" is used twice (also ${seen.get(id)})`);
        seen.set(id, where);
        out.push({ id, group: groupOf(id), text: { uk: pair.uk, en: pair.en }, base: { uk: pair.uk, en: pair.en } });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return out;
}

export function buildCatalog(): string {
  const entries = [...fromDictionaries(), ...fromCode()];
  const ids = new Set<string>();
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error(`id "${e.id}" appears twice`);
    ids.add(e.id);
  }
  return (
    `/* GENERATED by scripts/ui-texts.mts – do not edit by hand. Run \`npm run ui-texts\`. */\n` +
    `import type { UiText } from "./ui-texts";\n\n` +
    `export const uiTextCatalog: UiText[] = ${JSON.stringify(entries, null, 2)};\n`
  );
}

const check = process.argv.includes("--check");
const next = buildCatalog();
let current = "";
try {
  current = readFileSync(OUT, "utf8");
} catch {
  /* first run */
}
if (check) {
  if (current !== next) {
    console.error("✗ src/content/ui-texts.catalog.ts is out of date – run `npm run ui-texts` and commit the result.");
    process.exit(1);
  }
  console.log(`  ui-texts: catalog in sync (${(JSON.parse(next.slice(next.indexOf("= ") + 2, next.lastIndexOf(";"))) as unknown[]).length} texts)`);
} else if (current !== next) {
  writeFileSync(OUT, next);
  console.log(`  ui-texts: wrote ${relative(ROOT, OUT)}`);
} else {
  console.log("  ui-texts: unchanged");
}
