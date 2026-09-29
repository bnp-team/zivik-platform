import type { AboutContent, AboutLink } from "./types";
import { locales } from "@/i18n/config";

/**
 * The library's own description, verbatim (bilingual) from the source
 * materials. Full name: The Library of Accountability and Justice for Ukraine
 * 'NaSvitlo'.
 *
 * This renders on BOTH the home page's about band and /about, so anything
 * added here appears twice. The scope statement – which courts' practice the
 * library covers – deliberately lives in the about page's own prose instead:
 * it was the home page's intro band and the user asked for it off the home
 * page entirely.
 *
 * ── The owner's own description, September 2026 ────────────────────────────
 * The first and third paragraphs are the platform's own text, handed over as
 * «Про платформу – опис повний»: what the library is, and who it is for. The
 * English is a translation of that Ukrainian, made here – the document
 * carries no English of its own, and the site cannot render a paragraph in
 * one language only.
 *
 * The middle paragraph is not in that document and is kept: the 2014
 * resolution is the one sourced fact these paragraphs carry, and the owner
 * asked earlier for it to be named in full and linked. The document describes
 * the platform; it does not withdraw a citation.
 *
 * ── Two owner's corrections, March 2026 ─────────────────────────────────────
 * 1. It said the library covers «низки українських ініціатив» / "the various
 *    initiatives launched by Ukraine". Not every proceeding here was brought
 *    by Ukraine: the Netherlands brought the fourth of the inter-State
 *    applications behind *Ukraine and the Netherlands v Russia* over MH17, and
 *    Finland tried Torden under universal jurisdiction on its own motion. The
 *    sentence names both origins now.
 * 2. The resolution was identified only by its month. It is General Assembly
 *    resolution 68/262 «Територіальна цілісність України» of 27 March 2014,
 *    and it is named in full and linked – this archive's whole method is that
 *    a reader can check a statement against the document behind it.
 * ────────────────────────────────────────────────────────────────────────────
 */
/** A/RES/68/262 in the UN Digital Library.
 *
 *  Exported because three places name it: both language link tables below and
 *  the dated marker on /about. The reason it is this record and not a mirror
 *  is in the note above `links`. */
export const RESOLUTION_URL = "https://digitallibrary.un.org/record/767565";

export const about: AboutContent = {
  title: {
    uk: "Про проєкт",
    en: "About the project",
  },
  paragraphs: {
    uk: [
      "Бібліотека відповідальності та правосуддя для України «НаСвітло» – це онлайн-колекція міжнародної практики та практики іноземних судів, пов'язаної із забезпеченням відповідальності за порушення міжнародного права, вчинені у контексті війни Росії проти України. Платформа об'єднує в одному просторі аналіз рішень та інших матеріалів відповідних судових проваджень, роблячи їх доступними для системного пошуку, дослідження та аналізу.",
      "Протиправний характер дій Росії був визнаний ще у 2014 році: схвалена Генеральною Асамблеєю ООН 27 березня 2014 року резолюція «Територіальна цілісність України» наголошувала на незаконності «референдуму» в Криму та закликала всі держави, міжнародні організації і спеціалізовані установи не визнавати жодних змін його статусу.",
      "«НаСвітло» задумана не просто як архів судових рішень, а як відкритий ресурс для дослідників, практикуючих юристів, студентів, представників громадянського суспільства та всіх, хто працює над питаннями відповідальності, правосуддя і верховенства права у контексті війни проти України.",
    ],
    en: [
      "The Library of Accountability and Justice for Ukraine ‘NaSvitlo’ is an online collection of international practice and of the practice of foreign courts concerned with accountability for violations of international law committed in the context of Russia’s war against Ukraine. The platform brings together, in one place, the analysis of decisions and of other materials from those proceedings, and makes them available for systematic search, research and analysis.",
      "The unlawful character of Russia’s actions was recognized as early as 2014: the resolution ‘Territorial integrity of Ukraine’, adopted by the UN General Assembly on 27 March 2014, underscored the illegality of the ‘referendum’ in Crimea and called upon all States, international organizations, and specialized agencies not to recognize any alteration of its status.",
      "NaSvitlo is conceived not merely as an archive of court decisions but as an open resource for researchers, practising lawyers, students, civil society and everyone working on accountability, justice and the rule of law in the context of the war against Ukraine.",
    ],
  },
  /* A/RES/68/262, in the UN Digital Library – not a PDF on a mirror, and not
     the docs.un.org symbol permalink either. That one resolves, but it opens a
     JavaScript document viewer that renders nothing a reader can confirm the
     document by; this record page is titled with the resolution's own name,
     carries the date and the vote, and links the text in all six official
     languages. */
  links: {
    uk: [
      {
        text: "резолюція «Територіальна цілісність України»",
        href: RESOLUTION_URL,
      },
    ],
    en: [
      {
        text: "resolution ‘Territorial integrity of Ukraine’",
        href: RESOLUTION_URL,
      },
    ],
  },
};

/**
 * A link whose `text` is not in the prose renders as nothing at all – the
 * paragraph reads correctly and the citation silently disappears, which is the
 * one failure this file cannot afford. Editing the sentence and forgetting the
 * link table now fails the build instead.
 */
function checkAbout(content: AboutContent): void {
  if (!content.links) return;
  for (const locale of locales) {
    const prose = content.paragraphs[locale].join("\n");
    for (const link of content.links[locale]) {
      if (!prose.includes(link.text)) {
        throw new Error(
          `content/about.ts: ${locale} link text "${link.text}" is not in the ${locale} paragraphs`,
        );
      }
    }
  }
}

checkAbout(about);

export type { AboutLink };
