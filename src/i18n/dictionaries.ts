import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/uk";
import { withEdits } from "@/lib/ui-texts";

/**
 * Lazily loads the UI dictionary for a locale. Dictionaries are code-split, so
 * a page only ships the strings for its active locale.
 */
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  uk: () => import("./dictionaries/uk").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  /* The defaults are the code's; what the admin edited in «Тексти сайту» is
     laid over them – see `src/lib/ui-texts.ts`. */
  return withEdits(await loaders[locale](), locale);
}

export type { Dictionary };
