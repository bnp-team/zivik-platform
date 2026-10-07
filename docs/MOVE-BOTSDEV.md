# Переїзд у акаунт Cloudflare botsDev

Звідки: **Vm@bot-partners.com's Account** (`55d2d3b8…`). Куди: **botsDev**
(`5f1d89c39916440b30eed21bc37c1efd`). Що переїжджає: Worker `nasvitlo` і
`nasvitlo-staging`, база D1 `nasvitlo`, бакет R2 `nasvitlo-media` (12 файлів,
15 МБ), домен `nasvitlo.org` (Cloudflare Registrar) з його зоною і адресою
`nasvitlo.ucu.edu.ua` (Cloudflare for SaaS).

## Що важливо знати заздалегідь

- **Домен можна перенести з 9 жовтня 2026**: Cloudflare дозволяє переносити
  домен між акаунтами через 10 днів після реєстрації (зареєстровано 29.09).
- **Під час перенесення домену вся конфігурація зони в старому акаунті
  зникає**: DNS-записи, Cloudflare for SaaS, адреса `nasvitlo.ucu.edu.ua`.
  Тож DNS-записи переносимо заздалегідь (крок 3), а SaaS налаштовуємо заново
  (крок 9) — і Cloudflare видасть **нові** значення двох записів для ІТ УКУ.
- **Passkey редакторів прив'язані до адреси адмінки.** Після переїзду на нову
  адресу кожен редактор один раз входить за посиланням для відновлення й додає
  новий passkey. Тому адмінку переносимо **один раз, одразу на остаточну
  адресу**, а не через проміжну.
- **Заморозка правок.** Від кроку 4 (дамп) до кроку 10 (редактори в новій
  адмінці) у старій адмінці нічого не правити: правки залишаться в старій базі.
- Секрети Worker-а (`RESEND_API_KEY`, `EMAIL_FROM`, `DEPLOY_HOOK_URL`,
  `STAGING_DEPLOY_HOOK_URL`) Cloudflare назад не показує — їх задаємо заново.

## Кроки

**0. Попередити ІТ УКУ** (сьогодні), щоб не додавали записи зі старого листа:
нові значення TXT і `_acme-challenge` будуть після кроку 9.

**1. Пробне перенесення даних** (будь-коли, нічого не ламає — стара база лише
читається):

```sh
scripts/cf/move-account.sh nasvitlo-trial
```

Наприкінці скрипт порівнює кількість записів у старій і новій базі. Пробну
базу потім видалити: `CLOUDFLARE_ACCOUNT_ID=5f1d89c39916440b30eed21bc37c1efd npx wrangler d1 delete nasvitlo-trial`.

**2. botsDev → Add a domain → `nasvitlo.org` → план Free.** Зона буде
«Pending» — це нормально до кроку 8.

**3. Перенести DNS-записи.** Старий акаунт → `nasvitlo.org` → DNS → Records →
**Import and Export → Export**. botsDev → `nasvitlo.org` → DNS → Records →
**Import** цього файлу. Перевірити, що є записи пошти Resend (`send`,
`resend._domainkey`) і `origin`.

**4. День перемикання: заморозити адмінку, перенести дані.**

```sh
scripts/cf/move-account.sh nasvitlo
```

Скрипт надрукує `id` нової бази — його вписують у `wrangler.jsonc` (крок 5).

**5. Код** (робить розробник): у `wrangler.jsonc` — `account_id` botsDev і
новий `database_id`. Не пушити до кроку 6.

**6. Підключити репозиторій у botsDev** (Workers & Pages → Create → Import a
repository → `vm-cpu/zivik-platform`), як у docs/CLOUDFLARE.md «Перший запуск»:
- Worker `nasvitlo`: build `npm run cf:build`, deploy `npx wrangler deploy`,
  гілка `main`, змінні збірки `NEXT_PUBLIC_SITE_URL` (остаточна адреса) і ті
  самі, що в старому акаунті; токен збірки з *D1 · Edit*.
- Worker `nasvitlo-staging`: build `npm run cf:build:staging`, deploy
  `npx wrangler deploy --name nasvitlo-staging` (docs/STAGING.md).

Потім пуш коду з кроку 5 → перша збірка в botsDev. Стара збірка у старому
акаунті впаде (інший `account_id`) — старий сайт лишається на останньому
вдалому деплої.

**7. Секрети й хуки в botsDev:**
- Deploy hooks: `nasvitlo` → Settings → Builds → Deploy Hooks (production);
  `nasvitlo-staging` → такий самий хук `drafts`.
- Секрети Worker-а `nasvitlo` (`npx wrangler secret put <ІМ'Я> --name nasvitlo`
  з кореня репозиторію, коли `wrangler.jsonc` уже вказує на botsDev):
  `DEPLOY_HOOK_URL`, `STAGING_DEPLOY_HOOK_URL`, `RESEND_API_KEY` (з Resend →
  API Keys), `EMAIL_FROM`.

**8. Перенести домен.** Старий акаунт → Domain Registration → Manage domains →
`nasvitlo.org` → **Configuration → Move** → ID botsDev
`5f1d89c39916440b30eed21bc37c1efd`. botsDev отримає лист — підтвердити протягом
5 днів. Перед цим DNSSEC має бути вимкнено. Після перенесення домен 30 днів
не можна передати іншому реєстратору (між акаунтами Cloudflare — можна).

**9. Cloudflare for SaaS у botsDev** (`nasvitlo.org` → SSL/TLS → Custom
Hostnames):
1. Enable Cloudflare for SaaS.
2. Fallback origin: `origin.nasvitlo.org` (запис уже перенесено на кроці 3,
   має бути проксійований — помаранчева хмарка).
3. Add Custom Hostname: `nasvitlo.ucu.edu.ua`, сертифікат — Delegated DCV.
   Записати **TXT `_cf-custom-hostname`** і **CNAME `_acme-challenge`** — їх
   надсилаємо ІТ УКУ. Перший запис (`CNAME nasvitlo → origin.nasvitlo.org`)
   не змінюється.
4. Workers Routes: маршрут `*/*` на зоні `nasvitlo.org` → Worker `nasvitlo`
   (так Worker обслуговує й `nasvitlo.ucu.edu.ua`).

**10. Редактори.** Коли остаточна адреса працює: в адмінці → Користувачі →
кожному «Надіслати посилання для відновлення», вхід, «Додати passkey».

**11. Прибрати за собою:**
- GitHub → Settings → Secrets → `CLOUDFLARE_ACCOUNT_ID` (botsDev) і
  `CLOUDFLARE_API_TOKEN` (токен botsDev з D1 · Edit) — для нічного бекапу.
- Cloudflare Access для `nasvitlo-staging` у botsDev (docs/STAGING.md, крок 5).
- Старий акаунт: від'єднати репозиторій від Workers Builds. Стару базу й
  Worker не видаляти щонайменше місяць.
