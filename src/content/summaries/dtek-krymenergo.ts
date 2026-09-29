import type { DecisionSummary, SummaryBlock } from "./types";
import verbatim from "./dtek-krymenergo.verbatim.json";
import verbatimUk from "./dtek-krymenergo.uk.json";

/**
 * JSC DTEK Krymenergo v. The Russian Federation, PCA Case No. 2018-41,
 * Award of 1 November 2023.
 *
 * `verbatim` is the doc's DTEK tab as ingested – including its quirks (a
 * Cyrillic "с" in "enactсed", stray footnote digits, a dispositif that ends
 * on "; and"): the tab is not yet marked finalized in the source doc, and the
 * page will re-ingest when it is. The visualization layer follows the same
 * two rules as Oschadbank: everything up to the dispositif restates the
 * Award; everything after 1 November 2023 – the US confirmation, the Dutch
 * seizure of Gazprom International shares – is enforcement record with its
 * own citations, kept in `afterlife`, the timeline and `sources`.
 */
export const dtekKrymenergo: DecisionSummary = {
  ...(verbatim as {
    id: string;
    caseId: string;
    masthead: { official: string; parties: string; judgment: string };
    blocks: SummaryBlock[];
  }),
  // Ukrainian translation of the body, structurally 1:1 (50 blocks) – draft,
  // pending legal review.
  blocksUk: (verbatimUk as { blocks: SummaryBlock[] }).blocks,

  title: {
    uk: "ДТЕК Крименерго проти Російської Федерації",
    en: "JSC DTEK Krymenergo v. the Russian Federation",
  },
  /* The share card's wording (scripts/og-cards.mts). Carried over from the
     hand-drawn cards so the redrawn ones say the same. */
  card: {
    title: "ДТЕК Крименерго проти РФ",
    eyebrow: "Постійна палата третейського суду · 1 листопада 2023",
    kicker: "$207,8 млн + відсотки за кримську енергомережу",
  },
  /* The masthead in Ukrainian – the caption under the title and the line
     in the eyebrow. `masthead` keeps the decision's own English, which is
     what the citation block reproduces; this is what a Ukrainian reader
     sees at the top of the page. See `mastheadUk` in summaries/types.ts. */
  mastheadUk: {
    official:
      "Арбітраж ad hoc перед трибуналом, сформованим за Угодою між Урядом Російської Федерації та Кабінетом Міністрів України про заохочення та взаємний захист інвестицій від 27 листопада 1998 року і за Арбітражним регламентом Комісії ООН з права міжнародної торгівлі 1976 року",
    judgment: "Арбітражне рішення від 1 листопада 2023",
  },

  asOf: "2026-08-22",

  /* Справу вирішував арбітражний трибунал за регламентом ЮНСІТРАЛ, а не
     суд: ППТС адмініструє провадження, але не ухвалює рішення. Огляд каже
     «Трибунал» власними словами, а підпис над тим самим абзацом казав
     «Позиція Суду». */
  positionLabel: { uk: "Позиція Трибуналу", en: "The tribunal's position" },
  forum: {
    institution: {
      uk: "Постійна палата третейського суду",
      en: "Permanent Court of Arbitration",
    },
    seat: { uk: "Гаага", en: "The Hague" },
  },

  plain: {
    tldr: {
      uk: "«Крименерго» – кримський енергооператор групи ДТЕК: 27 тисяч км² мережі, понад 780 тисяч споживачів. У 2015 році Росія забрала компанію. Арбітраж у Гаазі відхилив усі п'ять заперечень Росії і визнав незаконну експропріацію: 207,8 млн доларів відшкодування плюс відсотки – разом близько 267 млн. Росія добровільно не платить, тож ДТЕК стягує борг через суди США і Нідерландів – аж до арешту акцій структур «Газпрому».",
      en: "Krymenergo was DTEK's Crimean grid operator: 27,000 km² of network, more than 780,000 customers. In 2015 Russia took the company. A tribunal in The Hague rejected all five of Russia's objections and found an unlawful expropriation: USD 207.8 million in damages plus interest – about USD 267 million in all. Russia has not paid, so DTEK is enforcing through US and Dutch courts – up to the seizure of Gazprom-linked shares.",
    },
  },

  judgment: {
    court: { uk: "Постійна палата третейського суду", en: "Permanent Court of Arbitration" },
    url: "https://www.italaw.com/sites/default/files/case-documents/180426.pdf",
    caseUrl: "https://www.iareporter.com/arbitration-cases/dtek-krymenergo-v-russia/",
    date: "2023-11-01",
    readLabel: { uk: "Читати рішення", en: "Read the award" },
    fileLabel: { uk: "Матеріали справи", en: "Case documents" },
  },

  instruments: [
    {
      abbr: "BIT",
      name: {
        uk: "Угода між Урядом РФ і Кабінетом Міністрів України про заохочення та взаємний захист інвестицій",
        en: "Agreement between the Government of the Russian Federation and the Cabinet of Ministers of Ukraine on the Encouragement and Mutual Protection of Investments",
      },
      year: 1998,
      url: "https://jusmundi.com/en/document/treaty/en-agreement-between-the-governement-of-the-russian-federation-and-the-cabinet-of-ministers-of-the-ukraine-on-the-encouragement-and-mutual-protection-of-investments-russian-federation-ukraine-bit-1998-friday-27th-november-1998",
    },
    {
      abbr: "UNCITRAL Rules",
      name: { uk: "Арбітражний регламент ЮНСІТРАЛ", en: "UNCITRAL Arbitration Rules" },
      year: 1976,
      url: "https://jusmundi.com/en/document/rule/en-uncitral-arbitration-rules-1976-uncitral-arbitration-rules-1976",
    },
  ],

  stats: [
    {
      value: { uk: "$207,8 млн", en: "$207.8M" },
      // "+ відсотки" read as though 207.8M already contained the interest,
      // which is what the amounts block, the FAQ and the tldr two screens
      // below all deny: 207.8M is the damages figure, interest runs on top of
      // it from the day of the taking, and ≈267M is the two together at the
      // award date. This tile is the one number a scanning reader leaves with.
      label: {
        uk: "відшкодування, без відсотків з 22.01.2015",
        en: "damages, before interest from 22 Jan 2015",
      },
      em: true,
    },
    { value: "5", label: { uk: "заперечень Росії – всі відхилено", en: "objections by Russia – all rejected" } },
    {
      value: { uk: "27 000 км²", en: "27,000 km²" },
      label: { uk: "території обслуговувала мережа", en: "of territory the grid served" },
    },
    {
      value: { uk: "780 000+", en: "780,000+" },
      label: { uk: "споживачів електроенергії", en: "electricity consumers" },
    },
  ],

  glance: [
    { label: { uk: "Позивач", en: "Claimant" }, value: { uk: "АТ «ДТЕК Крименерго»", en: "JSC DTEK Krymenergo" } },
    { label: { uk: "Відповідач", en: "Respondent" }, value: { uk: "Російська Федерація", en: "Russian Federation" } },
    {
      label: { uk: "Установа", en: "Institution" },
      value: { uk: "ПАС (ad hoc)", en: "PCA (ad hoc)" },
    },
    { label: { uk: "Місце арбітражу", en: "Seat" }, value: { uk: "Гаага", en: "The Hague" } },
    { label: { uk: "Регламент", en: "Rules" }, value: { uk: "ЮНСІТРАЛ, 1976", en: "UNCITRAL, 1976" } },
    { label: { uk: "Рішення", en: "Award" }, value: { uk: "1 листопада 2023", en: "1 November 2023" } },
  ],

  timelineTracks: [
    { id: "background", label: { uk: "Передісторія", en: "Background" } },
    { id: "arbitration", label: { uk: "Арбітраж", en: "Arbitration" } },
    { id: "enforcement", label: { uk: "Стягнення", en: "Enforcement" } },
  ],

  /* Карта закриває розділ фактичних обставин – див. `mapAfterPart`
     у summaries/types.ts. */
  mapAfterPart: 0,

  timeline: [
    {
      date: { uk: "2006–2012", en: "2006–2012" },
      iso: "2012-12-31",
      track: "background",
      kind: "context",
      label: { uk: "Група ДТЕК набуває 57,6% «Крименерго»", en: "DTEK group acquires 57.6% of Krymenergo" },
      note: {
        uk: "Кримський оператор входить до найбільшого приватного енергохолдингу України.",
        en: "The Crimean operator joins Ukraine's largest private power group.",
      },
    },
    {
      date: { uk: "лют.–бер. 2014", en: "Feb–Mar 2014" },
      iso: "2014-03-01",
      track: "background",
      kind: "context",
      label: { uk: "Росія встановлює контроль над Кримом", en: "Russia takes control of Crimea" },
      note: {
        uk: "Від зайняття будівлі Держради 27 лютого до федерального конституційного закону 21 березня 2014 року.",
        en: "From the seizure of the State Council building on 27 February to the federal constitutional law of 21 March 2014.",
      },
    },
    {
      date: { uk: "22 січ. 2015", en: "22 Jan 2015" },
      iso: "2015-01-22",
      track: "background",
      kind: "context",
      label: { uk: "Росія забирає компанію – дата, з якої біжать відсотки", en: "Russia takes the company – the date interest runs from" },
      note: {
        uk: "Адміністративні й законодавчі заходи, виконані «місцевими судами і фізичною силою». Саме з цього дня диспозитив нараховує відсотки.",
        en: "Administrative and legislative measures enforced \"through local courts and physical force\". The dispositif runs interest from this day.",
      },
    },
    {
      date: { uk: "16 лют. 2018", en: "16 Feb 2018" },
      iso: "2018-02-16",
      track: "arbitration",
      kind: "filing",
      label: { uk: "ДТЕК подає позов", en: "DTEK files the claim" },
      note: {
        uk: "Вимога – не менш як 421,2 млн доларів. Росія, на відміну від справи Ощадбанку, бере участь у процесі.",
        en: "The claim: at least USD 421.2 million. Unlike in Oschadbank, Russia takes part in the proceedings.",
      },
    },
    {
      date: { uk: "1 лист. 2023", en: "1 Nov 2023" },
      iso: "2023-11-01",
      track: "arbitration",
      kind: "judgment",
      label: {
        uk: "Рішення: незаконна експропріація, 207,8 млн + відсотки",
        en: "Award: unlawful expropriation, USD 207.8M plus interest",
      },
      note: {
        uk: "Усі п'ять заперечень відхилено; порушено статті 2, 3 і 5 ДІД; з відсотками – близько 267 млн доларів.",
        en: "All five objections rejected; Articles 2, 3 and 5 of the BIT breached; about USD 267 million with interest.",
      },
    },
    {
      date: { uk: "7 лист. 2023", en: "7 Nov 2023" },
      iso: "2023-11-07",
      track: "enforcement",
      kind: "order",
      label: { uk: "Клопотання про визнання рішення у суді США", en: "Petition to confirm filed in US federal court" },
      note: {
        uk: "Окружний суд округу Колумбія, за Нью-Йоркською конвенцією – через шість днів після рішення.",
        en: "The DC federal court, under the New York Convention – six days after the award.",
      },
    },
    {
      date: { uk: "лют. 2026", en: "Feb 2026" },
      iso: "2026-02-15",
      track: "enforcement",
      kind: "order",
      label: { uk: "Апеляційний суд США відмовляє Росії в імунітеті", en: "US Court of Appeals denies Russia immunity" },
      note: {
        uk: "У квітні 2026-го той самий суд відхилив і прохання Росії про зупинку виконання у «кримських» справах.",
        en: "In April 2026 the same court declined Russia's request for a stay of mandate in the Crimea cases.",
      },
    },
    {
      date: { uk: "бер. 2026", en: "Mar 2026" },
      iso: "2026-03-15",
      track: "enforcement",
      kind: "judgment",
      label: {
        uk: "Нідерланди: підтверджено арешт акцій Gazprom International",
        en: "Netherlands: seizure of Gazprom International shares confirmed",
      },
      note: {
        uk: "Апеляційний суд підтвердив арешт на виконання рішення; у травні 2026-го суд відмовився заборонити переміщення активів структури «Газпрому» до Угорщини.",
        en: "The appeals court confirmed the seizure in satisfaction of the award; in May 2026 a Dutch court declined to enjoin a Gazprom unit from moving assets to Hungary.",
      },
    },
  ],

  mapFocus: { forumKey: "hague", reachTo: "crimea" },

  theatres: [
    {
      place: { uk: "Крим", en: "Crimea" },
      tag: { uk: "ЕНЕРГОМЕРЕЖА", en: "POWER GRID" },
      markerKeys: ["crimea"],
      areas: ["crimea"],
      summary: {
        uk: "23 районні та 2 міські мережі, 27 000 км², 780 000+ споживачів – усе вилучено у 2015 році.",
        en: "23 district and 2 municipal networks, 27,000 km², 780,000+ consumers – all taken in 2015.",
      },
    },
  ],

  takings: {
    heading: { uk: "Що було вилучено", en: "What was taken" },
    note: {
      uk: "Масштаб компанії – з фактичних висновків рішення: єдиний оператор розподілу електроенергії на півострові.",
      en: "The company's scale, from the award's findings of fact: the peninsula's power-distribution operator.",
    },
    metrics: [
      {
        label: { uk: "Території обслуговування", en: "Territory served" },
        value: { uk: "≈ 27 000 км²", en: "≈ 27,000 km²" },
      },
      {
        label: { uk: "Споживачів", en: "Consumers" },
        value: { uk: "780 000+", en: "780,000+" },
      },
      {
        label: { uk: "Електромереж", en: "Electric networks" },
        value: "23 + 2",
        note: { uk: "районні + міські", en: "district + municipal" },
      },
      {
        label: { uk: "Частка групи ДТЕК", en: "DTEK group's stake" },
        value: { uk: "57,6%", en: "57.6%" },
        percent: 57.6,
        note: { uk: "набута у 2006–2012 роках", en: "acquired in 2006–2012" },
      },
    ],
  },

  amounts: {
    note: {
      uk: "Просили не менш як 421,2 млн; присуджено 207,8 млн (більшістю) плюс відсотки з дня вилучення – разом близько 267 млн на день рішення. Стягнення йде через суди США і Нідерландів.",
      en: "At least 421.2M was claimed; 207.8M awarded (by majority) plus interest from the day of the taking – about 267M at the award date. Enforcement runs through US and Dutch courts.",
    },
    // NOTATION. Every `display` here is a pair, because Ukrainian and English
    // group and point numbers differently and this card printed one notation
    // to both readers. Ukrainian groups with a space and takes a comma for the
    // decimal – $10 764 067,64; English groups with a comma and takes a
    // point – $10,764,067.64. The symbol leads in both, which is what the
    // stats tiles above ("$207,8 млн" / "$207.8M") and the holdings row
    // already do. Before this the bars mixed all three systems on one card:
    // ASCII-space grouping on the totals, comma-and-cents on the parts of one
    // of them, so the same figure was written two ways side by side.
    //
    // The `amount` fields carry the exact cents too. They only scale the bars,
    // but rounding them to whole dollars made the two costs parts sum to
    // 10 764 068 against a total of 10 764 067 – a one-dollar gap with no
    // source behind it. The award's own figures are exact; they are used.
    figures: [
      {
        label: { uk: "Вимога позивача", en: "Claimed" },
        display: { uk: "≥ $421 198 000", en: "≥ $421,198,000" },
        amount: 421198000,
        estimated: true,
        note: {
          uk: "плюс компенсація податків і відсотки за ставкою суверенних запозичень Росії",
          en: "plus a tax gross-up and interest at Russia's sovereign borrowing rate",
        },
      },
      {
        label: { uk: "Присуджено, 1 листопада 2023", en: "Awarded, 1 November 2023" },
        display: { uk: "$207 800 000", en: "$207,800,000" },
        amount: 207800000,
        note: {
          uk: "більшістю складу · + LIBOR 3м (SOFR) + 1%, складні, з 22.01.2015",
          en: "by majority · + 3M LIBOR (SOFR) + 1%, compounded, from 22 Jan 2015",
        },
      },
      {
        label: { uk: "З відсотками на день рішення", en: "With interest at the award date" },
        display: { uk: "≈ $267 млн", en: "≈ $267M" },
        amount: 267000000,
        estimated: true,
        note: { uk: "цифра, яку повідомляла преса", en: "the figure reported in the press" },
      },
      {
        label: { uk: "Витрати, присуджені арбітражем", en: "Costs awarded" },
        display: { uk: "$10 764 067,64", en: "$10,764,067.64" },
        amount: 10764067.64,
        parts: [
          {
            label: { uk: "адміністративні", en: "administrative" },
            display: { uk: "$1 362 422,88", en: "$1,362,422.88" },
            amount: 1362422.88,
          },
          {
            label: { uk: "правова допомога", en: "legal" },
            display: { uk: "$9 401 644,76", en: "$9,401,644.76" },
            amount: 9401644.76,
          },
        ],
      },
    ],
  },

  objections: {
    /* Без числа – див. примітку в icj-genocide.ts. */
    heading: { uk: "Заперечення Росії", en: "Russia's objections" },
    note: {
      uk: "На відміну від справи Ощадбанку, Росія брала участь і боронилася. Трибунал відхилив усі заперечення. Щодо «території» – одностайно; щодо строку за статтею 12 – більшістю голосів.",
      en: "Unlike in Oschadbank, Russia appeared and fought. The tribunal rejected every objection – on territory unanimously, on the Article 12 timing point by majority.",
    },
    benchSize: 3,
    /* The count is five, and it is the award's own.
     *
     * § 210: "Russia raises four jurisdictional objections and one
     * admissibility objection, which, Claimant submits, should all be
     * dismissed." The dispositif dismisses exactly those five – First to
     * Fourth Jurisdictional plus the Admissibility Objection.
     *
     * A long note here used to argue the opposite: that the site under-counted
     * and a sixth objection had to be found in the award and written up. It
     * reasoned from verbatim block 10, "The Respondent raised 6 preliminary
     * objections" – but that line is the summary author's heading, not the
     * award's text, and the award says six nowhere. The note also instructed
     * whoever came next NOT to close the gap by correcting the six, on the
     * ground that doing so would put the site in conflict with its own
     * verbatim. It is the verbatim block's heading that was wrong. If that
     * block is ever re-ingested, take the number from § 210.
     */
    items: [
      {
        ground: { uk: "Територія", en: "Territory" },
        latin: "ratione loci",
        objection: {
          uk: "«Територія» у ДІД означає лише суверенну територію; через територіальний спір Крим нею не є.",
          en: "\"Territory\" in the BIT means sovereign territory only; the territorial dispute takes Crimea outside it.",
        },
        outcome: "rejected",
        /* Unanimous. § 291: "The First Jurisdictional Objection is dismissed
           for two reasons – the first reason is adopted by majority, and the
           second unanimously (so that, in the end, the First Jurisdictional
           Objection is dismissed unanimously)." Dispositif item 1 carries no
           "by majority" qualifier. What was 2-1 is the reading of "territory"
           in Article 1(4) (§ 292, the President and Mr Rowley); the estoppel
           ground carried the whole bench, and it is the dismissal that this
           field records. This was recorded as 2-1 and the objection below as
           3-0 – the two were the wrong way round. */
        votes: [{ for: 3, against: 0 }],
        reasoning: {
          uk: "«Територія РФ» – це простір під її контролем на відповідну дату; Крим безспірно був під контролем Росії. І естопель: не можна проголошувати Крим своїм суверенним і водночас заперечувати це для цілей ДІД.",
          en: "\"Territory of the Russian Federation\" is the area under its control at the relevant date; Crimea indisputably was. And estoppel: a State cannot proclaim Crimea sovereign territory while denying it for BIT purposes.",
        },
      },
      {
        ground: { uk: "Час (ст. 12)", en: "Timing (Art. 12)" },
        latin: "ratione temporis",
        objection: {
          uk: "Значна частина активів – «радянські», збудовані до 01.01.1992, тож ст. 12 їх не захищає.",
          en: "Much of the assets are \"Soviet\", built before 1 Jan 1992, so Article 12 leaves them unprotected.",
        },
        outcome: "rejected",
        /* By majority. § 371: "The necessary overall consequence is that the
           Tribunal, by majority, dismisses Respondent's Second Jurisdictional
           Exception", and dispositif item 2 reads "Dismisses by majority the
           Second Jurisdictional Objection". Unanimous (§§ 368–369) is the
           interpretation of Article 12, not the dismissal. */
        votes: [{ for: 2, against: 1 }],
        reasoning: {
          uk: "Одностайно: інвестицію «зроблено», коли інвестор набув власність (ius in rem), а це сталося після 1992 року за версією обох сторін (1995 або 2012).",
          en: "Unanimously: an investment is \"made\" when the investor acquires ownership (ius in rem) – after 1992 on both parties' versions (1995 or 2012).",
        },
      },
      {
        ground: { uk: "Поняття інвестиції", en: "What counts as an investment" },
        latin: "ratione materiae",
        objection: {
          uk: "Ст. 1(1) вимагає активного транскордонного вкладення, законного на момент здійснення, – кумулятивно й одночасно.",
          en: "Article 1(1) requires an active, cross-border, lawful commitment – cumulatively and at inception.",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Визначення ст. 1(1) широке – «усі види майнових та інтелектуальних цінностей»; активи «Крименерго» під нього підпадають. Позивач переміг у всіх юрисдикційних питаннях (диспозитив).",
          en: "Article 1(1)'s definition is broad – \"all kinds of assets and intellectual values\"; Krymenergo's assets fall within it. The claimant prevailed on all jurisdictional defences (dispositif).",
        },
      },
      {
        ground: { uk: "Статус інвестора", en: "Investor status" },
        latin: "ratione personae",
        objection: {
          uk: "Позивач не відповідає визначенню інвестора за ст. 1(2)(b) ДІД.",
          en: "The claimant does not meet the investor definition in Article 1(2)(b).",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Відхилено; за диспозитивом Позивач переміг у всіх запереченнях щодо юрисдикції.",
          en: "Rejected; per the dispositif the claimant prevailed on every jurisdictional objection.",
        },
      },
      {
        ground: { uk: "Корупція", en: "Corruption" },
        objection: {
          uk: "45% акцій нібито придбано корупційно – вимога неприйнятна або поза юрисдикцією.",
          en: "The 45% stake was allegedly acquired corruptly – the claim is inadmissible or outside jurisdiction.",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Трибунал відхилив звинувачення в корупції і зберіг юрисдикцію (аналіз IAReporter; повний розбір – у тексті рішення).",
          en: "The tribunal rejected the corruption allegations and upheld jurisdiction (IAReporter's analysis; the full treatment is in the award).",
        },
      },
    ],
  },

  afterlife: {
    heading: { uk: "Рішення на стадії стягнення", en: "The award in enforcement" },
    note: {
      uk: "Росія добровільно не платить, тож рішення виконується за Нью-Йоркською конвенцією – у США та Нідерландах, аж до арешту акцій структур «Газпрому».",
      en: "Russia has not paid voluntarily, so the award is being enforced under the New York Convention – in the US and the Netherlands, up to the seizure of Gazprom-linked shares.",
    },
    stages: [
      {
        year: "2023",
        title: { uk: "Рішення ухвалено", en: "Award rendered" },
        note: {
          uk: "207,8 млн + відсотки; через шість днів – клопотання про визнання у суді США.",
          en: "USD 207.8M plus interest; six days later, a petition to confirm in US court.",
        },
        standing: "yes",
      },
      {
        year: "2026",
        title: { uk: "Імунітет відхилено (США)", en: "Immunity denied (US)" },
        note: {
          uk: "Апеляційний суд США відмовив Росії в суверенному імунітеті (лютий) і в зупинці виконання (квітень).",
          en: "The US Court of Appeals denied Russia sovereign immunity (February) and a stay of mandate (April).",
        },
        standing: "yes",
      },
      {
        year: "2026",
        title: { uk: "Арешт акцій (Нідерланди)", en: "Shares seized (Netherlands)" },
        note: {
          uk: "Апеляція підтвердила арешт акцій Gazprom International на виконання рішення (березень).",
          en: "The appeals court confirmed the seizure of Gazprom International shares in satisfaction of the award (March).",
        },
        standing: "yes",
      },
    ],
  },

  interpretations: [
    {
      term: { uk: "«Територія» = контроль", en: "\"Territory\" = control" },
      ruling: {
        uk: "Більшістю: «територія Російської Федерації» – це географічний простір під контролем РФ на відповідну дату. Суверенітет вирішувати не потрібно – і це той самий підхід, що у справі Ощадбанку.",
        en: "By majority: \"territory of the Russian Federation\" is the geographical area under its control at the relevant date. Sovereignty need not be decided – the same approach as in Oschadbank.",
      },
    },
    {
      term: { uk: "Естопель і добросовісність", en: "Estoppel and good faith" },
      ruling: {
        uk: "Держава не може проголошувати Крим своєю суверенною територією і водночас заперечувати це для цілей ДІД: попередні публічні заяви зв'язують.",
        en: "A State cannot proclaim Crimea its sovereign territory and deny it for BIT purposes: prior public proclamations bind.",
      },
    },
    {
      term: { uk: "Коли інвестицію «зроблено» (ст. 12)", en: "When an investment is \"made\" (Art. 12)" },
      ruling: {
        uk: "Одностайно: у момент набуття інвестором власності чи іншого речового права – не в момент побудови активу і не в момент зміни контролю над територією у 2014 році.",
        en: "Unanimously: when the investor acquires ownership or another right in rem – not when the asset was built, and not when control of the territory changed in 2014.",
      },
    },
    {
      term: { uk: "ДІД переживає збройний конфлікт", en: "The BIT survives armed conflict" },
      ruling: {
        uk: "Попри війну між сторонами договору, ДІД чинний: його не визнано недійсним, не припинено і не призупинено.",
        en: "Despite the armed conflict between the treaty parties, the BIT stands: not invalidated, not terminated, not suspended.",
      },
    },
    {
      term: { uk: "Чотири умови ст. 5 – кумулятивні", en: "Article 5's four conditions are cumulative" },
      ruling: {
        uk: "Вилучення провалило всі чотири: без компенсації, не в суспільних інтересах, без належної процедури, дискримінаційне. Для незаконності вистачило б однієї.",
        en: "The taking failed all four: no compensation, no public interest, no due process, discriminatory. Any one failure would have sufficed for unlawfulness.",
      },
    },
  ],

  sources: [
    /* The seizure of Gazprom-linked shares is in the lede and the enforcement
       line and had no source of its own: it is a preliminary attachment of
       Gazprom International's 50% holding in Wintershall Noordzee B.V., upheld
       on appeal. The judgment below is the Dutch court's own text in English
       translation. */
    {
      url: "https://cisarbitration.com/wp-content/uploads/2026/03/Gazprom_DTEK_CoA_Judgment_English.pdf",
      title:
        "JSC DTEK Krymenergo v Russian Federation – Judgment of the Hague Court of Appeal in summary proceedings, 24 February 2026 (English translation)",
      authors: "Gerechtshof Den Haag",
      publication: "CIS Arbitration Forum",
      date: "2026",
      type: "official/court",
    },
    {
      url: "https://www.iareporter.com/articles/dutch-court-confirms-preliminary-attachment-of-gazproms-shares-in-wintershall-noordzee-to-satisfy-dtek-v-russia-award/",
      title:
        "Dutch court confirms preliminary attachment of Gazprom's shares in Wintershall Noordzee to satisfy DTEK v. Russia award",
      authors: "Investment Arbitration Reporter",
      publication: "IAReporter",
      date: "2025",
      type: "news/insight",
    },
    // – the award and the instruments (the doc's own in-text links) –
    {
      url: "https://www.italaw.com/sites/default/files/case-documents/180426.pdf",
      title: "JSC DTEK Krymenergo v. The Russian Federation – Award of 1 November 2023 (full text)",
      authors: "",
      publication: "italaw",
      date: "1 November 2023",
      type: "official/award",
    },
    {
      url: "https://jusmundi.com/en/document/decision/en-pjsc-dtek-krymenergo-v-russian-federation-sunday-1st-january-2017",
      title: "DTEK v. Russia – Award page (with separate opinion)",
      authors: "",
      publication: "Jus Mundi",
      date: "2023",
      type: "official/award",
    },
    {
      url: "https://jusmundi.com/en/document/treaty/en-agreement-between-the-governement-of-the-russian-federation-and-the-cabinet-of-ministers-of-the-ukraine-on-the-encouragement-and-mutual-protection-of-investments-russian-federation-ukraine-bit-1998-friday-27th-november-1998",
      title: "Russia–Ukraine BIT (1998) – treaty text",
      authors: "",
      publication: "Jus Mundi",
      date: "27 November 1998",
      type: "official/treaty",
    },
    {
      url: "https://jusmundi.com/en/document/rule/en-uncitral-arbitration-rules-1976-uncitral-arbitration-rules-1976",
      title: "UNCITRAL Arbitration Rules (1976)",
      authors: "",
      publication: "Jus Mundi",
      date: "1976",
      type: "official/treaty",
    },
    {
      url: "https://jusmundi.com/en/document/pdf/other/en-pjsc-dtek-krymenergo-v-russian-federation-petition-to-confirm-foreign-arbitration-award-tuesday-7th-november-2023",
      title: "Petition to confirm the award – US District Court for the District of Columbia",
      authors: "",
      publication: "Jus Mundi",
      date: "7 November 2023",
      type: "official/filing",
    },
    // – research and reporting –
    {
      url: "https://www.iareporter.com/arbitration-cases/dtek-krymenergo-v-russia/",
      title: "DTEK Krymenergo v. Russia – case page and enforcement updates",
      authors: "",
      publication: "IAReporter",
      date: "2023–2026",
      type: "news/insight",
    },
    {
      url: "https://www.iareporter.com/articles/analysis-uncitral-tribunal-in-dtek-krymenergo-v-russia-upholds-jurisdiction-over-claim-for-expropriation-of-crimean-assets-rejects-corruptions-allegations-and-awards-200-million-usd-to-the-ukrain/",
      title: "Analysis: tribunal upholds jurisdiction, rejects corruption allegations, awards 200+ million USD",
      authors: "",
      publication: "IAReporter",
      date: "2023",
      type: "news/insight",
    },
    {
      url: "https://www.iareporter.com/articles/dtek-v-russia-crimea-arbitration-concludes-with-267-million-usd-award-in-favor-of-ukrainian-claimant/",
      title: "DTEK v. Russia concludes with 267 million USD award (with award and separate opinion)",
      authors: "",
      publication: "IAReporter",
      date: "2023",
      type: "news/insight",
    },
    {
      url: "https://kyivindependent.com/energy-giant-dtek-awarded-267-million-from-russia-in-compensation-for-seized-assets/",
      title: "International court rules Russia must pay $267 million to energy giant DTEK",
      authors: "",
      publication: "The Kyiv Independent",
      date: "2 November 2023",
      type: "news/insight",
    },
    {
      url: "https://www.cov.com/en/news-and-insights/news/2023/11/covington-team-wins-270-million-international-arbitration-award-for-ukrainian-energy-company-expropriated-by-russia",
      title: "Covington team wins $270 million arbitration award for Ukrainian energy company",
      authors: "",
      publication: "Covington & Burling",
      date: "November 2023",
      type: "news/insight",
    },
    {
      url: "https://www.transnational-dispute-management.com/legal-and-regulatory-detail.asp?key=34006",
      title: "DTEK wins Hague case against Russia over seized Crimean assets – press release",
      authors: "",
      publication: "TDM Journal",
      date: "2 November 2023",
      type: "news/insight",
    },
    {
      url: "https://euromaidanpress.com/2023/11/03/dtek-energy-company-claims-267-million-victory-in-the-hague-against-russia-over-crimea-assets/",
      title: "DTEK claims $267 million victory in The Hague against Russia over Crimea assets",
      authors: "",
      publication: "Euromaidan Press",
      date: "3 November 2023",
      type: "news/insight",
    },
  ],
};
