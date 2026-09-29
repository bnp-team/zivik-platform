import type { Metadata } from "next";
import {
  alternateOpenGraphLocales,
  defaultLocale,
  localeOpenGraph,
  locales,
  type Locale,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import caseCards from "../../public/og/cases/manifest.json";

/**
 * Absolute site origin, used for canonical URLs, Open Graph and the sitemap.
 * Explicit NEXT_PUBLIC_SITE_URL wins; on Vercel the project's production
 * domain is the default, so canonicals never leak localhost into production.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * Whether this deployment may be indexed by search engines.
 *
 * Defaults to NO. The archive is still filling – 8 of 39 proceedings have a
 * summary – and a half-built version of a legal reference sits in Google's
 * catalogue for months after you fix it. Set SITE_INDEXABLE=true in the Vercel
 * project when the site is ready to be found.
 *
 * Note the mechanism: robots.txt keeps *allowing* the crawl even while this is
 * false, and the noindex is carried by a header and a meta tag instead.
 * Disallowing would be the intuitive move and the wrong one – a blocked
 * crawler cannot read the noindex, so Google may still list the bare URL it
 * found linked somewhere else.
 */
export const isIndexable = process.env.SITE_INDEXABLE === "true";

/**
 * The `robots` metadata field while the archive is closed.
 *
 * The comment above says the noindex is carried "by a header and a meta tag";
 * only the header existed – `curl <siteUrl>/uk | grep
 * 'name="robots"'` came back empty on every route. One header, set in
 * `next.config.ts`, was the whole defence. That is one misconfiguration away
 * from an indexed half-built archive: a header is a property of how the file
 * is served, so it is lost the moment a page is fetched and re-served by
 * anything else – a preview proxy, a mirror, an AMP-style cache, a
 * `wget -r` someone hosts. The meta tag travels inside the document.
 *
 * Undefined once SITE_INDEXABLE=true, so the resolved metadata simply has no
 * robots directive and the default (index, follow) applies.
 *
 * Set on `homeMetadata`, which the `[locale]` layout returns, so every page
 * under it inherits the tag – no page overrides `robots`.
 */
export const robotsMetadata: Metadata["robots"] = isIndexable
  ? undefined
  : { index: false, follow: false };

/**
 * Підтвердження власності в Google Search Console – мета-тегом.
 *
 * Search Console пропонує два способи: запис TXT у DNS або
 * `<meta name="google-site-verification" content="…">` на головній. DNS
 * кращий (підтверджує весь домен разом із піддоменами), але потребує
 * доступу до DNS-зони, якого в редакції може не бути. Тоді – цей: код із
 * Search Console кладеться у змінну збірки GOOGLE_SITE_VERIFICATION, і тег
 * з'являється на кожній сторінці (його несе `homeMetadata`, яку успадковують
 * усі). Без змінної поля немає зовсім – порожній тег Google не прийме.
 *
 * Прапорець збірки, як SITE_INDEXABLE: Next вбудовує його під час
 * пререндеру, збірка для Cloudflare – через `define` в astro.config.mjs, а тег
 * там рендерить `site/lib/metadata.ts`. Див. docs/LAUNCH.md.
 */
const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;

export const verificationMetadata: Metadata["verification"] =
  googleSiteVerification ? { google: googleSiteVerification } : undefined;

/**
 * Serialise a JSON-LD graph for a `<script type="application/ld+json">` body.
 *
 * `JSON.stringify` alone is not safe here and both call sites used it. A
 * `<script>` element's content is *raw text*: the parser scans it for `</`
 * and for `<!--`, not for JSON syntax. So a string anywhere in the graph that
 * contains `</script>` closes the element early and everything after it is
 * parsed as markup – a case title, a party name or an FAQ answer quoting a
 * document is all it would take. Nothing in `src/content/` contains one today
 * (checked), so this is a latent defect rather than a live hole, but the graph
 * is built from free-text editorial fields and the next contributor has no
 * reason to know that a `<` in a title is dangerous.
 *
 * Escaping `<` is sufficient and minimal: it is the first character of both
 * `</script` and `<!--`, and `<` is the same character to a JSON parser.
 * U+2028/U+2029 go too – legal in JSON strings, but line terminators to the
 * JS parsers some consumers still run `ld+json` through.
 */
export function jsonLdHtml(graph: unknown): { __html: string } {
  return {
    __html: JSON.stringify(graph).replace(
      /[<\u2028\u2029]/g,
      (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
    ),
  };
}

/** A search snippet is cut off around here. */
export const META_MAX = 160;

/**
 * Нижня межа, під якою опис уже не «короткий», а порожній.
 *
 * Аудит виміряв: /en/cases/oschadbank віддавав у пошук 43 символи – «Oschadbank
 * is Ukraine's state savings bank.» – бо `shortDescription` брав тільки перше
 * речення tldr; сторінки справ без огляду (pca-31, nl-33) – 46–52 символи
 * службових позначок. Сніпет такої довжини пошуковик переписує сам, з
 * будь-якого шматка сторінки. 110 – це нижче за найкоротший авторський
 * `metaDesc` в архіві (132), тож жоден написаний руками опис ця межа не
 * зачіпає.
 */
export const META_MIN = 110;

/**
 * Cut a string to at most `max` characters at a word boundary, with a visible
 * ellipsis – never the engine's silent one, never mid-word.
 */
export function cutAtWord(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  /* Trailing punctuation off before the ellipsis: «…Russia,…» reads as a typo. */
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:––-]+$/u, "")}…`;
}

/**
 * Split prose into sentences without breaking a number or an abbreviation.
 *
 * A bare `/[.!?]/` split cut «USD 1.1 billion» after «1.» and «Ukraine v.
 * Russia» after «v.», both of which are in the archive's plain-language text.
 * So a boundary is terminal punctuation followed by whitespace and a capital,
 * a digit or an opening quote; and a boundary right after a short
 * lower-case token («v.», «al.», «ст.», «п.») is taken back.
 */
export function splitSentences(text: string): string[] {
  const parts = text
    .trim()
    .split(/(?<=[.!?…])\s+(?=[«"“'\p{Lu}\d])/u)
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const prev = out[out.length - 1];
    if (prev && /(?:^|\s)(?:v|vs|al|No|nos|Art|art|p|pp|ст|п|ч|р|див)\.$/u.test(prev)) {
      out[out.length - 1] = `${prev} ${p}`;
    } else {
      out.push(p);
    }
  }
  return out;
}

/**
 * A search description built from prose: whole sentences from the start while
 * they fit under `META_MAX`; and if that leaves it under `META_MIN`, the next
 * sentence is carried on to the limit and cut at a word. Nothing is reordered
 * and nothing is added – the text is the author's, only shortened.
 */
export function descriptionFromProse(text: string): string {
  const sentences = splitSentences(text);
  let out = "";
  let i = 0;
  for (; i < sentences.length; i++) {
    const next = out ? `${out} ${sentences[i]}` : sentences[i];
    if (next.length > META_MAX) break;
    out = next;
  }
  if (out.length >= META_MIN || i >= sentences.length) return out || cutAtWord(text, META_MAX);
  /* The sentence that did not fit, carried on as far as the limit allows. */
  const room = META_MAX - (out ? out.length + 1 : 0);
  /* A few words and an ellipsis say less than the full stop before them. */
  if (out && room < 40) return out;
  const tail = cutAtWord(sentences[i], room);
  return out ? `${out} ${tail}` : tail;
}

/** The site-wide share card, used by every page that has no card of its own. */
export const defaultOgImage = "/og/nasvitlo.png";

/**
 * A decision's own share card, or the site card where it has none.
 *
 * The cards are drawn at build time by scripts/og-cards.mts, which lists in
 * public/og/cases/manifest.json every slug whose card it has on disk. The
 * page used to point at `/og/cases/${slug}.png` unconditionally, so a summary
 * made in the admin – which no one had drawn a card for – unfurled with a
 * broken image. Reading the list instead of the directory keeps this free of
 * `fs`: it runs the same in the Next build, the Astro prerender and a Worker.
 */
export function caseOgImage(slug: string): string {
  return Object.hasOwn(caseCards.cards, slug) ? `/og/cases/${slug}.png` : defaultOgImage;
}

/**
 * Real pixel size of the share cards in `public/og/` – every one is exactly
 * 1200x630: the site card, and the case cards `scripts/og-cards.mts` draws at
 * this size.
 *
 * These are worth emitting: without og:image:width/height a crawler has to
 * fetch the image before it can decide how to lay the card out, so the first
 * unfurl of a link – the one the reader sees – often falls back to the small
 * square thumbnail. 1200x630 is also what tells Twitter/X the card really is
 * `summary_large_image`.
 */
export const ogImageSize = { width: 1200, height: 630 } as const;

/** An Open Graph image descriptor carrying the card's true dimensions. */
export function ogImage(url: string, alt: string) {
  return {
    url,
    alt,
    width: ogImageSize.width,
    height: ogImageSize.height,
    type: "image/png",
  };
}

/** `hreflang` map pointing each locale at its localized home, plus x-default. */
function languageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = `/${locale}`;
  languages["x-default"] = `/${defaultLocale}`;
  return languages;
}

/** Metadata for the localized home page: title, description, OG, hreflang. */
export function homeMetadata(locale: Locale, dict: Dictionary): Metadata {
  const { title, description, ogAlt } = dict.meta;
  const path = `/${locale}`;
  return {
    metadataBase: new URL(siteUrl),
    /* Pages under the layout read «Команда – НаСвітло», not a bare «Team»:
       a tab, a bookmark and a search result all show this string, and a
       four-letter title says nothing about whose team it is. The decision
       pages opt out with `absolute` – their titles already carry the court
       and run long enough. */
    title: { default: title, template: `%s – ${dict.brand.wordmark}` },
    description,
    // Inherited by every page under the [locale] layout – none of them set
    // `robots`, so this one tag closes the whole tree until launch.
    robots: robotsMetadata,
    // Search Console; undefined – і тега немає – без GOOGLE_SITE_VERIFICATION.
    verification: verificationMetadata,
    alternates: {
      canonical: path,
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: path,
      siteName: dict.brand.wordmark,
      title,
      description,
      images: [ogImage(defaultOgImage, ogAlt)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

/**
 * `hreflang` map for a page at the same path in every locale – or, with
 * `exists`, only in the locales that have it. A blog post written only in
 * Ukrainian has no /en page, and hreflang pointing at a 404 tells a crawler
 * the pair is broken. x-default then falls to the first locale that exists.
 */
export function pathAlternates(
  path: (locale: Locale) => string,
  exists: (locale: Locale) => boolean = () => true,
) {
  const languages: Record<string, string> = {};
  const present = locales.filter(exists);
  for (const locale of present) languages[locale] = path(locale);
  const fallback = present.includes(defaultLocale) ? defaultLocale : present[0];
  if (fallback) languages["x-default"] = path(fallback);
  return languages;
}

/** Metadata for a decision page. */
export function decisionMetadata({
  locale,
  slug,
  title,
  description,
  ogAlt,
  siteName,
  image,
}: {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  ogAlt: string;
  siteName: string;
  /** Case-specific share card; falls back to the site card. */
  image?: string;
}): Metadata {
  const path = `/${locale}/cases/${slug}`;
  const og = image ?? defaultOgImage;
  return {
    metadataBase: new URL(siteUrl),
    title: { absolute: title },
    description,
    // Redundant with the layout's inherited value, and deliberately so: the
    // decision pages are the ones that must not be indexed half-finished.
    robots: robotsMetadata,
    alternates: {
      canonical: path,
      languages: pathAlternates((l) => `/${l}/cases/${slug}`),
    },
    openGraph: {
      type: "article",
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: path,
      siteName,
      title,
      description,
      images: [ogImage(og, ogAlt)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}
