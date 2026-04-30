# StratMap

A stripped-down StratMap rebuild in Next.js with:

- a live globe backdrop powered by `mapbox-gl`
- a left-side workspace browser for `notes/`, `scenarios/`, and `data/`
- a right-side chat panel built with Vercel AI SDK + AI Elements
- a Supabase-backed workspace store, plus Postgres tables for chat persistence and usage metering

## Stack

- [Next.js App Router](https://nextjs.org/docs/app)
- [AI SDK](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [AI Elements](https://elements.ai-sdk.dev/docs)
- [OpenAI provider for AI SDK](https://ai-sdk.dev/cookbook/guides/openai-responses)
- [Supabase Storage](https://supabase.com/docs/reference/javascript/storage-from-list) and Postgres

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add `OPENAI_API_KEY`.
3. Add `NEXT_PUBLIC_MAPBOX_TOKEN` if you want the interactive globe to render with Mapbox styles.
4. Add the Supabase values if you want the app to read/write workspaces and persist Strategist chat.
5. Use Node `22.21.1` or another current LTS release.
6. Start the app:

```bash
pnpm dev
```

The app will default to the seeded local workspace inside this folder when Supabase is not configured or the bucket is empty.

## Environment

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
NEXT_PUBLIC_MAPBOX_TOKEN=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=stratmap-workspace
```

## Supabase storage

The server routes use the service role key, so the app can keep the bucket private and still list, read, and overwrite workspace files through Next.js.

To create the bucket, run the SQL in [supabase/storage.sql](/Users/harisrashid/repos/stratmap/stratmap/supabase/storage.sql:1) or create a private bucket named `stratmap-workspace` in the dashboard.

## Supabase chat tables

The Strategist persists chat history and monthly message usage in Postgres. Run the SQL in [supabase/chat.sql](/Users/harisrashid/repos/stratmap/stratmap/supabase/chat.sql:1) in the Supabase SQL editor before using chat in a remote project.

## Dev Mode

The default `pnpm dev` script uses webpack instead of Turbopack. That keeps worker-backed map rendering on the most stable path while Next.js continues improving Turbopack behavior for heavy client libraries.

## Chat behavior

The chat route uses `@ai-sdk/openai` with `openai.responses(...)` and enables:

- workspace file listing
- workspace search
- file reads
- file overwrites
- OpenAI `web_search_preview` for lightweight research

This first cut deliberately does not let the agent manipulate the front-end map controls yet. The agent can inspect and edit workspace files, and the UI refreshes after each completed response.
