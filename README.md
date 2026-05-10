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

1. **Map screenshot workflow**
   - Add a Screenshot control with aspect-ratio presets, a movable capture window, Enter-to-capture behavior, and a right-side screenshot library.
   - Captures should be static images with thumbnail previews, timestamps, metadata, and PNG/JPEG download support.

2. **Distance and measurement tools**
   - Show distance labels on drawn lines, range rings, and polygon perimeters.
   - Add a global metrics visibility toggle plus an ad hoc measuring tape tool for temporary map measurements.

3. **Strategist deep research mode**
   - Upgrade Strategist with live web research, source-rich answers, and workspace-aware synthesis.
   - Add integration hooks for external research tools such as Exa AI and Parallel Deep Research, with per-workspace controls for enabling internet research.

4. **Instant marker creation**
   - Make marker placement feel immediate through optimistic UI.
   - Run persistence, note setup, and any AI-related work in the background with subtle syncing/error states.

5. **In-app feedback and help**
   - Add a persistent Feedback / Help entry point where users can send feature requests, bug reports, or questions directly to the founders.
   - Include useful context such as user, workspace, timestamp, browser, and platform.

6. **Authentication improvements**
   - Add Google and Apple login alongside existing auth options.
   - Make login/sign-up switching feel instant by treating auth as a single client-side view with two states.
