import type { DecisionSummary, SummaryBlock } from "./types";
import verbatim from "./finland-torden.verbatim.json";
import verbatimUk from "./finland-torden.uk.json";

/**
 * The court's name first, the earlier one after it.
 *
 * The Helsinki District Court's decision bulletin of 14 March 2025 calls the
 * defendant Torden in every count; he changed his name legally and travelled
 * under it. "Yan Petrovsky" is what the sanctions lists and most of the
 * reporting use, so it is not dropped – it is given once, on the first
 * mention, and once more where it is the point, because he was sanctioned
 * under one name and boarded the flight under the other.
 *
 * Finland v. Voislav Torden (formerly Yan Petrovsky), Helsinki District
 * Court,
 * judgment of 14 March 2025 – the first universal-jurisdiction war-crimes
 * conviction over Ukraine in Finland.
 *
 * The verbatim body is the doc's tab (not yet marked finalized; re-ingest
 * when it is). The tab describes the arrest, the five charges and the
 * jurisdictional basis; the verdict itself – conviction on four of five
 * charges, life imprisonment, the announced appeal – is context with its own
 * sources, kept in the verdict matrix, the timeline and
 * docs/research/finland-torden-sources.md.
 */
export const finlandTorden: DecisionSummary = {
  ...(verbatim as {
    id: string;
    caseId: string;
    masthead: { official: string; parties: string; judgment: string };
    blocks: SummaryBlock[];
  }),
  blocksUk: (verbatimUk as { blocks: SummaryBlock[] }).blocks,

  title: {
    uk: "Фінляндія проти Воїслава Тордена",
    en: "Finland v. Voislav Torden",
  },
  /* The share card's wording (scripts/og-cards.mts). Carried over from the
     hand-drawn cards so the redrawn ones say the same – except the name: the
     old card still read «проти Яна Петровського» after the page had moved to
     the name he was tried under, which is the drift a hand-kept card invites. */
  card: {
    title: "Фінляндія проти Воїслава Тордена",
    eyebrow: "Окружний суд Гельсінкі · 14 березня 2025",
    kicker: "Довічне за воєнні злочини – універсальна юрисдикція",
  },
  /* The masthead in Ukrainian – the caption under the title and the line
     in the eyebrow. `masthead` keeps the decision's own English, which is
     what the citation block reproduces; this is what a Ukrainian reader
     sees at the top of the page. See `mastheadUk` in summaries/types.ts. */
  mastheadUk: {
    official:
      "Фінляндія проти Яна Петровського (Воїслава Тордена) – переслідування за воєнні злочини на підставі універсальної юрисдикції, окружний суд Гельсінкі",
    judgment: "Вирок від 14 березня 2025",
  },

  asOf: "2026-08-22",

  forum: {
    institution: { uk: "Окружний суд Гельсінкі", en: "Helsinki District Court" },
    seat: { uk: "Гельсінкі", en: "Helsinki" },
  },

  /* Search-result description. `plain.tldr` used to serve as this and runs
     three to four sentences, so the snippet was cut off mid-word. */
  metaDesc: {
    uk: "Вирок Окружного суду Гельсінкі від 14 березня 2025: довічне ув'язнення Воїславу Тордену («Торден») за воєнні злочини – універсальна юрисдикція.",
    en: "Helsinki District Court, 14 March 2025: life imprisonment for Voislav Torden for war crimes in Ukraine, under universal jurisdiction.",
  },

  plain: {
    tldr: {
      uk: "Воїслав Торден (раніше Ян Петровський) – заступник командира російського неонацистського загону «Русич». У вересні 2014-го його підрозділ під українським прапором влаштував засідку на батальйон «Айдар»: щонайменше 22 загиблих. У 2023 році Фінляндія затримала його в аеропорту Гельсінкі, а 14 березня 2025 року засудила до довічного ув'язнення за воєнні злочини – за універсальною юрисдикцією, хоча злочини скоєно в Україні проти українців.",
      en: "Voislav Torden (formerly Yan Petrovsky) was deputy commander of the Russian neo-Nazi unit Rusich. In September 2014 his unit ambushed the Aidar battalion under a Ukrainian flag: at least 22 dead. Finland arrested him at Helsinki airport in 2023 and on 14 March 2025 sentenced him to life imprisonment for war crimes – under universal jurisdiction, though the crimes were committed in Ukraine against Ukrainians.",
    },
  },


  /*
   * NEITHER of these links is a court document, and the page must not pretend
   * otherwise. The Helsinki District Court's judgment of 14 March 2025 is not
   * published anywhere we can link – the registry row `fi-38` records that
   * with `decisionUrl: null`, and this page now says the same thing out loud.
   *
   * `url` is Sorcha MacLeod and Iryna Marchuk's EJIL:Talk! analysis and
   * `caseUrl` is Ukrainska Pravda's report of the verdict; both are listed in
   * `sources` below, which is where the page reads their publisher and kind
   * from. Before `urlType`/`caseUrlType` existed the template printed
   * "Окружний суд Гельсінкі" as the caption under the EJIL:Talk! button and
   * told search engines, in JSON-LD, that the court had authored the
   * Ukrainska Pravda article.
   */
  judgment: {
    court: { uk: "Окружний суд Гельсінкі", en: "Helsinki District Court" },
    url: "https://www.ejiltalk.org/prosecuting-members-of-russian-mercenary-groups-for-war-crimes-a-remedy-for-victims/",
    urlType: "blog post",
    caseUrl: "https://www.pravda.com.ua/eng/news/2025/03/14/7502855/",
    caseUrlType: "news/insight",
    date: "2025-03-14",
    readLabel: { uk: "Розбір справи (EJIL: Talk!)", en: "Case analysis (EJIL: Talk!)" },
    fileLabel: { uk: "Репортаж про вирок", en: "Report of the verdict" },
  },

  instruments: [
    {
      abbr: { uk: "КК Фінляндії", en: "Finnish Criminal Code" },
      name: {
        uk: "Кримінальний кодекс Фінляндії, глава 11, розділ 5(1) (212/2008)",
        en: "Finnish Criminal Code, Chapter 11, Section 5(1) (212/2008)",
      },
      year: 2008,
      url: "https://www.finlex.fi/en/legislation/translations/1889/eng/39-001",
    },
  ],

  stats: [
    { value: "5", label: { uk: "обвинувачень у воєнних злочинах", en: "war-crimes charges" } },
    { value: "22+", label: { uk: "українських військових убито в засідці", en: "Ukrainian soldiers killed in the ambush" } },
    {
      value: { uk: "довічне", en: "life" },
      label: { uk: "ув'язнення – вирок 14.03.2025", en: "imprisonment – the 14 Mar 2025 verdict" },
      em: true,
    },
    {
      value: { uk: "1-ше", en: "1st" },
      label: {
        uk: "у Фінляндії засудження за воєнні злочини проти України",
        en: "Finnish war-crimes conviction over Ukraine",
      },
    },
  ],

  glance: [
    { label: { uk: "Обвинувачення", en: "Prosecution" }, value: { uk: "Національна прокуратура Фінляндії", en: "Finnish National Prosecution Authority" } },
    { label: { uk: "Підсудний", en: "Accused" }, value: { uk: "Воїслав Торден", en: "Voislav Torden" } },
    { label: { uk: "Суд", en: "Court" }, value: { uk: "Окружний суд Гельсінкі", en: "Helsinki District Court" } },
    { label: { uk: "Підстава", en: "Basis" }, value: { uk: "універсальна юрисдикція", en: "universal jurisdiction" } },
    { label: { uk: "Події", en: "The events" }, value: { uk: "Донбас, 5 вересня 2014", en: "The Donbas, 5 September 2014" } },
    { label: { uk: "Вирок", en: "Judgment" }, value: { uk: "14 березня 2025", en: "14 March 2025" } },
  ],

  timeline: [
    {
      date: { uk: "5 вер. 2014", en: "5 Sep 2014" },
      iso: "2014-09-05",
      kind: "context",
      label: {
        uk: "Засідка «Русича» на колону «Айдару» під українським прапором",
        en: "Rusich ambushes the Aidar column under a Ukrainian flag",
      },
      note: {
        uk: "Щонайменше 22 українські військові загинули; поранених добивали, тіла нівечили і фотографували.",
        en: "At least 22 Ukrainian soldiers died; the wounded were killed, bodies mutilated and photographed.",
      },
    },
    {
      date: { uk: "лип. 2023", en: "Jul 2023" },
      iso: "2023-07-20",
      kind: "filing",
      label: {
        uk: "Затримання в аеропорту Гельсінкі під вигаданим ім'ям",
        en: "Arrested at Helsinki airport under an assumed name",
      },
      note: {
        uk: "Під санкціями як Ян Петровський, летів до Франції на ім'я Воїслав Торден.",
        en: "Sanctioned as Yan Petrovsky, he was travelling to France as Voislav Torden.",
      },
    },
    {
      date: { uk: "жовт. 2024", en: "Oct 2024" },
      iso: "2024-10-01",
      kind: "order",
      label: { uk: "П'ять обвинувачень у воєнних злочинах", en: "Five war-crimes charges" },
      note: {
        uk: "Від віроломного прапора до відмови в пощаді; потерпілі приєднали цивільні позови.",
        en: "From the perfidious flag to denying quarter; victims joined civil claims.",
      },
    },
    {
      date: { uk: "14 бер. 2025", en: "14 Mar 2025" },
      iso: "2025-03-14",
      kind: "judgment",
      label: {
        uk: "Вирок: винен за 4 з 5 пунктів, довічне ув'язнення",
        en: "Verdict: guilty on 4 of 5 charges, life imprisonment",
      },
      note: {
        uk: "Перше у Фінляндії засудження за воєнні злочини у війні проти України. Апеляцію подали обидві сторони.",
        en: "Finland's first war-crimes conviction from the war on Ukraine. Both sides appealed.",
      },
    },
  ],

  /* A district court trying an individual for war crimes has no "seat of
   arbitration". With one theatre and no heading of its own the template fell
   back to that label, so a criminal conviction was captioned with the
   vocabulary of an investor-state dispute. */


  /*
   * The seat is Helsinki, not The Hague. It was "hague", so the map drew a
   * gold dot on the Dutch coast, captioned it "Гельсінкі · Окружний суд
   * Гельсінкі", and ran the universal-jurisdiction reach line to the Donbas
   * from the wrong country – on a page whose whole subject is the distance
   * between the forum and the crime.
   *
   * Helsinki sits 171px above the atlas's default 0 0 1000 560 frame, so the
   * frame opens northwards to 215px above it (room for the seat label) and
   * closes at y = 425, below the Donbas theatre and its halo – Crimea and the
   * Mediterranean are not part of this case. The width grows to 1160 so the
   * band keeps roughly the atlas's landscape proportion (1.81 against 1.79)
   * instead of turning into a portrait.
   */
  mapFocus: { forumKey: "helsinki", reachTo: "luhansk" },

  theatres: [
    {
      place: { uk: "Донбас, вересень 2014", en: "The Donbas, September 2014" },
      tag: { uk: "ЗАСІДКА НА «АЙДАР»", en: "THE AIDAR AMBUSH" },
      markerKeys: ["luhansk"],
      summary: {
        uk: "Операція «Русича» 5 вересня 2014 року – п'ять обвинувачень, розглянутих у Гельсінкі.",
        en: "Rusich's operation of 5 September 2014 – the five charges tried in Helsinki.",
      },
    },
  ],

  interpretations: [
    {
      term: { uk: "Універсальна юрисдикція працює", en: "Universal jurisdiction works" },
      ruling: {
        uk: "Глава 11, розділ 5(1) КК Фінляндії дозволяє судити за воєнні злочини незалежно від місця вчинення і громадянств. Достатньо присутності підозрюваного на території держави.",
        en: "Chapter 11, Section 5(1) of the Finnish Criminal Code reaches war crimes wherever committed and whoever involved. The suspect's presence on the territory suffices.",
      },
    },
    {
      term: { uk: "Два джерела визначення", en: "A two-source definition" },
      ruling: {
        uk: "Фінське визначення воєнних злочинів поєднує Женевські конвенції I–IV з Протоколами I–II і Римський статут – національний суд застосовує ті самі категорії, що й МКС.",
        en: "Finland's war-crimes definition joins Geneva Conventions I–IV with Protocols I–II and the Rome Statute – a national court applying the ICC's own categories.",
      },
    },
    {
      term: { uk: "Пости як злочин", en: "Posts as a crime" },
      ruling: {
        uk: "Пункт про відмову в пощаді ґрунтується на заявах у соцмережах («полонених не братимемо») – оголошення само по собі є воєнним злочином.",
        en: "The denying-quarter charge rests on social-media declarations (\"no prisoners\") – the announcement itself is the war crime.",
      },
    },
  ],

  sources: [
    {
      url: "https://www.ejiltalk.org/prosecuting-members-of-russian-mercenary-groups-for-war-crimes-a-remedy-for-victims/",
      title: "Prosecuting Members of Russian Mercenary Groups for War Crimes, a Remedy for Victims?",
      authors: "Sorcha MacLeod, Iryna Marchuk",
      publication: "EJIL: Talk!",
      date: "2025",
      type: "blog post",
    },
    {
      url: "https://sanctions-finder.com/sanction/velikiy-slavyan/Velikiy%20Slavyan",
      title: "Information about the accused (sanctions profile)",
      authors: "",
      publication: "Sanctions Finder",
      date: "",
      type: "news/insight",
    },
    {
      url: "https://www.pravda.com.ua/eng/news/2025/03/14/7502855/",
      title: "Court in Finland sentences Rusich group commander to life imprisonment for war crimes in Ukraine",
      authors: "",
      publication: "Ukrainska Pravda",
      date: "14 March 2025",
      type: "news/insight",
    },
    {
      url: "https://www.themoscowtimes.com/2025/03/14/finnish-court-sentences-russian-ultranationalist-to-life-in-prison-for-war-crimes-in-ukraine-a88362",
      title: "Finnish Court Sentences Russian Ultranationalist to Life in Prison for War Crimes in Ukraine",
      authors: "",
      publication: "The Moscow Times",
      date: "14 March 2025",
      type: "news/insight",
    },
    {
      url: "https://www.aljazeera.com/amp/news/2025/3/14/finnish-court-convicts-russian-man-for-war-crimes-in-ukraine",
      title: "Finnish court convicts Russian man for war crimes in Ukraine (guilty on four of five charges)",
      authors: "",
      publication: "Al Jazeera",
      date: "14 March 2025",
      type: "news/insight",
    },
    {
      url: "https://www.finlex.fi/en/legislation/translations/1889/eng/39-001",
      title: "The Criminal Code of Finland (translation) – Chapter 11",
      authors: "",
      publication: "Finlex",
      date: "",
      type: "official/treaty",
    },
  ],
};
