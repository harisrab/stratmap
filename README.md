# Stratbook - Map-based Workspace for Strategic Thinking

A geospatial strategy workspace: a live globe, a file tree of notes/scenarios/data backed by Supabase Storage, and a chat panel that can read and edit those files.

> While monitoring the middle-east conflict, I wanted to study the conflict at a deeper level. I found myself, taking lots of notes, looking at maps, and evolving these maps to understand the situation and history better. For this, I decided to build a tool for myself that combined maps, AI deep research, and markdown based file-system that integrates it all seamlessly. This way I can easily export these files to any agent for bookeeping and reasoning.

<img width="2113" height="1290" alt="Screenshot 2026-05-01 at 4 29 38 PM" src="https://github.com/user-attachments/assets/22070856-0fd0-46f5-848a-c3390c599fbe" />


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

## Roadmap

The current product roadmap is tracked in [FEATURE_REQUESTS.md](FEATURE_REQUESTS.md). Near-term priorities:

| Priority | Feature | Status | Scope |
| --- | --- | --- | --- |
| P0 | Instant marker creation | Not started | Make marker placement immediate with optimistic UI; run persistence, note setup, and AI-related work in the background with subtle syncing/error states. |
| P0 | Faster auth page load and transitions | Not started | Treat login and sign-up as a single client-side view with two states so switching feels instant and avoids full reloads. |
| P1 | Map screenshot workflow | Not started | Add a Screenshot control with aspect-ratio presets, movable capture window, Enter-to-capture behavior, and a right-side screenshot library with static PNG/JPEG exports. |
| P1 | Distance and measurement tools | Not started | Show labels on drawn lines, range rings, and polygon perimeters; add a global metrics toggle and ad hoc measuring tape tool. |
| P1 | In-app feedback and help | Not started | Add a persistent Feedback / Help entry point that sends feature requests, bugs, and questions directly to the founders with useful workspace/browser context. |
| P2 | Strategist deep research mode | Not started | Add live web research, source-rich answers, workspace-aware synthesis, and integration hooks for tools such as Exa AI and Parallel Deep Research. |
| P2 | Social login options | Not started | Add Continue with Google and Continue with Apple alongside existing auth options. |
