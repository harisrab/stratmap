import type { Metadata } from "next";
import { DM_Sans, EB_Garamond } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
// Imported here so it's guaranteed to be in the page before any MapCanvas useEffect runs.
// The import in map-canvas-impl.tsx is reliable with Turbopack; with webpack the dynamic
// chunk's CSS can arrive after the effect fires, leaving the canvas with no dimensions.
import "mapbox-gl/dist/mapbox-gl.css";

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
  title: "Stratbook",
  description:
    "Stratbook is a strategic notebook anchored to the world — notes, pins, and an on-call Strategist over Supabase-backed storage.",
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
      </body>
    </html>
  );
}
