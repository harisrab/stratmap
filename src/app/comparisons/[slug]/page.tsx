import { blogPosts, getResourcePost } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { ResourceArticlePage } from "@/components/marketing/resource-article-page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts
    .filter((post) => post.kind === "comparison")
    .map((post) => ({
      slug: post.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getResourcePost("comparison", slug);
  if (!post) return {};

  const url = absoluteUrl(post.path ?? `/comparisons/${post.slug}`);

  return {
    alternates: {
      canonical: url,
    },
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      description: post.description,
      images: [siteConfig.ogImage],
      publishedTime: post.publishedAt,
      title: post.title,
      type: "article",
      url,
    },
    title: post.title,
    twitter: {
      card: "summary_large_image",
      description: post.description,
      images: [siteConfig.ogImage],
      title: post.title,
    },
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getResourcePost("comparison", slug);
  if (!post) notFound();

  return <ResourceArticlePage post={post} />;
}
