import { blogPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

const title = "Stratbook Blog | AI research, OSINT maps, and strategic intelligence";
const description =
  "Guides on AI research workspaces, OSINT map tools, geospatial notes, GEOINT, briefings, and map-first strategic intelligence workflows.";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/blog"),
  },
  description,
  keywords: [
    "Stratbook blog",
    "AI research workspace",
    "OSINT map tool",
    "geospatial intelligence",
    "GEOINT",
    "strategic intelligence",
  ],
  openGraph: {
    description,
    images: [siteConfig.ogImage],
    title,
    type: "website",
    url: absoluteUrl("/blog"),
  },
  title,
  twitter: {
    card: "summary_large_image",
    description,
    images: [siteConfig.ogImage],
    title,
  },
};

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  description,
  inLanguage: "en-US",
  name: "Stratbook Blog",
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
  url: absoluteUrl("/blog"),
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-[#04060b] px-6 py-10 text-white sm:px-10 lg:px-14">
      <JsonLd data={blogJsonLd} />
      <nav className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/10 pb-6 text-sm">
        <Link className="font-semibold text-teal-200" href="/">
          Stratbook
        </Link>
        <a className="text-white/55 transition hover:text-white" href="/auth">
          Create your map
        </a>
      </nav>

      <section className="mx-auto max-w-5xl py-16 sm:py-24">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.26em] text-teal-200/70">Resources</p>
        <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[0.98] tracking-normal text-white/95 sm:text-7xl">
          AI research, OSINT maps, and strategic intelligence.
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-white/48">
          Practical guides for analysts, researchers, reporters, and teams who need notes,
          sources, maps, and AI briefings to stay connected.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 pb-24 md:grid-cols-3">
        {blogPosts.map((post) => (
          <article
            className="flex min-h-[360px] flex-col rounded-lg border border-white/10 bg-white/[0.025] p-6 transition hover:border-teal-200/35 hover:bg-white/[0.045]"
            key={post.slug}
          >
            <div className="mb-8 flex items-center justify-between gap-3">
              <span className="rounded border border-white/10 px-2 py-1 text-[11px] text-white/45">
                {post.category}
              </span>
              <span className="font-mono text-[10px] text-white/25">{post.readingTime}</span>
            </div>
            <h2 className="font-serif text-3xl font-normal leading-tight tracking-normal text-white/90">
              <Link href={post.path ?? `/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="mt-4 grow text-sm leading-6 text-white/42">{post.description}</p>
            <div className="mt-8 border-t border-white/10 pt-4">
              <Link className="text-sm font-medium text-teal-200/90" href={post.path ?? `/blog/${post.slug}`}>
                Read article →
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
