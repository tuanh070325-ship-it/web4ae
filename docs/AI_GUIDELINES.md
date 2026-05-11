# AI Guidelines for AkibaCore

This document explains how an AI assistant should work in this repository. It is adapted from the public ideas in `forrestchang/andrej-karpathy-skills`, with AkibaCore-specific rules added for this fullstack app.

## 1. Think First

Before changing code, identify:

- Which app is affected: backend, frontend, or both.
- Which files define the behavior.
- What success looks like and how to verify it.
- Which assumptions are safe and which need confirmation.

Ask for clarification only when a wrong assumption would cause broad or risky changes.

## 2. Keep Solutions Small

Good changes in this repo should be easy to review:

- No speculative features.
- No broad refactors for narrow bugs.
- No new abstractions for one use case.
- No new dependencies for simple helpers.
- No unrelated style churn.

## 3. Preserve Architecture

Backend:

- Controllers expose routes.
- Services own SQL and business logic.
- Modules wire dependencies.
- Schema behavior is controlled by `.env` toggles.

Frontend:

- Views consume API helpers and shared types.
- `shopanime_fe/src/lib/types.ts` defines frontend API contracts.
- `shopanime_fe/src/lib/format.ts` handles API number formatting.
- Next.js owns the build/runtime entry. The current client shell uses React Router for page routing.
- Tailwind owns styling.

## 4. TypeScript Quality Bar

Frontend TypeScript should remain strict:

- No `any` in app source.
- No TypeScript suppression comments unless there is a documented reason.
- No unsafe direct formatting of API DECIMAL values.
- Nullable route params and optional API fields must be handled explicitly.

Recommended checks:

```bash
npm --prefix shopanime_fe run typecheck
npm --prefix shopanime_fe run build
```

## 5. Verification Matrix

Use the narrowest command that proves the change:

| Change type | Minimum verification |
| --- | --- |
| Frontend types/components | `npm --prefix shopanime_fe run typecheck` |
| Frontend build/runtime entry | `npm --prefix shopanime_fe run build` |
| Backend TypeScript/services | `npm run backend:build` |
| API contract between backend and frontend | `npm run lint` plus targeted manual/API check when possible |
| Docker/deploy config | Build relevant image or explain why it was not run |

## 6. Review Checklist

Before handing off:

- Changed files are limited to the request.
- TypeScript checks pass.
- Build passes when relevant.
- New helpers are used in at least two places or are clearly boundary utilities.
- No unrelated formatting changes.
- Remaining risks are stated plainly.

## 7. Common AkibaCore Pitfalls

- Backend product queries alias `p.image_url AS image`; frontend should tolerate both `image` and `image_url`.
- MySQL DECIMAL values can arrive as strings; do not assume `number`.
- Frontend category URLs may use slugs while product data stores numeric `category_id`.
- `shopanime_fe/src/app` is the Next.js entry; do not bypass it with a parallel frontend entry.
- `DB_REBUILD_SCHEMA=true` is destructive and must not be used casually.
