import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Crumbs from "@/components/nasvitlo/Crumbs";
import {
  alternateOpenGraphLocales,
  isLocale,
  locales,
  localeOpenGraph,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pick } from "@/content/types";
import {
  defaultOgImage,
  ogImage,
  pathAlternates,
  siteUrl,
} from "@/lib/seo";
import { privacy, revisionOf } from "@/content/legal";
import "../legal.css";
import { txt } from "@/lib/ui-texts";

/** Page chrome. The document itself lives in `src/content/legal.ts`. */
const T = {
  revised: txt("privacy.revised", { uk: "Редакція від", en: "Revised" }),
  also: txt("privacy.also", { uk: "Як користуватися матеріалами Сайту й на яких умовах – про це", en: "How the Site’s materials may be used, and on what terms –" }),
  terms: txt("privacy.terms", { uk: "Умови користування", en: "Terms of use" }),
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const path = `/${locale}/privacy`;
  const title = pick(privacy.title, locale);
  const description = pick(privacy.lede, locale);
  /* openGraph and twitter are replaced wholesale, not merged, by the nearest
     generateMetadata that sets them – so both blocks are complete here, as on
     /registry and /team, rather than inheriting the home page's card. */
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: path,
      languages: pathAlternates((l) => `/${l}/privacy`),
    },
    openGraph: {
      type: "website",
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: path,
      siteName: dict.brand.wordmark,
      title,
      description,
      images: [ogImage(defaultOgImage, dict.meta.ogAlt)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  return (
    <div className="page legalpage">
      <main id="content" tabIndex={-1} className="legal-wrap">
        <header className="legal-mast">
          <Crumbs locale={locale as Locale} linkClass="legal-back" here={pick(privacy.title, locale)} />
          <h1>{pick(privacy.title, locale)}</h1>
          <p className="legal-lede">{pick(privacy.lede, locale)}</p>
          <p className="legal-revised">
            {pick(T.revised, locale)}{" "}
            <time dateTime={revisionOf(privacy).iso}>{pick(revisionOf(privacy).human, locale)}</time>
          </p>
        </header>

        <div className="legal-doc">
          {privacy.sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-sec">
              <h2>{pick(section.heading, locale)}</h2>
              {section.blocks.map((block, i) =>
                block.kind === "ul" ? (
                  <ul key={i}>
                    {pick(block.items, locale).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>
                    {pick(block.text, locale)}
                    {block.link ? (
                      <>
                        {" "}
                        <Link
                          className="legal-jump"
                          href={`/${locale}/${block.link.to}`}
                        >
                          {pick(block.link.label, locale)}
                        </Link>
                      </>
                    ) : null}
                  </p>
                ),
              )}
            </section>
          ))}
        </div>

        <p className="legal-foot">
          {pick(T.also, locale)}{" "}
          <Link href={`/${locale}/terms`}>{pick(T.terms, locale)}</Link>
        </p>
      </main>
    </div>
  );
}
