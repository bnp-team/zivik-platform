import type { Localized } from "./types";
import { locales, type Locale } from "@/i18n/config";
import { registryProceedings, registryCases } from "./cases";
import { SUMMARIES } from "./summaries";
import { siteUrl } from "@/lib/seo";
import { analyticsEnabled } from "@/lib/analytics";

/**
 * Legal pages – the Privacy Policy and the Terms of Use, bilingual.
 *
 * Adapted from the Faculty of Law's existing policy and terms, which were
 * written for the faculty's admissions site. Everything that belonged to that
 * site and not to this one was dropped rather than translated across:
 * admission questionnaires, scholarship applications, study contracts, the
 * state education database and the applicant's cabinet. This site has no
 * forms at all – the only personal data it can receive is an email address
 * someone chooses to send us, so the policy says that and nothing more.
 *
 * Two clauses the source lacked are added here because this library needs
 * them: an accuracy / "not legal advice" clause (a summary is not the
 * decision), and an intellectual-property clause that separates the court
 * acts we merely link to – which are not ours – from the summaries,
 * chronologies, translations, maps and design, which are.
 *
 * The legal framing stays Ukrainian: Закон України «Про захист персональних
 * даних», the Ombudsman as the supervisory authority, Ukrainian law as the
 * governing law. The English text is a translation of that same content, not
 * a GDPR policy; the single sentence about the GDPR in `privacy` is a
 * signpost, not a grant of rights, and is flagged for counsel.
 */

/* ── Constants ──────────────────────────────────────────────────────────── */

/**
 * Contact address for the pages. Mirrors `footer.email` in the dictionaries
 * (`src/i18n/dictionaries/uk.ts` → `footer.email`) so the address a reader is
 * given in the footer is the address the legal pages name; keep the two in
 * sync – and `data-check.mjs` now checks that they are, because they drifted:
 * the footer moved to the research centre's address and this one stayed on the
 * old project mailbox, so the legal pages named an address the site no longer
 * gave anywhere else. A comment asking a human to keep two constants equal is
 * a comment that will be wrong eventually.
 *
 * It is not read from the dictionary at runtime because the dictionaries carry
 * UI chrome, and these strings are content.
 */
export const legalEmail = "louis.sohn.center@ucu.edu.ua";

/**
 * How much of the library is written, counted rather than typed.
 *
 * These two numbers were hardcoded in the prose ("39 проваджень, з яких
 * опрацьовано 8"). That is a bad thing to hardcode in a document that carries
 * a revision date and that nobody re-reads: the ninth summary would have made
 * a legal page state a falsehood, silently. `content/cases.ts` is the same
 * source of truth the library page and the sitemap use.
 */
/* Proceedings, not records: the six ICC warrants are acts within ICC-01/22
   and the library lists them on its row rather than as rows of their own. */
export const registryTotal = registryProceedings.length;
export const registrySummarised = registryCases.filter(
  (c) => c.summarySlug && c.summarySlug in SUMMARIES,
).length;

/** Telephone of the Faculty of Law, as published by the faculty. */
export const legalPhone = "+38 (032) 240-99-40";

/**
 * The production host – похідний від `siteUrl`, а не вписаний руками.
 *
 * Тут стояв літерал `zivik-platform.vercel.app` з приміткою «MUST BE
 * CONFIRMED BEFORE LAUNCH»: сайт тим часом переїхав на Cloudflare
 * (`*.workers.dev`), а константа лишилася на Vercel. Тепер зміна домену –
 * це одна змінна збірки, NEXT_PUBLIC_SITE_URL, і ця константа йде за нею
 * разом з канонічними URL і sitemap (docs/LAUNCH.md).
 *
 * У прозі й далі НЕ використовується: обидва документи називають сайт на
 * ім'я («НаСвітло» / the Site), тож переїзд на інший домен тексту не
 * змінює. Якщо колись пункт муситиме назвати адресу – брати звідси.
 */
export const legalHost = new URL(siteUrl).host;

/**
 * Date of the current revision of both documents, ISO – for `<time dateTime>`
 * and for the human string below, so the two can never disagree.
 *
 * Дві редакції, бо розділ «Файли cookie та аналітика» має два варіанти
 * (`cookiesBlocks` нижче): без аналітики – редакція від 25 серпня, з
 * Cloudflare Web Analytics – від дня, коли написано абзац про неї. Збірка з
 * NEXT_PUBLIC_CF_ANALYTICS_TOKEN показує другу дату, і обіцянка з тексту
 * («назвемо сервіс … та оновимо дату редакції») виконується сама.
 * Правлячи будь-який із двох варіантів, оновлюйте відповідну дату.
 */
const revisedWithoutAnalytics = "2026-08-25";
const revisedWithAnalytics = "2026-09-26";
export const legalRevisedIso = analyticsEnabled
  ? revisedWithAnalytics
  : revisedWithoutAnalytics;

/** Locale tags for date formatting (the site's `uk`/`en` are not enough: a
 *  bare "en" formats as American and would print "August 25, 2026"). */
const dateLocaleTag: Record<Locale, string> = { uk: "uk-UA", en: "en-GB" };

/** The revision date as a reader sees it, derived from the ISO date above. */
export const legalRevised: Localized = Object.fromEntries(
  locales.map((locale) => [
    locale,
    new Intl.DateTimeFormat(dateLocaleTag[locale], {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${legalRevisedIso}T00:00:00Z`)),
  ]),
) as Localized;

/* ── Model ──────────────────────────────────────────────────────────────── */

/**
 * One block inside a section: a paragraph, or a bulleted list.
 *
 * A paragraph may carry one trailing in-site link (`link`), which is how a
 * clause points at the other document or at the library without prose
 * having to contain markup.
 */
export type LegalBlock =
  | {
      kind: "p";
      text: Localized;
      link?: { label: Localized; /** path after `/{locale}/` */ to: string };
    }
  | { kind: "ul"; items: Localized<string[]> };

/** A numbered clause. Numbers are drawn by CSS counters, never authored. */
export interface LegalSection {
  /** Stable anchor, e.g. `"cookies"`. */
  id: string;
  heading: Localized;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  /** Route segment under `/{locale}/`. */
  slug: "privacy" | "terms";
  title: Localized;
  /** Standfirst – one honest sentence about what the document says. */
  lede: Localized;
  sections: LegalSection[];
}

/* ── Privacy policy ─────────────────────────────────────────────────────── */

/**
 * Розділ «Файли cookie та аналітика» – залежно від збірки.
 *
 * Текст мусить бути правдою про ту саму збірку, яку читач відкрив: маячок
 * Cloudflare Web Analytics вмикається змінною NEXT_PUBLIC_CF_ANALYTICS_TOKEN
 * (`lib/analytics.ts`), і та сама змінна перемикає тут абзац. Інакше
 * політика або обіцяла б «аналітики немає» на сторінці з маячком, або
 * описувала б сервіс, якого немає.
 *
 * Що саме стверджує варіант з аналітикою – з документації Cloudflare
 * (developers.cloudflare.com/web-analytics і /speed/observatory/rum-beacon):
 * скрипт нічого не зберігає в браузері й не читає (cookie, localStorage,
 * sessionStorage, IndexedDB); IP-адресу Cloudflare відкидає в найближчому
 * дата-центрі й не зберігає; у звітах дані доступні за попередні шість
 * місяців. Якщо Cloudflare змінить ці умови – змінити й текст.
 */
const cookiesBlocks: LegalBlock[] = analyticsEnabled
  ? [
      {
        kind: "p",
        text: {
          uk: "Сайт не встановлює файлів cookie. Щоб розуміти, скільки людей читає бібліотеку і які сторінки відкривають, ми використовуємо Cloudflare Web Analytics – сервіс вебаналітики компанії Cloudflare, Inc. Його скрипт не зберігає у вашому браузері нічого (ні cookie, ні localStorage чи інших сховищ) і не створює «відбитка» пристрою, тож банера згоди на cookie ми не показуємо.",
          en: "The Site sets no cookies. To understand how many people read the library and which pages they open, we use Cloudflare Web Analytics, a web-analytics service of Cloudflare, Inc. Its script stores nothing in your browser (no cookies, no localStorage or other storage) and does not fingerprint your device, so we show no cookie consent banner.",
        },
      },
      {
        kind: "p",
        text: {
          uk: "Під час перегляду сторінки скрипт надсилає до Cloudflare знеособлені технічні відомості: адресу сторінки й сторінки, з якої ви перейшли, тип браузера й пристрою, країну та показники швидкості завантаження. IP-адресу Cloudflare відкидає одразу в найближчому дата-центрі й не зберігає. Ми бачимо лише зведену статистику – без даних про окремих читачів; у звітах вона доступна за попередні шість місяців.",
          en: "When a page is viewed, the script sends Cloudflare anonymised technical information: the page address and the referring page, the browser and device type, the country and page-load performance measurements. Cloudflare discards the IP address at the nearest data centre and does not store it. We see only aggregate statistics, with nothing about individual readers; reports cover the previous six months.",
        },
      },
      {
        kind: "p",
        text: {
          uk: "Мета – підтримувати бібліотеку корисною та швидкою; підстава – законний інтерес Факультету. Щоб скрипт не завантажувався, достатньо блокувальника вмісту чи вбудованого захисту від стеження у вашому браузері – бібліотека працює й без нього.",
          en: "The purpose is to keep the library useful and fast; the ground is the Faculty’s legitimate interest. To stop the script from loading, a content blocker or your browser’s built-in tracking protection is enough – the library works without it.",
        },
      },
    ]
  : [
      {
        kind: "p",
        text: {
          uk: "Станом на дату цієї редакції Сайт не встановлює власних файлів cookie і не використовує сервісів вебаналітики. Ми не показуємо банера згоди на cookie, бо погоджуватися немає на що.",
          en: "As at the date of this revision the Site sets no cookies of its own and uses no web-analytics service. We show no cookie consent banner because there is nothing to consent to.",
        },
      },
      {
        kind: "p",
        text: {
          uk: "Якщо аналітику колись буде запроваджено, ми назвемо тут сервіс, мету, дані, які він збирає, і строк їх зберігання, та оновимо дату редакції. Керувати файлами cookie ви завжди можете в налаштуваннях свого браузера.",
          en: "If analytics is ever introduced, we will name here the service, its purpose, the data it collects and how long that data is kept, and we will update the revision date. You can always manage cookies in your browser settings.",
        },
      },
    ];

export const privacy: LegalDocument = {
  slug: "privacy",
  title: { uk: "Політика конфіденційності", en: "Privacy policy" },
  lede: {
    uk: "Користуватися бібліотекою можна, не залишаючи про себе жодних даних. Персональні дані потрапляють до нас лише тоді, коли ви самі нам пишете.",
    en: "You can read the library without leaving any data about yourself. Personal data reaches us only when you write to us yourself.",
  },
  sections: [
    {
      id: "general",
      heading: { uk: "Загальні положення", en: "General provisions" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Ця Політика конфіденційності (далі – Політика) пояснює, які персональні дані збирає та обробляє Факультет права Українського католицького університету (далі – Факультет, ми) через вебсайт бібліотеки «НаСвітло» (далі – Сайт), з якою метою та на яких підставах.",
            en: "This Privacy Policy (the Policy) explains what personal data the Faculty of Law of the Ukrainian Catholic University (the Faculty, we) collects and processes through the website of the NaSvitlo library (the Site), for what purposes and on what grounds.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Володільцем персональних даних є Український католицький університет, Факультет права, вул. Іларіона Свєнціцького, 17, м. Львів, 79011, Україна. Бібліотеку веде Дослідницький центр Луї Зона Факультету права УКУ.",
            en: "The controller of personal data is the Ukrainian Catholic University, Faculty of Law, 17 Svientsitskoho St., Lviv, 79011, Ukraine. The library is run by the Louis Sohn Research Centre at the UCU Faculty of Law.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Обробка персональних даних здійснюється відповідно до Закону України «Про захист персональних даних» та інших актів законодавства України.",
            en: "Personal data is processed in accordance with the Law of Ukraine “On Personal Data Protection” and other legislation of Ukraine.",
          },
        },
      ],
    },
    {
      id: "data",
      heading: { uk: "Які дані ми збираємо", en: "What data we collect" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "На Сайті немає ані реєстрації, ані особистого кабінету, ані будь-яких форм: більшість читачів користується бібліотекою, не надаючи про себе нічого. Ми можемо обробляти лише дві категорії даних.",
            en: "The Site has no registration, no user account and no forms of any kind: most readers use the library without providing anything about themselves. There are only two categories of data we may process.",
          },
        },
        {
          kind: "ul",
          items: {
            uk: [
              "Електронна адреса та зміст листа – якщо ви пишете нам або просите надсилати вам щомісячний лист бібліотеки. Підписка сьогодні оформлена як звичайний лист: посилання «Підписатися» відкриває ваш поштовий застосунок, тож ваша адреса надходить до нас у складі листа, який надсилаєте ви самі, разом із тим, що додає до нього ваш поштовий клієнт (ім'я відправника, дата, службові заголовки). Жодної форми, яка передавала б дані на Сайт, не існує.",
              "Технічні дані про відвідування – IP-адреса, тип пристрою та браузера, запитані сторінки, час звернення. Їх у службових журналах фіксує постачальник хостингу, як це робить кожен вебсервер; ці записи потрібні для роботи та безпеки Сайту, ми не пов'язуємо їх з особою і не використовуємо для спостереження за читачами.",
            ],
            en: [
              "Your email address and the content of your message – if you write to us, or ask to receive the library’s monthly letter. The subscription is currently an ordinary email: the “Subscribe” link opens your mail application, so your address reaches us inside a message you send yourself, together with whatever your mail client adds to it (sender name, date, technical headers). There is no form on the Site that transmits data to us.",
              "Ordinary technical data about your visit – IP address, device and browser type, pages requested, time of the request. These are recorded in server logs by the hosting provider, as every web server does; the records are needed to keep the Site running and secure, we do not link them to a person and we do not use them to watch readers.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            uk: "Ми не збираємо особливих категорій даних і просимо їх нам не надсилати.",
            en: "We do not collect special categories of data and ask you not to send them to us.",
          },
        },
      ],
    },
    {
      id: "purpose",
      heading: {
        uk: "Мета та підстави обробки",
        en: "Purposes and grounds of processing",
      },
      blocks: [
        {
          kind: "ul",
          items: {
            uk: [
              "Відповісти на ваше звернення – обробка потрібна, щоб розглянути лист, який ви надіслали з власної ініціативи, і відповісти на нього.",
              "Надсилати щомісячний лист бібліотеки – виключно на підставі вашої згоди, яку ви даєте, попросивши про підписку, і можете відкликати будь-коли.",
              "Забезпечувати роботу, доступність і безпеку Сайту – на підставі законного інтересу Факультету підтримувати публічну бібліотеку в робочому стані.",
            ],
            en: [
              "To answer your message – processing is needed to consider and reply to correspondence you sent on your own initiative.",
              "To send the library’s monthly letter – solely on the basis of your consent, given when you ask to be subscribed and withdrawable at any time.",
              "To keep the Site working, available and secure – on the basis of the Faculty’s legitimate interest in maintaining a public library in working order.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            uk: "Ми не використовуємо ваші дані для реклами, профілювання чи автоматизованого ухвалення рішень і не передаємо їх нікому з такою метою.",
            en: "We do not use your data for advertising, profiling or automated decision-making, and we do not pass it to anyone for those purposes.",
          },
        },
      ],
    },
    {
      id: "cookies",
      heading: { uk: "Файли cookie та аналітика", en: "Cookies and analytics" },
      blocks: cookiesBlocks,
    },
    {
      id: "sharing",
      heading: { uk: "Передавання даних", en: "Sharing of data" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Ми не продаємо персональних даних і не передаємо їх нікому для маркетингу. Дані можуть стати доступними лише:",
            en: "We do not sell personal data and we do not pass it to anyone for marketing. Data may become available only to:",
          },
        },
        {
          kind: "ul",
          items: {
            uk: [
              analyticsEnabled
                ? "постачальникам технічних послуг – хостинг Сайту, сервіс вебаналітики Cloudflare Web Analytics і поштова служба університету, у межах, потрібних для того, щоб Сайт відкривався, статистика відвідувань рахувалася, а лист доходив;"
                : "постачальникам технічних послуг – хостинг Сайту та поштова служба університету, у межах, потрібних для того, щоб Сайт відкривався, а лист доходив;",
              "іншим підрозділам Українського католицького університету – лише тоді й у тому обсязі, як цього вимагає розгляд вашого звернення;",
              "державним органам – у випадках, прямо передбачених законодавством України.",
            ],
            en: [
              analyticsEnabled
                ? "technical service providers – the Site’s hosting, the Cloudflare Web Analytics service and the University’s mail service, to the extent needed for the Site to load, for visits to be counted and for an email to arrive;"
                : "technical service providers – the Site’s hosting and the University’s mail service, to the extent needed for the Site to load and for an email to arrive;",
              "other units of the Ukrainian Catholic University – only where and to the extent that handling your message requires it;",
              "state authorities – in the cases directly provided for by the legislation of Ukraine.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            uk: "Сайт розміщено в зовнішнього постачальника хостингу, сервери й мережа якого можуть перебувати за межами України, тож технічні дані про відвідування можуть оброблятися за кордоном у межах, потрібних для відображення сторінок.",
            en: "The Site is hosted with an external provider whose servers and network may be located outside Ukraine, so technical data about a visit may be processed abroad to the extent needed to deliver the pages.",
          },
        },
      ],
    },
    {
      id: "retention",
      heading: { uk: "Строк зберігання", en: "Retention" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Листування ми зберігаємо, доки це потрібно, щоб відповісти й підтвердити, як звернення було розглянуте, після чого видаляємо його. Адресу для щомісячного листа зберігаємо, доки ви не відмовитеся від нього; після відмови вона зникає зі списку. Службові журнали сервера зберігаються короткий технічний строк, який визначає постачальник хостингу.",
            en: "We keep correspondence for as long as it takes to reply and to show how the message was handled, and then delete it. An address given for the monthly letter is kept until you unsubscribe, after which it is removed from the list. Server logs are kept for the short technical period set by the hosting provider.",
          },
        },
      ],
    },
    {
      id: "rights",
      heading: {
        uk: "Права суб'єкта персональних даних",
        en: "Your rights as a data subject",
      },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Відповідно до законодавства України ви маєте право:",
            en: "Under the legislation of Ukraine you have the right:",
          },
        },
        {
          kind: "ul",
          items: {
            uk: [
              "знати, які ваші дані ми обробляємо, звідки вони й з якою метою;",
              "отримати доступ до цих даних, вимагати їх виправлення, оновлення чи видалення;",
              "відкликати згоду на обробку – зокрема відмовитися від щомісячного листа;",
              "заперечувати проти обробки у випадках, визначених законом;",
              "звернутися зі скаргою до Уповноваженого Верховної Ради України з прав людини – органу, що контролює додержання законодавства про захист персональних даних.",
            ],
            en: [
              "to know what data of yours we process, where it came from and for what purpose;",
              "to obtain access to that data and to require its correction, updating or deletion;",
              "to withdraw your consent to processing – including unsubscribing from the monthly letter;",
              "to object to processing in the cases set out by law;",
              "to lodge a complaint with the Ukrainian Parliament Commissioner for Human Rights (the Ombudsman), the authority supervising compliance with personal data protection law.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            uk: `Щоб скористатися будь-яким із цих прав, напишіть нам на ${legalEmail}. Щоб перестати отримувати щомісячний лист, достатньо відповісти на нього словом «Відписатися».`,
            en: `To exercise any of these rights, write to us at ${legalEmail}. To stop receiving the monthly letter, it is enough to reply to it with the word “Unsubscribe”.`,
          },
        },
        {
          kind: "p",
          text: {
            uk: "Бібліотекою користуються і в Європейському Союзі: якщо до обробки ваших даних застосовний Загальний регламент ЄС про захист даних (GDPR), ми розглянемо ваш запит у тих межах, у яких регламент застосовний.",
            en: "The library is read in the European Union too: where the EU General Data Protection Regulation (GDPR) applies to the processing of your data, we will deal with your request to the extent that it applies.",
          },
        },
      ],
    },
    {
      id: "security",
      heading: { uk: "Безпека даних", en: "Data security" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Ми вживаємо розумних організаційних і технічних заходів, щоб захистити дані від несанкціонованого доступу, втрати чи розголошення; Сайт передається захищеним з'єднанням (HTTPS).",
            en: "We take reasonable organisational and technical measures to protect data against unauthorised access, loss or disclosure; the Site is served over a secure connection (HTTPS).",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Водночас жоден спосіб передавання даних через інтернет не є абсолютно захищеним, а звичайна електронна пошта захищеним каналом не є. Якщо ви працюєте з чутливою інформацією – про потерпілих, свідків чи незавершені провадження, – не надсилайте її нам звичайним листом.",
            en: "That said, no method of transmitting data over the internet is completely secure, and ordinary email is not a secure channel. If you work with sensitive information – about victims, witnesses or pending proceedings – please do not send it to us by ordinary email.",
          },
        },
      ],
    },
    {
      id: "changes",
      heading: { uk: "Зміни до Політики", en: "Changes to this Policy" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: analyticsEnabled
              ? "Ми можемо оновлювати цю Політику – зокрема якщо зміниться сервіс аналітики або на Сайті з'явиться форма підписки. Чинна редакція завжди опублікована на цій сторінці із зазначенням дати оновлення."
              : "Ми можемо оновлювати цю Політику – зокрема якщо на Сайті з'являться аналітика чи форма підписки. Чинна редакція завжди опублікована на цій сторінці із зазначенням дати оновлення.",
            en: analyticsEnabled
              ? "We may update this Policy – in particular if the analytics service changes or a subscription form appears on the Site. The current revision is always published on this page with the date of the update."
              : "We may update this Policy – in particular if analytics or a subscription form appears on the Site. The current revision is always published on this page with the date of the update.",
          },
        },
      ],
    },
    {
      id: "contacts",
      heading: { uk: "Контакти", en: "Contacts" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "З будь-яких питань щодо обробки персональних даних звертайтеся:",
            en: "For any question about the processing of personal data, contact us:",
          },
        },
        {
          kind: "ul",
          items: {
            uk: [
              "Факультет права Українського католицького університету",
              "вул. Іларіона Свєнціцького, 17, м. Львів, 79011, Україна",
              `Телефон: ${legalPhone}`,
              `Електронна пошта: ${legalEmail}`,
            ],
            en: [
              "Faculty of Law, Ukrainian Catholic University",
              "17 Svientsitskoho St., Lviv, 79011, Ukraine",
              `Telephone: ${legalPhone}`,
              `Email: ${legalEmail}`,
            ],
          },
        },
      ],
    },
  ],
};

/* ── Terms of use ───────────────────────────────────────────────────────── */

export const terms: LegalDocument = {
  slug: "terms",
  title: { uk: "Умови користування", en: "Terms of use" },
  lede: {
    uk: "Бібліотека відкрита і безкоштовна. Головне, про що просимо пам'ятати: огляд – це не рішення, і ніщо тут не є юридичною консультацією.",
    en: "The library is open and free to use. The main things to keep in mind: a summary is not the decision, and nothing here is legal advice.",
  },
  sections: [
    {
      id: "general",
      heading: { uk: "Загальні положення", en: "General provisions" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Ці Умови користування (далі – Умови) регулюють доступ до вебсайту бібліотеки «НаСвітло» (далі – Сайт) і користування ним. Сайт веде Дослідницький центр Луї Зона Факультету права Українського католицького університету, вул. Іларіона Свєнціцького, 17, м. Львів, 79011, Україна.",
            en: "These Terms of use (the Terms) govern access to and use of the website of the NaSvitlo library (the Site). The Site is run by the Louis Sohn Research Centre at the Faculty of Law of the Ukrainian Catholic University, 17 Svientsitskoho St., Lviv, 79011, Ukraine.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Користуючись Сайтом, ви погоджуєтеся з цими Умовами. Якщо ви не погоджуєтеся з будь-яким їх положенням, будь ласка, припиніть користування Сайтом.",
            en: "By using the Site you agree to these Terms. If you do not agree with any of their provisions, please stop using the Site.",
          },
        },
      ],
    },
    {
      id: "purpose",
      heading: { uk: "Призначення Сайту", en: "What the Site is for" },
      blocks: [
        {
          /* «Мапа судів», not «мапа подій».

             The Terms say what the Site holds, so a component of it that has
             been re-conceived cannot go on being described by its old name:
             the map carried a marker per event when this was written and now
             shows the States whose courts hear these proceedings. Of every
             place on the site where that name survived, this was the worst –
             a legal document is the text a reader is entitled to rely on. The
             name used here is the map page's own title. */
          kind: "p",
          text: {
            uk: "Сайт – це відкрита бібліотека проваджень проти Російської Федерації в міжнародних судах, трибуналах та арбітражах: перелік справ, огляди рішень, хронології, мапа судів і посилання на першоджерела. Він адресований науковцям, практикам, журналістам і всім, хто цікавиться темою.",
            en: "The Site is an open library of proceedings against the Russian Federation before international courts, tribunals and arbitrations: a list of cases, decision summaries, chronologies, a map of the courts and links to primary sources. It is addressed to scholars, practitioners, journalists and anyone interested in the subject.",
          },
        },
        {
          kind: "p",
          text: {
            uk: `Бібліотека наповнюється: у ній ${registryTotal} проваджень, з яких опрацьовано ${registrySummarised}. Відсутність справи, документа чи огляду не означає, що провадження не існує, що воно завершилося або що воно неважливе.`,
            en: `The library is still being filled: it holds ${registryTotal} proceedings, of which ${registrySummarised} have been summarised. The absence of a case, a document or a summary does not mean that the proceeding does not exist, that it has ended, or that it is unimportant.`,
          },
          link: { label: { uk: "Переглянути бібліотеку", en: "Open the library" }, to: "registry" },
        },
      ],
    },
    {
      id: "accuracy",
      heading: {
        uk: "Точність матеріалів. Це не юридична консультація",
        en: "Accuracy of the materials. This is not legal advice",
      },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Огляд – це не рішення. Матеріали Сайту є стислим викладом, аналізом і неофіційним перекладом судових актів, який готують дослідники Центру. Автентичним є лише текст, оприлюднений відповідним судом чи трибуналом мовою судочинства; у разі будь-якої розбіжності діє він, а не наш виклад.",
            en: "A summary is not the decision. The materials on the Site are a condensed account, an analysis and an unofficial translation of judicial acts, prepared by the Centre’s researchers. Only the text published by the court or tribunal itself, in the language of the proceedings, is authoritative; in the event of any discrepancy that text prevails, not our account.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "На сторінці кожної справи є посилання на першоджерело. Перш ніж посилатися на матеріал у процесуальному документі, науковій праці чи публікації, звіряйтеся з ним.",
            en: "Every case page carries a link to the primary source. Before relying on any material in a filing, a scholarly work or a publication, check it against that source.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Матеріали Сайту мають інформаційний і науковий характер. Вони не є юридичною консультацією, не замінюють її і не створюють відносин «правник – клієнт» між вами та Факультетом, Центром чи авторами матеріалів. Щодо конкретної справи звертайтеся до кваліфікованого правника.",
            en: "The materials are informational and scholarly. They are not legal advice, they are no substitute for it, and they create no lawyer–client relationship between you and the Faculty, the Centre or the authors. For a specific matter, consult a qualified lawyer.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Ми докладаємо зусиль, щоб матеріали були точними й актуальними, однак право і практика змінюються, а провадження тривають. Якщо ви помітили помилку чи застарілі дані – напишіть нам, і ми виправимо.",
            en: "We work to keep the materials accurate and current, but the law and the case-law move and proceedings continue. If you spot an error or something out of date, write to us and we will correct it.",
          },
        },
      ],
    },
    {
      id: "ip",
      heading: {
        uk: "Права інтелектуальної власності",
        en: "Intellectual property",
      },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Рішення, ухвали, накази та інші акти судів і трибуналів, а також офіційні документи міжнародних організацій, на які посилається Сайт, є публічними актами та офіційними документами відповідних органів. Вони не належать нам: ми не заявляємо на них жодних прав і не обмежуємо їх використання. Умови доступу до них визначає орган, який їх видав, і, де це можливо, ми даємо посилання на першоджерело, а не розміщуємо його копію.",
            en: "The judgments, orders, decisions and other acts of courts and tribunals, and the official documents of international organisations to which the Site links, are public acts and official documents of those bodies. They are not ours: we claim no rights in them and place no restriction on their use. The terms of access to them are set by the body that issued them, and wherever possible we link to the primary source rather than host a copy of it.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Що справді є нашим – це те, що ми створюємо самі: огляди й аналітичні тексти, хронології, неофіційні переклади, добір та впорядкування матеріалів у бібліотеці, мапи, ілюстрації, дизайн і код Сайту. Ці матеріали є об'єктами авторського права і належать Факультету права УКУ та Дослідницькому центру Луї Зона або використовуються на законних підставах.",
            en: "What is ours is what we make ourselves: the summaries and analytical texts, the chronologies, the unofficial translations, the selection and arrangement of the material in the library, the maps, the illustrations, and the design and code of the Site. These are subject to copyright and belong to the UCU Faculty of Law and the Louis Sohn Research Centre, or are used on lawful grounds.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Наші матеріали поширюються на умовах ліцензії Creative Commons Attribution 4.0 International (CC BY 4.0). Ви можете вільно копіювати, поширювати, переробляти й використовувати їх – зокрема в комерційних цілях – за єдиної умови: зазначте авторство («НаСвітло», Дослідницький центр Луї Зона Факультету права УКУ), дайте активне посилання на відповідну сторінку Сайту й вкажіть, чи вносили ви зміни.",
            en: "Our materials are released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0). You are free to copy, redistribute, adapt and build upon them – including commercially – on one condition: give attribution (NaSvitlo, the Louis Sohn Research Centre at the UCU Faculty of Law), link to the relevant page of the Site, and indicate whether you made changes.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Логотипи та назви Українського католицького університету, Факультету права і партнерів проєкту належать їхнім власникам і цим дозволом не охоплюються.",
            en: "The logos and names of the Ukrainian Catholic University, of the Faculty of Law and of the project’s partners belong to their owners and are not covered by this permission.",
          },
        },
      ],
    },
    {
      id: "conduct",
      heading: { uk: "Правила користування", en: "Rules of use" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Користуючись Сайтом, ви погоджуєтеся не вчиняти дій, що:",
            en: "In using the Site you agree not to take any action that:",
          },
        },
        {
          kind: "ul",
          items: {
            uk: [
              "порушують законодавство України чи права третіх осіб;",
              "шкодять роботі Сайту – спроби зламу, обхід технічних обмежень, поширення шкідливого коду, автоматизовані запити в обсязі, що заважає іншим читачам;",
              "полягають у надсиланні нам на контактні адреси недостовірної інформації, спаму чи образливого змісту.",
            ],
            en: [
              "breaches the legislation of Ukraine or the rights of third parties;",
              "harms the operation of the Site – attempts to break in, circumvention of technical limits, distribution of malicious code, or automated requests on a scale that gets in the way of other readers;",
              "consists in sending false information, spam or abusive content to our contact addresses.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            uk: "Це відкрита бібліотека, і читати її машиною ми не забороняємо. Якщо ви плануєте систематично завантажувати матеріали для дослідження – напишіть нам, і ми домовимося, як зробити це без шкоди для Сайту.",
            en: "This is an open library and we do not forbid reading it by machine. If you plan to download material systematically for research, write to us and we will agree a way to do it that does not hurt the Site.",
          },
        },
      ],
    },
    {
      id: "links",
      heading: {
        uk: "Посилання на сторонні ресурси",
        en: "Links to third-party resources",
      },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Сайт містить багато посилань на сторонні ресурси – насамперед на офіційні бази судових рішень і документів (Міжнародного суду ООН, ЄСПЛ, Міжнародного кримінального суду, Постійної палати третейського суду та інших), а також на сайти партнерів. Ми не контролюємо їхнього змісту, доступності, точності чи політики конфіденційності, і посилання не означає схвалення. Перехід за ними здійснюється на ваш розсуд.",
            en: "The Site carries many links to third-party resources – above all to the official databases of judgments and documents (of the International Court of Justice, the ECtHR, the International Criminal Court, the Permanent Court of Arbitration and others) and to partners’ websites. We do not control their content, availability, accuracy or privacy practices, and a link is not an endorsement. You follow such links at your own discretion.",
          },
        },
        {
          kind: "p",
          text: {
            uk: "Посилання на першоджерела з часом псуються – суди змінюють структуру своїх сайтів. Якщо посилання не працює, напишіть нам, і ми його полагодимо.",
            en: "Links to primary sources decay over time, as courts reorganise their websites. If a link is broken, write to us and we will fix it.",
          },
        },
      ],
    },
    {
      id: "liability",
      heading: { uk: "Обмеження відповідальності", en: "Limitation of liability" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Матеріали Сайту надаються «як є», без гарантій точності, повноти чи актуальності. Ми не гарантуємо безперебійної роботи Сайту й не несемо відповідальності за шкоду, що виникла внаслідок користування Сайтом, неможливості ним скористатися чи покладання на його матеріали, – у межах, дозволених законодавством України.",
            en: "The materials are provided “as is”, without warranty of accuracy, completeness or currency. We do not guarantee uninterrupted operation of the Site and are not liable for loss arising from use of the Site, from inability to use it, or from reliance on its materials – to the extent permitted by the legislation of Ukraine.",
          },
        },
      ],
    },
    {
      id: "data",
      heading: { uk: "Персональні дані", en: "Personal data" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Сайт не має форм і не збирає даних про читача, який просто читає. Що відбувається з електронною адресою, якщо ви нам пишете або підписуєтеся на щомісячний лист, описано в Політиці конфіденційності, яка є невід'ємною частиною цих Умов.",
            en: "The Site has no forms and collects nothing from a reader who is simply reading. What happens to an email address when you write to us or subscribe to the monthly letter is set out in the Privacy policy, which forms an integral part of these Terms.",
          },
          link: {
            label: { uk: "Політика конфіденційності", en: "Privacy policy" },
            to: "privacy",
          },
        },
      ],
    },
    {
      id: "changes",
      heading: { uk: "Зміни до Умов", en: "Changes to these Terms" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Ми можемо змінювати ці Умови – зокрема в міру того, як бібліотека наповнюється. Чинна редакція завжди опублікована на цій сторінці із зазначенням дати оновлення.",
            en: "We may amend these Terms – in particular as the library grows. The current revision is always published on this page with the date of the update.",
          },
        },
      ],
    },
    {
      id: "law",
      heading: { uk: "Застосовне право", en: "Governing law" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "Ці Умови регулюються законодавством України. Спори, що виникають у зв'язку з користуванням Сайтом, вирішуються шляхом переговорів, а якщо згоди досягти не вдасться – у судовому порядку відповідно до законодавства України.",
            en: "These Terms are governed by the legislation of Ukraine. Disputes arising in connection with use of the Site are settled by negotiation and, failing agreement, before the courts in accordance with the legislation of Ukraine.",
          },
        },
      ],
    },
    {
      id: "contacts",
      heading: { uk: "Контакти", en: "Contacts" },
      blocks: [
        {
          kind: "p",
          text: {
            uk: "З питань щодо цих Умов, дозволів на використання матеріалів чи виявлених помилок звертайтеся:",
            en: "For questions about these Terms, permissions to use the materials, or errors you have found, contact us:",
          },
        },
        {
          kind: "ul",
          items: {
            uk: [
              "Дослідницький центр Луї Зона, Факультет права УКУ",
              "вул. Іларіона Свєнціцького, 17, м. Львів, 79011, Україна",
              `Телефон: ${legalPhone}`,
              `Електронна пошта: ${legalEmail}`,
            ],
            en: [
              "The Louis Sohn Research Centre, UCU Faculty of Law",
              "17 Svientsitskoho St., Lviv, 79011, Ukraine",
              `Telephone: ${legalPhone}`,
              `Email: ${legalEmail}`,
            ],
          },
        },
      ],
    },
  ],
};
