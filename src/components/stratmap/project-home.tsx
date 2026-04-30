"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exampleStratbooks } from "@/lib/stratmap/example-stratbooks";
import type { Project } from "@/lib/stratmap/types";
import {
  AlertCircleIcon,
  LogOutIcon,
  Globe2Icon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MapCanvas } from "./map-canvas";

type ProjectHomeProps = {
  projects: Project[];
  userEmail: string;
};

const exampleProjectIds = new Set(exampleStratbooks.map((example) => example.id));

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  // useTransition lets us show a "loading" state while the next route's
  // server components stream in. Without it, the user clicks the card and
  // sees no feedback for several hundred ms before the editor appears.
  const [isPending, startTransition] = useTransition();
  const [coverFailed, setCoverFailed] = useState(false);
  const isExample = exampleProjectIds.has(project.id);
  const isPublic = project.sharing?.isPublic;

  return (
    <button
      aria-busy={isPending}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#05090f] text-left transition-all duration-200 hover:border-white/[0.14] hover:shadow-[0_0_0_1px_rgba(94,234,212,0.06),0_20px_56px_-20px_rgba(0,0,0,0.7)] disabled:cursor-wait disabled:opacity-60"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          router.push(`/project/${project.id}`);
        })
      }
      type="button"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/8] overflow-hidden bg-[#050a10]">
        {coverFailed ? (
          <div className="size-full bg-[radial-gradient(ellipse_at_35%_40%,rgba(94,234,212,0.09),transparent_55%),linear-gradient(145deg,#07111a,#03060c)] bg-[size:44px_44px,auto] [background-image:radial-gradient(ellipse_at_35%_40%,rgba(94,234,212,0.09),transparent_55%),repeating-linear-gradient(90deg,rgba(255,255,255,0.028)_0px,rgba(255,255,255,0.028)_1px,transparent_1px,transparent_44px),repeating-linear-gradient(0deg,rgba(255,255,255,0.028)_0px,rgba(255,255,255,0.028)_1px,transparent_1px,transparent_44px),linear-gradient(145deg,#07111a,#03060c)]" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- This protected API route needs browser cookies; next/image optimizer fetches without them. */
          <img
            alt={`${project.name} map cover`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setCoverFailed(true)}
            src={`/api/projects/${encodeURIComponent(project.id)}/cover`}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#05090f]/70" />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          {isExample && (
            <span className="rounded-md border border-teal-400/20 bg-black/55 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-teal-200/65 backdrop-blur-sm">
              Example
            </span>
          )}
          {isPublic && (
            <span className="rounded-md border border-white/12 bg-black/55 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/45 backdrop-blur-sm">
              Public
            </span>
          )}
        </div>

        {/* Pending overlay */}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <Loader2Icon className="size-4 animate-spin text-teal-300/80" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-4 pb-4">
        <h2 className="text-[13.5px] font-semibold leading-snug tracking-[-0.015em] text-white/88 transition-colors duration-150 group-hover:text-white">
          {project.name}
        </h2>
        {project.description ? (
          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-white/38">
            {project.description}
          </p>
        ) : null}
        <p className="mt-1.5 font-mono text-[9.5px] text-white/22">
          {formatDate(project.createdAt)}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Globe2Icon className="size-6 text-white/28" />
      </div>
      <h2 className="mt-5 text-lg font-medium text-white/85">No stratbooks yet</h2>
      <p className="mt-2 max-w-[22rem] text-[12.5px] leading-relaxed text-white/40">
        Create your first stratbook to start organizing notes, scenarios, and geographic data on the
        map.
      </p>
      <Button
        className="mt-6 rounded-xl border border-teal-400/22 bg-teal-400/8 px-5 text-[13px] text-teal-200/90 hover:bg-teal-400/14"
        onClick={onCreateClick}
        type="button"
        variant="ghost"
      >
        <PlusIcon className="size-3.5" />
        Create your first stratbook
      </Button>
    </div>
  );
}

export function ProjectHome({ projects, userEmail }: ProjectHomeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function openDialog() {
    setName("");
    setDescription("");
    setError(null);
    setIsDialogOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        body: JSON.stringify({
          description: description.trim() || undefined,
          name: name.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = (await response.json()) as { project?: Project; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create project.");
      }

      router.push(`/project/${data.project!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsCreating(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#04060b] text-white">
      {/* Background globe */}
      <MapCanvas decorative />

      {/* Multi-layer gradient — darker overall so the globe reads as moody
          backdrop, not foreground subject. Vignette on the right edge lets
          the globe glow from the upper-left without competing with content. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060b]/55 via-[#04060b]/78 to-[#04060b]/96" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,transparent,rgba(4,6,11,0.85)_70%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#04060b]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#04060b] to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ── Nav bar ── */}
        <nav className="flex h-[3.25rem] items-center justify-between border-b border-white/[0.07] px-7 backdrop-blur-sm">
          <Link
            aria-label="Go to Stratbook landing page"
            className="flex items-center transition-opacity hover:opacity-80"
            href="/"
          >
            <Wordmark size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden max-w-[14rem] truncate text-[11px] text-white/35 md:block">
              {userEmail}
            </span>
            <time className="hidden font-mono text-[10.5px] tracking-wide text-white/25 sm:block">
              {today}
            </time>
            <Button
              className="h-7 rounded-lg border border-white/12 bg-white/[0.06] px-3 text-[12px] text-white/75 hover:bg-white/10 hover:text-white"
              onClick={openDialog}
              type="button"
              variant="ghost"
            >
              <PlusIcon className="size-3" />
              New stratbook
            </Button>
            <Button
              className="h-7 rounded-lg border border-red-400/20 bg-red-500/85 px-3 text-[12px] font-semibold text-white shadow-[0_10px_28px_-18px_rgba(248,113,113,0.75)] hover:border-red-300/30 hover:bg-red-400 hover:text-white"
              onClick={() => {
                void handleSignOut();
              }}
              type="button"
              variant="ghost"
            >
              <LogOutIcon className="size-3.5" />
              Log out
            </Button>
          </div>
        </nav>

        {/* ── Page content ── */}
        <div className="flex-1 px-7 py-8">
          {/* Page header */}
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/28">Your library</p>
              <h1 className="mt-1.5 text-[1.6rem] font-semibold leading-none tracking-tight text-white/90">
                Stratbooks
              </h1>
              <p className="mt-2 max-w-md text-[12px] leading-relaxed text-white/40">
                Strategic notebooks anchored to the map. Drop pins, capture notes,
                and let the Strategist help you reason across them.
              </p>
            </div>
            {projects.length > 0 && (
              <span className="font-mono text-[11px] text-white/28">
                {projects.length} {projects.length === 1 ? "stratbook" : "stratbooks"}
              </span>
            )}
          </div>

          {/* Divider */}
          {projects.length > 0 && (
            <div className="mb-6 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-transparent" />
          )}

          {projects.length === 0 ? (
            <EmptyState onCreateClick={openDialog} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}

              {/* "New stratbook" ghost card */}
              <button
                className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/[0.085] bg-white/[0.01] py-8 text-white/24 transition-all hover:border-white/[0.18] hover:bg-white/[0.025] hover:text-teal-200/70"
                onClick={openDialog}
                type="button"
              >
                <PlusIcon className="size-4" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em]">New stratbook</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.05] px-7 py-4">
          <p className="text-[10px] text-white/22">
            Stratbook — strategic notebooks, anchored to the world.
          </p>
        </footer>
      </div>

      {/* Create project dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[1.5rem] border-white/12 bg-[oklch(0.11_0.015_231)] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold text-white/90">
                New stratbook
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-white/45">
                Give your stratbook a name. Notes and pins can be added after creation.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-3">
              <Input
                autoFocus
                className="rounded-xl border-white/12 bg-white/[0.05] text-[13px] text-white placeholder:text-white/28 focus-visible:border-teal-400/45 focus-visible:ring-teal-400/15"
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Stratbook name"
                required
                value={name}
              />
              <Textarea
                className="min-h-20 rounded-xl border-white/12 bg-white/[0.05] text-[13px] text-white placeholder:text-white/28 focus-visible:border-teal-400/45 focus-visible:ring-teal-400/15"
                onChange={(e) => setDescription(e.currentTarget.value)}
                placeholder="Description (optional)"
                value={description}
              />
              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-400/18 bg-rose-500/8 px-3 py-2.5 text-[12px] text-rose-100/85">
                  <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}
            </div>

            <DialogFooter className="-mx-0 -mb-0 mt-5 border-none bg-transparent p-0 sm:flex-row sm:justify-end">
              <Button
                className="rounded-xl text-[13px] text-white/50 hover:text-white/80"
                onClick={() => setIsDialogOpen(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl border border-teal-400/22 bg-teal-400/10 text-[13px] text-teal-200/90 hover:bg-teal-400/18 disabled:opacity-35"
                disabled={!name.trim() || isCreating}
                type="submit"
                variant="ghost"
              >
                {isCreating ? "Creating…" : "Create stratbook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
