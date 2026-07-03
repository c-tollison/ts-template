# @ts-template/ui

React SPA, built with Vite.

## Stack

- [React](https://react.dev) 19
- [Vite](https://vite.dev) 8 (`@vitejs/plugin-react-swc`)
- [React Router](https://reactrouter.com) 8
- [TanStack Query](https://tanstack.com/query) 5 — server state
- [Tailwind CSS](https://tailwindcss.com) 4 (`@tailwindcss/vite`) + `clsx` / `tailwind-merge`
- [Zod](https://zod.dev) — shares schemas from `@ts-template/types`
- `@ts-template/api` — imports the API's Hono type for an end-to-end typed client (`src/lib/api.ts`)

## Setup

```bash
cp .env.example .env.local
```

Requires the API running (see [apps/api](../api)).

## Commands

Start the Vite dev server (opens browser):

```bash
pnpm dev
```

Type-check and build for production, output to `dist/`:

```bash
pnpm build
```

Type-check only, no emit:

```bash
pnpm typecheck
```

Serve the production build locally:

```bash
pnpm preview
```

## Config

Env vars (`.env.local`, see `.env.example`): `VITE_API_URL`.

## Docs

- [Vite docs](https://vite.dev/guide)
- [React Router docs](https://reactrouter.com/en/main)
- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
