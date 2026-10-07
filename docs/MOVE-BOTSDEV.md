# Переїзд у акаунт Cloudflare botsDev

Звідки: **Vm@bot-partners.com's Account** (`55d2d3b8…`). Куди: **botsDev**
(`5f1d89c39916440b30eed21bc37c1efd`). Що переїжджає: Worker `nasvitlo` і
`nasvitlo-staging`, база D1 `nasvitlo`, бакет R2 `nasvitlo-media` (12 файлів,
15 МБ), домен `nasvitlo.org` (Cloudflare Registrar) з його зоною і адресою
`nasvitlo.ucu.edu.ua` (Cloudflare for SaaS).

## Що важливо знати заздалегідь

- **Остаточна адреса — `nasvitlo.ucu.edu.ua`** (і сайт, і адмінка). Вона
  запрацює, лише коли ІТ УКУ додадуть три записи — тож перемикання (крок 8)
  чекає на них. До того сайт і адмінка живуть у старому акаунті як завжди.
- **Passkey прив'язані до адреси, з якої відкрито адмінку** (EmDash бере
  `rpId` з адреси запиту). Тому редактори переходять в адмінку один раз — уже
  на `nasvitlo.ucu.edu.ua` — і один раз додають новий passkey.
- **Домен `nasvitlo.org` можна перенести з 9 жовтня 2026** (10 днів після
  реєстрації 29.09). При перенесенні вся конфігурація зони в старому акаунті
  зникає: DNS-записи (переносимо заздалегідь, крок 2) і Cloudflare for SaaS
  (налаштовуємо заново, крок 6 — Cloudflare видасть **нові** TXT і
  `_acme-challenge` для ІТ).
- **`main` переключаємо на botsDev лише в день перемикання.** До того botsDev
  збирається з гілки `move-botsdev`: якщо `main` вказуватиме на botsDev
  раніше, збірка у старому акаунті падатиме, і публікації зі старої адмінки не
  доходитимуть до сайту.
- **Заморозка правок** — лише в день перемикання, від дампу (крок 8) до входу
  редакторів у нову адмінку.
- Секрети Worker-а (`RESEND_API_KEY`, `EMAIL_FROM`, `DEPLOY_HOOK_URL`,
  `STAGING_DEPLOY_HOOK_URL`) Cloudflare назад не показує — задаємо заново.

## Кроки

**0. Попередити ІТ УКУ**, щоб не додавали записи зі старого листа: нові
значення TXT і `_acme-challenge` будуть після кроку 6.

**1. Пробне перенесення даних** (нічого не ламає — стара база лише читається):

```sh
scripts/cf/move-account.sh nasvitlo-trial
```

Скрипт наприкінці порівнює кількість записів у старій і новій базі. Ця база
потрібна й далі: на ній botsDev-сайт працює до дня перемикання.

**2. Зона й DNS.** botsDev → Add a domain → `nasvitlo.org` → план Free (зона
«Pending» до кроку 5 — нормально). Старий акаунт → `nasvitlo.org` → DNS →
Records → **Import and Export → Export**; botsDev → `nasvitlo.org` → DNS →
Records → **Import**. Перевірити записи пошти Resend (`send`,
`resend._domainkey`) і `origin`.

**3. Гілка `move-botsdev`** (робить розробник): `wrangler.jsonc` з
`account_id` botsDev і `database_id` бази `nasvitlo-trial`.

**4. Збірки в botsDev** (Workers & Pages → Create → Import a repository →
`vm-cpu/zivik-platform`), як у docs/CLOUDFLARE.md «Перший запуск»:
- Worker `nasvitlo`: build `npm run cf:build`, deploy `npx wrangler deploy`,
  гілка **`move-botsdev`**, змінні збірки `NEXT_PUBLIC_SITE_URL=https://nasvitlo.ucu.edu.ua`
  і ті самі, що в старому акаунті (крім адреси); токен збірки з *D1 · Edit*.
- Worker `nasvitlo-staging`: build `npm run cf:build:staging`, deploy
  `npx wrangler deploy --name nasvitlo-staging`, та сама гілка (docs/STAGING.md).
- Deploy hooks (`nasvitlo` → production, `nasvitlo-staging` → `drafts`) і
  секрети `nasvitlo`: `DEPLOY_HOOK_URL`, `STAGING_DEPLOY_HOOK_URL`,
  `RESEND_API_KEY` (Resend → API Keys), `EMAIL_FROM`.

**5. Перенести домен** (з 9 жовтня). Старий акаунт → Domain Registration →
Manage domains → `nasvitlo.org` → **Configuration → Move** → ID botsDev
`5f1d89c39916440b30eed21bc37c1efd`. botsDev отримає лист — підтвердити протягом
5 днів. DNSSEC має бути вимкнено.

**6. Cloudflare for SaaS у botsDev** (`nasvitlo.org` → SSL/TLS → Custom
Hostnames):
1. Enable Cloudflare for SaaS.
2. Fallback origin: `origin.nasvitlo.org` (запис перенесено на кроці 2,
   проксійований — помаранчева хмарка).
3. Add Custom Hostname `nasvitlo.ucu.edu.ua`, сертифікат — Delegated DCV.
4. Workers Routes на зоні `nasvitlo.org`: `*/*` → Worker `nasvitlo`.
5. Надіслати ІТ УКУ три записи: `CNAME nasvitlo → origin.nasvitlo.org` (без
   змін), **новий** TXT `_cf-custom-hostname.nasvitlo`, **новий** CNAME
   `_acme-challenge.nasvitlo`; усі DNS only.

**7. ІТ підтвердили записи** → перевірити: `https://nasvitlo.ucu.edu.ua/uk`
відкривається з дійсним сертифікатом (поки — з пробними даними).

**8. День перемикання.** Попросити редакторів не правити в старій адмінці.

```sh
scripts/cf/move-account.sh nasvitlo
```

У `move-botsdev` вписати `database_id` нової бази, злити гілку в `main`; у
botsDev перемкнути гілку збірок обох Worker-ів на `main`; у старому акаунті
від'єднати репозиторій від Workers Builds.

**9. Перевірка й редактори.** Сайт на `nasvitlo.ucu.edu.ua` — ті самі
сторінки, що й на старій адресі. Адмінка `https://nasvitlo.ucu.edu.ua/_emdash/admin`
→ Користувачі → кожному «Надіслати посилання для відновлення» → вхід →
«Додати passkey». Одна дрібна публікація має дійти до сайту.

**10. Прибрати за собою:**
- GitHub → Settings → Secrets → `CLOUDFLARE_ACCOUNT_ID` (botsDev) і
  `CLOUDFLARE_API_TOKEN` (токен botsDev з D1 · Edit) — для нічного бекапу.
- Cloudflare Access для `nasvitlo-staging` у botsDev (docs/STAGING.md, крок 5).
- Видалити `nasvitlo-trial`. Стару базу й Worker у старому акаунті не
  видаляти щонайменше місяць.
