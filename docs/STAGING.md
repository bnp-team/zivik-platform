# Staging — перегляд чернеток до публікації

Публічний сайт пререндериться з **опублікованого** контенту, тож чернетку
до «Опублікувати» ніде не видно. Staging — той самий сайт, зібраний **з
чернетками**: після кожного «Зберегти» він перезбирається (~2 хв), і редактор
читає сторінку такою, якою вона стане.

Як це влаштовано в коді:

- `npm run cf:build:staging` = звичайна збірка, але `cf:pull -- --drafts`:
  до кожного запису з незбереженою в публікацію правкою застосовується його
  чернетка (`revisions`), а ще не опубліковані записи теж потрапляють на сайт.
- Плагін `site/emdash/staging-on-save.ts` після кожного збереження викликає
  deploy hook зі секрету `STAGING_DEPLOY_HOOK_URL`. Без секрету мовчить.
- Staging завжди закритий від пошуковиків (`SITE_INDEXABLE` там не ставити).

## Налаштування (один раз, у Cloudflare)

1. **Workers & Pages → Create → Import a repository** → `vm-cpu/zivik-platform`.
   - Назва Worker: `nasvitlo-staging`.
   - Branch: та сама, з якої збирається прод.
   - Build command: `npm run cf:build:staging`.
   - Deploy command: `npx wrangler deploy --name nasvitlo-staging`.
   - API token: той самий «nasvitlo build token» (йому потрібен доступ до D1).
2. У новому Worker → **Settings → Build → Variables**: `NEXT_PUBLIC_SITE_URL` =
   адреса staging (наприклад `https://nasvitlo-staging.vm-55d.workers.dev`).
   `SITE_INDEXABLE` **не** додавати.
3. **Settings → Build → Deploy Hooks → Add**: назва `drafts`, гілка — та сама.
   Скопіюйте адресу хука.
4. У **продакшн**-Worker `nasvitlo` (де працює адмінка) додайте секрет:
   ```
   npx wrangler secret put STAGING_DEPLOY_HOOK_URL --name nasvitlo
   ```
   і вставте адресу хука з кроку 3 (див. docs/CLOUDFLARE.md про копіювання).
5. **Доступ.** Staging показує неопубліковане — закрийте його:
   Worker `nasvitlo-staging` → **Settings → Domains & Routes** → увімкнути
   **Cloudflare Access** (Zero Trust → Access → Applications → Self-hosted,
   домен staging, політика «Emails» — адреси редакції).
6. Перевірка: в адмінці змініть будь-який запис → **Зберегти** (не
   публікувати) → за ~2 хв правка на staging, на проді — ні.

## Що варто знати

- Staging — копія сайту **з тією ж адмінкою й базою**: не редагуйте через
  `/_emdash/admin` на staging-адресі, працюйте в основній адмінці.
- Якщо чернетка ламає збірку (наприклад, інваріант даних), впаде лише
  staging — прод не зачеплено. Це і є сенс: побачити проблему до публікації.


## Стан на 29 вересня 2026

- Копія `nasvitlo-staging` існує й перезбирається з `main` (з чернетками) після
  кожного пушу.
- Хук `drafts` створено, але **секрету `STAGING_DEPLOY_HOOK_URL` у Worker
  `nasvitlo` ще немає**, тож «Зберегти» в адмінці staging **не** перезбирає.
  Щоб перезбирало (крок 4 вище), власниця додає секрет сама: Cloudflare →
  Workers & Pages → `nasvitlo` → Settings → Variables and Secrets → Add →
  тип Secret, ім'я `STAGING_DEPLOY_HOOK_URL`, значення – адреса хука `drafts`
  (Settings → Build → Deploy Hooks у `nasvitlo-staging`).
- Тексти в панелі адмінки «Перегляд перед публікацією» не обіцяють точного часу
  саме тому: без секрету staging оновлюється лише з пушем розробника.
