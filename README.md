# ts-template

TypeScript monorepo starter: Hono API, Vue (Vite) frontend, Postgres via Drizzle ORM, and a deploy pipeline that ships
straight to a VPS. I created this template because every new project I start ends up needing the same setup. I find
other templates lacking or they try to lock you into a provider. I prefer this kind of full-stack type safety — it
lets me build with some peace of mind and cuts down on bugs compared to my previous setups. I've kept it deliberately
minimal: there's no database table yet, just a `hello-world` route wired end to end (Hono route → Zod query
validation → Hono RPC client → Vue), so you can see how the pieces connect before adding your own.

I'd recommend using pnpm for this project. It has tooling that makes this monorepo work nicely. For example, the
catalog, which lets you pin dependency versions globally. That matters a lot for Hono and Zod, since they drive the
full-stack type safety and differing versions between packages could bite you. pnpm also has some default safety
mechanisms, like a minimum package age, which help in the age of AI-assisted coding. It feels like there's a new
vulnerability every few weeks.

I've had a lot of luck using this stack with AI agents. Having the agent run checks and builds from the root gives it
fast feedback on type safety. I've found many AI agents lean on type casting as a cheap way to skirt doing things
properly, so keep an eye out for that.

Each package README goes into a bit more depth, but here's the pattern to follow when you add your first real
feature — say, a `users` table:

1. **Define the DB schema** in `packages/db` (there's nothing there yet but a couple of shared column helpers in
   `src/schema/primitives.ts`).

    ```ts
    // packages/db/src/schema/users.ts
    export const users = appSchema.table('users', {
        id: id(),
        name: text('name').notNull(),
        createdAt: createdAt(),
    });
    ```

   Then export it from `src/schema/index.ts` and run `pnpm db:generate` to produce the migration.

2. **Write a Zod schema** in `packages/types` for each request you accept (I prefer hand-rolling these rather than
   generating them).

    ```ts
    // packages/types/src/schemas/users.ts
    export const CreateUserRequestSchema = z.object({
        name: z.string().trim().min(1).max(255),
    });

    export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
    ```

3. **Create an API route** that validates the request against that schema via middleware, then hands the parsed body
   straight to Drizzle.

    ```ts
    // apps/api/src/routes/users.ts
    const users = new Hono().post(
        '/',
        schemaValidator('json', CreateUserRequestSchema),
        async (c) => {
            const { name } = c.req.valid('json');

            const [user] = await db()
                .insert(schema.users)
                .values({ name })
                .returning();

            return c.json(user, 201);
        }
    );
    ```

   Because `name` is already validated, TypeScript will complain if it doesn't match what `schema.users` expects.
   Mount it in `apps/api/src/app.ts` the same way `hello-world` is mounted.

4. **Call it from the frontend** using the Hono RPC client, which types the request and response from the route
   definition itself — see `apps/web/src/lib/api.ts` and `App.vue` for how `hello-world` is called today.

    ```ts
    // apps/web/src/App.vue
    const api = useApiClient();
    const res = await api.users.$post({ json: { name: name.value } });
    if (res.ok) created.value = await res.json();
    ```

All of this together catches a surprising number of type errors, and it's saved me a lot of debugging.
There is one small caveat: since I prefer hand-rolled Zod schemas, if the DB schema changes but
the corresponding Zod schema doesn't, it's possible to miss the drift (though the API route itself should still
error if the request body doesn't match what Drizzle expects). You can avoid this by generating your Zod
schemas from the DB schema with `drizzle-zod`, and regenerating them every time you run a migration. I chose not to
do that by default because I find it overly verbose for most of my needs.

I'll keep updating this template with common utilities and changes as I find the need for them.

Some things I plan to add eventually:
- auth middleware that's provider-agnostic
- pagination helpers
- webhook templates that work well with local testing (ngrok)
- SQL transaction wrapper utilities

I hope this template works well for your needs. Feel free to open a GitHub issue or submit a pull request if you
think something could be done better.

## Stack

| Layer | Tech |
| --- | --- |
| Package manager | [pnpm](https://pnpm.io) (workspaces + catalog) |
| Runtime | [Node.js](https://nodejs.org) 24 |
| API | [Hono](https://hono.dev) 4 on `@hono/node-server` |
| Frontend | [Vue](https://vuejs.org) 3 + [Vite](https://vite.dev) + [Tailwind CSS](https://tailwindcss.com) 4 + [shadcn-vue](https://shadcn-vue.com) |
| Database | [PostgreSQL](https://www.postgresql.org) + [Drizzle ORM](https://orm.drizzle.team) |
| Validation | [Zod](https://zod.dev) |
| Lint/format | [Biome](https://biomejs.dev) 2 (everything) + [Prettier](https://prettier.io) (`.vue` only — Biome can't format Vue SFCs) |
| Git hooks | [Husky](https://typicode.github.io/husky) + lint-staged |
| Deploy | Docker images pushed to GHCR, shipped to a VPS provisioned with [vps-infra](https://github.com/c-tollison/vps-infra) |

## Layout

```
apps/
  api/       Hono HTTP server (@ts-template/api)
  web/       Vue SPA (@ts-template/web)
packages/
  db/        Drizzle schema, migrations, seed data (@ts-template/db) — ships with just the "app" schema, no tables
  types/     Shared zod schemas & types (@ts-template/types)
```

Each package has its own README with package-specific commands. There's no separate server package — request logging,
error handling, config loading, and graceful shutdown live directly in `apps/api/src/lib` and
`apps/api/src/middleware`, since only the API needs them.

## Prerequisites

- Node 24 (see `.tool-versions`, e.g. via [asdf](https://asdf-vm.com) or [mise](https://mise.jdx.dev))
- pnpm (`corepack enable`, or `npm i -g pnpm` — version pinned in `package.json`)
- [Docker](https://www.docker.com) (for local Postgres)

## Setup

Install dependencies:

```bash
pnpm install
```

Copy env files:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
```

Start Postgres, then migrate and seed it:

```bash
pnpm local:up
```

Run the API and web app together:

```bash
pnpm dev
```

API: http://localhost:3001/api · Web: http://localhost:5173

## Root scripts

Run the api + web dev servers concurrently (starts Postgres first):

```bash
pnpm dev
```

Build all packages, in dependency order:

```bash
pnpm build
```

Format + lint, writing fixes (Biome for everything, Prettier for `.vue`):

```bash
pnpm check
```

Format + lint check only, no writes (what CI runs):

```bash
pnpm check:ci
```

Start local Postgres only:

```bash
pnpm local:start
```

Start Postgres, then migrate and seed it:

```bash
pnpm local:up
```

Stop Postgres:

```bash
pnpm local:down
```

Stop, wipe the database volume, and start fresh:

```bash
pnpm local:reset
```

Generate a Drizzle migration from schema changes:

```bash
pnpm db:generate
```

Apply pending Drizzle migrations / run the seed script:

```bash
pnpm db:migrate
pnpm db:seed
```

Add one or more shadcn-vue components to the web app:

```bash
pnpm add-component button
pnpm add-component button card dialog
```

Scaffold a new project from this template (`scripts/copy-project.mjs`):

```bash
pnpm copy [project_name] [location]
```

## CI

`.github/workflows/pr.yml` runs on pull requests (check + build). Pre-commit hooks (Husky + lint-staged) run Biome
and Prettier on staged files.

## Deployment

Runs on a VPS set up with [vps-infra](https://github.com/c-tollison/vps-infra), which provides the shared `vps` and
`db` Docker networks, Traefik with automatic HTTPS, a single Postgres server, and the deploy script. Once set up,
every push to `main` runs `.github/workflows/deploy.yml`: lint and build, build both images for amd64, push them to
GitHub Container Registry tagged `latest` and `sha-<commit>`, then SSH into the VPS with the tag.

**The `push` trigger in `deploy.yml` is commented out by default.** This is a template — there's no VPS or GHCR
secrets configured yet, so leaving it enabled would just mean every push to `main` fails the workflow. Once you've
done the one-time setup below, uncomment the `push: branches: [main]` block at the top of the file.

The SSH key the workflow uses is bound to a forced command on the VPS, so the only thing it can do is hand
vps-infra's `deploy.sh` a tag. It cannot run other commands, copy files, or read the `.env`. The VPS holds no source
and builds nothing. It has one directory:

```
~/ts-template/
  docker-compose.yml   # copied by hand, from this repo
  .env                 # written once by hand, never leaves the box
```

### One-time setup

1. **Database.** On the VPS, in `vps-infra`: `scripts/create-db.sh ts-template`. Keep the URL it prints.
2. **Env file.** On the VPS: `mkdir ~/ts-template`, then write `~/ts-template/.env` from `.env.example` with
   `STAGE=deployed`, `DATABASE_URL=` set to that URL, and `IMAGE_TAG=` left empty. `chmod 600 ~/ts-template/.env`.
3. **Compose file.** Copy `docker-compose.yml` from this repo to `~/ts-template/`. Do this again whenever it
   changes; the workflow does not deliver it.
4. **Deploy key.** On your laptop:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/ts-template-deploy -C github-actions-ts-template -N ""
   cat ~/.ssh/ts-template-deploy.pub
   ssh-keyscan -p <port> -H <host>
   ```
   On the VPS, append one line to `~/.ssh/authorized_keys`, with the public key from `cat` above and the absolute
   path of your `vps-infra` checkout:
   ```
   restrict,command="/home/<user>/vps-infra/scripts/deploy.sh ts-template" ssh-ed25519 AAAA... github-actions-ts-template
   ```
   Verify from your laptop. The first must be refused, the second deploys whatever tag you name:
   ```bash
   ssh -i ~/.ssh/ts-template-deploy -o IdentitiesOnly=yes -p <port> <user>@<host> 'docker ps'
   ssh -i ~/.ssh/ts-template-deploy -o IdentitiesOnly=yes -p <port> <user>@<host> sha-<short sha>
   ```
5. **Secrets.** Repo Settings, Secrets and variables, Actions:

   | Secret            | Value                                                              |
   | ----------------- | ------------------------------------------------------------------|
   | `VPS_HOST`        | host or IP                                                         |
   | `VPS_PORT`        | ssh port                                                           |
   | `VPS_USER`        | ssh user in the `docker` group                                     |
   | `VPS_SSH_KEY`     | contents of `~/.ssh/ts-template-deploy`, including BEGIN/END lines |
   | `VPS_KNOWN_HOSTS` | full output of the `ssh-keyscan` command                           |

6. **Push to `main`.** Watch the run under Actions. The deploy job ends with `docker compose ps`; api and web
   should be healthy and migrate exited 0. Then `curl https://ts-template.coji-dev.com/api/health`.

If the deploy job fails it is almost always a secret. Fix it and use "Re-run failed jobs"; no new push needed.

### Day to day

- **Deploy:** push to `main`.
- **Logs:** on the VPS, `cd ~/ts-template && docker compose logs -f api`.
- **Roll back:** on the VPS, set `IMAGE_TAG` in `~/ts-template/.env` to an older `sha-<commit>` and
  `docker compose up -d`. The next push to `main` moves it forward again.
- **Compose changes:** copy the new `docker-compose.yml` to the VPS by hand and `docker compose up -d`.
- **Migrations:** the `migrate` service runs `drizzle` SQL from `packages/db/drizzle` before the API starts, on
  every deploy. It is a no-op when nothing is new.

### Dependencies

Dependabot alerts are on in repo settings, so a dependency with a known vulnerability sends an email. Updates are
done by hand; there is no `dependabot.yml`. `pnpm-workspace.yaml` sets `minimumReleaseAge` so a package version has
to be at least a few days old before it can be installed.
