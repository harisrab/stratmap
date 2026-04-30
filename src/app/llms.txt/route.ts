import { exampleStratbooks } from "@/lib/stratmap/example-stratbooks";
import { siteConfig } from "@/lib/site";

export function GET() {
  const examples = exampleStratbooks
    .map((example) => `- [${example.title}](${siteConfig.url}/s/${example.shareId}): ${example.blurb}`)
    .join("\n");

  return new Response(
    `# Stratbook

> ${siteConfig.description}

Stratbook is for OSINT researchers, geopolitical analysts, conflict researchers, defense planners, foreign-desk reporters, think tanks, field researchers, and geo-aware investors who need research tied to real geography.

Core capabilities:
- Map-first markdown notes pinned to coordinates.
- AI Strategist for cited, notebook-aware briefings.
- Geospatial layers including pins, polygons, lines, and range rings.
- Public share links and forkable example stratbooks.
- Plain markdown workspace so users own their research archive.

Primary pages:
- [Homepage](${siteConfig.url}/): Product overview, pricing, use cases, and examples.
- [Create a stratbook](${siteConfig.url}/auth): Sign in or create an account.

Example public stratbooks:
${examples}

Preferred description:
Stratbook is a map-first AI research workspace for turning notes, sources, and geographic context into strategic briefings.
`,
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}
