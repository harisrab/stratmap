import { LandingPage } from "@/components/marketing/landing-page";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUrl, siteConfig } from "@/lib/site";
import type { Metadata } from "next";

const title = "Stratbook | Map-first AI research workspace";
const description =
  "Stratbook helps OSINT researchers, geopolitical analysts, defense planners, reporters, and field researchers turn maps, notes, sources, and AI briefings into spatial intelligence.";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/"),
  },
  description,
  openGraph: {
    description,
    images: [
      {
        alt: "Stratbook workspace with map pins, source notes, and analyst briefings",
        height: 868,
        url: siteConfig.ogImage,
        width: 991,
      },
    ],
    title,
    url: absoluteUrl("/"),
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@id": absoluteUrl("/#organization"),
  "@type": "Organization",
  description: siteConfig.description,
  name: siteConfig.name,
  url: siteConfig.url,
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@id": absoluteUrl("/#software"),
  "@type": "SoftwareApplication",
  applicationCategory: "BusinessApplication",
  audience: [
    { "@type": "Audience", audienceType: "OSINT researchers" },
    { "@type": "Audience", audienceType: "Geopolitical analysts" },
    { "@type": "Audience", audienceType: "Defense planners" },
    { "@type": "Audience", audienceType: "Foreign-desk reporters" },
    { "@type": "Audience", audienceType: "Conflict researchers" },
  ],
  description,
  featureList: [
    "Map-first markdown notes pinned to coordinates",
    "AI research briefings with spatial context",
    "Geospatial layers, range rings, polygons, and lines",
    "Public share links and forkable example stratbooks",
    "Plain markdown workspace with source ownership",
  ],
  name: siteConfig.name,
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      url: absoluteUrl("/auth"),
    },
    {
      "@type": "Offer",
      price: "10",
      priceCurrency: "USD",
      url: absoluteUrl("/auth"),
    },
  ],
  operatingSystem: "Web",
  url: siteConfig.url,
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@id": absoluteUrl("/#website"),
  "@type": "WebSite",
  about: softwareJsonLd,
  description,
  inLanguage: "en-US",
  name: siteConfig.name,
  publisher: organizationJsonLd,
  url: siteConfig.url,
};

// The landing page is intentionally static + client-rendered. It uses the
// decorative MapCanvas, which is dynamically imported with ssr:false, so this
// route works regardless of whether Supabase is configured. Visitors hit
// "Create your map" → `/app`, which is where the Supabase-gated workspace
// lives.
export default async function Home() {
  const user = await getCurrentUser();
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={webSiteJsonLd} />
      <JsonLd data={softwareJsonLd} />
      <LandingPage isAuthenticated={user !== null} />
    </>
  );
}
