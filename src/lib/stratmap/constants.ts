// Client-safe constants shared between server (workspace.ts) and client UI.
// Anything here must be pure values — no "server-only" imports.

// Caps how long a stratbook name can be. Sized so the OG cover image
// (renderCoverImage wraps at 34 chars/line × 2 lines) and the app-shell
// project header don't truncate awkwardly.
export const MAX_PROJECT_NAME_LENGTH = 60;
