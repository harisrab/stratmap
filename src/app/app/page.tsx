import { ProjectHome } from "@/components/stratmap/project-home";
import { MapCanvas } from "@/components/stratmap/map-canvas";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseStorageConfig } from "@/lib/env";
import { ensureExampleStratbooks, ensurePublicExampleStratbooks, listProjects } from "@/lib/stratmap/workspace";
import { DatabaseZapIcon } from "lucide-react";
import { redirect } from "next/navigation";

function SupabaseSetupScreen() {
  return (
    <main className="relative flex h-full items-center justify-center overflow-hidden p-6 text-white">
      <MapCanvas decorative />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,27,39,0.18),rgba(8,16,24,0.64)_48%,rgba(8,16,24,0.9)_100%)]" />

      <div className="relative z-10 w-full max-w-md space-y-6 rounded-[2rem] border border-white/15 bg-black/40 p-8 backdrop-blur-xl">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10">
          <DatabaseZapIcon className="size-6 text-amber-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-medium text-white">Connect Supabase</h1>
          <p className="text-sm text-white/60">
            Stratbook stores your notes and map data in Supabase Storage. Add your credentials to
            get started.
          </p>
        </div>
        <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
            stratmap/.env.local
          </p>
          <pre className="overflow-x-auto text-[12px] leading-relaxed text-sky-200/85">
{`NEXT_PUBLIC_SUPABASE_URL=https://…supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
SUPABASE_SERVICE_ROLE_KEY=eyJ…
SUPABASE_STORAGE_BUCKET=stratmap-workspace`}
          </pre>
        </div>
        <p className="text-xs text-white/40">
          Find these values in your Supabase project under{" "}
          <span className="text-white/60">Settings → API</span>. Restart the dev server after
          adding the file.
        </p>
      </div>
    </main>
  );
}

export default async function AppHome() {
  if (!hasSupabaseStorageConfig()) {
    return <SupabaseSetupScreen />;
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  let projects;
  try {
    await Promise.all([
      ensureExampleStratbooks(user.id),
      ensurePublicExampleStratbooks(),
    ]);
    projects = await listProjects(user.id);
  } catch {
    return <SupabaseSetupScreen />;
  }

  return <ProjectHome projects={projects} userEmail={user.email ?? "Signed in"} />;
}
