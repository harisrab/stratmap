"use client";

import type { GeoLocation, WorkspaceFile } from "@/lib/stratmap/types";
import { cn } from "@/lib/utils";
import { CheckIcon, MapPinIcon, MapPinOffIcon, PencilIcon, XIcon } from "lucide-react";
import { useState } from "react";

type FileMetadataProps = {
  file: WorkspaceFile;
  onReadOnlyAction?: () => void;
  onSaveLocation: (location: GeoLocation | null) => Promise<void>;
  readOnly?: boolean;
};

function CoordInput({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (v: string) => void;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">{label}</span>
      <input
        className="w-full rounded bg-white/6 px-2 py-1 text-[11px] text-white outline-none ring-1 ring-white/10 transition-colors focus:ring-teal-400/40"
        max={max}
        min={min}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="—"
        step="any"
        type="number"
        value={value}
      />
    </label>
  );
}

export function FileMetadata({
  file,
  onReadOnlyAction,
  onSaveLocation,
  readOnly = false,
}: FileMetadataProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const existingLng = file.location ? String(file.location.coordinates[0]) : "";
  const existingLat = file.location ? String(file.location.coordinates[1]) : "";
  const existingLabel = file.location?.label ?? "";

  const [lat, setLat] = useState(existingLat);
  const [lng, setLng] = useState(existingLng);
  const [label, setLabel] = useState(existingLabel);

  function startEdit() {
    if (readOnly) {
      onReadOnlyAction?.();
      return;
    }
    setLat(existingLat);
    setLng(existingLng);
    setLabel(existingLabel);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function commitEdit() {
    setSaving(true);
    try {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const hasCoords = !Number.isNaN(latNum) && !Number.isNaN(lngNum);

      await onSaveLocation(
        hasCoords
          ? { coordinates: [lngNum, latNum], label: label.trim() || undefined }
          : null
      );
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeLocation() {
    if (readOnly) {
      onReadOnlyAction?.();
      return;
    }
    setSaving(true);
    try {
      await onSaveLocation(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
      {/* header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="size-3 shrink-0 text-white/30" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">Location</span>
        </div>

        {!editing ? (
          <div className="flex items-center gap-1">
            {file.location ? (
              <button
                className="rounded p-0.5 text-white/25 transition-colors hover:bg-rose-500/10 hover:text-rose-300/70"
                disabled={saving}
                onClick={() => void removeLocation()}
                title="Remove location"
                type="button"
              >
                <MapPinOffIcon className="size-3" />
              </button>
            ) : null}
            <button
              className="rounded p-0.5 text-white/25 transition-colors hover:bg-white/8 hover:text-white/60"
              onClick={startEdit}
              title={file.location ? "Edit location" : "Set location"}
              type="button"
            >
              <PencilIcon className="size-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              className="rounded p-0.5 text-white/25 transition-colors hover:bg-white/8 hover:text-white/60"
              disabled={saving}
              onClick={cancelEdit}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
            <button
              className="rounded p-0.5 text-teal-400/60 transition-colors hover:bg-teal-400/10 hover:text-teal-300"
              disabled={saving}
              onClick={() => void commitEdit()}
              type="button"
            >
              <CheckIcon className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* display / edit */}
      {editing ? (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <CoordInput label="Latitude" max={90} min={-90} onChange={setLat} value={lat} />
            <CoordInput label="Longitude" max={180} min={-180} onChange={setLng} value={lng} />
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">Label</span>
            <input
              className="w-full rounded bg-white/6 px-2 py-1 text-[11px] text-white outline-none ring-1 ring-white/10 transition-colors focus:ring-teal-400/40"
              onChange={(e) => setLabel(e.currentTarget.value)}
              placeholder="Optional place name…"
              type="text"
              value={label}
            />
          </label>
          <p className="text-[9px] text-white/20">
            Leave blank to remove the pin from the map.
          </p>
        </div>
      ) : file.location ? (
        (() => {
          // Skip the label line when it's just a coordinate restating
          // (auto-generated markers set label to "lat, lng" with 4 decimals).
          // We only want a label here when the user gave the place a real name
          // like "Brooklyn Bridge".
          const label = file.location.label?.trim();
          const isCoordLabel =
            !!label && /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(label);
          const showLabel = !!label && !isCoordLabel;
          return (
            <div className="mt-1.5 space-y-0.5">
              {showLabel ? (
                <p className="text-[11px] text-white/70">{label}</p>
              ) : null}
              <p className={cn("font-mono text-[10px] text-white/45", showLabel && "text-white/25")}>
                {file.location.coordinates[1].toFixed(5)}, {file.location.coordinates[0].toFixed(5)}
              </p>
            </div>
          );
        })()
      ) : (
        <p className="mt-1 text-[10px] text-white/22">No location set</p>
      )}
    </div>
  );
}
