# Локальный тест с боевыми сервисами

Этот сценарий подходит под твою текущую схему: локально запускается только приложение и worker, а база и объектное хранилище остаются внешними.

## Что нужно заранее

- `Neon`:
  - `DATABASE_URL` — pooled URL
  - `DIRECT_URL` — direct/unpooled URL
- `SelCloud S3`:
  - `S3_REGION`
  - `S3_ENDPOINT`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_PUBLIC_BASE_URL`
- `Google OAuth`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `Authorized JavaScript origin`: `http://localhost:3000`
  - `Authorized redirect URI`: `http://localhost:3000/api/auth/callback/google`

## 1. Подготовить локальный `.env`

1. Создай локальный `.env` из [`.env.example`](/D:/src/vibe/.env.example).
2. Заполни реальные значения.

Минимальный набор:

```env
DATABASE_URL=postgresql://<neon-pooled>
DIRECT_URL=postgresql://<neon-direct>
NEXTAUTH_SECRET=<random-64-char-hex>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
S3_REGION=ru-3
S3_ENDPOINT=https://s3.ru-3.storage.selcloud.ru
S3_BUCKET=photo-prod
S3_ACCESS_KEY_ID=<s3-access-key-id>
S3_SECRET_ACCESS_KEY=<s3-secret-access-key>
S3_PUBLIC_BASE_URL=https://s3.ru-3.storage.selcloud.ru/photo-prod
DEFAULT_STORAGE_LIMIT_BYTES=53687091200
DEFAULT_RETENTION_DAYS=30
ZIP_TTL_HOURS=2
CLEANUP_CRON_SECRET=<random-64-char-hex>
ADMIN_EMAILS=onlygame1996@gmail.com
WORKER_POLL_INTERVAL_MS=5000
```

## 2. Проверить S3 CORS

Для локального фронта bucket должен принимать запросы с `http://localhost:3000`.

Проверь, что CORS разрешает:

- Origin: `http://localhost:3000`
- Methods: `PUT`, `GET`, `HEAD`
- Headers: минимум `Content-Type`, безопаснее временно разрешить `*`

Если CORS не настроен, direct upload будет падать до сохранения файла.

## 3. Установить зависимости и Prisma client

```bash
pnpm install
pnpm exec prisma generate
```

## 4. Применить миграции к выбранной базе

```bash
pnpm exec prisma migrate deploy
```

Рекомендация:

- не использовать main production branch базы для локальных экспериментов
- внутри Neon лучше создать отдельную `branch/database` под local-dev и использовать ее URL в `.env`

## 5. Запустить приложение

В первом терминале:

```bash
pnpm dev
```

Во втором терминале:

```bash
pnpm worker
```

Важно:

- без `worker` превью не будут строиться
- файл останется в `PENDING`, и это не баг

## 6. Локальный smoke-check

Пройди сценарий полностью:

1. Вход через Google на `http://localhost:3000/login`
2. Создание коллекции
3. Загрузка обычного `jpg/png/webp`
4. Загрузка большого файла
5. Загрузка `heic/raw-like` файла
6. Проверка, что статус меняется в `READY` или `ORIGINAL_ONLY`
7. Публикация коллекции
8. Открытие публичной ссылки
9. Скачивание одного оригинала
10. Скачивание ZIP
11. Загрузка файлов в портфолио

## 7. Что считать успешным локальным тестом

Локальная проверка считается успешной, если:

- Google login работает на `localhost`
- upload уходит напрямую в S3
- worker подхватывает `PENDING` файлы
- обычные форматы становятся `READY`
- неподдерживаемые для preview фото становятся `ORIGINAL_ONLY`
- публичная галерея открывается
- ZIP собирается и скачивается

## Типовые проблемы

### Клик по Google ничего не делает

Проверь:

- `NEXTAUTH_URL=http://localhost:3000`
- localhost origin/redirect в Google Console
- наличие `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`

### Upload падает сразу в браузере

Проверь:

- bucket CORS
- правильный `S3_ENDPOINT`
- что `S3_BUCKET` совпадает с реальным именем

### Upload проходит, но превью не появляется

Проверь:

- запущен ли `pnpm worker`
- нет ли ошибок в терминале worker
- не стал ли файл `ORIGINAL_ONLY`

### Prisma migrate не проходит

Проверь:

- что `DIRECT_URL` указывает на direct/unpooled Neon endpoint
- что используемая ветка базы доступна и не paused
