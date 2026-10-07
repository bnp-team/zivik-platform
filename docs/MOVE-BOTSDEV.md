# Переїзд у акаунт Cloudflare botsDev

Звідки: **Vm@bot-partners.com's Account** (`55d2d3b8…`). Куди: **botsDev**
(`5f1d89c39916440b30eed21bc37c1efd`). Що переїжджає: Worker `nasvitlo` і
`nasvitlo-staging`, база D1 `nasvitlo`, бакет R2 `nasvitlo-media`. Остаточна
адреса — **`nasvitlo.ucu.edu.ua`** через Cloudflare for SaaS на зоні
**`bnp.works`** у botsDev.

Домен `nasvitlo.org` **не переїжджає**: він лишається в старому акаунті лише
заради пошти (записи Resend `send`, `rsend`, `resend._domainkey`). Листи з
`admin@nasvitlo.org` працюють незалежно від того, де живе сайт.

## Стан на 7 жовтня 2026

| | Що | Стан |
|---|---|---|
| ✅ | Репозиторій перенесено в `bnp-team/zivik-platform` | старі посилання GitHub переадресовує |
| ✅ | Пробна база `nasvitlo-trial` у botsDev | 81 таблиця, 370 індексів, 53 тригери — як у продакшні |
| ✅ | R2 `nasvitlo-media` у botsDev | 12 файлів |
| ✅ | Worker `nasvitlo`, збірки з гілки `move-botsdev` | https://nasvitlo.botpartners.workers.dev — усі 81 сторінка як на старому сайті |
| ✅ | Worker `nasvitlo-staging`, збірки з `move-botsdev` | https://nasvitlo-staging.botpartners.workers.dev |
| ✅ | Хуки `emdash-publish` (nasvitlo) і `drafts` (staging), секрети `DEPLOY_HOOK_URL`, `STAGING_DEPLOY_HOOK_URL`, `RESEND_API_KEY` | |
| ✅ | Cloudflare for SaaS на `bnp.works`: fallback origin `saas-origin.bnp.works`, custom hostname `nasvitlo.ucu.edu.ua`, маршрут `nasvitlo.ucu.edu.ua/*` → `nasvitlo` | чекає записів від ІТ |
| ✅ | Старий акаунт: збірки перепідключено до `bnp-team/zivik-platform` (`main`) | хук виправлено; перевірити однією публікацією з адмінки |
| ⏳ | ІТ УКУ додають три записи (нижче) | лист надіслано |
| ⏳ | Cloudflare Access для `nasvitlo-staging` | |
| ⏳ | Перемикання (крок 3) | після відповіді ІТ |

## Записи для ІТ УКУ

Зона `ucu.edu.ua`, усі **DNS only** (сіра хмарка):

| Тип | Ім'я | Значення |
|---|---|---|
| CNAME | `nasvitlo` | `saas-origin.bnp.works` |
| TXT | `_cf-custom-hostname.nasvitlo` | `c8ba84ac-2db2-4c0a-b013-6d7a162ad88b` |
| CNAME | `_acme-challenge.nasvitlo` | `nasvitlo.ucu.edu.ua.6618fcd141338fa3.dcv.cloudflare.com` |

Сертифікат видає Google Trust Services; якщо в `ucu.edu.ua` з'являться записи
CAA, потрібен дозвіл для `pki.goog`. Перевірити стан: botsDev → `bnp.works` →
SSL/TLS → Custom Hostnames → `nasvitlo.ucu.edu.ua` (Hostname status і
Certificate status мають стати **Active**).

## Що важливо знати

- **`bnp.works` спільний з іншими проєктами** (`sklad`, `kyc`, `izhak`,
  `demokrylo`…). Наш внесок — запис `saas-origin` і маршрут лише для
  `nasvitlo.ucu.edu.ua`. `saas-origin.bnp.works` — fallback origin усієї зони
  для Cloudflare for SaaS: не видаляти й не перейменовувати, доки на нього
  вказує CNAME в УКУ. Інші проєкти можуть додавати свої custom hostnames —
  трафік розводять маршрути Worker-ів (100 адрес безкоштовно на всю зону).
- **Passkey прив'язані до адреси, з якої відкрито адмінку** (EmDash бере
  `rpId` з адреси запиту). Редактори переходять в адмінку один раз — уже на
  `nasvitlo.ucu.edu.ua` — і один раз додають новий passkey.
- **До перемикання botsDev збирається з гілки `move-botsdev`** на пробній
  базі, а `main` — зі старим акаунтом. Коли ІТ додадуть записи,
  `nasvitlo.ucu.edu.ua` покаже **пробну копію** (стан на 7 жовтня), тож
  перемикання робимо одразу після їхньої відповіді.
- **Заморозка правок** — лише в день перемикання, від дампу до входу
  редакторів у нову адмінку.
- Секрет `DEPLOY_HOOK_URL` приймає і повну адресу хука, і сам його id
  (`site/emdash/deploy-hook.ts`): з поля в дашборді копіюється саме id.

### Змінні збірки

| Змінна | `nasvitlo` (botsDev) | `nasvitlo-staging` | старий `nasvitlo` |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://nasvitlo.ucu.edu.ua` | `https://nasvitlo-staging.botpartners.workers.dev` | `https://nasvitlo.vm-55d.workers.dev` |
| `EMDASH_URL` | `https://nasvitlo.botpartners.workers.dev` (до перемикання: звідси збірка бере фото з R2) | те саме | — |
| `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` | маячок старого акаунта | — | так само |
| `EMAIL_FROM` | `НаСвітло <admin@nasvitlo.org>` | — | так само |
| `EMAIL_PROVIDER` | `resend` | — | так само |
| `PUBLISH_MIN_ROLE` | `40` | — | так само |
| `RESEND_API_KEY` (secret) | — (секрет Worker-а) | — | secret збірки |

## Кроки

**1. Пробне перенесення даних** — зроблено (`nasvitlo-trial`). Повторити,
якщо треба свіжа копія для перевірки:

```sh
scripts/cf/move-account.sh nasvitlo-trial-2
```

**2. ІТ підтвердили записи** → перевірити: `https://nasvitlo.ucu.edu.ua/uk`
відкривається з дійсним сертифікатом (поки — з пробними даними).

**3. День перемикання.** Попросити редакторів не правити в старій адмінці.

```sh
scripts/cf/move-account.sh nasvitlo
```

Далі:
1. У `move-botsdev` вписати в `wrangler.jsonc` `database_name: "nasvitlo"` і
   надрукований скриптом `database_id`, злити гілку в `main`.
2. botsDev: у збірках `nasvitlo` і `nasvitlo-staging` перемкнути гілку на
   `main`, у хуках `emdash-publish` і `drafts` — теж `main`. У `nasvitlo`
   прибрати змінну `EMDASH_URL` (фото тепер беруться з `nasvitlo.ucu.edu.ua`).
3. Старий акаунт: від'єднати репозиторій від Workers Builds (`main` тепер
   вказує на botsDev, тож його збірки однаково падатимуть).

**4. Перевірка й редактори.** Сайт на `nasvitlo.ucu.edu.ua` — ті самі
сторінки, що й на старій адресі. Адмінка `https://nasvitlo.ucu.edu.ua/_emdash/admin`
→ Користувачі → кожному «Надіслати посилання для відновлення» → вхід →
«Додати passkey». Одна дрібна публікація має дійти до сайту, а збереження
чернетки — до staging.

**5. Прибрати за собою:**
- GitHub → `bnp-team/zivik-platform` → Settings → Secrets →
  `CLOUDFLARE_ACCOUNT_ID` (botsDev) і `CLOUDFLARE_API_TOKEN` (токен botsDev з
  D1 · Edit) — для нічного бекапу.
- Web Analytics: створити сайт у botsDev і замінити
  `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` (зараз дані йдуть у старий акаунт).
- Видалити `nasvitlo-trial`. Стару базу й Worker у старому акаунті не
  видаляти щонайменше місяць.
