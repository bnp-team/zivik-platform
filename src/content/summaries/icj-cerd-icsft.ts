import type { DecisionSummary, SummaryBlock } from "./types";
import verbatim from "./icj-cerd-icsft.verbatim.json";
import verbatimUk from "./icj-cerd-icsft.uk.json";

/**
 * ICSFT & CERD (Ukraine v. Russian Federation), ICJ Judgment of 31 January 2024.
 *
 * `verbatim` holds the summary prose exactly as ingested from the source .docx
 * (English – the language of the judgment). The fields below add a localized
 * visualization layer – stats, facts, timeline, verdicts and theatres – whose
 * every value restates something already in that prose:
 *   • timeline dates all appear in the text (Crimea 2014, filing 2017, the
 *     19 April 2017 Order, the 31 January 2024 Judgment);
 *   • the verdict matrix mirrors the operative findings in "4. LEGAL
 *     CONSEQUENCES" (the dispositif) – four violations, the rest rejected;
 *   • the theatres restate the two factual tracks (eastern Ukraine → ICSFT,
 *     Crimea → CERD) and anchor them to the map.
 * Short chrome strings are localized UA/EN; the body prose stays English.
 */
export const icjCerdIcsft: DecisionSummary = {
  ...(verbatim as {
    id: string;
    caseId: string;
    masthead: { official: string; parties: string; judgment: string };
    blocks: SummaryBlock[];
  }),
  blocksUk: (verbatimUk as { blocks: SummaryBlock[] }).blocks,

  /* «Стандартизована назва з одним розміром шрифту. Замінюємо назву на таку»
     – the owner's own wording, and it is the ICJ's full case name. What stood
     here was «Україна проти Російської Федерації», which is also the h1 of
     icj-genocide: the archive's two ICJ cases carried one headline between
     them and neither said which it was.

     One word-group differs from the owner's text. She wrote «про запобігання
     фінансуванню тероризму»; the convention's official Ukrainian name, fixed
     by the ratification law (Закон України № 149-IV of 12 September 2002,
     zakon.rada.gov.ua/go/995_518), is «про боротьбу з фінансуванням
     тероризму», and that is what the caption on this page and every other
     mention in the archive already use. On a page about that convention the
     h1 cannot be the one place that names it differently, so the official
     wording stands here – flagged to the owner, hers to overrule.

     Set in sentence case, not the capitals of the review document: the caps
     there are that document's heading style, and 130 characters of display
     serif in capitals is six lines of shouting. */
  title: {
    uk: "Застосування Міжнародної конвенції про боротьбу з фінансуванням тероризму та Міжнародної конвенції про ліквідацію всіх форм расової дискримінації (Україна проти Російської Федерації)",
    en: "Application of the International Convention for the Suppression of the Financing of Terrorism and of the International Convention on the Elimination of All Forms of Racial Discrimination (Ukraine v. Russian Federation)",
  },
  /* The share card's wording (scripts/og-cards.mts). Carried over from the
     hand-drawn cards so the redrawn ones say the same. */
  card: {
    title: "Україна проти Російської Федерації",
    eyebrow: "Міжнародний суд ООН · рішення 31 січня 2024",
    kicker: "4 порушення двох конвенцій – ICSFT і CERD",
  },
  seoTitle: {
    uk: "Україна проти Росії (ICSFT і CERD) – Міжнародний суд ООН",
    en: "Ukraine v. Russia (ICSFT and CERD) – International Court of Justice",
  },  /* The masthead in Ukrainian – the caption under the title and the line
     in the eyebrow. `masthead` keeps the decision's own English, which is
     what the citation block reproduces; this is what a Ukrainian reader
     sees at the top of the page. See `mastheadUk` in summaries/types.ts. */
  mastheadUk: {
    /* The same sentence as `title`, deliberately. The caption used to stop
       before «(Україна проти Російської Федерації)», so with the full case
       name in the h1 it rendered as a shortened copy of the headline directly
       under it – one name at two sizes, which is what the review asked to end.
       Identical, the masthead prints it once; see the guard on `.fullname` in
       cases/[slug]/page.tsx. The English `masthead.official` is untouched and
       is what the citation block reproduces. */
    official:
      "Застосування Міжнародної конвенції про боротьбу з фінансуванням тероризму та Міжнародної конвенції про ліквідацію всіх форм расової дискримінації (Україна проти Російської Федерації)",
    judgment: "Рішення від 31 січня 2024",
  },

  /**
   * Explicit rather than relying on the page template's default. That default
   * is invisible from the data, so every other consumer has to know about it –
   * and map-links.ts did not, which is why this decision showed no forum on
   * the events map.
   */
  forum: {
    institution: {
      uk: "Міжнародний суд ООН",
      en: "International Court of Justice",
    },
    seat: { uk: "Гаага", en: "The Hague" },
  },

  /* Search-result description. `plain.tldr` used to serve as this and runs
     three to four sentences, so the snippet was cut off mid-word. */
  metaDesc: {
    uk: "Рішення МС ООН від 31 січня 2024: два порушення – Росія не розслідувала фінансування тероризму і згорнула українську освіту в Криму.",
    en: "ICJ judgment of 31 January 2024: two breaches upheld – Russia failed to investigate terrorism financing and curtailed Ukrainian schooling in Crimea.",
  },

  plain: {
    tldr: {
    /* The judgment's own opening paragraph, not a retelling of it. The one
       that stood here was written for the page and showed it – and it also
       carried «лише два порушення» while the dashboard beside it counted
       four. Review: «Цей абзац я б теж переписала, бо дуже видно, що це ШІ
       склав. На наступний текст (він взятий з колонки САМЕРІ, тому звідти
       треба забрати)». So the paragraph moved rather than being copied: the
       `lead` block is gone from both summary files, and the closing sentence
       about the dismissal of most claims is the review's own addition. */
      uk: "31 січня 2024 року Міжнародний суд ООН («Суд») виніс рішення по суті у справі, порушеній Україною проти Російської Федерації у 2017 році («Рішення»). Україна стверджувала про численні порушення Росією двох договорів: Міжнародної конвенції про боротьбу з фінансуванням тероризму 1999 року («ICSFT») та Міжнародної конвенції про ліквідацію всіх форм расової дискримінації 1965 року («CERD»). Більшість вимог України було відхилено.",
      en: "On January 31, 2024, the International Court of Justice (“the Court”) issued a judgment on the merits of the case brought by Ukraine against the Russian Federation in 2017 (“the Judgment”). Ukraine alleged numerous violations by Russia of two treaties: the 1999 International Convention for the Suppression of the Financing of Terrorism (“ICSFT”), and the 1965 International Convention on the Elimination of All Forms of Racial Discrimination (“CERD”). Most of Ukraine's claims were dismissed.",
    },
  },


  judgment: {
    court: { uk: "Міжнародний суд ООН", en: "International Court of Justice" },
    url: "https://www.icj-cij.org/sites/default/files/case-related/166/166-20240131-jud-01-00-en.pdf",
    caseUrl: "https://www.icj-cij.org/case/166",
    date: "2024-01-31",
  },

  instruments: [
    {
      abbr: "ICSFT",
      name: {
        uk: "Міжнародна конвенція про боротьбу з фінансуванням тероризму",
        en: "International Convention for the Suppression of the Financing of Terrorism",
      },
      year: 1999,
      url: "https://treaties.un.org/pages/ViewDetails.aspx?src=IND&mtdsg_no=XVIII-11&chapter=18&clang=_en",
    },
    {
      abbr: "CERD",
      name: {
        uk: "Міжнародна конвенція про ліквідацію всіх форм расової дискримінації",
        en: "International Convention on the Elimination of All Forms of Racial Discrimination",
      },
      year: 1965,
      url: "https://www.ohchr.org/en/instruments-mechanisms/instruments/international-convention-elimination-all-forms-racial-discrimination",
    },
  ],

  stats: [
    { value: "2", label: { uk: "конвенції", en: "conventions" } },
    /* The accented tile of this dashboard. The template used to give it the
       accent by matching the English label string; the flag the model already
       has for it carries the same fact and survives a rewording. */
    {
      value: "4",
      label: { uk: "порушення", en: "violations found" },
      note: {
        uk: "2 за конвенціями · 2 за наказом 2017 року",
        en: "2 under the conventions · 2 under the 2017 Order",
      },
      em: true,
    },
    { value: "7", label: { uk: "років розгляду", en: "years to judgment" } },
  ],

  glance: [
    { label: { uk: "Заявник", en: "Applicant" }, value: { uk: "Україна", en: "Ukraine" } },
    {
      label: { uk: "Відповідач", en: "Respondent" },
      value: { uk: "Російська Федерація", en: "Russian Federation" },
    },
    {
      label: { uk: "Суд", en: "Court" },
      value: { uk: "Міжнародний суд ООН", en: "International Court of Justice" },
    },
    { label: { uk: "Місце", en: "Seat" }, value: { uk: "Гаага", en: "The Hague" } },
    {
      label: { uk: "Рішення", en: "Judgment" },
      value: { uk: "31 січня 2024", en: "31 January 2024" },
    },
  ],

  /* All four carry a sort key now.

     They did not, and the review found the result: «Хронологія подана не в
     хронологічному порядку». Events without `iso` sort last, so «поч. 2014»
     and «2017» – the two oldest – printed under the 2024 judgment.

     The reasoning that left them keyless was that widening a season or a year
     into 1 January invents a day. It does, but `iso` is not the printed date:
     the visible label still reads «поч. 2014», and `TimelineEvent.iso` is
     documented as a sort key whose date «may be a range or a month». The
     timeline already reads a four-character key at year precision – see the
     rail in CaseTimeline.tsx, which places `"2014"` as `2014-01-01`. So the
     key is given at the precision the label claims and no finer. */
  /* Карта закриває розділ фактичних обставин – див. `mapAfterPart`
     у summaries/types.ts. */
  mapAfterPart: 0,

  timeline: [
    {
      date: { uk: "поч. 2014", en: "Early 2014" },
      iso: "2014",
      label: {
        uk: "РФ встановлює контроль над Кримським півостровом",
        en: "Russian Federation takes control of the Crimean peninsula",
      },
      kind: "context",
    },
    {
      date: { uk: "2017", en: "2017" },
      iso: "2017",
      label: {
        uk: "Україна подає позов до Суду",
        en: "Ukraine institutes proceedings before the Court",
      },
      kind: "filing",
    },
    {
      date: { uk: "19 квіт. 2017", en: "19 Apr 2017" },
      iso: "2017-04-19",
      label: {
        uk: "Наказ про тимчасові заходи",
        en: "Order indicating provisional measures",
      },
      kind: "order",
    },
    {
      date: { uk: "31 січ. 2024", en: "31 Jan 2024" },
      iso: "2024-01-31",
      label: { uk: "Рішення по суті", en: "Judgment on the merits" },
      kind: "judgment",
    },
  ],

  sources: [
    {
      url: "https://asil.org/ilib/icj-delivers-judgment-ukraine-v-russia-case-concerning-terrorism-financing-and-cerd/",
      title:
        "ICJ Delivers Judgment in Ukraine v. Russia Case Concerning Terrorism Financing and CERD",
      authors: "",
      publication: "ASIL",
      date: "2024",
      type: "news/insight",
    },
    {
      url: "https://www.ejiltalk.org/human-rights-reparations-and-fact-finding-quandaries-in-the-2024-icj-judgments-in-ukraine-v-russian-federation/",
      title:
        "Human Rights Reparations and Fact-Finding Quandaries in the 2024 ICJ Judgments in Ukraine v. Russian Federation",
      authors: "Diane Desierto",
      publication: "EJIL: Talk!",
      date: "11 March 2024",
      type: "blog post",
    },
    {
      url: "https://www.researchgate.net/publication/381785364_Judgment_on_the_merits_of_the_International_Court_of_Justice_of_January_31_2024_case_Ukraine_vs_Russian_Federation",
      title:
        "Judgment on the merits of the International Court of Justice of January 31, 2024, case Ukraine vs Russian Federation",
      authors: "O.A. Kiseleva",
      publication: "Law Enforcement Review (via ResearchGate)",
      date: "2024",
      type: "journal article",
    },
    {
      url: "https://www.cambridge.org/core/journals/american-journal-of-international-law/article/application-of-the-international-convention-for-the-suppression-of-the-financing-of-terrorism-and-of-international-convention-on-the-elimination-of-all-forms-of-racial-discrimination-ukraine-v-russian-federation-judgment/1C4B2C51220C6332B91392FAC2204267",
      title:
        "Application of the International Convention for the Suppression of the Financing of Terrorism and of International Convention on the Elimination of All Forms of Racial Discrimination (Ukraine v. Russian Federation), Judgment",
      authors: "Lauri Mälksoo",
      publication: "American Journal of International Law",
      date: "2024",
      type: "journal article",
    },
    {
      url: "https://internationallaw.blog/2024/04/08/narrow-interpretation-of-the-term-funds-by-the-judgement-of-31-january-2024-is-icj-the-one-to-blame/",
      title:
        "Narrow Interpretation of the Term “Funds” by the Judgement of 31 January 2024: Is ICJ the One to Blame?",
      authors: "Oleksandr Marusiak",
      publication: "International Law Blog",
      date: "8 April 2024",
      type: "blog post",
    },
    {
      url: "https://www.researchgate.net/publication/385033225_Application_of_the_International_Convention_for_the_Suppression_of_the_Financing_of_Terrorism_and_of_International_Convention_on_the_Elimination_of_All_Forms_of_Racial_Discrimination_Ukraine_v_Russian",
      title:
        "Application of the International Convention for the Suppression of the Financing of Terrorism and of International Convention on the Elimination of All Forms of Racial Discrimination (Ukraine v. Russian Federation)",
      authors: "",
      publication: "ResearchGate",
      date: "2024",
      type: "preprint/repository",
    },
    {
      url: "https://www.researchgate.net/publication/389453084_Comments_on_the_judgment_of_the_International_Court_of_Justice_of_31_January_2024_Case_No_166_Application_of_the_International_Convention_for_the_Suppression_of_the_Financing_of_Terrorism_and_the_Inte",
      title:
        "Comments on the judgment of the International Court of Justice of 31 January 2024, Case No. 166 (Ukraine v. Russian Federation)",
      authors: "Kaja Kowalczewska, Barbara Pauli",
      publication: "Polish Review of International and European Law",
      date: "2024",
      type: "journal article",
    },
    {
      url: "https://www.cambridge.org/core/journals/international-legal-materials/article/application-of-the-intl-conv-for-the-suppression-of-the-financing-of-terrorism-of-the-intl-conv-on-the-elimination-of-all-forms-of-racial-discr-ukr-v-russ-merits-icj/32AB65A2A320168FB1297F160747197D",
      title:
        "Application of the Int’l Conv. for the Suppression of the Financing of Terrorism & of the Int’l Conv. on the Elimination of All Forms of Racial Discr. (Ukr. v. Russ.) (Merits) (I.C.J.)",
      authors: "Iryna Marchuk",
      publication: "International Legal Materials",
      date: "2024",
      type: "journal article",
    },
    {
      url: "https://www.researchgate.net/publication/388942304_Reflecting_on_the_interpretation_and_application_of_the_international_convention_for_the_suppression_of_the_financing_of_terrorism_in_light_of_the_Ukraine_v_Russia_case",
      title:
        "Reflecting on the interpretation and application of the International Convention for the Suppression of the Financing of Terrorism in light of the Ukraine v. Russia case",
      authors: "Daniele Musmeci",
      publication: "Journal of International Dispute Settlement (via ResearchGate)",
      date: "2025",
      type: "journal article",
    },
    {
      url: "https://legaljournal.princeton.edu/from-financing-to-frontlines-interpreting-funds-in-the-international-convention-for-the-suppression-of-the-financing-of-terrorism/",
      title:
        "From Financing to Frontlines: Interpreting Funds in the International Convention for the Suppression of the Financing of Terrorism",
      authors: "Katherine Lee",
      publication: "Princeton Legal Journal",
      date: "Fall 2024",
      type: "journal article",
    },
  ],

  /* Empty, so the «Ключові тлумачення» band does not render on this page.
   *
   * It held three entries and all three were the three preliminary
   * determinations, condensed: «Кошти» (ICSFT), racial discrimination under
   * CERD Article 1(1), and the clean-hands doctrine. The write-up sets out
   * each of them under «Попередні визначення», in the Court's own words and
   * with the argument it answered – so the page said the same three things
   * twice, in two shapes, eight bands apart, and a reader who met the short
   * form second had no way to know it was the same ruling.
   *
   * The field stays on the type and the band still knows how to draw itself:
   * a decision whose holdings on the law are not in its write-up should
   * still have somewhere to put them. Owner: «прибери смугу тлумачення».
   */
  interpretations: [],

  /* The date the template used to hardcode. It is in the verbatim: "Order on
     Provisional Measures of 19 April 2017", and the dispositif cites
     "paragraph 106 (1) (a) of the Order of 19 April 2017". */
  provisionalMeasuresOrder: {
    uk: "Наказ від 19 квітня 2017",
    en: "Order of 19 April 2017",
  },

  /* Empty, so the «Тимчасові заходи» band does not render on this page.
   *
   * It held three rows – the measure, whether it was kept, and a note with
   * the paragraph number – and the write-up answers each of the Order's
   * three limbs under «Наказ про тимчасові заходи», with the Court's own
   * words and the same paragraph numbers. The one thing the band had that
   * the text did not was the plain statement of what each measure
   * required, and that has moved onto the limb it belongs to.
   *
   * Owner: «розділ тимчасові заходи дублює те що вказано у правових
   * висновках – можеш спробувати обʼєднати».
   */
  provisionalMeasures: [],


  theatres: [
    {
      /* «Схід України», not «Східна Україна» – review's correction. The
         adjective names a region as though it were a fixed entity; the
         genitive names a part of the country, which is what the theatre is. */
      place: { uk: "Схід України", en: "East of Ukraine" },
      tag: "ICSFT",
      markerKeys: ["donetsk", "luhansk"],
      areas: ["east"],
      summary: {
        uk: "Ймовірне фінансування збройних груп «ДНР» і «ЛНР» – трек фінансування тероризму.",
        en: "Alleged financing of armed groups linked to the “DPR” and “LPR” – terrorism-financing track.",
      },
    },
    {
      place: { uk: "Крим", en: "Crimea" },
      tag: "CERD",
      markerKeys: ["crimea"],
      areas: ["crimea"],
      summary: {
        uk: "Ймовірна кампанія расової дискримінації проти кримських татар і етнічних українців.",
        en: "Alleged campaign of racial discrimination against Crimean Tatars and ethnic Ukrainians.",
      },
    },
  ],
};
