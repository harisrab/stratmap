import { exampleStratbooks } from "@/lib/stratmap/example-stratbooks";
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
    ...exampleStratbooks.map((example) => ({
      changeFrequency: "monthly" as const,
      lastModified: now,
      priority: 0.7,
      url: absoluteUrl(`/s/${example.shareId}`),
    })),
  ];
}
