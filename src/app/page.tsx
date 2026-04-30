import { LandingPage } from "@/components/marketing/landing-page";

// The landing page is intentionally static + client-rendered. It uses the
// decorative MapCanvas, which is dynamically imported with ssr:false, so this
// route works regardless of whether Supabase is configured. Visitors hit
// "Create your map" → `/app`, which is where the Supabase-gated workspace
// lives.
export default function Home() {
  return <LandingPage />;
}
