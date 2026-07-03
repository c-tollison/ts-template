# @ts-template/server

Shared server utilities for any Hono-based API app: logging, error handling, request validation, and graceful shutdown.

## Stack

- [Hono](https://hono.dev) 4 — middleware types
- [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator) — schema validation
- [Pino](https://getpino.io) 10 (+ `pino-pretty` in dev) — logging
- [Zod](https://zod.dev)

## Commands

Compile to `dist/`:

```bash
pnpm build
```

No `dev`/`start` — this package has no runtime entrypoint of its own; it's consumed by `@ts-template/api`, which type-checks it live in dev via the `development` export condition.

## Layout

```
src/
  logger.ts                       Pino logger factory
  shutdown.ts                     registerGracefulShutdown() — SIGTERM/SIGINT handling
  middleware/
    error-handler.ts              createErrorHandler()
    logging.ts                    createRequestLoggerMiddleware()
    schema-validator.ts           schemaValidator() — zod-backed request validation
```

## Docs

- [Pino docs](https://getpino.io/#/docs/api)
- [Hono middleware guide](https://hono.dev/docs/guides/middleware)
