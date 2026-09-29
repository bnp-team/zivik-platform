/**
 * Ukrainian UI dictionary. This is the canonical shape; `Dictionary` is derived
 * from it and every other locale must satisfy that type (see `en.ts`).
 *
 * UI *chrome* strings live here. Domain content (courts, cases, events,
 * partners) lives in the content layer (`src/content/`) with per-locale fields.
 *
 * ── One word: «Бібліотека рішень» ───────────────────────────────────────────
 * USER DECISION, and it overrides what this comment used to say. The reader
 * meets exactly one name for the collection: «Бібліотека рішень» in Ukrainian,
 * "Library of decisions" in English. The page title, the H1, the nav item, the
 * hero CTA, the band on the home page, the footer link and every back link all
 * carry it.
 *
 * The previous rule — which this replaces — split the vocabulary in two:
 * «бібліотека» for the site and «реєстр» for the list of 39 proceedings at
 * `/registry`. The user has ruled that out: «переконайся що ми всюди
 * використовуємо термінологію Бібліотека рішень а не реєстр». Do not restore
 * the split, and do not reintroduce «реєстр» as a name for the collection or
 * for any page, band, link or control that points at it.
 *
 * «Реєстр» survives in exactly two places, and both are somebody else's word,
 * not ours:
 *   • a court's or a State's own register named in quoted or legal text — the
 *     Register of Damage for Ukraine («Реєстр збитків») in
 *     `summaries/echr-ukraine-netherlands.ts`, the register of depositors in
 *     the Russian federal laws quoted by `summaries/oschadbank.ts`;
 *   • «реєстраційний номер» — a docket reference, which is what a docket is
 *     called in Ukrainian.
 *
 * The identifiers do not follow the words. The route is still `/registry`, the
 * component is still `RegistryTable`, the key is still `registry.*`: renaming
 * the URL breaks every link already given out, and renaming the keys is churn
 * with no reader on the other end. If the route is ever renamed it needs a
 * redirect and a sitemap change, neither of which is a vocabulary question.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ── One word: «огляд», not «конспект» ───────────────────────────────────────
 * USER DECISION. What this library publishes about a decision is an «огляд».
 * The word was «конспект» in twenty-one places — the library's filters and
 * column, the map's legend and card, the pending-case page, the newsletter,
 * /about, /team and both legal documents — and it is «огляд» in all of them
 * now. «Конспект» is what a student takes from a lecture; the register was
 * wrong for a research library.
 *
 * The English is unchanged: "summary" for the thing, "write-up" where the
 * sentence is about the act of writing it. Those already read correctly and
 * the owner's correction was about the Ukrainian.
 *
 * `content/summaries/` is exempt in both languages — those files hold the
 * courts' own words, and the directory name is an identifier, not copy.
 * ────────────────────────────────────────────────────────────────────────────
 */
const uk = {
  meta: {
    /* «Війна проти України», not «агресія». The platform is named for the war
       and says the word in its own strapline; «агресія» appeared beside it in
       the title, the description and the footer, so the site used two names
       for its subject on the same screen. Owner's decision: «війна проти
       України» everywhere the site speaks in its own voice. The summaries are
       exempt — a court's own characterisation of the conduct is quoted as the
       court wrote it, and several of them write «агресія». */
    title: "НаСвітло — рішення міжнародних судів щодо війни проти України",
    description:
      "Відкрита бібліотека рішень міжнародних судів щодо війни Росії проти України: ЄСПЛ, Міжнародний суд ООН, ICC, арбітражі. Проєкт Факультету права УКУ.",
    ogAlt: "НаСвітло — бібліотека рішень міжнародних судів",
  },
  nav: {
    skip: "Перейти до змісту",
    menu: "Меню",
    home: "Головна",
      about: "Про проєкт",
    decisions: "Бібліотека рішень",
    map: "Мапа",
    team: "Команда",
    blog: "Блог",
  },
  brand: {
    facultyAlt: "Факультет права УКУ",
    /* One capitalisation of the name, everywhere, and it is «НаСвітло».
       Owner's decision, and it reaches the logotype: the wordmark in the bar,
       the browser tab, the search result and the running prose all carried
       different casings of the same word — «насвітло», «НаСвітло»,
       «Насвітло» — which reads as three names for one library. */
    wordmark: "НаСвітло",
  },
  hero: {
    credit: "Проєкт",
    creditCentre: "Дослідницького центру Луї Зона",
    creditFaculty: "Факультету права УКУ",
    /* No full stop. Owner's edit: «вкінці висловлювань на головній сторінці не
       треба ставити крапок». This is the one statement under the lamp — a
       line of display type on an image, not a sentence in a paragraph — and a
       full stop on it reads as punctuation left behind from prose. The slogan
       three sections down never had one; this is now consistent with it. The
       running prose keeps its stops, and so does the Court's quotation, which
       is someone else's sentence. */
    lead: "Бібліотека відповідальності та правосуддя для України — освітлюємо правовий шлях, яким Україна крокує до справедливості",
    ctaRegistry: "Бібліотека рішень",
    chainHint: "потягніть за ланцюжок",
    lampLabel: "Увімкнути або вимкнути лампу",
  },
  intro: {
    /* Owner's wording, September 2026, handed over whole. It drops the clause
       that named who brought the proceedings — «які порушили Україна та
       іноземні держави» — which had itself been her correction of
       «українських ініціатив». Nothing is lost by it: the sentence no longer
       says who brought the cases at all, rather than saying it wrongly, and
       /about still carries the origins in full.

       «Росії» stays capitalised, as she wrote it. */
    text: "Онлайн-бібліотека міжнародної судової практики (Міжнародний суд ООН, ЄСПЛ, МКС, Міжнародний трибунал з морського права, Постійна палата третейського суду) та практики іноземних судів у справах щодо притягнення Росії до відповідальності за порушення, вчинені під час війни проти України.",
    about: "Про нас",
  },
  about: {
    /* The home page keeps a two-paragraph summary of the collection; the full
       account — who runs it, how a summary is made, where the archive stands —
       is its own page, and this is the link between them. */
    more: "Докладніше про проєкт",
  },
  slogan: "Досліджуємо · Пояснюємо · Висвітлюємо",
  pending: {
    title: "Ще досліджуємо",
    body: "Цю справу вже внесено до бібліотеки, але огляду ще немає — ми над ним працюємо. Нижче те, що вже відомо, і посилання на документ суду, якщо він у відкритому доступі.",
    forum: "Суд",
    status: "Стан",
    kind: "Галузь",
    docket: "Реєстраційний номер",
    official: "Документ суду",
    toRegistry: "До бібліотеки рішень",
    toMap: "До мапи",
  },
  quote: {
    text: "Російська Федерація повинна негайно призупинити воєнні операції, які вона розпочала 24 лютого 2022 року на території України",
    source: "Міжнародний суд ООН · Тимчасові заходи · 16 березня 2022",
    read: "Читати рішення",
  },
  mapSection: {
    close: "Закрити картку",
    moveCard: "Перетягнути картку",
    label: "Мапа",
    heading: "Держави, чиї суди розглядають ці справи",
    /* The three nouns used to be set off by dashes — «обстріли, депортації та
       захоплення» — which reads as the list of what Russia is accused of. It
       is not: it was a sample of what six markers happen to show, on a map
       whose own registry carries thirty-nine proceedings. The sentence states
       the mechanic and names nothing it cannot finish. Owner's correction. */
    /* What the drawing does and does not carry, said above it rather than
       discovered from it. The map used to answer this with a legend key —
       «Ще досліджуємо» — which stood for exactly one event and so implied the
       archive had one unwritten case, when it has thirty-one. The key is gone
       with the event (see content/map.ts); the sentence replaces it, and it
       is the truthful version of the same fact. Owner's decision. */
    /* Kept to one line on purpose. On a wide screen this heading is a panel
       floating over the drawing, and its height is measured against the
       markers underneath it — see the 1150px note in home.css. A second
       sentence about where the full list lives would cost three lines of
       panel, and both the band's own «Повна мапа →» and the library in the
       navigation already answer it. */
    legendCourt: "Суд",
    legendLit: "Є огляд",
    legendUnlit: "Ще досліджуємо",
    courtsSeat: "Суди засідають у",
    courtHears: "Розглядає справи",
    inLibrary: "Які саме",
    /* Two placeholders, not one. The noun agrees with the number — 1
       провадження, 2–4 провадження, 5+ проваджень — and baked into the
       template as the genitive plural it read «1 проваджень» on six of the
       nine courts on the map. `plural()` in @/i18n/plural picks the form. */
    caseload: "{n} {w} у бібліотеці",
    /* The card's foot. `{at}` is the authored locative — «у Гаазі», «в
       Нідерландах» — because no rule turns the nominative into it; see the
       note on `MapCourt.at` in content/map.ts. */
    seatsTotal: "Усього {at}: {n} {w}",
    seatsNational: "Національні суди",
    seatsOpen: "Показати в бібліотеці",
    caseloadWord: { one: "провадження", few: "провадження", many: "проваджень" },
    zoomLabel: "Масштаб",
    zoomWide: "Європа",
    zoomClose: "Україна",
    zoomAtlantic: "Вся мапа",
    zoomReset: "Відцентрувати",
    zoomIn: "Наблизити",
    zoomOut: "Віддалити",
    wheelHint: "Ctrl або ⌘ + прокручування — масштаб",
    /* What the drawing says on a phone, where the marks are too small to aim
       at and the list below is the interface. It was silent: a map-shaped
       picture with a grab cursor and a zoom stepper that answered nothing. */
    /* It said «Оберіть подію нижче». There is no event below and no event
       anywhere: this is the coarse-pointer line, shown on a touch screen
       where the marks are not targets, and what is below it now is the list
       of seats. It is the one string of this family that can still reach a
       reader — the rest self-hide on empty data — so it is corrected rather
       than removed. */
    overview: "Оглядова мапа. Натисніть на суд у списку нижче — або відкрийте на весь екран.",
    openFull: "На весь екран",
    closeFull: "Вийти з повного екрана",
    reads: "Опрацьовані рішення",
    /* «11 проваджень» over three links left the reader unable to tell whether
       the other eight exist. The court cards answer this with «ЯКІ САМЕ»; the
       site cards had nothing. Not pluralised: the nouns differ per site —
       проваджень, рішення, арбітражів, ордерів — and the count line above
       already carries the right one. */
    writtenOf: "Опрацьовано {n} з {total}",
    writtenBehind: "Розібрано ситуацію, з якої видано ці ордери",
    /* The rest of a seat's caseload, in the library, instead of printed into
       a 300px card. The Hague's ran to 3011px of scroll against a 753px
       window before this.

       The key is still `allInRegistry` — the route it points at is still
       `/registry` — but the word the reader sees is the collection's one
       name. This string said «у реєстрі» against the rule at the top of this
       file, and it is the last thing a reader sees before landing on the
       page that calls itself «Бібліотека рішень». */
    allInRegistry: "Дивитися в бібліотеці",
    pending: "Огляд у підготовці",
    /* The registry's own wording for this field, not a new one: the sign in
       the source says which way the money ran, so what a tag can honestly
       print is the magnitude, called the sum in dispute. */
    amountLabel: "Сума у спорі",
    legendWhat: "Місця подій",
    /* The name on the control that folds the key away — see `legendOpen` in
       EventsMap. A legend is read once and then remembered; after that it is a
       column of things the reader already knows, where the map could be. */
    legendTitle: "Легенда",
    placesTitle: "Місця подій",
    legendHow: "Що на мапі",
    legendLine: "Звʼязок суду з подією",
    legendForum: "Держава, чиї суди розглядають ці справи",
    /* The chevron and the tail on a seat the frame cannot hold. Rendered only
       where some seat is actually off the projection's window — today
       Montreal, and by data rather than by name. It was planned when the
       dock was built and never written: the type carried the comment with no
       field under it, so the one genuinely unfamiliar glyph on the drawing
       was the one thing the legend did not explain. */
    legendOffMap: "Суд поза кадром",
    legendRegions: "Межі областей",
    /* The ground a mark speaks for, where a point is not the whole truth
       about it — the ICC's situation is the whole country, not Mariupol.
       Rendered only where some site actually declares one. */
    legendArea: "Подія — про всю підсвічену територію",
    /* The map's whole mechanic, and it was nowhere in the legend: a reader
       had to guess that the marks answer at all. */
    legendPick: "Натисніть на суд — побачите справи, які він розглядає.",
    pageTitle: "Мапа судів",
    pageLede: "Порушення сталися в Україні, а судять їх за тисячі кілометрів звідти. Мапа показує, куди саме сягнула відповідь: держави, чиї суди ведуть ці провадження.",
    backHome: "На головну",
  },
  /* Eight keys lighter. `label`, `heading`, `description`, `fullRegistry`,
     `allCases`, `caseWord`, `legendLit` and `legendQueued` belonged to the
     library band on the home page — the five courts, their caseloads, a row
     of cases apiece — which the review took off. The component went with it;
     these were the only place its words lived, and every one of them made a
     claim about a surface that no longer exists. What stays is what the
     library page and the map still read: the stage and outcome vocabularies
     and the words around them. */
  registry: {
    /* The band on the home page previews the collection, so it is labelled
       with the collection's one name — the same name the page, the nav item
       and the footer link carry. The key stays `registry.*`; the words the
       reader sees do not. See the note at the top of this file. */
    /* It read «Кожне провадження проти Росії — в одній бібліотеці». That is a
       claim of completeness, and the library is still being filled: one
       proceeding we have not reached yet makes the heading false. The band
       says where the proceedings are gathered, not that they are all here.
       Owner's correction. */
    /* Ukrainian counts in three forms: 1 справа, 2–4 справи, 5+ справ. The
       string used to hardcode the third, so ITLOS and Finland read "Усі 1
       справ" on the home page. */
    /* One chip used to carry «У розгляді», «Ордер» and «Рішення» side by side,
       which mixes two questions: where the proceedings stand, and what the
       forum issued. They are two tag dimensions now. Every label below is the
       wording the source `status` text uses — a case whose record fixes only
       one of the two carries only one tag. */
    /* The library names these two dimensions the way the columns and the
       filters over them do: «стан розгляду» and «тип». They used to read
       «Етап» and «Що ухвалено», which agreed with nothing on the page. */
    stageName: "Стан розгляду",
    outcomeName: "Тип",
    stage: {
      preliminary: "Попередній етап",
      investigation: "Розслідування",
      merits: "Розгляд по суті",
      satisfaction: "Очікує сатисфакції",
      appeal: "Оскаржується",
      remitted: "Новий розгляд",
      enforcement: "Виконання",
      suspended: "Призупинено",
      frozen: "Заморожено",
      upcoming: "До розгляду",
      concluded: "Завершено",
    },
    outcome: {
      judgment: "Рішення",
      award: "Остаточне рішення",
      verdict: "Вирок",
      liability: "Відповідальність",
      warrant: "Ордер",
      upheld: "Арбітраж залишено",
      /* Одне слово, однина: чип стоїть у клітинці одного рядка і каже
         тип рішення саме цієї справи, а не групи. Двома словами він
         переносився на два рядки в колонці таблиці. Власниця: «давай
         просто "Процедурне"». */
      procedural: "Процедурне",
    },
  },
  newsletter: {
    heading: "Щомісяця — ще кілька рішень НаСвітло",
    text: "Лист про те, які рішення ми опрацювали за місяць: що встановив суд і на що з цього можна опертися.",
    subscribe: "Отримувати листа",
    support: "Підтримати бібліотеку",
    assurance: "Тільки огляди. Відписатися можна з будь-якого листа.",
  },
  /* Two keys, because there is one partner row and it is on the home page.

     `all` («Усі партнери») and `note` («Список короткий і поповнюватиметься»)
     are gone with the page they belonged to. The note was the sentence the
     review asked to be deleted — deleted rather than reworded this time,
     owner's instruction — and `all` was the link into a page that held the
     same single mark the band above it already showed. */
  partners: {
    label: "Партнери",
    heading: "З ким ми працюємо",
    /* The funding line, and the one string on this page that is not ours to
       word. ifa's grants carry a prescribed acknowledgement — normally naming
       the funder behind the programme, not only the institute — and until that
       wording comes from them this says the plain, checkable thing and no
       more. Replace it with theirs verbatim when it arrives; do not translate
       or shorten it. */
    funded: "Проєкт створено за підтримки",
    openLabel: "Відкриті до партнерства",
    openHeading: "Бібліотека росте разом з тими, хто її підтримує",
    openText:
      "Ми шукаємо інституції, готові працювати над доступністю міжнародного правосуддя для України.",
    /* What a partnership could be, so the ask is not an abstraction. Three
       plain nouns, not links: there is no page behind any of them, and a
       control that goes nowhere teaches the reader to distrust the ones that
       do. The one thing to press is the letter. */
    openWays: ["Дослідження", "Освітні події", "Фінансова підтримка"],
    openCta: "Написати нам",
  },
  footer: {
    tagline:
      "Бібліотека рішень міжнародних судів щодо війни Росії проти України. Ми проливаємо на них світло.",
    org: "Дослідницький центр Луї Зона",
    faculty: "Факультет права УКУ",
    colArchive: "Бібліотека",
    colCenter: "Центр",
    colContacts: "Контакти",
    linkRegistry: "Бібліотека рішень",
    /* «Мапа», not «Мапа подій». The footer was the last place still calling
       it that. The map stopped being about events when it was re-conceived as
       the states whose courts hear these proceedings — the page's own heading
       is «Держави, чиї суди розглядають ці справи» and the top bar says
       «Мапа» — so the footer was sending a reader to a page that no longer
       existed under that name. */
    linkMap: "Мапа",
    linkAbout: "Про проєкт",
    linkTeam: "Команда",
    linkBlog: "Блог",
    email: "louis.sohn.center@ucu.edu.ua",
    support: "Підтримати нас",
    /* Must not contradict the controller's address in content/legal.ts,
       which reads «вул. Іларіона Свєнціцького, 17, м. Львів, 79011,
       Україна». Same address, footer-length: no country line. */
    address: "вул. Іларіона Свєнціцького, 17, Львів, 79011",
    rights: "© 2026 Дослідницький центр Луї Зона, УКУ. Матеріали — CC BY 4.0.",
    privacy: "Політика конфіденційності",
    terms: "Умови користування",
  },
};

export default uk;

/** Structural type every locale dictionary must satisfy. */
export type Dictionary = typeof uk;
