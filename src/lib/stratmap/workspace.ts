import "server-only";

import { getMapboxToken, getSupabaseConfig, hasSupabaseStorageConfig } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import path from "node:path";

import { MAX_PROJECT_NAME_LENGTH } from "./constants";
import { renderCoverImage } from "./cover-image";
import {
  EXAMPLE_PUBLIC_OWNER_ID,
  exampleStratbooks,
  getExampleByShareId,
  getExampleVersion,
  type ExampleStratbook,
  type ExampleStratbookNote,
} from "./example-stratbooks";
import type {
  GeoLocation,
  LngLat,
  Project,
  ShareManifest,
  StratMapLayer,
  WorkspaceFile,
  WorkspaceFileKind,
  WorkspaceFileSummary,
  WorkspaceIndex,
  WorkspaceMapPoint,
  WorkspaceSearchHit,
} from "./types";

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your .env.local file."
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

// ─── Supabase client ──────────────────────────────────────────────────────────

function getSupabaseClient() {
  const config = getSupabaseConfig();
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

// ─── Path utilities ───────────────────────────────────────────────────────────

const ALLOWED_WORKSPACE_ROOTS = new Set(["notes", "scenarios", "data", "layers"]);
const DEFAULT_FILE_NAME = "notes/welcome.md";
const LAYERS_FILE_NAME = "layers/stratbook-layers.json";
const COVER_IMAGE_HEIGHT = 630;
const COVER_IMAGE_WIDTH = 1200;
const COVER_IMAGE_STYLE_VERSION = "image-response-dark-scrim-v4";
const SHARE_MANIFEST_PREFIX = "_public/shares";
export const STRATEGIST_MONTHLY_MESSAGE_LIMIT = 500;

function validateProjectId(id: string): void {
  if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    throw new Error(`Invalid project ID.`);
  }
}

function validateShareId(id: string): void {
  if (!id || !/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
    throw new Error("Invalid share ID.");
  }
}

function validateOwnerId(id: string): void {
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    throw new Error("Invalid owner ID.");
  }
}

function validateProjectName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required.");
  if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
    throw new Error(
      `Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or fewer.`
    );
  }
  return trimmed;
}

function projectStoragePrefix(ownerId: string, projectId?: string) {
  validateOwnerId(ownerId);
  if (!projectId) return ownerId;
  validateProjectId(projectId);
  return `${ownerId}/${projectId}`;
}

function shareManifestPath(shareId: string) {
  validateShareId(shareId);
  return `${SHARE_MANIFEST_PREFIX}/${shareId}.json`;
}

function prettifyName(value: string) {
  return value
    .replace(/\.json$|\.md$/i, "")
    .replaceAll(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferWorkspaceKind(filePath: string): WorkspaceFileKind {
  if (filePath.startsWith("notes/")) return "note";
  if (filePath.startsWith("scenarios/")) return "scenario";
  return "data";
}

function normalizeWorkspacePath(input: string) {
  const normalized = path.posix.normalize(input).replace(/^\/+/, "");
  const [root] = normalized.split("/");

  if (!ALLOWED_WORKSPACE_ROOTS.has(root) || normalized.startsWith("../")) {
    throw new Error(`Unsupported workspace path: ${input}`);
  }

  return normalized;
}

function extractHeadingTitle(markdown: string, fallbackPath: string) {
  const parsed = matter(markdown);
  if (typeof parsed.data.title === "string") return parsed.data.title;
  const firstHeading = parsed.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (firstHeading) return firstHeading;
  return prettifyName(path.posix.basename(fallbackPath));
}

function extractJsonTitle(content: string, fallbackPath: string) {
  try {
    const parsed = JSON.parse(content) as { name?: string; id?: string };
    return parsed.name || parsed.id || prettifyName(path.posix.basename(fallbackPath));
  } catch {
    return prettifyName(path.posix.basename(fallbackPath));
  }
}

function parseLayers(content: string): StratMapLayer[] {
  try {
    const parsed = JSON.parse(content) as { layers?: unknown } | unknown[];
    const rawLayers = Array.isArray(parsed) ? parsed : parsed.layers;
    if (!Array.isArray(rawLayers)) return [];
    return rawLayers.flatMap((layer): StratMapLayer[] => {
      if (!layer || typeof layer !== "object") return [];
      const candidate = layer as Partial<StratMapLayer>;
      const isBaseLayer =
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.color === "string" &&
        typeof candidate.createdAt === "string" &&
        (candidate.type === "polygon" || candidate.type === "line" || candidate.type === "range-ring");
      if (!isBaseLayer) return [];
      return [{ ...candidate, visible: candidate.visible === true } as StratMapLayer];
    });
  } catch {
    return [];
  }
}

// ─── Location extraction ──────────────────────────────────────────────────────

function extractLocationFromMarkdown(content: string): GeoLocation | undefined {
  try {
    const { data } = matter(content);
    const geo = data.geo as unknown;
    if (!geo || typeof geo !== "object") return undefined;
    const { lat, lng, label } = geo as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number") return undefined;
    return { coordinates: [lng, lat], label: typeof label === "string" ? label : undefined };
  } catch {
    return undefined;
  }
}

function extractLocationFromJson(content: string): GeoLocation | undefined {
  try {
    const parsed = JSON.parse(content) as { _geo?: unknown };
    const geo = parsed._geo;
    if (!geo || typeof geo !== "object") return undefined;
    const { lat, lng, label } = geo as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number") return undefined;
    return { coordinates: [lng, lat], label: typeof label === "string" ? label : undefined };
  } catch {
    return undefined;
  }
}

// ─── Frontmatter write ────────────────────────────────────────────────────────

function setMarkdownGeo(content: string, geo: GeoLocation | null): string {
  const parsed = matter(content);
  if (geo) {
    const [lng, lat] = geo.coordinates;
    parsed.data.geo = { lat, lng, ...(geo.label ? { label: geo.label } : {}) };
  } else {
    delete parsed.data.geo;
  }
  return matter.stringify(parsed.content, parsed.data);
}

function setJsonGeo(content: string, geo: GeoLocation | null): string {
  const parsed = JSON.parse(content) as Record<string, unknown>;
  if (geo) {
    const [lng, lat] = geo.coordinates;
    parsed._geo = { lat, lng, ...(geo.label ? { label: geo.label } : {}) };
  } else {
    delete parsed._geo;
  }
  return JSON.stringify(parsed, null, 2);
}

function toIsoDate(input: string | undefined) {
  if (!input) return new Date(0).toISOString();
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function sortWorkspaceFiles(files: WorkspaceFileSummary[]) {
  const kindOrder: Record<WorkspaceFileKind, number> = { data: 2, note: 0, scenario: 1 };
  return [...files].sort((a, b) => {
    const delta = kindOrder[a.kind] - kindOrder[b.kind];
    return delta !== 0 ? delta : a.path.localeCompare(b.path);
  });
}

function getMapPointHash(points: WorkspaceMapPoint[], layers: StratMapLayer[]) {
  const stablePoints = points
    .map((point) => ({
      coordinates: point.coordinates.map((value) => Number(value.toFixed(6))),
      filePath: point.filePath,
      title: point.title,
    }))
    .sort((left, right) => left.filePath.localeCompare(right.filePath));
  const stableLayers = layers
    .map((layer) => {
      const base = {
        color: layer.color,
        id: layer.id,
        name: layer.name,
        type: layer.type,
      };
      if (layer.type === "range-ring") {
        return {
          ...base,
          center: layer.center.map((value) => Number(value.toFixed(6))),
          radiusKm: Number(layer.radiusKm.toFixed(3)),
        };
      }
      return {
        ...base,
        coordinates: layer.coordinates.map((coordinate) =>
          coordinate.map((value) => Number(value.toFixed(6)))
        ),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  return createHash("sha256")
    .update(JSON.stringify({ layers: stableLayers, points: stablePoints }))
    .digest("hex")
    .slice(0, 16);
}

function offsetCoordinate([lng, lat]: LngLat, eastKm: number, northKm: number): LngLat {
  const latOffset = northKm / 111.32;
  const lngOffset = eastKm / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  return [lng + lngOffset, lat + latOffset];
}

function circleCoordinates(center: LngLat, radiusKm: number): LngLat[] {
  const points: LngLat[] = [];
  for (let i = 0; i <= 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2;
    points.push(roundCoordinate(offsetCoordinate(center, Math.cos(angle) * radiusKm, Math.sin(angle) * radiusKm)));
  }
  return points;
}

function radiusHandle(layer: Extract<StratMapLayer, { type: "range-ring" }>): LngLat {
  return offsetCoordinate(layer.center, layer.radiusKm, 0);
}

function isFiniteCoordinate(coordinate: LngLat) {
  return Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]);
}

function roundCoordinate(coordinate: LngLat): LngLat {
  return [
    Number(coordinate[0].toFixed(5)),
    Number(coordinate[1].toFixed(5)),
  ];
}

function buildLayerCoverFeatures(layers: StratMapLayer[]) {
  const features: GeoJSON.Feature[] = [];
  for (const layer of layers.slice(0, 12)) {
    const strokeProperties = {
      "stroke": layer.color,
      "stroke-opacity": 0.9,
      "stroke-width": layer.type === "range-ring" ? 2 : 3,
    };

    if (layer.type === "range-ring") {
      if (!isFiniteCoordinate(layer.center) || !Number.isFinite(layer.radiusKm) || layer.radiusKm <= 0) continue;
      const edge = radiusHandle(layer);
      features.push({
        geometry: { coordinates: circleCoordinates(layer.center, layer.radiusKm), type: "LineString" },
        properties: strokeProperties,
        type: "Feature",
      });
      features.push({
        geometry: { coordinates: [roundCoordinate(layer.center), roundCoordinate(edge)], type: "LineString" },
        properties: {
          ...strokeProperties,
          "stroke-opacity": 0.38,
          "stroke-width": 1,
        },
        type: "Feature",
      });
      continue;
    }

    const coordinates = layer.coordinates.filter(isFiniteCoordinate).map(roundCoordinate);
    if (layer.type === "line") {
      if (coordinates.length < 2) continue;
      features.push({
      geometry: { coordinates, type: "LineString" },
        properties: strokeProperties,
        type: "Feature",
      });
      continue;
    }

    if (coordinates.length < 3) continue;
    const ring =
      coordinates[0] && coordinates.at(-1)?.join(",") !== coordinates[0].join(",")
        ? [...coordinates, coordinates[0]]
        : coordinates;
    features.push({
      geometry: { coordinates: [ring], type: "Polygon" },
      properties: {
        "fill": layer.color,
        "fill-opacity": 0.2,
        ...strokeProperties,
      },
      type: "Feature",
    });
  }
  return features;
}

function buildMapboxCoverUrl(points: WorkspaceMapPoint[], layers: StratMapLayer[]) {
  const token = getMapboxToken();
  if (!token) throw new Error("Missing MAPBOX_TOKEN or NEXT_PUBLIC_MAPBOX_TOKEN.");

  const base = "https://api.mapbox.com/styles/v1/mapbox/dark-v11/static";
  const size = `${COVER_IMAGE_WIDTH}x${COVER_IMAGE_HEIGHT}`;
  const params = new URLSearchParams({
    access_token: token,
    attribution: "false",
    logo: "false",
    padding: "90,90,90,90",
  });

  const features: GeoJSON.Feature[] = [
    ...buildLayerCoverFeatures(layers),
    ...points.slice(0, 80).map((point) => ({
      geometry: {
        coordinates: roundCoordinate(point.coordinates),
        type: "Point" as const,
      },
      properties: {
        "marker-color": "#5eead4",
        "marker-size": "small",
      },
      type: "Feature" as const,
    })),
  ];

  if (features.length === 0) {
    return `${base}/0,20,1.35/${size}?${params.toString()}`;
  }

  const featureCollection = {
    features,
    type: "FeatureCollection",
  };
  const overlay = `geojson(${encodeURIComponent(JSON.stringify(featureCollection))})`;
  return `${base}/${overlay}/auto/${size}?${params.toString()}`;
}

function getCoverTitleHash(title: string) {
  return createHash("sha256").update(title.trim()).digest("hex").slice(0, 8);
}

// ─── Low-level storage primitives ────────────────────────────────────────────

async function storageDownload(storagePath: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);
  if (error) throw error;
  return data.text();
}

async function storageDownloadBinary(storagePath: string): Promise<Blob> {
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);
  if (error) throw error;
  return data;
}

async function storageUpload(
  storagePath: string,
  content: string,
  contentType: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, new Blob([content], { type: contentType }), {
      contentType,
      upsert: true,
    });
  if (error) throw error;
}

async function storageUploadBinary(
  storagePath: string,
  content: Blob,
  contentType: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { error } = await supabase.storage.from(bucket).upload(storagePath, content, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
}

interface RawStorageEntry {
  path: string;
  size: number;
  updatedAt: string;
}

async function storageListRecursive(
  prefix: string,
  // Collected as a side effect so we can surface empty folders in the file
  // tree. Storage represents them as `…/.gitkeep` placeholder files.
  folderPaths?: string[]
): Promise<RawStorageEntry[]> {
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;

  const entries: RawStorageEntry[] = [];
  for (const entry of data ?? []) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const isDirectory = entry.id === null && entry.metadata === null;
    if (isDirectory) {
      folderPaths?.push(fullPath);
      entries.push(...(await storageListRecursive(fullPath, folderPaths)));
    } else {
      entries.push({
        path: fullPath,
        size: typeof entry.metadata?.size === "number" ? entry.metadata.size : 0,
        updatedAt: toIsoDate(entry.updated_at ?? entry.created_at ?? undefined),
      });
    }
  }
  return entries;
}

async function storageListRootFolders(ownerId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { data, error } = await supabase.storage.from(bucket).list(projectStoragePrefix(ownerId), {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return (data ?? [])
    .filter((entry) => entry.id === null && entry.metadata === null)
    .map((entry) => entry.name);
}

// ─── Project management ───────────────────────────────────────────────────────

async function readProjectJson(ownerId: string, projectId: string): Promise<Project> {
  const text = await storageDownload(`${projectStoragePrefix(ownerId, projectId)}/project.json`);
  return JSON.parse(text) as Project;
}

async function writeProjectJson(ownerId: string, project: Project): Promise<void> {
  await storageUpload(
    `${projectStoragePrefix(ownerId, project.id)}/project.json`,
    JSON.stringify(project, null, 2),
    "application/json; charset=utf-8"
  );
}

async function touchProjectUpdatedAt(ownerId: string, projectId: string): Promise<void> {
  const project = await readProjectJson(ownerId, projectId);
  await writeProjectJson(ownerId, { ...project, updatedAt: new Date().toISOString() });
}

export interface ChatUsageSnapshot {
  count: number;
  limit: number;
  month: string;
  remaining: number;
}

export interface ChatThreadSummary {
  createdAt: string;
  id: string;
  messageCount: number;
  title: string;
  updatedAt: string;
}

export class ChatUsageLimitError extends Error {
  usage: ChatUsageSnapshot;

  constructor(usage: ChatUsageSnapshot) {
    super(`You have used all ${usage.limit} Strategist messages for ${usage.month}.`);
    this.name = "ChatUsageLimitError";
    this.usage = usage;
  }
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function inferChatThreadTitle(messages: UIMessage[]) {
  const firstUserText = messages
    .find((message) => message.role === "user")
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
  if (!firstUserText) return "Strategist thread";
  return firstUserText.length > 48 ? `${firstUserText.slice(0, 45).trim()}...` : firstUserText;
}

function toChatThreadSummary(row: {
  created_at: string;
  id: string;
  messages: unknown;
  title: string | null;
  updated_at: string;
}): ChatThreadSummary {
  return {
    createdAt: row.created_at,
    id: row.id,
    messageCount: Array.isArray(row.messages) ? row.messages.length : 0,
    title: row.title || "Strategist thread",
    updatedAt: row.updated_at,
  };
}

export async function listProjectChatThreads(
  ownerId: string,
  projectId: string
): Promise<ChatThreadSummary[]> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stratbook_chat_threads")
    .select("created_at,id,messages,title,updated_at")
    .eq("owner_id", ownerId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toChatThreadSummary);
}

export async function createProjectChatThread(input: {
  ownerId: string;
  projectId: string;
  title?: string;
}): Promise<ChatThreadSummary> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(input.ownerId);
  validateProjectId(input.projectId);

  const now = new Date().toISOString();
  const thread = {
    created_at: now,
    id: nanoid(10),
    messages: [],
    owner_id: input.ownerId,
    project_id: input.projectId,
    title: input.title?.trim() || "New thread",
    updated_at: now,
  };

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stratbook_chat_threads")
    .insert(thread)
    .select("created_at,id,messages,title,updated_at")
    .single();

  if (error) throw error;
  return toChatThreadSummary(data);
}

export async function readProjectChatMessages(
  ownerId: string,
  projectId: string,
  threadId = "default"
): Promise<UIMessage[]> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);
  validateProjectId(threadId);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stratbook_chat_threads")
    .select("messages")
    .eq("owner_id", ownerId)
    .eq("project_id", projectId)
    .eq("id", threadId)
    .maybeSingle();

  if (error) throw error;
  const messages = data?.messages;
  return Array.isArray(messages) ? (messages as UIMessage[]) : [];
}

export async function writeProjectChatMessages(
  ownerId: string,
  projectId: string,
  threadId: string,
  messages: UIMessage[]
): Promise<void> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);
  validateProjectId(threadId);

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("stratbook_chat_threads").upsert(
    {
      id: threadId,
      messages: messages.slice(-80),
      owner_id: ownerId,
      project_id: projectId,
      title: inferChatThreadTitle(messages),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,project_id,id" }
  );
  if (error) throw error;
}

export async function getChatUsage(
  ownerId: string,
  date = new Date()
): Promise<ChatUsageSnapshot> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);

  const month = monthKey(date);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stratbook_chat_usage")
    .select("message_count,message_limit")
    .eq("owner_id", ownerId)
    .eq("month", `${month}-01`)
    .maybeSingle();

  if (error) throw error;
  return {
    count: Math.max(0, Number(data?.message_count ?? 0)),
    limit: Number(data?.message_limit ?? STRATEGIST_MONTHLY_MESSAGE_LIMIT),
    month,
    remaining: Math.max(
      0,
      Number(data?.message_limit ?? STRATEGIST_MONTHLY_MESSAGE_LIMIT) -
        Number(data?.message_count ?? 0)
    ),
  };
}

export async function recordChatMessageUse(
  ownerId: string,
  projectId: string,
  date = new Date()
): Promise<ChatUsageSnapshot> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("stratbook_record_chat_message_use", {
    p_limit: STRATEGIST_MONTHLY_MESSAGE_LIMIT,
    p_owner_id: ownerId,
    p_project_id: projectId,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const usage = {
    count: Number(row?.out_count ?? 0),
    limit: Number(row?.out_message_limit ?? STRATEGIST_MONTHLY_MESSAGE_LIMIT),
    month: String(row?.out_month ?? monthKey(date)),
    remaining: Math.max(0, Number(row?.out_remaining ?? 0)),
  };

  if (!row?.out_accepted) {
    throw new ChatUsageLimitError(usage);
  }

  return usage;
}

async function readShareManifestJson(shareId: string): Promise<ShareManifest> {
  validateShareId(shareId);
  const text = await storageDownload(shareManifestPath(shareId));
  return JSON.parse(text) as ShareManifest;
}

async function writeShareManifestJson(manifest: ShareManifest): Promise<void> {
  await storageUpload(
    shareManifestPath(manifest.shareId),
    JSON.stringify(manifest, null, 2),
    "application/json; charset=utf-8"
  );
}

function renderExampleNote(note: ExampleStratbookNote) {
  if (!note.geo) return note.body;
  return [
    "---",
    "geo:",
    `  lat: ${note.geo.lat}`,
    `  lng: ${note.geo.lng}`,
    `  label: ${JSON.stringify(note.geo.label)}`,
    "---",
    "",
    note.body,
  ].join("\n");
}

async function seedExampleProject(
  ownerId: string,
  example: ExampleStratbook,
  options: { publicShare: boolean }
): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    createdAt: "2026-04-28T00:00:00.000Z",
    description: example.description,
    exampleVersion: getExampleVersion(example),
    id: example.id,
    name: example.title,
    onboardingComplete: true,
    updatedAt: now,
    ...(options.publicShare
      ? {
          sharing: {
            createdAt: now,
            isPublic: true,
            shareId: example.shareId,
            updatedAt: now,
          },
        }
      : {}),
  };

  await writeProjectJson(ownerId, project);
  await Promise.all(
    example.notes.map((note) =>
      writeProjectFile(ownerId, example.id, `notes/${note.filename}`, renderExampleNote(note))
    )
  );

  if (options.publicShare) {
    await writeShareManifestJson({
      createdAt: now,
      ownerId,
      projectId: example.id,
      shareId: example.shareId,
    });
  }

  return project;
}

async function projectExists(ownerId: string, projectId: string) {
  try {
    await readProjectJson(ownerId, projectId);
    return true;
  } catch {
    return false;
  }
}

export async function listProjects(ownerId: string): Promise<Project[]> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  const folders = await storageListRootFolders(ownerId);
  const results = await Promise.allSettled(folders.map((id) => readProjectJson(ownerId, id)));
  return results
    .filter((r): r is PromiseFulfilledResult<Project> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function ensureExampleStratbooks(ownerId: string): Promise<void> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  await Promise.all(
    exampleStratbooks.map(async (example) => {
      if (await projectExists(ownerId, example.id)) return;
      await seedExampleProject(ownerId, example, { publicShare: false });
    })
  );
}

export async function ensurePublicExampleStratbooks(): Promise<void> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  await Promise.all(
    exampleStratbooks.map(async (example) => {
      const exists = await projectExists(EXAMPLE_PUBLIC_OWNER_ID, example.id);
      if (!exists) {
        await seedExampleProject(EXAMPLE_PUBLIC_OWNER_ID, example, { publicShare: true });
        return;
      }

      const project = await readProjectJson(EXAMPLE_PUBLIC_OWNER_ID, example.id);
      if (
        project.exampleVersion !== getExampleVersion(example) ||
        !project.sharing?.isPublic ||
        project.sharing.shareId !== example.shareId
      ) {
        await seedExampleProject(EXAMPLE_PUBLIC_OWNER_ID, example, { publicShare: true });
        return;
      }

      try {
        await readShareManifestJson(example.shareId);
      } catch {
        await writeShareManifestJson({
          createdAt: project.sharing.createdAt,
          ownerId: EXAMPLE_PUBLIC_OWNER_ID,
          projectId: example.id,
          shareId: example.shareId,
        });
      }
    })
  );
}

export async function getProject(ownerId: string, projectId: string): Promise<Project> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateProjectId(projectId);
  return readProjectJson(ownerId, projectId);
}

export async function createProject(input: {
  ownerId: string;
  name: string;
  description?: string;
}): Promise<Project> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(input.ownerId);

  const now = new Date().toISOString();
  const project: Project = {
    createdAt: now,
    id: nanoid(10),
    name: validateProjectName(input.name),
    description: input.description?.trim() || undefined,
    onboardingComplete: false,
    updatedAt: now,
  };

  await writeProjectJson(input.ownerId, project);

  const welcomeNote = [
    `# ${project.name}`,
    "",
    project.description ? `${project.description}\n` : "",
    "Welcome to your stratbook — a strategic notebook anchored to the world. Organize notes, scenario definitions, and geographic data, all tied to the map.",
    "",
    "## Structure",
    "",
    "- **notes/** — Analysis, situation reports, and feature notes",
    "- **scenarios/** — Scenario definitions linking data to a named context",
    "- **data/** — GeoJSON-style map data files",
    "",
    "The Strategist on the right can help you create, update, and search across everything in your stratbook.",
  ].join("\n");

  await storageUpload(
    `${projectStoragePrefix(input.ownerId, project.id)}/notes/welcome.md`,
    welcomeNote,
    "text/markdown; charset=utf-8"
  );

  return project;
}

export async function updateProject(
  ownerId: string,
  projectId: string,
  updates: Partial<Pick<Project, "onboardingComplete" | "name" | "description">>
): Promise<Project> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateProjectId(projectId);
  const current = await readProjectJson(ownerId, projectId);
  const sanitized: typeof updates = { ...updates };
  if (typeof sanitized.name === "string") {
    sanitized.name = validateProjectName(sanitized.name);
  }
  const updated: Project = { ...current, ...sanitized, updatedAt: new Date().toISOString() };
  await writeProjectJson(ownerId, updated);
  return updated;
}

export async function generateProjectCoverImage(
  ownerId: string,
  projectId: string
): Promise<Project> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const [current, index] = await Promise.all([
    readProjectJson(ownerId, projectId),
    buildWorkspaceIndex(ownerId, projectId),
  ]);
  const markerHash = `${COVER_IMAGE_STYLE_VERSION}:${getMapPointHash(index.mapPoints, index.layers)}:${getCoverTitleHash(current.name)}`;

  if (current.coverImage?.markerHash === markerHash) {
    return current;
  }

  const mapboxUrl = buildMapboxCoverUrl(index.mapPoints, index.layers);
  const response = await fetch(mapboxUrl);
  if (!response.ok) {
    throw new Error(`Map cover generation failed (${response.status}).`);
  }

  const storagePath = `${projectStoragePrefix(ownerId, projectId)}/cover.png`;
  const image = await renderCoverImage({
    height: COVER_IMAGE_HEIGHT,
    image: await response.blob(),
    title: current.name,
    width: COVER_IMAGE_WIDTH,
  });
  await storageUploadBinary(storagePath, image, "image/png");

  const updated: Project = {
    ...current,
    coverImage: {
      height: COVER_IMAGE_HEIGHT,
      markerHash,
      storagePath,
      updatedAt: new Date().toISOString(),
      width: COVER_IMAGE_WIDTH,
    },
  };
  await writeProjectJson(ownerId, updated);
  return updated;
}

export async function readProjectCoverImage(
  ownerId: string,
  projectId: string
): Promise<Blob> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  const project = await readProjectJson(ownerId, projectId);
  const latest = await generateProjectCoverImage(ownerId, projectId);
  const storagePath = latest.coverImage?.storagePath ?? project.coverImage?.storagePath;
  if (!storagePath) throw new Error("Cover image is not available.");
  return storageDownloadBinary(storagePath);
}

export async function createProjectShare(ownerId: string, projectId: string): Promise<{
  manifest: ShareManifest;
  project: Project;
}> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const current = await readProjectJson(ownerId, projectId);
  const now = new Date().toISOString();
  const shareId = current.sharing?.isPublic ? current.sharing.shareId : nanoid(14);
  const manifest: ShareManifest = {
    shareId,
    ownerId,
    projectId,
    createdAt: current.sharing?.createdAt ?? now,
  };
  const updated: Project = {
    ...current,
    sharing: {
      isPublic: true,
      shareId,
      createdAt: current.sharing?.createdAt ?? now,
      updatedAt: now,
    },
    updatedAt: now,
  };

  await Promise.all([writeProjectJson(ownerId, updated), writeShareManifestJson(manifest)]);
  const projectWithCover = await generateProjectCoverImage(ownerId, projectId);
  return { manifest, project: projectWithCover };
}

export async function deleteProject(ownerId: string, projectId: string): Promise<void> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();

  // Read the project first so we can revoke the share manifest if needed.
  // If project.json itself is missing, treat the delete as already done rather
  // than failing — partial-state cleanup shouldn't leave a card in the UI.
  let shareId: string | undefined;
  try {
    const project = await readProjectJson(ownerId, projectId);
    shareId = project.sharing?.shareId;
  } catch {
    // ignore — proceed with storage cleanup
  }

  const prefix = projectStoragePrefix(ownerId, projectId);
  const entries = await storageListRecursive(prefix);
  const paths = entries.map((entry) => entry.path);
  if (paths.length > 0) {
    // Supabase caps each remove() call at 1000 paths. Project file counts
    // are well under that today, but chunk defensively.
    for (let index = 0; index < paths.length; index += 500) {
      const batch = paths.slice(index, index + 500);
      const { error } = await supabase.storage.from(bucket).remove(batch);
      if (error) throw error;
    }
  }

  if (shareId) {
    const { error } = await supabase.storage.from(bucket).remove([shareManifestPath(shareId)]);
    if (error) throw error;
  }
}

export interface PublicProjectListing {
  ownerId: string;
  project: Project;
  shareId: string;
}

export async function listPublicProjects(): Promise<PublicProjectListing[]> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();

  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { data, error } = await supabase.storage.from(bucket).list(SHARE_MANIFEST_PREFIX, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;

  const shareIds = (data ?? [])
    .filter((entry) => entry.id !== null && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""));

  const results = await Promise.allSettled(
    shareIds.map(async (shareId): Promise<PublicProjectListing | null> => {
      const manifest = await readShareManifestJson(shareId);
      if (manifest.revokedAt) return null;
      const project = await readProjectJson(manifest.ownerId, manifest.projectId);
      // The manifest is the source of truth for "is this share live"; the
      // project flag tells us the owner hasn't unpublished it since.
      if (!project.sharing?.isPublic || project.sharing.shareId !== shareId) return null;
      return { ownerId: manifest.ownerId, project, shareId };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PublicProjectListing | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((value): value is PublicProjectListing => value !== null)
    .sort((a, b) => {
      const aTime = new Date(a.project.updatedAt ?? a.project.createdAt).getTime();
      const bTime = new Date(b.project.updatedAt ?? b.project.createdAt).getTime();
      return bTime - aTime;
    });
}

export async function getShareManifest(shareId: string): Promise<ShareManifest> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  let manifest: ShareManifest;
  try {
    manifest = await readShareManifestJson(shareId);
  } catch (error) {
    if (!getExampleByShareId(shareId)) throw error;
    await ensurePublicExampleStratbooks();
    manifest = await readShareManifestJson(shareId);
  }
  if (manifest.revokedAt) throw new Error("This share link has been revoked.");
  return manifest;
}

export async function getSharedProject(shareId: string): Promise<{
  manifest: ShareManifest;
  project: Project;
}> {
  if (getExampleByShareId(shareId)) {
    await ensurePublicExampleStratbooks();
  }
  const manifest = await getShareManifest(shareId);
  const project = await readProjectJson(manifest.ownerId, manifest.projectId);
  if (!project.sharing?.isPublic || project.sharing.shareId !== shareId) {
    throw new Error("This notebook is no longer public.");
  }
  return { manifest, project };
}

// ─── Project-scoped workspace operations ──────────────────────────────────────

async function listProjectFiles(
  ownerId: string,
  projectId: string,
  folderPaths?: string[]
): Promise<RawStorageEntry[]> {
  const storagePrefix = projectStoragePrefix(ownerId, projectId);
  const all = await storageListRecursive(storagePrefix, folderPaths);
  const prefix = `${storagePrefix}/`;
  return all
    .filter((f) => f.path.startsWith(prefix))
    .map((f) => ({ ...f, path: f.path.slice(prefix.length) }))
    .filter((f) => f.path !== "project.json");
}

async function readProjectFile(
  ownerId: string,
  projectId: string,
  workspacePath: string
): Promise<string> {
  return storageDownload(`${projectStoragePrefix(ownerId, projectId)}/${normalizeWorkspacePath(workspacePath)}`);
}

async function writeProjectFile(
  ownerId: string,
  projectId: string,
  workspacePath: string,
  content: string
): Promise<void> {
  const normalized = normalizeWorkspacePath(workspacePath);
  const contentType = normalized.endsWith(".md")
    ? "text/markdown; charset=utf-8"
    : "application/json; charset=utf-8";
  await storageUpload(`${projectStoragePrefix(ownerId, projectId)}/${normalized}`, content, contentType);
}

// ─── Workspace index ──────────────────────────────────────────────────────────

async function buildWorkspaceIndex(ownerId: string, projectId: string) {
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const rawFolderPaths: string[] = [];
  const rawFiles = (await listProjectFiles(ownerId, projectId, rawFolderPaths))
    .filter((file) => /\.(json|md)$/i.test(file.path))
    .map((file) => {
      try {
        return { ...file, path: normalizeWorkspacePath(file.path) };
      } catch {
        return null;
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  // Read all file contents in parallel to extract titles + locations
  const contentResults = await Promise.allSettled(
    rawFiles.map((f) => readProjectFile(ownerId, projectId, f.path))
  );

  const layerFileIndex = rawFiles.findIndex((f) => f.path === LAYERS_FILE_NAME);
  let layerContent =
    layerFileIndex >= 0 && contentResults[layerFileIndex].status === "fulfilled"
      ? contentResults[layerFileIndex].value
      : "";
  if (!layerContent) {
    try {
      layerContent = await readProjectFile(ownerId, projectId, LAYERS_FILE_NAME);
    } catch {
      layerContent = "";
    }
  }
  const layers = parseLayers(layerContent);

  const files: WorkspaceFileSummary[] = rawFiles.filter((raw) => raw.path !== LAYERS_FILE_NAME).map((raw) => {
    const i = rawFiles.findIndex((f) => f.path === raw.path);
    const extension = raw.path.endsWith(".md") ? "md" : "json";
    const kind = inferWorkspaceKind(raw.path);
    const content = contentResults[i].status === "fulfilled" ? contentResults[i].value : "";

    let title = prettifyName(path.posix.basename(raw.path));
    let location: GeoLocation | undefined;

    if (extension === "md") {
      title = extractHeadingTitle(content, raw.path);
      location = extractLocationFromMarkdown(content);
    } else {
      title = extractJsonTitle(content, raw.path);
      location = extractLocationFromJson(content);
    }

    return {
      extension,
      kind,
      location,
      name: path.posix.basename(raw.path),
      path: raw.path,
      size: raw.size,
      title,
      updatedAt: raw.updatedAt,
    };
  });

  const mapPoints: WorkspaceMapPoint[] = files
    .filter((f) => f.location !== undefined)
    .map((f) => ({
      coordinates: f.location!.coordinates,
      filePath: f.path,
      label: f.location!.label,
      title: f.title,
    }));

  const hasDefault = files.some((f) => f.path === DEFAULT_FILE_NAME);
  const defaultPath =
    hasDefault
      ? DEFAULT_FILE_NAME
      : files.find((f) => f.kind === "note")?.path ?? files[0]?.path ?? "";

  // Strip the project-id prefix and dedupe (recursion can produce duplicates
  // when callers pass shared array refs).
  const projectPrefix = `${projectStoragePrefix(ownerId, projectId)}/`;
  const folders = Array.from(
    new Set(
      rawFolderPaths
        .filter((p) => p.startsWith(projectPrefix))
        .map((p) => p.slice(projectPrefix.length))
        .filter((p) => p.length > 0)
        .filter((p) => p !== "layers" && !p.startsWith("layers/"))
    )
  ).sort();

  return {
    defaultPath,
    files: sortWorkspaceFiles(files),
    folders,
    layers,
    mapPoints: [...mapPoints].sort((a, b) => a.title.localeCompare(b.title)),
  };
}

export async function getWorkspaceIndex(ownerId: string, projectId: string): Promise<WorkspaceIndex> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  const { bucket } = getSupabaseConfig();
  const { defaultPath, files, folders, layers, mapPoints } = await buildWorkspaceIndex(ownerId, projectId);
  return {
    bucket,
    defaultPath,
    files,
    folders,
    layers,
    mapPoints,
    source: "supabase",
    sourceLabel: "Cloud storage",
  };
}

export async function getSharedWorkspaceIndex(shareId: string): Promise<WorkspaceIndex> {
  const { manifest } = await getSharedProject(shareId);
  return getWorkspaceIndex(manifest.ownerId, manifest.projectId);
}

export async function readWorkspaceFile(
  ownerId: string,
  projectId: string,
  workspacePath: string
): Promise<WorkspaceFile> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);

  const normalizedPath = normalizeWorkspacePath(workspacePath);
  const content = await readProjectFile(ownerId, projectId, normalizedPath);
  const extension = normalizedPath.endsWith(".md") ? "md" : "json";
  const kind = inferWorkspaceKind(normalizedPath);

  let title = prettifyName(path.posix.basename(normalizedPath));
  let location: GeoLocation | undefined;

  if (extension === "md") {
    title = extractHeadingTitle(content, normalizedPath);
    location = extractLocationFromMarkdown(content);
  } else {
    title = extractJsonTitle(content, normalizedPath);
    location = extractLocationFromJson(content);
  }

  return {
    content,
    extension,
    kind,
    location,
    name: path.posix.basename(normalizedPath),
    path: normalizedPath,
    size: new TextEncoder().encode(content).length,
    title,
    updatedAt: new Date().toISOString(),
  };
}

export async function readSharedWorkspaceFile(
  shareId: string,
  workspacePath: string
): Promise<WorkspaceFile> {
  const { manifest } = await getSharedProject(shareId);
  return readWorkspaceFile(manifest.ownerId, manifest.projectId, workspacePath);
}

export async function readSharedProjectCoverImage(shareId: string): Promise<Blob> {
  const { manifest } = await getSharedProject(shareId);
  return readProjectCoverImage(manifest.ownerId, manifest.projectId);
}

export async function forkSharedProject(
  shareId: string,
  targetOwnerId: string
): Promise<Project> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(targetOwnerId);

  const { manifest, project: sourceProject } = await getSharedProject(shareId);
  const now = new Date().toISOString();
  const forkedProject: Project = {
    createdAt: now,
    description: sourceProject.description,
    forkedFrom: {
      forkedAt: now,
      ownerId: manifest.ownerId,
      projectId: manifest.projectId,
      shareId,
    },
    id: nanoid(10),
    name: `${sourceProject.name} (Fork)`,
    onboardingComplete: true,
    updatedAt: now,
  };

  await writeProjectJson(targetOwnerId, forkedProject);

  const rawFiles = await listProjectFiles(manifest.ownerId, manifest.projectId);
  const copyableFiles = rawFiles
    .map((file) => file.path)
    .filter((filePath) => filePath !== "project.json" && /\.(json|md)$/i.test(filePath));

  await Promise.all(
    copyableFiles.map(async (filePath) => {
      const content = await readProjectFile(manifest.ownerId, manifest.projectId, filePath);
      await writeProjectFile(targetOwnerId, forkedProject.id, filePath, content);
    })
  );

  return forkedProject;
}

export async function writeWorkspaceFile(input: {
  ownerId: string;
  projectId: string;
  path: string;
  content: string;
}): Promise<WorkspaceFile> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(input.ownerId);
  validateProjectId(input.projectId);
  await writeProjectFile(input.ownerId, input.projectId, input.path, input.content);
  await touchProjectUpdatedAt(input.ownerId, input.projectId);
  return readWorkspaceFile(input.ownerId, input.projectId, input.path);
}

export async function saveFileLocation(input: {
  ownerId: string;
  projectId: string;
  path: string;
  location: GeoLocation | null;
}): Promise<WorkspaceFile> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(input.ownerId);
  validateProjectId(input.projectId);
  const normalized = normalizeWorkspacePath(input.path);
  const existing = await readProjectFile(input.ownerId, input.projectId, normalized);
  const updated = normalized.endsWith(".md")
    ? setMarkdownGeo(existing, input.location)
    : setJsonGeo(existing, input.location);
  await writeProjectFile(input.ownerId, input.projectId, normalized, updated);
  await touchProjectUpdatedAt(input.ownerId, input.projectId);
  return readWorkspaceFile(input.ownerId, input.projectId, normalized);
}

export async function createWorkspaceFolder(
  ownerId: string,
  projectId: string,
  folderPath: string
): Promise<void> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);
  const normalized = normalizeWorkspacePath(folderPath);
  await storageUpload(`${projectStoragePrefix(ownerId, projectId)}/${normalized}/.gitkeep`, "", "text/plain; charset=utf-8");
  await touchProjectUpdatedAt(ownerId, projectId);
}

export async function deleteWorkspaceFile(
  ownerId: string,
  projectId: string,
  workspacePath: string
): Promise<void> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(ownerId);
  validateProjectId(projectId);
  const normalized = normalizeWorkspacePath(workspacePath);
  const supabase = getSupabaseClient();
  const { bucket } = getSupabaseConfig();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([`${projectStoragePrefix(ownerId, projectId)}/${normalized}`]);
  if (error) throw error;
  await touchProjectUpdatedAt(ownerId, projectId);
}

export async function moveWorkspaceFile(input: {
  ownerId: string;
  projectId: string;
  fromPath: string;
  toPath: string;
}): Promise<WorkspaceFile> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  validateOwnerId(input.ownerId);
  validateProjectId(input.projectId);
  const from = normalizeWorkspacePath(input.fromPath);
  const to = normalizeWorkspacePath(input.toPath);
  if (from === to) return readWorkspaceFile(input.ownerId, input.projectId, from);

  const content = await readProjectFile(input.ownerId, input.projectId, from);
  await writeProjectFile(input.ownerId, input.projectId, to, content);
  await deleteWorkspaceFile(input.ownerId, input.projectId, from);
  return readWorkspaceFile(input.ownerId, input.projectId, to);
}

export async function searchWorkspaceFiles(
  ownerId: string,
  projectId: string,
  query: string
): Promise<WorkspaceSearchHit[]> {
  if (!hasSupabaseStorageConfig()) throw new SupabaseNotConfiguredError();
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  const index = await getWorkspaceIndex(ownerId, projectId);
  const hits: WorkspaceSearchHit[] = [];

  for (const file of index.files) {
    const haystack = `${file.path}\n${file.title}`.toLowerCase();
    if (haystack.includes(trimmedQuery)) {
      hits.push({
        kind: file.kind,
        location: file.location,
        path: file.path,
        snippet: `${file.title} · ${file.path}`,
        title: file.title,
      });
    }
  }

  return hits.slice(0, 8);
}
