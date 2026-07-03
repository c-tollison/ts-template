# ts-template

TypeScript monorepo starter: Hono API, React (Vite) frontend, Postgres via Drizzle ORM.

## Stack

| Layer | Tech |
| --- | --- |
| Package manager | [pnpm](https://pnpm.io) 11.9.0 (workspaces + catalog) |
| Runtime | [Node.js](https://nodejs.org) 24.12.0 |
| API | [Hono](https://hono.dev) 4 on `@hono/node-server` |
| Frontend | [React](https://react.dev) 19 + [Vite](https://vite.dev) 8 + [Tailwind CSS](https://tailwindcss.com) 4 |
| Database | [PostgreSQL](https://www.postgresql.org) 18 + [Drizzle ORM](https://orm.drizzle.team) |
| Validation | [Zod](https://zod.dev) |
| Lint/format | [Biome](https://biomejs.dev) 2 |
| Git hooks | [Husky](https://typicode.github.io/husky) + lint-staged |

## Layout

```
apps/
  api/       Hono HTTP server (@ts-template/api)
  ui/        React SPA (@ts-template/ui)
packages/
  db/        Drizzle schema, migrations, seed data (@ts-template/db)
  server/    Shared server middleware/logging (@ts-template/server)
  types/     Shared zod schemas & types (@ts-template/types)
```

Each package has its own README with package-specific commands.

## Prerequisites

- Node 24.12.0 (see `.tool-versions`, e.g. via [asdf](https://asdf-vm.com) or [mise](https://mise.jdx.dev))
- pnpm 11.9.0 (`corepack enable` or `npm i -g pnpm@11.9.0`)
- [Docker](https://www.docker.com) (for local Postgres)

## Setup

Install dependencies:

```bash
pnpm install
```

Copy env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/ui/.env.example apps/ui/.env.local
cp packages/db/.env.example packages/db/.env
```

Start Postgres and run migrations — see [packages/db](packages/db) for why there's no migration yet on a fresh clone:

```bash
pnpm local:up
```

Run the API and UI together:

```bash
pnpm dev
```

API: http://localhost:3001/api · UI: http://localhost:5173

## Root scripts

Run the api + ui dev servers concurrently:

```bash
pnpm dev
```

Build all packages, in dependency order:

```bash
pnpm build
```

Format + lint, writing fixes:

```bash
pnpm check
```

Format + lint check only, no writes (what CI runs):

```bash
pnpm check:ci
```

Start Postgres via Docker, then migrate and seed it:

```bash
pnpm local:up
```

Stop Postgres and remove its volume:

```bash
pnpm local:down
```

Reset the local DB (`local:down` + `local:up`):

```bash
pnpm local:reset
```

Generate a Drizzle migration from schema changes:

```bash
pnpm db:generate
```

Apply pending Drizzle migrations:

```bash
pnpm db:migrate
```

Scaffold a new project from this template (`scripts/copy-project.mjs`):

```bash
pnpm copy
```

## CI

`.github/workflows/pr.yml` runs on pull requests. Pre-commit hooks (Husky + lint-staged) run Biome on staged files.
