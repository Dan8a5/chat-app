# Contributing

Practical reference for working on this project. Written so you can pick it back up after months away.

---

## Stack

- **Astro** (SSR, `output: 'server'`, `@astrojs/node` standalone adapter)
- **Drizzle ORM + PostgreSQL** (`pg` driver)
- **Tailwind v4** (class-based dark mode)
- **Real-time**: native `EventSource` (SSE) + `fetch()` — no htmx, no Alpine
- **Deployed on Railway**, auto-deploys on merge to `main`

---

## Local setup

### Requirements

- Node >= 22.12.0
- A PostgreSQL database (local or the Railway public proxy URL)

### Env vars

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/chatapp
```

For local dev pointing at Railway's database, use the **public proxy URL** from Railway:
Railway → PostgreSQL service → Variables → `DATABASE_PUBLIC_URL`

### Run locally

```bash
npm install
npm run dev        # dev server at http://localhost:4321
```

### Other useful scripts

```bash
npm run build      # production build → ./dist
npm run start      # run the production build locally
npm run seed       # seed the database with sample data
```

---

## Database / migrations

Schema lives in `src/lib/db/schema.ts`. Migration files live in `drizzle/`.

### Workflow for schema changes

1. Edit `src/lib/db/schema.ts`
2. Generate a migration file:
   ```bash
   npm run db:generate
   ```
3. Commit the new file in `drizzle/` along with your schema change
4. On the next Railway deploy, `drizzle-kit migrate` runs automatically before the server starts (see Railway start command below)

### Never use `db:push` in production

`npm run db:push` directly syncs the schema without migration files — fine for early prototyping locally, but don't run it against the production database. Always use `db:generate` + `db:migrate`.

### Apply migrations locally

```bash
npm run db:migrate
```

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production. Protected — no direct pushes. |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Deps, config, tooling |

Branch off `main`, always:

```bash
git checkout main && git pull
git checkout -b feature/my-thing
```

---

## PR workflow

```bash
# 1. Push your branch
git push -u origin feature/my-thing

# 2. Open a PR
gh pr create --title "Short description" --body "What and why"

# 3. CI runs automatically (GitHub Actions)
#    Must pass before you can merge

# 4. Merge (squash optional, we use --merge here)
gh pr merge <number> --merge --delete-branch
```

### CI checks (`Type Check & Build`)

Defined in `.github/workflows/ci.yml`. Runs on every PR to `main`:

1. `npm ci` — clean install
2. `npm run build` — full Astro production build (requires `DATABASE_URL` secret in GitHub Actions)

The `DATABASE_URL` secret in GitHub Actions must be the **public proxy URL** (`DATABASE_PUBLIC_URL` from Railway), not the internal `postgres.railway.internal` URL — GitHub's servers can't reach Railway's private network.

If CI fails, fix it on your branch and push again. The PR will re-run automatically.

---

## Railway deployment

Merging to `main` triggers an automatic Railway redeploy:

1. Railway detects the push to `main`
2. Runs `npm run build` (Astro build → `./dist`)
3. Runs the start command: `npm run db:migrate && node ./dist/server/entry.mjs`
   - Migrations run first on every deploy — safe to run repeatedly, only applies pending ones
   - Then the Node server starts

### Two DATABASE_URL values in Railway

| Variable | Used by |
|----------|---------|
| `DATABASE_URL` | The chat-app service on Railway (internal network, fast) |
| `DATABASE_PUBLIC_URL` | GitHub Actions CI, local dev pointing at Railway DB |

Set the chat-app service's `DATABASE_URL` to the **internal** URL (`postgres.railway.internal`) for Railway-to-Railway communication. Use the public proxy URL everywhere outside Railway.

---

## Gotchas

### Alpine.js and htmx do not work in Railway production builds

Alpine and htmx were loaded from the `public/` directory via `<script src="..." defer is:inline>`. This pattern silently fails in the Railway production build — the scripts never execute. All Alpine directives (`x-data`, `x-show`, `@click`, etc.) and htmx attributes (`hx-post`, `hx-swap`, `sse-connect`, etc.) were replaced with:

- Plain JS functions with `id` attributes and `style.display`
- Native `EventSource` for SSE (real-time messages)
- Native `fetch()` for form submissions
- `IntersectionObserver` for infinite scroll / load-more

**Do not re-introduce Alpine or htmx** unless you verify they load correctly in a Railway production build first.

### Dark mode flash

Dark mode is applied by an inline `<script>` in `<head>` that reads `localStorage` and adds the `dark` class to `document.documentElement` immediately. This must stay in `<head>`, not deferred, or you get a white flash on page load in dark mode.

### `npx tsc --noEmit` does not work in CI

`npx tsc` downloads a fake stub package. TypeScript is a transitive dependency of Astro but its binary isn't directly exposed. The build step catches type errors anyway — there is no separate type-check step in CI.
