# @ts-template/db

Drizzle schema, migrations, seed data, and a typed Postgres client.

## Stack

- [Drizzle ORM](https://orm.drizzle.team) 0.45 (`drizzle-orm/node-postgres`)
- [drizzle-kit](https://orm.drizzle.team/docs/kit-overview) 0.31 — `generate` / `migrate`
- [pg](https://node-postgres.com) 8 (`Pool`)
- [tsx](https://tsx.is) — runs the seed script

## Setup

```bash
cp .env.example .env
```

Requires Postgres running — from the repo root: `docker compose up -d` (or `pnpm local:up`, which also runs `migrate` + `seed`).

## No migration yet — this is intentional

`drizzle/` ships empty on purpose: there's no baseline migration for the `users` table. The `app` Postgres schema itself (plus roles/grants) is created separately by `scripts/init-db.sql`, which is treated as one-time infra setup, not a Drizzle migration.

To create the first migration:

```bash
pnpm generate
```

Then open the generated SQL file in `drizzle/` and remove the `CREATE SCHEMA "app";` line — that schema already exists (from `init-db.sql`), so leaving it in will fail on `pnpm migrate` with `schema "app" already exists`. Commit the edited file.

## Commands

Generate a migration from schema changes in `src/schema`:

```bash
pnpm generate
```

Apply pending migrations (uses `DATABASE_URL_ADMIN`):

```bash
pnpm migrate
```

Run `src/scripts/seed.ts` against `DATABASE_URL` / `DATABASE_URL_ADMIN`:

```bash
pnpm seed
```

Compile to `dist/`:

```bash
pnpm build
```

## Layout

```
src/
  schema/        Drizzle table definitions (source of truth)
  drizzle.config.ts
  scripts/       seed.ts, seed-data.ts
drizzle/          Generated SQL migrations + snapshots — commit these
scripts/
  init-db.sql     One-time local DB bootstrap: schemas, roles, grants (mounted into the Docker container)
```

All tables live in the `app` Postgres schema (created by `init-db.sql`, not by a migration). Migrations run as `ts_template_admin`; the app connects as the lower-privileged `ts_template_app` role — see `DATABASE_URL_ADMIN` vs `DATABASE_URL` in `.env.example`.

After changing a table in `src/schema`, run `pnpm generate` and commit the resulting SQL file in `drizzle/`.

## Docs

- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview)
- [drizzle-kit migrations](https://orm.drizzle.team/docs/migrations)
