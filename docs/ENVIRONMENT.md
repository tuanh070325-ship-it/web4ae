# Environment Configuration

AkibaCore has two apps with separate environment files.

```text
shopanime_be/.env.example     Backend template. Commit this file.
shopanime_be/.env             Backend local values. Do not commit.
shopanime_fe/.env.example     Frontend template. Commit this file.
shopanime_fe/.env             Frontend local values. Do not commit.
```

## Backend

Backend values live in `shopanime_be/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Runtime mode, usually `development` locally |
| `PORT` | Yes | Backend port, default `4000` |
| `API_PREFIX` | Yes | API prefix, default `api` |
| `FRONTEND_URL` | Yes | Allowed CORS origin, for example `http://localhost:3000` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Yes | MySQL connection |
| `DB_CONNECTION_LIMIT` | No | MySQL pool size, default `10` |
| `DB_SYNC_SCHEMA` | Yes | `true` creates missing tables, columns, indexes, and safe FK constraints |
| `DB_REBUILD_SCHEMA` | Yes | `true` drops and recreates app tables. Development only |
| `MOCK_DATA` | Yes | `true` seeds demo data once, tracked by `app_seed_runs` |
| `DB_SEED_ON_START` | No | Legacy seed flag. Kept for compatibility; prefer `MOCK_DATA` |
| `JWT_SECRET` | Yes | JWT signing secret |
| `SESSION_SECRET`, `COOKIE_SECRET`, `ENCRYPTION_KEY`, `PASSWORD_PEPPER` | Yes | Application secrets |
| `N8N_CHATBOT_WEBHOOK_URL` | No | n8n webhook used by chatbot proxy |
| `N8N_CHATBOT_TIMEOUT_MS` | No | Chatbot webhook timeout |
| `KEY_GEMINI` | No | Gemini API key for admin product description AI |
| `GEMINI_MODEL` | No | Gemini model, default `gemini-3.1-pro-preview` |
| `GEMINI_FALLBACK_MODELS` | No | Comma-separated fallback models. Leave empty to disable fallback |
| `GEMINI_MAX_OUTPUT_TOKENS` | No | Product AI max output tokens, default `5000` |
| `GEMINI_TIMEOUT_MS` | No | Gemini request timeout |

Gemini quota errors are account/model limits, not application bugs. If `GEMINI_MODEL=gemini-3.1-pro-preview` returns a quota or billing error, enable the model in Google AI billing/rate limits or set `GEMINI_FALLBACK_MODELS` to another model available to the same API key.

Recommended local database flags:

```env
DB_SYNC_SCHEMA=true
DB_REBUILD_SCHEMA=false
MOCK_DATA=true
DB_SEED_ON_START=false
```

Production database flags:

```env
DB_SYNC_SCHEMA=true
DB_REBUILD_SCHEMA=false
MOCK_DATA=false
DB_SEED_ON_START=false
```

`MOCK_DATA=true` is safe to leave on in local development because the backend writes a marker into `app_seed_runs` and will not insert mock data again. If the database already has products before the marker exists, the backend records the marker and skips mock insertion to avoid polluting real data.

## Password Hash Format

Backend-created passwords are stored in MySQL as Base64-wrapped scrypt hashes:

```text
base64:<Base64 of "scrypt:<salt>:<derived-key>">
```

Base64 is not the security mechanism. It is only the display/storage wrapper. Password verification still uses `scrypt` with a random salt. Existing `scrypt:<salt>:<derived-key>` rows and old local `dev-password-hash` mock rows are migrated automatically on backend startup when schema sync is enabled.

## Frontend

Frontend values live in `shopanime_fe/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Browser API URL, usually `http://localhost:4000/api` |
| `NEXT_PUBLIC_APP_NAME` | No | Public app display name |

## Local Setup

```powershell
copy shopanime_be\.env.example shopanime_be\.env
copy shopanime_fe\.env.example shopanime_fe\.env
npm --prefix shopanime_be install
npm --prefix shopanime_fe install
```

Start backend and frontend in two terminals:

```powershell
npm run backend:dev
npm run frontend:dev
```

## Secret Hygiene

Never commit `.env`. Generate strong local secrets with:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
