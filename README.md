# AkibaCore

Fullstack manga shop demo split into two independently runnable apps:

- `shopanime_be`: NestJS backend API on port `4000`
- `shopanime_fe`: Next.js + React + Tailwind frontend on port `3000`

## Structure

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

Next.js uses `shopanime_fe/src/app` as the browser entry. The current app runs existing React pages through a client entry while the project migrates away from the old Vite shell.

## Environment

Each app owns its own environment file. See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

```bash
copy shopanime_be\.env.example shopanime_be\.env
copy shopanime_fe\.env.example shopanime_fe\.env
```

## Backend

```bash
cd shopanime_be
npm install
npm run dev
```

Backend reads `shopanime_be/.env`.

Important database toggles:

- `DB_SYNC_SCHEMA=true`: create missing MySQL tables on startup without dropping data.
- `DB_REBUILD_SCHEMA=true`: drop and rebuild app tables on startup. Use only for development.
- `DB_SEED_ON_START=true`: insert demo data when `products` is empty.

## Frontend

```bash
cd shopanime_fe
npm install
npm run dev
```

Frontend reads `shopanime_fe/.env` and calls:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

## Production Build Locally

```bash
npm run build
npm run backend:start
npm run frontend:start
```

Or run each app independently:

```bash
cd shopanime_be
npm run build
npm run start

cd ..\shopanime_fe
npm run build
npm run start
```

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

## Docker

```bash
docker compose up --build
```

Compose builds `shopanime_be/Dockerfile` and `shopanime_fe/Dockerfile` from their own folder contexts.
Container logs are capped at `10m` x `3` files per service to reduce disk growth on small servers.

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- MySQL: localhost:3306
- phpMyAdmin: http://localhost:8080

## Generate Secrets

Use real values in production:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
