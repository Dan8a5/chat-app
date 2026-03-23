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
ADMIN_PASSWORD=your-admin-password
ADMIN_TOKEN=random-secret-string
```

For local dev pointing at Railway's database, use the **public proxy URL** from Railway:
Railway → PostgreSQL service → Variables → `DATABASE_PUBLIC_URL`

`ADMIN_PASSWORD` is the password used to log into `/admin`. `ADMIN_TOKEN` is the value stored in the `admin_session` cookie — it must be set to the same value in both local `.env` and Railway service variables.

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
2. Sync locally with:
   ```bash
   npm run db:push
   ```
3. For production, manually run the equivalent SQL in Railway → PostgreSQL → Query tab (see gotcha below)

### Adding tables to production

Do **not** rely on `db:migrate` running on Railway — it causes a deadlock loop (see Gotchas). Instead, manually run the `CREATE TABLE` SQL in the Railway PostgreSQL query tool after deploying the code.

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
3. Runs the start command: `node ./dist/server/entry.mjs`
   - **Do not prepend `npm run db:migrate &&`** — see Gotchas for why this causes an infinite deploy loop

### Two DATABASE_URL values in Railway

| Variable | Used by |
|----------|---------|
| `DATABASE_URL` | The chat-app service on Railway (internal network, fast) |
| `DATABASE_PUBLIC_URL` | GitHub Actions CI, local dev pointing at Railway DB |

Set the chat-app service's `DATABASE_URL` to the **internal** URL (`postgres.railway.internal`) for Railway-to-Railway communication. Use the public proxy URL everywhere outside Railway.

---

## Features

### Admin panel (`/admin`)

Password-protected dashboard for moderation. Requires `ADMIN_PASSWORD` and `ADMIN_TOKEN` env vars.

- **Login**: `POST /api/admin/login` — checks `ADMIN_PASSWORD`, sets `admin_session` cookie (value = `ADMIN_TOKEN`, httpOnly, 8hr TTL)
- **Dashboard** (`/admin/dashboard`): stats, room list with delete, user profile list with ban/unban, banned users list
- **Room detail** (`/admin/rooms/[slug]`): last 200 messages with per-message delete and per-user ban
- **Ban flow**: inserts into `banned_nicknames`, emits SSE `kicked` event to all room connections — the banned user's client immediately redirects to `/`
- All `/admin/*` and `/api/admin/*` routes (except the login page and login API) are guarded by middleware checking the `admin_session` cookie

### User profiles

Every user who sends a message gets a profile record in `user_profiles` (`nickname` PK, `bio`, `message_count`, `created_at`).

- Message count increments atomically on every `POST /api/rooms/[slug]/messages`
- Clicking any avatar or username in chat opens a profile card modal
- Users can set a bio (max 200 chars) via `POST /api/profile` — only their own profile
- `GET /api/profile/[nick]` returns profile JSON publicly

---

## Security

### Auth pattern

Every mutating or sensitive API route checks for the `nickname` cookie before doing anything:

```typescript
const nick = cookies.get('nickname')?.value;
if (!nick) return new Response('Unauthorized', { status: 401 });
```

Routes that require this check:
- `POST /api/rooms` — create room
- `DELETE /api/rooms/[slug]` — delete room
- `GET /api/rooms/[slug]/messages` — load messages (pagination)
- `POST /api/rooms/[slug]/messages` — send message (also rate-limited)
- `POST /api/signout` — clear session

The `nickname` cookie is set with `httpOnly: true, secure: true, sameSite: lax`. It cannot be read by client JS. The chat room page injects the nick into `window.__CHAT_NICK__` via a server-side `define:vars` script so the client has access without touching `document.cookie`.

### Rate limiting

Enforced in `src/middleware.ts` before handlers run, using in-memory sliding-window buckets (`src/lib/ratelimit.ts`):

| Action | Limit | Window | Key |
|--------|-------|--------|-----|
| Send message | 10 requests | 10 seconds | nickname |
| Create room | 5 requests | 1 hour | IP (`x-forwarded-for`) |

Returns `429 Too Many Requests` when exceeded. Buckets reset after the window expires. Note: state is in-memory — resets on server restart. Acceptable for a single-instance Railway deploy.

### CSRF protection

Astro's `checkOrigin` is **disabled** (`security: { checkOrigin: false }` in `astro.config.mjs`). Railway's reverse proxy rewrites the internal host, so `request.url` inside Node never matches the `Origin` header the browser sends — Astro's check rejects valid same-origin `fetch()` calls with 403.

CSRF protection is instead provided by the `sameSite: lax` cookie setting. Cross-site POST requests won't carry the `nickname` cookie, so all protected endpoints return 401 before doing any work.

All form submissions use `fetch()` instead of native HTML `<form method="POST">` — this is required for the same Railway proxy reason (native form POSTs were also rejected).

### Database connection

The production DB uses Railway's **internal private network**:

```
postgresql://postgres:<password>@postgres.railway.internal:5432/railway
```

No SSL configuration is needed — internal Railway connections are trusted. The `pg` pool is created with just `{ connectionString: process.env.DATABASE_URL }`.

For GitHub Actions CI and local dev, use `DATABASE_PUBLIC_URL` (the external proxy). See the Railway deployment section for details.

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

### `db:migrate` causes an infinite deploy loop on Railway

`drizzle-kit migrate` acquires a migration lock in the database. Railway's health check kills the container if no port is open within a timeout (migrations don't open a port). When killed mid-migration, the lock is not released — the next restart hangs waiting for the lock indefinitely. Railway kills it again. Infinite loop.

**Fix**: keep the Railway start command as just `node ./dist/server/entry.mjs`. Create new tables manually in Railway → PostgreSQL → Query tab using `CREATE TABLE IF NOT EXISTS ...`.

### `npx tsc --noEmit` does not work in CI

`npx tsc` downloads a fake stub package. TypeScript is a transitive dependency of Astro but its binary isn't directly exposed. The build step catches type errors anyway — there is no separate type-check step in CI.
