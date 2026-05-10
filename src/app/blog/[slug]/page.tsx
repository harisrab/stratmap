import { blogPosts, getBlogPost } from "@/lib/blog";
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
    .filter((post) => !post.kind || post.kind === "blog")
    .map((post) => ({
      slug: post.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (post?.kind && post.kind !== "blog") return {};
  if (!post) return {};

  const url = absoluteUrl(`/blog/${post.slug}`);

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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post || (post.kind && post.kind !== "blog")) notFound();

  return <ResourceArticlePage post={post} />;
}
