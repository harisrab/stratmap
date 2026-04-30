"use client";

import { Wordmark } from "@/components/brand/wordmark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MAX_PROJECT_NAME_LENGTH } from "@/lib/stratmap/constants";
import type { PublicProjectListing } from "@/lib/stratmap/workspace";
import type { Project } from "@/lib/stratmap/types";
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  Globe2Icon,
  Loader2Icon,
  LogOutIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// Mirrors the primary/ghost button styling from the marketing landing page so
// the dashboard's main affordances feel like the rest of the brand. Sizing is
// the landing's `md` (42px) button — the dashboard nav (52px) accommodates it.
const landingBtnBase =
  "inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-[7px] text-[13.5px] tracking-[0.01em] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60";

const landingBtnPrimary =
  `${landingBtnBase} bg-[#5eead4] font-semibold text-[#04060b] hover:-translate-y-px hover:bg-[#99f6e4] hover:shadow-[0_10px_28px_-8px_rgba(94,234,212,0.33)]`;

const landingBtnGhost =
  `${landingBtnBase} border border-white/[0.13] bg-transparent font-medium text-white/65 hover:bg-white/[0.055] hover:text-white/85`;

type ProjectHomeProps = {
  personalProjects: Project[];
  publicProjects: PublicProjectListing[];
  userEmail: string;
};

function formatShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatUpdatedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Updated unknown";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDelta = Math.round((startOfDate - startOfToday) / 86_400_000);

  if (dayDelta === 0) return "Updated today";
  if (dayDelta === -1) return "Updated yesterday";
  if (dayDelta > -7 && dayDelta < 0) return `Updated ${Math.abs(dayDelta)} days ago`;
  return `Updated ${formatShortDate(iso)}`;
}

function getProjectUpdatedAt(project: Project) {
  return (
    project.updatedAt ??
    project.coverImage?.updatedAt ??
    project.sharing?.updatedAt ??
    project.sharing?.createdAt ??
    project.createdAt
  );
}

function ProjectCard({ project, onChange }: { project: Project; onChange: () => void }) {
  const router = useRouter();
  // useTransition lets us show a "loading" state while the next route's
  // server components stream in. Without it, the user clicks the card and
  // sees no feedback for several hundred ms before the editor appears.
  const [isPending, startTransition] = useTransition();
  const [coverFailed, setCoverFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionPending, setActionPending] = useState<"share" | "delete" | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isPublic = project.sharing?.isPublic;
  const description = project.description?.trim() || "No description yet.";
  const updatedAt = getProjectUpdatedAt(project);
  const tags = isPublic ? ["Public"] : [];

  function navigateToProject() {
    if (isPending) return;
    startTransition(() => {
      router.push(`/project/${project.id}`);
    });
  }

  async function handleSharePublicly() {
    if (actionPending) return;
    setActionPending("share");
    setActionError(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/share`, {
        method: "POST",
      });
      const data = (await response.json()) as { shareUrl?: string; error?: string };
      if (!response.ok || !data.shareUrl) {
        throw new Error(data.error ?? "Failed to create share link.");
      }
      try {
        await navigator.clipboard.writeText(data.shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        window.prompt("Public link:", data.shareUrl);
      }
      onChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create share link.");
    } finally {
      setActionPending(null);
    }
  }

  async function handleDelete() {
    if (actionPending) return;
    const ok = window.confirm(
      `Delete "${project.name}"? This permanently removes the stratbook and any public link.`
    );
    if (!ok) return;
    setActionPending("delete");
    setActionError(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to delete stratbook.");
      }
      onChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete stratbook.");
      setActionPending(null);
    }
  }

  return (
    <div
      aria-busy={isPending}
      aria-label={`Open ${project.name}`}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#05090f] text-left transition-[border-color,box-shadow] duration-200 hover:border-white/[0.14] hover:shadow-[0_0_0_1px_rgba(94,234,212,0.06),0_20px_56px_-20px_rgba(0,0,0,0.7)] focus-visible:border-teal-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30"
      onClick={navigateToProject}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigateToProject();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Cover image */}
      <div className="relative aspect-[16/8.5] overflow-hidden bg-[#050a10]">
        {coverFailed ? (
          <div className="size-full bg-[radial-gradient(ellipse_at_35%_40%,rgba(94,234,212,0.09),transparent_55%),linear-gradient(145deg,#07111a,#03060c)] bg-[size:44px_44px,auto] [background-image:radial-gradient(ellipse_at_35%_40%,rgba(94,234,212,0.09),transparent_55%),repeating-linear-gradient(90deg,rgba(255,255,255,0.028)_0px,rgba(255,255,255,0.028)_1px,transparent_1px,transparent_44px),repeating-linear-gradient(0deg,rgba(255,255,255,0.028)_0px,rgba(255,255,255,0.028)_1px,transparent_1px,transparent_44px),linear-gradient(145deg,#07111a,#03060c)]" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- This protected API route needs browser cookies; next/image optimizer fetches without them. */
          <img
            alt={`${project.name} map cover`}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setCoverFailed(true)}
            src={`/api/projects/${encodeURIComponent(project.id)}/cover`}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#05090f]/70" />

        {/* Three-dots context menu */}
        <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
          <DropdownMenuTrigger
            aria-label="Stratbook options"
            className={`absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-md border border-white/10 bg-black/55 text-white/70 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-black/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-white/10 bg-[#0b1218] text-white/85"
            onClick={(event) => event.stopPropagation()}
            sideOffset={6}
          >
            <DropdownMenuItem
              className="text-[12.5px]"
              disabled={actionPending !== null}
              onClick={() => {
                setMenuOpen(false);
                void handleSharePublicly();
              }}
            >
              {shareCopied ? (
                <CheckIcon className="size-3.5 text-teal-300" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
              {shareCopied
                ? "Link copied"
                : isPublic
                  ? "Copy public link"
                  : "Make public · copy link"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-[12.5px]"
              disabled={actionPending !== null}
              onClick={() => {
                setMenuOpen(false);
                void handleDelete();
              }}
              variant="destructive"
            >
              <Trash2Icon className="size-3.5" />
              Delete stratbook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Pending overlay */}
        {(isPending || actionPending) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2Icon className="size-4 animate-spin text-teal-300/80" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-h-[8.35rem] flex-1 flex-col p-4 pt-3.5">
        <p
          className={`line-clamp-3 text-[12px] leading-relaxed ${
            project.description ? "text-white/52" : "text-white/28"
          }`}
        >
          {description}
        </p>

        {actionError ? (
          <p className="mt-2 text-[11px] text-rose-300/85">{actionError}</p>
        ) : null}

        <div className="mt-auto space-y-3 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <time
                className="block text-[11px] font-medium text-white/54"
                dateTime={updatedAt}
              >
                {formatUpdatedDate(updatedAt)}
              </time>
              <time className="block font-mono text-[9.5px] text-white/24" dateTime={project.createdAt}>
                Created {formatShortDate(project.createdAt)}
              </time>
            </div>

            {tags.length > 0 ? (
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {tags.map((tag) => (
                  <span
                    className={`rounded-md border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] ${
                      tag === "Example"
                        ? "border-teal-400/18 bg-teal-400/[0.06] text-teal-200/62"
                        : "border-white/10 bg-white/[0.04] text-white/40"
                    }`}
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicCard({ listing }: { listing: PublicProjectListing }) {
  const { project, shareId } = listing;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [coverFailed, setCoverFailed] = useState(false);
  const description = project.description?.trim() || "Public notebook.";
  const updatedAt = getProjectUpdatedAt(project);

  function open() {
    if (isPending) return;
    startTransition(() => {
      router.push(`/s/${shareId}`);
    });
  }

  return (
    <div
      aria-busy={isPending}
      aria-label={`Open ${project.name}`}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#05090f] text-left transition-[border-color,box-shadow] duration-200 hover:border-white/[0.14] hover:shadow-[0_0_0_1px_rgba(94,234,212,0.06),0_20px_56px_-20px_rgba(0,0,0,0.7)] focus-visible:border-teal-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30"
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-[16/8.5] overflow-hidden bg-[#050a10]">
        {coverFailed ? (
          <div className="size-full bg-[radial-gradient(ellipse_at_35%_40%,rgba(94,234,212,0.09),transparent_55%),linear-gradient(145deg,#07111a,#03060c)]" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- Public cover endpoint is plain GET; no auth cookies needed. */
          <img
            alt={`${project.name} map cover`}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setCoverFailed(true)}
            src={`/api/shares/${encodeURIComponent(shareId)}/cover`}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#05090f]/70" />
        {isPending && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2Icon className="size-4 animate-spin text-teal-300/80" />
          </div>
        )}
      </div>

      <div className="flex min-h-[7.5rem] flex-1 flex-col p-4 pt-3.5">
        <h3 className="line-clamp-1 text-[13px] font-medium text-white/82">{project.name}</h3>
        <p
          className={`mt-1.5 line-clamp-2 text-[12px] leading-relaxed ${
            project.description ? "text-white/52" : "text-white/28"
          }`}
        >
          {description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <time className="block font-mono text-[9.5px] text-white/24" dateTime={updatedAt}>
            {formatUpdatedDate(updatedAt)}
          </time>
          <span className="rounded-md border border-teal-400/18 bg-teal-400/[0.06] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-teal-200/62">
            Public
          </span>
        </div>
      </div>
    </div>
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
      <button className={`${landingBtnPrimary} mt-6`} onClick={onCreateClick} type="button">
        <PlusIcon className="size-3.5" />
        Create your first stratbook
      </button>
    </div>
  );
}

export function ProjectHome({ personalProjects, publicProjects, userEmail }: ProjectHomeProps) {
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
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ── Nav bar ── */}
        <nav className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-[52px] backdrop-blur-sm max-md:h-16 max-md:px-5">
          <Link
            aria-label="Go to Stratbook landing page"
            className="flex items-center transition-opacity hover:opacity-80"
            href="/"
          >
            <Wordmark size="lg" />
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden max-w-[14rem] truncate text-[11px] text-white/35 md:block">
              {userEmail}
            </span>
            <time className="hidden font-mono text-[10.5px] tracking-wide text-white/25 sm:block">
              {today}
            </time>
            <button className={landingBtnPrimary} onClick={openDialog} type="button">
              <PlusIcon className="size-3.5" />
              New stratbook
            </button>
            <button
              className={landingBtnGhost}
              onClick={() => {
                void handleSignOut();
              }}
              type="button"
            >
              <LogOutIcon className="size-3.5" />
              Log out
            </button>
          </div>
        </nav>

        {/* ── Page content ── */}
        <div className="flex-1 px-[52px] py-8 max-md:px-5">
          {/* ── Your library ── */}
          <section>
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
              {personalProjects.length > 0 && (
                <span className="font-mono text-[11px] text-white/28">
                  {personalProjects.length} {personalProjects.length === 1 ? "stratbook" : "stratbooks"}
                </span>
              )}
            </div>

            {personalProjects.length > 0 && (
              <div className="mb-6 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-transparent" />
            )}

            {personalProjects.length === 0 ? (
              <EmptyState onCreateClick={openDialog} />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                {personalProjects.map((project) => (
                  <ProjectCard key={project.id} onChange={() => router.refresh()} project={project} />
                ))}

                {/* "New stratbook" ghost card */}
                <button
                  className="flex min-h-[15rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.085] bg-white/[0.01] py-8 text-white/24 transition-all hover:border-white/[0.18] hover:bg-white/[0.025] hover:text-teal-200/70"
                  onClick={openDialog}
                  type="button"
                >
                  <PlusIcon className="size-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em]">New stratbook</span>
                </button>
              </div>
            )}
          </section>

          {/* ── Community ── */}
          {publicProjects.length > 0 && (
            <section className="mt-16">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/28">Community</p>
                  <h2 className="mt-1.5 text-[1.6rem] font-semibold leading-none tracking-tight text-white/90">
                    Public notebooks
                  </h2>
                  <p className="mt-2 max-w-md text-[12px] leading-relaxed text-white/40">
                    Open any public stratbook to read it, then fork it into your own library to
                    keep editing.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-white/28">
                  {publicProjects.length} {publicProjects.length === 1 ? "notebook" : "notebooks"}
                </span>
              </div>

              <div className="mb-6 h-px w-full bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-transparent" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                {publicProjects.map((listing) => (
                  <PublicCard key={listing.shareId} listing={listing} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.05] px-[52px] py-4 max-md:px-5">
          <p className="text-[10px] text-white/22">
            Stratbook — strategic notebooks, anchored to the world.
          </p>
        </footer>
      </div>

      {/* Create project dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[10px] border-white/12 bg-[oklch(0.11_0.015_231)] p-7 shadow-[0_32px_100px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold tracking-tight text-white/92">
                New stratbook
              </DialogTitle>
              <DialogDescription className="text-[12.5px] leading-relaxed text-white/45">
                Name your stratbook and outline what it covers. Both show in your library and on
                share cards.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-3">
              <div className="relative">
                <Input
                  autoFocus
                  className="rounded-[7px] border-white/12 bg-white/[0.05] pr-14 text-[13px] text-white placeholder:text-white/28 focus-visible:border-teal-400/45 focus-visible:ring-teal-400/15"
                  maxLength={MAX_PROJECT_NAME_LENGTH}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Russia–Ukraine — Operational Map"
                  required
                  value={name}
                />
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] ${
                    name.length >= MAX_PROJECT_NAME_LENGTH
                      ? "text-rose-300/80"
                      : name.length > MAX_PROJECT_NAME_LENGTH - 10
                        ? "text-amber-200/70"
                        : "text-white/30"
                  }`}
                >
                  {name.length}/{MAX_PROJECT_NAME_LENGTH}
                </span>
              </div>
              <Textarea
                className="min-h-20 rounded-[7px] border-white/12 bg-white/[0.05] text-[13px] text-white placeholder:text-white/28 focus-visible:border-teal-400/45 focus-visible:ring-teal-400/15"
                onChange={(e) => setDescription(e.currentTarget.value)}
                placeholder="Scope, geography, and key questions to track…"
                value={description}
              />
              {error ? (
                <div className="flex items-start gap-2 rounded-[7px] border border-rose-400/18 bg-rose-500/8 px-3 py-2.5 text-[12px] text-rose-100/85">
                  <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}
            </div>

            <DialogFooter className="-mx-0 -mb-0 mt-6 gap-2 border-none bg-transparent p-0 sm:flex-row sm:justify-end">
              <button
                className={landingBtnGhost}
                onClick={() => setIsDialogOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={landingBtnPrimary}
                disabled={!name.trim() || isCreating}
                type="submit"
              >
                {isCreating ? "Creating…" : "Create stratbook"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
