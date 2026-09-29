/**
 * The amount at stake in a proceeding, as a figure a reader can read.
 *
 * ── The sign ───────────────────────────────────────────────────────────────
 * `RegistryCase.amountUsd` is signed, and the sign encodes which way the money
 * ran: the Naftogaz gas sales arbitration is recorded as −2.02bn because the
 * award netted *to* Gazprom. That direction is a fact about the case, not
 * something a figure in a table cell or a tag can caption honestly in the
 * three words it has. So every surface here prints the magnitude and labels it
 * the sum in dispute – «Сума у спорі» / "Amount in dispute" – and leaves the
 * direction to the case page, which has room to say it.
 *
 * Nothing here may sum these values. Thirteen of the thirty-three rows carry
 * one, they mix claims still pending with awards already made and at least one
 * that ran the other way, and adding their magnitudes together would produce a
 * headline figure that no document supports.
 *
 * ── Why a module ───────────────────────────────────────────────────────────
 * This was two private copies of the same function, in `content/map-links.ts`
 * and `components/cases/CasePending.tsx`, with the same comment written twice
 * and two different precisions. The precisions are a real difference – a map
 * tag has room for "$5,0 млрд" and a definition list has room for the whole
 * number – so both survive, as two named exports rather than two files that
 * happen to agree about the sign.
 */
import type { Locale } from "@/i18n/config";

function format(
  amountUsd: number,
  locale: Locale,
  options: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-GB", {
    style: "currency",
    currency: "USD",
    ...options,
  }).format(Math.abs(amountUsd));
}

/** «$5,0 млрд» – for a tag, a chip or a ledger row, where width is the budget. */
export function moneyCompact(amountUsd: number, locale: Locale): string {
  return format(amountUsd, locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

/** «5 000 000 000 $» – for a definition list, where the whole number fits. */
export function moneyFull(amountUsd: number, locale: Locale): string {
  return format(amountUsd, locale, { maximumFractionDigits: 0 });
}
