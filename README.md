# StratMap

A geospatial strategy workspace: a live globe, a file tree of notes/scenarios/data backed by Supabase Storage, and a chat panel that can read and edit those files.

## Stack

Next.js App Router · React 19 · Mapbox GL · AI SDK (Anthropic) · Supabase (Storage + Postgres)

## Run it

```bash
cp .env.example .env   # fill in Supabase, Mapbox, Anthropic keys
pnpm install
pnpm dev
```

Bucket schema: [supabase/storage.sql](supabase/storage.sql). Chat tables: [supabase/chat.sql](supabase/chat.sql).

## Scripts

- `pnpm dev` — dev server (webpack)
- `pnpm dev:turbo` — dev server (Turbopack)
- `pnpm build` / `pnpm start` — production build + serve
- `pnpm lint` — ESLint
