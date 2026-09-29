import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, locales, localeOpenGraph, alternateOpenGraphLocales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pick } from "@/content/types";
import { blogEnabled, postsIn } from "@/content/blog";
import { siteUrl, pathAlternates, ogImage, defaultOgImage } from "@/lib/seo";
import { BLOG_T as T, formatPostDate } from "./blog-shared";
import "./blog.css";

/**
 * The blog's index: every post in this language, newest first.
 *
 * Absent — a 404, left out of the Cloudflare build altogether by
 * `staticPaths` — while there is nothing to list in this language. An empty
 * section that says «coming soon» is a promise a reader checks and finds
 * unkept; the menu, the footer and the sitemap follow the same rule
 * (`blogEnabled`).
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !blogEnabled(locale)) return {};
  const dict = await getDictionary(locale);
  const title = pick(T.title, locale);
  const description = pick(T.metaDesc, locale);
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: `/${locale}/blog`,
      languages: pathAlternates((l) => `/${l}/blog`, blogEnabled),
    },
    openGraph: {
      type: "website",
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: `/${locale}/blog`,
      siteName: dict.brand.wordmark,
      title,
      description,
      images: [ogImage(defaultOgImage, dict.meta.ogAlt)],
    },
    twitter: { card: "summary_large_image", title, description, images: [defaultOgImage] },
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || !blogEnabled(locale)) notFound();
  const L = (x: { uk: string; en: string }) => pick(x, locale as Locale);
  const list = postsIn(locale);

  return (
    <div className="page blogpage">
      <main id="content" tabIndex={-1} className="blog-wrap">
        <header className="blog-mast">
          <Link href={`/${locale}`} className="blog-back">
            {L(T.back)}
          </Link>
          <h1>{L(T.title)}</h1>
        </header>

        {/* A list of entries, not a grid of cards: a post is read for what it
            says, so the title and the first lines carry the row, and the date
            sits above them in the mono face the site keeps for dates. */}
        <ol className="blog-list">
          {list.map((p) => {
            const href = `/${locale}/blog/${p.slug}`;
            const author = p.author?.[locale];
            return (
              <li key={p.slug} className="blog-item">
                <p className="blog-meta">
                  <time dateTime={p.date}>{formatPostDate(p.date, locale)}</time>
                  {author ? <span> · {author}</span> : null}
                </p>
                <h2 className="blog-item-title">
                  <Link href={href}>{p.title[locale]}</Link>
                </h2>
                {p.excerpt?.[locale] ? <p className="blog-excerpt">{p.excerpt[locale]}</p> : null}
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
