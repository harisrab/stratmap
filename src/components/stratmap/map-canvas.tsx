"use client";

import type { StratMapLayer, WorkspaceMapPoint } from "@/lib/stratmap/types";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

export type MapCanvasProps = {
  decorative?: boolean;
  layers?: StratMapLayer[];
  activeLayerTool?: StratMapLayer["type"] | null;
  onAddMarker?: (coordinates: [number, number], title: string) => void;
  onBeginLayerTool?: (type: StratMapLayer["type"]) => void;
  onCancelLayerTool?: () => void;
  onCreateLayer?: (layer: StratMapLayer) => void;
  onDeleteLayer?: (layerId: string) => void;
  onDeleteMarker?: (filePath: string) => void;
  onSelectLayer?: (layerId: string | null) => void;
  onUpdateLayer?: (layer: StratMapLayer) => void;
  onSelect?: (path: string) => void;
  points?: WorkspaceMapPoint[];
  searchAction?: ReactNode;
  selectedLayerFocusKey?: number;
  selectedLayerId?: string | null;
  selectedMarkerFocusKey?: number;
  selectedPath?: string;
  sidebarWidth?: number;
};

// ssr: false prevents mapbox-gl (which accesses window at module level) from
// running during server-side rendering.
const MapCanvasImpl = dynamic(
  () => import("./map-canvas-impl").then((m) => m.MapCanvasImpl),
  { ssr: false }
);

// MapCanvasImpl positions itself absolutely with inset:0; no extra wrapper here.
// Wrapping in another absolute div was causing percentage-height resolution to
// fail in some layouts (mapbox container ended up with height:0).
export function MapCanvas(props: MapCanvasProps) {
  return <MapCanvasImpl {...props} />;
}
