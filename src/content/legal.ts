import type { Localized } from "./types";
import { legalDocs, legalDocsDefault, type LegalBlock, type LegalDocument, type LegalSection } from "./legal-docs";
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

export type { LegalBlock, LegalDocument, LegalSection };

/**
 * A document as the page shows it: the admin's text with the one section the
 * code writes – cookies and analytics – filled in for this build.
 */
function resolveDoc(slug: LegalDocument["slug"]): LegalDocument {
  /* The published row, or the code's own text if the database has none yet. */
  const doc = legalDocs.find((d) => d.slug === slug) ?? legalDocsDefault.find((d) => d.slug === slug);
  if (!doc) throw new Error(`legal: no document "${slug}" in legal-docs.ts`);
  const filled = fillIn(doc);
  return {
    ...filled,
    sections: (Array.isArray(filled.sections) ? filled.sections : []).map((s) =>
      s.auto === "cookies"
        ? { ...s, blocks: cookiesBlocks }
        : { ...s, blocks: (Array.isArray(s.blocks) ? s.blocks : []).filter(isDrawable).map(forThisBuild) },
    ),
  };
}

/**
 * Two clauses outside the cookies section say something different when the
 * build carries no analytics – the hosting list and the note on changes to the
 * Policy. Each has its alternative beside it in the data; a build without
 * analytics takes it, so the policy is true of the site the reader opened.
 */
/** A block the page can draw. The admin refuses the rest on save; a row that got through some other way must not stop the build. */
function isDrawable(block: LegalBlock): boolean {
  if (block?.kind === "p") return typeof block.text?.uk === "string" && typeof block.text?.en === "string";
  if (block?.kind === "ul") return Array.isArray(block.items?.uk) && Array.isArray(block.items?.en);
  return false;
}

function forThisBuild(block: LegalBlock): LegalBlock {
  if (analyticsEnabled) return block;
  if (block.kind === "p" && block.noAnalytics) return { kind: "p", text: block.noAnalytics, link: block.link };
  if (block.kind === "ul" && block.itemsNoAnalytics) return { kind: "ul", items: block.itemsNoAnalytics };
  return block;
}

/** The values the text names in braces: what only the code knows. */
const VALUES: Record<string, string> = {
  email: legalEmail,
  phone: legalPhone,
  total: String(registryTotal),
  summarised: String(registrySummarised),
};

/** Every string in the document, with {email}, {phone}… put where they stand. */
function fillIn<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/\{(\w+)\}/g, (whole, name: string) => (Object.hasOwn(VALUES, name) ? VALUES[name] : whole)) as T;
  }
  if (Array.isArray(value)) return value.map(fillIn) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillIn(v)])) as T;
  }
  return value;
}

export const privacy: LegalDocument = resolveDoc("privacy");
export const terms: LegalDocument = resolveDoc("terms");

/**
 * The revision date of one document. The editor's own, when they set it – it
 * is theirs to move when they change the text – and the build's otherwise.
 */
export function revisionOf(doc: LegalDocument): { iso: string; human: Localized } {
  const own = doc.revised?.trim();
  if (!own || !/^\d{4}-\d{2}-\d{2}$/.test(own) || Number.isNaN(Date.parse(own))) {
    return { iso: legalRevisedIso, human: legalRevised };
  }
  return {
    iso: own,
    human: Object.fromEntries(
      locales.map((locale) => [
        locale,
        new Intl.DateTimeFormat(dateLocaleTag[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
          new Date(`${own}T00:00:00Z`),
        ),
      ]),
    ) as Localized,
  };
}
