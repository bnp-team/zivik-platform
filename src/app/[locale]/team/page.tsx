import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Crumbs from "@/components/nasvitlo/Crumbs";
import Image from "next/image";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pick } from "@/content/types";
import {
  siteUrl,
  pathAlternates,
  ogImage,
  defaultOgImage,
} from "@/lib/seo";
import { localeOpenGraph, alternateOpenGraphLocales } from "@/i18n/config";
import { team } from "@/content/team";
import "./team.css";

const T = {
  back: { uk: "На головну", en: "Home" },
  title: { uk: "Команда", en: "Team" },
  /* No lede. It said who runs the project – which the footer says on this
     page and on every other one, under the wordmark. A page that opens by
     repeating its own footer has spent its first line on nothing.

     The description a search result and a link preview need is separate, and
     is written for that job: it says what this page lists rather than who the
     library belongs to. */
  metaDesc: {
    uk: "Дослідники, редактори й технічна команда бібліотеки рішень «насвітло».",
    en: "The researchers, editors and technical team behind the nasvitlo library of decisions.",
  },
  contact: { uk: "Написати нам", en: "Write to us" },
  contactH: { uk: "Написати нам", en: "Write to us" },
  /* Says what writing is *for*. The same invitation /about already makes, in
     the same words, so the two pages do not offer a reader two different
     reasons to use one address. */
  contactText: {
    uk: "Помітили помилку в огляді або знаєте про провадження, якого тут немає – напишіть.",
    en: "If you have spotted an error in a summary, or know of a proceeding that is missing, write to us.",
  },
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
  const title = pick(T.title, locale);
  const description = pick(T.metaDesc, locale);
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: `/${locale}/team`,
      languages: pathAlternates((l) => `/${l}/team`),
    },
    openGraph: {
      type: "website",
      // Open Graph wants language_TERRITORY; a bare "uk" is ignored.
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: `/${locale}/team`,
      siteName: dict.brand.wordmark,
      title,
      description,
      images: [ogImage(defaultOgImage, dict.meta.ogAlt)],
    },
    // A page that sets openGraph and no twitter inherits the layout's card –
    // so this page used to share as the home page, title, text and image.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const L = (x: { uk: string; en: string }) => pick(x, locale as Locale);

  return (
    <div className="page teampage">

      <main id="content" tabIndex={-1} className="team-wrap">
        <header className="team-mast">
          <Crumbs locale={locale as Locale} linkClass="team-back" here={L(T.title)} />
          <h1>{L(T.title)}</h1>
        </header>

        {/* A grid, not a line-per-person list: the portraits are half-body
            photographs, so they need room to be legible. Everyone gets the
            same square cell whether or not their photograph has arrived. */}
        <ul className="team-grid">
          {team.map((m) => {
            const name = L(m.name);
            return (
              <li key={m.name.en}>
                <div className="team-frame">
                  {m.photo ? (
                    <Image
                      className="team-photo"
                      src={m.photo}
                      alt=""
                      width={900}
                      height={900}
                      sizes="(max-width: 560px) 90vw, (max-width: 900px) 44vw, 280px"
                    />
                  ) : (
                    /* Not a silhouette. Initials in the display face keep the
                       grid even while the remaining photographs arrive, and
                       they say who is missing rather than drawing a stranger. */
                    <span className="team-initials" aria-hidden="true">
                      {name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  )}
                </div>
                <span className="team-name">{name}</span>
                <span className="team-role">{L(m.role)}</span>
              </li>
            );
          })}
        </ul>

        {/* «НАПИСАТИ НАМ →» used to be an 11px uppercase gold text link
            floating under the last portrait, with nothing about it saying it
            was a control. It is the shared CTA pill now – see `.nsv-cta` in
            [locale]/shared.css for the measured colours – and it carries a
            sentence, because a button with no context under a grid of faces
            is still a button nobody presses. */}
        <section className="team-contact">
          <h2>{L(T.contactH)}</h2>
          <p>{L(T.contactText)}</p>
          {/* «Написати нам», the same label /about's pill carries – owner's
              decision, reverting the address-as-label both pages tried. */}
          <a className="nsv-cta" href={`mailto:${dict.footer.email}`}>
            {L(T.contact)}
          </a>
        </section>
      </main>
    </div>
  );
}
