/**
 * Grammatical number, once.
 *
 * This lived twice – `Intl.PluralRules`-based in `RegistryTable.tsx` and
 * hand-rolled in `cases/[slug]/page.tsx` – and the map, which needed it as
 * much as either, called neither: `dict.mapSection.caseload` baked the
 * genitive plural into its own template, so eight of the nine courts on
 * /uk/map read «1 проваджень», «2 проваджень», «3 проваджень», and seven of
 * the nine on /en/map read "1 proceedings". A third copy was the obvious next
 * step and the wrong one, so both callers point here now.
 *
 * `Intl.PluralRules` rather than arithmetic on n % 10. Ukrainian agreement has
 * three forms – 1 провадження, 2–4 провадження, 5+ проваджень – and the teens
 * all take the last, which is why 11 and 21 disagree; the hand-rolled version
 * got that right and got English wrong in the other direction, printing
 * "21 case" because n % 10 === 1. English resolves to one/other, and reads
 * `one` and `many`.
 */
export interface PluralForms {
  one: string;
  few: string;
  many: string;
}

/** One `Intl.PluralRules` per locale; constructing them is not free. */
const PR = new Map<string, Intl.PluralRules>();

export function plural(n: number, forms: PluralForms, locale: string): string {
  let rules = PR.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    PR.set(locale, rules);
  }
  const category = rules.select(n);
  if (category === "one") return forms.one;
  if (category === "few") return forms.few;
  return forms.many;
}
