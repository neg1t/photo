# Полный гайд по VPS, поддомену и CI/CD

Этот документ описывает production-схему для текущего проекта:

- основной домен остается `neg1t.ru`
- сам проект публикуется на поддомене `photo.neg1t.ru`
- DNS остается у регистратора `Reg.ru`
- приложение работает на VPS
- `app` и `worker` запускаются через `docker compose`
- `nginx` и `certbot` ставятся на сам VPS
- деплой идет через `GitHub Actions -> GHCR -> VPS`

Это не мешает в будущем использовать другие поддомены:

- `another-project.neg1t.ru`
- `dev.another-project.neg1t.ru`

Для каждого нового проекта ты просто создаешь отдельную DNS-запись и отдельный `server_name` в `nginx`.

## 1. Что должно быть готово до старта

- VPS c `Ubuntu 24.04`
- домен `neg1t.ru` с доступом к DNS в `Reg.ru`
- GitHub repository
- рабочие production credentials:
  - Neon
  - Google OAuth
  - SelCloud S3

Дополнительный shared hosting не нужен.

## 2. Подготовить пользователя и доступ на VPS

Под `root` или пользователем с `sudo`:

```bash
adduser deploy
usermod -aG sudo deploy
```

Добавь SSH-ключ для `deploy`:

```bash
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Рекомендация:

- потом отключить password login для `deploy`
- оставить только вход по SSH key

## 3. Установить системные пакеты

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx git rsync ufw
```

Добавь `deploy` в docker group:

```bash
sudo usermod -aG docker deploy
```

После этого перелогинься под `deploy`.

## 4. Настроить firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 5. Создать рабочие директории

Создай директории через `sudo`, потому что `/opt` принадлежит `root`:

```bash
sudo mkdir -p /opt/photo/current
sudo mkdir -p /opt/photo/shared/env
sudo mkdir -p /opt/photo/shared/logs
sudo mkdir -p /var/www/certbot
sudo chown -R deploy:deploy /opt/photo
sudo chown -R deploy:deploy /var/www/certbot
```

## 6. Подготовить production env

1. Возьми шаблон [`.env.production.example`](/D:/src/vibe/.env.production.example)
2. Сохрани его как:

```bash
/opt/photo/shared/env/.env.production
```

3. Заполни реальные значения

Обязательно:

```env
DATABASE_URL=postgresql://<neon-pooled>
DIRECT_URL=postgresql://<neon-direct>
NEXTAUTH_SECRET=<random-64-char-hex>
NEXTAUTH_URL=https://photo.neg1t.ru
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

## 7. Настроить DNS в Reg.ru

Для этого проекта тебе не нужно трогать `neg1t.ru` и `www.neg1t.ru`.

Нужно создать только поддомен:

- `photo.neg1t.ru` -> `144.31.143.135`

Как сделать это в текущем интерфейсе:

1. Открой `DNS-серверы и управление зоной`
2. В блоке `Ресурсные записи` нажми `Добавить запись`
3. Выбери `A`
4. В поле `Subdomain` введи:

```text
photo
```

5. В поле `IP Address` введи IP твоего VPS:

```text
144.31.143.135
```

6. Нажми `Готово`

После этого `photo.neg1t.ru` будет указывать на VPS.

Если потом появится новый проект, создаешь еще одну запись по тому же принципу:

- `Subdomain`: `another-project`
- или `Subdomain`: `dev.another-project`

Проверка:

```bash
nslookup photo.neg1t.ru
```

Должен вернуться IP:

```text
144.31.143.135
```

## 8. Настроить Nginx

Для текущего проекта нужен отдельный virtual host именно под:

- `photo.neg1t.ru`

Шаблон лежит здесь:

- [`deploy/nginx/photo.conf`](/D:/src/vibe/deploy/nginx/photo.conf)

Скопируй его как:

```bash
sudo cp /opt/photo/current/deploy/nginx/photo.conf /etc/nginx/sites-available/photo.conf
```

Активируй:

```bash
sudo ln -s /etc/nginx/sites-available/photo.conf /etc/nginx/sites-enabled/photo.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Выпустить TLS через Certbot

Для поддомена `photo.neg1t.ru`:

```bash
sudo certbot --nginx -d photo.neg1t.ru
```

Проверить автопродление:

```bash
sudo systemctl status certbot.timer
```

## 10. Настроить Google OAuth под production domain

В `Google Cloud Console` обнови:

- Authorized JavaScript origin:
  - `https://photo.neg1t.ru`
- Authorized redirect URI:
  - `https://photo.neg1t.ru/api/auth/callback/google`

Старые `vercel.app` redirect/origin можно удалить после переключения.

## 11. Настроить GHCR доступ на VPS

Создай GitHub token с правом:

- `read:packages`

На VPS выполни:

```bash
docker login ghcr.io
```

Используй:

- username = GitHub username
- password = созданный token

## 12. Включить GitHub Actions и права workflow

До добавления секретов проверь, что Actions вообще включены в репозитории.

В репозитории открой:

- `Settings`
- `Actions`
- `General`

Проверь следующие настройки:

- `Actions permissions`:
  - выбрано `Allow all actions and reusable workflows`
- `Workflow permissions`:
  - выбрано `Read and write permissions`

Если в репозитории Actions еще ни разу не запускались, также открой:

- вкладку `Actions`

И убедись, что там нет кнопки вроде:

- `I understand my workflows, go ahead and enable them`
- `Enable workflows`

Если такая кнопка есть, ее нужно нажать, иначе `push` в `main` ничего не запустит.

Проверка после `push`:

1. Открой вкладку `Actions`
2. Слева выбери workflow `Deploy`
3. У тебя должен появиться новый run на свежем коммите из `main`

Если run нет вообще, ищи проблему в одном из этих мест:

- Actions выключены в репозитории
- workflow не попал в ветку `main`
- `push` был не в `main`

## 13. Настроить GitHub Secrets

В репозитории открой:

- `Settings`
- `Secrets and variables`
- `Actions`

Добавь:

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_KEY`

Где:

- `VPS_HOST` = `144.31.143.135` или DNS-имя VPS
- `VPS_PORT` = SSH port, обычно `22`
- `VPS_USER` = `deploy`
- `VPS_SSH_KEY` = приватный SSH key, который соответствует публичному ключу в `/home/deploy/.ssh/authorized_keys`

## 14. Что уже делает workflow

Workflow лежит в [`.github/workflows/deploy.yml`](/D:/src/vibe/.github/workflows/deploy.yml).

На каждый `push` в `main` он:

1. делает checkout
2. ставит `pnpm`
3. ставит `Node.js`
4. выполняет `pnpm install --frozen-lockfile`
5. выполняет `pnpm exec prisma generate`
6. выполняет `pnpm exec vitest run`
7. выполняет `pnpm lint`
8. выполняет `pnpm build`
9. логинится в `GHCR`
10. собирает и пушит Docker image
11. запускает SSH agent
12. синхронизирует deploy-файлы на VPS
13. на VPS выполняет deploy script

## 15. Что делает deploy script на VPS

Скрипт [`scripts/deploy/deploy.sh`](/D:/src/vibe/scripts/deploy/deploy.sh):

1. делает `docker compose pull`
2. вызывает [`scripts/deploy/run-migrations.sh`](/D:/src/vibe/scripts/deploy/run-migrations.sh)
3. выполняет `pnpm prisma migrate deploy` в контейнере
4. запускает `docker compose up -d --remove-orphans`
5. чистит старые Docker images

## 16. Первый production deploy

Когда DNS, Nginx, env, GHCR и GitHub secrets уже готовы:

1. Убедись, что код и workflow лежат в `main`
2. Сделай push в `main`
3. Открой GitHub Actions
4. Дождись успешного workflow `Deploy`

## 17. Проверка после первого деплоя

Проверь:

```bash
curl https://photo.neg1t.ru/api/health
```

После этого вручную прогони:

- вход через Google
- создание коллекции
- upload файла в S3
- появление preview после worker
- публикацию коллекции
- скачивание оригинала
- скачивание ZIP
- загрузку в портфолио

## 18. Настроить ежедневный cleanup

Под пользователем `deploy` выполни:

```bash
crontab -e
```

Добавь строку:

```bash
0 3 * * * cd /opt/photo/current && docker compose -f docker-compose.prod.yml run --rm app pnpm cleanup >> /opt/photo/shared/logs/cleanup.log 2>&1
```

Проверка cron:

```bash
crontab -l
```

## 19. Что делать при обновлениях

Обычный сценарий:

1. меняешь код
2. пушишь в `main`
3. GitHub Actions делает сборку и деплой

Если менялся только `.env.production`, workflow его не перезальет. После ручного изменения env на VPS выполни:

```bash
cd /opt/photo/current
IMAGE_NAME=ghcr.io/neg1t/photo IMAGE_TAG=latest ./scripts/deploy/deploy.sh
```

## 20. Что делать при новом проекте на этом же домене

Для другого проекта создаешь новый поддомен:

- `another-project.neg1t.ru`
- или `dev.another-project.neg1t.ru`

И повторяешь ту же схему:

1. отдельная `A` запись в DNS
2. отдельный `server_name` в `nginx`
3. отдельный `certbot -d <subdomain>`

Основной домен `neg1t.ru` при этом не страдает и может вообще использоваться отдельно.

## 21. Типовые проблемы

### Workflow падает на SSH

Проверь:

- корректность `VPS_HOST`, `VPS_PORT`, `VPS_USER`
- приватный ключ в `VPS_SSH_KEY`
- публичный ключ в `authorized_keys`

### Workflow падает на rsync

Проверь:

- что на VPS установлен `rsync`
- что `/opt/photo/current` существует
- что у `deploy` есть права на запись

### Контейнер поднялся, но сайт не открывается

Проверь:

- `nginx -t`
- `systemctl status nginx`
- `docker compose -f /opt/photo/current/docker-compose.prod.yml ps`
- корректность `NEXTAUTH_URL`

### Google login не работает на домене

Проверь:

- production origin/redirect в Google Console
- `NEXTAUTH_URL=https://photo.neg1t.ru`

### Upload не работает в production

Проверь:

- S3 bucket CORS для `https://photo.neg1t.ru`
- корректность `S3_*` env
- наличие доступа `read/write/delete` у ключей

### Preview не появляются

Проверь:

- жив ли `worker`
- нет ли ошибок в логах контейнера worker
- не уходят ли файлы в `ORIGINAL_ONLY`
