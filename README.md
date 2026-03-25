# LLM Medical Assistance (monorepo)

Educational medical-assistance stack with a **Next.js** web UI (triage-focused, clinician mode) and an **Express** API backed by Prisma (SQLite by default) and optional RAG source index.

This repository is an **npm workspace** monorepo.

## Repository layout

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 14 frontend (`/`, `/eval`), Tailwind, futuristic medical UI |
| `apps/api` | Express API: chat, intake, eval, auth, conversations, health |
| `packages/shared` | Shared TypeScript types and utilities (`@medical/shared`) |

## Prerequisites

- **Node.js** 20+ (recommended)
- **npm** 9+ (workspaces)

## Quick start

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Build the shared package

Apps depend on `@medical/shared` via `dist/`. After clone or dependency changes:

```bash
npm run -w @medical/shared build
```

### 3. Configure the API

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` as needed. Defaults:

- **PORT**: `3001`
- **DATABASE_URL**: SQLite `file:./dev.db` (relative to `apps/api` when Prisma runs)
- **LLM_PROVIDER**: `mock` for local development
- **SOURCE_INDEX_PATH**: path to local RAG index JSON (see `.env.example`)

### 4. Database (Prisma)

From the repo root (or `cd apps/api` and use `npx`):

```bash
cd apps/api
npx prisma migrate deploy
# or during development:
npx prisma migrate dev
```

### 5. Run API and web (two terminals)

**Terminal A — API**

```bash
npm run -w apps/api dev
```

**Terminal B — Web**

```bash
npm run -w apps/web dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)

The web app calls the API at `http://localhost:3001` unless you set **`NEXT_PUBLIC_API_URL`** (e.g. in `apps/web/.env.local`).

### Root scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Intended to run API and web together (uses shell `&`; on Windows you may prefer two terminals as above) |
| `npm run build` | Builds API then web |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run lint` | Lint API and web |
| `npm run test` | Runs API tests (`vitest`) |
| `npm run prisma` | Proxies Prisma CLI for `apps/api` |

## Web app

- **Home (`/`)**: Triage intake (consumer/clinician mode), chat-style flow, triage banner, emergency instructions, education, evidence cards, clinician chart-note tabs when applicable.
- **Eval (`/eval`)**: Run evaluation suite against the API.

### Optional: end-to-end smoke tests

```bash
cd apps/web
npx playwright install chromium
npm run test:e2e
```

Playwright can start the dev server automatically if `playwright.config.ts` defines `webServer`.

## API overview

Mounted under Express with CORS and JSON body parsing:

- **Health**: see `apps/api/src/routes/health.ts`
- **`/api/chat`**: main chat / triage response
- **`/api/eval`** (and related): evaluation routes
- Other routers: intake, conversations, auth (see `apps/api/src/server.ts`)

Full request/response shapes align with types in `@medical/shared` and the web client types in `apps/web/app/page.tsx`.

## Production notes

- Run `npm run build` from the root, then start API and web with their `start` scripts.
- Set `NODE_ENV=production` and secure secrets (`PHI_ENC_KEY`, database URL, JWT secrets if used) via environment variables — do not commit real `.env` files.

## License

See `package.json` (`license` field).
