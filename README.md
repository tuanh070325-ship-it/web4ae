# AkibaCore

AkibaCore is a fullstack manga shop demo.

- `shopanime_be`: NestJS backend API on `http://localhost:4000/api`
- `shopanime_fe`: Next.js, React 19, Tailwind frontend on `http://localhost:3000`
- MySQL is the runtime database for the backend.

## Requirements

- Node.js 20+
- npm
- MySQL 8+

## Install

From the repository root:

```powershell
copy shopanime_be\.env.example shopanime_be\.env
copy shopanime_fe\.env.example shopanime_fe\.env
npm install
npm --prefix shopanime_be install
npm --prefix shopanime_fe install
```

Create the local database:

```sql
CREATE DATABASE shopanime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update `shopanime_be/.env` with your MySQL credentials.

## Database Flags

Use these local settings for first run:

```env
DB_SYNC_SCHEMA=true
DB_REBUILD_SCHEMA=false
MOCK_DATA=true
DB_SEED_ON_START=false
```

- `DB_SYNC_SCHEMA=true` creates missing tables, columns, indexes, and safe foreign keys.
- `DB_REBUILD_SCHEMA=true` drops app tables before recreating them. Use only when you intentionally want a development reset.
- `MOCK_DATA=true` inserts demo data once. The backend records the run in `app_seed_runs` to prevent duplicate inserts.
- `DB_SEED_ON_START` is a legacy compatibility flag. Prefer `MOCK_DATA`.

## Demo Data And Analytics

Use schema sync when tables were added but the database already exists:

```powershell
npm --prefix shopanime_be run db:sync
```

Use the deterministic demo seed when you want admin pages to show a coherent 30-day ecommerce timeline:

```powershell
npm --prefix shopanime_be run db:seed:demo
```

`db:seed:demo` is a development command. It keeps catalog tables such as products, authors, and categories, then resets operational/demo tables including carts, wishlists, orders, order items, feed/review demo activity, inventory transactions, and analytics. It inserts customer accounts, addresses, carts, wishlists, orders, order items, and analytics events whose dates and revenue match each other.

Admin analytics is available at:

```text
http://localhost:3000/admin/analytics
```

The admin dashboard (`/admin`) is for operational overview: revenue, orders, users, products, and recent orders. The analytics page (`/admin/analytics`) is for behavioral analysis: visitors, pageviews, product clicks, add-to-cart, funnel, top pages, and product performance.

## Run Development

The root scripts are the standard entrypoint. Run commands from the repository root so backend/frontend scripts stay consistent with the same repository version.

Backend only:

```powershell
npm run backend:dev
```

Frontend only:

```powershell
npm run frontend:dev
```

Default development command:

```powershell
npm run dev
```

Note: `npm run dev` currently starts the backend because the backend owns the API/database boot process. For full local development, keep one terminal running `npm run backend:dev` and a second terminal running `npm run frontend:dev`.

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

Demo login after mock seed:

```text
Admin:    kaito@example.com / password123
Customer: aya@example.com   / password123
```

Password storage note:

- Passwords are not stored as plain text.
- New passwords are stored as `base64:<Base64 of "scrypt:<salt>:<derived-key>">`.
- Base64 is only a storage/display wrapper; `scrypt` remains the actual one-way password hash.
- Existing `scrypt:...` hashes are migrated automatically when the backend starts with `DB_SYNC_SCHEMA=true`.

## Build And Verify

Quick verification before pushing code:

```powershell
npm run backend:build
npm --prefix shopanime_fe run typecheck
```

Full repository verification:

```powershell
npm run verify
```

Run ESLint only:

```powershell
npm run lint
```

Auto-fix ESLint formatting/style warnings:

```powershell
npm run lint:fix
```

Full production build:

```powershell
npm run build
```

`npm run build` runs the backend TypeScript build first, then the frontend production build. If either app fails, fix that app before starting production.

Run compiled apps:

```powershell
npm run backend:start
npm run frontend:start
```

Use two terminals for production start as well, or let Docker Compose manage both services.

## Root Scripts

| Command | What it does | When to use |
| --- | --- | --- |
| `npm run dev` | Starts the backend dev server | Fast API/database development |
| `npm run backend:dev` | Starts NestJS API on port `4000` | Backend work, schema sync, mock seed |
| `npm run frontend:dev` | Starts Next.js on port `3000` | Frontend work |
| `npm run typecheck` | Backend build + frontend typecheck | Type-level verification |
| `npm run lint` | Runs ESLint in quiet error-check mode | Code quality check |
| `npm run lint:fix` | Runs ESLint auto-fix | Automatic style/format cleanup |
| `npm run verify` | Runs typecheck, then ESLint | Required sanity check before handoff |
| `npm run build` | Backend build + frontend production build | Production verification |
| `npm run backend:start` | Runs compiled backend | Production backend after build |
| `npm run frontend:start` | Runs compiled frontend | Production frontend after build |

Backend package scripts:

| Command | What it does |
| --- | --- |
| `npm --prefix shopanime_be run db:sync` | Creates missing schema objects and seeds only when the normal seed rules allow it |
| `npm --prefix shopanime_be run db:seed:demo` | Rebuilds deterministic development activity data without dropping schema/catalog tables |

Important notes:

- Start the backend first on a fresh database. It creates missing MySQL schema objects and optionally seeds mock data.
- Keep `DB_REBUILD_SCHEMA=false` unless you intentionally want to drop development tables.
- Keep `MOCK_DATA=true` only for demo/local data. Seed is recorded in `app_seed_runs` and will not duplicate on later starts.
- Frontend browser code calls `NEXT_PUBLIC_API_BASE_URL`, usually `http://localhost:4000/api`.

## Docker

```powershell
docker compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- MySQL: localhost:3306
- phpMyAdmin: http://localhost:8080

## API Docs

Backend API curl examples are in [shopanime_be/API_DOCS.md](shopanime_be/API_DOCS.md).

Database schema notes are in [shopanime_be/database_schema.md](shopanime_be/database_schema.md).

Environment details are in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Secrets

Never commit `.env`. Generate strong local secrets with:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
