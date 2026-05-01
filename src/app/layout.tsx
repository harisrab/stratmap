import type { Metadata } from "next";
import { DM_Sans, EB_Garamond } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { absoluteUrl, siteConfig } from "@/lib/site";
import "./globals.css";
// Imported here so it's guaranteed to be in the page before any MapCanvas useEffect runs.
// The import in map-canvas-impl.tsx is reliable with Turbopack; with webpack the dynamic
// chunk's CSS can arrive after the effect fires, leaving the canvas with no dimensions.
import "mapbox-gl/dist/mapbox-gl.css";
import { Analytics } from "@vercel/analytics/next"


const dmSans = DM_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const ebGaramond = EB_Garamond({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-eb-garamond",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  authors: [{ name: "Stratbook" }],
  category: "productivity",
  creator: "Stratbook",
  description: siteConfig.description,
  keywords: [
    "AI research workspace",
    "OSINT map",
    "geospatial notes",
    "map-first notebook",
    "geopolitical analysis",
    "intelligence analysis",
    "defense planning",
    "spatial research",
    "AI briefing tool",
    "strategic notebook",
  ],
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: "Stratbook map-first AI research workspace",
        height: 630,
        url: siteConfig.ogImage,
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: siteConfig.name,
    title: "Stratbook | Map-first AI research workspace",
    type: "website",
    url: absoluteUrl("/"),
  },
  publisher: "Stratbook",
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: "Stratbook | Map-first AI research workspace",
    template: "%s | Stratbook",
  },
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    title: "Stratbook | Map-first AI research workspace",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ebGaramond.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#04060b]">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
