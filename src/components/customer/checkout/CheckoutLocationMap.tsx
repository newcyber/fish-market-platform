"use client";

import {
  ExternalLink,
  Navigation,
} from "lucide-react";

import {
  MapContainer,
  Marker,
  TileLayer,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

/**
 * ============================================================
 * FIX LEAFLET DEFAULT MARKER
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

interface CheckoutLocationMapProps {
  latitude: number;

  longitude: number;

  label?: string | null;
}

/**
 * ============================================================
 * CHECKOUT LOCATION MAP
 *
 * Read-only location preview.
 * No marker dragging.
 * No address modification.
 *
 * Features:
 * - Preview shipping location
 * - Open location in Google Maps
 * - Start navigation to destination
 * ============================================================
 */

export default function CheckoutLocationMap({
  latitude,
  longitude,
  label,
}: CheckoutLocationMapProps) {
  /**
   * ==========================================================
   * MAP POSITION
   * ==========================================================
   */

  const position: [number, number] = [
    latitude,
    longitude,
  ];

  /**
   * ==========================================================
   * GOOGLE MAPS URL
   * ==========================================================
   */

  const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const navigationUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {/* ====================================================== */}
      {/* MAP */}
      {/* ====================================================== */}

      <div className="relative h-52 w-full sm:h-64">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={position}
            icon={markerIcon}
          />
        </MapContainer>

        {/* ==================================================== */}
        {/* LOCATION LABEL */}
        {/* ==================================================== */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent px-4 pb-4 pt-14">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              📍
            </span>

            <span className="truncate">
              {label || "Lokasi Pengiriman"}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* MAP ACTIONS */}
      {/* ====================================================== */}

      <div className="flex gap-3 border-t border-slate-200 bg-white p-3">
        {/* ==================================================== */}
        {/* OPEN MAP */}
        {/* ==================================================== */}

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" />

          Buka Peta
        </a>

        {/* ==================================================== */}
        {/* NAVIGATION */}
        {/* ==================================================== */}

        <a
          href={navigationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700 active:scale-[0.98]"
        >
          <Navigation className="h-4 w-4" />

          Navigasi
        </a>
      </div>
    </div>
  );
}