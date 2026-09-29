import type { DecisionSummary, SummaryBlock } from "./types";
import verbatim from "./icj-genocide.verbatim.json";
import verbatimUk from "./icj-genocide.uk.json";

/**
 * Allegations of Genocide (Ukraine v. Russian Federation: 32 States
 * intervening), ICJ Judgment on Preliminary Objections of 2 February 2024.
 *
 * `verbatim` holds the summary prose exactly as ingested from the source .docx
 * (English – the language of the judgment). The fields below add a localized
 * visualization layer whose every value restates something already in that
 * prose:
 *   • the timeline dates all appear in "FACTUAL BACKGROUND" (2014, 21, 22 and
 *     26 February 2022) and in the masthead (2 February 2024);
 *   • the objection ledger quotes the six objections as the summary lists them,
 *     and their outcomes as "LEGAL CONSEQUENCES" disposes of them;
 *   • the theatre restates the two oblasts the alleged genocide concerns.
 * What is NOT in the summary is sourced from the Court's own record. The
 * voting tallies and the two positive findings come from the operative clause
 * of the judgment itself (§ 151); the Order of 16 March 2022 from § 10; the
 * intervention figures from § 14, 18, 21 and 23; the Order of 5 June 2023 and
 * its own tallies from § 18 and ICJ press release 2023/27. The judgment's text
 * is published in HTML at https://www.icj-cij.org/node/203503 – that is what
 * every § reference below points at, and it is the same document as the PDF at
 * `judgment.url`, which sits behind a bot wall plain HTTP clients cannot pass.
 * The post-judgment timeline entries come from the Court's case page
 * (https://www.icj-cij.org/case/182) and press releases 2025/5 and 2025/55.
 *
 * Where to read the PDFs when icj-cij.org refuses. The Court's own origin host
 * serves the identical files without the bot wall –
 * https://icj-web.leman.un-icc.cloud/sites/default/files/case-related/182/…
 * – and the Wayback Machine holds the December 2025 filings. That is how
 * `cases.ts`'s `pages: 70` was checked: the file at `judgment.url` is the
 * I.C.J. Reports 2024 fascicle offprint, 70 PDF pages, the judgment running
 * pp. 360-425 (official citation "I.C.J. Reports 2024, p. 360"). The HTML twin
 * paginates the earlier advance version instead and stops at "- 60 -", which
 * is why the two disagree; 70 is right for the file we link.
 *
 * The Order of 5 December 2025 and press release 2025/55 exist as /node pages
 * (206010 and 206019) but those carry metadata only – no HTML body – so the
 * time-limits in the timeline below come from the Order's own § 68, read from
 * the PDF.
 *
 * A caution for the next editor. The verbatim prose introduces the list of
 * requests “(a)”–“(f)” as the Memorial's, but that list is paragraph 30 of the
 * *Application* (judgment § 24). The Memorial's own submissions are at § 178
 * (judgment § 25) and are lettered differently: its (b) is the no-genocide
 * declaration, its (c) the use of force, its (d) the recognition of the
 * “republics”. The dispositif rules on § 178, so the verdict matrix below quotes
 * § 178. The verbatim itself is left exactly as ingested.
 *
 * How the write-up is blocked, and why. The prose arrived as 48 blocks of
 * which 42 were an undifferentiated `p`, so the page drew forty-two identical
 * paragraphs and a reader had no way to see whose voice any of them was – and
 * at the time that was the whole page: `bands: "four"` hid the objection
 * ledger, the submissions matrix and the interpretations, so the write-up
 * carried the case alone. (That whitelist is gone – see `hideSections` below,
 * which drops the overview and the interpretations and lets everything else
 * render.) The pass that fixed it changed NOT ONE CHARACTER of the
 * text; it only said what each block is, and joined two runs the author had
 * already written as one list. In reading order:
 *
 *   • the Court's answer to the whole case (block 1), its holding on
 *     jurisdiction (15-17), its reading of Article IX (19) and its disposal of
 *     the two aspects (24-25) are `position` – the Court speaking;
 *   • «Тобто, подаючи позовну заяву…» (7) and the closing paragraph on what
 *     makes this the first false-genocide case (35) are `note` – the write-up
 *     speaking about the Court, which was set exactly like the Court's own;
 *   • the two aspects of the dispute (21, 23) are `claim`, so each is paired
 *     with the Court's answer beside it – the § 38 quotation for the first,
 *     the holding for the second;
 *   • the Memorial's requests (a)-(f) are one `findings` block and Russia's
 *     six objections one `p`, each joined at the author's own paragraph breaks
 *     so the page sets them as the lists they already are rather than as
 *     thirteen loose paragraphs.
 *
 * Nothing here interprets: every seam is one the author drew. The one thing
 * the data cannot yet ask for is a proper ordered list on the (a)-(f) and
 * (1)-(6) runs – the renderer's enumerator rule knows «1.» and «–» but not
 * «(1)» or «(a)», which is how the ICJ letters its submissions.
 */
export const icjGenocide: DecisionSummary = {
  ...(verbatim as {
    id: string;
    caseId: string;
    masthead: { official: string; parties: string; judgment: string };
    blocks: SummaryBlock[];
  }),
  blocksUk: (verbatimUk as { blocks: SummaryBlock[] }).blocks,

  /* Review's edit: «поміняти назву рішення – забрати про 32 держави-інтервенти
     і залишити про геноцид». The intervening States are a fact about the
     proceeding, not its subject, and they were the only thing the page's own
     title said. The library's row for this case has read «звинувачення у
     геноциді» all along, so the two now agree.

     The Court's own case name keeps the interveners – it is a citation, and
     `cases.ts` quotes it in full under `name`. This is the page's heading,
     not the citation.

     Then the form changed again. icj-cerd-icsft's h1 became the Court's full
     case name – «Замінюємо назву на таку», the owner's own wording – and the
     archive's two ICJ pages cannot carry two different shapes of headline
     while the instruction is «стандартизована назва». So this is the same
     shape: the Court's case name, with «: 32 States intervening» taken out of
     the parenthesis exactly as the review asked and nothing else altered. */
  /* Third pass on this heading, and the last one is the owner's own string:
     «одразу великими літерами дати повну назву, а (Ukraine v. Russian
     Federation: 32 States Intervening) маленькими знизу». The template
     already sets a title that way – the subject in the display type, the
     trailing parenthetical under it in italic gold – so the instruction is
     satisfied in the data alone. Two things came back into the string:

       • «: 32 States intervening». It had been cut on the ground that the
         interveners are a fact about the proceeding and not its subject.
         They are, but they are in the parenthesis, which is where the facts
         about the proceeding go – and that parenthesis is the small line.
       • «. Попередні заперечення». This docket has produced an order on
         provisional measures, a judgment on preliminary objections and an
         order on counter-claims, and the archive will hold more of them. A
         title that does not say which one this is cannot be cited, and it
         is the one thing the masthead's own «Рішення від 2 лютого 2024»
         says only by its date.

     The phase rides with the parties rather than in the heading – it is the
     same kind of fact, and in the display type it would read as part of the
     Convention's name. See `titleTail` in cases/[slug]/page.tsx. */
  title: {
    uk: "Звинувачення у геноциді згідно з Конвенцією про запобігання злочину геноциду та покарання за нього (Україна проти Російської Федерації: 32 держави-інтервенти). Попередні заперечення",
    en: "Allegations of Genocide under the Convention on the Prevention and Punishment of the Crime of Genocide (Ukraine v. Russian Federation: 32 States intervening). Preliminary Objections",
  },
  /* The share card's wording (scripts/og-cards.mts). Carried over from the
     hand-drawn cards so the redrawn ones say the same. */
  card: {
    title: "Україна проти РФ: 32 держави-інтервенти",
    eyebrow: "Міжнародний суд ООН · рішення 2 лютого 2024",
    kicker: "Юрисдикцію за Конвенцією про геноцид підтверджено",
  },
  seoTitle: {
    uk: "Україна проти Росії: геноцид, попередні заперечення – МС ООН",
    en: "Ukraine v. Russia (Genocide), Preliminary Objections – ICJ",
  },
  /* The masthead in Ukrainian – the caption under the title and the line
     in the eyebrow. `masthead` keeps the decision's own English, which is
     what the citation block reproduces; this is what a Ukrainian reader
     sees at the top of the page. See `mastheadUk` in summaries/types.ts. */
  mastheadUk: {
    /* Identical to `title` on purpose: the caption was that same sentence
       stopping before «(Україна проти Російської Федерації)», so under the
       full case name it read as a shortened copy of the headline. The masthead
       prints it once – same guard as on icj-cerd-icsft. */
    official:
      "Звинувачення у геноциді згідно з Конвенцією про запобігання злочину геноциду та покарання за нього (Україна проти Російської Федерації: 32 держави-інтервенти). Попередні заперечення",
    judgment: "Рішення від 2 лютого 2024",
  },

  /* The docket is live: the merits phase, the counter-claims and the second
     round of interventions all post-date the judgment this page is about. */
  asOf: "2026-08-26",

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
  /* Named removals, not a whitelist of four.

     This page carried `bands: "four"` – «ЗАЛИШАТИ ХРОНОЛОГІЮ, МІСЦЕ РОЗГЛЯДУ,
     ОГЛЯД ТА ДЖЕРЕЛА» from the corrections document, applied as a whitelist
     that silenced every other band. The next review overturned it from the
     other end: it asked for edits to the submissions matrix – a new heading,
     the ground column gone, the result column reworded – which is a section a
     whitelist of four cannot show, and at the same time for «Забрати Key
     rulings on the law» and «Забрати Overview – не має ніякої цінності»,
     which a whitelist cannot express either, because naming what stays says
     nothing about what the reviewer wants gone.

     So the instrument is inverted here: everything renders except the two
     sections the review names. The chronology, the map, the write-up and the
     sources – the four the first line asked for – are all still here; what
     joins them is the matrix, the docket card, the ledger of Russia's six
     objections and the intervention figures.

     Not the neighbours: «забери з усіх рішень секцію Пов'язані рішення» took
     that band out of the template for every decision (49de66a), so it is not
     a band this list can give back, and "related" is no longer a member of
     `hideSections` either. See `hideSections` in summaries/types.ts. */
  /* «overview» більше не в списку: секція, яку він ховав, звалася «Якщо
     коротко» і була абзацом, а тепер це «Картка справи» – реквізити
     провадження, які має нести кожне рішення. Власниця: «перша секція –
     картка справи». Разом із карткою повертається й той абзац; якщо він
     тут зайвий, прибирати його треба окремо, а не разом із карткою. */
  hideSections: ["rulings"],

  metaDesc: {
    uk: "Рішення МС ООН від 2 лютого 2024 щодо попередніх заперечень: п'ять із шести заперечень Росії відхилено; вимоги (c) і (d) – поза Конвенцією.",
    en: "ICJ judgment on preliminary objections, 2 February 2024: five of Russia's six objections rejected; submissions (c) and (d) fall outside the Convention.",
  },

  plain: {
    tldr: {
      uk: "Росія виправдовувала вторгнення вигаданим «геноцидом на Донбасі». Україна пішла до Міжнародного суду ООН, щоб той офіційно засвідчив: геноциду не було. Суд погодився розглядати саме це – і відхилив п'ять із шести заперечень Росії. Але вимоги визнати незаконними визнання «ДНР/ЛНР» і саму «спецоперацію» Суд розглядати відмовився: це поза межами Конвенції про геноцид.",
      en: "Russia justified its invasion with a fabricated “genocide in Donbas”. Ukraine went to the International Court of Justice to have it put on the record that no genocide occurred. The Court agreed to hear exactly that claim, rejecting five of Russia's six objections. It refused, however, to rule on the recognition of the “DPR/LPR” and on the “special military operation” themselves: those lie outside the Genocide Convention.",
    },
  },


  judgment: {
    court: { uk: "Міжнародний суд ООН", en: "International Court of Justice" },
    url: "https://www.icj-cij.org/sites/default/files/case-related/182/182-20240202-jud-01-00-en.pdf",
    caseUrl: "https://www.icj-cij.org/case/182",
    date: "2024-02-02",
  },

  instruments: [
    {
      abbr: "Genocide Convention",
      name: {
        uk: "Конвенція про запобігання злочину геноциду та покарання за нього",
        en: "Convention on the Prevention and Punishment of the Crime of Genocide",
      },
      year: 1948,
      url: "https://treaties.un.org/doc/Treaties/1951/01/19510112%2008-12%20PM/Ch_IV_1p.pdf",
    },
  ],

  stats: [
    { value: "6", label: { uk: "заперечень Росії", en: "objections by Russia" } },
    { value: "5", label: { uk: "відхилено", en: "rejected" } },
    { value: "1", label: { uk: "задоволено", en: "upheld" } },
    { value: "32", label: { uk: "держави у справі", en: "States intervening" } },
  ],

  /* The docket ledger. The four rows this instrument opened with are kept; the
     rest are the machinery of the judgment that the summary prose never states
     – the General List number and the authoritative text from the judgment's
     own front matter, the bench from its "Present:" line, the two positive
     findings and their tallies from the operative clause (§ 151 (8) and (9)),
     the hearing dates from § 23, and the count of appended opinions from the
     paragraph that closes the judgment. */
  glance: [
    /* The parties. This card had none – it opened on the composition of the
       Court – so the page for the genocide case did not say who was suing
       whom, while every other claim-type case did.

       Taken from the judgment's own party block: "between Ukraine, represented
       by … and the Russian Federation, represented by …". The 32 intervening
       States are deliberately NOT here: they intervene under Article 63 and
       are not parties. They have their own card in «Хто є хто», and the case
       title names them, which is where the judgment names them too. */
    { label: { uk: "Заявник", en: "Applicant" }, value: { uk: "Україна", en: "Ukraine" } },
    {
      label: { uk: "Відповідач", en: "Respondent" },
      value: { uk: "Російська Федерація", en: "Russian Federation" },
    },
    {
      label: { uk: "Склад Суду", en: "Bench" },
      value: { uk: "15 суддів і суддя ad hoc", en: "15 Members and one judge ad hoc" },
    },
    {
      label: { uk: "Підстава юрисдикції", en: "Basis of jurisdiction" },
      value: { uk: "Стаття IX Конвенції про геноцид", en: "Article IX, Genocide Convention" },
    },
    {
      label: { uk: "Автентичний текст", en: "Authoritative text" },
      value: { uk: "французький", en: "French" },
    },
    {
      label: { uk: "Позов подано", en: "Application filed" },
      value: { uk: "26 лютого 2022", en: "26 February 2022" },
    },
    {
      label: { uk: "Слухання", en: "Hearings" },
      value: { uk: "18–27 вересня 2023", en: "18–27 September 2023" },
    },
    {
      label: { uk: "Юрисдикцію встановлено", en: "Jurisdiction upheld" },
      value: { uk: "15 голосами проти 1", en: "by 15 votes to 1" },
    },
    {
      label: { uk: "Вимогу визнано прийнятною", en: "Claim held admissible" },
      value: { uk: "13 голосами проти 3", en: "by 13 votes to 3" },
    },
    {
      label: { uk: "Окремі думки й заяви", en: "Opinions and declarations" },
      value: { uk: "10 – від 11 суддів", en: "10, from 11 judges" },
    },
    {
      label: { uk: "Що йде далі по суті", en: "What proceeds to the merits" },
      value: { uk: "Вимога (b) § 178 Меморандуму", en: "Submission (b), § 178 of the Memorial" },
    },
    {
      label: { uk: "Що відсічено", en: "What was cut" },
      value: { uk: "Вимоги (c) і (d) § 178", en: "Submissions (c) and (d), § 178" },
    },
  ],

  /* Four threads run through this docket at once – the interim measures, the
     intervention, the objections and the merits – and they interleave, so a
     flat list read as noise. The background facts carry no track, which is
     what puts them in every filter. */
  timelineTracks: [
    { id: "provisional", label: { uk: "Тимчасові заходи", en: "Provisional measures" } },
    { id: "intervention", label: { uk: "Вступ держав", en: "Intervention" } },
    { id: "objections", label: { uk: "Попередні заперечення", en: "Preliminary objections" } },
    { id: "merits", label: { uk: "По суті", en: "Merits" } },
  ],

  /* Карта закриває розділ фактичних обставин – див. `mapAfterPart`
     у summaries/types.ts. */
  mapAfterPart: 0,

  timeline: [
    {
      date: { uk: "Весна 2014", en: "Spring 2014" },
      iso: "2014-04-01",
      kind: "context",
      label: {
        uk: "На Донбасі спалахує збройний конфлікт",
        en: "Armed conflict erupts in Donbas",
      },
      note: {
        uk: "У Донбаському регіоні на сході України – між збройними силами України та силами, пов'язаними з двома утвореннями, які називають себе «Донецька Народна Республіка» (ДНР) і «Луганська Народна Республіка» (ЛНР). Попри спроби досягти мирного врегулювання збройний конфлікт тривав з 2014 до 2022 року (§ 29).",
        en: "In the Donbas region in the east of Ukraine, between Ukrainian armed forces and forces linked to two entities that refer to themselves as the “Donetsk People's Republic” (DPR) and the “Luhansk People's Republic” (LPR). Despite attempts to achieve a peaceful resolution, the armed conflict continued between 2014 and 2022 (§ 29).",
      },
    },
    {
      date: { uk: "21 лютого 2022", en: "21 February 2022" },
      iso: "2022-02-21",
      kind: "context",
      label: {
        uk: "Росія визнає «ДНР» і «ЛНР» незалежними державами",
        en: "Russia recognizes the “DPR” and “LPR” as independent States",
      },
      note: {
        uk: "Указами свого Президента, п. Володимира Путіна, Російська Федерація формально визнала ДНР і ЛНР незалежними державами. У зверненні того ж дня Президент РФ послався на нібито тривалі напади на громади Донбасу і на геноцид, якого нібито не помічає світ (§ 30).",
        en: "By decrees of its President, Mr Vladimir Putin, the Russian Federation formally recognized the DPR and LPR as independent States. In an address delivered the same day, the President of the Russian Federation invoked purported continuing attacks against the Donbas communities and a genocide the world was said to be ignoring (§ 30).",
      },
    },
    {
      date: { uk: "22 лютого 2022", en: "22 February 2022" },
      iso: "2022-02-22",
      kind: "context",
      label: {
        uk: "Два «договори про дружбу, співробітництво і взаємну допомогу»",
        en: "Two “Treaties on Friendship, Cooperation and Mutual Assistance”",
      },
      note: {
        uk: "Російська Федерація уклала те, що вона називає двома «договорами про дружбу, співробітництво і взаємну допомогу», – один із ДНР, другий із ЛНР. Того ж дня ДНР і ЛНР звернулися до Російської Федерації по військову допомогу на підставі цих «договорів» (§ 31).",
        en: "The Russian Federation concluded what it refers to as two “Treaties on Friendship, Cooperation and Mutual Assistance”, one with the DPR and the other with the LPR. On the same date, the DPR and LPR requested military assistance from the Russian Federation pursuant to these “treaties” (§ 31).",
      },
    },
    {
      date: { uk: "24 лютого 2022", en: "24 February 2022" },
      iso: "2022-02-24",
      kind: "context",
      label: {
        uk: "Оголошено «спеціальну воєнну операцію»",
        en: "The “special military operation” is declared",
      },
      note: {
        uk: "О 6-й ранку за московським часом Президент Російської Федерації заявив, що вирішив провести в Україні «спеціальну воєнну операцію», пославшись на статтю 51 Статуту ООН і на потребу захистити людей від нібито геноциду. Операцію розпочато рано вранці того ж дня (§ 31–32).",
        en: "At 6 a.m. (Moscow time) the President of the Russian Federation declared that he had decided to conduct a “special military operation” in Ukraine, invoking Article 51 of the Charter of the United Nations and the need to protect people from a purported genocide. The operation was launched early in the morning on the same day (§ 31–32).",
      },
    },
    /* § 33, and it had been missing. The address of 24 February is on this
       page twice over – in the entry above and in the write-up – but the
       letter that put it before the United Nations was not, and that letter
       is the document in which the invasion is filed as self-defence under
       Article 51. It is the same UN doc. S/2022/154 the judgment cites for
       the address itself: the speech is the annex, this is the cover letter.
       Owner's chronology names it; the archive's did not. */
    {
      date: { uk: "24 лютого 2022", en: "24 February 2022" },
      iso: "2022-02-24",
      kind: "filing",
      label: {
        uk: "Росія повідомляє Раду Безпеки про «самооборону» за статтею 51",
        en: "Russia notifies the United Nations of “self-defence” under Article 51",
      },
      note: {
        uk: "Листом від 24 лютого 2022 року Постійний представник Російської Федерації при ООН передав Генеральному секретареві ООН текст звернення Президента РФ того ж дня, пояснивши, що ним громадян Росії повідомлено про заходи, вжиті за статтею 51 Статуту ООН у здійсненні права на самооборону (§ 33; док. ООН S/2022/154).",
        en: "By a letter dated 24 February 2022 the Permanent Representative of the Russian Federation to the United Nations forwarded to the Secretary-General the text of the address of the President of the Russian Federation of the same date, explaining that it informed the citizens of Russia of measures taken under Article 51 of the Charter in exercise of the right of self-defence (§ 33; UN doc. S/2022/154).",
      },
    },
    {
      date: { uk: "26 лютого 2022", en: "26 February 2022" },
      iso: "2022-02-26",
      kind: "filing",
      label: {
        uk: "Україна подає позов до Суду",
        en: "Ukraine files its Application",
      },
      note: {
        uk: "МЗС України оприлюднило заяву, у якій викрило «неправдиві й образливі звинувачення Росії у геноциді як привід для незаконної воєнної агресії проти України». Того ж дня, за кілька годин після заяви, Україна подала позовну заяву до Суду разом із запитом про вжиття тимчасових заходів (§ 34–35).",
        en: "Ukraine's Ministry of Foreign Affairs issued a statement denouncing “Russia's false and offensive allegations of genocide as a pretext for its unlawful military aggression against Ukraine”. The same day, a few hours after the statement, Ukraine filed its Application before the Court together with a Request for the indication of provisional measures (§ 34–35).",
      },
    },
    {
      date: { uk: "7 березня 2022", en: "7 March 2022" },
      iso: "2022-03-07",
      track: "provisional",
      label: {
        uk: "Слухання щодо тимчасових заходів – Росія не з'явилася",
        en: "Hearing on provisional measures – Russia does not appear",
      },
      note: {
        uk: "Посол РФ повідомив листом від 5 березня, що його уряд вирішив не брати участі. Одразу після закриття слухання він передав документ про «відсутність юрисдикції Суду» (§ 8–9).",
        en: "By a letter of 5 March the Russian Ambassador stated that his Government had decided not to participate. Shortly after the hearing closed he transmitted a document on “the lack of jurisdiction of the Court” (§ 8–9).",
      },
    },
    {
      date: { uk: "16 березня 2022", en: "16 March 2022" },
      iso: "2022-03-16",
      kind: "order",
      track: "provisional",
      label: {
        uk: "Суд ухвалює тимчасові заходи",
        en: "The Court indicates provisional measures",
      },
      note: {
        uk: "13 голосами проти 2 Суд зобов'язав Росію негайно призупинити воєнні операції, розпочаті 24 лютого 2022 року на території України. Другий захід – тим самим складом голосів – поширив це на підконтрольні їй формування; третій, одностайний, зобов'язав обидві сторони не поглиблювати спір (§ 10; наказ, § 86).",
        en: "By thirteen votes to two the Court ordered Russia to suspend immediately the military operations it commenced on 24 February 2022 in the territory of Ukraine. The second measure, on the same split, extended that to units it directs or supports; the third, unanimous, bound both Parties not to aggravate the dispute (§ 10; the Order, § 86).",
      },
    },
    {
      date: { uk: "1 липня 2022", en: "1 July 2022" },
      iso: "2022-07-01",
      kind: "filing",
      track: "merits",
      label: { uk: "Україна подає Меморандум", en: "Ukraine files its Memorial" },
      note: {
        uk: "Наказом від 23 березня 2022 року строк було встановлено на 23 вересня; Меморандум подано достроково. Саме його § 178 містить вимоги, на які відповідає резолютивна частина рішення (§ 12, 25).",
        en: "The Order of 23 March 2022 had fixed 23 September as the time-limit; the Memorial came early. It is its paragraph 178 that carries the submissions the dispositif answers (§ 12, 25).",
      },
    },
    {
      date: { uk: "21 лип. – 15 груд. 2022", en: "21 Jul – 15 Dec 2022" },
      iso: "2022-07-21",
      kind: "filing",
      track: "intervention",
      label: {
        uk: "33 держави подають декларації про вступ у справу",
        en: "33 States file declarations of intervention",
      },
      note: {
        uk: "За статтею 63(2) Статуту – від Латвії 21 липня до Ліхтенштейну 15 грудня. Канада і Нідерланди подали спільну декларацію (§ 14).",
        en: "Under Article 63 (2) of the Statute – from Latvia on 21 July to Liechtenstein on 15 December. Canada and the Netherlands filed jointly (§ 14).",
      },
    },
    {
      date: { uk: "3 жовтня 2022", en: "3 October 2022" },
      iso: "2022-10-03",
      kind: "filing",
      track: "objections",
      label: {
        uk: "Росія заявляє шість попередніх заперечень",
        en: "Russia raises six preliminary objections",
      },
      note: {
        uk: "Розгляд по суті зупинено. Наказом від 7 жовтня 2022 року Суд дав Україні строк до 3 лютого 2023 року на письмову заяву із зауваженнями – вона подала її вчасно (§ 13).",
        en: "The proceedings on the merits were suspended. By an Order of 7 October 2022 the Court gave Ukraine until 3 February 2023 to file its written statement of observations; it filed within the time-limit (§ 13).",
      },
    },
    {
      date: { uk: "5 червня 2023", en: "5 June 2023" },
      iso: "2023-06-05",
      kind: "order",
      track: "intervention",
      label: {
        uk: "Суд допускає у справу 32 держави",
        en: "The Court admits 32 States to the case",
      },
      note: {
        uk: "14 голосами проти 1 – декларації 32 держав прийнятні на стадії попередніх заперечень, у частині тлумачення статті IX та інших положень Конвенції. Одностайно – декларація США на цій стадії неприйнятна (§ 18; прес-реліз 2023/27).",
        en: "By fourteen votes to one the declarations of 32 States were admissible at the preliminary objections stage, in so far as they concerned the construction of Article IX and other relevant provisions. Unanimously, the declaration of the United States was inadmissible at that stage (§ 18; press release 2023/27).",
      },
    },
    {
      date: { uk: "18–27 вересня 2023", en: "18–27 September 2023" },
      iso: "2023-09-18",
      track: "objections",
      label: {
        uk: "Публічні слухання щодо заперечень",
        en: "Public hearings on the objections",
      },
      note: {
        uk: "П'ять днів слухань – 18, 19, 20, 25 і 27 вересня. Окрім сторін, Суд заслухав представників усіх 32 держав, що вступили у справу (§ 23).",
        en: "Five days of hearings – 18, 19, 20, 25 and 27 September. Besides the Parties, the Court heard representatives of all 32 intervening States (§ 23).",
      },
    },
    {
      date: { uk: "2 лютого 2024", en: "2 February 2024" },
      iso: "2024-02-02",
      kind: "judgment",
      track: "objections",
      label: {
        uk: "Рішення щодо попередніх заперечень",
        en: "Judgment on preliminary objections",
      },
      note: {
        uk: "П'ять заперечень відхилено, друге задоволено. Суд встановив юрисдикцію щодо вимоги (b) § 178 Меморандуму 15 голосами проти 1 і визнав її прийнятною 13 голосами проти 3; вимоги (c) і (d) – поза його юрисдикцією (§ 151).",
        en: "Five objections rejected, the second upheld. The Court found jurisdiction over submission (b) of § 178 of the Memorial by fifteen votes to one and held it admissible by thirteen votes to three; submissions (c) and (d) fall outside its jurisdiction (§ 151).",
      },
    },
    {
      date: { uk: "Липень–серпень 2024", en: "July–August 2024" },
      iso: "2024-08-02",
      kind: "filing",
      track: "intervention",
      label: {
        uk: "Держави поновлюють вступ на стадії по суті",
        en: "The intervening States renew for the merits",
      },
      note: {
        uk: "Секретар Суду запропонував їм до 2 серпня 2024 року подати нову декларацію або зберегти попередню. Озвалися 23 держави з 32: дев'ять подали нові декларації, вісім – уточнені, шість зберегли попередні без змін. Польща додатково подала заяву про вступ за статтею 62 Статуту (сторінка справи на сайті Суду; прес-релізи 2024/58, 2024/59).",
        en: "The Registrar invited them, by 2 August 2024, to file a new declaration or maintain their original one. Twenty-three of the 32 responded: nine filed new declarations, eight filed adjusted ones and six maintained theirs unchanged. Poland additionally filed an Application for permission to intervene under Article 62 of the Statute (the Court's case page; press releases 2024/58 and 2024/59).",
      },
    },
    {
      date: { uk: "18 листопада 2024", en: "18 November 2024" },
      iso: "2024-11-18",
      kind: "filing",
      track: "merits",
      label: {
        uk: "Росія подає Контрмеморандум із зустрічними вимогами",
        en: "Russia files a Counter-Memorial containing counter-claims",
      },
      note: {
        uk: "Україна заперечила проти прийнятності зустрічних вимог; Суд запропонував сторонам викласти свої позиції до 20 травня і 22 вересня 2025 року (прес-реліз 2025/5).",
        en: "Ukraine objected to the admissibility of the counter-claims; the Court invited the Parties to submit their views by 20 May and 22 September 2025 (press release 2025/5).",
      },
    },
    {
      date: { uk: "5 грудня 2025", en: "5 December 2025" },
      iso: "2025-12-05",
      kind: "order",
      track: "merits",
      label: {
        uk: "Зустрічні вимоги Росії визнано прийнятними як такі",
        en: "Russia's counter-claims held admissible as such",
      },
      note: {
        uk: "11 голосами проти 4. Тим самим наказом, одностайно, Суд дозволив Україні подати Репліку до 7 грудня 2026 року, а Росії – Дуплік до 7 грудня 2027 року. До наказу додано сім окремих і особливих думок та заяв (наказ, § 68; прес-реліз 2025/55).",
        en: "By eleven votes to four. By the same Order, unanimously, the Court authorized Ukraine to submit a Reply by 7 December 2026 and Russia a Rejoinder by 7 December 2027. Seven separate and dissenting opinions and declarations are appended to it (the Order, § 68; press release 2025/55).",
      },
    },
  ],

  /* The intervention is the countable fact this case's own title carries, and
     the summary prose gives only the headline number. Every figure here is in
     the judgment's chronology of the procedure. */
  takings: {
    /* Назва без переваги в найвищому ступені.

     Смуга звалася «Найбільший вступ третіх держав в історії Суду». Цифри
     під нею – з рішення (§ 14, 18, 21, 23) і з наказу від 5 червня 2023
     року, тобто перевірні; а от «найбільший в історії» немає в огляді, і
     сторінка його нізвідки не бере. Власниця: «сумнівну аналітику
     прибрати». Лишилося те, що смуга справді показує. */
    heading: {
      uk: "Вступ третіх держав",
      en: "Third-State intervention",
    },
    note: {
      uk: "Стаття 63 Статуту дозволяє учасниці договору подати Суду власне тлумачення цього договору. Цифри – з рішення (§ 14, 18, 21, 23) і з наказу від 5 червня 2023 року.",
      en: "Article 63 of the Statute lets a party to a convention put its own construction of that convention before the Court. The figures come from the judgment (§ 14, 18, 21, 23) and the Order of 5 June 2023.",
    },
    metrics: [
      {
        label: {
          uk: "Держав подали декларації про вступ",
          en: "States that filed a declaration of intervention",
        },
        value: "33",
        count: 33,
        note: {
          uk: "від Латвії 21 липня 2022 до Ліхтенштейну 15 грудня 2022; Канада і Нідерланди подали спільну декларацію",
          en: "from Latvia on 21 July 2022 to Liechtenstein on 15 December 2022; Canada and the Netherlands filed jointly",
        },
      },
      {
        label: {
          uk: "Визнано прийнятними на стадії заперечень",
          en: "Held admissible at the objections stage",
        },
        value: "32",
        count: 32,
        note: {
          uk: "наказ від 5 червня 2023 року, 14 голосами проти 1",
          en: "Order of 5 June 2023, by fourteen votes to one",
        },
      },
      {
        label: { uk: "Декларацію визнано неприйнятною", en: "Declaration held inadmissible" },
        value: "1",
        note: {
          uk: "США – одностайно, у частині, що стосується стадії попередніх заперечень",
          en: "the United States – unanimously, in so far as it concerned the preliminary objections stage",
        },
      },
      {
        label: { uk: "Подали письмові зауваження", en: "Filed written observations" },
        value: { uk: "31 з 32", en: "31 of 32" },
        percent: 96.9,
        note: { uk: "усі, крім Ліхтенштейну", en: "all but Liechtenstein" },
      },
      {
        label: { uk: "Виступили на слуханнях", en: "Represented at the hearings" },
        value: { uk: "усі 32", en: "all 32" },
        note: {
          uk: "частина представників виступала від імені групи держав",
          en: "several counsel spoke on behalf of groups of States",
        },
      },
    ],
  },

  objections: {
    /* Без числа: скільки їх, видно з самих карток, а назва розділу, яка
     рахує, застаріває від першої ж правки в даних. Власниця: «може
     перейменувати розділи без цифри». */
    heading: { uk: "Заперечення Росії", en: "Russia's objections" },
    note: {
      uk: "Росія намагалася зупинити справу шістьма способами; п'ять Суд відхилив. Тексти заперечень наведено за самері, підрахунки голосів – за резолютивною частиною рішення, якої самері не відтворює. Натисніть картку, щоб побачити позицію Суду.",
      en: "Russia tried six ways to stop the case; the Court rejected five. The objections are quoted from the summary; the tallies come from the operative clause, which the summary does not reproduce. Tap a card for the Court's position.",
    },
    benchSize: 16,
    items: [
      {
        ground: { uk: "Спору не існувало", en: "No dispute existed" },
        objection: {
          uk: "Суд не має юрисдикції, бо на момент подання позову між сторонами не існувало спору за Конвенцією про геноцид.",
          en: "the Court lacks jurisdiction as there was no dispute between the Parties under the Genocide Convention at the time of the filing of the Application",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Суд розглянув спір у двох аспектах і встановив: на день подання позову спір між сторонами існував – щонайменше щодо того, чи вчинила Україна геноцид (§ 51).",
          en: "The Court examined the dispute in two aspects and found that on the date of the Application a dispute did exist between the Parties – at least as to whether Ukraine had committed genocide (§ 51).",
        },
        votes: [{ for: 15, against: 1 }],
      },
      {
        ground: { uk: "Юрисдикція за предметом", en: "Jurisdiction over the subject-matter" },
        latin: "ratione materiae",
        objection: {
          uk: "Суд не має юрисдикції ratione materiae.",
          en: "the Court lacks jurisdiction ratione materiae",
        },
        outcome: "upheld",
        reasoning: {
          uk: "Єдине заперечення, яке спрацювало. Дії, у яких Україна звинувачує Росію, з жодного боку не здатні становити порушення статей I і IV Конвенції, тож вимоги (c) і (d) § 178 Меморандуму випадають зі справи (§ 147).",
          en: "The one objection that worked. The acts Ukraine complains of are not capable, on any view, of constituting violations of Articles I and IV, so submissions (c) and (d) of § 178 of the Memorial fall out of the case (§ 147).",
        },
        votes: [
          {
            for: 12,
            against: 4,
            scope: { uk: "щодо вимог (c) і (d)", en: "as to submissions (c) and (d)" },
          },
        ],
      },
      {
        ground: { uk: "Нові вимоги в Меморандумі", en: "New claims in the Memorial" },
        objection: {
          uk: "Україна заявила в Меморандумі нові вимоги, і їх слід визнати неприйнятними.",
          en: "Ukraine made new claims in the Memorial and these should be found inadmissible",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Суд не побачив підміни предмета спору: вимоги Меморандуму лише уточнюють позов, з яким Україна прийшла до Суду. Відхилено окремо щодо вимоги (b) (§ 72) і щодо вимог (c) і (d) (§ 129) – звідси два підрахунки голосів.",
          en: "The Court saw no substitution of the subject of the dispute: the Memorial merely clarifies the claim Ukraine brought. Rejected separately as to submission (b) (§ 72) and as to submissions (c) and (d) (§ 129) – hence the two tallies.",
        },
        votes: [
          { for: 15, against: 1, scope: { uk: "щодо вимоги (b)", en: "as to submission (b)" } },
          {
            for: 14,
            against: 2,
            scope: { uk: "щодо вимог (c) і (d)", en: "as to submissions (c) and (d)" },
          },
        ],
      },
      {
        ground: { uk: "Рішення не мало б практичного ефекту", en: "A judgment would lack practical effect" },
        objection: {
          uk: "Вимоги України неприйнятні, бо можливе рішення Суду не мало б практичного ефекту.",
          en: "Ukraine's claims are inadmissible as the Court's potential judgment would lack practical effect",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Суд відхилив аргумент: декларативне рішення щодо першого аспекту спору з'ясувало б, чи діяла Україна відповідно до своїх зобов'язань за Конвенцією (§ 80).",
          en: "The Court rejected the argument: a declaratory judgment on the first aspect of the dispute would clarify whether Ukraine acted in accordance with its obligations under the Convention (§ 80).",
        },
        votes: [{ for: 14, against: 2 }],
      },
      {
        ground: { uk: "Позов про невчинення порушення", en: "A claim of non-violation" },
        objection: {
          uk: "Прохання України визнати, що вона не порушувала своїх зобов'язань за Конвенцією, є неприйнятним.",
          en: "Ukraine's request for a declaration that it did not breach its obligations under the Convention is inadmissible",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Найважливіше для майбутніх справ: стаття IX не виключає прохання держави визнати, що вона не є відповідальною за геноцид (§ 99), а за особливих обставин цієї справи таке прохання не є неприйнятним (§ 109). Саме на цьому тримається позов України.",
          en: "The finding that matters most for future cases: Article IX does not preclude a State from seeking a declaration that it is not responsible for genocide (§ 99), and in the particular circumstances of this case such a request is not inadmissible (§ 109). Ukraine's whole claim rests on it.",
        },
        votes: [{ for: 13, against: 3 }],
      },
      {
        ground: { uk: "Зловживання процесом", en: "Abuse of process" },
        objection: {
          uk: "Позов України неприйнятний, бо становить зловживання процесом.",
          en: "Ukraine's Application is inadmissible as it constitutes an abuse of process",
        },
        outcome: "rejected",
        reasoning: {
          uk: "Суд не знайшов виняткових обставин, які виправдали б відмову у розгляді на цій підставі; на підтримку третього аргументу Росія спиралася виключно на поведінку й заяви держав, що вступили у справу (§ 117–118).",
          en: "The Court found no exceptional circumstances that would justify rejecting the claim on this ground; in support of its third argument Russia relied exclusively on the conduct and statements of the intervening States (§ 117–118).",
        },
        votes: [{ for: 15, against: 1 }],
      },
    ],
  },

  interpretations: [
    {
      term: { uk: "Один спір – два аспекти", en: "One dispute, two aspects" },
      ruling: {
        uk: "Суд розділив вимогу України надвоє (§ 53–57). Перший аспект – прохання визнати, що Україна «не вчиняла геноциду»; лише він відповідає ознакам спору за статтею IX. Другий – прохання визнати незаконними дії Росії; ним Україна порушує питання міжнародної відповідальності, і його Суд розглядати не має права.",
        en: "The Court split Ukraine's claim in two (§ 53–57). The first aspect – the request to find that Ukraine “has not committed genocide” – alone answers to a dispute under Article IX. The second – the request to find Russia's conduct unlawful – invokes State responsibility, and the Court has no jurisdiction over it.",
      },
    },
    {
      term: { uk: "Межа Конвенції про геноцид", en: "The limit of the Convention" },
      ruling: {
        uk: "Застосування сили з 24 лютого 2022 року й визнання «ДНР/ЛНР» лежать поза Конвенцією про геноцид: вони є зовнішніми щодо неї й регулюються іншими нормами міжнародного права (§ 147). Суд додав, що це не залежить від того, чи дії Росії справді доведені: навіть якби їх було доведено повністю, вони не здатні становити порушення статей I і IV (§ 139).",
        en: "The use of force since 24 February 2022 and the recognition of the “DPR/LPR” lie outside the Genocide Convention: they are extrinsic to it and governed by other rules of international law (§ 147). The Court added that this does not turn on whether Russia's acts are made out: even assuming they were fully established, they could not constitute violations of Articles I and IV (§ 139).",
      },
    },
    {
      term: { uk: "Позов про невчинення порушення", en: "A claim of non-violation" },
      ruling: {
        uk: "Стаття IX не виключає можливості держави просити визнати, що вона не є відповідальною за геноцид (§ 99); за особливих обставин цієї справи – позов подано в умовах збройного конфлікту, розпочатого нібито заради запобігання геноциду – така вимога не є неприйнятною (§ 108–109). Це відкриває шлях для позовів, спрямованих проти хибних звинувачень.",
        en: "Article IX does not preclude a State from seeking a declaration that it is not responsible for genocide (§ 99); and in the particular circumstances of this case – a claim brought in the context of an armed conflict waged on a stated ground of preventing genocide – such a request is not inadmissible (§ 108–109). That opens a path for claims aimed at false accusations.",
      },
    },
    {
      term: { uk: "Юрисдикція – не те саме, що законність", en: "Jurisdiction is not lawfulness" },
      ruling: {
        uk: "Останній абзац мотивувальної частини Суд адресує саме тим, хто прочитає рішення як виправдання (§ 150): між згодою держави на юрисдикцію Суду і відповідністю її дій міжнародному праву є принципова різниця. Держави зобов'язані виконувати Статут ООН та інші норми незалежно від того, чи визнали вони юрисдикцію Суду, і залишаються відповідальними за протиправні діяння, які їм присвоюються.",
        en: "The last paragraph of the reasoning is aimed at anyone who would read the judgment as a vindication (§ 150): there is a fundamental distinction between a State's acceptance of the Court's jurisdiction and the conformity of its acts with international law. States must fulfil their obligations under the UN Charter and other rules whether or not they have consented to jurisdiction, and remain responsible for wrongful acts attributable to them.",
      },
    },
  ],


  theatres: [
    {
      place: { uk: "Донеччина та Луганщина", en: "Donetsk & Luhansk oblasts" },
      tag: "Genocide Convention",
      markerKeys: ["donetsk", "luhansk"],
      areas: ["east"],
      // the only theatre sits level with Kyiv – drop the label below the zones
      summary: {
        uk: "Саме тут, за твердженням Росії, стався «геноцид», що став приводом для вторгнення. Україна просить Суд встановити, що жодних актів геноциду тут вчинено не було.",
        en: "This is where Russia claims a “genocide” took place – the stated pretext for the invasion. Ukraine asks the Court to find that no acts of genocide were committed here.",
      },
    },
  ],

  sources: [
    {
      url: "https://www.ejiltalk.org/icj-delivers-preliminary-objections-judgment-in-the-ukraine-v-russia-genocide-case-ukraine-loses-on-the-most-important-aspects/",
      title:
        "ICJ Delivers Preliminary Objections Judgment in the Ukraine v. Russia Genocide Case, Ukraine Loses on the Most Important Aspects",
      authors: "Marko Milanovic",
      publication: "EJIL: Talk!",
      date: "2 February 2024",
      type: "blog post",
    },
    {
      url: "https://verfassungsblog.de/the-curious-fate-of-the-false-claim-of-genocide/",
      title:
        "The Curious Fate of the False Claim of Genocide: On the ICJ's Preliminary Objections Judgment in Ukraine v. Russia and Beyond",
      authors: "Iryna Marchuk, Aloka Wanigasuriya",
      publication: "Verfassungsblog",
      date: "24 February 2024",
      type: "blog post",
    },
    {
      url: "https://www.ejiltalk.org/human-rights-reparations-and-fact-finding-quandaries-in-the-2024-icj-judgments-in-ukraine-v-russian-federation/",
      title:
        "Human Rights, Reparations and Fact-Finding Quandaries in the 2024 ICJ Judgments in Ukraine v. Russian Federation",
      authors: "",
      publication: "EJIL: Talk!",
      date: "2024",
      type: "blog post",
    },
    {
      url: "https://opiniojuris.org/2026/02/24/icjs-recent-order-in-ukraine-v-russia-genocide-case-declaratory-relief-asymmetric-counter-claims-and-direct-connection-requirement/",
      title:
        "ICJ's Recent Order in Ukraine v. Russia Genocide Case: Declaratory Relief, Asymmetric Counter-Claims and Direct Connection Requirement",
      authors: "",
      publication: "Opinio Juris",
      date: "24 February 2026",
      type: "blog post",
    },
  ],
};
