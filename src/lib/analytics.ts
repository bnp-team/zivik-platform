/**
 * Cloudflare Web Analytics – вимкнено, доки власник не дасть токен.
 *
 * Чому саме вона. Бібліотеці потрібно знати дві речі: скільки людей читає і
 * які справи відкривають. Для цього не треба знати, *хто* читає. Cloudflare
 * Web Analytics не ставить cookie, не пише в localStorage і не будує
 * відбиток браузера, тож банера згоди не потрібно – і політика
 * конфіденційності може сказати це чесно (`src/content/legal.ts`, розділ
 * «cookies»). Google Analytics сюди не додавати: він ставить cookie, передає
 * дані рекламній платформі й вимагає банера, якого на сайті немає.
 *
 * Прапорець збірки, а не запиту – як SITE_INDEXABLE (`lib/seo.ts`): усі
 * сторінки пререндерені, тож «є маячок чи ні» – це властивість збірки. Одне
 * значення вмикає чотири речі разом, і жодна не може розійтися з іншою:
 *  - `<script>` маячка в <head>/<body> обох збірок (Next – корінний layout
 *    `[locale]`; Cloudflare – `site/layouts/Document.astro`);
 *  - два джерела в CSP (`lib/security-headers.ts`) – без них браузер
 *    заблокував би маячок, і аналітика тихо показувала б нуль;
 *  - абзац про аналітику в політиці конфіденційності замість «аналітики
 *    немає»;
 *  - дату редакції політики (`legalRevisedIso`).
 *
 * Токен публічний за природою – він і так стоїть у HTML кожної сторінки, –
 * тому префікс NEXT_PUBLIC_ тут чесний. У збірці для Cloudflare його вбудовує
 * `define` в astro.config.mjs (список `buildEnv`).
 *
 * Де взяти: Cloudflare → Analytics & Logs → Web Analytics → Add a site →
 * ввести домен → вкладка «JS snippet» → значення `token` з
 * `data-cf-beacon='{"token": "…"}'`. Див. docs/LAUNCH.md.
 */
export const cfAnalyticsToken: string | undefined =
  process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN?.trim() || undefined;

export const analyticsEnabled = cfAnalyticsToken !== undefined;

/** Звідки браузер бере скрипт маячка (CSP `script-src`). */
export const CF_BEACON_ORIGIN = "https://static.cloudflareinsights.com";
export const CF_BEACON_SRC = `${CF_BEACON_ORIGIN}/beacon.min.js`;

/** Куди маячок надсилає заміри (CSP `connect-src`, `/cdn-cgi/rum`). */
export const CF_REPORT_ORIGIN = "https://cloudflareinsights.com";

/**
 * Значення атрибута `data-cf-beacon`. Через JSON.stringify, а не шаблонний
 * рядок: токен приходить зі змінної середовища, і лапка в ній не повинна
 * зламати ні JSON, ні атрибут (сам атрибут екранує React / Astro).
 */
export const cfBeaconConfig = cfAnalyticsToken
  ? JSON.stringify({ token: cfAnalyticsToken })
  : undefined;
