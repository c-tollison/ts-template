# @ts-template/api

The Hono API, running on Node.js via `@hono/node-server`.

## Scripts

```bash
# Run the API dev server plus tsc --watch (via concurrently)
pnpm dev

# Run the API dev server only (tsx watch)
pnpm dev:server

# Run tsc --watch only
pnpm dev:types

# Build for production
pnpm build

# Run the built server
pnpm start
```

## Config

`.env` holds secrets and per-machine overrides. Copy `.env.example` to `.env`
to get started. `config/config.toml` holds the per-stage, non-secret
settings and is checked into the repo.

## Docker

Build from the repo root so workspace packages are in context. Local
Postgres must be up (`pnpm local:start`); the container reaches it as
`ts-template-db:5432` on the `ts-template_default` network.

```bash
# Build
docker build -f apps/api/Dockerfile -t ts-template-api .

# Apply migrations from the image
docker run --rm --network ts-template_default \
  -e DATABASE_URL=postgres://ts_template:ts_template@ts-template-db:5432/ts_template \
  ts-template-api node node_modules/@ts-template/db/dist/scripts/migrate.js

# Run the API, then hit it from a sibling container (no ports are published)
docker run -d --name ts-template-api-test --network ts-template_default \
  -e STAGE=deployed -e DATABASE_URL=postgres://ts_template:ts_template@ts-template-db:5432/ts_template ts-template-api
docker run --rm --network ts-template_default ts-template-api \
  node -e "fetch('http://ts-template-api-test:3001/api/health').then(r=>r.text()).then(console.log)"

# Clean up
docker rm -f ts-template-api-test
```
