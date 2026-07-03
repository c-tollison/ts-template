# @ts-template/types

Shared TypeScript types and Zod schemas, used by both the API and UI (and by `@ts-template/db`).

## Stack

- [Zod](https://zod.dev) 4 — schemas double as runtime validators and static types (`z.infer`)

## Commands

Compile to `dist/`:

```bash
pnpm build
```

No `dev`/`start` — this package has no runtime entrypoint of its own; consumers type-check it live via the `development` export condition.

## Layout

```
src/
  config.ts        Stage enum, shared config types
  schemas/
    users.ts        e.g. CreateUserRequestSchema
```

Add new request/response contracts here so the API and UI stay in sync on a single source of truth.

## Docs

- [Zod docs](https://zod.dev)
