// Client-safe constants shared between server (workspace.ts) and client UI.
// Anything here must be pure values — no "server-only" imports.

// Caps how long a stratbook name can be. Sized so the OG cover image
// (renderCoverImage wraps at 34 chars/line × 2 lines) and the app-shell
// project header don't truncate awkwardly.
export const MAX_PROJECT_NAME_LENGTH = 60;

export const MAP_BASE_THEMES = [
  { id: "dark", label: "Dark", style: "mapbox://styles/mapbox/dark-v11", dot: "#0d1824" },
  { id: "light", label: "Light", style: "mapbox://styles/mapbox/light-v11", dot: "#dce4ec" },
  { id: "satellite", label: "Satellite", style: "mapbox://styles/mapbox/satellite-v9", dot: "#1c3a1e" },
  { id: "hybrid", label: "Hybrid", style: "mapbox://styles/mapbox/satellite-streets-v12", dot: "#253d26" },
  { id: "outdoors", label: "Outdoors", style: "mapbox://styles/mapbox/outdoors-v12", dot: "#8cba7a" },
] as const;

export type MapBaseThemeId = (typeof MAP_BASE_THEMES)[number]["id"];
export const DEFAULT_MAP_BASE_THEME_ID: MapBaseThemeId = "dark";

export function resolveMapBaseTheme(id: string | undefined) {
  return MAP_BASE_THEMES.find((theme) => theme.id === id) ?? MAP_BASE_THEMES[0];
}
