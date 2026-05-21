# Environment Configuration

AkibaCore is split into two independent apps. Each app owns its own `.env` file and can run without reading configuration from the repository root.

## Files

```text
shopanime_be/.env.example     Backend template. Commit this.
shopanime_be/.env             Backend local values. Do not commit.
shopanime_fe/.env.example     Frontend template. Commit this.
shopanime_fe/.env             Frontend local values. Do not commit.
```

There is no required root `.env`.

## Backend Env

Backend values live in `shopanime_be/.env`.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode |
| `PORT` | Backend listen port, default `4000` |
| `API_PREFIX` | API prefix, default `api` |
| `FRONTEND_URL` | CORS allowed frontend origins |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `DB_CONNECTION_LIMIT` | MySQL pool size |
| `DB_SYNC_SCHEMA` | Create missing schema objects |
| `DB_REBUILD_SCHEMA` | Destructive rebuild switch |
| `DB_SEED_ON_START` | Seed demo data when products are empty |
| `JWT_SECRET` | Token signing secret |
| `N8N_CHATBOT_WEBHOOK_URL` | n8n production webhook URL used by the backend chatbot proxy |
| `N8N_CHATBOT_TIMEOUT_MS` | Timeout for chatbot webhook requests, default `30000` |

Run backend independently:

```bash
cd shopanime_be
copy .env.example .env
npm install
npm run dev
```

## Frontend Env

Frontend values live in `shopanime_fe/.env`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Public backend API URL used by browser code |
| `NEXT_PUBLIC_APP_NAME` | Public app display name |

Run frontend independently:

```bash
cd shopanime_fe
copy .env.example .env
npm install
npm run dev
```

## Docker

Each app has its own Dockerfile:

```text
shopanime_be/Dockerfile
shopanime_fe/Dockerfile
```

The root `docker-compose.yml` only orchestrates services for local development. It builds each app from its own folder context and passes each app's own `.env` file with `env_file`.

Docker logs are capped in `docker-compose.yml` with `max-size: 10m` and `max-file: 3` for each service. The Dockerfiles also avoid copying local build output, local env files, and `node_modules` into the build context.

## Secret Hygiene

- Never commit `.env`.
- Commit only `.env.example`.
- Generate real secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Common Mistakes

- Do not define legacy `VITE_*` variables; the frontend uses Next.js.
- Do not define frontend `NEXT_PUBLIC_*` variables in `shopanime_be/.env`.
- Do not define DB/JWT secrets in `shopanime_fe/.env`.
- Do not set `DB_REBUILD_SCHEMA=true` unless you intentionally want to drop app tables.
