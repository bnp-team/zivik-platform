import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isLocale, localeOpenGraph, alternateOpenGraphLocales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pick } from "@/content/types";
import { blogPosts, postBySlug, postHasLocale } from "@/content/blog";
import { SUMMARIES } from "@/content/summaries";
import { siteUrl, pathAlternates, ogImage, defaultOgImage, jsonLdHtml } from "@/lib/seo";
import { BLOG_T as T, formatPostDate } from "../blog-shared";
import "../blog.css";

/**
 * One post. Only in the languages it was written in — see `postHasLocale`:
 * a post the editors wrote in Ukrainian alone has no /en page rather than an
 * English page with an empty title.
 */
export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

type Params = Promise<{ locale: string; slug: string }>;

async function resolve(params: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return null;
  const post = postBySlug(slug);
  if (!post || !postHasLocale(post, locale)) return null;
  return { locale, post };
}

/** The cover as an absolute URL for a share card, or the site card. */
function coverUrl(cover: string | undefined): string {
  return cover ? cover : defaultOgImage;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return {};
  const { locale, post } = r;
  const dict = await getDictionary(locale);
  const title = post.title[locale];
  const description = post.excerpt?.[locale] ?? "";
  const path = `/${locale}/blog/${post.slug}`;
  const image = coverUrl(post.cover);
  const alt = post.cover ? (post.coverAlt?.[locale] ?? title) : dict.meta.ogAlt;
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: path,
      languages: pathAlternates((l) => `/${l}/blog/${post.slug}`, (l) => postHasLocale(post, l)),
    },
    openGraph: {
      type: "article",
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: path,
      siteName: dict.brand.wordmark,
      title,
      description,
      publishedTime: post.date,
      ...(post.author?.[locale] ? { authors: [post.author[locale]] } : {}),
      ...(post.tags?.length ? { tags: post.tags } : {}),
      /* A cover is whatever size the editor uploaded, so it is not declared
         1200x630 the way the drawn cards are. */
      images: post.cover ? [{ url: image, alt }] : [ogImage(defaultOgImage, alt)],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BlogPost({ params }: { params: Params }) {
  const r = await resolve(params);
  if (!r) notFound();
  const { locale, post } = r;
  const dict = await getDictionary(locale);
  const L = (x: { uk: string; en: string }) => pick(x, locale as Locale);

  const title = post.title[locale];
  const author = post.author?.[locale];
  const excerpt = post.excerpt?.[locale];
  const body = post.body[locale].filter((x) => x.trim());
  const tags = (post.tags ?? []).map((t) => t.trim()).filter(Boolean);
  /* A slug that names no summary is dropped rather than linked: a related
     link to a 404 is worse than none. The admin cannot check it — the
     summaries are not loaded there — so the page does. */
  const related = (post.relatedCases ?? [])
    .map((s) => s.trim())
    .filter((s) => Object.hasOwn(SUMMARIES, s))
    .map((s) => ({ slug: s, summary: SUMMARIES[s] }));

  const pageUrl = `${siteUrl}/${locale}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#post`,
        headline: title,
        ...(excerpt ? { description: excerpt } : {}),
        inLanguage: locale,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        datePublished: post.date,
        image: `${siteUrl}${coverUrl(post.cover)}`,
        author: author
          ? { "@type": "Person", name: author }
          : { "@type": "Organization", name: dict.footer.org, url: `${siteUrl}/${locale}/about` },
        publisher: { "@type": "Organization", name: dict.footer.org, url: `${siteUrl}/${locale}` },
        ...(tags.length ? { keywords: tags.join(", ") } : {}),
        ...(related.length
          ? { mentions: related.map((x) => ({ "@type": "Article", url: `${siteUrl}/${locale}/cases/${x.slug}` })) }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: dict.brand.wordmark, item: `${siteUrl}/${locale}` },
          { "@type": "ListItem", position: 2, name: L(T.title), item: `${siteUrl}/${locale}/blog` },
          { "@type": "ListItem", position: 3, name: title },
        ],
      },
    ],
  };

  return (
    <div className="page blogpage">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(jsonLd)} />
      <main id="content" tabIndex={-1} className="blog-wrap">
        <article className="post">
          <header className="post-mast">
            <Link href={`/${locale}/blog`} className="blog-back">
              {L(T.toBlog)}
            </Link>
            <p className="blog-meta">
              <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time>
              {author ? <span> · {author}</span> : null}
            </p>
            <h1>{title}</h1>
            {excerpt ? <p className="post-lede">{excerpt}</p> : null}
          </header>

          {post.cover ? (
            <figure className="post-cover">
              <Image
                src={post.cover}
                alt={post.coverAlt?.[locale] ?? ""}
                width={1600}
                height={900}
                sizes="(max-width: 900px) 100vw, 900px"
                priority
              />
            </figure>
          ) : null}

          <div className="post-body">
            {body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {tags.length ? (
            <div className="post-tags">
              <h2 className="post-label">{L(T.tags)}</h2>
              <ul>
                {tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {related.length ? (
            <section className="post-related" aria-labelledby="post-related-h">
              <h2 id="post-related-h" className="post-label">
                {L(T.related)}
              </h2>
              <ul>
                {related.map(({ slug, summary }) => {
                  /* The full caption, not the short search title: this list is
                     read by lawyers on the site, and on the site the case keeps
                     its full name. */
                  const name = summary.title ? pick(summary.title, locale) : summary.masthead.parties;
                  return (
                    <li key={slug}>
                      <Link href={`/${locale}/cases/${slug}`}>
                        <span className="post-related-court">
                          {pick(summary.judgment.court, locale)} ·{" "}
                          <time dateTime={summary.judgment.date}>
                            {/^\d{4}-\d{2}-\d{2}$/.test(summary.judgment.date)
                              ? formatPostDate(summary.judgment.date, locale)
                              : summary.judgment.date}
                          </time>
                        </span>
                        <span className="post-related-name">{name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
    </div>
  );
}
