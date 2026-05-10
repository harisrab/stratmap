import type { BlogPost } from "@/lib/blog";
import { getBlogJsonLd } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site";
import Link from "next/link";

function ImagePlaceholder({ brief, title }: { brief: string; title: string }) {
  return (
    <figure className="my-8 rounded-lg border border-dashed border-teal-200/30 bg-teal-200/[0.035] p-5">
      <div className="flex min-h-48 items-center justify-center rounded-md border border-white/10 bg-black/20 px-5 text-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-teal-200/70">Image placeholder</p>
          <p className="mt-3 font-serif text-2xl font-normal tracking-normal text-white/90">{title}</p>
        </div>
      </div>
      <figcaption className="mt-4 text-sm leading-6 text-white/50">{brief}</figcaption>
    </figure>
  );
}

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

export function ResourceArticlePage({ post }: { post: BlogPost }) {
  const pagePath = post.path ?? `/blog/${post.slug}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        item: absoluteUrl("/"),
        name: "Home",
        position: 1,
      },
      {
        "@type": "ListItem",
        item: absoluteUrl("/blog"),
        name: "Resources",
        position: 2,
      },
      {
        "@type": "ListItem",
        item: absoluteUrl(pagePath),
        name: post.title,
        position: 3,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#04060b] px-6 py-10 text-white sm:px-10 lg:px-14">
      <JsonLd data={getBlogJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd} />
      <nav className="mx-auto flex max-w-3xl items-center justify-between border-b border-white/10 pb-6 text-sm">
        <Link className="font-semibold text-teal-200" href="/">
          Stratbook
        </Link>
        <Link className="text-white/55 transition hover:text-white" href="/blog">
          Resources
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl py-14 sm:py-20">
        <header className="border-b border-white/10 pb-10">
          <div className="mb-7 flex flex-wrap items-center gap-3 text-xs text-white/35">
            <span className="rounded border border-white/10 px-2.5 py-1 text-white/48">{post.category}</span>
            <time dateTime={post.publishedAt}>
              {new Intl.DateTimeFormat("en", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(`${post.publishedAt}T00:00:00Z`))}
            </time>
            <span>{post.readingTime}</span>
          </div>
          <h1 className="font-serif text-5xl font-normal leading-[0.98] tracking-normal text-white/95 sm:text-7xl">
            {post.title}
          </h1>
          <p className="mt-7 text-lg leading-8 text-white/50">{post.description}</p>
        </header>

        {post.heroImage ? <ImagePlaceholder {...post.heroImage} /> : null}

        <div className="prose-shell py-10">
          {post.sections.map((section) => (
            <section className="mb-11" key={section.heading}>
              {section.eyebrow ? (
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-teal-200/60">
                  {section.eyebrow}
                </p>
              ) : null}
              <h2 className="mb-4 font-serif text-3xl font-normal tracking-normal text-white/92">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p className="mb-5 text-[15px] leading-8 text-white/68" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.image ? <ImagePlaceholder {...section.image} /> : null}
            </section>
          ))}
        </div>

        {post.references?.length ? (
          <section className="mb-10 rounded-lg border border-white/10 bg-white/[0.025] p-6">
            <h2 className="font-serif text-2xl font-normal tracking-normal text-white/90">Useful references</h2>
            <ul className="mt-5 grid gap-3">
              {post.references.map((reference) => (
                <li key={reference.url}>
                  <a className="text-sm leading-6 text-teal-200/85 transition hover:text-teal-100" href={reference.url} rel="noreferrer" target="_blank">
                    {reference.label} →
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <aside className="rounded-lg border border-teal-200/20 bg-teal-200/[0.04] p-6">
          <h2 className="font-serif text-2xl font-normal tracking-normal text-white/90">
            Build the map-first version of your research.
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/48">
            Create a Stratbook to pin notes, sources, layers, and AI briefings to real places.
          </p>
          <a
            className="mt-5 inline-flex h-10 items-center rounded-md bg-teal-200 px-4 text-sm font-semibold text-[#04100f]"
            href="/auth"
          >
            Create your map →
          </a>
        </aside>
      </article>
    </main>
  );
}
