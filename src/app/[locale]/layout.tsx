import { CENTRE_URL } from "@/content/centre";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  isLocale,
  locales,
  localeHtmlLang,
  defaultLocale,
} from "@/i18n/config";
import { IBM_Plex_Mono, Charis_SIL, Fira_Sans } from "next/font/google";
import { getDictionary } from "@/i18n/dictionaries";
import { homeMetadata } from "@/lib/seo";
import { blogEnabled, blogMissingPaths } from "@/content/blog";
import { CF_BEACON_SRC, cfBeaconConfig } from "@/lib/analytics";
import Header from "@/components/nasvitlo/Header";
import { headerDict } from "@/components/nasvitlo/header-dict";
import Footer from "@/components/nasvitlo/Footer";
// Only cross-surface primitives load for every page. home.css is the home
// page's own stylesheet and is imported there – loading it here put 399
// unscoped rules on the registry and decision pages too.
import "../globals.css";
import "./shared.css";

/**
 * Brand faces, self-hosted by next/font so they are preloaded and shipped with
 * metric-matched fallbacks – no flash of a different face on load (the old
 * <link> to fonts.googleapis.com swapped visibly mid-render).
 *
 * Three, not five. Newsreader and Fraunces came with the starter and were
 * still being downloaded by every visitor although nothing read them: they
 * reached globals.css as --font-serif and --font-display, and no rule and no
 * class ever used either.
 */
/**
 * Roman and italic are declared separately because the Google loader emits the
 * cross product of `weight` and `style`, and the cross product was buying
 * faces nothing renders. One call for `["400","700"] × ["normal","italic"]`
 * preloads twelve files; a walk of all 96 prerendered routes in headless
 * Chrome, asking `CSS.getPlatformFontsForNode` which face actually drew each
 * run, found italic Charis on exactly two selectors – `.parties` on the
 * sixteen decision mastheads and `.nsvq-case` in the home pull quote – both
 * at 400. Bold italic drew nothing anywhere: `document.fonts` reported all
 * five of its faces `unloaded` on every page, while three of them were
 * preloaded on all of them. That was 40,608 B of forced download.
 *
 * Two calls for one typeface are safe here because this version of the Google
 * loader names the CSS family after the font – plain `Charis SIL`, no hash –
 * so both calls contribute @font-face rules to the same family and
 * `font-style: italic` still finds the italic ones. That is a property of the
 * loader, not of CSS: style matching happens inside a family and never falls
 * through to the next one, so under a loader that hashed the family names the
 * italic rules would silently render a skewed roman instead. The four rules
 * that go italic name `--brand-font-display-italic` /
 * `--brand-font-body-italic` so the split does not rest on that.
 *
 * The failure mode is quiet either way – a synthetic oblique looks like an
 * italic until you measure it. Setting the same string at both styles gives
 * different advance widths (150.6 against 161.9px for Charis at 16px), so a
 * width that matches the roman is the tell.
 */
const charis = Charis_SIL({
  weight: ["400", "700"],
  style: ["normal"],
  /* latin-ext dropped: measured across every route in both locales,
     the rendered text contains zero characters in U+0100–024F, and the
     subset was preloaded on all 24 pages regardless. cyrillic-ext stays –
     it carries ґ (U+0491), which appears 23 times. Dropping a subset from
     `subsets` only drops the preload; the @font-face survives, so anything
     in that range would still render, just fetched on demand. */
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-charis",
  display: "swap",
});

/* Only 400. The masthead parties line and the pull-quote case name are the
   whole of the italic display type on the site; both inherit their weight. */
const charisItalic = Charis_SIL({
  weight: ["400"],
  style: ["italic"],
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-charis-italic",
  display: "swap",
});

/**
 * Four weights × two styles was twenty-four preloaded files, 306,548 B – the
 * largest single item on every page. All four romans are genuinely used
 * (700 in 102 declarations, 400 in 48, 600 in 47, 500 in 36). The italics are
 * not: across all 96 routes the only italic Fira that draws a glyph is the
 * chronology's context rows at 400 (52 runs, 18 routes) and `.obj-latin` at
 * 500 (16 runs, 6 routes). Italic 600 and 700 are reached only by empty `<i>`
 * elements used as bars, dots and legend swatches – they inherit the style
 * and draw no text – so their six files, 80,052 B, were downloaded on every
 * page to set nothing.
 */
const firaSans = Fira_Sans({
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  /* latin-ext dropped: measured across every route in both locales,
     the rendered text contains zero characters in U+0100–024F, and the
     subset was preloaded on all 24 pages regardless. cyrillic-ext stays –
     it carries ґ (U+0491), which appears 23 times. Dropping a subset from
     `subsets` only drops the preload; the @font-face survives, so anything
     in that range would still render, just fetched on demand. */
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-fira",
  display: "swap",
});

/* 400 for the chronology's context rows, 500 for the Latin objection grounds.
   Nothing on the site sets italic Fira at any other weight. */
const firaSansItalic = Fira_Sans({
  weight: ["400", "500"],
  style: ["italic"],
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-fira-italic",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});


type Params = { params: Promise<{ locale: string }> };

/** Pre-render both locales at build time. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return homeMetadata(locale, dict);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  /**
   * An unknown segment is a 404, but this layout must not be the one to throw
   * it. `/nope` matches `[locale]`, and a notFound() raised in the root layout
   * has no layout left to render in – Next falls back to a bare error document
   * with no `lang`, no fonts and no palette. Every page under this segment
   * already validates the locale, so the throw happens one level down, inside
   * a document this layout has already opened.
   */
  const known = isLocale(locale);
  const safe = known ? locale : defaultLocale;
  const dict = await getDictionary(safe);

  return (
    <html
      /**
       * The root layout, under the [locale] segment – the shape Next documents
       * for internationalisation. It used to sit one level up with `lang`
       * hardcoded to "uk" and a client effect patching it after hydration, so
       * every English page was served declaring Ukrainian to crawlers, to
       * screen readers on first paint, to social unfurlers and to reader
       * modes, none of which run the effect.
       */
      lang={localeHtmlLang[safe]}
      className={`${charis.variable} ${charisItalic.variable} ${firaSans.variable} ${firaSansItalic.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* One header and one footer for the whole locale. Every page used to
            render its own pair, which is how the site ended up with three
            different header grounds and a decision-page skip link that pointed
            somewhere different from every other page. */}
        <div className="nsv-root">
          <Header
            locale={safe}
            dict={headerDict(dict)}
            showBlog={blogEnabled(safe)}
            missingPaths={blogMissingPaths()}
            supportHref={CENTRE_URL}
            supportLabel={dict.footer.support}
          />
          {children}
          <Footer dict={dict} locale={safe} />
        </div>
        {/* Cloudflare Web Analytics – лише коли збірка має
            NEXT_PUBLIC_CF_ANALYTICS_TOKEN (див. lib/analytics.ts). Без
            cookie і без відбитка браузера, тому й без банера згоди.
            Звичайний <script defer>, а не next/script: маячку не потрібен
            React, а `defer` і так не блокує розбір сторінки. CSP дозволяє
            обидва його джерела лише в цій самій збірці
            (lib/security-headers.ts). */}
        {cfBeaconConfig && (
          <script defer src={CF_BEACON_SRC} data-cf-beacon={cfBeaconConfig} />
        )}
      </body>
    </html>
  );
}
