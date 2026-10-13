# Запуск: чекліст публічного відкриття

Стан на 13.10.2026 (SEO-аудит Астри): основний домен
`https://nasvitlo.ucu.edu.ua` уже відповідає; копії –
`nasvitlo.botpartners.workers.dev` (Worker, акаунт botsDev) і старий Vercel
(`zivik-platform.vercel.app` → `nasvitlo.vercel.app`). Сайт закритий від
пошуковиків (`noindex`), аналітика – Cloudflare Web Analytics і PostHog.
Цей документ – у якому порядку давати решту значень і куди клацати.

Що вже тримає код, незалежно від змінних: копії на `*.workers.dev` і
`*.vercel.app` завжди віддають `X-Robots-Tag: noindex` (`astro.config.mjs`,
`next.config.ts`), а збірка staging (`cf:build:staging`) не індексується й
не вантажить аналітику, навіть якщо успадкувала змінні production.

Усі змінні нижче — **змінні збірки**: сторінки пререндерені, тож нове
значення діє лише після нової збірки. Де їх задавати:

- **Cloudflare** (основний сайт): Workers & Pages → **nasvitlo** →
  **Settings** → **Build** → **Variables and secrets** → **Add**. Після
  зміни — **Deployments** → **Retry deployment** на останньому деплої (або
  будь-яка публікація в адмінці).
- **Vercel** (поки працює): Project → **Settings** → **Environment
  Variables** → Production → Redeploy.

| Змінна | Що вмикає | Без неї |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | канонічні URL, `hreflang`, Open Graph, sitemap, `legalHost` | `*.workers.dev` / Vercel / localhost |
| `SITE_INDEXABLE=true` | індексацію: знімає `noindex` (мета-тег і `X-Robots-Tag`), додає sitemap у `robots.txt` | `noindex, nofollow` на кожній сторінці |
| `GOOGLE_SITE_VERIFICATION` | `<meta name="google-site-verification">` на всіх сторінках | тега немає |
| `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | маячок Cloudflare Web Analytics, два джерела в CSP, абзац про аналітику в політиці конфіденційності й нову дату редакції | ні маячка, ні джерел у CSP, політика каже «аналітики немає» |
| `NEXT_PUBLIC_POSTHOG_KEY` | хітмапи й події PostHog (`public/heatmaps.js`), абзаци про PostHog у політиці | PostHog не завантажується |

Для staging-збірки `SITE_INDEXABLE`, обидва ключі аналітики й
`GOOGLE_SITE_VERIFICATION` ігноруються завжди.

---

## 1. Домен

- [ ] **Вирішити, який домен.** Варіанти: піддомен університету
      (`nasvitlo.ucu.edu.ua` — потрібна згода й DNS-запис від ІТ УКУ) або
      окремий домен (`nasvitlo.org` тощо — купити й перенести DNS у
      Cloudflare). Від цього залежить, хто керує DNS, — а від того, чи
      можна підтвердити Search Console записом DNS (крок 4).
- [ ] **Додати домен у Cloudflare.**
  - *Домен у зоні Cloudflare* (свій домен, NS на Cloudflare):
    Workers & Pages → **nasvitlo** → **Settings** → **Domains & Routes** →
    **Add** → **Custom domain** → ввести `nasvitlo.…` → **Add domain**.
    Cloudflare сам створить DNS-запис і сертифікат.
  - *Піддомен чужого DNS* (напр. `ucu.edu.ua` не в Cloudflare): Custom
    domain так не підключити — або ІТ УКУ делегує піддомен у Cloudflare
    (NS-записи на окрему зону), або домен переходить у Cloudflare цілком.
    Обговорити з ІТ до того, як обіцяти адресу.
- [ ] Перевірити: `https://<домен>/uk` відкривається, сертифікат дійсний,
      `https://<домен>/_emdash/admin` пускає в адмінку.
- [ ] Passkey адмінки прив'язані до домену: після переїзду редакторам
      доведеться зареєструвати їх заново на новій адресі. Попередити.
- [ ] `public/.well-known/security.txt`: додати рядок
      `Canonical: https://<домен>/.well-known/security.txt`. Поле `Expires`
      там діє рік (зараз до 2027-09-26) — продовжувати щороку, інакше файл
      вважається простроченим.
- [ ] **Захист на рівні зони** (з'являється лише з власним доменом): Security →
      Bots → **Bot Fight Mode**; **AI Crawl Control** — узгодити з
      `src/app/robots.ts`, щоб правила Cloudflare не суперечили нашим;
      правило **Rate limiting** на `/_emdash/*`; **Cloudflare Access**
      (Zero Trust) на `/_emdash/*` з політикою «Emails» редакції.

## 2. Адреса сайту в збірці

- [ ] `NEXT_PUBLIC_SITE_URL=https://<домен>` (без скісної риски в кінці) —
      у змінних збірки Cloudflare (і Vercel, якщо він ще живий).
- [ ] Перезібрати (Retry deployment).
- [ ] Перевірити у вихідному коді сторінки (`view-source:`):
      `<link rel="canonical" href="https://<домен>/uk">`,
      `og:url` — з новим доменом.
- [ ] Старі адреси – **постійний редирект (301/308)** на відповідну адресу
      основного домену: Vercel – обидві (`zivik-platform.vercel.app`,
      `nasvitlo.vercel.app`) → Project → Settings → Domains → Redirect to
      `nasvitlo.ucu.edu.ua`, Permanent. `noindex` на цих копіях код уже
      ставить, але сигнали посилань переносить лише редирект.
- [ ] `nasvitlo.botpartners.workers.dev` **не вимикати навмання**: staging
      бере з нього медіа (`wrangler.jsonc`). Спершу перевести медіа staging
      на основний домен, потім – редирект або вимкнення workers.dev.

## 3. Правові сторінки

- [ ] Перечитати `/uk/privacy` і `/uk/terms` на новому домені. Домен у
      тексті не названо (сайт скрізь — «НаСвітло» / «Сайт»), тож переїзд
      тексту не змінює; `legalHost` у `src/content/legal.ts` тепер
      похідний від `NEXT_PUBLIC_SITE_URL`.
- [ ] Якщо щось у тексті змінюється — оновити `legalRevisedIso` там же.

## 4. Google Search Console

- [ ] <https://search.google.com/search-console> → **Add property**.
  - **Domain** (рекомендовано, якщо є доступ до DNS): ввести домен →
    Google дасть TXT-запис `google-site-verification=…` → Cloudflare →
    зона домену → **DNS** → **Records** → **Add record** → Type **TXT**,
    Name `@`, Content — рядок від Google → Save → у Search Console
    **Verify**. Змінна в збірці тоді не потрібна.
  - **URL prefix** (якщо DNS недоступний): ввести `https://<домен>/` →
    метод **HTML tag** → скопіювати лише значення `content="…"` →
    змінна збірки `GOOGLE_SITE_VERIFICATION=<значення>` → Retry
    deployment → перевірити, що тег є у `view-source:` головної →
    **Verify**. Не видаляйте змінну після підтвердження — Google
    перевіряє тег і згодом.
- [ ] (За бажання) Bing Webmaster Tools → **Import from Google Search
      Console** — підтвердження підтягнеться.

## 5. Відкрити індексацію

Лише коли контент готовий показувати світові (див. docs/GAPS.md, 3.1).

- [ ] `SITE_INDEXABLE=true` у змінних збірки → Retry deployment. Лог
      збірки має сказати «SITE_INDEXABLE=true — this build may be
      indexed».
- [ ] Перевірити: `curl -sI https://<домен>/uk | grep -i x-robots` — порожньо;
      у `view-source:` немає `<meta name="robots" content="noindex…">`;
      `https://<домен>/robots.txt` містить `Sitemap: https://<домен>/sitemap.xml`;
      `https://<домен>/sitemap.xml` перелічує сторінки (доки індексацію
      закрито, sitemap навмисно порожній).
- [ ] Search Console → **Sitemaps** → ввести `sitemap.xml` → **Submit**.
- [ ] Search Console → **URL inspection** → `https://<домен>/uk` →
      **Request indexing** (і так само для `/en`).

## 6. Аналітика (Cloudflare Web Analytics і PostHog, без cookie)

PostHog (`public/heatmaps.js`): пам'ять замість cookie, без записів сесій,
autocapture лише натискань, тексти й атрибути елементів масковані, з адрес
відкинуто параметри й фрагмент. Події: `registry_search`,
`registry_filter_changed`, `case_open`, `source_open`, `decision_pdf_click`,
`language_switch`, `support_click` – лише контрольовані значення.

- [ ] PostHog → Project settings: **Discard client IP data** увімкнено;
      строк зберігання, доступи, DPA – підтвердити й узгодити з текстом
      політики (`src/content/legal.ts`). Поки це не підтверджено – не
      давати `NEXT_PUBLIC_POSTHOG_KEY` збірці.

- [ ] Cloudflare → **Analytics & Logs** → **Web Analytics** → **Add a
      site** → ввести домен → **Done**. Якщо домен у зоні Cloudflare,
      запропонують «automatic setup» — **не вмикати**: маячок уже
      вставляє сам сайт, і автоматичне вбудовування рахувало б кожен
      перегляд двічі. Потрібен ручний варіант: **Manage site** → вкладка
      з JS snippet.
- [ ] Зі сніпета скопіювати лише токен — значення `"token": "…"` в
      `data-cf-beacon`.
- [ ] `NEXT_PUBLIC_CF_ANALYTICS_TOKEN=<токен>` у змінних збірки → Retry
      deployment.
- [ ] Перевірити: у `view-source:` будь-якої сторінки є
      `static.cloudflareinsights.com/beacon.min.js`; у DevTools → Console
      немає помилок CSP; `/uk/privacy` у розділі «Файли cookie та
      аналітика» називає Cloudflare Web Analytics, дата редакції —
      26 вересня 2026. Через кілька хвилин у Web Analytics з'являться
      перші перегляди.
- [ ] Абзац у політиці описує Cloudflare Web Analytics так, як її описує
      Cloudflare (без cookie, IP не зберігається, звіти за 6 місяців).
      Якщо колись підключите інший сервіс — спершу текст у
      `src/content/legal.ts`, потім токен.
- Google Analytics не додавати: cookie, передача даних рекламній
  платформі й банер згоди, якого на сайті немає.

## 7. Пошта для EmDash

Покроково — docs/EDITORIAL.md, розділ «Пошта». Коротко:

- [ ] Resend: домен підтверджено (DNS), ключ *Sending access* лише для нього.
- [ ] Worker `nasvitlo` → Variables and Secrets: `RESEND_API_KEY` (Secret),
      `EMAIL_FROM` (наприклад `НаСвітло <admin@домен>`).
- [ ] Settings → Build → Variables: `EMAIL_PROVIDER=resend`, перезібрати.
- [ ] Перевірка: запросити тестового редактора з адмінки — лист доходить.

## 8. Картки для соцмереж (Open Graph)

- [ ] Після зміни домену перевірити картку головної і 2–3 оглядів:
      <https://www.opengraph.xyz/> або LinkedIn Post Inspector
      (<https://www.linkedin.com/post-inspector/>) — картинка, заголовок,
      опис, адреса з новим доменом.
- [ ] Картки оглядів (`/og/cases/<slug>.png`) збірка генерує сама
      (`npm run og` у `cf:build`) – перевірити, що для кожного
      опублікованого огляду картка є.
- [ ] Facebook кешує картки: після зміни — Sharing Debugger
      (<https://developers.facebook.com/tools/debug/>) → **Scrape Again**.

## 9. Резервні копії

- [ ] Налаштувати нічний бекап D1 — docs/BACKUPS.md, «Увімкнути» (токен
      *Account · D1 · Read*, два секрети в GitHub, ручний запуск).
- [ ] Один раз пройти навчальне відновлення з того самого документа —
      **до** анонсу, а не після першої втрати.

## 10. День запуску

- [ ] Остання збірка зелена, лог друкує `SITE_INDEXABLE=true`.
- [ ] Головна, бібліотека, 2–3 огляди, `/privacy`, `/terms` — обома мовами.
- [ ] Адмінка: вхід, публікація дрібної правки доходить до сайту.
- [ ] Web Analytics показує перегляди; Search Console — sitemap «Success».
- [ ] Останній нічний бекап — не старший за добу.
