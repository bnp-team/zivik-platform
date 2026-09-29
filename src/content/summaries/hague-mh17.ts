import type { DecisionSummary, SummaryBlock } from "./types";
import verbatim from "./hague-mh17.verbatim.json";
import verbatimUk from "./hague-mh17.uk.json";

/**
 * The MH17 criminal trial – Public Prosecution Service v. Girkin, Dubinskiy,
 * Pulatov and Kharchenko, District Court of The Hague, verdict of
 * 17 November 2022 (ECLI:NL:RBDHA:2022:14037).
 *
 * The verbatim body is the doc's tab (not yet marked finalized; the doc's
 * trailing bracket-footnotes belong to other tabs and are not part of this
 * text). Context beyond the tab – the exact verdict date, the finality (no
 * appeals), the ~EUR 16M in compensation to relatives, the JIT – cites its
 * sources and lives in docs/research/hague-mh17-sources.md.
 */
export const hagueMh17: DecisionSummary = {
  ...(verbatim as {
    id: string;
    caseId: string;
    masthead: { official: string; parties: string; judgment: string };
    blocks: SummaryBlock[];
  }),
  blocksUk: (verbatimUk as { blocks: SummaryBlock[] }).blocks,

  title: {
    uk: "Справа MH17: вирок у Гаазі",
    en: "The MH17 verdict in The Hague",
  },
  /* The share card's wording (scripts/og-cards.mts). Carried over from the
     hand-drawn cards so the redrawn ones say the same. */
  card: {
    title: "Справа MH17: вирок у Гаазі",
    eyebrow: "Окружний суд Гааги · 17 листопада 2022",
    kicker: "Три довічні вироки за 298 загиблих",
  },
  /* The masthead in Ukrainian – the caption under the title and the line
     in the eyebrow. `masthead` keeps the decision's own English, which is
     what the citation block reproduces; this is what a Ukrainian reader
     sees at the top of the page. See `mastheadUk` in summaries/types.ts. */
  mastheadUk: {
    official:
      "Прокуратура проти Гіркіна, Дубінського, Пулатова і Харченка (рейс MH17) – окружний суд Гааги, ECLI:NL:RBDHA:2022:14037",
    judgment: "Вирок від 17 листопада 2022",
  },

  asOf: "2026-08-22",

  forum: {
    institution: { uk: "Окружний суд Гааги", en: "District Court of The Hague" },
    seat: { uk: "Гаага", en: "The Hague" },
  },

  /* Search-result description. `plain.tldr` used to serve as this and runs
     three to four sentences, so the snippet was cut off mid-word. */
  metaDesc: {
    uk: "Вирок Окружного суду Гааги від 17 листопада 2022 у справі MH17: троє заочно засуджені до довічного ув'язнення, четвертого підсудного виправдано.",
    en: "The Hague District Court's MH17 verdict of 17 November 2022: three men sentenced to life in absentia, the fourth accused acquitted. Final, unappealed.",
  },

  plain: {
    tldr: {
      uk: "17 липня 2014 року ракета «Бук» збила над Донеччиною рейс MH17 – загинули всі 298 людей на борту. 17 листопада 2022 року нідерландський суд заочно засудив до довічного ув'язнення трьох організаторів доставки «Бука» – Гіркіна, Дубинського і Харченка – і виправдав четвертого підсудного, Пулатова. Вирок остаточний: ні прокуратура, ні засуджені його не оскаржили.",
      en: "On 17 July 2014 a Buk missile downed flight MH17 over the Donetsk region – all 298 aboard died. On 17 November 2022 a Dutch court sentenced three men who organised the Buk's deployment – Girkin, Dubinskiy and Kharchenko – to life in prison in absentia, and acquitted the fourth accused, Pulatov. The verdict is final: neither the prosecution nor the convicted appealed.",
    },
  },


  judgment: {
    court: { uk: "Окружний суд Гааги", en: "District Court of The Hague" },
    url: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBDHA:2022:14037",
    caseUrl: "https://www.courtmh17.com/en/",
    date: "2022-11-17",
    readLabel: { uk: "Вирок (rechtspraak.nl)", en: "The verdict (rechtspraak.nl)" },
    fileLabel: { uk: "Сайт процесу MH17", en: "The MH17 trial site" },
  },

  instruments: [
    {
      abbr: { uk: "КК Нідерландів", en: "Dutch Criminal Code" },
      name: {
        uk: "Кримінальний кодекс Нідерландів (статті про спричинення авіакатастрофи та вбивство)",
        en: "Dutch Criminal Code (causing an aircraft to crash; murder)",
      },
      year: 1881,
      url: "https://wetten.overheid.nl/BWBR0001854/",
    },
  ],

  stats: [
    { value: "298", label: { uk: "загиблих – усі, хто був на борту", en: "dead – everyone aboard" }, em: true },
    { value: "3", label: { uk: "довічні вироки заочно", en: "life sentences in absentia" } },
    { value: "1", label: { uk: "виправдання – Пулатов", en: "acquittal – Pulatov" } },
    {
      value: { uk: "€16 млн+", en: "€16M+" },
      label: { uk: "компенсацій родинам присуджено", en: "in compensation awarded to relatives" },
    },
  ],

  glance: [
    { label: { uk: "Обвинувачення", en: "Prosecution" }, value: { uk: "Прокуратура Нідерландів (на базі JIT)", en: "Dutch PPS (on the JIT record)" } },
    {
      label: { uk: "Підсудні", en: "Accused" },
      value: { uk: "Гіркін · Дубинський · Харченко · Пулатов", en: "Girkin · Dubinskiy · Kharchenko · Pulatov" },
    },
    { label: { uk: "Суд", en: "Court" }, value: { uk: "Окружний суд Гааги", en: "District Court of The Hague" } },
    { label: { uk: "Вирок", en: "Verdict" }, value: { uk: "17 листопада 2022", en: "17 November 2022" } },
    { label: { uk: "Статус", en: "Status" }, value: { uk: "остаточний – без апеляцій", en: "final – no appeals" } },
  ],

  timeline: [
    {
      date: { uk: "17 лип. 2014", en: "17 Jul 2014" },
      iso: "2014-07-17",
      kind: "context",
      label: { uk: "Збиття MH17 біля Первомайського: 298 загиблих", en: "MH17 downed near Pervomaiskyi: 298 dead" },
      note: {
        uk: "Boeing 777 Malaysia Airlines, рейс Амстердам–Куала-Лумпур. 196 загиблих – нідерландці.",
        en: "A Malaysia Airlines Boeing 777, Amsterdam to Kuala Lumpur. 196 of the dead were Dutch.",
      },
    },
    {
      date: { uk: "серп. 2014", en: "Aug 2014" },
      iso: "2014-08-07",
      kind: "filing",
      label: { uk: "Створено JIT", en: "The JIT is formed" },
      note: {
        uk: "Нідерланди, Австралія, Бельгія, Малайзія, Україна – спільне кримінальне розслідування.",
        en: "The Netherlands, Australia, Belgium, Malaysia and Ukraine open a joint criminal investigation.",
      },
    },
    {
      date: { uk: "9 бер. 2020", en: "9 Mar 2020" },
      iso: "2020-03-09",
      kind: "order",
      label: { uk: "Початок процесу в Гаазі", en: "The trial opens in The Hague" },
      note: {
        uk: "Заочно щодо трьох; Пулатова представляли адвокати.",
        en: "In absentia for three; Pulatov was represented by counsel.",
      },
    },
    {
      date: { uk: "17 лист. 2022", en: "17 Nov 2022" },
      iso: "2022-11-17",
      kind: "judgment",
      label: {
        uk: "Вирок: три довічні, одне виправдання, €16 млн+ родинам",
        en: "Verdict: three life sentences, one acquittal, €16M+ to relatives",
      },
      note: {
        uk: "Суд визнав установку «Бук» російською, привезеною з РФ і повернутою туди; конфлікт на сході кваліфіковано як керований Росією.",
        en: "The court found the Buk was Russian, brought from and returned to Russia; the eastern conflict was Russian-controlled.",
      },
    },
    {
      date: { uk: "поч. 2023", en: "Early 2023" },
      iso: "2023-02-08",
      kind: "order",
      label: {
        uk: "Вирок стає остаточним; JIT публікує висновки про командну вертикаль",
        en: "The verdict becomes final; the JIT reports on the chain of command",
      },
      note: {
        uk: "Ані прокуратура, ані засуджені не оскаржили. 8 лютого 2023 року JIT оприлюднила висновки щодо екіпажу «Бука» і вертикалі – і призупинила розслідування.",
        en: "Neither the prosecution nor the convicted appealed. On 8 February 2023 the JIT published its findings on the Buk crew and the chain of command – and suspended the investigation.",
      },
    },
    {
      date: { uk: "9 лип. 2025", en: "9 Jul 2025" },
      iso: "2025-07-09",
      kind: "context",
      label: {
        uk: "ЄСПЛ покладає на Росію державну відповідальність за MH17",
        en: "The ECtHR fixes Russia's State responsibility for MH17",
      },
      note: {
        uk: "Рішення «Україна і Нідерланди проти Росії» спирається зокрема на фактологію цього вироку.",
        en: "Ukraine and the Netherlands v. Russia builds in part on this verdict's factual record.",
      },
    },
  ],

  /* Same as finland-torden: a criminal trial captioned "seat of arbitration". */


  mapFocus: { forumKey: "hague", reachTo: "donetsk" },

  theatres: [
    {
      place: { uk: "Первомайське, Донеччина", en: "Pervomaiskyi, Donetsk region" },
      tag: { uk: "МІСЦЕ ПУСКУ", en: "THE LAUNCH SITE" },
      markerKeys: ["donetsk"],
      summary: {
        uk: "Поле, з якого установка «Бук» випустила ракету по MH17 17 липня 2014 року.",
        en: "The field from which the Buk TELAR fired at MH17 on 17 July 2014.",
      },
    },
  ],

  interpretations: [
    {
      term: { uk: "Заочний процес – легітимний", en: "In absentia – and legitimate" },
      ruling: {
        uk: "Нідерландське право дозволило повний процес без підсудних: із захистом (для Пулатова), повним дослідженням доказів і виправданням там, де доказів забракло.",
        en: "Dutch law allowed a full trial without the accused: with a defence (for Pulatov), full evidence-testing, and an acquittal where proof fell short.",
      },
    },
    {
      term: { uk: "Не комбатанти – отже, вбивство", en: "Not combatants – therefore murder" },
      ruling: {
        uk: "Підсудні як керівники «ДНР» були цивільними без права вести бойові дії – тож збиття літака судили як умисне вбивство за загальним кримінальним правом, без комбатантського імунітету.",
        en: "As \"DPR\" leaders the accused were civilians with no right to fight – so the downing was tried as murder under ordinary criminal law, with no combatant immunity.",
      },
    },
    {
      term: { uk: "Локербі як орієнтир кари", en: "Lockerbie as the sentencing referent" },
      ruling: {
        uk: "За відсутності подібних справ у нідерландській практиці обвинувачення міряло покарання справою Локербі: планування, 298 жертв і тяжкість наслідків виправдовують лише довічне.",
        en: "With no Dutch precedent, the prosecution measured the sentence against Lockerbie: the planning, the 298 victims and the gravity justified nothing short of life.",
      },
    },
  ],

  sources: [
    {
      url: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBDHA:2022:14037",
      title: "Verdict against Girkin – ECLI:NL:RBDHA:2022:14037 (full text)",
      authors: "",
      publication: "Rechtspraak.nl",
      date: "17 November 2022",
      type: "official/award",
    },
    {
      url: "https://www.courtmh17.com/en/summaries-and-news/news/summary-of-the-day-in-court-17-november-2022-judgment.htm",
      title: "Summary of the day in court: 17 November 2022 – Judgment",
      authors: "",
      publication: "District Court of The Hague (courtmh17.com)",
      date: "17 November 2022",
      type: "official/award",
    },
    {
      url: "https://www.prosecutionservice.nl/topics/m/mh17-plane-crash/prosecution-and-trial",
      title: "MH17: prosecution and trial (finality; no appeals)",
      authors: "",
      publication: "Netherlands Public Prosecution Service",
      date: "2023",
      type: "official/filing",
    },
    {
      url: "https://nltimes.nl/2022/11/17/three-convicted-sentenced-life-prison-downing-flight-mh17-one-acquitted",
      title: "Three convicted & sentenced to life in prison for downing flight MH17; one acquitted (€16M+ compensation)",
      authors: "",
      publication: "NL Times",
      date: "17 November 2022",
      type: "news/insight",
    },
    {
      url: "https://www.ejiltalk.org/the-mh17-judgment-an-interesting-take-on-the-nature-of-the-armed-conflict-in-eastern-ukraine/",
      title: "The MH17 Judgment: An Interesting Take on the Nature of the Armed Conflict in Eastern Ukraine",
      authors: "",
      publication: "EJIL: Talk!",
      date: "2022",
      type: "blog post",
    },
    {
      url: "https://www.interfax.com/newsroom/top-stories/85062/",
      title: "The Hague District Court in absentia sentences Girkin, Dubinsky and Kharchenko to life in prison",
      authors: "",
      publication: "Interfax",
      date: "17 November 2022",
      type: "news/insight",
    },
  ],
};
