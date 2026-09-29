import type { DecisionSummary, SummaryBlock } from "./types";
import verbatim from "./echr-ukraine-netherlands.verbatim.json";
import verbatimUk from "./echr-ukraine-netherlands.uk.json";

/**
 * Ukraine and the Netherlands v. Russia [GC] (nos. 8019/16, 43800/14,
 * 28525/20 and 11055/22), merits judgment of 9 July 2025.
 *
 * `verbatim` is the doc's "ECHR mh-17" tab as ingested, quirks kept (the
 * "art. 43" of the lead, bracketed footnote digits, a Cyrillic "С" in
 * "Сonvention") – the tab is not yet marked finalized in the source doc and
 * will be re-ingested when it is. The visualization layer restates the
 * verbatim; context the tab does not carry – the judgment date and the four
 * application numbers, MH17's 298 victims, the expulsion timeline, the
 * reserved just-satisfaction phase – cites its sources and lives in
 * docs/research/echr-ukraine-netherlands-sources.md.
 */
export const echrUkraineNetherlands: DecisionSummary = {
  ...(verbatim as {
    id: string;
    caseId: string;
    masthead: { official: string; parties: string; judgment: string };
    blocks: SummaryBlock[];
  }),
  /* Ukrainian translation of the body, structurally 1:1 (30 blocks) – draft,
     pending legal review.

     Thirty, not the twenty-three the tab was ingested as. Not a word of the
     write-up changed: seven of its paragraphs were cut at the author's own
     full stops, and the two locales were cut at the same sentences, because
     `blocksUk` is read by index. The two 2022 paragraphs carried six
     movements between them – the decrees, the four axes of the invasion, the
     retreat from Kyiv, the counter-offensives, the purported annexation, the
     strikes on the grid – in two slabs of a thousand characters each; and the
     four-front sentence is a list the author wrote with his own semicolons,
     which the page now sets as one. */
  blocksUk: (verbatimUk as { blocks: SummaryBlock[] }).blocks,

  title: {
    uk: "Україна і Нідерланди проти Росії",
    en: "Ukraine and the Netherlands v. Russia",
  },
  /* The share card's wording (scripts/og-cards.mts). Carried over from the
     hand-drawn cards so the redrawn ones say the same. */
  card: {
    title: "Україна і Нідерланди проти Росії",
    eyebrow: "ЄСПЛ, Велика палата · 9 липня 2025",
    kicker: "Системні порушення від Донбасу-2014 до вторгнення",
  },
  /* The masthead in Ukrainian – the caption under the title and the line
     in the eyebrow. `masthead` keeps the decision's own English, which is
     what the citation block reproduces; this is what a Ukrainian reader
     sees at the top of the page. See `mastheadUk` in summaries/types.ts. */
  mastheadUk: {
    official:
      "Справа «Україна та Нідерланди проти Росії» (заяви № 8019/16, 43800/14, 28525/20 і 11055/22) – Велика палата, Європейський суд з прав людини",
    judgment: "Рішення по суті від 9 липня 2025",
  },

  asOf: "2026-08-22",

  forum: {
    institution: {
      uk: "Європейський суд з прав людини",
      en: "European Court of Human Rights",
    },
    seat: { uk: "Страсбург", en: "Strasbourg" },
  },

  /* Search-result description. `plain.tldr` used to serve as this and runs
     three to four sentences, so the snippet was cut off mid-word. */
  metaDesc: {
    uk: "Рішення Великої палати ЄСПЛ від 9 липня 2025: Росія відповідальна за системні порушення прав людини в Україні з 2014 року, зокрема збиття MH17.",
    en: "ECtHR Grand Chamber judgment of 9 July 2025: Russia held responsible for systemic human-rights violations in Ukraine since 2014, MH17 included.",
  },

  plain: {
    tldr: {
      uk: "Чотири міждержавні скарги – три від України, одна від Нідерландів через збиття MH17 – Велика палата ЄСПЛ розглянула разом і 9 липня 2025 року винесла рішення по суті. Суд визнав Росію відповідальною за системні порушення прав людини на сході України з 2014 року і по всій країні з 2022-го: від збиття MH17 і страт полонених до катувань, депортації дітей і заборони української освіти. Сатисфакцію (компенсації) буде визначено окремим рішенням.",
      en: "Four inter-State applications – three by Ukraine, one by the Netherlands over the downing of MH17 – were decided together by the ECtHR's Grand Chamber on 9 July 2025. The Court held Russia responsible for systemic human-rights violations in the east of Ukraine since 2014 and across the country from 2022: from the downing of MH17 and executions of prisoners to torture, the deportation of children and the ban on Ukrainian-language education. Just satisfaction is reserved for a separate ruling.",
    },
  },

  judgment: {

    // cases.ts records 304; without it the button omits "PDF, N pp."

    court: { uk: "Європейський суд з прав людини", en: "European Court of Human Rights" },
    url: "https://hudoc.echr.coe.int/eng#{%22appno%22:[%2243800/14%22],%22itemid%22:[%22001-244292%22]}",
    caseUrl: "https://www.echr.coe.int/w/ukraine-and-the-netherlands-v.-russia-nos.-8019/16-43800/14-and-28525/20-1",
    date: "2025-07-09",
    readLabel: { uk: "Читати рішення (HUDOC)", en: "Read the judgment (HUDOC)" },
    fileLabel: { uk: "Справа на сайті ЄСПЛ", en: "The case at the ECtHR" },
  },

  instruments: [
    {
      abbr: "ECHR",
      name: {
        uk: "Конвенція про захист прав людини і основоположних свобод",
        en: "Convention for the Protection of Human Rights and Fundamental Freedoms",
      },
      year: 1950,
      url: "https://www.echr.coe.int/documents/d/echr/convention_ENG",
    },
  ],

  stats: [
    {
      value: "4",
      label: { uk: "міждержавні заяви в одному рішенні", en: "inter-State applications in one judgment" },
    },
    {
      value: "298",
      label: { uk: "загиблих на борту MH17", en: "people killed aboard MH17" },
      em: true,
    },
    /* Twelve, counted from the judgment's own operative part (HUDOC 001-244292,
       pp. 493-497, after § 1652) rather than from the verbatim list below –
       which is where the audit's rival "11" comes from, and which is wrong in
       two directions at once. The distinct Convention and Protocol articles the
       Court found breached are Articles 2 (points 5, 6, 11, 12), 3 (8, 11, 13,
       22), 4 § 2 (14), 5 (15, 22), 8 (11, 16, 20, 22), 9 (17), 10 (18), 11
       (19), 13 (7, 24), 14 (23), and Articles 1 (11, 20) and 2 (21) of Protocol
       No. 1. That is twelve.

       The two directions: the verbatim's list omits Article 11 (freedom of
       assembly, operative point 19) and Article 13 (effective remedy, points 7
       and 24) altogether, and it adds Article 2 of Protocol No. 4, under which
       the Court found NO violation – points 11 and 22 both say it was "not
       necessary to examine separately" the P4-2 complaint. Drop P4-2 and add
       the two missing articles and the eleven becomes twelve.

       And the deliberate exclusion: operative point 25 holds that Russia failed
       to comply with Article 38, the obligation to furnish the Court with
       facilities to establish the facts. It is a breach, and it is a thirteenth
       article, but it is an obligation owed to the Court about the conduct of
       the proceedings, not one of the Convention rights the respondent violated
       against people. This tile counts the rights; the count is twelve. A page
       that wanted thirteen would have to say "articles of the Convention and
       its Protocols breached, Article 38 included", which is not what a reader
       of this tile's own label hears. */
    {
      value: "12",
      /* The matrix under this tile has eleven rows, not twelve: «Art. 9–10» is
         one row for two articles, «P1-1, P1-2» is one row for two more, and the
         «Діти» row restates articles 3, 5 and 8 rather than adding any. A reader
         who counts the rows gets eleven while the tile says twelve – the same
         trap the «4 порушення» tile on icj-cerd-icsft carried, where the page
         answered the same question two ways. The long note above argues why
         twelve is right; this says why the drawing beneath it does not look
         like twelve. */
      note: {
        uk: "у матриці нижче 11 рядків: ст. 9–10 і ст. 1–2 Протоколу № 1 згруповано попарно",
        en: "the matrix below has 11 rows: arts. 9–10 and arts. 1–2 of Protocol No. 1 are paired",
      },
      label: { uk: "статей Конвенції і протоколів порушено", en: "Convention and Protocol articles breached" },
    },
    {
      value: { uk: "8 років", en: "8 years" },
      label: { uk: "конфлікту охоплює рішення (2014–2022)", en: "of the conflict the judgment covers (2014–2022)" },
    },
  ],

  glance: [
    {
      label: { uk: "Заявники", en: "Applicants" },
      value: { uk: "Україна (×3) і Нідерланди", en: "Ukraine (×3) and the Netherlands" },
    },
    { label: { uk: "Відповідач", en: "Respondent" }, value: { uk: "Російська Федерація", en: "Russian Federation" } },
    /* «Велика палата» вже стоїть у назві суду поруч – у картці справи це
       рядок над цим, і повторювати її в значенні «Складу» означає сказати
       одне й те саме двічі в одній таблиці. Лишається те, чого більше ніде
       немає: скільки суддів. Власниця: «забрати в назві Велика палата». */
    { label: { uk: "Склад", en: "Formation" }, value: { uk: "17 суддів", en: "17 judges" } },
    { label: { uk: "Рішення по суті", en: "Merits judgment" }, value: { uk: "9 липня 2025", en: "9 July 2025" } },
    {
      label: { uk: "Сатисфакція", en: "Just satisfaction" },
      value: { uk: "винесена в окрему стадію", en: "reserved to a separate phase" },
    },
  ],

  timelineTracks: [
    { id: "background", label: { uk: "Передісторія", en: "Background" } },
    { id: "proceedings", label: { uk: "Провадження", en: "Proceedings" } },
    { id: "judgment", label: { uk: "Рішення і далі", en: "Judgment and after" } },
  ],

  /* Карта закриває розділ фактичних обставин – див. `mapAfterPart`
     у summaries/types.ts. */
  mapAfterPart: 0,

  timeline: [
    {
      date: { uk: "лист. 2013 – лют. 2014", en: "Nov 2013 – Feb 2014" },
      iso: "2014-02-22",
      track: "background",
      kind: "context",
      label: { uk: "Євромайдан; Янукович виїжджає до Росії", en: "Euromaidan; Yanukovych departs for Russia" },
    },
    {
      date: { uk: "квіт. 2014", en: "Apr 2014" },
      iso: "2014-04-07",
      track: "background",
      kind: "context",
      label: { uk: "Озброєні групи захоплюють схід; проголошено «ДНР»", en: "Armed groups seize the east; the \"DPR\" is proclaimed" },
      note: {
        uk: "6–12 квітня – захоплення СБУ в Луганську, ОДА в Донецьку, Слов'янська групою Гіркіна; 14 квітня Україна починає АТО.",
        en: "6–12 April: the Luhansk SBU, the Donetsk administration and Sloviansk (Girkin's group) are seized; on 14 April Ukraine launches the ATO.",
      },
    },
    {
      date: { uk: "11 трав. 2014", en: "11 May 2014" },
      iso: "2014-05-11",
      track: "background",
      kind: "order",
      label: {
        uk: "З цієї дати Росія має фактичний контроль над районами «ДНР»/«ЛНР»",
        en: "From this date Russia has effective control of the \"DPR\"/\"LPR\" areas",
      },
      note: {
        uk: "Висновок Суду: на момент «референдумів» сепаратистську операцію в цілому вже керувала і координувала Росія – відтоді їхні дії присвоюються їй автоматично.",
        en: "The Court's finding: by the \"referendum\" date the separatist operation was managed and coordinated by Russia – from then on their acts are automatically attributable to it.",
      },
    },
    {
      date: { uk: "17 лип. 2014", en: "17 Jul 2014" },
      iso: "2014-07-17",
      track: "background",
      kind: "context",
      label: { uk: "Збиття MH17: 298 загиблих", en: "MH17 is downed: 298 dead" },
      note: {
        uk: "Ракета «Бук», передана Росією сепаратистам, – серед доказів масштабного військового постачання, встановленого Судом. 196 загиблих – громадяни Нідерландів.",
        en: "The Buk missile Russia supplied to the separatists is among the evidence of large-scale military supply the Court established. 196 of the dead were Dutch nationals.",
      },
    },
    {
      date: { uk: "2014–2022", en: "2014–2022" },
      iso: "2020-07-10",
      track: "proceedings",
      kind: "filing",
      label: {
        uk: "Чотири заяви: Україна (2014, 2016, 2022), Нідерланди (2020)",
        en: "Four applications: Ukraine (2014, 2016, 2022), the Netherlands (2020)",
      },
      note: {
        uk: "Суд об'єднав їх в одне провадження; слухання щодо юрисдикції – 26 січня 2022 року.",
        en: "The Court joined them in one proceeding; the jurisdiction hearing was held on 26 January 2022.",
      },
    },
    {
      date: { uk: "24 лют. 2022", en: "24 Feb 2022" },
      iso: "2022-02-24",
      track: "background",
      kind: "context",
      label: { uk: "Повномасштабне вторгнення", en: "The full-scale invasion" },
      note: {
        uk: "Наступ на чотирьох напрямках; облога Маріуполя до 20 травня; захоплення ЗАЕС; з жовтня – кампанія ударів по енергетиці.",
        en: "Four axes of advance; the siege of Mariupol until 20 May; the seizure of the ZNPP; from October, the energy-strike campaign.",
      },
    },
    {
      date: { uk: "16 бер. / 16 вер. 2022", en: "16 Mar / 16 Sep 2022" },
      iso: "2022-09-16",
      track: "proceedings",
      kind: "order",
      label: {
        uk: "Росію виключено з Ради Європи; Конвенція перестає для неї діяти",
        en: "Russia is expelled from the Council of Europe; the Convention ceases to bind it",
      },
      note: {
        uk: "Суд зберігає юрисдикцію щодо всього до 16 вересня 2022 року – саме до цієї межі сягає рішення.",
        en: "The Court keeps jurisdiction over everything before 16 September 2022 – the judgment reaches exactly that far.",
      },
    },
    {
      date: { uk: "25 січ. 2023", en: "25 Jan 2023" },
      iso: "2023-01-25",
      track: "proceedings",
      kind: "order",
      label: { uk: "Велика палата визнає заяви прийнятними", en: "The Grand Chamber declares the applications admissible" },
    },
    {
      date: { uk: "9 лип. 2025", en: "9 Jul 2025" },
      iso: "2025-07-09",
      track: "judgment",
      kind: "judgment",
      label: {
        uk: "Рішення по суті: Росія відповідальна за системні порушення",
        en: "Merits judgment: Russia responsible for systemic violations",
      },
      /* The 16–1 was attached to the wrong thing here. Checked against the
         judgment's operative part (pp. 493–497, after § 1652): every one of
         the breach findings was unanimous. Twenty-eight of the twenty-nine
         operative points were unanimous, and the exception – point 9 – is not
         a breach at all but the decision that it was not necessary to examine
         the Article 13 complaint separately in respect of MH17. As written
         the sentence said one of the twelve violations had a dissenter. */
      note: {
        uk: "Порушення 12 статей Конвенції і протоколів – усі одностайно. З 29 пунктів резолютивної частини 28 ухвалено одностайно; виняток – рішення не розглядати одну скаргу окремо (16 голосів проти 1).",
        en: "Breaches of 12 Convention and Protocol articles, every one unanimous. Twenty-eight of the twenty-nine operative points were unanimous; the exception is a decision not to examine one complaint separately (16 votes to 1).",
      },
    },
    {
      date: { uk: "попереду", en: "ahead" },
      iso: "2026-01-01",
      track: "judgment",
      kind: "context",
      label: { uk: "Стадія справедливої сатисфакції", en: "The just-satisfaction phase" },
      note: {
        uk: "Компенсації Суд визначить окремим рішенням; виконання наглядає Комітет міністрів РЄ.",
        en: "Compensation will be fixed by a separate ruling; execution is supervised by the CoE Committee of Ministers.",
      },
    },
  ],

  /* Strasbourg, which is where this Court sits. `forumKey` names the marker
     the seat is drawn on and the label beside it comes from `forum.seat`
     above – so with "hague" here the map printed «Страсбург» / "Strasbourg"
     over The Hague's point, and framed the picture from the wrong city. */
  mapFocus: { forumKey: "strasbourg", reachTo: "donetsk" },

  theatres: [
    {
      place: { uk: "Донбас із 2014", en: "The Donbas from 2014" },
      tag: { uk: "КОНТРОЛЬ З 11.05.2014", en: "CONTROL FROM 11 MAY 2014" },
      markerKeys: ["donetsk", "luhansk"],
      areas: ["east"],
      summary: {
        uk: "Фактичний контроль Росії над районами «ДНР»/«ЛНР»; збиття MH17 17 липня 2014 року.",
        en: "Russia's effective control of the \"DPR\"/\"LPR\" areas; the downing of MH17 on 17 July 2014.",
      },
    },
    {
      place: { uk: "Уся Україна з 2022", en: "All of Ukraine from 2022" },
      tag: { uk: "ВТОРГНЕННЯ", en: "INVASION" },
      markerKeys: ["kyiv"],
      areas: ["country"],
      summary: {
        uk: "Повномасштабне вторгнення 24 лютого 2022 року – охоплене рішенням до 16 вересня 2022-го.",
        en: "The full-scale invasion of 24 February 2022 – covered by the judgment up to 16 September 2022.",
      },
    },
  ],

  interpretations: [
    {
      term: { uk: "Конвенція діє і на війні", en: "The Convention applies in war" },
      ruling: {
        uk: "Конвенція застосовується в ситуаціях збройного конфлікту, її гарантії не витісняються МГП, а тлумачаться в гармонії з ним (ст. 31(3)(c) ВКПМД).",
        en: "The Convention applies in armed conflict; IHL does not displace its guarantees – the two are interpreted in harmony (VCLT art. 31(3)(c)).",
      },
    },
    {
      term: { uk: "Відхід від Georgia v. Russia (II)", en: "The turn from Georgia v. Russia (II)" },
      ruling: {
        uk: "«Контекст хаосу» більше не виключає юрисдикцію: стратегічно спланована кампанія нападів – це здійснення влади і контролю, тож Конвенція діє й в активній фазі бойових дій.",
        en: "\"Context of chaos\" no longer defeats jurisdiction: a strategically planned campaign of attacks is an exercise of authority and control, so the Convention reaches the active phase of hostilities.",
      },
    },
    {
      term: { uk: "Персональна юрисдикція через летальну силу", en: "Personal jurisdiction through lethal force" },
      ruling: {
        uk: "Держава, що застосовує летальну силу на території іншої держави і вбиває особу, здійснює над нею владу і контроль – Конвенція застосовується за ст. 1.",
        en: "A State that uses lethal force on another State's territory and kills a person exercises authority and control over them – the Convention applies under Article 1.",
      },
    },
    {
      term: { uk: "Автоматичне присвоєння", en: "Automatic attribution" },
      ruling: {
        uk: "Після встановлення фактичного контролю дії та бездіяльність сепаратистів присвоюються Росії автоматично – окремого доказування по кожному епізоду не потрібно.",
        en: "Once effective control is established, the separatists' acts and omissions are attributable to Russia automatically – no episode-by-episode proof is needed.",
      },
    },
    {
      term: { uk: "Межа юрисдикції: 16.09.2022", en: "The jurisdictional edge: 16 Sep 2022" },
      ruling: {
        uk: "Виключення з Ради Європи не звільнило Росію від відповідальності за минуле: Суд розглядає все до дати, коли Конвенція перестала для неї діяти.",
        en: "Expulsion from the Council of Europe did not erase past responsibility: the Court examines everything up to the date the Convention ceased to bind Russia.",
      },
    },
  ],

  sources: [
    // – official record –
    {
      url: "https://hudoc.echr.coe.int/eng#{%22appno%22:[%2243800/14%22],%22itemid%22:[%22001-244292%22]}",
      title: "Ukraine and the Netherlands v. Russia [GC] – merits judgment (HUDOC)",
      authors: "",
      publication: "European Court of Human Rights",
      date: "9 July 2025",
      type: "official/award",
    },
    {
      url: "https://www.echr.coe.int/w/ukraine-and-the-netherlands-v.-russia-nos.-8019/16-43800/14-and-28525/20-1",
      title: "Case page: Ukraine and the Netherlands v. Russia (nos. 8019/16, 43800/14, 28525/20 and 11055/22)",
      authors: "",
      publication: "European Court of Human Rights",
      date: "2025",
      type: "official/award",
    },
    {
      url: "https://jusmundi.com/en/document/decision/en-ukraine-and-the-netherlands-v-russian-federation-decision-of-the-grand-chamber-of-the-european-court-of-human-rights-wednesday-25th-january-2023",
      title: "Admissibility decision of the Grand Chamber (25 January 2023)",
      authors: "",
      publication: "Jus Mundi",
      date: "25 January 2023",
      type: "official/award",
    },
    // – the doc's research links –
    {
      url: "https://www.ejiltalk.org/harmonious-interpretation-lex-specialis-and-ihl-compliance-in-ukraine-and-the-netherlands-v-russia-an-open-question-on-the-right-to-life/",
      title: "Harmonious Interpretation, Lex Specialis, and IHL-Compliance: An Open Question on the Right to Life",
      authors: "Miles Jackson, Dapo Akande",
      publication: "EJIL: Talk!",
      date: "2025",
      type: "blog post",
    },
    {
      url: "https://www.ejiltalk.org/grand-chamber-judgment-in-ukraine-and-the-netherlands-v-russia-forthcoming-next-week/",
      title: "Grand Chamber Judgment in Ukraine and the Netherlands v. Russia Forthcoming Next Week",
      authors: "Marko Milanovic",
      publication: "EJIL: Talk!",
      date: "2025",
      type: "blog post",
    },
    {
      url: "https://www.ejiltalk.org/the-european-courts-merits-judgment-in-ukraine-and-the-netherlands-v-russia-as-good-as-it-gets-almost/",
      title: "The European Court's Merits Judgment in Ukraine and the Netherlands v. Russia: As Good as It Gets (Almost)",
      authors: "Marko Milanovic",
      publication: "EJIL: Talk!",
      date: "2025",
      type: "blog post",
    },
    {
      url: "https://www.ejiltalk.org/control-in-the-context-of-chaos-the-war-in-ukraine-and-russias-jurisdiction-under-the-echr/",
      title: "Control in the Context of Chaos: The War in Ukraine and Russia's Jurisdiction under the ECHR",
      authors: "",
      publication: "EJIL: Talk!",
      date: "2022",
      type: "blog post",
    },
    {
      url: "https://www.ejiltalk.org/non-recognition-of-de-facto-regimes-in-case-law-of-the-european-court-of-human-rights-implications-for-cases-involving-crimea-and-eastern-ukraine/",
      title: "(Non-)Recognition of De Facto Regimes in Case Law of the ECtHR: Implications for Crimea and Eastern Ukraine",
      authors: "Gaiane Nuridzhanian",
      publication: "EJIL: Talk!",
      date: "2022",
      type: "blog post",
    },
    // – context added by this page –
    {
      url: "https://strasbourgobservers.com/2025/07/23/the-judgment-in-ukraine-and-the-netherlands-v-russia-a-nicaragua-moment-for-the-ecthr/",
      title: "The Judgment in Ukraine and the Netherlands v. Russia: A \"Nicaragua Moment\" for the ECtHR?",
      authors: "",
      publication: "Strasbourg Observers",
      date: "23 July 2025",
      type: "blog post",
    },
    {
      url: "https://www.twentyessex.com/grand-chamber-of-the-european-court-of-human-rights-issues-judgment-in-ukraine-and-the-netherlands-v-russian-federation/",
      title: "Grand Chamber issues judgment in Ukraine and The Netherlands v Russian Federation",
      authors: "",
      publication: "Twenty Essex",
      date: "2025",
      type: "news/insight",
    },
    {
      url: "https://jurfem.com.ua/en/conflict-related-sexual-violence-in-the-ecthr-judgment-ukraine-and-the-netherlands-v-russia-a-historic-step-towards-accountability/",
      title: "Conflict-related sexual violence in the judgment: a historic step towards accountability",
      authors: "",
      publication: "JurFem",
      date: "2025",
      type: "news/insight",
    },
    {
      url: "https://ulag.org.ua/articles-and-publications/ecthr-ukraine-netherlands-v-russia/",
      title: "Analysis of the ECtHR Judgment in Ukraine and the Netherlands v. Russia",
      authors: "",
      publication: "Ukrainian Legal Advisory Group",
      date: "2025",
      type: "news/insight",
    },
    {
      url: "https://queritius.com/landmark-for-justice-key-legal-takeaways-from-the-echr-grand-chambers-judgment-in-ukraine-and-the-netherlands-v-russia/",
      title: "Landmark for Justice: Key Legal Takeaways from the Grand Chamber's Judgment",
      authors: "",
      publication: "Queritius",
      date: "2025",
      type: "news/insight",
    },
  ],
};
