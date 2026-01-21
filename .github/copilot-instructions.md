<!-- Copilot instructions for kodeme repo -->
# Copilot / AI Agent Instructions — kodeme

Purpose
- Short, actionable guidance for AI coding agents to be productive in this repository.

Big picture
- Frontend: `src/` — Vite + React application. Dev: `npm run dev` / `npm run dev:frontend`.
- Serverless API functions: `api/` — Typescript files compiled to `dist/api` for Vercel. Build: `npm run build:api` (uses `tsc -p tsconfig.api.json`). Dev serverless flow: `npm run dev:api` or `npm run dev:all` (watches API build + frontend + vercel dev).
- Backend (local/standalone): `backend/` — Express/OpenAPI helper used for generation and validation. See `backend/package.json` scripts (`openapi:generate`, `openapi:validate`, `dev`, `build`).
- OpenAPI: root-level `openapi.yaml`, `openapi.generated.yaml`, `openapi.merged.yaml`. Generation is performed by `backend/scripts/generate-openapi.js`.
- Firebase: `firebase.json`, `firestore.rules*`, and a service account JSON (`easyappointment-*.json`) are present — many server functions integrate with Firebase Admin SDK and Firestore.

Key commands (root)
- `npm run dev` — start frontend dev (Vite).
- `npm run dev:frontend` — frontend only.
- `npm run build:api` — compile `api/` into `dist/api` for Vercel.
- `npm run dev:api` — build API then run `vercel dev --cwd dist/api` for serverless emulation.
- `npm run dev:all` — concurrently watch API, frontend, and vercel dev (good for full-stack local dev).
- `npm run build` — full repo build (`tsc -b && vite build`).
- `npm run lint` — ESLint across repo.
- `npm run cy:open` / `npm run cy:run` — Cypress e2e tests under `cypress/e2e`.

Patterns & conventions
- TypeScript: repo uses multiple tsconfig targets: `tsconfig.api.json`, `tsconfig.app.json`, root `tsconfig.json`. When adding new API code, add under `api/` and ensure `tsconfig.api.json` picks it up.
- Serverless deployment: API sources are compiled to `dist/api` and served by Vercel (see `dev:api` and `dev:all`). Don't edit `dist/` — source belongs in `api/`.
- OpenAPI-first pieces: many API routes and docs are driven from `openapi.yaml` and generation scripts in `backend/`. If changing REST surface, check `openapi.yaml` and `backend/scripts/generate-openapi.js`.
- Auth / integrations: Google and Outlook integrations live under `api/auth/google/` and `api/auth/outlook/`. Calendar tokens helper: `api/_shared/calendarTokensApi.ts`.
- Tests: Cypress tests live in `cypress/e2e`. Use `npm run cy:open` for debugging or `npm run cy:run` in CI.

Important files to inspect for context
- [package.json](package.json) — root scripts & deps.
- [backend/package.json](backend/package.json) — backend tooling (openapi, dev server).
- [openapi.yaml](openapi.yaml) and [openapi.merged.yaml](openapi.merged.yaml) — API contract sources.
- [api/](api/) — serverless API source handlers.
- [src/](src/) — frontend React app.
- [firebase.json](firebase.json) and [firestore.rules](firestore.rules) — Firebase config and rules.
- [cypress/e2e](cypress/e2e) — end-to-end tests.

Quick examples for common tasks
- Run full local dev (frontend + API emulation):
```
npm run dev:all
```
- Add a new serverless route: create `api/new-route.ts`, update TypeScript types if needed, then `npm run build:api` and test via `npm run dev:api`.
- Regenerate OpenAPI artifacts (backend):
```
cd backend && npm run openapi:generate && npm run openapi:validate:merged
```

Notes & cautions
- Sensitive credentials: a service account JSON exists in repo (`easyappointment-*.json`). Treat as sensitive and do not commit new secrets. CI and local dev should use environment variables when possible.
- Two API styles present: serverless `api/` for Vercel and standalone Express in `backend/`. Modifying one doesn't automatically update the other — check OpenAPI and generation scripts.
- No unit test framework detected; primary automated tests are Cypress e2e.

When in doubt
- Inspect the scripts in `package.json` and `backend/package.json` before running new dev flows.
- For API changes, update `openapi.yaml` and run the generator (`backend/scripts/generate-openapi.js`) so the OpenAPI artifacts stay in sync.

If anything here is unclear or you want more examples (e.g., how to add a new OAuth client, or where to mock Firebase in tests), tell me which area to expand.
