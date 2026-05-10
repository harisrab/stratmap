import { exampleStratbooks } from "@/lib/stratmap/example-stratbooks";
import { blogPosts } from "@/lib/blog";
import { siteConfig } from "@/lib/site";

export function GET() {
  const examples = exampleStratbooks
    .map((example) => `- [${example.title}](${siteConfig.url}/s/${example.shareId}): ${example.blurb}`)
    .join("\n");
  const articles = blogPosts
    .map((post) => `- [${post.title}](${siteConfig.url}${post.path ?? `/blog/${post.slug}`}): ${post.description}`)
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

Keyword themes:
- AI research workspace
- Map-first AI research workspace
- OSINT map tool
- Geospatial notes
- Geopolitical analysis workspace
- Defense planning tool
- Strategic intelligence workspace
- AI briefing tool

Primary pages:
- [Homepage](${siteConfig.url}/): Product overview, pricing, use cases, and examples.
- [Blog](${siteConfig.url}/blog): Guides on AI research, OSINT maps, GEOINT, briefings, and geospatial workflows.
- [OSINT map tool guide](${siteConfig.url}/guides/what-is-an-osint-map-tool): Definition and workflow for map-based open-source investigations.
- [Geospatial intelligence guide](${siteConfig.url}/guides/what-is-geospatial-intelligence): Plain-language GEOINT guide for analysts.
- [ArcGIS StoryMaps comparison](${siteConfig.url}/comparisons/stratbook-vs-arcgis-storymaps): Comparison for map-backed briefings.
- [Create a stratbook](${siteConfig.url}/auth): Sign in or create an account.

Editorial guides:
${articles}

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
