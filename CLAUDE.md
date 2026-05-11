# Claude Code Instructions for AkibaCore

Use this file as the project-level instruction set for Claude Code and other tools that read `CLAUDE.md`.

## Core Behavior

- Read before editing. Let the existing code shape the solution.
- Prefer clear, small fixes over broad rewrites.
- Surface assumptions when the request is ambiguous.
- Do not silently choose between multiple product or architecture interpretations.
- Make changes that can be verified with concrete commands.

## Scope Discipline

- Keep every changed line tied to the current request.
- Do not refactor adjacent code just because it looks improvable.
- Do not rewrite formatting in untouched code.
- Clean up only unused code created by your own change.
- Report unrelated issues separately.

## AkibaCore Context

- Backend: `shopanime_be`, NestJS, MySQL, API mounted under `/api`.
- Frontend: `shopanime_fe`, Next.js, React 19, Tailwind, React Router client shell.
- Frontend API helpers and shared types live in `shopanime_fe/src/lib`.
- Backend docs:
  - `shopanime_be/API_DOCS.md`
  - `shopanime_be/database_schema.md`

## Verification

- Frontend typecheck: `npm --prefix shopanime_fe run typecheck`
- Frontend build: `npm --prefix shopanime_fe run build`
- Backend build: `npm run backend:build`
- Whole repo lint/typecheck: `npm run lint`
- Whole repo build: `npm run build`

If verification is skipped or fails, say exactly why.

## TypeScript Standards

- Keep frontend strict.
- Avoid `any`, `as any`, `@ts-ignore`, and `@ts-expect-error`.
- Use `unknown` at unsafe boundaries and narrow it.
- Use shared API types rather than repeating shapes in pages.
- Treat MySQL DECIMAL values as `number | string` at the frontend boundary.

## Backend Standards

- Keep controller, service, and module responsibilities separate.
- Use services for SQL and business logic.
- Do not run destructive schema actions unless explicitly requested.
- Preserve current environment-driven database behavior.

## Frontend Standards

- Use the existing design language and Tailwind utilities.
- Use `lucide-react` for icons.
- Avoid adding global state or new libraries unless clearly required.
- Keep route and API error handling explicit enough for real user flows.
