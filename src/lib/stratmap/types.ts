import type { MapBaseThemeId } from "./constants";

export type WorkspaceSource = "supabase";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  coverImage?: ProjectCoverImage;
  exampleVersion?: string;
  onboardingComplete: boolean;
  updatedAt?: string;
  sharing?: ProjectSharing;
  forkedFrom?: ProjectForkSource;
  mapThemeId?: MapBaseThemeId;
}

export interface ProjectCoverImage {
  height: number;
  markerHash: string;
  storagePath: string;
  updatedAt: string;
  width: number;
}

export interface ProjectSharing {
  isPublic: boolean;
  shareId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectForkSource {
  ownerId: string;
  projectId: string;
  shareId: string;
  forkedAt: string;
}

export interface ShareManifest {
  shareId: string;
  ownerId: string;
  projectId: string;
  createdAt: string;
  revokedAt?: string;
}

export type WorkspaceAccessMode = "owner" | "public-anonymous" | "public-authenticated";

export type WorkspaceFileKind = "note" | "scenario" | "data";

/** [lng, lat] — matches GeoJSON / Mapbox convention */
export type LngLat = [number, number];

export interface GeoLocation {
  coordinates: LngLat;
  label?: string;
}

export interface WorkspaceMapPoint {
  filePath: string;
  title: string;
  coordinates: LngLat;
  label?: string;
  /**
   * Client-only flag: marker is shown optimistically while the underlying file
   * is still being created on the server. The map renders these with a pulsing
   * "pending" state and they are not clickable until they resolve.
   */
  pending?: boolean;
}

export type StratMapLayerType = "polygon" | "line" | "range-ring";

interface StratMapLayerBase {
  color: string;
  createdAt: string;
  id: string;
  name: string;
  visible: boolean;
}

export interface StratMapPolygonLayer extends StratMapLayerBase {
  coordinates: LngLat[];
  opacity?: number;
  type: "polygon";
}

export interface StratMapLineLayer extends StratMapLayerBase {
  coordinates: LngLat[];
  type: "line";
}

export interface StratMapRangeRingLayer extends StratMapLayerBase {
  center: LngLat;
  radiusKm: number;
  type: "range-ring";
}

export type StratMapLayer = StratMapPolygonLayer | StratMapLineLayer | StratMapRangeRingLayer;

export interface WorkspaceFileSummary {
  path: string;
  name: string;
  title: string;
  kind: WorkspaceFileKind;
  extension: "md" | "json";
  size: number;
  updatedAt: string;
  location?: GeoLocation;
}

export interface WorkspaceFile extends WorkspaceFileSummary {
  content: string;
}

export interface WorkspaceIndex {
  source: WorkspaceSource;
  sourceLabel: string;
  bucket?: string;
  defaultPath: string;
  files: WorkspaceFileSummary[];
  /** All folder paths (including empty ones). */
  folders: string[];
  layers: StratMapLayer[];
  mapPoints: WorkspaceMapPoint[];
}

export interface WorkspaceSearchHit {
  path: string;
  title: string;
  kind: WorkspaceFileKind;
  snippet: string;
  location?: GeoLocation;
}
