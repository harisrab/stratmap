import { exampleStratbooks } from "@/lib/stratmap/example-stratbooks";
import { blogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 1,
      url: absoluteUrl("/"),
    },
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 0.85,
      url: absoluteUrl("/blog"),
    },
    ...blogPosts.map((post) => ({
      changeFrequency: "monthly" as const,
      lastModified: new Date(`${post.publishedAt}T00:00:00Z`),
      priority: 0.75,
      url: absoluteUrl(post.path ?? `/blog/${post.slug}`),
    })),
    ...exampleStratbooks.map((example) => ({
      changeFrequency: "monthly" as const,
      lastModified: now,
      priority: 0.7,
      url: absoluteUrl(`/s/${example.shareId}`),
    })),
  ];
}
