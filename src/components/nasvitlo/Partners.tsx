import Image from "next/image";
import { type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pick, type Partner } from "@/content/types";

/**
 * The partner band: who funded this, and an open door for who might next.
 *
 * It was a row of marks and nothing else – the whole account, on the owner's
 * instruction that partners belong on the home page and nowhere else (a
 * `/{locale}/partners` page and a header tab held the same single mark twice
 * more and are gone). What a row of one mark could not say is the two things
 * a reader actually asks: who is this, and can we be on it.
 *
 * So the band is two halves now. On the left, the support this archive has:
 * the funding line, the mark, the institute's own name and a sentence saying
 * what it is. On the right, the support it does not have yet: what a
 * partnership could be, and one way to start one.
 *
 * The right half is not the old support band coming back. That one asked
 * readers for money and was taken off by the owner; this asks institutions
 * for work, and the four things it names are nouns rather than links,
 * because there is no page behind any of them.
 */
export default function Partners({
  locale,
  dict,
  partners,
}: {
  locale: Locale;
  dict: Dictionary;
  partners: Partner[];
}) {
  const p = dict.partners;
  /* The ask stands on its own – it is about partnerships this archive does
     not have yet, so it does not wait for one it does. The supporters column
     is what disappears when there is nobody in it. */
  const hasPartners = partners.length > 0;

  /** One partner: the mark on its own card, the name, and who they are. */
  const entry = (partner: Partner) => {
    const name = pick(partner.name, locale);
    const blurb = partner.blurb ? pick(partner.blurb, locale) : null;
    /* The mark sits on white whatever the band's ground is. A supplied logo
       is a fixed artwork – ifa's is black type beside a red mark – and it is
       theirs to look right on the paper it was drawn for, not ours to tint.
       The alt text carries the name because the caption under it is a
       heading about the partner, not a label for the picture. */
    const mark = partner.logo ? (
      <span className="pmark-plate">
        <Image
          src={partner.logo}
          alt={name}
          width={520}
          height={148}
          style={{ maxWidth: "100%", height: "auto", width: "auto" }}
        />
      </span>
    ) : null;
    const body = (
      <>
        {mark}
        <span className="pmark-name">{name}</span>
        {blurb && <span className="pmark-blurb">{blurb}</span>}
      </>
    );
    return partner.url ? (
      <a
        key={partner.id}
        className="pmark"
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    ) : (
      <span key={partner.id} className="pmark">
        {body}
      </span>
    );
  };

  return (
    <div id="partners" className="nsv-partners">
      <div className="nsv-sechead">
        <div>
          <div className="lbl">
            <span>{p.label}</span>
          </div>
          <h2>{p.heading}</h2>
        </div>
      </div>

      <div className="nsv-partnergrid">
        {hasPartners && (
          <div className="nsv-supporters">
            <p className="nsv-fundline">{p.funded}</p>
            <div className="nsv-partnerrow">{partners.map(entry)}</div>
          </div>
        )}

        {/* The dark half. Same night as the footer it runs into, so the page
            closes in one colour rather than two, and the one warm light in it
            comes from the top edge – the lamp, which is the whole site's
            figure for this. */}
        <div className="nsv-open">
          <p className="nsv-open-lbl">{p.openLabel}</p>
          <h3 className="nsv-open-h">{p.openHeading}</h3>
          <p className="nsv-open-t">{p.openText}</p>
          <p className="nsv-open-ways">
            {p.openWays.map((way, i) => (i === 0 ? way : way.charAt(0).toLowerCase() + way.slice(1))).join(", ")}.
          </p>
          <a
            className="nsv-open-cta"
            href={`mailto:${dict.footer.email}?subject=${encodeURIComponent(p.openLabel)}`}
          >
            {p.openCta}
          </a>
        </div>
      </div>
    </div>
  );
}
