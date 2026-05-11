# AkibaCore Project Structure

AkibaCore is a two-app workspace. The current folder names are kept to avoid unnecessary churn in Docker, TypeScript, and deployment paths.

```text
akibacore/
  .cursor/rules/                 Cursor project rules for AI assistants
  docs/                          Project documentation
  shopanime_be/                  NestJS backend application
    src/                         Backend modules, controllers, services, DB code
    .env.example                 Backend environment template
    .dockerignore                Backend Docker build exclusions
    main.ts                      Backend bootstrap
    API_DOCS.md                  Backend endpoint documentation
    database_schema.md           Database documentation
    Dockerfile                   Backend container
    package.json                 Backend package metadata
    tsconfig.json                Backend TypeScript config
  shopanime_fe/                  Next.js + React frontend application
    src/                         Frontend application source
      app/                       Next.js app entry and client shell
      components/                Reusable UI/layout components
      lib/                       API client, shared types, formatting helpers
      views/                     Route-level view components used by the client router
    .env.example                 Frontend environment template
    .dockerignore                Frontend Docker build exclusions
    next.config.mjs              Next.js build/runtime config
    postcss.config.mjs           Tailwind/PostCSS config
    Dockerfile                   Frontend container
    package.json                 Frontend package metadata
  docker-compose.yml             Local fullstack infrastructure
  package.json                   Optional root orchestration scripts
```

## Frontend Entry

Next.js treats `shopanime_fe/src/app/layout.tsx` and `shopanime_fe/src/app/[[...slug]]/page.tsx` as the browser entry. The catch-all page mounts the existing client-side React Router app so deep links such as `/profile`, `/product/1`, and `/admin/products` work after refresh.

## Ownership Rules

- Backend runtime logic belongs in `shopanime_be/src`.
- Frontend runtime logic belongs in `shopanime_fe/src`.
- Shared frontend API contracts belong in `shopanime_fe/src/lib/types.ts`.
- Backend env belongs in `shopanime_be/.env`.
- Frontend env belongs in `shopanime_fe/.env`.
- Environment documentation belongs in `docs/ENVIRONMENT.md`.
- AI/coding-agent behavior belongs in `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules`.

## Verification by Area

```bash
npm run backend:build
npm --prefix shopanime_be run build
npm --prefix shopanime_fe run typecheck
npm --prefix shopanime_fe run build
npm run lint
npm run build
```
