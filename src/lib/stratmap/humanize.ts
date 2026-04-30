/**
 * Convert a filename or path into a human-friendly display string.
 *
 * Rules (in order):
 *  1. Take the basename.
 *  2. Strip the extension.
 *  3. Strip a trailing unix-ish timestamp like `-1777167264583` (10–14 digits)
 *     so auto-generated names like `marker-1-1777167264583.md` don't look noisy.
 *  4. Split on `-`, `_`, and whitespace; title-case each word; rejoin with spaces.
 *
 * Examples:
 *   marker-1-1777167264583.md  → "Marker 1"
 *   notes/middle_east.md       → "Middle East"
 *   kohistan-road.md           → "Kohistan Road"
 */
export function humanizeFilename(pathOrName: string): string {
  const base = pathOrName.split("/").pop() ?? pathOrName;
  const noExt = base.replace(/\.[^.]+$/, "");
  const noStamp = noExt.replace(/[-_]\d{10,14}$/, "");
  const titled = noStamp
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return titled || base;
}
