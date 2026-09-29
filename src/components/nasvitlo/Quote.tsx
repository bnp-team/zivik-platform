import Link from "next/link";
import { pick } from "@/content/types";
import { icjGenocide } from "@/content/summaries/icj-genocide";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import "./quote.css";

/**
 * The decision the pull-quote is taken from.
 *
 * The words are the operative paragraph of the ICJ's Order on provisional
 * measures of 16 March 2022 in *Allegations of Genocide* (Ukraine v. Russian
 * Federation) — one of the eight decisions written up here. Quoting a court
 * without saying where the sentence comes from is the one thing a legal
 * archive cannot do, and the reader had no way to reach it.
 */
const QUOTE_SLUG = "icj-genocide";

/**
 * The document the sentence is taken from: the ICJ's Order on provisional
 * measures of 16 March 2022 in *Allegations of Genocide*, on the Court's own
 * site.
 *
 * The band linked only the case page, and the case page writes up a different
 * decision — the Judgment on Preliminary Objections of 2 February 2024. So a
 * reader who wanted the words above could reach the case but not the order
 * they come from. Owner's request, and it is the archive's own rule: a quoted
 * court is quoted with the document behind it.
 *
 * The URL is the one the owner gave, with its `fbclid` stripped — that
 * parameter is a click identifier from the referring site and has no business
 * in a citation.
 */
const QUOTE_DOC =
  "https://www.icj-cij.org/public/files/case-related/182/182-20220316-ORD-01-00-EN.pdf";

/**
 * The quotation marks, per language. Ukrainian sets «…», English “…”.
 * The dictionary's `quote.text` carries no marks of its own, so nothing is
 * doubled here — check before changing either side.
 *
 * A third mark used to stand above the quote as an ornament: 72px of display
 * serif at 1440px, against 34px of quoted text. It was the largest type in the
 * band and a second opening « sitting directly above the real one. The pair
 * around the words is what marks a quotation — that was the reason the pair
 * was introduced — so the glyph above them was decoration at twice their size
 * and is gone. Restoring it is one rule in quote.css if it is missed.
 */
const MARKS: Record<Locale, [string, string]> = {
  uk: ["«", "»"],
  en: ["\u201C", "\u201D"],
};

/**
 * The parties, read off the case summary rather than typed here: the same
 * value is the <h1> of the page this links to, so the two cannot drift apart.
 *
 * The archive's full name for the case is "Ukraine v. Russian Federation:
 * 32 States intervening" — the title of the Preliminary Objections judgment of
 * 2 February 2024. The sentence quoted here is from the order of 16 March
 * 2022, before any State had intervened, so the rider is cut at the colon
 * rather than attached to a decision it does not belong to.
 */
function parties(locale: Locale) {
  const fullName = icjGenocide.title
    ? pick(icjGenocide.title, locale)
    : icjGenocide.masthead.parties.replace(/^\(|\)$/g, "");
  return fullName.split(":")[0].trim();
}

export default function Quote({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const href = `/${locale}/cases/${QUOTE_SLUG}`;

  return (
    <figure className="nsvq">
      {/* The thin light element that divides this band from the map above it,
          in place of the empty strip that used to sit there. Decoration, so it
          is hidden from assistive technology. */}
      <span className="nsvq-seam" aria-hidden="true" />
      <blockquote className="nsvq-text" cite={href}>
        {MARKS[locale][0]}
        {dict.quote.text}
        {MARKS[locale][1]}
      </blockquote>
      {/*
        Two lines under the quote, where there were four.
        Dropped: a link labelled with the full title of the decision on the far
        side — "СТОРІНКА СПРАВИ: РІШЕННЯ ВІД 2 ЛЮТОГО 2024 Р. (ПОПЕРЕДНІ
        ЗАПЕРЕЧЕННЯ) →", 70 characters of bold uppercase under a quotation —
        and the General List number (ICJ GL 182), which took the mono line from
        three facts to four.

        The long label was there for a reason worth keeping in view: the case
        page writes up a *different* decision from the one quoted — the
        Judgment on Preliminary Objections of 2 February 2024, not the Order of
        16 March 2022 — so the label it replaced ("Читати рішення" / "Read the
        decision") promised the quoted decision and did not deliver it. Naming
        the case rather than a decision retires the problem at its root: both
        decisions belong to this one case, and the case name is the title of
        the page on the far side. Nothing is promised that is not delivered,
        and it costs one line instead of two.

        The General List number identifies the case to a registry. The case
        page carries it, and no question a reader has on a home page is
        answered by it.

        `dict.quote.read` ("Читати рішення" / "Read the decision") is the label
        on the third line, which the owner asked for: the order itself, on the
        Court's site. It is the one link on this band that does deliver the
        quoted decision.
      */}
      <figcaption className="nsvq-cite">
        <Link href={href} className="nsvq-link">
          <cite className="nsvq-case">{parties(locale)}</cite>
          <span aria-hidden="true"> →</span>
        </Link>
        <span className="nsvq-meta">{dict.quote.source}</span>
        {/* `dict.quote.read` — «Читати рішення» / "Read the decision" — has a
            consumer again, and this time it delivers what it promises: the
            order the sentence above is quoted from, not the case page. */}
        <a
          className="nsvq-doc"
          href={QUOTE_DOC}
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.quote.read}
        </a>
      </figcaption>
    </figure>
  );
}
