import type { Metadata } from "next";
import Link from "next/link";
import { defaultLocale, locales } from "@/i18n/config";

/**
 * 404 for the whole site.
 *
 * Bilingual rather than locale-detecting, and deliberately so. Root
 * `not-found.tsx` gets no params, and it is prerendered once – so reading the
 * path on the client would ship Ukrainian HTML to an English reader and swap
 * it after hydration. Showing both is correct for everyone at first paint,
 * needs no JavaScript, and costs four extra lines of text.
 *
 * Styled from the --brand-* tokens directly: this renders outside every
 * surface's own stylesheet, including when the failure is a route that never
 * matched anything.
 */
/**
 * The root 404 – unmatched URLs that never reach a locale.
 *
 * Without this it inherits the root layout's fallback title and description, so
 * the two 404s on this site announced themselves differently: the localized one
 * (src/app/[locale]/not-found.tsx) says it is a 404, this one said "насвітло".
 * Neither should be indexed and neither should claim to be a page that exists.
 */
export const metadata: Metadata = {
  title: "Сторінку не знайдено · Page not found",
  robots: { index: false, follow: false },
  alternates: null,
  openGraph: null,
  twitter: null,
};

const link: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  font: "700 11px var(--brand-font-body)",
  letterSpacing: ".07em",
  textTransform: "uppercase",
  padding: "13px 22px",
  textDecoration: "none",
  // Buttons are pills (DESIGN.md, shape table), like every other on the site.
  borderRadius: "var(--r-pill)",
};

const T = {
  uk: {
    heading: "Такої сторінки немає",
    body: "Можливо, посилання застаріле або в адресі є помилка. У бібліотеці – повний перелік проваджень, які ми ведемо.",
    registry: "Бібліотека рішень",
    home: "На головну",
  },
  en: {
    heading: "There is no such page",
    body: "The link may be out of date, or the address may have a typo. The library lists every proceeding we track.",
    registry: "Library of decisions",
    home: "Home",
  },
} as const;

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 28,
        padding: "clamp(32px, 8vw, 96px)",
        background: "var(--brand-night)",
        color: "var(--brand-cream)",
        fontFamily: "var(--brand-font-body), sans-serif",
      }}
    >
      <span
        style={{
          font: "500 12.5px var(--brand-font-mono)",
          letterSpacing: ".14em",
          color: "var(--brand-gold-lit)",
        }}
      >
        404
      </span>

      {locales.map((locale) => {
        const t = T[locale];
        const primary = locale === defaultLocale;
        /* One heading per page. The second language says the same thing
           smaller, so it is the first one's translation, not a second
           title – a paragraph, marked with its own lang. */
        const Heading = primary ? "h1" : "p";
        return (
          <div
            key={locale}
            lang={locale}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Heading
              style={{
                fontFamily: "var(--brand-font-display), Georgia, serif",
                fontWeight: 400,
                fontSize: primary ? "clamp(30px, 6vw, 52px)" : "clamp(21px, 3.6vw, 30px)",
                lineHeight: 1.12,
                margin: 0,
                maxWidth: "18ch",
                color: primary ? "var(--brand-cream)" : "var(--brand-muted-dark)",
                textWrap: "balance",
              }}
            >
              {t.heading}
            </Heading>
            <p
              style={{
                fontSize: primary ? 16 : 14,
                lineHeight: 1.6,
                color: primary ? "var(--brand-muted-dark)" : "var(--brand-faint-dark)",
                margin: 0,
                maxWidth: "52ch",
              }}
            >
              {t.body}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 2 }}>
              <Link
                href={`/${locale}/registry`}
                style={{
                  ...link,
                  background: primary ? "var(--brand-cherry)" : "transparent",
                  color: primary ? "var(--brand-cream-warm)" : "var(--brand-gold-pale)",
                  border: primary ? 0 : "2px solid color-mix(in srgb, var(--brand-gold-pale) 35%, transparent)",
                }}
              >
                {t.registry}
              </Link>
              <Link
                href={`/${locale}`}
                style={{
                  ...link,
                  border: "2px solid color-mix(in srgb, var(--brand-gold-pale) 50%, transparent)",
                  color: "var(--brand-gold-pale)",
                }}
              >
                {t.home}
              </Link>
            </div>
          </div>
        );
      })}
    </main>
  );
}
