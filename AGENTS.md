# AkibaCore AI Agent Instructions

These instructions are for AI coding agents working in this repository. They adapt the cautious, surgical workflow from `forrestchang/andrej-karpathy-skills` to this codebase.

## Project Shape

- `shopanime_be`: NestJS backend API. Entry: `shopanime_be/main.ts`. API base path: `/api`.
- `shopanime_fe`: Next.js + React 19 + Tailwind frontend. Entry: `shopanime_fe/src/app`.
- Root scripts coordinate both apps. Prefer root scripts when verifying cross-app behavior.
- Backend schema/API docs live in `shopanime_be/database_schema.md` and `shopanime_be/API_DOCS.md`.

## Operating Principles

### Think Before Coding

- State assumptions when a request has multiple valid meanings.
- Ask only when a wrong assumption would cause risky or broad changes.
- Read the relevant files before editing. Do not infer app architecture from filenames alone.
- For API work, check the backend service/controller and frontend API consumer together.

### Keep It Simple

- Implement the smallest change that solves the requested problem.
- Do not add abstractions, config layers, state managers, or generic helpers unless the existing code already needs them.
- Prefer local helpers over new dependencies.
- Do not introduce speculative features such as auth flows, caching, pagination, or admin tooling unless asked.

### Make Surgical Changes

- Touch only files needed for the task.
- Match the existing style in the edited area.
- Do not reformat unrelated code.
- Remove imports, variables, and functions made unused by your own changes.
- Mention unrelated problems separately instead of fixing them opportunistically.

### Verify Explicitly

- Frontend-only changes: run `npm --prefix shopanime_fe run typecheck` and usually `npm --prefix shopanime_fe run build`.
- Backend-only changes: run `npm run backend:build`.
- Cross-app changes: run `npm run lint` or `npm run build` when feasible.
- If a command cannot run, report the exact reason and the residual risk.

## TypeScript Rules

- Keep frontend strict. Do not add `any`, `as any`, `@ts-ignore`, or `@ts-expect-error` unless there is no reasonable alternative and the reason is documented.
- API responses should use shared types from `shopanime_fe/src/lib/types.ts`.
- Numeric DB values may arrive as strings. Use existing formatting/conversion helpers instead of calling `toFixed` directly on API data.
- Keep route params and environment values explicitly nullable or validated before use.
- Prefer `unknown` at boundaries, then narrow to concrete types.

## Frontend Rules

- Preserve the existing Next.js + React + Tailwind stack.
- Use existing helpers in `shopanime_fe/src/lib` before adding new utilities.
- Use `lucide-react` icons when an icon is needed.
- Keep product/category/order fields aligned with backend query aliases, especially `image` vs `image_url`, `author` vs `author_name`, and DECIMAL values.
- Do not add app-wide state management unless a task clearly requires shared mutable state.

## Backend Rules

- Keep NestJS module/controller/service boundaries intact.
- Put SQL in services, not controllers.
- Do not drop or rebuild schema unless the user explicitly requests it.
- Respect `.env` toggles:
  - `DB_SYNC_SCHEMA=true`: create missing tables.
  - `DB_REBUILD_SCHEMA=true`: destructive development rebuild.
  - `DB_SEED_ON_START=true`: seed demo data when empty.
- Validate user-facing request bodies at controller/service boundaries before using them in SQL.

## Dependency Rules

- Do not install new packages for small helpers.
- If a package is necessary, install it in the correct package scope:
  - Frontend: `shopanime_fe/package.json`.
  - Backend/root shared runtime: root `package.json` and/or `shopanime_be/package.json`, matching existing dependency layout.
- Keep lockfiles updated by package manager commands, not manual edits.

## Response Checklist

Before finishing:

- Summarize changed files and why they changed.
- Include verification commands and results.
- Call out any known follow-up risk, especially missing tests or runtime behavior not exercised.
