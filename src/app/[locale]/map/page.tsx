import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Crumbs from "@/components/nasvitlo/Crumbs";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  siteUrl,
  pathAlternates,
  ogImage,
  defaultOgImage,
  descriptionFromProse,
} from "@/lib/seo";
import { localeOpenGraph, alternateOpenGraphLocales } from "@/i18n/config";
import { pick } from "@/content/types";
import { MAP_COURTS, MAP_PLACES, courtMarks, seatsLine } from "@/content/map";
import { countryPanelsFor, courtCaseloadFor, seatRows } from "@/content/map-links";
import EventsMap from "@/components/nasvitlo/EventsMap";
import "./map-page.css";

/**
 * The map on its own page.
 *
 * On the home page the map is one band among a dozen and gets the height a
 * band can spare. Here it has the viewport: the same component, the same data,
 * no second implementation to keep in step.
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
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = dict.mapSection.pageTitle;
  /* The lede under the heading, fitted to a search snippet: the English one
     runs 178 characters, and a description over 160 is cut off mid-word in
     the results (the functional tests caught it, tests/e2e/pages.spec.ts). */
  const description = descriptionFromProse(dict.mapSection.pageLede);
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: `/${locale}/map`,
      languages: pathAlternates((l) => `/${l}/map`),
    },
    openGraph: {
      type: "website",
      // Open Graph wants language_TERRITORY; a bare "uk" is ignored.
      locale: localeOpenGraph[locale],
      alternateLocale: alternateOpenGraphLocales(locale),
      url: `/${locale}/map`,
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

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);


/**
 * The registry's stage key as the word the registry uses for it.
 *
 * Resolved here rather than in `map-links.ts`: the labels live in the
 * dictionary and this is the surface that already has one. A key the
 * dictionary does not carry is dropped rather than printed raw.
 */
const stageWord = (k: string | undefined) =>
  k && k in dict.registry.stage
    ? (dict.registry.stage as Record<string, string>)[k]
    : undefined;

  return (
    <div className="page mappage">

      <main id="content" tabIndex={-1}>
        {/* The masthead rides over the drawing rather than pushing it down the
            page: this is the map's own page, so the map gets the viewport. */}
        <div className="mp-stage">
          <header className="mp-mast">
            <Crumbs locale={locale} linkClass="mp-back" here={dict.nav.map} />
            {/* The same heading the home band carries, at the user's request:
                one map, one title. The label rule above it comes with it – this
                page had its own wording for the same object. */}
            <div className="lbl">
              <span>{dict.mapSection.label}</span>
            </div>
            <h1>{dict.mapSection.heading}</h1>
            <p className="mp-lede">{dict.mapSection.pageLede}</p>
            {/* No scope line here either – see the note in MapSection. */}
          </header>

          <EventsMap
            /* Geometry is the component's own import, not a prop: as a prop it
               travelled in this page's flight payload as well as in the markup
               it renders. See the note above `geo` in EventsMap.tsx. */
            countries={countryPanelsFor(locale)}
            places={MAP_PLACES.map((p) => ({ key: p.key, city: pick(p.city, locale) }))}
            courts={MAP_COURTS.map((c) => ({
              key: c.key,
              city: pick(c.city, locale),
              offMap: c.offMap,
              labelDy: c.labelDy,
              caseload: (() => {
              const cl = courtCaseloadFor(c.key, locale);
              return {
                ...cl,
                written: cl.written.map((w) => ({ ...w, stage: stageWord(w.stage) })),
                listed: cl.listed.map((l) => ({ ...l, stage: stageWord(l.stage) })),
              };
            })(),
            seats: seatsLine(c, locale),
            seatList: seatRows(c.key, locale),
            at: pick(c.at, locale),
            ...courtMarks(c, locale),
            }))}
            labels={{
              alt: dict.mapSection.heading,
              close: dict.mapSection.close,
            moveCard: dict.mapSection.moveCard,
              courtsSeat: dict.mapSection.courtsSeat,
              court: dict.mapSection.legendCourt,
              legendLit: dict.mapSection.legendLit,
              legendUnlit: dict.mapSection.legendUnlit,
              reads: dict.mapSection.reads,
            writtenOf: dict.mapSection.writtenOf,
            writtenBehind: dict.mapSection.writtenBehind,
            allInRegistry: dict.mapSection.allInRegistry,
              pending: dict.mapSection.pending,
            amountLabel: dict.mapSection.amountLabel,
              legendTitle: dict.mapSection.legendTitle,
            placesTitle: dict.mapSection.placesTitle,
            legendWhat: dict.mapSection.legendWhat,
              legendHow: dict.mapSection.legendHow,
              legendLine: dict.mapSection.legendLine,
            legendForum: dict.mapSection.legendForum,
            legendOffMap: dict.mapSection.legendOffMap,
            legendRegions: dict.mapSection.legendRegions,
            legendArea: dict.mapSection.legendArea,
            legendPick: dict.mapSection.legendPick,
            courtHears: dict.mapSection.courtHears,
            inLibrary: dict.mapSection.inLibrary,
            caseload: dict.mapSection.caseload,
            seatsTotal: dict.mapSection.seatsTotal,
            seatsNational: dict.mapSection.seatsNational,
            seatsOpen: dict.mapSection.seatsOpen,
            caseloadWord: dict.mapSection.caseloadWord,
            zoomLabel: dict.mapSection.zoomLabel,
            zoomWide: dict.mapSection.zoomWide,
            zoomClose: dict.mapSection.zoomClose,
            zoomAtlantic: dict.mapSection.zoomAtlantic,
            zoomReset: dict.mapSection.zoomReset,
            zoomIn: dict.mapSection.zoomIn,
            zoomOut: dict.mapSection.zoomOut,
            wheelHint: dict.mapSection.wheelHint,
            overview: dict.mapSection.overview,
            openFull: dict.mapSection.openFull,
            closeFull: dict.mapSection.closeFull,
            }}
            locale={locale}
          />
        </div>
      </main>
    </div>
  );
}
