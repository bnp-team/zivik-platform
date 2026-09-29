import type { Partner } from "./types";

/**
 * Partners – organisations the project works *with*.
 *
 * The university, its Faculty of Law and the Louis Sohn Research Centre
 * were listed here and have been removed: they run the archive, they are not
 * partners of it. They are named where they belong – in the footer, on the
 * about page and as the controller in the legal pages – and listing them
 * alongside a genuine external partner both padded the row and misdescribed
 * everyone in it.
 *
 * Add entries – with a `logo` under `/public/logos/partners/`, supplied by the
 * partner – as partnerships are confirmed.
 */
export const partners: Partner[] = [
  {
    /* Mark supplied by ifa. Their prescribed wording for the funding line
       still has to come from them – it is not something to paraphrase. */
    id: "ifa",
    /* The institute's own name, in both locales. It was «Інститут зовнішніх
       зв’язків (ifa)» in Ukrainian, set directly under a mark that spells the
       German out – a caption translating the picture above it. The Ukrainian
       reader is told what the institute is in `blurb` instead, which is where
       a gloss can be a sentence rather than a substitute name. */
    name: {
      uk: "Institut für Auslandsbeziehungen",
      en: "Institut für Auslandsbeziehungen",
    },
    blurb: {
      uk: "Німецький інститут зовнішніх зв’язків – партнер програми, у межах якої постала бібліотека.",
      en: "The German institute for foreign cultural relations – partner of the programme under which this library came about.",
    },
    url: "https://www.ifa.de",
    logo: "/logos/partners/ifa.png",
  },
];
