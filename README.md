# Vibe Photo Delivery MVP

Next.js MVP для фотографа: загрузка коллекций, публичные ссылки для клиентов, портфолио, услуги, квоты хранения и автоочистка.

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Auth.js / NextAuth with Google OAuth
- S3-compatible storage via MinIO/S3 adapter
- Tailwind CSS + lightweight shadcn-style UI primitives
- Vitest for domain/service tests

## Local Setup

1. Скопировать пример окружения:

```bash
cp .env.example .env
```

2. Поднять локальные сервисы:

```bash
pnpm db:up
```

3. Применить миграции и сгенерировать Prisma client:

```bash
pnpm prisma:migrate --name init
pnpm prisma:generate
```

4. Запустить приложение:

```bash
pnpm dev
```

## Important Notes

- Локальный PostgreSQL контейнера использует порт `5433`, потому что на этой машине уже занят `5432`.
- Пока не заданы `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`, экран логина показывает ожидаемое сообщение о неготовой OAuth-конфигурации.
- Cleanup cron вызывается через `POST /api/internal/cleanup` с заголовком `x-cron-secret`.

## Verification

```bash
pnpm exec vitest run
pnpm lint
pnpm build
```
