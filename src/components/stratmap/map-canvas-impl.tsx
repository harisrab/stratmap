"use client";

import { humanizeFilename } from "@/lib/stratmap/humanize";
import type { LngLat, StratMapLayer, WorkspaceMapPoint } from "@/lib/stratmap/types";
import type mapboxgl from "mapbox-gl";
import {
  CheckIcon,
  ChevronRightIcon,
  CompassIcon,
  CopyIcon,
  CornerDownLeftIcon,
  CircleDotDashedIcon,
  LayersIcon,
  Loader2Icon,
  MapPinIcon,
  MinusIcon,
  PaletteIcon,
  PentagonIcon,
  PlusIcon,
  RouteIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type MapboxGL = (typeof import("mapbox-gl"))["default"];

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type MapTheme = { id: string; label: string; style: string; dot: string };

const MAP_THEMES: MapTheme[] = [
  { id: "dark", label: "Dark", style: "mapbox://styles/mapbox/dark-v11", dot: "#0d1824" },
  { id: "light", label: "Light", style: "mapbox://styles/mapbox/light-v11", dot: "#dce4ec" },
  { id: "satellite", label: "Satellite", style: "mapbox://styles/mapbox/satellite-v9", dot: "#1c3a1e" },
  { id: "hybrid", label: "Hybrid", style: "mapbox://styles/mapbox/satellite-streets-v12", dot: "#253d26" },
  { id: "outdoors", label: "Outdoors", style: "mapbox://styles/mapbox/outdoors-v12", dot: "#8cba7a" },
];

type ContextMenuTarget =
  | { layerId: string; type: "layer" }
  | { filePath: string; title: string; type: "marker" };

type ContextMenuState = {
  lat: number;
  lng: number;
  target?: ContextMenuTarget;
  x: number;
  y: number;
};

type MapCanvasProps = {
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

const LAYER_SOURCE_ID = "stratbook-layers";
const LAYER_FILL_ID = "stratbook-layer-fills";
const LAYER_OUTLINE_ID = "stratbook-layer-outlines";
const LAYER_LINE_ID = "stratbook-layer-lines";
const LAYER_RANGE_VECTOR_ID = "stratbook-layer-range-vectors";
const LAYER_HIT_LINE_ID = "stratbook-layer-hit-lines";
const LAYER_HOVER_FILL_ID = "stratbook-layer-hover-fills";
const LAYER_HOVER_LINE_ID = "stratbook-layer-hover-lines";
const EMPTY_LAYER_FILTER = ["==", ["get", "id"], "__none__"] as const;

function newLayerId() {
  return globalThis.crypto?.randomUUID?.() ?? `layer-${Date.now()}`;
}

function NavBtn({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="group relative">
      <button
        aria-label={label}
        className={`flex size-9 items-center justify-center rounded-full border backdrop-blur-xl transition-colors ${
          active
            ? "border-teal-300/40 bg-teal-300/18 text-teal-50"
            : "border-white/10 bg-[rgba(8,14,22,0.78)] text-white/70 hover:bg-[rgba(14,22,32,0.92)] hover:text-white"
        }`}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
      <span className="pointer-events-none absolute left-11 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[rgba(5,9,14,0.94)] px-2.5 py-1.5 text-[11px] text-white/80 opacity-0 shadow-lg backdrop-blur-xl transition-opacity delay-[60ms] group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

function createMarkerElement(isSelected: boolean, isPending: boolean, label: string) {
  // Wrap pin + label in a flex container so the label sits beside the pin
  // rather than overlapping it. The pin keeps its existing 1.4rem size; the
  // label is a small chip styled in globals.css.
  const wrap = document.createElement("div");
  wrap.className = "stratmap-marker-wrap";

  const pin = document.createElement("button");
  pin.className = "stratmap-marker";
  pin.type = "button";
  pin.dataset.selected = isSelected ? "true" : "false";
  pin.dataset.pending = isPending ? "true" : "false";
  pin.innerHTML = `<span class="stratmap-marker-core"></span><span class="stratmap-marker-ring"></span>`;

  const labelEl = document.createElement("span");
  labelEl.className = "stratmap-marker-label";
  labelEl.dataset.selected = isSelected ? "true" : "false";
  labelEl.dataset.pending = isPending ? "true" : "false";
  labelEl.textContent = label;

  wrap.appendChild(pin);
  wrap.appendChild(labelEl);
  return { wrap, pin };
}

function applyGlobe(map: mapboxgl.Map) {
  map.setFog({
    color: "rgb(10, 14, 22)",
    "high-color": "rgb(8, 14, 28)",
    "horizon-blend": 0.04,
    "space-color": "rgb(4, 6, 14)",
    "star-intensity": 0.55,
  });
}

function offsetCoordinate([lng, lat]: LngLat, eastKm: number, northKm: number): LngLat {
  const latOffset = northKm / 111.32;
  const lngOffset = eastKm / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  return [lng + lngOffset, lat + latOffset];
}

function circleCoordinates(center: LngLat, radiusKm: number): LngLat[] {
  const points: LngLat[] = [];
  for (let i = 0; i <= 96; i += 1) {
    const angle = (i / 96) * Math.PI * 2;
    points.push(offsetCoordinate(center, Math.cos(angle) * radiusKm, Math.sin(angle) * radiusKm));
  }
  return points;
}

function distanceKm(a: LngLat, b: LngLat) {
  const earthRadiusKm = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function radiusHandle(layer: Extract<StratMapLayer, { type: "range-ring" }>): LngLat {
  return offsetCoordinate(layer.center, layer.radiusKm, 0);
}

function midpoint(a: LngLat, b: LngLat): LngLat {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function formatRadius(radiusKm: number) {
  return radiusKm >= 100 ? `${Math.round(radiusKm)} km` : `${Math.round(radiusKm * 10) / 10} km`;
}

function isFiniteCoordinate(coordinate: LngLat) {
  return Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]);
}

function screenDistance(a: mapboxgl.Point, b: mapboxgl.Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function createRingDraft(center: LngLat, radiusKm: number): StratMapLayer {
  return {
    center,
    color: "#5eead4",
    createdAt: new Date().toISOString(),
    id: newLayerId(),
    name: "Range ring",
    radiusKm,
    type: "range-ring",
    visible: false,
  };
}

function createLineDraft(coordinates: LngLat[], type: "line" | "polygon"): StratMapLayer {
  return {
    color: type === "line" ? "#93c5fd" : "#fb923c",
    coordinates,
    createdAt: new Date().toISOString(),
    id: newLayerId(),
    name: type === "line" ? "Line" : "Polygon",
    type,
    visible: false,
  };
}

function stripPreviewPoint(layer: StratMapLayer): StratMapLayer {
  if (layer.type !== "line" && layer.type !== "polygon") return layer;
  return { ...layer, coordinates: layer.coordinates.filter((_, index) => index !== layer.coordinates.length - 1) };
}

function createHandleElement(kind: "center" | "vertex" | "radius") {
  const el = document.createElement("button");
  el.type = "button";
  el.className =
    kind === "radius"
      ? "size-3 rounded-full border border-teal-100 bg-transparent shadow-[0_0_0_4px_rgba(45,212,191,0.12)]"
      : "size-3 rounded-full border border-slate-950 bg-teal-300 shadow-[0_0_0_4px_rgba(45,212,191,0.14)]";
  el.title = kind === "radius" ? "Drag to resize radius" : kind === "center" ? "Drag center" : "Drag vertex";
  return el;
}

function createInsertHandleElement() {
  const el = document.createElement("button");
  el.type = "button";
  el.className =
    "group grid size-6 place-items-center rounded-full bg-transparent";
  el.title = "Insert vertex";
  el.innerHTML =
    '<span class="block size-2 rounded-full border border-slate-950 bg-white/85 opacity-45 shadow-[0_0_0_4px_rgba(255,255,255,0.08),0_0_18px_rgba(255,255,255,0.22)] transition duration-150 group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-[0_0_0_5px_rgba(255,255,255,0.16),0_0_22px_rgba(255,255,255,0.42)]"></span>';
  return el;
}

function createDraftVertexElement(isStart: boolean) {
  const el = document.createElement("span");
  el.className = isStart
    ? "block size-3.5 rounded-full border border-slate-950 bg-teal-200 shadow-[0_0_0_5px_rgba(45,212,191,0.16)]"
    : "block size-2.5 rounded-full border border-slate-950 bg-white/90 shadow-[0_0_0_4px_rgba(255,255,255,0.12)]";
  return el;
}

function createRangeLabelElement(color: string, label: string) {
  const el = document.createElement("span");
  el.className =
    "pointer-events-none rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] ring-1 ring-white/20";
  el.style.backgroundColor = color;
  el.textContent = label;
  return el;
}

function layerFeatureCollection(layers: StratMapLayer[]) {
  const features: GeoJSON.Feature[] = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    const properties = {
      color: layer.color,
      id: layer.id,
      name: layer.name,
      opacity: layer.type === "polygon" ? layer.opacity ?? 0.16 : undefined,
      type: layer.type,
    };
    if (layer.type === "range-ring") {
      if (!isFiniteCoordinate(layer.center) || !Number.isFinite(layer.radiusKm) || layer.radiusKm <= 0) {
        continue;
      }
      const edge = radiusHandle(layer);
      features.push({
        geometry: { coordinates: circleCoordinates(layer.center, layer.radiusKm), type: "LineString" },
        properties,
        type: "Feature",
      });
      features.push({
        geometry: { coordinates: [layer.center, edge], type: "LineString" },
        properties: { ...properties, type: "range-vector" },
        type: "Feature",
      });
      continue;
    }
    if (layer.type === "line") {
      if (layer.coordinates.length < 2 || !layer.coordinates.every(isFiniteCoordinate)) {
        continue;
      }
      features.push({
        geometry: { coordinates: layer.coordinates, type: "LineString" },
        properties,
        type: "Feature",
      });
      continue;
    }
    const coordinates = layer.coordinates.length > 0 ? layer.coordinates : [];
    if (coordinates.length < 3 || !coordinates.every(isFiniteCoordinate)) {
      continue;
    }
    const ring = coordinates[0] && coordinates.at(-1)?.join(",") !== coordinates[0].join(",")
      ? [...coordinates, coordinates[0]]
      : coordinates;
    features.push({
      geometry: { coordinates: [ring], type: "Polygon" },
      properties,
      type: "Feature",
    });
  }

  return { features, type: "FeatureCollection" };
}

function layerBoundsCoordinates(layer: StratMapLayer) {
  if (layer.type === "range-ring") {
    if (!isFiniteCoordinate(layer.center) || !Number.isFinite(layer.radiusKm) || layer.radiusKm <= 0) {
      return [];
    }
    return circleCoordinates(layer.center, layer.radiusKm).filter(isFiniteCoordinate);
  }

  return layer.coordinates.filter(isFiniteCoordinate);
}

function ensureLayerRendering(map: mapboxgl.Map) {
  if (!map.getSource(LAYER_SOURCE_ID)) {
    map.addSource(LAYER_SOURCE_ID, {
      data: { features: [], type: "FeatureCollection" },
      type: "geojson",
    });
  }

  if (!map.getLayer(LAYER_FILL_ID)) {
    map.addLayer({
      filter: ["==", ["geometry-type"], "Polygon"],
      id: LAYER_FILL_ID,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["coalesce", ["get", "opacity"], 0.16],
      },
      source: LAYER_SOURCE_ID,
      type: "fill",
    });
  }

  if (!map.getLayer(LAYER_OUTLINE_ID)) {
    map.addLayer({
      filter: ["==", ["geometry-type"], "Polygon"],
      id: LAYER_OUTLINE_ID,
      paint: {
        "line-color": ["get", "color"],
        "line-opacity": 0.8,
        "line-width": 1.8,
      },
      source: LAYER_SOURCE_ID,
      type: "line",
    });
  }

  if (!map.getLayer(LAYER_LINE_ID)) {
    map.addLayer({
      filter: ["all", ["==", ["geometry-type"], "LineString"], ["!=", ["get", "type"], "range-vector"]],
      id: LAYER_LINE_ID,
      paint: {
        "line-color": ["get", "color"],
        "line-dasharray": ["case", ["==", ["get", "type"], "range-ring"], ["literal", [2, 1.25]], ["literal", [1, 0]]],
        "line-opacity": 0.86,
        "line-width": ["case", ["==", ["get", "type"], "range-ring"], 1.6, 2.4],
      },
      source: LAYER_SOURCE_ID,
      type: "line",
    });
  }

  if (!map.getLayer(LAYER_RANGE_VECTOR_ID)) {
    map.addLayer({
      filter: ["==", ["get", "type"], "range-vector"],
      id: LAYER_RANGE_VECTOR_ID,
      paint: {
        "line-color": ["get", "color"],
        "line-opacity": 0.34,
        "line-width": 1.15,
      },
      source: LAYER_SOURCE_ID,
      type: "line",
    });
  }

  if (!map.getLayer(LAYER_HIT_LINE_ID)) {
    map.addLayer({
      filter: ["all", ["!=", ["get", "type"], "range-vector"]],
      id: LAYER_HIT_LINE_ID,
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.01,
        "line-width": ["case", ["==", ["get", "type"], "range-ring"], 14, 16],
      },
      source: LAYER_SOURCE_ID,
      type: "line",
    });
  }

  if (!map.getLayer(LAYER_HOVER_FILL_ID)) {
    map.addLayer({
      filter: ["all", ["==", ["geometry-type"], "Polygon"], EMPTY_LAYER_FILTER],
      id: LAYER_HOVER_FILL_ID,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.24,
      },
      source: LAYER_SOURCE_ID,
      type: "fill",
    });
  }

  if (!map.getLayer(LAYER_HOVER_LINE_ID)) {
    map.addLayer({
      filter: ["all", ["!=", ["get", "type"], "range-vector"], EMPTY_LAYER_FILTER],
      id: LAYER_HOVER_LINE_ID,
      paint: {
        "line-blur": 0.35,
        "line-color": ["get", "color"],
        "line-opacity": 1,
        "line-width": ["case", ["==", ["get", "type"], "range-ring"], 3, 4],
      },
      source: LAYER_SOURCE_ID,
      type: "line",
    });
  }
}

function syncLayerSource(map: mapboxgl.Map, layers: StratMapLayer[]) {
  if (!map.isStyleLoaded()) return false;
  ensureLayerRendering(map);
  const source = map.getSource(LAYER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  source?.setData(layerFeatureCollection(layers) as GeoJSON.FeatureCollection);
  return true;
}

function setHoveredLayer(map: mapboxgl.Map, layerId: string | null) {
  // Guard: map.remove() sets map.style to null; calling getLayer after that throws.
  if (!map.style) return;
  const idFilter = ["==", ["get", "id"], layerId ?? "__none__"];
  if (map.getLayer(LAYER_HOVER_FILL_ID)) {
    map.setFilter(LAYER_HOVER_FILL_ID, ["all", ["==", ["geometry-type"], "Polygon"], idFilter]);
  }
  if (map.getLayer(LAYER_HOVER_LINE_ID)) {
    map.setFilter(LAYER_HOVER_LINE_ID, ["all", ["!=", ["get", "type"], "range-vector"], idFilter]);
  }
}

export function MapCanvasImpl({
  activeLayerTool = null,
  decorative = false,
  layers = [],
  onAddMarker,
  onBeginLayerTool,
  onCancelLayerTool,
  onCreateLayer,
  onDeleteLayer,
  onDeleteMarker,
  onSelectLayer,
  onUpdateLayer,
  onSelect,
  points = [],
  searchAction,
  selectedLayerFocusKey = 0,
  selectedLayerId = null,
  selectedMarkerFocusKey = 0,
  selectedPath = "",
  sidebarWidth = 336,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const layerHandlesRef = useRef<mapboxgl.Marker[]>([]);
  const draftHandlesRef = useRef<mapboxgl.Marker[]>([]);
  const rangeLabelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const activeLayerToolRef = useRef<StratMapLayer["type"] | null>(activeLayerTool);
  const draftLayerRef = useRef<StratMapLayer | null>(null);
  const fittedRef = useRef(false);
  const focusedLayerRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(
    MAPBOX_TOKEN ? null : "NEXT_PUBLIC_MAPBOX_TOKEN is not set."
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activeStyleId, setActiveStyleId] = useState("dark");
  const [showThemes, setShowThemes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNamingMarker, setIsNamingMarker] = useState(false);
  const [markerTitle, setMarkerTitle] = useState("");
  const [draftLayer, setDraftLayer] = useState<StratMapLayer | null>(null);
  const [editPreviewLayer, setEditPreviewLayer] = useState<StratMapLayer | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const pinModeRef = useRef(false);
  const sidebarOffset = sidebarWidth + 24;
  const visibleLayers = useMemo(
    () => {
      const baseLayers = editPreviewLayer
        ? layers.map((layer) => (layer.id === editPreviewLayer.id ? editPreviewLayer : layer))
        : layers;
      return activeLayerTool && draftLayer ? [...baseLayers, { ...draftLayer, visible: true }] : baseLayers;
    },
    [activeLayerTool, draftLayer, editPreviewLayer, layers]
  );

  useEffect(() => {
    if (!editPreviewLayer) return;
    const committedLayer = layers.find((layer) => layer.id === editPreviewLayer.id);
    if (committedLayer && JSON.stringify(committedLayer) === JSON.stringify(editPreviewLayer)) {
      const timeout = window.setTimeout(() => setEditPreviewLayer(null), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [editPreviewLayer, layers]);

  useEffect(() => {
    activeLayerToolRef.current = activeLayerTool;
    if (activeLayerTool) setPinMode(false);
  }, [activeLayerTool]);

  useEffect(() => {
    draftLayerRef.current = draftLayer;
  }, [draftLayer]);

  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);

  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !ready || decorative) return;

    for (const marker of draftHandlesRef.current) marker.remove();
    draftHandlesRef.current = [];

    if (!draftLayer || (draftLayer.type !== "line" && draftLayer.type !== "polygon")) return;
    const committed = stripPreviewPoint(draftLayer);
    if (committed.type !== "line" && committed.type !== "polygon") return;

    committed.coordinates.forEach((coordinate, index) => {
      const marker = new mapbox.Marker({
        element: createDraftVertexElement(index === 0),
      })
        .setLngLat(coordinate)
        .addTo(map);
      draftHandlesRef.current.push(marker);
    });

    return () => {
      for (const marker of draftHandlesRef.current) marker.remove();
      draftHandlesRef.current = [];
    };
  }, [decorative, draftLayer, ready]);

  // ── init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    if (!MAPBOX_TOKEN) return;

    let cancelled = false;

    void (async () => {
      try {
        const mapbox = (await import("mapbox-gl")).default;
        if (cancelled || !containerRef.current) return;

        mapbox.accessToken = MAPBOX_TOKEN;
        mapboxRef.current = mapbox;

        const map = new mapbox.Map({
          antialias: true,
          attributionControl: false,
          bearing: decorative ? -18 : 0,
          center: decorative ? [44, 30] : [10, 18],
          container: containerRef.current,
          dragRotate: !decorative,
          interactive: !decorative,
          maxZoom: 16,
          minZoom: 1,
          pitch: decorative ? 38 : 0,
          projection: "globe",
          renderWorldCopies: false,
          style: decorative
            ? "mapbox://styles/mapbox/satellite-streets-v12"
            : "mapbox://styles/mapbox/dark-v11",
          zoom: decorative ? 2.6 : 1.6,
        });

        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;
          map.resize();
          applyGlobe(map);
          ensureLayerRendering(map);
          setError(null);
          setReady(true);
        });

        map.on("error", (e) => {
          if (!cancelled) setError(e.error?.message ?? "Map failed to load.");
        });

        // Keep the canvas in sync with the container's actual pixel size.
        const ro = new ResizeObserver(() => {
          if (!cancelled) map.resize();
        });
        ro.observe(containerRef.current);
        (map as unknown as { __ro?: ResizeObserver }).__ro = ro;

        if (!decorative) {
          map.on("contextmenu", (e) => {
            if (activeLayerToolRef.current) return;
            const queryLayers = [
              LAYER_HIT_LINE_ID,
            ].filter((layerId) => map.getLayer(layerId));
            const layerFeature =
              queryLayers.length > 0
                ? map
                    .queryRenderedFeatures(e.point, { layers: queryLayers })
                    .find((feature) => typeof feature.properties?.id === "string")
                : undefined;
            const layerId = layerFeature?.properties?.id;
            setContextMenu({
              lat: e.lngLat.lat,
              lng: e.lngLat.lng,
              target: typeof layerId === "string" ? { layerId, type: "layer" } : undefined,
              x: e.point.x,
              y: e.point.y,
            });
            setIsNamingMarker(false);
            setMarkerTitle("");
            setShowThemes(false);
            setCopied(false);
          });

          map.on("click", () => { if (!pinModeRef.current) setContextMenu(null); });
          map.on("drag", () => setContextMenu(null));
          map.on("zoom", () => setContextMenu(null));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Map failed to initialize.");
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      for (const m of layerHandlesRef.current) m.remove();
      layerHandlesRef.current = [];
      for (const m of draftHandlesRef.current) m.remove();
      draftHandlesRef.current = [];
      for (const m of rangeLabelMarkersRef.current) m.remove();
      rangeLabelMarkersRef.current = [];
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const m = mapRef.current as (mapboxgl.Map & { __ro?: ResizeObserver }) | null;
      m?.__ro?.disconnect();
      m?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  // decorative never changes in practice; stable dep is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── globe auto-rotate (decorative only) ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !decorative || !ready) return;

    let active = true;
    const tick = () => {
      if (!active) return;
      map.rotateTo(map.getBearing() + 0.025, { duration: 0 });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [decorative, ready]);

  // ── sync project layers ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || decorative) return;

    let frame = 0;
    const sync = () => {
      if (syncLayerSource(map, visibleLayers)) return;
      map.once("idle", sync);
    };

    sync();
    frame = window.requestAnimationFrame(sync);
    map.on("style.load", sync);
    map.once("idle", sync);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      map.off("idle", sync);
      map.off("style.load", sync);
    };
  }, [decorative, ready, visibleLayers]);

  // ── range-ring distance labels ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !ready || decorative) return;

    for (const marker of rangeLabelMarkersRef.current) marker.remove();
    rangeLabelMarkersRef.current = [];

    for (const layer of visibleLayers) {
      if (layer.type !== "range-ring" || !layer.visible) continue;
      if (!isFiniteCoordinate(layer.center) || !Number.isFinite(layer.radiusKm) || layer.radiusKm <= 0) continue;
      const edge = radiusHandle(layer);
      const labelPoint = midpoint(layer.center, edge);
      const marker = new mapbox.Marker({
        anchor: "center",
        element: createRangeLabelElement(layer.color, formatRadius(layer.radiusKm)),
      })
        .setLngLat(labelPoint)
        .addTo(map);
      rangeLabelMarkersRef.current.push(marker);
    }

    return () => {
      for (const marker of rangeLabelMarkersRef.current) marker.remove();
      rangeLabelMarkersRef.current = [];
    };
  }, [decorative, ready, visibleLayers]);

  // ── reveal selected layer ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!selectedLayerId) {
      focusedLayerRef.current = "";
      return;
    }
    if (!map || !mapbox || !ready || decorative) return;

    const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
    if (!selectedLayer?.visible) {
      focusedLayerRef.current = "";
      return;
    }

    const coordinates = layerBoundsCoordinates(selectedLayer);
    if (coordinates.length === 0) return;

    const focusKey = `${selectedLayer.id}:${selectedLayer.visible}:${selectedLayerFocusKey}`;
    if (focusedLayerRef.current === focusKey) return;
    focusedLayerRef.current = focusKey;

    const bounds = coordinates.reduce(
      (nextBounds, coordinate) => nextBounds.extend(coordinate),
      new mapbox.LngLatBounds(coordinates[0], coordinates[0])
    );

    map.fitBounds(bounds, {
      duration: 650,
      essential: true,
      maxZoom: selectedLayer.type === "range-ring" ? 8 : 10,
      padding: {
        bottom: 96,
        left: Math.max(96, sidebarOffset + 32),
        right: 128,
        top: 96,
      },
    });
  }, [decorative, layers, ready, selectedLayerFocusKey, selectedLayerId, sidebarOffset]);

  // ── drawing tools ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || decorative || !activeLayerTool || !onCreateLayer) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";
    map.doubleClickZoom.disable();

    const cancel = () => {
      setDraftLayer(null);
      onCancelLayerTool?.();
    };

    const finishPointLayer = () => {
      const draft = draftLayerRef.current;
      if (!draft || (draft.type !== "line" && draft.type !== "polygon")) return;
      const finalDraft = stripPreviewPoint(draft);
      const minimum = draft.type === "line" ? 2 : 3;
      if (finalDraft.type !== "line" && finalDraft.type !== "polygon") return;
      if (finalDraft.coordinates.length < minimum) return;
      onCreateLayer(finalDraft);
      setDraftLayer(null);
      onCancelLayerTool?.();
    };

    let ringCenter: LngLat | null = null;
    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      if (activeLayerTool === "range-ring") {
        const point: LngLat = [event.lngLat.lng, event.lngLat.lat];
        setContextMenu(null);
        if (!ringCenter) {
          ringCenter = point;
          map.dragPan.disable();
          setDraftLayer(createRingDraft(ringCenter, 0.25));
          return;
        }

        const draft = draftLayerRef.current;
        const radiusKm = Math.max(0.25, distanceKm(ringCenter, point));
        const finalLayer = draft?.type === "range-ring"
          ? { ...draft, radiusKm }
          : createRingDraft(ringCenter, radiusKm);
        onCreateLayer(finalLayer);
        ringCenter = null;
        setDraftLayer(null);
        map.dragPan.enable();
        onCancelLayerTool?.();
        return;
      }
      const point: LngLat = [event.lngLat.lng, event.lngLat.lat];
      setContextMenu(null);
      setDraftLayer((current) => {
        if (current?.type === "line" || current?.type === "polygon") {
          const committed = stripPreviewPoint(current);
          if (committed.type !== "line" && committed.type !== "polygon") return current;
          const first = committed.coordinates[0];
          if (activeLayerTool === "polygon" && first && committed.coordinates.length >= 3) {
            const firstPoint = map.project(first);
            if (screenDistance(event.point, firstPoint) <= 14) {
              onCreateLayer(committed);
              window.setTimeout(() => {
                setDraftLayer(null);
                onCancelLayerTool?.();
              }, 0);
              return current;
            }
          }
          return { ...committed, coordinates: [...committed.coordinates, point, point] };
        }
        return createLineDraft([point, point], activeLayerTool);
      });
    };

    const handleDoubleClick = (event: mapboxgl.MapMouseEvent) => {
      event.preventDefault();
      finishPointLayer();
    };

    const handleMouseMove = (event: mapboxgl.MapMouseEvent) => {
      const edge: LngLat = [event.lngLat.lng, event.lngLat.lat];
      if (ringCenter && activeLayerTool === "range-ring") {
      setDraftLayer((current) =>
        current?.type === "range-ring"
          ? { ...current, radiusKm: Math.max(0.25, distanceKm(ringCenter!, edge)) }
          : current
      );
        return;
      }
      if (activeLayerTool === "line" || activeLayerTool === "polygon") {
        setDraftLayer((current) => {
          if (current?.type !== "line" && current?.type !== "polygon") return current;
          if (current.coordinates.length === 0) return current;
          return {
            ...current,
            coordinates: current.coordinates.map((coordinate, index) =>
              index === current.coordinates.length - 1 ? edge : coordinate
            ),
          };
        });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
      if (event.key === "Enter") finishPointLayer();
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDoubleClick);
    map.on("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.style.cursor = previousCursor;
      map.doubleClickZoom.enable();
      map.dragPan.enable();
      map.off("click", handleClick);
      map.off("dblclick", handleDoubleClick);
      map.off("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLayerTool, decorative, onCancelLayerTool, onCreateLayer, ready]);

  // ── pin placement mode ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || decorative || !pinMode) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      setContextMenu({ lat: e.lngLat.lat, lng: e.lngLat.lng, x: e.point.x, y: e.point.y });
      setIsNamingMarker(true);
      setMarkerTitle("");
      setShowThemes(false);
      setCopied(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinMode(false);
    };

    map.on("click", handleClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      canvas.style.cursor = previousCursor;
      map.off("click", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [pinMode, ready, decorative]);

  // ── editable layer handles ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !ready || decorative || !onUpdateLayer) return;
    const mapInstance = map;
    const mb = mapbox;
    const commitLayerUpdate = onUpdateLayer;

    for (const marker of layerHandlesRef.current) marker.remove();
    layerHandlesRef.current = [];

    const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
    if (!selectedLayer || !selectedLayer.visible) return;

    function addHandle(coordinates: LngLat, kind: "center" | "vertex" | "radius", buildLayer: (next: LngLat) => StratMapLayer) {
      const marker = new mb.Marker({
        draggable: true,
        element: createHandleElement(kind),
      })
        .setLngLat(coordinates)
        .addTo(mapInstance);
      marker.on("drag", () => {
        const next = marker.getLngLat();
        const nextLayer = buildLayer([next.lng, next.lat]);
        setEditPreviewLayer(nextLayer);
        syncLayerSource(
          mapInstance,
          layers.map((layer) => (layer.id === nextLayer.id ? nextLayer : layer))
        );
      });
      marker.on("dragend", () => {
        const next = marker.getLngLat();
        const nextLayer = buildLayer([next.lng, next.lat]);
        setEditPreviewLayer(nextLayer);
        syncLayerSource(
          mapInstance,
          layers.map((layer) => (layer.id === nextLayer.id ? nextLayer : layer))
        );
        commitLayerUpdate(nextLayer);
      });
      layerHandlesRef.current.push(marker);
    }

    function addInsertHandle(
      layerToEdit: Extract<StratMapLayer, { type: "line" | "polygon" }>,
      coordinates: LngLat,
      insertAt: number
    ) {
      const marker = new mb.Marker({
        anchor: "center",
        element: createInsertHandleElement(),
      })
        .setLngLat(coordinates)
        .addTo(mapInstance);
      marker.getElement().addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const nextCoordinates = [
          ...layerToEdit.coordinates.slice(0, insertAt),
          coordinates,
          ...layerToEdit.coordinates.slice(insertAt),
        ];
        const nextLayer = { ...layerToEdit, coordinates: nextCoordinates };
        syncLayerSource(
          mapInstance,
          layers.map((layer) => (layer.id === nextLayer.id ? nextLayer : layer))
        );
        commitLayerUpdate(nextLayer);
      });
      layerHandlesRef.current.push(marker);
    }

    if (selectedLayer.type === "range-ring") {
      addHandle(selectedLayer.center, "center", (nextCenter) => {
        return { ...selectedLayer, center: nextCenter };
      });
      addHandle(radiusHandle(selectedLayer), "radius", (nextEdge) => {
        return { ...selectedLayer, radiusKm: Math.max(0.25, distanceKm(selectedLayer.center, nextEdge)) };
      });
    } else {
      selectedLayer.coordinates.forEach((coordinate, index) => {
        addHandle(coordinate, "vertex", (nextCoordinate) => {
          const nextCoordinates = selectedLayer.coordinates.map((item, itemIndex) =>
            itemIndex === index ? nextCoordinate : item
          );
          return { ...selectedLayer, coordinates: nextCoordinates };
        });
      });
      const segmentCount =
        selectedLayer.type === "polygon"
          ? selectedLayer.coordinates.length
          : Math.max(0, selectedLayer.coordinates.length - 1);
      for (let index = 0; index < segmentCount; index += 1) {
        const start = selectedLayer.coordinates[index];
        const end = selectedLayer.coordinates[(index + 1) % selectedLayer.coordinates.length];
        if (!start || !end) continue;
        addInsertHandle(selectedLayer, midpoint(start, end), index + 1);
      }
    }

    return () => {
      for (const marker of layerHandlesRef.current) marker.remove();
      layerHandlesRef.current = [];
    };
  }, [decorative, layers, onUpdateLayer, ready, selectedLayerId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || decorative || !onSelectLayer) return;
    const handleLayerClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectLayer(id);
    };
    map.on("click", LAYER_HIT_LINE_ID, handleLayerClick);
    return () => {
      map.off("click", LAYER_HIT_LINE_ID, handleLayerClick);
    };
  }, [decorative, onSelectLayer, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || decorative) return;
    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    const hoverLayers = [LAYER_HIT_LINE_ID].filter((layerId) =>
      map.getLayer(layerId)
    );
    if (hoverLayers.length === 0) return;

    const handleLayerHover = (event: mapboxgl.MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id !== "string") return;
      setHoveredLayer(map, id);
      canvas.style.cursor = "pointer";
    };
    const clearLayerHover = () => {
      setHoveredLayer(map, null);
      canvas.style.cursor = previousCursor;
    };

    for (const layerId of hoverLayers) {
      map.on("mousemove", layerId, handleLayerHover);
      map.on("mouseleave", layerId, clearLayerHover);
    }

    return () => {
      for (const layerId of hoverLayers) {
        map.off("mousemove", layerId, handleLayerHover);
        map.off("mouseleave", layerId, clearLayerHover);
      }
      setHoveredLayer(map, null);
      canvas.style.cursor = previousCursor;
    };
  }, [decorative, ready]);

  // ── sync markers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current;
    if (!map || !mapbox || !ready) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    for (const pt of points) {
      // Map labels show a humanized version of the filename, never the
      // frontmatter title — so renaming the file instantly updates the label.
      const { wrap, pin } = createMarkerElement(
        pt.filePath === selectedPath,
        pt.pending === true,
        humanizeFilename(pt.filePath)
      );
      pin.title = pt.pending ? `${pt.title} (saving…)` : pt.label ?? pt.title;
      // Pending markers aren't clickable until they finish saving — clicking
      // would just hit a non-existent file path on the server.
      if (onSelect && !pt.pending) {
        pin.addEventListener("click", () => onSelect(pt.filePath));
      }
      if (onDeleteMarker && !pt.pending) {
        wrap.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = containerRef.current?.getBoundingClientRect();
          setContextMenu({
            lat: pt.coordinates[1],
            lng: pt.coordinates[0],
            target: { filePath: pt.filePath, title: pt.title, type: "marker" },
            x: rect ? event.clientX - rect.left : 0,
            y: rect ? event.clientY - rect.top : 0,
          });
          setIsNamingMarker(false);
          setMarkerTitle("");
          setShowThemes(false);
          setCopied(false);
        });
      }
      // Anchor on the LEFT edge so the pin (which is the first child) sits
      // exactly on the coordinate regardless of how long the label is.
      // Without this, label length would shift the dot's screen position
      // because Mapbox centers the wrap.
      // Pin is 1.4rem ≈ 22.4px; offset by -half-pin so the pin's *center*
      // (not its left edge) lands on the coordinate.
      const PIN_HALF_PX = 11;
      const marker = new mapbox.Marker({
        anchor: "left",
        element: wrap,
        offset: [-PIN_HALF_PX, 0],
      })
        .setLngLat(pt.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (!fittedRef.current && points.length > 1) {
      const bounds = points.reduce(
        (b, p) => b.extend(p.coordinates),
        new mapbox.LngLatBounds(points[0].coordinates, points[0].coordinates)
      );
      map.fitBounds(bounds, { duration: 0, padding: 96 });
      fittedRef.current = true;
    }
  }, [onDeleteMarker, onSelect, points, ready, selectedPath]);

  // ── fly to selected ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const pt = points.find((p) => p.filePath === selectedPath);
    if (!map || !pt || !ready) return;
    map.flyTo({ center: pt.coordinates, duration: 1200, essential: true, zoom: Math.max(map.getZoom(), 3.2) });
  }, [points, ready, selectedMarkerFocusKey, selectedPath]);

  function changeStyle(theme: MapTheme) {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(theme.style);
    map.once("style.load", () => {
      applyGlobe(map);
      ensureLayerRendering(map);
      const source = map.getSource(LAYER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      source?.setData(layerFeatureCollection(visibleLayers) as GeoJSON.FeatureCollection);
    });
    setActiveStyleId(theme.id);
    setContextMenu(null);
    setShowThemes(false);
  }

  function defaultMarkerTitle() {
    if (!contextMenu) return "Untitled marker";
    return `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`;
  }

  function handleAddMarker() {
    if (!contextMenu || !onAddMarker) return;
    onAddMarker([contextMenu.lng, contextMenu.lat], markerTitle.trim() || defaultMarkerTitle());
    setContextMenu(null);
    setIsNamingMarker(false);
    setMarkerTitle("");
  }

  function handleCopyCoords() {
    if (!contextMenu) return;
    void navigator.clipboard.writeText(
      `${contextMenu.lat.toFixed(5)}, ${contextMenu.lng.toFixed(5)}`
    );
    setCopied(true);
    setTimeout(() => { setCopied(false); setContextMenu(null); }, 1400);
  }

  function handleDeleteContextTarget() {
    const target = contextMenu?.target;
    if (!target) return;
    if (target.type === "layer") {
      onDeleteLayer?.(target.layerId);
    } else {
      onDeleteMarker?.(target.filePath);
    }
    setContextMenu(null);
  }

  // Custom nav-control handlers. easeTo + duration:200 keeps interactions snappy
  // without feeling jarring; resetNorth flies to bearing/pitch 0 so a single
  // tap "levels" the globe.
  function navZoomIn() { mapRef.current?.zoomIn({ duration: 220 }); }
  function navZoomOut() { mapRef.current?.zoomOut({ duration: 220 }); }
  function navResetNorth() {
    mapRef.current?.easeTo({ bearing: 0, duration: 360, pitch: 0 });
  }

  return (
    // Absolute + inset:0 so this fills its positioned ancestor (the <main> in
    // app-shell). Inline styles avoid Tailwind's percentage-height chain which
    // can collapse to 0 when nested inside multiple absolute parents.
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0 }} ref={containerRef} />

      {/* Custom navigation controls — anchored just past the right edge of
          the workspace sidebar (which is 21rem wide + 0.75rem padding +
          0.75rem gap → 22.5rem). This keeps them out of both panels and out
          from under the Mapbox attribution badge. */}
      {!decorative && (
        <div
          className="absolute bottom-4 z-20 flex flex-col gap-1.5 transition-[left] duration-75"
          style={{ left: sidebarOffset }}
        >
          {onBeginLayerTool ? (
            <>
              <NavBtn active={activeLayerTool === "polygon"} label="Draw polygon" onClick={() => { onBeginLayerTool("polygon"); setPinMode(false); }}>
                <PentagonIcon className="size-4" />
              </NavBtn>
              <NavBtn active={activeLayerTool === "line"} label="Draw line" onClick={() => { onBeginLayerTool("line"); setPinMode(false); }}>
                <RouteIcon className="size-4" />
              </NavBtn>
              <NavBtn active={activeLayerTool === "range-ring"} label="Draw range ring" onClick={() => { onBeginLayerTool("range-ring"); setPinMode(false); }}>
                <CircleDotDashedIcon className="size-4" />
              </NavBtn>
              {onAddMarker ? (
                <NavBtn active={pinMode} label="Place marker" onClick={() => { setPinMode((p) => !p); onCancelLayerTool?.(); }}>
                  <MapPinIcon className="size-4" />
                </NavBtn>
              ) : null}
              <div className="my-1 h-px w-9 bg-white/12" />
            </>
          ) : null}
          <NavBtn label="Zoom in" onClick={navZoomIn}>
            <PlusIcon className="size-4" />
          </NavBtn>
          <NavBtn label="Zoom out" onClick={navZoomOut}>
            <MinusIcon className="size-4" />
          </NavBtn>
          <NavBtn label="Reset north" onClick={navResetNorth}>
            <CompassIcon className="size-4" />
          </NavBtn>
        </div>
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <>
          <div
            className="absolute inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="absolute z-50 w-52 select-none overflow-hidden rounded-xl border border-white/[0.11] bg-[rgba(5,9,14,0.97)] shadow-[0_16px_64px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.target ? (
              <>
                <div className="p-1.5">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] text-rose-200/82 transition-colors hover:bg-rose-500/10 hover:text-rose-100"
                    onClick={handleDeleteContextTarget}
                    type="button"
                  >
                    <Trash2Icon className="size-3.5 shrink-0 text-rose-300/70" />
                    <span className="min-w-0 flex-1 truncate">
                      Delete {contextMenu.target.type === "layer" ? "layer" : "marker"}
                    </span>
                  </button>
                </div>
                <div className="mx-1.5 h-px bg-white/[0.07]" />
              </>
            ) : null}

            <div className="p-1.5">
              {/* Theme toggle */}
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] text-white/75 transition-colors hover:bg-white/7 hover:text-white"
                onClick={() => setShowThemes((v) => !v)}
                type="button"
              >
                <PaletteIcon className="size-3.5 shrink-0 text-white/35" />
                <span className="flex-1">Change theme</span>
                <ChevronRightIcon
                  className={`size-3.5 text-white/25 transition-transform duration-150 ${showThemes ? "rotate-90" : ""}`}
                />
              </button>

              {showThemes && (
                <div className="mt-0.5 space-y-0.5 pb-0.5 pl-1.5">
                  {MAP_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[11px] text-white/60 transition-colors hover:bg-white/7 hover:text-white/90"
                      onClick={() => changeStyle(theme)}
                      type="button"
                    >
                      <span
                        className="size-3 shrink-0 rounded-full border border-white/18"
                        style={{ background: theme.dot }}
                      />
                      <span className="flex-1">{theme.label}</span>
                      {activeStyleId === theme.id && (
                        <CheckIcon className="size-3 text-teal-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mx-1.5 h-px bg-white/[0.07]" />

            <div className="p-1.5">
              {onAddMarker && isNamingMarker ? (
                <form
                  className="rounded-lg border border-white/8 bg-white/[0.035] p-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleAddMarker();
                  }}
                >
                  <label className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/32">
                    <MapPinIcon className="size-3.5 shrink-0 text-teal-300/70" />
                    New marker
                  </label>
                  <input
                    autoFocus
                    className="mt-2 h-8 w-full rounded-md border border-white/10 bg-black/24 px-2.5 text-[12px] text-white/88 outline-none transition-colors placeholder:text-white/25 focus:border-teal-300/36"
                    onChange={(event) => setMarkerTitle(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setContextMenu(null);
                      }
                    }}
                    placeholder="Name this place..."
                    value={markerTitle}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[9.5px] text-white/28">
                      {contextMenu.lat.toFixed(4)}, {contextMenu.lng.toFixed(4)}
                    </span>
                    <button
                      className="rounded-md bg-teal-300 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-teal-200"
                    type="submit"
                  >
                    Create
                  </button>
                </div>
              </form>
              ) : onAddMarker ? (
                <button
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] text-white/75 transition-colors hover:bg-white/7 hover:text-white"
                  onClick={() => {
                    setIsNamingMarker(true);
                    setShowThemes(false);
                  }}
                  type="button"
                >
                  <MapPinIcon className="size-3.5 shrink-0 text-white/35" />
                  Create new marker
                </button>
              ) : null}
              {onCreateLayer ? (
                <div className="mt-1 border-t border-white/[0.07] pt-1">
                  {([
                    ["range-ring", "Add range ring"],
                    ["polygon", "Add polygon"],
                    ["line", "Add line"],
                  ] as const).map(([type, label]) => (
                    <button
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] text-white/75 transition-colors hover:bg-white/7 hover:text-white"
                      key={type}
                      onClick={() => {
                        const anchor: LngLat = [contextMenu.lng, contextMenu.lat];
                        onCreateLayer(
                          type === "range-ring"
                            ? createRingDraft(anchor, 50)
                            : createLineDraft(
                                type === "line"
                                  ? [offsetCoordinate(anchor, -28, -12), anchor, offsetCoordinate(anchor, 30, 16)]
                                  : [
                                      offsetCoordinate(anchor, -28, -20),
                                      offsetCoordinate(anchor, 32, -14),
                                      offsetCoordinate(anchor, 26, 24),
                                      offsetCoordinate(anchor, -30, 18),
                                    ],
                                type
                              )
                        );
                        setContextMenu(null);
                      }}
                      type="button"
                    >
                      <LayersIcon className="size-3.5 shrink-0 text-white/35" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] text-white/75 transition-colors hover:bg-white/7 hover:text-white"
                onClick={handleCopyCoords}
                type="button"
              >
                {copied ? (
                  <CheckIcon className="size-3.5 shrink-0 text-teal-400" />
                ) : (
                  <CopyIcon className="size-3.5 shrink-0 text-white/35" />
                )}
                {copied ? "Copied!" : "Copy coordinates"}
              </button>
            </div>
          </div>
        </>
      )}

      {!ready && !error && (
        // Scope the loading veil to the visible globe area between the two
        // floating panels. Decorative mode has no panels, so it covers the
        // full viewport. Editor mode insets to match the panel layout
        // (21rem left + 26rem right, with 0.75rem padding + 0.75rem gap on
        // each side → 22.5rem / 27.5rem). z-10 keeps it below the panel
        // overlay (which sits in normal stacking order above this).
        <div
          className={
            decorative
              ? "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#080e16]"
              : "pointer-events-none absolute top-3 bottom-3 right-[27.5rem] flex flex-col items-center justify-center gap-3 rounded-xl border border-white/8 bg-[rgba(8,14,22,0.78)] backdrop-blur-xl"
          }
          style={decorative ? undefined : { left: sidebarOffset }}
        >
          <Loader2Icon className="size-7 animate-spin text-teal-300/70" />
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/35">
            Loading globe
          </p>
        </div>
      )}

      {/* Top-center geocoder — searches Mapbox for a place and flies the
          camera there. Hidden in decorative mode. */}
      {!decorative && ready && (
        <LocationSearch
          accessToken={MAPBOX_TOKEN}
          action={searchAction}
          onPick={(lng, lat, zoom) => {
            mapRef.current?.flyTo({
              center: [lng, lat],
              duration: 1400,
              essential: true,
              zoom,
            });
          }}
        />
      )}
      {error && (
        <div className="pointer-events-none absolute right-4 bottom-4 z-10 max-w-xs rounded-xl border border-amber-300/20 bg-black/70 px-3 py-2 text-xs text-amber-100/80 backdrop-blur-xl">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Location search ────────────────────────────────────────────────────────
// Calls Mapbox Geocoding API v6 with a small debounce. The dropdown is keyboard-
// friendly (Esc clears, click selects). Results are intentionally limited so the
// dropdown stays scannable.

type GeocodeFeature = {
  geometry: { coordinates: [number, number] };
  properties: { name: string; place_formatted?: string; feature_type?: string };
  id: string;
};

function LocationSearch({
  accessToken,
  action,
  onPick,
}: {
  accessToken: string;
  action?: ReactNode;
  onPick: (lng: number, lat: number, zoom: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce queries so we don't hit the geocoder on every keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (!accessToken) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(trimmed)}&limit=5&access_token=${accessToken}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Geocode failed");
        const json = (await res.json()) as { features: GeocodeFeature[] };
        setResults(json.features ?? []);
        setOpen(true);
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [accessToken, query]);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(feat: GeocodeFeature) {
    const [lng, lat] = feat.geometry.coordinates;
    // Region/country = wider zoom; address/POI = closer.
    const ft = feat.properties.feature_type ?? "";
    const zoom = ft === "country" ? 4 : ft === "region" ? 6 : ft === "place" ? 10 : 13;
    onPick(lng, lat, zoom);
    setQuery(feat.properties.name);
    setOpen(false);
  }

  return (
    <div
      className="absolute top-5 left-1/2 z-30 flex -translate-x-1/2 items-start gap-2"
      ref={wrapperRef}
    >
      <div className="w-[26rem]">
        {/* Outer glow ring — cyan tint that intensifies on focus-within. */}
        <div
          className={`group relative rounded-2xl bg-gradient-to-br from-white/12 via-white/5 to-white/0 p-px shadow-[0_22px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-300 ${
            open ? "shadow-[0_22px_70px_-15px_rgba(45,212,191,0.25)]" : ""
          } focus-within:from-teal-300/40 focus-within:via-sky-300/15 focus-within:to-transparent focus-within:shadow-[0_22px_70px_-15px_rgba(45,212,191,0.35)]`}
        >
          <div className="relative flex h-11 items-center rounded-2xl bg-gradient-to-b from-[rgba(12,20,30,0.94)] to-[rgba(6,12,20,0.96)] backdrop-blur-2xl">
            <SearchIcon className="pointer-events-none ml-3.5 size-4 shrink-0 text-white/45 transition-colors group-focus-within:text-teal-300/85" />
            <input
              className="flex-1 bg-transparent px-3 text-[13px] font-medium text-white placeholder:text-white/35 outline-none"
              onChange={(e) => {
                const nextQuery = e.currentTarget.value;
                setQuery(nextQuery);
                if (!nextQuery.trim()) {
                  setResults([]);
                  setLoading(false);
                  setOpen(false);
                }
              }}
              onFocus={() => { if (results.length > 0) setOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setQuery(""); setOpen(false); }
                if (e.key === "Enter" && results[0]) pick(results[0]);
              }}
              placeholder="Search a place or address…"
              value={query}
            />

            <div className="mr-2 flex shrink-0 items-center gap-1.5">
              {loading ? (
                <Loader2Icon className="size-4 animate-spin text-teal-300/70" />
              ) : query ? (
                <button
                  aria-label="Clear search"
                  className="flex size-6 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : (
                <span
                  className="hidden h-5 select-none items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white/45 sm:inline-flex"
                  title="Press Enter to search"
                >
                  <CornerDownLeftIcon className="size-2.5" />
                  Enter
                </span>
              )}
            </div>
          </div>
        </div>

        {open && results.length > 0 && (
          <ul className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[rgba(8,14,22,0.97)] to-[rgba(4,8,14,0.98)] py-1.5 shadow-[0_22px_70px_-10px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            {results.map((feat, idx) => (
              <li key={feat.id}>
                <button
                  className="group/row flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                  onClick={() => pick(feat)}
                  type="button"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 ring-1 ring-teal-300/20 group-hover/row:bg-teal-400/15 group-hover/row:ring-teal-300/40">
                    <MapPinIcon className="size-3.5 text-teal-300/85" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-white/90">
                      {feat.properties.name}
                    </span>
                    {feat.properties.place_formatted ? (
                      <span className="mt-0.5 block truncate text-[10.5px] text-white/40">
                        {feat.properties.place_formatted}
                      </span>
                    ) : null}
                  </span>
                  {idx === 0 ? (
                    <span className="ml-2 hidden size-5 select-none items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/45 sm:inline-flex">
                      <CornerDownLeftIcon className="size-2.5" />
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
