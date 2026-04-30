"use client";

import { MessageResponse } from "@/components/ai-elements/message";
import { Onboarding } from "@/components/stratmap/onboarding";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { humanizeFilename } from "@/lib/stratmap/humanize";
import { cn } from "@/lib/utils";
import type {
  GeoLocation,
  Project,
  StratMapLayer,
  WorkspaceAccessMode,
  WorkspaceFile,
  WorkspaceFileSummary,
  WorkspaceIndex,
  WorkspaceMapPoint,
} from "@/lib/stratmap/types";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  GitForkIcon,
  LayersIcon,
  Loader2Icon,
  LockIcon,
  MapPinIcon,
  PencilIcon,
  SearchIcon,
  Share2Icon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";

import { ChatPanel } from "./chat-panel";
import { FileMetadata } from "./file-metadata";
import { FileTree } from "./file-tree";
import { MapCanvas } from "./map-canvas";

type StratMapShellProps = {
  accessMode?: WorkspaceAccessMode;
  initialFile: WorkspaceFile;
  initialIndex: WorkspaceIndex;
  project: Project;
  projectId: string;
  shareId?: string;
};

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

function stripFrontmatter(content: string): string {
  // Remove YAML frontmatter block (---...---) before rendering
  return content.startsWith("---")
    ? content.replace(/^---[\s\S]*?---\r?\n?/, "").trimStart()
    : content;
}

function slugifyMarkerTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "marker";
}

const LAYERS_FILE_PATH = "layers/stratbook-layers.json";
const LAYER_COLORS = ["#5eead4", "#fb923c", "#a7f3d0", "#facc15", "#93c5fd"];

function showLayersByDefault(layers: StratMapLayer[]) {
  return layers.map((layer) => ({ ...layer, visible: true }));
}

function mergeLayerVisibility(nextLayers: StratMapLayer[], currentLayers: StratMapLayer[]) {
  const visibleById = new Map(currentLayers.map((layer) => [layer.id, layer.visible]));
  return nextLayers.map((layer) => ({
    ...layer,
    visible: visibleById.get(layer.id) ?? true,
  }));
}

function formatFileContent(file: WorkspaceFile) {
  if (file.extension === "md") {
    return <MessageResponse>{stripFrontmatter(file.content)}</MessageResponse>;
  }
  try {
    return (
      <pre className="stratmap-scroll overflow-x-auto rounded-lg bg-black/40 p-3 text-[11px] text-sky-50/70">
        {JSON.stringify(JSON.parse(file.content), null, 2)}
      </pre>
    );
  } catch {
    return (
      <pre className="stratmap-scroll overflow-x-auto rounded-lg bg-black/40 p-3 text-[11px] text-sky-50/70">
        {file.content}
      </pre>
    );
  }
}

export function StratMapShell({
  accessMode = "owner",
  initialFile,
  initialIndex,
  project,
  projectId,
  shareId,
}: StratMapShellProps) {
  const [index, setIndex] = useState<WorkspaceIndex>({
    ...initialIndex,
    layers: showLayersByDefault(initialIndex.layers ?? []),
  });
  const [selectedFile, setSelectedFile] = useState(initialFile);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [search, setSearch] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentProject, setCurrentProject] = useState(project);
  // Optimistic markers — added instantly on right-click, replaced when the
  // server returns the saved file. Keyed by client temp path so we can also
  // remove on failure.
  const [pendingMarkers, setPendingMarkers] = useState<WorkspaceMapPoint[]>([]);
  // Note editing
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [gateDialogOpen, setGateDialogOpen] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(336);
  const [activeLayerTool, setActiveLayerTool] = useState<StratMapLayer["type"] | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayerFocusKey, setSelectedLayerFocusKey] = useState(0);
  const [selectedMarkerFocusKey, setSelectedMarkerFocusKey] = useState(0);
  const [spatialFocus, setSpatialFocus] = useState<"layer" | "note">("note");
  const [layerEditorOpen, setLayerEditorOpen] = useState(false);
  const router = useRouter();
  const isOwnerMode = accessMode === "owner";
  const fileApiBase = isOwnerMode
    ? `/api/workspace/file?project=${encodeURIComponent(projectId)}`
    : `/api/shares/${encodeURIComponent(shareId ?? "")}/workspace/file`;
  const workspaceIndexUrl = isOwnerMode
    ? `/api/workspace?project=${encodeURIComponent(projectId)}`
    : `/api/shares/${encodeURIComponent(shareId ?? "")}/workspace`;
  const authNext = shareId ? `/s/${shareId}` : "/app";
  const gateMode = accessMode === "public-anonymous" ? "sign-in" : "fork";

  function fileUrl(filePath: string) {
    const separator = fileApiBase.includes("?") ? "&" : "?";
    return `${fileApiBase}${separator}path=${encodeURIComponent(filePath)}`;
  }

  function requestWriteAccess() {
    if (isOwnerMode) return true;
    setGateDialogOpen(true);
    return false;
  }

  function resolveShareUrl(nextShareId: string) {
    if (typeof window === "undefined") return `/s/${nextShareId}`;
    return `${window.location.origin}/s/${nextShareId}`;
  }

  function openShareDialog() {
    if (currentProject.sharing?.isPublic) {
      setShareUrl(resolveShareUrl(currentProject.sharing.shareId));
    }
    setShareDialogOpen(true);
  }

  function startSidebarResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      const nextWidth = Math.min(560, Math.max(280, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    }

    function handlePointerUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  // Reset draft + cancel edit whenever the selected file changes — otherwise
  // the textarea would leak content between files.
  useEffect(() => {
    queueMicrotask(() => {
      setIsEditingNote(false);
      setDraftContent(stripFrontmatter(selectedFile.content));
    });
  }, [selectedFile.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge real index points with any optimistic ones still in flight, deduping
  // by filePath in case the index already shows a saved version.
  const mapPoints: WorkspaceMapPoint[] = (() => {
    const realPaths = new Set(index.mapPoints.map((p) => p.filePath));
    return [
      ...index.mapPoints,
      ...pendingMarkers.filter((p) => !realPaths.has(p.filePath)),
    ];
  })();

  // Synthesize WorkspaceFileSummary entries for any pending markers so they
  // appear in the file tree alongside real files. They render with a pulsing
  // opacity to signal "still saving."
  const pendingPaths = new Set(pendingMarkers.map((p) => p.filePath));
  const pendingFileSummaries: WorkspaceFileSummary[] = pendingMarkers
    .filter((p) => !index.files.some((f) => f.path === p.filePath))
    .map((p) => {
      const name = p.filePath.split("/").pop() ?? p.filePath;
      return {
        extension: "md" as const,
        kind: "note" as const,
        location: { coordinates: p.coordinates, label: p.label },
        name,
        path: p.filePath,
        size: 0,
        title: p.title,
        updatedAt: new Date().toISOString(),
      };
    });
  const allFiles = [...index.files, ...pendingFileSummaries];

  const deferredSearch = useDeferredValue(search);
  const isVisibleWorkspacePath = (path: string) => !path.split("/").includes("_system");
  const filteredFiles = allFiles.filter((file) => {
    if (!isVisibleWorkspacePath(file.path)) return false;
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return true;
    return `${file.path} ${file.title}`.toLowerCase().includes(query);
  });
  const visibleFolders = index.folders.filter(isVisibleWorkspacePath);
  const selectedLayer = (index.layers ?? []).find((layer) => layer.id === selectedLayerId);

  async function loadFile(filePath: string) {
    setSelectedLayerId(null);
    setLayerEditorOpen(false);
    setSpatialFocus("note");
    setSelectedMarkerFocusKey((key) => key + 1);
    // Optimistic UI: update the visible "selected" path *first* so the file
    // tree highlight, header title, and map fly-to all react immediately.
    // Then fetch the actual content in the background. We synthesize a
    // placeholder WorkspaceFile from the index so the panel header swaps
    // instantly; isLoadingFile drives the spinner over the body.
    if (filePath === selectedFile.path) return;
    const summary = index.files.find((f) => f.path === filePath);
    if (summary) {
      setSelectedFile({ ...summary, content: "" });
    }
    try {
      setWorkspaceError(null);
      setIsLoadingFile(true);
      const file = await requestJson<WorkspaceFile>(fileUrl(filePath));
      setSelectedFile(file);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load file.");
    } finally {
      setIsLoadingFile(false);
    }
  }

  async function refreshWorkspace() {
    try {
      setWorkspaceError(null);
      const latestIndex = await requestJson<WorkspaceIndex>(workspaceIndexUrl);
      const nextIndex = {
        ...latestIndex,
        layers: mergeLayerVisibility(latestIndex.layers ?? [], index.layers ?? []),
      };
      const nextSelectedPath = latestIndex.files.some((f) => f.path === selectedFile.path)
        ? selectedFile.path
        : latestIndex.defaultPath;
      const latestFile = await requestJson<WorkspaceFile>(fileUrl(nextSelectedPath));
      startTransition(() => {
        setIndex(nextIndex);
        setSelectedFile(latestFile);
      });
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to refresh.");
    }
  }

  async function persistLayers(nextLayers: StratMapLayer[]) {
    if (!requestWriteAccess()) return;
    setIndex((prev) => ({ ...prev, layers: nextLayers }));
    try {
      await requestJson<WorkspaceFile>("/api/workspace/file", {
        body: JSON.stringify({
          content: JSON.stringify({ layers: showLayersByDefault(nextLayers) }, null, 2),
          path: LAYERS_FILE_PATH,
          projectId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Failed to save layers.");
      void refreshWorkspace();
    }
  }

  function beginLayerTool(type: StratMapLayer["type"]) {
    if (!requestWriteAccess()) return;
    setActiveLayerTool((current) => (current === type ? null : type));
    setSelectedLayerId(null);
    setLayerEditorOpen(false);
    setSpatialFocus("note");
  }

  function selectLayer(layerId: string | null) {
    setSelectedLayerId(layerId);
    setLayerEditorOpen(Boolean(layerId));
    if (layerId) {
      setSpatialFocus("layer");
      setSelectedLayerFocusKey((key) => key + 1);
    } else {
      setSpatialFocus("note");
    }
  }

  function selectLayerFromSidebar(layerId: string) {
    setSelectedLayerId(layerId);
    setLayerEditorOpen(true);
    setSpatialFocus("layer");
    setSelectedLayerFocusKey((key) => key + 1);
  }

  function createLayer(layer: StratMapLayer) {
    if (!requestWriteAccess()) return;
    const count = index.layers?.length ?? 0;
    const label = layer.type === "range-ring" ? "Range ring" : layer.type === "line" ? "Line" : "Polygon";
    const nextLayer = {
      ...layer,
      color: layer.color || LAYER_COLORS[count % LAYER_COLORS.length],
      name: layer.name === label ? `${label} ${count + 1}` : layer.name,
      visible: true,
    };
    const nextLayers = [...(index.layers ?? []), nextLayer];
    setSelectedLayerId(nextLayer.id);
    setLayerEditorOpen(true);
    setSpatialFocus("layer");
    setActiveLayerTool(null);
    void persistLayers(nextLayers);
  }

  function updateLayer(nextLayer: StratMapLayer) {
    const nextLayers = (index.layers ?? []).map((layer) =>
      layer.id === nextLayer.id ? nextLayer : layer
    );
    void persistLayers(nextLayers);
  }

  function toggleLayer(layerId: string) {
    const layer = (index.layers ?? []).find((item) => item.id === layerId);
    const nextVisible = !(layer?.visible ?? false);
    const nextLayers = (index.layers ?? []).map((layer) =>
      layer.id === layerId ? { ...layer, visible: nextVisible } : layer
    );
    if (nextVisible) {
      selectLayer(layerId);
    } else if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
      setLayerEditorOpen(false);
      setSpatialFocus("note");
    }
    setIndex((prev) => ({ ...prev, layers: nextLayers }));
  }

  function deleteLayer(layerId: string) {
    const nextLayers = (index.layers ?? []).filter((layer) => layer.id !== layerId);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
      setLayerEditorOpen(false);
      setSpatialFocus("note");
    }
    void persistLayers(nextLayers);
  }

  async function createFile(folderPath: string, name: string) {
    if (!requestWriteAccess()) return;
    const fullPath = `${folderPath}/${name}`;
    const content = name.endsWith(".md") ? `# ${name.replace(/\.md$/, "")}\n` : "{}";
    await requestJson<WorkspaceFile>("/api/workspace/file", {
      body: JSON.stringify({ content, path: fullPath, projectId }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    await refreshWorkspace();
    await loadFile(fullPath);
  }

  async function createFolder(parentPath: string, name: string) {
    if (!requestWriteAccess()) return;
    await requestJson("/api/workspace/folder", {
      body: JSON.stringify({ folderPath: `${parentPath}/${name}`, projectId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    await refreshWorkspace();
  }

  async function deleteFile(filePath: string) {
    if (!requestWriteAccess()) return;
    await requestJson(
      `/api/workspace/file?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(filePath)}`,
      { method: "DELETE" }
    );
    await refreshWorkspace();
  }

  async function saveLocation(location: GeoLocation | null) {
    if (!requestWriteAccess()) return;
    const updated = await requestJson<WorkspaceFile>("/api/workspace/location", {
      body: JSON.stringify({ location, path: selectedFile.path, projectId }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    setSelectedFile(updated);
    // refresh index so the map point updates
    void refreshWorkspace();
  }

  async function handleAddMarker(coordinates: [number, number], markerTitle: string) {
    if (!requestWriteAccess()) return;
    const [lng, lat] = coordinates;
    const title = markerTitle.trim() || "Untitled marker";
    const content = `# ${title}\n`;

    // Filename includes a slug + timestamp, so the path stays readable while
    // still being collision-proof.
    const fileName = `${slugifyMarkerTitle(title)}-${Date.now()}.md`;
    const fullPath = `notes/${fileName}`;
    const label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // 1. Optimistic UI: marker, file-tree highlight, and selected header all
    //    update synchronously. The marker renders with a pending pulse.
    setPendingMarkers((prev) => [
      ...prev,
      { coordinates: [lng, lat], filePath: fullPath, label, pending: true, title },
    ]);
    // Seed the note with the chosen title immediately, so the new marker feels
    // named from birth rather than requiring a follow-up rename.
      setSelectedFile({
      content,
      extension: "md",
      kind: "note",
      location: { coordinates: [lng, lat], label },
      name: fileName,
      path: fullPath,
      size: 0,
      title,
      updatedAt: new Date().toISOString(),
    });
    setSelectedLayerId(null);
    setLayerEditorOpen(false);
    setSpatialFocus("note");
    setSelectedMarkerFocusKey((key) => key + 1);

    // 2. Persist in the background. Two sequential calls (file, then geo)
    //    because the location API rewrites the file with proper YAML
    //    frontmatter and needs the file to exist first.
    try {
      await requestJson<WorkspaceFile>("/api/workspace/file", {
        body: JSON.stringify({
          content,
          path: fullPath,
          projectId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      await requestJson<WorkspaceFile>("/api/workspace/location", {
        body: JSON.stringify({
          location: { coordinates: [lng, lat], label },
          path: fullPath,
          projectId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      // 3. Reconcile with server truth — index now contains the real point,
      //    so we drop our optimistic copy.
      const [latestIndex, newFile] = await Promise.all([
        requestJson<WorkspaceIndex>(workspaceIndexUrl),
        requestJson<WorkspaceFile>(fileUrl(fullPath)),
      ]);
      startTransition(() => {
        setIndex(latestIndex);
        setSelectedFile(newFile);
        setPendingMarkers((prev) => prev.filter((p) => p.filePath !== fullPath));
      });
    } catch (error) {
      // Rollback the optimistic marker on failure and surface the error.
      setPendingMarkers((prev) => prev.filter((p) => p.filePath !== fullPath));
      setWorkspaceError(error instanceof Error ? error.message : "Failed to create marker.");
    }
  }

  async function renameFile(fromPath: string, toPath: string) {
    if (!requestWriteAccess()) return;
    if (fromPath === toPath) return;

    // Optimistic: rewrite paths in the local index *before* the request so the
    // file tree, map markers, and selected file all update instantly.
    const previousIndex = index;
    const previousSelectedPath = selectedFile.path;
    const renamePath = (p: string) =>
      p === fromPath ? toPath : p.startsWith(`${fromPath}/`) ? `${toPath}${p.slice(fromPath.length)}` : p;

    setIndex((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.path === fromPath ? { ...f, name: toPath.split("/").pop() ?? f.name, path: toPath } : f
      ),
      folders: prev.folders.map(renamePath),
      mapPoints: prev.mapPoints.map((p) =>
        p.filePath === fromPath ? { ...p, filePath: toPath } : p
      ),
    }));
    if (selectedFile.path === fromPath) {
      setSelectedFile((f) => ({
        ...f,
        name: toPath.split("/").pop() ?? f.name,
        path: toPath,
      }));
    }

    try {
      await requestJson<WorkspaceFile>("/api/workspace/file", {
        body: JSON.stringify({ fromPath, projectId, toPath }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      await refreshWorkspace();
      if (previousSelectedPath === fromPath) await loadFile(toPath);
    } catch (error) {
      // Roll back on failure.
      setIndex(previousIndex);
      if (previousSelectedPath === fromPath) {
        await loadFile(previousSelectedPath);
      }
      setWorkspaceError(error instanceof Error ? error.message : "Rename failed.");
    }
  }

  async function saveNoteContent(content: string) {
    if (!requestWriteAccess()) return;
    setIsSavingNote(true);
    try {
      // The PUT endpoint preserves location/frontmatter as long as we don't
      // include it; we strip frontmatter on read, so we need to re-prepend it
      // here if the file has a location.
      const frontmatter = selectedFile.location
        ? `---\ngeo:\n  lat: ${selectedFile.location.coordinates[1]}\n  lng: ${selectedFile.location.coordinates[0]}${
            selectedFile.location.label ? `\n  label: ${JSON.stringify(selectedFile.location.label)}` : ""
          }\n---\n\n`
        : "";
      const updated = await requestJson<WorkspaceFile>("/api/workspace/file", {
        body: JSON.stringify({
          content: frontmatter + content,
          path: selectedFile.path,
          projectId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      setSelectedFile(updated);
      setDraftContent(stripFrontmatter(updated.content));
      setIsEditingNote(false);
      void refreshWorkspace();
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleCreateShare() {
    if (!isOwnerMode) return;
    if (currentProject.sharing?.isPublic) {
      setShareUrl(resolveShareUrl(currentProject.sharing.shareId));
      return;
    }

    setShareError(null);
    setIsCreatingShare(true);
    try {
      const payload = await requestJson<{
        project: Project;
        shareId: string;
        shareUrl: string;
      }>(`/api/projects/${encodeURIComponent(projectId)}/share`, {
        method: "POST",
      });
      setCurrentProject(payload.project);
      setShareUrl(payload.shareUrl || resolveShareUrl(payload.shareId));
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Unable to create share link.");
    } finally {
      setIsCreatingShare(false);
    }
  }

  async function handleCopyShareUrl() {
    const url = shareUrl || (currentProject.sharing?.shareId ? resolveShareUrl(currentProject.sharing.shareId) : "");
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedShareUrl(true);
    window.setTimeout(() => setCopiedShareUrl(false), 1400);
  }

  async function handleForkSharedProject() {
    if (!shareId) return;
    setIsForking(true);
    try {
      const payload = await requestJson<{ project: Project }>(
        `/api/shares/${encodeURIComponent(shareId)}/fork`,
        { method: "POST" }
      );
      router.push(`/project/${payload.project.id}`);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to fork notebook.");
      setIsForking(false);
    }
  }

  return (
    <main
      className="bg-[#081018] text-white"
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}
    >
      {/* Map layer — MapCanvas positions itself absolutely against this <main>. */}
      <MapCanvas
        activeLayerTool={activeLayerTool}
        layers={index.layers ?? []}
        onAddMarker={(coords, title) => { void handleAddMarker(coords, title); }}
        onBeginLayerTool={beginLayerTool}
        onCancelLayerTool={() => setActiveLayerTool(null)}
        onCreateLayer={createLayer}
        onDeleteLayer={deleteLayer}
        onDeleteMarker={(filePath) => {
          void deleteFile(filePath);
        }}
        onSelectLayer={selectLayer}
        onSelect={(filePath) => { void loadFile(filePath); }}
        onUpdateLayer={updateLayer}
        points={mapPoints}
        searchAction={
          isOwnerMode ? (
            <button
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-teal-300/24 bg-[rgba(12,49,46,0.82)] px-4 text-sm font-semibold text-teal-50 shadow-[0_22px_60px_-24px_rgba(45,212,191,0.45)] backdrop-blur-2xl transition-colors hover:border-teal-300/45 hover:bg-[rgba(14,67,62,0.9)]"
              onClick={openShareDialog}
              title="Create shareable link"
              type="button"
            >
              <Share2Icon className="size-4" />
              Share
            </button>
          ) : (
            <button
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/12 bg-[rgba(12,18,28,0.82)] px-4 text-sm font-semibold text-white/68 shadow-[0_22px_60px_-24px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-colors hover:border-teal-300/30 hover:bg-[rgba(14,35,38,0.88)] hover:text-teal-50"
              onClick={() => setGateDialogOpen(true)}
              title={gateMode === "sign-in" ? "Sign up to fork" : "Fork this notebook"}
              type="button"
            >
              {gateMode === "sign-in" ? <LockIcon className="size-4" /> : <GitForkIcon className="size-4" />}
              {gateMode === "sign-in" ? "Read-only" : "Fork"}
            </button>
          )
        }
        selectedLayerId={spatialFocus === "layer" ? selectedLayerId : null}
        selectedLayerFocusKey={selectedLayerFocusKey}
        selectedMarkerFocusKey={selectedMarkerFocusKey}
        selectedPath={spatialFocus === "note" ? selectedFile.path : ""}
        sidebarWidth={sidebarWidth}
      />

      {/* Floating panels overlay — only panels are pointer-interactive */}
      <div className="pointer-events-none absolute inset-0 flex gap-3 p-3">

        {/* ── Left: Workspace panel ── */}
        <aside
          className="pointer-events-auto relative flex h-full shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[rgba(6,11,17,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
          style={{ width: sidebarWidth }}
        >
          <div
            aria-label="Resize file sidebar"
            className="absolute top-0 right-0 z-30 h-full w-2 cursor-col-resize touch-none"
            onPointerDown={startSidebarResize}
            role="separator"
          >
            <div className="mx-auto h-full w-px bg-white/0 transition-colors hover:bg-teal-300/45" />
          </div>

          {/* Header */}
          <header className="shrink-0 border-b border-white/8 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Back to projects"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/85"
                onClick={() => router.push("/app")}
                title="Back to projects"
                type="button"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <div className="min-w-0 leading-none">
                <h1 className="truncate text-[14px] font-semibold leading-none tracking-[-0.01em] text-white/92">{currentProject.name}</h1>
              </div>
            </div>

            <div className="mt-3.5 flex gap-1.5">
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-white/25" />
                <Input
                  className="h-7 rounded-lg border-white/8 bg-white/4 pl-7 text-[11px] text-white placeholder:text-white/25 focus-visible:border-white/15 focus-visible:ring-0"
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder="Filter files…"
                  value={search}
                />
              </div>
            </div>
          </header>

          {/* File tree — flex-shrink-able, up to 40% of panel height */}
          <div className="min-h-0 shrink-0" style={{ maxHeight: "42%" }}>
            <FileTree
              files={filteredFiles}
              folders={visibleFolders}
              isPending={isPending}
              onCreateFile={createFile}
              onCreateFolder={createFolder}
              onDelete={deleteFile}
              onRefresh={refreshWorkspace}
              onRename={renameFile}
              onSelect={(path) => { void loadFile(path); }}
              pendingPaths={pendingPaths}
              readOnly={!isOwnerMode}
              selectedPath={selectedFile.path}
            />
          </div>

          <section className="shrink-0 border-t border-white/8 px-2 py-1.5">
            <button
              aria-expanded={!layersCollapsed}
              className="flex w-full items-center gap-1.5 rounded py-1 pl-2 text-left text-xs font-medium tracking-normal text-white/70 transition-colors hover:text-white/85"
              onClick={() => setLayersCollapsed((collapsed) => !collapsed)}
              type="button"
            >
              <ChevronRightIcon
                className={`size-3 shrink-0 text-white/35 transition-transform ${layersCollapsed ? "" : "rotate-90"}`}
              />
              <LayersIcon className="size-3.5 shrink-0 text-teal-300/70" />
              <span className="min-w-0 flex-1 truncate">layers</span>
              <span className="font-mono text-[9.5px] text-white/24">{index.layers?.length ?? 0}</span>
            </button>
            {!layersCollapsed ? (
              <>
                {(index.layers?.length ?? 0) > 0 ? (
                  <div className="stratmap-scroll mt-1 max-h-32 space-y-1 overflow-y-auto pr-1">
                    {(index.layers ?? []).map((layer) => (
                      <div
                        className={`group flex items-center gap-2 rounded-md py-1.5 pl-6 pr-1.5 text-[11px] transition-colors ${
                          selectedLayerId === layer.id
                            ? "bg-teal-300/[0.08] text-teal-50/80"
                            : "text-white/54 hover:bg-white/[0.045]"
                        }`}
                        key={layer.id}
                        onClick={() => selectLayerFromSidebar(layer.id)}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: layer.color, opacity: layer.visible ? 0.9 : 0.25 }}
                        />
                        <span className="min-w-0 flex-1 truncate">{layer.name}</span>
                        <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-white/22 sm:inline">
                          {layer.type === "range-ring" ? "ring" : layer.type}
                        </span>
                        {isOwnerMode ? (
                          <>
                            <button
                              aria-label={layer.visible ? "Hide layer" : "Show layer"}
                              className="rounded p-0.5 text-white/26 transition-colors hover:bg-white/8 hover:text-white/65"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleLayer(layer.id);
                              }}
                              type="button"
                            >
                              {layer.visible ? <EyeIcon className="size-3" /> : <EyeOffIcon className="size-3" />}
                            </button>
                            <button
                              aria-label="Delete layer"
                              className="rounded p-0.5 text-white/22 transition-colors hover:bg-rose-500/10 hover:text-rose-300/80"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteLayer(layer.id);
                              }}
                              type="button"
                            >
                              <Trash2Icon className="size-3" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-white/[0.075] px-2.5 py-2 text-[11px] leading-relaxed text-white/28">
                    Select a drawing tool, then draw directly on the map.
                  </p>
                )}
                {activeLayerTool ? (
                  <div className="mt-2 rounded-md border border-teal-300/15 bg-teal-300/[0.055] px-2.5 py-2 text-[10.5px] leading-relaxed text-teal-50/65">
                    {activeLayerTool === "range-ring"
                      ? "Click once to set the center, move your cursor to size it, click again to lock the radius."
                      : activeLayerTool === "line"
                      ? "Click to place points. Move your cursor to preview the next segment. Press Enter or double-click to finish."
                      : "Click to place vertices. Move your cursor to preview the next edge. Press Enter or double-click to finish."}
                  </div>
                ) : null}
              </>
            ) : null}
          </section>

          <Separator className="bg-white/6" />

          {/* File preview — takes remaining space */}
          <div className="stratmap-scroll min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
            {isLoadingFile ? (
              <div className="flex flex-col items-center justify-center gap-2 pt-10 text-white/25">
                <Loader2Icon className="size-4 animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.2em]">Loading</p>
              </div>
            ) : (
              <>
                {/* Note header — single source of truth: title + mapped chip.
                    Path/humanized name aren't repeated; metadata block below
                    carries coords; the body below carries the prose. */}
                <header className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate text-[13px] font-semibold leading-tight text-white/92">
                    {humanizeFilename(selectedFile.name)}
                  </h2>
                  {selectedFile.location ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-400/22 bg-teal-400/8 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-teal-200/80">
                      <MapPinIcon className="size-2.5" />
                      Mapped
                    </span>
                  ) : null}
                </header>
                {workspaceError ? (
                  <p className="mt-1 rounded-lg border border-rose-400/18 bg-rose-500/8 px-3 py-2 text-[11px] text-rose-200/80">
                    {workspaceError}
                  </p>
                ) : null}

                <FileMetadata
                  file={selectedFile}
                  onSaveLocation={saveLocation}
                  readOnly={!isOwnerMode}
                  onReadOnlyAction={() => setGateDialogOpen(true)}
                />

                {/* ── Note body: read or edit ── */}
                {selectedFile.extension === "md" ? (
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                        Note
                      </span>
                      {isEditingNote ? (
                        <div className="flex items-center gap-1">
                          <button
                            className="rounded p-0.5 text-white/30 transition-colors hover:bg-white/8 hover:text-white/65"
                            disabled={isSavingNote}
                            onClick={() => {
                              setDraftContent(stripFrontmatter(selectedFile.content));
                              setIsEditingNote(false);
                            }}
                            type="button"
                          >
                            <XIcon className="size-3" />
                          </button>
                          <button
                            className="rounded p-0.5 text-teal-300/70 transition-colors hover:bg-teal-400/10 hover:text-teal-300"
                            disabled={isSavingNote}
                            onClick={() => void saveNoteContent(draftContent)}
                            type="button"
                          >
                            {isSavingNote ? (
                              <Loader2Icon className="size-3 animate-spin" />
                            ) : (
                              <CheckIcon className="size-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="rounded p-0.5 text-white/30 transition-colors hover:bg-white/8 hover:text-white/65"
                          onClick={() => {
                            if (!requestWriteAccess()) return;
                            setDraftContent(stripFrontmatter(selectedFile.content));
                            setIsEditingNote(true);
                          }}
                          title="Edit note"
                          type="button"
                        >
                          <PencilIcon className="size-3" />
                        </button>
                      )}
                    </div>
                    {isEditingNote ? (
                      <textarea
                        autoFocus
                        className="block min-h-[16rem] w-full resize-y rounded-lg border border-white/10 bg-[rgba(8,14,22,0.7)] px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-white/85 outline-none transition-colors focus:border-teal-300/40 focus:bg-[rgba(10,18,28,0.85)]"
                        onChange={(e) => setDraftContent(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          // Cmd/Ctrl+Enter saves; Esc cancels.
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            void saveNoteContent(draftContent);
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setDraftContent(stripFrontmatter(selectedFile.content));
                            setIsEditingNote(false);
                          }
                        }}
                        placeholder="Write markdown…"
                        value={draftContent}
                      />
                    ) : (
                      <div className="prose-shell text-xs text-white/78">
                        {formatFileContent(selectedFile)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose-shell mt-3 text-xs text-white/78">
                    {formatFileContent(selectedFile)}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* ── Layer editor floating panel — anchored bottom-left next to sidebar ── */}
        {selectedLayer && isOwnerMode && layerEditorOpen ? (
          (() => {
            const layer = selectedLayer;
            const presetColors = LAYER_COLORS;
            const isCustomColor = !presetColors.some(
              (color) => color.toLowerCase() === layer.color.toLowerCase()
            );
            const typeLabel = layer.type === "range-ring" ? "ring" : layer.type;
            const numberInputClass =
              "h-7 w-full rounded-md border border-white/[0.06] bg-black/25 px-2 text-[11px] tabular-nums text-white/80 outline-none transition focus:border-teal-300/35 focus:bg-black/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]";

            return (
              <div
                className="pointer-events-auto absolute w-64 overflow-hidden rounded-xl border border-white/10 bg-[rgba(6,11,17,0.88)] shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
                style={{ left: sidebarWidth + 24, top: "50%", transform: "translateY(-50%)" }}
              >
                {/* Header — color swatch + name + type badge + close */}
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
                  <label
                    aria-label="Pick layer color"
                    className="relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 ring-white/15 transition hover:ring-white/35"
                    style={{ backgroundColor: layer.color }}
                  >
                    <input
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                      onChange={(event) => updateLayer({ ...layer, color: event.currentTarget.value })}
                      type="color"
                      value={layer.color}
                    />
                  </label>
                  <input
                    aria-label="Layer name"
                    className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-white/85 outline-none placeholder:text-white/20"
                    onChange={(event) => updateLayer({ ...layer, name: event.currentTarget.value })}
                    placeholder="Untitled"
                    value={layer.name}
                  />
                  <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/30">
                    {typeLabel}
                  </span>
                  <button
                    aria-label="Close layer editor"
                    className="ml-0.5 flex size-5 shrink-0 items-center justify-center rounded text-white/28 transition-colors hover:bg-white/8 hover:text-white/65"
                    onClick={() => setLayerEditorOpen(false)}
                    type="button"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>

                {/* Color presets */}
                <div className="border-b border-white/[0.04] px-3 py-2.5">
                  <p className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/30">
                    Color
                  </p>
                  <div className="flex items-center gap-1.5">
                    {presetColors.map((color) => {
                      const isActive = color.toLowerCase() === layer.color.toLowerCase();
                      return (
                        <button
                          aria-label={`Set color to ${color}`}
                          className={cn(
                            "size-4 rounded-full transition-transform hover:scale-110",
                            isActive
                              ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a121b]"
                              : "ring-1 ring-white/10"
                          )}
                          key={color}
                          onClick={() => updateLayer({ ...layer, color })}
                          style={{ backgroundColor: color }}
                          type="button"
                        />
                      );
                    })}
                    <label
                      aria-label="Custom color"
                      className={cn(
                        "relative flex size-4 cursor-pointer items-center justify-center rounded-full text-[8px] transition-transform hover:scale-110",
                        isCustomColor
                          ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a121b]"
                          : "border border-dashed border-white/25 text-white/35 hover:border-white/45 hover:text-white/65"
                      )}
                      style={isCustomColor ? { backgroundColor: layer.color } : undefined}
                    >
                      {!isCustomColor ? <span aria-hidden>+</span> : null}
                      <input
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                        onChange={(event) => updateLayer({ ...layer, color: event.currentTarget.value })}
                        type="color"
                        value={layer.color}
                      />
                    </label>
                  </div>
                </div>

                {/* Geometry */}
                {layer.type === "range-ring" ? (
                  <div className="space-y-3 px-3 py-2.5">
                    <div>
                      <p className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/30">
                        Center
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="relative">
                          <input
                            aria-label="Longitude"
                            className={cn(numberInputClass, "pr-7")}
                            onChange={(event) =>
                              updateLayer({ ...layer, center: [Number(event.currentTarget.value), layer.center[1]] })
                            }
                            step="any"
                            type="number"
                            value={layer.center[0]}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                            Lng
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            aria-label="Latitude"
                            className={cn(numberInputClass, "pr-7")}
                            onChange={(event) =>
                              updateLayer({ ...layer, center: [layer.center[0], Number(event.currentTarget.value)] })
                            }
                            step="any"
                            type="number"
                            value={layer.center[1]}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                            Lat
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/30">
                        Radius
                      </p>
                      <div className="relative">
                        <input
                          aria-label="Radius in kilometers"
                          className={cn(numberInputClass, "pr-8")}
                          min={0.25}
                          onChange={(event) =>
                            updateLayer({ ...layer, radiusKm: Number(event.currentTarget.value) })
                          }
                          step={1}
                          type="number"
                          value={Math.round(layer.radiusKm * 10) / 10}
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                          km
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2.5">
                    {layer.type === "polygon" ? (
                      <div className="mb-3 rounded-lg border border-white/[0.055] bg-black/15 px-2.5 py-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/30">
                            Fill opacity
                          </p>
                          <span className="font-mono text-[9px] tabular-nums text-white/38">
                            {Math.round((layer.opacity ?? 0.16) * 100)}%
                          </span>
                        </div>
                        <input
                          aria-label="Polygon fill opacity"
                          className="h-1.5 w-full cursor-pointer accent-teal-300"
                          max={0.6}
                          min={0}
                          onChange={(event) =>
                            updateLayer({ ...layer, opacity: Number(event.currentTarget.value) })
                          }
                          step={0.02}
                          type="range"
                          value={layer.opacity ?? 0.16}
                        />
                      </div>
                    ) : null}
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/30">
                        Vertices
                      </p>
                      <span className="font-mono text-[8.5px] tabular-nums text-white/30">
                        {layer.coordinates.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1rem_1fr_1fr] items-center gap-1.5 px-0.5 pb-1">
                      <span aria-hidden />
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/22">Lng</span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/22">Lat</span>
                    </div>
                    <div className="stratmap-scroll max-h-48 space-y-1 overflow-y-auto pr-0.5">
                      {layer.coordinates.map((coordinate, coordIndex) => (
                        <div className="grid grid-cols-[1rem_1fr_1fr] items-center gap-1.5" key={coordIndex}>
                          <span className="font-mono text-[9.5px] tabular-nums text-white/30">
                            {coordIndex + 1}
                          </span>
                          <input
                            aria-label={`Vertex ${coordIndex + 1} longitude`}
                            className="h-6 w-full rounded-md border border-white/[0.06] bg-black/25 px-1.5 text-[10.5px] tabular-nums text-white/72 outline-none transition focus:border-teal-300/35 focus:bg-black/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                            onChange={(event) => {
                              const coordinates = layer.coordinates.map((item, i) =>
                                i === coordIndex ? [Number(event.currentTarget.value), item[1]] as [number, number] : item
                              );
                              updateLayer({ ...layer, coordinates });
                            }}
                            step="any"
                            type="number"
                            value={coordinate[0]}
                          />
                          <input
                            aria-label={`Vertex ${coordIndex + 1} latitude`}
                            className="h-6 w-full rounded-md border border-white/[0.06] bg-black/25 px-1.5 text-[10.5px] tabular-nums text-white/72 outline-none transition focus:border-teal-300/35 focus:bg-black/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                            onChange={(event) => {
                              const coordinates = layer.coordinates.map((item, i) =>
                                i === coordIndex ? [item[0], Number(event.currentTarget.value)] as [number, number] : item
                              );
                              updateLayer({ ...layer, coordinates });
                            }}
                            step="any"
                            type="number"
                            value={coordinate[1]}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer hint */}
                <p className="border-t border-white/[0.04] bg-white/[0.015] px-3 py-1.5 text-[9.5px] leading-relaxed text-white/30">
                  Drag the teal handles on the map for faster editing.
                </p>
              </div>
            );
          })()
        ) : null}

        {/* ── Middle: transparent — map shows through ── */}
        <div className="flex-1" />

        {/* ── Right: Strategist panel ── fixed width so the chat input/messages
             can never push the panel wider than its slot. */}
        <div className="pointer-events-auto flex h-full w-[26rem] shrink-0">
          <ChatPanel
            accessMode={accessMode}
            onBlockedChat={() => setGateDialogOpen(true)}
            onSelectFile={(path) => {
              void loadFile(path);
            }}
            onWorkspaceRefresh={refreshWorkspace}
            projectId={projectId}
            selectedPath={selectedFile.path}
          />
        </div>
      </div>

      {isOwnerMode && !currentProject.onboardingComplete ? (
        <Onboarding
          onComplete={() => setCurrentProject((p) => ({ ...p, onboardingComplete: true }))}
          project={currentProject}
          projectId={projectId}
        />
      ) : null}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="border border-white/12 bg-[#071018] text-white shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
          <DialogHeader>
            <DialogTitle>Share this stratbook</DialogTitle>
            <DialogDescription className="text-white/45">
              Anyone with the link can browse the map and files. Editing and chat stay locked until
              they sign up and fork their own copy.
            </DialogDescription>
          </DialogHeader>

          {shareUrl ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <p className="truncate font-mono text-xs text-white/70">{shareUrl}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/45">
              Create a public read-only link for this notebook.
            </div>
          )}

          {shareError ? (
            <p className="rounded-lg border border-rose-400/18 bg-rose-500/8 px-3 py-2 text-xs text-rose-200/80">
              {shareError}
            </p>
          ) : null}

          <DialogFooter className="border-white/8 bg-white/[0.03]">
            {shareUrl ? (
              <Button
                className="bg-white text-slate-950 hover:bg-white/90"
                onClick={() => void handleCopyShareUrl()}
                type="button"
              >
                <CopyIcon className="size-3.5" />
                {copiedShareUrl ? "Copied" : "Copy link"}
              </Button>
            ) : (
              <Button
                className="bg-teal-300 text-slate-950 hover:bg-teal-200"
                disabled={isCreatingShare}
                onClick={() => void handleCreateShare()}
                type="button"
              >
                {isCreatingShare ? <Loader2Icon className="size-3.5 animate-spin" /> : <Share2Icon className="size-3.5" />}
                Create public link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={gateDialogOpen} onOpenChange={setGateDialogOpen}>
        <DialogContent className="overflow-hidden border border-white/12 bg-[#070c12] p-0 text-white shadow-[0_30px_100px_rgba(0,0,0,0.62)] sm:max-w-[44rem]">
          <div className="grid min-h-[21rem] md:grid-cols-[1.15fr_0.85fr]">
            <section className="relative overflow-hidden border-b border-white/8 px-6 py-6 md:border-r md:border-b-0">
              <div className="pointer-events-none absolute -top-28 -left-20 size-72 rounded-full bg-teal-300/12 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(94,234,212,0.10),transparent_34%),linear-gradient(150deg,rgba(255,255,255,0.045),transparent_55%)]" />

              <div className="relative">
                <div className="mb-8 flex size-12 items-center justify-center rounded-2xl border border-teal-300/22 bg-teal-300/9">
                  {gateMode === "sign-in" ? (
                    <LockIcon className="size-5 text-teal-100" />
                  ) : (
                    <GitForkIcon className="size-5 text-teal-100" />
                  )}
                </div>

                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-200/58">
                  Public notebook
                </p>
                <DialogTitle className="mt-3 max-w-[19rem] font-heading text-[2rem] leading-[1.02] tracking-[-0.045em] text-white">
                  {gateMode === "sign-in" ? "Keep this map, make it yours." : "Fork this map into your workspace."}
                </DialogTitle>
                <DialogDescription className="mt-4 max-w-[22rem] text-sm leading-relaxed text-white/52">
                  {gateMode === "sign-in"
                    ? "Public stratbooks are safe to read. To chat, add pins, or edit notes, create an account and fork a private copy."
                    : "You are viewing someone else's shared stratbook. Forking gives you an editable copy while the original stays untouched."}
                </DialogDescription>

                <div className="mt-7 space-y-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/32">
                    Unlocks after forking
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1">
                    {[
                      "Chat with the Strategist",
                      "Edit notes and files",
                      "Add pins and map context",
                    ].map((feature) => (
                      <div
                        className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5 text-xs text-white/62"
                        key={feature}
                      >
                        <CheckIcon className="size-3.5 shrink-0 text-teal-200/78" />
                        {feature}
                      </div>
                    ))}
                  </div>
              </div>
              </div>
            </section>

            <aside className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-5 py-5">
              <div>
                <div className="rounded-2xl border border-white/9 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white/88">
                    {gateMode === "sign-in" ? "Create a workspace first" : "Forking is non-destructive"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    {gateMode === "sign-in"
                      ? "After sign up, you can fork this public stratbook and continue from the same link."
                      : "Your fork becomes private and editable. The public notebook remains exactly as shared."}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-teal-300/16 bg-teal-300/[0.055] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal-100/62">
                    Current access
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Read-only</p>
                  <p className="mt-1 text-xs text-white/43">
                    Browse map, notes, and files without changing the source.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {gateMode === "sign-in" ? (
                  <Button
                    className="h-10 w-full bg-teal-300 text-slate-950 hover:bg-teal-200"
                    onClick={() => router.push(`/auth?next=${encodeURIComponent(authNext)}`)}
                    type="button"
                  >
                    Sign up to fork
                  </Button>
                ) : (
                  <Button
                    className="h-10 w-full bg-teal-300 text-slate-950 hover:bg-teal-200"
                    disabled={isForking}
                    onClick={() => void handleForkSharedProject()}
                    type="button"
                  >
                    {isForking ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <GitForkIcon className="size-3.5" />
                    )}
                    Fork into workspace
                  </Button>
                )}
              <Button
                className="h-10 w-full text-white/50 hover:bg-white/6 hover:text-white/78"
                onClick={() => setGateDialogOpen(false)}
                type="button"
                variant="ghost"
              >
                Keep browsing
              </Button>
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
