# Photo Delivery MVP

Self-hosted `Next.js` сервис для фотографа: клиентские коллекции, публичные галереи, портфолио, услуги, S3-хранилище оригиналов, фоновая генерация preview и ежедневная очистка.

## Быстрые ссылки

- Локальный тест с `Neon + SelCloud S3`: [docs/local-testing.md](/D:/src/vibe/docs/local-testing.md)
- Production и CI/CD на VPS: [docs/vps-ci-cd.md](/D:/src/vibe/docs/vps-ci-cd.md)
- Локальный env-шаблон: [.env.example](/D:/src/vibe/.env.example)
- Production env-шаблон: [.env.production.example](/D:/src/vibe/.env.production.example)
- GitHub Actions deploy workflow: [.github/workflows/deploy.yml](/D:/src/vibe/.github/workflows/deploy.yml)
- Production compose: [docker-compose.prod.yml](/D:/src/vibe/docker-compose.prod.yml)
- Nginx конфиг: [deploy/nginx/photo.conf](/D:/src/vibe/deploy/nginx/photo.conf)

## Текущая архитектура

- `browser -> S3` для загрузки оригиналов
- `app` сохраняет записи медиа в БД
- `worker` асинхронно строит preview
- `nginx` и `certbot` работают на VPS-хосте
- деплой идет через `GitHub Actions -> GHCR -> VPS`

## Статусы медиа

- `PENDING` — оригинал загружен, preview еще не готово
- `PROCESSING` — worker обрабатывает файл
- `READY` — preview построено
- `ORIGINAL_ONLY` — оригинал сохранен, но browser preview недоступно
- `FAILED` — файл исключен из пользовательского сценария

## Основные команды

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm dev
pnpm worker
pnpm cleanup
pnpm exec vitest run
pnpm lint
pnpm build
```

## Helper scripts для VPS

- Базовая подготовка VPS: [scripts/deploy/bootstrap-vps.sh](/D:/src/vibe/scripts/deploy/bootstrap-vps.sh)
- Применение миграций: [scripts/deploy/run-migrations.sh](/D:/src/vibe/scripts/deploy/run-migrations.sh)
- Production deploy: [scripts/deploy/deploy.sh](/D:/src/vibe/scripts/deploy/deploy.sh)
- Установка cleanup cron: [scripts/deploy/install-cleanup-cron.sh](/D:/src/vibe/scripts/deploy/install-cleanup-cron.sh)

## Что важно помнить

- Для локального теста домен не нужен, достаточно `http://localhost:3000`
- Для локального теста нужно запускать и `app`, и `worker`
- Для production shared hosting не нужен, используется твоя VPS
- DNS production-домена по текущей схеме остается у регистратора
