# @ts-template/types

Shared TypeScript types and Zod schemas, used by both the API and web app (and by `@ts-template/db`).

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
  api.ts           ApiErrorResponse and other cross-cutting API shapes
  config.ts        Stage enum, shared config types
  schemas/         Request/response Zod schemas — add one file per resource
```

There's no `schemas/` example yet since the API only ships the `hello-world` route (query-validated inline, no
request body worth a shared schema). Add request/response contracts here as you add routes, so the API and web app
stay in sync on a single source of truth.

## Example

A schema is just a Zod object, exported alongside its inferred type so both the API and the web app can import the
type without re-deriving it:

```ts
// src/schemas/users.ts
export const CreateUserRequestSchema = z.object({
    name: z.string().trim().min(1).max(255),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
```

The API would import `CreateUserRequestSchema` to validate the request body (see [apps/api](../../apps/api)); the
web app gets the same shape for free through the Hono RPC client's inferred types (see [apps/web](../../apps/web)) —
one schema, no drift between the two.

I hand-roll these rather than generating them from the Drizzle schema with `drizzle-zod`. That's a deliberate
trade-off: it's more typing up front, and it means a DB column change won't automatically show up here, but I'd
rather write the exact validation I want (trimming, length caps, custom messages) than fight a generated schema.

## Docs

- [Zod docs](https://zod.dev)
