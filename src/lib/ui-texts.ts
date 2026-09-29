/**
 * The site's interface texts, as an editor can change them.
 *
 * Every label, heading and sentence the site prints that is not the text of a
 * decision lives in a dictionary or in a `T` table beside its page. Those
 * stay the defaults – and the only source when nothing was edited. The admin's
 * «Тексти сайту» lists them all, one row each, and an edit there wins over
 * the default *for that language only*.
 *
 * What counts as an edit: the row's text differs from `base`, the text the
 * code had when the row was written. So a row nobody touched never masks a
 * later change to the code, and an empty text is a slip, not an instruction:
 * it is ignored.
 */
import { uiTexts, type UiText } from "@/content/ui-texts";
import type { Locale } from "@/i18n/config";

type Pair = { uk: string; en: string };

const byId = new Map(uiTexts.filter((e) => typeof e.id === "string").map((e) => [e.id, e]));

/** The text for one language: the editor's if they changed it, else the code's. */
export function pickText(e: UiText | undefined, locale: Locale, fallback: string): string {
  if (!e) return fallback;
  const text = e.text?.[locale];
  const base = e.base?.[locale];
  return typeof text === "string" && text.trim() !== "" && text !== base ? text : fallback;
}

const pick = (id: string, locale: Locale, fallback: string) => pickText(byId.get(id), locale, fallback);

/**
 * A `{ uk, en }` table entry, open to the admin. `id` is stable and names the
 * place (`case.glanceH`); the pair is the code's own wording.
 */
export function txt(id: string, fallback: Pair): Pair {
  return { uk: pick(id, "uk", fallback.uk), en: pick(id, "en", fallback.en) };
}

/**
 * The UI dictionary with the admin's edits laid over it. The dictionary keeps
 * its shape – edits are written at the path in the row's id (`dict.nav.home`
 * is `dictionary.nav.home`; a list is addressed by index: `…openWays.1`).
 */
export function withEdits<T>(dict: T, locale: Locale, rows: readonly UiText[] = uiTexts): T {
  const out = structuredClone(dict) as unknown;
  for (const e of rows) {
    if (typeof e.id !== "string" || !e.id.startsWith("dict.")) continue;
    const parts = e.id.slice(5).split(".");
    let node = out as Record<string, unknown>;
    for (const p of parts.slice(0, -1)) {
      const next = node?.[p];
      if (next === null || typeof next !== "object") {
        node = null as never;
        break;
      }
      node = next as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (!node || typeof node[last] !== "string") continue;
    node[last] = pickText(e, locale, node[last] as string);
  }
  return out as T;
}
