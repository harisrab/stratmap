"use client";

import type { WorkspaceFileSummary } from "@/lib/stratmap/types";
import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  ChevronRightIcon,
  FileJson2Icon,
  FilePlusIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  Loader2Icon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

export type TreeNode = {
  children: TreeNode[];
  file?: WorkspaceFileSummary;
  name: string;
  path: string;
  type: "directory" | "file";
};

type FileTreeProps = {
  files: WorkspaceFileSummary[];
  /** Folder paths from the workspace index (used to surface empty folders). */
  folders?: string[];
  isPending: boolean;
  onCreateFile: (folderPath: string, name: string) => Promise<void>;
  onCreateFolder: (folderPath: string, name: string) => Promise<void>;
  onDelete: (path: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onRename: (fromPath: string, toPath: string) => Promise<void>;
  onSelect: (path: string) => void;
  /** Paths that are not yet persisted on the server (rendered with a pulse). */
  pendingPaths?: ReadonlySet<string>;
  readOnly?: boolean;
  selectedPath: string;
};

// ─── tree builder ─────────────────────────────────────────────────────────────

export function buildFileTree(
  files: WorkspaceFileSummary[],
  folders: string[] = []
): TreeNode[] {
  const root: TreeNode[] = [];

  // Helper that walks/creates folder nodes along a path, returning the deepest
  // children array. Used by both the file pass and the folder pass so a path
  // present in either source produces the same node identity.
  function ensureFolderPath(folderPath: string): TreeNode[] {
    const parts = folderPath.split("/").filter(Boolean);
    let cursor = root;
    let currentPath = "";
    for (const segment of parts) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let node = cursor.find((item) => item.path === currentPath);
      if (!node) {
        node = {
          children: [],
          name: segment,
          path: currentPath,
          type: "directory",
        };
        cursor.push(node);
      }
      cursor = node.children;
    }
    return cursor;
  }

  // Pass 1: seed empty folders so they appear in the tree even when no file
  // lives inside them yet.
  for (const folder of folders) ensureFolderPath(folder);

  // Pass 2: place each file under its folder chain.
  for (const file of files) {
    const parts = file.path.split("/");
    const fileName = parts.pop()!;
    const folderPath = parts.join("/");
    const parent = folderPath ? ensureFolderPath(folderPath) : root;
    const fullPath = file.path;
    if (!parent.find((item) => item.path === fullPath)) {
      parent.push({
        children: [],
        file,
        name: fileName,
        path: fullPath,
        type: "file",
      });
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((left, right) => {
      if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(root);
  return root;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const RECENT_THRESHOLD_MS = 5 * 60 * 1000;

function isRecentFile(file: WorkspaceFileSummary) {
  if (!file.updatedAt) return false;
  return Date.now() - new Date(file.updatedAt).getTime() < RECENT_THRESHOLD_MS;
}

function FileIcon({ file }: { file: WorkspaceFileSummary }) {
  if (file.kind === "note") return <FileTextIcon className="size-3.5 shrink-0" />;
  return <FileJson2Icon className="size-3.5 shrink-0" />;
}

// ─── inline rename input ──────────────────────────────────────────────────────

function InlineInput({
  initial,
  onCancel,
  onCommit,
}: {
  initial: string;
  onCancel: () => void;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <input
      className="min-w-0 flex-1 rounded bg-white/10 px-1 py-0.5 text-xs text-white outline-none ring-1 ring-teal-400/50"
      onBlur={() => onCancel()}
      onChange={(e) => setValue(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onCommit(value.trim()); }
        if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }}
      ref={ref}
      value={value}
    />
  );
}

// ─── context menu ─────────────────────────────────────────────────────────────

type ContextMenuAction = "delete" | "new-file" | "new-folder" | "rename";

function ContextMenu({
  actions,
  onAction,
  onClose,
  x,
  y,
}: {
  actions: ContextMenuAction[];
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
  x: number;
  y: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const labels: Record<ContextMenuAction, { icon: React.ReactNode; label: string }> = {
    "delete": { icon: <Trash2Icon className="size-3" />, label: "Delete" },
    "new-file": { icon: <FilePlusIcon className="size-3" />, label: "New file" },
    "new-folder": { icon: <FolderPlusIcon className="size-3" />, label: "New folder" },
    "rename": { icon: <PencilIcon className="size-3" />, label: "Rename" },
  };

  // Portal to <body> because the workspace panel uses backdrop-filter, which
  // makes ancestor elements form a containing block for `position: fixed` —
  // combined with the panel's overflow-hidden, the menu would otherwise be
  // clipped. Portaling escapes that.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[1000] min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-[rgba(8,14,22,0.96)] py-1 shadow-[0_12px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      ref={ref}
      style={{ left: x, top: y }}
    >
      {actions.map((action) => {
        const { icon, label } = labels[action];
        return (
          <button
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
              action === "delete"
                ? "text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
                : "text-white/65 hover:bg-white/8 hover:text-white/90"
            )}
            key={action}
            onClick={() => { onAction(action); onClose(); }}
            type="button"
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function FileTree({
  files,
  folders,
  isPending,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRefresh,
  onRename,
  onSelect,
  pendingPaths,
  readOnly = false,
  selectedPath,
}: FileTreeProps): React.ReactNode {
  const tree = buildFileTree(files, folders);

  // Root folders start collapsed so the sidebar opens as a compact outline.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(tree.filter((node) => node.type === "directory").map((node) => node.path))
  );
  // paths whose delete request is in flight (per-row spinner)
  const [deletingPaths, setDeletingPaths] = useState<Set<string>>(new Set());
  // refresh in flight (root spinner)
  const [isRefreshing, setIsRefreshing] = useState(false);
  // which node is being renamed (path)
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  // which dir is creating a new entry { path, kind }
  const [creating, setCreating] = useState<{ kind: "file" | "folder"; path: string } | null>(null);
  // drag state
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  // context menu
  const [ctxMenu, setCtxMenu] = useState<{
    actions: ContextMenuAction[];
    node: TreeNode;
    x: number;
    y: number;
  } | null>(null);

  const toggleCollapsed = useCallback((path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // ── drag-and-drop ────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, filePath: string) {
    if (readOnly) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", filePath);
    setDragSource(filePath);
  }

  function handleDragOver(e: React.DragEvent, dirPath: string) {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragTarget(dirPath);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragTarget(null);
    }
  }

  async function handleDrop(e: React.DragEvent, targetDir: string) {
    if (readOnly) return;
    e.preventDefault();
    const source = e.dataTransfer.getData("text/plain") || dragSource;
    setDragTarget(null);
    setDragSource(null);
    if (!source) return;
    const fileName = source.split("/").pop()!;
    const toPath = `${targetDir}/${fileName}`;
    if (toPath !== source) await onRename(source, toPath);
  }

  // ── context menu open ────────────────────────────────────────────────────

  function openCtxMenu(e: React.MouseEvent, node: TreeNode) {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    const actions: ContextMenuAction[] =
      node.type === "directory"
        ? ["new-file", "new-folder", "rename", "delete"]
        : ["rename", "delete"];
    setCtxMenu({ actions, node, x: e.clientX, y: e.clientY });
  }

  async function performDelete(path: string) {
    setDeletingPaths((prev) => {
      const next = new Set(prev);
      next.add(path);
      return next;
    });
    try {
      await onDelete(path);
    } finally {
      setDeletingPaths((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    }
  }

  async function handleRefreshClick() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleCtxAction(action: ContextMenuAction, node: TreeNode) {
    if (action === "rename") { setRenamingPath(node.path); return; }
    if (action === "delete") { void performDelete(node.path); return; }
    if (action === "new-file") { setCreating({ kind: "file", path: node.path }); return; }
    if (action === "new-folder") { setCreating({ kind: "folder", path: node.path }); return; }
  }

  // ── commit rename ────────────────────────────────────────────────────────

  async function commitRename(node: TreeNode, newName: string) {
    setRenamingPath(null);
    if (!newName || newName === node.name) return;
    const lastSlash = node.path.lastIndexOf("/");
    const dir = lastSlash > -1 ? node.path.slice(0, lastSlash) : null;
    const toPath = dir ? `${dir}/${newName}` : newName;
    await onRename(node.path, toPath);
  }

  // ── render ───────────────────────────────────────────────────────────────

  function renderNode(node: TreeNode, depth = 0): React.ReactNode {
    const isCollapsed = collapsed.has(node.path);
    const isDragTarget = dragTarget === node.path;

    if (node.type === "directory") {
      const isRoot = depth === 0;
      const isFolderDeleting = deletingPaths.has(node.path);

      return (
        <div key={node.path}>
          {/* directory row */}
          <div
            className={cn(
              "group flex items-center gap-1.5 rounded py-1 text-xs font-medium tracking-normal transition-colors",
              isRoot ? "text-white/70" : "text-white/55",
              !isDragTarget && "hover:text-white/85",
              isDragTarget && "bg-teal-400/10 text-teal-200",
              isFolderDeleting && "pointer-events-none opacity-50"
            )}
            onContextMenu={readOnly ? undefined : (e) => openCtxMenu(e, node)}
            onDragLeave={handleDragLeave}
            onDragOver={readOnly ? undefined : (e) => handleDragOver(e, node.path)}
            onDrop={readOnly ? undefined : (e) => void handleDrop(e, node.path)}
            style={{ paddingLeft: 8 + depth * 12 }}
          >
            <button
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              onClick={() => toggleCollapsed(node.path)}
              type="button"
            >
              <ChevronRightIcon
                className={cn(
                  "size-3 shrink-0 text-white/35 transition-transform",
                  !isCollapsed && "rotate-90"
                )}
              />
              {isFolderDeleting ? (
                <Loader2Icon className="size-3.5 shrink-0 animate-spin text-rose-300/80" />
              ) : isCollapsed ? (
                <FolderIcon className="size-3.5 shrink-0 text-white/45" />
              ) : (
                <FolderOpenIcon className="size-3.5 shrink-0 text-teal-300/70" />
              )}
              {renamingPath === node.path ? (
                <InlineInput
                  initial={node.name}
                  onCancel={() => setRenamingPath(null)}
                  onCommit={(v) => void commitRename(node, v)}
                />
              ) : (
                <span className="flex-1 truncate">{node.name}</span>
              )}
            </button>

            <div className="flex shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover:opacity-100">
              {isRoot ? (
                <button
                  className={cn(
                    "rounded p-0.5 transition-colors hover:bg-white/8 hover:text-white/55",
                    (isRefreshing || isPending) && "opacity-100 text-teal-300/80"
                  )}
                  onClick={(e) => { e.stopPropagation(); void handleRefreshClick(); }}
                  title="Refresh"
                  type="button"
                >
                  <RefreshCwIcon
                    className={cn("size-3", (isRefreshing || isPending) && "animate-spin")}
                  />
                </button>
              ) : null}
              {!readOnly ? (
                <>
                  <button
                    className="rounded p-0.5 transition-colors hover:bg-white/8 hover:text-white/55"
                    onClick={(e) => { e.stopPropagation(); setCreating({ kind: "file", path: node.path }); }}
                    title="New file"
                    type="button"
                  >
                    <FilePlusIcon className="size-3" />
                  </button>
                  <button
                    className="rounded p-0.5 transition-colors hover:bg-white/8 hover:text-white/55"
                    onClick={(e) => { e.stopPropagation(); openCtxMenu(e, node); }}
                    title="More"
                    type="button"
                  >
                    <MoreHorizontalIcon className="size-3" />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* children */}
          {!isCollapsed && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderNode(child, depth + 1))}
              {/* new-entry input inside this dir */}
              {!readOnly && creating?.path === node.path ? (
                <div
                  className="flex items-center gap-2 py-1"
                  style={{ paddingLeft: 14 + (depth + 1) * 12 }}
                >
                  {creating.kind === "file"
                    ? <FileTextIcon className="size-3.5 shrink-0 text-white/28" />
                    : <FolderIcon className="size-3 shrink-0 text-white/28" />}
                  <InlineInput
                    initial={creating.kind === "file" ? "untitled.md" : "new-folder"}
                    onCancel={() => setCreating(null)}
                    onCommit={async (name) => {
                      setCreating(null);
                      if (!name) return;
                      if (creating.kind === "file") await onCreateFile(node.path, name);
                      else await onCreateFolder(node.path, name);
                    }}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      );
    }

    // ── file node ──────────────────────────────────────────────────────────

    const file = node.file!;
    const isSelected = file.path === selectedPath;
    const isDeleting = deletingPaths.has(file.path);
    const isPendingRow = pendingPaths?.has(file.path) ?? false;

    return (
      <button
        className={cn(
          "group flex w-full items-center gap-2 rounded py-1.5 text-left text-xs transition-colors",
          isSelected
            ? "bg-white/10 text-white"
            : "text-white/45 hover:bg-white/6 hover:text-white/78",
          dragSource === file.path && "opacity-40",
          isDragTarget && "ring-1 ring-teal-400/40",
          isDeleting && "pointer-events-none opacity-50",
          isPendingRow && "stratmap-row-pulse"
        )}
        disabled={isDeleting}
        draggable={!readOnly && !isDeleting && !isPendingRow}
        key={file.path}
        onClick={() => { if (!isDeleting && !isPendingRow) void onSelect(file.path); }}
        onContextMenu={readOnly ? undefined : (e) => openCtxMenu(e, node)}
        onDragEnd={() => { setDragSource(null); setDragTarget(null); }}
        onDragStart={(e) => handleDragStart(e, file.path)}
        style={{ paddingLeft: 14 + depth * 12, paddingRight: 8 }}
        type="button"
      >
        <span className={cn("shrink-0", isSelected ? "text-teal-300" : "text-white/28")}>
          {isDeleting ? (
            <Loader2Icon className="size-3.5 animate-spin text-rose-300/80" />
          ) : (
            <FileIcon file={file} />
          )}
        </span>

        {renamingPath === node.path ? (
          <InlineInput
            initial={node.name}
            onCancel={() => setRenamingPath(null)}
            onCommit={(v) => void commitRename(node, v)}
          />
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
            {/* Show the actual filename, not the frontmatter title — so
                rename feels direct ("kohistan-road.md" really is what's
                stored on disk). The map gets the humanized version. */}
            {node.name}
            {isPendingRow ? (
              <span className="ml-1.5 text-[10px] text-white/35 italic">saving…</span>
            ) : null}
          </span>
        )}

        {file.location && renamingPath !== node.path ? (
          <MapPinIcon
            className={cn(
              "size-3 shrink-0",
              isPendingRow ? "text-sky-300/70" : "text-teal-400/55"
            )}
          />
        ) : null}
        {isRecentFile(file) && renamingPath !== node.path && !isPendingRow ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-teal-400/80"
            title="Modified recently"
          />
        ) : null}
      </button>
    );
  }

  return (
    <div className="stratmap-scroll h-full overflow-y-auto px-2 py-1.5">
      <div className="space-y-0.5">
        {tree.map((node) => renderNode(node))}
      </div>

      {ctxMenu ? (
        <ContextMenu
          actions={ctxMenu.actions}
          onAction={(action) => handleCtxAction(action, ctxMenu.node)}
          onClose={() => setCtxMenu(null)}
          x={ctxMenu.x}
          y={ctxMenu.y}
        />
      ) : null}
    </div>
  );
}
