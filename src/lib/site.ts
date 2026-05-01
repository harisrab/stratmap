export const siteConfig = {
  description:
    "Stratbook is a map-first AI research workspace for OSINT teams, geopolitical analysts, defense planners, reporters, and researchers who need notes, sources, pins, and briefings anchored to real places.",
  name: "Stratbook",
  ogImage: "/images/stratbook.jpg",
  tagline: "AI deep research, anchored to the world.",
  url: "https://www.stratbook.world",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
