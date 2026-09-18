# @ts-template/db

Drizzle schema, migrations, seed data, and a typed Postgres client.

## Stack

- [Drizzle ORM](https://orm.drizzle.team) (`drizzle-orm/node-postgres`)
- [drizzle-kit](https://orm.drizzle.team/docs/kit-overview) — `generate`
- [pg](https://node-postgres.com) (`Pool`)
- [tsx](https://tsx.is) — runs the migrate/seed scripts

## Setup

```bash
cp .env.example .env
```

Requires Postgres running — from the repo root: `pnpm local:start` (or
`pnpm local:up`, which also runs `migrate` + `seed`).

## Commands

Generate a migration from schema changes in `src/schema`:

```bash
pnpm generate
```

Apply pending migrations, using `DATABASE_URL`:

```bash
pnpm migrate
```

Run `src/scripts/seed.ts` against `DATABASE_URL`:

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
  scripts/       migrate.ts, seed.ts, seed-data.ts
drizzle/          Generated SQL migrations + snapshots — commit these
```

All tables live in the `app` Postgres schema (`src/schema/primitives.ts`). The only migration so far
(`drizzle/0000_create_app_schema.sql`) just creates that schema — there are no tables yet. After adding a table in
`src/schema`, export it from `src/schema/index.ts`, run `pnpm generate`, and commit the resulting SQL file in
`drizzle/`.

## Example

Add tables as plain Drizzle definitions, built on top of the shared column helpers in `primitives.ts` so every table
gets the same id/timestamp conventions for free:

```ts
// src/schema/users.ts
export const users = appSchema.table('users', {
    id: id(),
    name: text('name').notNull(),
    createdAt: createdAt(),
});
```

`createDb` (in `src/index.ts`) wraps the schema in a Drizzle client backed by a `pg` pool. The API doesn't call it
directly — `apps/api/src/lib/init.ts` builds one client at startup and exposes it through `db()`, so the rest of
the app just does:

```ts
const [user] = await db().insert(schema.users).values({ name }).returning();
```

Since `schema.users` is the same object `drizzle-kit generate` reads to produce migrations, an insert like this only
type-checks if the shape matches whatever's actually been migrated — which is most of the "catch it at compile time"
value I mentioned in the root README.

## Docs

- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview)
- [drizzle-kit migrations](https://orm.drizzle.team/docs/migrations)
