# chat-app

![CI](https://github.com/Dan8a5/chat-app/actions/workflows/ci.yml/badge.svg)

A real-time chat application with rooms, presence, typing indicators, and @mention support.

**Live on Railway** — auto-deploys on every merge to `main`.

---

## Stack

- [Astro](https://astro.build) — SSR, `@astrojs/node` standalone adapter
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Tailwind v4](https://tailwindcss.com) — class-based dark mode
- Native `EventSource` (SSE) for real-time messaging

---

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up env vars

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/chatapp
```

### 3. Apply migrations

```bash
npm run db:migrate
```

### 4. Start the dev server

```bash
npm run dev
# http://localhost:4321
```

---

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Production build → `./dist` |
| `npm run start` | Run the production build |
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push schema directly (local dev only) |
| `npm run seed` | Seed the database with sample data |

---

## Preview

<!-- Add screenshot or demo GIF here -->

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, PR workflow, Railway deployment details, and known gotchas.
