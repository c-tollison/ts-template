# @ts-template/api

Hono HTTP API server, built on `@hono/node-server`.

## Stack

- [Hono](https://hono.dev) 4 — router/middleware
- [@ts-template/server](../../packages/server) — shared logging, error handling, graceful shutdown, schema validation
- [@ts-template/db](../../packages/db) — Drizzle client
- [@ts-template/types](../../packages/types) — shared zod schemas
- Config: `toml` (`config/config.toml`, one table per stage) + `zod` for env validation
- [tsx](https://tsx.is) — dev-time TS execution/watch
- TypeScript, `tsc --watch` for type checking in dev

## Setup

```bash
cp .env.example .env
```

Requires Postgres running (see [packages/db](../../packages/db) or `pnpm local:up` from repo root).

## Commands

Run server (watch) + type-check (watch) concurrently:

```bash
pnpm dev
```

Run only the server in watch mode:

```bash
pnpm dev:server
```

Run only the type-check watcher:

```bash
pnpm dev:types
```

Compile to `dist/`:

```bash
pnpm build
```

Run the compiled server — requires `pnpm build` first:

```bash
pnpm start
```

## Config

Env vars (`.env`, see `.env.example`): `STAGE`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_MAX_CONNECTIONS`.

Per-stage server/CORS settings live in `config/config.toml`, keyed by `STAGE` (`local` / `dev` / `prod`).

## Routes

Mounted under `/api`:

- `GET /api/health`
- `POST /api/users`

## Docs

- [Hono docs](https://hono.dev/docs)
- [Hono Node.js adapter](https://hono.dev/docs/getting-started/nodejs)
