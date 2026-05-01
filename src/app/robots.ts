import { siteConfig } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteConfig.url,
    rules: [
      {
        allow: ["/", "/s/"],
        disallow: ["/api/", "/app", "/auth", "/project/"],
        userAgent: "*",
      },
      {
        // Explicit rule so Twitterbot can fetch OG images and the landing page
        allow: ["/", "/images/"],
        disallow: ["/api/", "/app", "/auth", "/project/"],
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
