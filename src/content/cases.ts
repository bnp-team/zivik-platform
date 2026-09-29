import type { RegistryCase } from "./types";

/**
 * The case registry – ingested from the source spreadsheet
 * "Cases for the platform.xlsx". Official names are single strings (identical
 * in both locales); types, statuses and notes are localised. `lit` marks cases
 * that already have a written summary. This is the primary content the future
 * Payload admin will edit.
 */
export const registryCases: RegistryCase[] = [
  {
    id: "icj-1",
    institutionId: "icj",
    name: "Application of the International Convention for the Suppression of the Financing of Terrorism and of the International Convention on the Elimination of All Forms of Racial Discrimination (Ukraine v. Russian Federation), Judgment, I.C.J. Reports 2024, 31 January 2024",
    nameShort: "Application of the International Convention for the Suppression of the Financing of Terrorism and of the International Convention on the Elimination of All Forms of Racial Discrimination (Ukraine v. Russian Federation)",
    /* The official name, the same one the decision page carries as its h1.
       It was a descriptive shorthand – «Україна проти РФ – фінансування
       тероризму і расова дискримінація» – so the library called this case
       one thing and its own page called it another, and a reader arriving
       from the library met a title they had not clicked on. Owner's words.
       The English side already carried the official name via `nameShort`. */
    nameUk:
      "Застосування Міжнародної конвенції про боротьбу з фінансуванням тероризму та Міжнародної конвенції про ліквідацію всіх форм расової дискримінації",
    type: { uk: "Міжнародне публічне", en: "Public international law" },
    stage: "concluded",
    outcome: "judgment",
    status: { uk: "Рішення винесено", en: "Judgment delivered" },
    year: 2017,
    amountUsd: null,
    note: { uk: "ICJ GL 166 · Крим, Донбас", en: "ICJ GL 166 · Crimea, Donbas" },
    pages: 139,
    decisionUrl: "https://www.icj-cij.org/sites/default/files/case-related/166/166-20240131-jud-01-00-en.pdf",
    summarySlug: "icj-cerd-icsft",
    lit: true,
  },
  {
    id: "icj-2",
    institutionId: "icj",
    name: "Allegations of Genocide under the Convention on the Prevention and Punishment of the Crime of Genocide (Ukraine v. Russian Federation: 32 States intervening), Preliminary Objections, Judgment, I.C.J. Reports 2024, 2 February 2024",
    nameShort: "Allegations of Genocide under the Convention on the Prevention and Punishment of the Crime of Genocide (Ukraine v. Russian Federation: 32 States intervening)",
    /* The official name, as on the decision page – the same alignment the
       ICSFT/CERD case got. The parties come off the end because the page
       sets them apart from the subject, and the library's own row carries
       them in its English line. */
    nameUk:
      "Звинувачення у геноциді за Конвенцією про запобігання злочину геноциду та покарання за нього",
    type: { uk: "Міжнародне публічне", en: "Public international law" },
    /* The ICJ issues no arrest warrants. What this row was pointing at is the
       Order on provisional measures of 16 March 2022 (judgment § 10), and in
       Ukrainian «ордер» names an arrest warrant – a different act of a
       different court. Every summary on the site writes «наказ» for an ICJ
       order, and the status line does so now.

       `outcome` records what the forum issued, heaviest act first, and in this
       docket that is a judgment: the Judgment on preliminary objections of
       2 February 2024, the document `decisionUrl` links and `summarySlug`
       explains. The neighbouring `order` key was the other candidate, but it
       renders «Процедурні накази» / "Procedural orders", which is wrong twice
       over here – the 16 March 2022 Order is not procedural, and the label
       would bury the judgment. `stage: "merits"` carries the fact that nothing
       is concluded.

       Page count verified against the PDF at `decisionUrl` (the I.C.J. Reports
       2024 fascicle offprint, judgment at pp. 360-425): 70 pages. */
    stage: "merits",
    outcome: "judgment",
    status: {
      uk: "Розгляд по суті; ухвалено наказ про тимчасові заходи",
      en: "Merits pending; provisional measures indicated",
    },
    year: 2022,
    amountUsd: null,
    note: { uk: "ICJ GL 182", en: "ICJ GL 182" },
    pages: 70,
    decisionUrl: "https://www.icj-cij.org/sites/default/files/case-related/182/182-20240202-jud-01-00-en.pdf",
    summarySlug: "icj-genocide",
    lit: true,
  },
  {
    id: "icj-3",
    institutionId: "icj",
    name: "Appeal from the ICAO Council Decision dated 30 June 2025 (Russian Federation v. Australia and Netherlands)",
    nameUk: "Апеляція на рішення Ради ICAO від 30 червня 2025 (РФ проти Австралії та Нідерландів)",
    type: { uk: "Міжнародне публічне", en: "Public international law" },
    stage: "preliminary",
    outcome: "procedural",
    /* «Накази», not «ордери» – the same confusion as on icj-2 above: this is
       an ICJ docket, and the acts on it are procedural orders. */
    status: { uk: "Попередній етап, рішення нема, лише процедурні накази", en: "Preliminary stage; procedural orders only" },
    year: 2025,
    amountUsd: null,
    note: { uk: "ICJ GL 201", en: "ICJ GL 201" },
    pages: null,
    decisionUrl: "https://www.icj-cij.org/case/201",
    lit: false,
  },
  {
    id: "ecthr-4",
    institutionId: "ecthr",
    name: "Ukraine v Russia (re Crimea) [GC]",
    /* No «– Велика палата». Review's edit names the Ukraine-and-Netherlands
       case; the same reasoning applies to its twin above, so both are changed
       and this note says so. The formation that heard a case is not part of
       its name – it is a fact about the hearing, and the summary carries it. */
    nameUk: "Україна проти Росії (щодо Криму)",
    type: { uk: "Права людини", en: "Human rights" },
    stage: "concluded",
    outcome: "judgment",
    status: { uk: "Рішення винесено", en: "Judgment delivered" },
    year: 2014,
    amountUsd: null,
    note: { uk: "Apps 20958/14, 38334/18", en: "Apps 20958/14, 38334/18" },
    pages: null,
    decisionUrl: "https://hudoc.echr.coe.int/eng#{%22appno%22:[%2220958/14%22],%22itemid%22:[%22001-235139%22]}",
    lit: false,
  },
  {
    id: "ecthr-5",
    institutionId: "ecthr",
    name: "Ukraine and Netherlands v Russia [GC]",
    nameUk: "Україна і Нідерланди проти Росії",
    type: { uk: "Права людини", en: "Human rights" },
    stage: "satisfaction",
    outcome: "judgment",
    status: { uk: "Очікує сатисфакції", en: "Awaiting just satisfaction" },
    year: 2014,
    amountUsd: null,
    note: { uk: "Apps 8019/16 et al. · MH17 і схід", en: "Apps 8019/16 et al. · MH17 and the east" },
    pages: 501,
    decisionUrl: "https://hudoc.echr.coe.int/eng#{%22appno%22:[%2243800/14%22],%22itemid%22:[%22001-244292%22]}",
    summarySlug: "echr-ukraine-netherlands",
    lit: true,
  },
  {
    id: "ecthr-8",
    institutionId: "ecthr",
    name: "Russia v Ukraine no. 36958/21",
    nameUk: "Росія проти України, заява № 36958/21",
    type: { uk: "Права людини", en: "Human rights" },
    stage: "concluded",
    outcome: "procedural",
    status: { uk: "Відхилено (Правило 39)", en: "Rule 39 request rejected" },
    year: 2021,
    amountUsd: null,
    note: { uk: "App 36958/21", en: "App 36958/21" },
    pages: null,
    decisionUrl: "https://www.echr.coe.int/w/russia-v-ukraine-no-36958/21-",
    lit: false,
  },
  {
    id: "icc-situation",
    institutionId: "icc",
    name: "Situation in Ukraine",
    nameUk: "Ситуація в Україні",
    type: { uk: "Кримінальне", en: "Criminal" },
    stage: "investigation",
    status: { uk: "Розслідування", en: "Investigation" },
    year: 2022,
    amountUsd: null,
    note: { uk: "ICC-01/22", en: "ICC-01/22" },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/situations/ukraine",
    summarySlug: "icc-ukraine",
    lit: true,
  },
  {
    id: "icc-9",
    institutionId: "icc",
    partOf: "icc-situation",
    actName: { uk: "Владімір Путін", en: "Vladimir Putin" },
    name: "Putin",
    /* «Владімір», transliterated, not «Володимир», domesticated. The owner
       settled this: the registry and the ICC write-up spelled the same accused
       two ways, and an archive that a filing may cite cannot do that. */
    nameUk: "Ордер на арешт: Владімір Путін",
    type: { uk: "Кримінальне", en: "Criminal" },
    outcome: "warrant",
    status: { uk: "Ордер видано", en: "Warrant issued" },
    year: 2023,
    amountUsd: null,
    note: { uk: "депортації населення (дітей) та незаконного переміщення населення (дітей) з окупованих територій України до Російської Федерації (відповідно до статей 8(2)(a)(vii) та 8(2)(b)(viii) Римського статуту", en: "Deportation and unlawful transfer of children from occupied territories of Ukraine to Russia (arts. 8(2)(a)(vii) & 8(2)(b)(viii) of the Rome Statute)" },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/defendant/vladimir-vladimirovich-putin",
    lit: false,
  },
  {
    id: "icc-10",
    institutionId: "icc",
    partOf: "icc-situation",
    actName: { uk: "Марія Львова-Бєлова", en: "Maria Lvova-Belova" },
    name: "Lvova-Belova",
    nameUk: "Ордер на арешт: Марія Львова-Бєлова",
    type: { uk: "Кримінальне", en: "Criminal" },
    outcome: "warrant",
    status: { uk: "Ордер видано", en: "Warrant issued" },
    year: 2023,
    amountUsd: null,
    note: { uk: "депортації населення (дітей) та незаконного переміщення населення (дітей) з окупованих територій України до Російської Федерації (відповідно до статей 8(2)(a)(vii) та 8(2)(b)(viii) Римського статуту", en: "Deportation and unlawful transfer of children from occupied territories of Ukraine to Russia (arts. 8(2)(a)(vii) & 8(2)(b)(viii) of the Rome Statute)" },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/defendant/maria-alekseyevna-lvova-belova",
    lit: false,
  },
  {
    id: "icc-11",
    institutionId: "icc",
    partOf: "icc-situation",
    actName: { uk: "Сергій Кобилаш", en: "Sergei Kobylash" },
    name: "Kobylash",
    nameUk: "Ордер на арешт: Сергій Кобилаш",
    type: { uk: "Кримінальне", en: "Criminal" },
    outcome: "warrant",
    status: { uk: "Ордер видано", en: "Warrant issued" },
    year: 2024,
    amountUsd: null,
    note: { uk: "Воєнні злочини: Спрямування нападів на цивільні об'єкти (стаття 8(2)(b)(ii) заподіяння надмірної випадкової шкоди цивільному населенню або пошкодженням цивільних об'єктів (стаття 8(2)(b)(iv), а також за злочин проти людяності у вигляді нелюдських дій згідно зі статтею 7(1)(k) Римського статуту.", en: "War crimes: directing attacks against civilian objects (art. 8(2)(b)(ii)); excessive incidental civilian harm (art. 8(2)(b)(iv)); crime against humanity of inhumane acts (art. 7(1)(k)) of the Rome Statute." },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/defendant/sergei-ivanovich-kobylash",
    lit: false,
  },
  {
    id: "icc-12",
    institutionId: "icc",
    partOf: "icc-situation",
    actName: { uk: "Віктор Соколов", en: "Viktor Sokolov" },
    name: "Sokolov",
    nameUk: "Ордер на арешт: Віктор Соколов",
    type: { uk: "Кримінальне", en: "Criminal" },
    outcome: "warrant",
    status: { uk: "Ордер видано", en: "Warrant issued" },
    year: 2024,
    amountUsd: null,
    note: { uk: "Воєнні злочини: Спрямування нападів на цивільні об'єкти (стаття 8(2)(b)(ii) заподіяння надмірної випадкової шкоди цивільному населенню або пошкодженням цивільних об'єктів (стаття 8(2)(b)(iv), а також за злочин проти людяності у вигляді нелюдських дій згідно зі статтею 7(1)(k) Римського статуту.", en: "War crimes: directing attacks against civilian objects (art. 8(2)(b)(ii)); excessive incidental civilian harm (art. 8(2)(b)(iv)); crime against humanity of inhumane acts (art. 7(1)(k)) of the Rome Statute." },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/defendant/viktor-nikolayevich-sokolov",
    lit: false,
  },
  {
    id: "icc-13",
    institutionId: "icc",
    partOf: "icc-situation",
    actName: { uk: "Сергій Шойгу", en: "Sergei Shoigu" },
    name: "Shoigu",
    nameUk: "Ордер на арешт: Сергій Шойгу",
    type: { uk: "Кримінальне", en: "Criminal" },
    outcome: "warrant",
    status: { uk: "Ордер видано", en: "Warrant issued" },
    year: 2024,
    amountUsd: null,
    note: { uk: "Воєнні злочини: Спрямування нападів на цивільні об'єкти (стаття 8(2)(b)(ii) заподіяння надмірної випадкової шкоди цивільному населенню або пошкодженням цивільних об'єктів (стаття 8(2)(b)(iv), а також за злочин проти людяності у вигляді нелюдських дій згідно зі статтею 7(1)(k) Римського статуту.", en: "War crimes: directing attacks against civilian objects (art. 8(2)(b)(ii)); excessive incidental civilian harm (art. 8(2)(b)(iv)); crime against humanity of inhumane acts (art. 7(1)(k)) of the Rome Statute." },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/defendant/shoigu",
    lit: false,
  },
  {
    id: "icc-14",
    institutionId: "icc",
    partOf: "icc-situation",
    actName: { uk: "Валерій Герасимов", en: "Valery Gerasimov" },
    name: "Gerasimov",
    nameUk: "Ордер на арешт: Валерій Герасимов",
    type: { uk: "Кримінальне", en: "Criminal" },
    outcome: "warrant",
    status: { uk: "Ордер видано", en: "Warrant issued" },
    year: 2024,
    amountUsd: null,
    note: { uk: "Воєнні злочини: Спрямування нападів на цивільні об'єкти (стаття 8(2)(b)(ii) заподіяння надмірної випадкової шкоди цивільному населенню або пошкодженням цивільних об'єктів (стаття 8(2)(b)(iv), а також за злочин проти людяності у вигляді нелюдських дій згідно зі статтею 7(1)(k) Римського статуту.", en: "War crimes: directing attacks against civilian objects (art. 8(2)(b)(ii)); excessive incidental civilian harm (art. 8(2)(b)(iv)); crime against humanity of inhumane acts (art. 7(1)(k)) of the Rome Statute." },
    pages: null,
    decisionUrl: "https://www.icc-cpi.int/defendant/gerasimov",
    lit: false,
  },
  {
    id: "itlos-15",
    institutionId: "itlos",
    name: "Detention of Ukrainian Naval Vessels (ITLOS/PCA) – Case Concerning the Detention of Three Ukrainian Naval Vessels (Ukraine v. Russian Federation), Provisional Measures, Order of 25 May 2019, ITLOS Case No. 26; Dispute Concerning the Detention of Ukrainian Naval Vessels and Servicemen (Ukraine v. The Russian Federation), PCA Case No. 2019-28",
    nameShort: "Detention of Ukrainian Naval Vessels and Servicemen (Ukraine v. Russian Federation) – ITLOS and PCA arbitration",
    nameUk: "Затримання трьох українських військових кораблів і моряків (ITLOS та арбітраж PCA)",
    type: { uk: "Морське право", en: "Law of the sea" },
    stage: "merits",
    status: { uk: "Розгляд по суті", en: "Merits pending" },
    year: 2019,
    amountUsd: null,
    note: { uk: "ITLOS 26 · тимчасові заходи; арбітраж по суті за додатком VII UNCLOS", en: "ITLOS 26 · provisional measures; merits arbitration under UNCLOS Annex VII" },
    pages: null,
    decisionUrl: "https://www.itlos.org/fileadmin/itlos/documents/cases/26/published/C26_Order_20190525.pdf",
    lit: false,
  },
  {
    id: "icao-16",
    institutionId: "icao",
    name: "Australia & Netherlands v Russia (ICAO, MH17) Australia and the Netherlands v. Russian Federation, ICAO Council Decision under Article 84 of the Chicago Convention, 12 May 2025 (formal decision document - 30 June 2025)",
    nameShort: "Australia and the Netherlands v. Russian Federation – ICAO Council, MH17",
    nameUk: "Австралія і Нідерланди проти РФ – Рада ICAO, справа MH17",
    type: { uk: "Міжнародне публічне", en: "Public international law" },
    stage: "appeal",
    outcome: "judgment",
    status: { uk: "Рішення (оскаржується)", en: "Decision (under appeal)" },
    year: 2022,
    amountUsd: null,
    note: { uk: "MH17 · Чиказька конвенція, ст. 84", en: "MH17 · Chicago Convention, art. 84" },
    pages: null,
    decisionUrl: "https://www.icao.int/news/icao-council-vote-flight-mh17-case",
    lit: false,
  },
  {
    id: "scc-17",
    institutionId: "scc",
    name: "National Joint Stock Company «Naftogaz of Ukraine» v. PJSC «Gazprom», SCC Arbitration No. V 2014/078/080 - Gas Sales Arbitration",
    nameShort: "National Joint Stock Company «Naftogaz of Ukraine» v. PJSC «Gazprom» – Gas Sales Arbitration",
    nameUk: "Нафтогаз України проти Газпрому – арбітраж щодо купівлі-продажу газу",
    type: { uk: "Комерційний арбітраж", en: "Commercial arbitration" },
    stage: "concluded",
    outcome: "procedural",
    status: { uk: "Врегульовано 2019", en: "Settled (2019)" },
    year: 2014,
    amountUsd: -2020000000,
    note: { uk: "SCC V 2014-078", en: "SCC V 2014-078" },
    pages: null,
    decisionUrl: "https://jusmundi.com/fr/document/decision/en-national-joint-stock-company-naftogaz-of-ukraine-v-public-joint-stock-company-gazprom-final-award-friday-22nd-december-2017#decision_2415",
    lit: false,
  },
  {
    id: "scc-18",
    institutionId: "scc",
    name: "National Joint Stock Company «Naftogaz of Ukraine» v. PJSC «Gazprom», SCC Arbitration No. V 2014/129 - Gas Transit Arbitration",
    nameShort: "National Joint Stock Company «Naftogaz of Ukraine» v. PJSC «Gazprom» – Gas Transit Arbitration",
    nameUk: "Нафтогаз України проти Газпрому – арбітраж щодо транзиту газу",
    type: { uk: "Комерційний арбітраж", en: "Commercial arbitration" },
    stage: "concluded",
    outcome: "procedural",
    status: { uk: "Врегульовано 2019", en: "Settled (2019)" },
    year: 2014,
    amountUsd: 4630000000,
    note: { uk: "SCC V 2014-129", en: "SCC V 2014-129" },
    pages: null,
    decisionUrl: "https://jusmundi.com/fr/document/decision/en-national-joint-stock-company-naftogaz-of-ukraine-v-public-joint-stock-company-gazprom-final-award-wednesday-28th-february-2018#decision_2416",
    lit: false,
  },
  {
    id: "icc-arb-19",
    institutionId: "icc-arb",
    name: "National Joint Stock Company «Naftogaz of Ukraine» v. PJSC «Gazprom» (III), ICC Case No. 27245/GL",
    nameShort: "National Joint Stock Company «Naftogaz of Ukraine» v. PJSC «Gazprom» (III)",
    nameUk: "Нафтогаз України проти Газпрому – третій арбітраж",
    type: { uk: "Комерційний арбітраж", en: "Commercial arbitration" },
    stage: "concluded",
    outcome: "award",
    status: { uk: "Остаточне рішення", en: "Final award" },
    year: 2022,
    amountUsd: 1370000000,
    note: { uk: "ICC 27245/GL", en: "ICC 27245/GL" },
    pages: null,
    decisionUrl: "https://jusmundi.com/en/document/decision/en-national-joint-stock-company-naftogaz-of-ukraine-v-public-joint-stock-company-gazprom-iii-party-representatives",
    lit: false,
  },
  {
    id: "pca-20",
    institutionId: "pca",
    name: "NJSC Naftogaz of Ukraine, PJSC State Joint Stock Company Chornomornaftogaz, PJSC Ukrgasvydobuvannya and others v. The Russian Federation, PCA Case No. 2017-16",
    nameShort: "NJSC Naftogaz of Ukraine, Chornomornaftogaz, Ukrgasvydobuvannya and others v. The Russian Federation",
    nameUk: "Нафтогаз України, Чорноморнафтогаз, Укргазвидобування та інші проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "enforcement",
    status: { uk: "Виконання", en: "Enforcement" },
    year: 2016,
    /* The claim, not the award. The tribunal ordered USD 4,222,875,858.81 plus
       interest and USD 23,889,036.26 in costs – read from the dispositif of
       the Final Award itself, § 717(1)-(2). The five billion is the figure the
       claim was reported at, which is what this field is for; the award is a
       different number and belongs to a write-up. See the note on `amountUsd`
       in content/types.ts, where two rows still disagree with that. */
    amountUsd: 5000000000,
    note: { uk: "PCA 2017-16", en: "PCA 2017-16" },
    /* 236, counted in the PDF. It said 218, which is neither the page count
       nor any figure the award prints. */
    pages: 236,
    /* Final Award, 12 April 2023, 236 pp. – the award itself. */
    decisionUrl: "https://www.italaw.com/sites/default/files/case-documents/180074_0.pdf",
    lit: false,
  },
  {
    id: "pca-21",
    institutionId: "pca",
    name: "Aeroport Belbek LLC and Mr. Igor Valerievich Kolomoisky v. The Russian Federation, PCA Case No. 2015-07",
    nameShort: "Aeroport Belbek LLC and Igor Kolomoisky v. The Russian Federation",
    nameUk: "Аеропорт «Бельбек» і Ігор Коломойський проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    outcome: "liability",
    status: { uk: "Відповідальність встановлена", en: "Liability established" },
    year: 2015,
    amountUsd: null,
    note: { uk: "PCA 2015-07", en: "PCA 2015-07" },
    pages: null,
    /* The award is confidential; the tribunal's press release of 15 February 2019 is the most it published. */
    decisionUrl: "https://pcacases.com/web/sendAttach/2530",
    decisionUrlKind: "press-release",
    lit: false,
  },
  {
    id: "pca-22",
    institutionId: "pca",
    name: "PJSC CB PrivatBank and Finance Company Finilon LLC v. The Russian Federation, PCA Case No. 2015-21",
    nameShort: "PJSC CB PrivatBank and Finilon LLC v. The Russian Federation",
    nameUk: "ПриватБанк і «Фінілон» проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    outcome: "liability",
    status: { uk: "Відповідальність встановлена", en: "Liability established" },
    year: 2015,
    amountUsd: 1000000000,
    note: { uk: "PCA 2015-21 · заявлена", en: "PCA 2015-21 · claimed" },
    pages: null,
    /* Partial Award of 4 February 2019, 108 pp., on the PCA's own server. */
    decisionUrl: "https://pcacases.com/web/sendAttach/40819",
    lit: false,
  },
  {
    id: "pca-23",
    institutionId: "pca",
    name: "JSC Oschadbank v. The Russian Federation, PCA Case No. 2016-14",
    nameShort: "JSC Oschadbank v. The Russian Federation",
    nameUk: "Ощадбанк проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "enforcement",
    /* Both of these have a final award – 26 Nov 2018 and 1 Nov 2023 – and
       carried no `outcome`, while the sibling arbitration pca-24 carries
       "award". On the field's own definition, what the forum issued, this is
       an award. */
    outcome: "award",
    status: { uk: "Виконання", en: "Enforcement" },
    year: 2016,
    amountUsd: 1100000000,
    note: { uk: "PCA 2016-14", en: "PCA 2016-14" },
    pages: null,
    decisionUrl: "https://jusmundi.com/en/document/decision/en-oschadbank-v-russian-federation-none-currently-available-friday-1st-january-2016#decision_4484",
    summarySlug: "oschadbank",
    lit: true,
  },
  {
    id: "pca-24",
    institutionId: "pca",
    name: "PJSC Ukrnafta v. The Russian Federation, PCA Case No. 2015-34",
    nameShort: "PJSC Ukrnafta v. The Russian Federation",
    nameUk: "Укрнафта проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "concluded",
    outcome: "award",
    status: { uk: "Остаточне рішення", en: "Final award" },
    year: 2015,
    amountUsd: 44455012,
    note: { uk: "PCA 2015-34", en: "PCA 2015-34" },
    pages: null,
    /* The Final Award of 12 April 2019 is unpublished; this is the tribunal's joint release with the Stabil arbitration. */
    decisionUrl: "https://pcacases.com/web/sendAttach/2585",
    decisionUrlKind: "press-release",
    lit: false,
  },
  {
    id: "pca-25",
    institutionId: "pca",
    name: "Stabil LLC, Rubenor LLC, Rustel LLC, Novel-Estate LLC, PII Kirovograd-Nafta LLC, Crimea-Petrol LLC, Pirsan LLC, Trade-Trust LLC, Elefteria LLC, VKF Satek LLC, Stemv Group LLC v. The Russian Federation, PCA Case No. 2015-35",
    nameShort: "Stabil LLC and ten other companies v. The Russian Federation",
    nameUk: "«Стабіл» та десять інших компаній проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "concluded",
    outcome: "award",
    status: { uk: "Остаточне рішення", en: "Final award" },
    year: 2015,
    amountUsd: 34600000,
    note: { uk: "PCA 2015-35", en: "PCA 2015-35" },
    pages: null,
    decisionUrl: "https://www.italaw.com/sites/default/files/case-documents/italaw16549.pdf",
    lit: false,
  },
  {
    id: "pca-26",
    institutionId: "pca",
    name: "Everest Estate LLC, Edelveis-2000 PE, Fortuna CJSC and others v. The Russian Federation, PCA Case No. 2015-36",
    nameShort: "Everest Estate LLC, Edelveis-2000 PE, Fortuna CJSC and others v. The Russian Federation",
    nameUk: "«Еверест Естейт» та інші проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "remitted",
    status: { uk: "Повернуто на новий розгляд", en: "Remitted for rehearing" },
    year: 2015,
    amountUsd: 159000000,
    note: { uk: "PCA 2015-36", en: "PCA 2015-36" },
    pages: null,
    /* The Award on the Merits of 2 May 2018 is unpublished. */
    decisionUrl: "https://pcacases.com/web/sendAttach/2325",
    decisionUrlKind: "press-release",
    lit: false,
  },
  {
    id: "pca-27",
    institutionId: "pca",
    name: "Limited Liability Company Lugzor, Limited Liability Company Libset, Limited Liability Company Ukrinterinvest, Public Joint Stock Company DniproAzot, Limited Liability Company Aberon Ltd v. The Russian Federation, PCA Case No. 2015-29",
    nameShort: "Lugzor LLC, Libset LLC, Ukrinterinvest LLC, DniproAzot PJSC and Aberon Ltd v. The Russian Federation",
    nameUk: "«Лугзор», «Лібсет», «Укрінтерінвест», «ДніпроАзот» і «Аберон» проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "concluded",
    /* An award, not a judgment. The tribunal's own press release of
       30 March 2023 is headed "The Tribunal Renders Its Award" (Award of
       4 October 2022, corrected 2 December 2022), and every sibling
       arbitration in this registry already carries "award". */
    outcome: "award",
    status: { uk: "Рішення винесено", en: "Judgment delivered" },
    year: 2015,
    amountUsd: null,
    note: { uk: "PCA 2015-29", en: "PCA 2015-29" },
    pages: null,
    /* The Award of 4 October 2022, corrected 2 December 2022, is unpublished. */
    decisionUrl: "https://pcacases.com/web/sendAttach/45023",
    decisionUrlKind: "press-release",
    lit: false,
  },
  {
    id: "pca-28",
    institutionId: "pca",
    name: "JSC DTEK Krymenergo v. The Russian Federation, PCA Case No. 2018-41",
    nameShort: "JSC DTEK Krymenergo v. The Russian Federation",
    nameUk: "ДТЕК Крименерго проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "enforcement",
    /* Both of these have a final award – 26 Nov 2018 and 1 Nov 2023 – and
       carried no `outcome`, while the sibling arbitration pca-24 carries
       "award". On the field's own definition, what the forum issued, this is
       an award. */
    outcome: "award",
    status: { uk: "Виконання", en: "Enforcement" },
    year: 2018,
    amountUsd: 207800000,
    note: { uk: "PCA 2018-41", en: "PCA 2018-41" },
    pages: null,
    decisionUrl: "https://www.italaw.com/sites/default/files/case-documents/180426.pdf",
    summarySlug: "dtek-krymenergo",
    lit: true,
  },
  {
    id: "pca-29",
    institutionId: "pca",
    name: "National Power Company Ukrenergo v. The Russian Federation, PCA Case No. 2020-17",
    nameShort: "National Power Company Ukrenergo v. The Russian Federation",
    nameUk: "Укренерго проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "merits",
    status: { uk: "Розгляд по суті", en: "Merits pending" },
    year: 2020,
    amountUsd: 580000000,
    /* The seat is not stated here any more. "PCA Paris" was on this row and
       no source carries it – the PCA's own case list does not hold this
       arbitration at all, and neither UNCTAD nor italaw names a seat. */
    note: { uk: "PCA 2020-17 · заявлена", en: "PCA 2020-17 · claimed" },
    pages: null,
    /* No PCA case page exists for this arbitration and both its decisions are unpublished. */
    decisionUrl: "https://investmentpolicy.unctad.org/investment-dispute-settlement/cases/1007/ukrenergo-v-russia",
    decisionUrlKind: "database",
    lit: false,
  },
  {
    id: "pca-30",
    institutionId: "pca",
    name: "NNEGC Energoatom v. The Russian Federation (II)",
    nameUk: "Енергоатом проти РФ – друге провадження",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "upcoming",
    status: { uk: "До арбітражу", en: "Heading to arbitration" },
    year: 2023,
    amountUsd: 3000000000,
    note: { uk: "Заявлена", en: "Claimed" },
    pages: null,
    /* No arbitration has been filed, so there is no forum and no forum document – this is the claimant's own notice. */
    decisionUrl: "https://energoatom.com.ua/news/enerhoatom-initsijuvav-jurydychni-protsedury-proty-rosiyi-shchodo-stjahnennja-zbytkiv-zavdanykh-vijs-kovoju-ahresiyeju",
    decisionUrlKind: "party",
    lit: false,
  },
  {
    id: "pca-31",
    institutionId: "pca",
    name: "PrJSC Ukrhydroenergo v. The Russian Federation",
    nameUk: "Укргідроенерго проти РФ",
    type: { uk: "BIT арбітраж", en: "Investment (BIT) arbitration" },
    stage: "suspended",
    status: { uk: "Призупинено", en: "Suspended" },
    year: 2024,
    amountUsd: 2500000000,
    note: { uk: "Заявлена", en: "Claimed" },
    pages: null,
    /* A notice of dispute that never became an arbitration; the claimant's own announcement is the record. */
    decisionUrl: "https://en.uhe.gov.ua/news/ukrhydroenergo-has-initiated-investment-arbitration-proceedings-against-russian-federation",
    decisionUrlKind: "party",
    lit: false,
  },
  {
    id: "nl-32",
    institutionId: "nl",
    name: "PPS v Girkin, Dubinskiy, Pulatov, Kharchenko (MH17)",
    nameUk: "Прокуратура проти Гіркіна, Дубінського, Пулатова і Харченка (MH17)",
    type: { uk: "Нац. кримінальне", en: "National criminal" },
    stage: "concluded",
    outcome: "verdict",
    status: { uk: "Остаточний вирок", en: "Final verdict" },
    year: 2020,
    amountUsd: null,
    note: { uk: "NL · ECLI:NL:RBDHA", en: "NL · ECLI:NL:RBDHA" },
    pages: null,
    decisionUrl: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBDHA:2022:14037",
    summarySlug: "hague-mh17",
    lit: true,
  },
  {
    id: "nl-33",
    institutionId: "nl",
    name: "JIT MH17 follow-on",
    nameUk: "Подальше розслідування JIT щодо MH17",
    type: { uk: "Нац. кримінальне", en: "National criminal" },
    stage: "suspended",
    status: { uk: "Призупинено", en: "Suspended" },
    year: 2014,
    amountUsd: null,
    note: { uk: "JIT MH17", en: "JIT MH17" },
    pages: null,
    /* The Public Prosecution Service's own page on the JIT investigation. */
    decisionUrl: "https://www.prosecutionservice.nl/topics/m/mh17-plane-crash/criminal-investigation-jit-mh17",
    decisionUrlKind: "case-page",
    lit: false,
  },
  {
    id: "nl-34",
    institutionId: "nl",
    name: "Russia v Naftogaz et al. (Hoge Raad)",
    nameUk: "РФ проти Нафтогазу та інших – Верховний суд Нідерландів",
    type: { uk: "Нац. цивільне", en: "National civil" },
    stage: "concluded",
    outcome: "upheld",
    status: { uk: "Арбітраж залишено", en: "Arbitration upheld" },
    year: 2023,
    amountUsd: null,
    note: { uk: "HR:2024:1810 · скасування", en: "HR:2024:1810 · set aside" },
    pages: null,
    decisionUrl: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:HR:2024:1810",
    lit: false,
  },
  {
    id: "nl-35",
    institutionId: "nl",
    name: "Russia v Belbek/Kolomoisky (Hoge Raad)",
    nameUk: "РФ проти «Бельбека» і Коломойського – Верховний суд Нідерландів",
    type: { uk: "Нац. цивільне", en: "National civil" },
    stage: "concluded",
    outcome: "upheld",
    status: { uk: "Арбітраж залишено", en: "Arbitration upheld" },
    year: 2022,
    amountUsd: null,
    note: { uk: "ECLI:NL:HR:2024:1813", en: "ECLI:NL:HR:2024:1813" },
    pages: null,
    decisionUrl: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:HR:2024:1813",
    lit: false,
  },
  {
    id: "nl-36",
    institutionId: "nl",
    /* Privatbank alone. Finilon was a co-claimant in the arbitration
       (pca-22) but is not a party to this cassation: ECLI:NL:HR:2024:1807
       names "JSC CB PRIVATBANK, gevestigd te Kiev" and no one else. */
    name: "Russia v PrivatBank (Hoge Raad)",
    nameUk: "РФ проти ПриватБанку – Верховний суд Нідерландів",
    type: { uk: "Нац. цивільне", en: "National civil" },
    stage: "concluded",
    outcome: "upheld",
    status: { uk: "Арбітраж залишено", en: "Arbitration upheld" },
    year: 2022,
    amountUsd: null,
    note: { uk: "ECLI:NL:HR:2024:1807", en: "ECLI:NL:HR:2024:1807" },
    pages: null,
    decisionUrl: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:HR:2024:1807",
    lit: false,
  },
  {
    id: "nl-37",
    institutionId: "nl",
    name: "Russia v Everest Estate (Hoge Raad)",
    nameUk: "РФ проти «Еверест Естейт» – Верховний суд Нідерландів",
    type: { uk: "Нац. цивільне", en: "National civil" },
    stage: "remitted",
    status: { uk: "Повернуто до апеляції", en: "Remitted to appeal" },
    year: 2022,
    amountUsd: null,
    note: { uk: "ECLI:NL:HR:2024:1812", en: "ECLI:NL:HR:2024:1812" },
    pages: null,
    decisionUrl: "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:HR:2024:1812",
    lit: false,
  },
  {
    id: "fi-38",
    institutionId: "fi",
    /* The name the court itself uses. The Helsinki District Court's decision
       bulletin of 14 March 2025 calls the defendant "Torden" throughout, in
       every count; "Yan Petrovsky" is the earlier name, common in the
       literature and in no Finnish official source. */
    name: "Finland v Voislav Torden (UJ, Rusich)",
    nameUk: "Фінляндія проти Воїслава Тордена (універсальна юрисдикція, «Русич»)",
    type: { uk: "Нац. кримінальне", en: "National criminal" },
    /* "appeal", not "concluded": both the prosecution and the defence appealed
       the judgment of 14 March 2025 (EJIL:Talk!, 15 Dec 2025), and the
       summary's own verdict matrix carries the appeal as `not-decided`. The
       vocabulary has a key for exactly this state. */
    stage: "appeal",
    outcome: "verdict",
    status: { uk: "Вирок, оскаржується обома сторонами", en: "Convicted; on appeal by both sides" },
    year: 2024,
    amountUsd: null,
    /* Narrowed, and given the docket it always had. The Helsinki District
       Court's own bulletin (14 March 2025, case R 706/2024/11203) says the
       jurisdiction rested on the laws-of-war treaties binding Finland; it does
       not call this the first universal-jurisdiction conviction, and Finland
       had tried such a case before (Massaquoi, acquitted 2022). */
    note: {
      uk: "Helsinki · R 706/2024/11203 · воєнні злочини, універсальна юрисдикція",
      en: "Helsinki · R 706/2024/11203 · war crimes, universal jurisdiction",
    },
    pages: null,
    /* The judgment is not published online; it can only be ordered from the court. This is the court's own decision bulletin. */
    decisionUrl: "https://www.tuomioistuimet.fi/ajankohtaista/tiedotteet/vastaaja-tuomittiin-elinkautiseen-vankeusrangaistukseen-ita-ukrainassa-vuonna-2014-tapahtuneista-sotarikoksista/",
    decisionUrlKind: "press-release",
    summarySlug: "finland-torden",
    lit: true,
  },
  {
    id: "lt-39",
    institutionId: "lt",
    /* The defendant is not named, on the owner's instruction and for the
       reason that prompted it: no Lithuanian source names him. The Prosecutor
       General's statements, reported by LRT, identify him only as a senior
       seaman of the 177th Separate Marine Regiment of the Caspian Flotilla,
       captured near Robotyne; the surname that circulated appears solely in
       Ukrainian media citing the SBU. Lithuanian pre-trial confidentiality
       makes an official name unlikely to exist while the case is open. */
    name: "Lithuania v a serviceman of the 177th Marine Regiment (UJ)",
    nameUk: "Литва проти військовослужбовця 177-го полку морської піхоти – універсальна юрисдикція",
    type: { uk: "Нац. кримінальне", en: "National criminal" },
    stage: "upcoming",
    status: { uk: "До суду", en: "Heading to trial" },
    year: 2025,
    amountUsd: null,
    /* A transfer, not an extradition: a soldier captured in the field and
       handed from one state to another is not the same act, and the archive
       should not blur it. The "first" is attributed rather than asserted –
       Ukraine's Prosecutor General called it the first time a detained Russian
       soldier had been handed to another state, quoted by LRT. */
    note: {
      uk: "Vilnius · перша така передача, за словами ГПУ · катування",
      en: "Vilnius · the first such transfer, per Ukraine's Prosecutor General · torture",
    },
    pages: null,
    /* The Prosecutor General's own release is behind a bot check and could not be retrieved; this is the national broadcaster quoting it. */
    decisionUrl: "https://www.lrt.lt/en/news-in-english/19/2731176/ukraine-hands-over-russian-soldier-accused-of-war-crimes-against-lithuanian-citizen",
    decisionUrlKind: "report",
    lit: false,
  },
  {
    id: "eu-40",
    institutionId: "eu",
    name: "EU / Belgium – frozen assets of the Russian Central Bank (Euroclear)",
    nameUk: "ЄС і Бельгія – знерухомлені активи центрального банку РФ (Euroclear)",
    type: { uk: "Виконавче рішення", en: "Enforcement measure" },
    stage: "frozen",
    status: { uk: "Заморожено безстроково", en: "Frozen indefinitely" },
    year: 2022,
    // Null, and the figure lives in `note` instead, because €210bn is not a
    // dollar amount and this field is dollars – `CasePending` formats it with
    // `Intl.NumberFormat(…, {currency: "USD"})`, so the euro figure printed as
    // «210 000 000 000 $» directly above the note's «Euroclear €210 млрд»:
    // one sum, two currencies, one screen. The immobilised Russian
    // central-bank assets held at Euroclear are quoted in euros by the EU, by
    // Belgium and by Euroclear itself; converting them to dollars here would
    // invent a rate and a date the record does not give. Nor is this a "sum in
    // dispute", which is what the field's only render site calls it: it is a
    // stock of assets frozen by an enforcement measure, not a claim in a
    // proceeding. Every other amount on this list really is USD – the awards
    // and claims in the PCA, SCC and ICC arbitrations – so this row was the
    // only mismatch. Restoring the number here needs a currency-carrying
    // field, which means a change in `components/cases/CasePending.tsx`.
    amountUsd: null,
    note: { uk: "Euroclear €210 млрд", en: "Euroclear €210bn" },
    pages: null,
    /* Council Regulation (EU) 2022/334 – the act that immobilised the assets. */
    decisionUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R0334",
    lit: false,
  },
];

/**
 * The library's rows: every record that is a proceeding in its own right.
 *
 * `registryCases` is every record, including the acts folded into another –
 * the six ICC warrants, which are searchable and printed on the situation's
 * row but are not rows themselves. Anything that lists, counts or routes to
 * proceedings reads this; anything that resolves a record by id, or checks the
 * data against itself, reads `registryCases`.
 */
export const registryProceedings: RegistryCase[] = registryCases.filter(
  (c) => !c.partOf,
);

/** The acts folded into one proceeding, in the order they are recorded. */
export const actsOf = (id: string): RegistryCase[] =>
  registryCases.filter((c) => c.partOf === id);
