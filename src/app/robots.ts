import { siteConfig } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteConfig.url,
    rules: [
      {
        allow: ["/", "/s/", "/blog/", "/guides/", "/comparisons/", "/llms.txt"],
        disallow: ["/api/", "/app", "/auth", "/project/"],
        userAgent: "*",
      },
      {
        // Twitterbot must reach /api/shares/*/cover for Twitter card images.
        // No need to block /api/ — it returns JSON that Twitter ignores anyway.
        allow: "/",
        disallow: ["/app", "/auth", "/project/"],
        userAgent: "Twitterbot",
      },
      {
        allow: "/",
        disallow: ["/api/", "/app", "/auth", "/project/"],
        userAgent: "GPTBot",
      },
      {
        allow: "/",
        disallow: ["/api/", "/app", "/auth", "/project/"],
        userAgent: "ChatGPT-User",
      },
      {
        allow: "/",
        disallow: ["/api/", "/app", "/auth", "/project/"],
        userAgent: "ClaudeBot",
      },
      {
        allow: "/",
        disallow: ["/api/", "/app", "/auth", "/project/"],
        userAgent: "PerplexityBot",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
