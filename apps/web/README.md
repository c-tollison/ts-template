# @ts-template/web

The Vue 3 + Vite frontend.

## Scripts

```bash
# Start the Vite dev server
pnpm dev

# Type-check and build for production
pnpm build

# Type-check only
pnpm typecheck
```

## Docker

Build from the repo root. `VITE_API_URL` is baked into the bundle at build
time and is required. Serves on port 8080 via `nginx.conf` (SPA fallback,
asset caching) on the unprivileged nginx image.

```bash
# Build
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://ts-template.coji-dev.com -t ts-template-web .

# Run, then fetch a deep path from a sibling container (should return index.html)
docker run -d --name ts-template-web-test --network ts-template_default ts-template-web
docker run --rm --network ts-template_default ts-template-api \
  node -e "fetch('http://ts-template-web-test:8080/some/route').then(r=>r.text()).then(console.log)"

# Clean up
docker rm -f ts-template-web-test
```

## Adding shadcn-vue components

From the repo root: `pnpm add-component <name...>` (wraps the shadcn-vue CLI,
see the root README). Components land in
`src/components/shadcn-components/`.
