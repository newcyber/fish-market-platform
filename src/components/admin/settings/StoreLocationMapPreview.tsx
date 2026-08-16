"use client";

import {
  useEffect,
} from "react";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

/**
 * ============================================================
 * LEAFLET MARKER
 * ============================================================
 */

const markerIcon = new L.Icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41],
});

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface StoreLocationMapPreviewProps {
  latitude: number;
  longitude: number;
  label?: string | null;
}

/**
 * ============================================================
 * MAP POSITION UPDATER
 * ============================================================
 *
 * Leaflet MapContainer tidak otomatis mengubah center ketika
 * props berubah. Komponen ini memastikan peta mengikuti
 * koordinat terbaru.
 */

function MapPositionUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [latitude, longitude],
      map.getZoom(),
      {
        animate: true,
      }
    );
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}

/**
 * ============================================================
 * STORE LOCATION MAP PREVIEW
 * ============================================================
 *
 * Read-only preview.
 *
 * Digunakan untuk memastikan titik origin toko sebelum
 * pengaturan disimpan.
 */

export default function StoreLocationMapPreview({
  latitude,
  longitude,
  label,
}: StoreLocationMapPreviewProps) {
  const position: [number, number] = [
    latitude,
    longitude,
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div className="relative h-56 w-full sm:h-72">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          dragging
          doubleClickZoom={false}
          zoomControl
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapPositionUpdater
            latitude={latitude}
            longitude={longitude}
          />

          <Marker
            position={position}
            icon={markerIcon}
          />
        </MapContainer>

        {/* ================================================ */}
        {/* LOCATION LABEL */}
        {/* ================================================ */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1000 bg-linear-to-t from-slate-950/75 to-transparent px-4 pb-4 pt-14">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              📍
            </span>

            <div className="min-w-0">
              <p className="truncate font-semibold">
                {label || "Lokasi Origin Toko"}
              </p>

              <p className="mt-0.5 text-xs text-white/80">
                {latitude.toFixed(7)},{" "}
                {longitude.toFixed(7)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}