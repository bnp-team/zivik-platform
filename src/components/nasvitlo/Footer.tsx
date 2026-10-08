import { SUPPORT_URL } from "@/content/centre";
import Link from "next/link";
import "./footer.css";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { blogEnabled } from "@/content/blog";

const colHead: React.CSSProperties = {
  font: "700 var(--t-micro) var(--brand-font-body)",
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--brand-gold-pale)",
  marginBottom: 3,
};
const footLink: React.CSSProperties = {
  fontSize: "var(--t-sm)",
  color: "var(--brand-muted-dark)",
  textDecoration: "none",
};

/** One footer entry. Without `href` there is no page yet, so it renders as
 *  plain text: the column still shows what the archive will hold, but nothing
 *  claims to be clickable when it would only land back on the same page. */
type FootEntry = { label: string; href?: string };

/** Not-yet-a-link. Set apart by colour rather than opacity – dimming the link
 *  colour to 55% took it to 3.53:1, under the AA floor. This token is a
 *  designed value and clears it at 4.62:1 on the footer ground. */
const footPending: React.CSSProperties = {
  fontSize: "var(--t-sm)",
  color: "var(--brand-faint-dark)",
};

/** Left inset of the site chrome.
 *
 *  The footer sat at a flat 28px while the bar above it had moved to a fluid
 *  inset, so the wordmark in the header and the wordmark in the footer did not
 *  share a left edge – on a wide screen the footer hugged the window. This is
 *  the same expression the header uses (`components/nasvitlo/Header.tsx`),
 *  named once here rather than pasted as a literal. It wants to be a token in
 *  globals.css the day the chrome gutter gets one; until then the two values
 *  are kept identical by hand.
 */
/* The site's shared left edge – see the note in globals.css. Header, footer
   and every content band read this one value. */
const chromeInsetLeft = "var(--page-gutter)";

/** The contact address, which is the one thing in the footer a reader is
 *  asked to *use* rather than follow. Brighter than a nav link and underlined,
 *  so it is not mistaken for the postal address beneath it. */
const footMail: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 24,
  fontSize: "var(--t-sm)",
  fontWeight: 600,
  color: "var(--brand-gold-pale)",
  textDecoration: "underline",
  textDecorationThickness: 1,
  textUnderlineOffset: 4,
};

/** The legal bar reads at 11px, so its links are footLink at that size –
 *  same colour and same no-underline as every other link in the footer. */
const legalLink: React.CSSProperties = { ...footLink, fontSize: "var(--t-micro)" };

/** Dark site footer: brand, link columns, contacts, legal bar. */
export default function Footer({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const f = dict.footer;
  const column = (head: string, entries: FootEntry[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={colHead}>{head}</div>
      {entries.map(({ label, href }) =>
        href ? (
          <Link key={label} href={href} style={footLink}>
            {label}
          </Link>
        ) : (
          <span key={label} style={footPending}>
            {label}
          </span>
        ),
      )}
    </div>
  );

  return (
    /* Named, because this element and not `.nsv-foot` is what carries the dark
       ground: the legal bar is `.nsv-foot`'s sibling inside it, so a rule
       hung on `.nsv-foot` reaches the link columns and stops short of the two
       links under them. globals.css hangs the on-dark focus ring here. */
    <div
      className="nsv-footband"
      style={{
        position: "relative",
        zIndex: 3,
        background: "var(--brand-ink-black)",
        borderTop: "3px solid var(--brand-gold-mark)",
        padding: `44px 28px 0 ${chromeInsetLeft}`,
      }}
    >
      <footer
        className="nsv-foot"
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
          gap: 36,
          paddingBottom: 36,
        }}
      >
        <div>
          <div style={{ marginBottom: 13 }}>
            <span
              style={{
                fontFamily: "var(--brand-font-display),serif",
                fontSize: "var(--t-h3)",
                color: "var(--brand-cream-warm)",
                textShadow:
                  "0 0 18px rgba(255,238,196,.55),0 0 44px rgba(240,221,168,.28)",
              }}
            >
              {dict.brand.wordmark}
            </span>
          </div>
          <p
            style={{
              fontSize: "var(--t-sm)",
              lineHeight: 1.6,
              color: "var(--brand-faint-dark)",
              margin: "0 0 16px",
              maxWidth: 280,
            }}
          >
            {f.tagline}
          </p>
          <div
            style={{
              font: "600 var(--t-micro)/1.8 var(--brand-font-body)",
              letterSpacing: ".13em",
              textTransform: "uppercase",
              /* --brand-faint-dark, not --brand-muted-brown. The legal bar at
                 the foot of this same file already made this exact swap and
                 says why: muted-brown measures 3.01:1 on --brand-ink-black,
                 under AA for 11px text. This block is the same 11px on the
                 same ground and was left behind – 5.64:1 now. */
              color: "var(--brand-faint-dark)",
            }}
          >
            {f.org}
            <br />
            {f.faculty}
          </div>
        </div>

        {/* The two columns say what the top bar says, and nothing else.

            «Суди та інстанції» and «Документи» carried no href – they were
            labels for pages that do not exist, and a reader who pressed them
            got nothing at all. «Блог» was the third of them. The blog exists
            now, and it is listed only on a build where the page does – once a
            post is published in this language.
            A footer is a map of the site; entries that lead nowhere make it a
            map of a different one. */}
        {column(f.colArchive, [
          { label: f.linkRegistry, href: `/${locale}/registry` },
          { label: f.linkMap, href: `/${locale}/map` },
        ])}
        {column(f.colCenter, [
          { label: f.linkAbout, href: `/${locale}/about` },
          { label: f.linkTeam, href: `/${locale}/team` },
          ...(blogEnabled(locale) ? [{ label: f.linkBlog, href: `/${locale}/blog` }] : []),
        ])}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={colHead}>{f.colContacts}</div>
          {/* The one contact control in the footer, and it used to be
              indistinguishable from the postal address directly under it –
              same size, same --brand-muted-dark, no underline, so the column
              read as two lines of information and neither looked clickable.
              It takes --brand-gold-pale and a rule now: 14.98:1 on the footer
              ground (the muted colour was 9.77:1, so this is brighter as well
              as identifiable), 24px of target height, and the underline says
              "link" without a pill, which would be wrong inside a column of
              links. */}
          <a href={`mailto:${f.email}`} style={footMail}>
            {f.email}
          </a>
          {/* The support ask – the same control the top bar carries, because
              one ask shown two ways is two asks as far as a reader is
              concerned. It was an underlined link here and a chip up there,
              with two different labels besides; it is `.nsv-support` in both
              places now, on one string. */}
          <a
            className="nsv-support nsv-support-foot"
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {f.support}
          </a>
          <span style={footLink}>{f.address}</span>
          {/* Social boxes return when there are real accounts to point at.
              Three squares linking to "#" read as a broken footer. */}
        </div>
      </footer>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "16px 0 20px",
          borderTop: "1px solid rgba(243,232,226,.1)",
          flexWrap: "wrap",
        }}
      >
        {/* --brand-muted-brown is 3.01:1 on this ground – under AA at 11px, so
            the whole legal bar reads in --brand-faint-dark (4.62:1) instead. */}
        <span style={{ fontSize: "var(--t-micro)", color: "var(--brand-faint-dark)" }}>{f.rights}</span>
        <span style={{ display: "flex", gap: 18 }}>
          <Link href={`/${locale}/privacy`} style={legalLink}>
            {f.privacy}
          </Link>
          <Link href={`/${locale}/terms`} style={legalLink}>
            {f.terms}
          </Link>
        </span>
      </div>
    </div>
  );
}
