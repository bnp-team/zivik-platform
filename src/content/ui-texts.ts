import { uiTextCatalog } from "./ui-texts.catalog";
import type { Localized } from "./types";

/**
 * One row of «Тексти сайту» in the admin: a piece of interface text and what
 * the code says it is.
 *
 * `text` is what the admin edits. `base` is the code's wording when the row
 * was written, kept so the site can tell an edit from an untouched row – see
 * `src/lib/ui-texts.ts`. The catalog is generated (`npm run ui-texts`) from
 * the dictionaries and from every `txt("id", { uk, en })` in the code.
 */
export interface UiText {
  /** `dict.<path>` for the dictionaries, `<page>.<name>` for a page's own table. */
  id: string;
  /** The place on the site, in the admin's words – the list is grouped by it. */
  group: string;
  text: Localized;
  base: Localized;
}

/**
 * The content of the collection. In the Cloudflare build the published rows
 * take this initializer's place; in the Next build it stays the catalog, and
 * the site reads exactly what the code says.
 */
export const uiTexts: UiText[] = uiTextCatalog;
