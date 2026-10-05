"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Route,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { CourierAssignmentListItem } from "@/services/courier/courier.service";

const markerIcon = new L.Icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const courierIcon = new L.DivIcon({
  className: "pisjo-courier-location-marker",
  html: '<div style="width:34px;height:34px;border-radius:9999px;background:#0f766e;border:3px solid white;box-shadow:0 4px 12px rgba(15,118,110,.35);display:flex;align-items:center;justify-content:center;color:white;font-size:16px">●</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const ACTIVE_STATUSES = new Set(["ASSIGNED", "ON_ROUTE", "PICKED_UP"]);

interface CourierNavigationProps {
  assignments: CourierAssignmentListItem[];
  selectedAssignmentId?: string | null;
}

function formatStatus(status: CourierAssignmentListItem["status"]) {
  switch (status) {
    case "ASSIGNED":
      return "Ditugaskan";

    case "ON_ROUTE":
      return "Dalam perjalanan";

    case "PICKED_UP":
      return "Sudah diambil";

    default:
      return status;
  }
}

function MapViewport({
  selected,
  userLocation,
}: {
  selected: CourierAssignmentListItem | null;
  userLocation: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selected) return;

    const { latitude, longitude } = selected.order.address;

    if (latitude === null || longitude === null) return;

    map.flyTo([latitude, longitude], 16, {
      duration: 0.6,
    });
  }, [map, selected]);

  useEffect(() => {
    if (!selected && userLocation) {
      map.flyTo(userLocation, 15, {
        duration: 0.6,
      });
    }
  }, [map, selected, userLocation]);

  return null;
}

export function CourierNavigation({
  assignments,
  selectedAssignmentId,
}: CourierNavigationProps) {
  const destinations = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          ACTIVE_STATUSES.has(assignment.status) &&
          assignment.order.address.latitude !== null &&
          assignment.order.address.longitude !== null,
      ),
    [assignments],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    selectedAssignmentId &&
      destinations.some((item) => item.id === selectedAssignmentId)
      ? selectedAssignmentId
      : destinations[0]?.id ?? null,
  );

  const [userLocation, setUserLocation] = useState<
    [number, number] | null
  >(null);

  const [locationMessage, setLocationMessage] = useState<string | null>(
    null,
  );

  /*
   * ============================================================
   * DERIVED SELECTION
   * ============================================================
   *
   * selectedAssignmentId dari URL memiliki prioritas.
   *
   * Jika assignment dari URL sudah tidak tersedia, gunakan
   * selectedId dari interaksi user.
   *
   * Jika selectedId juga sudah tidak tersedia, gunakan tujuan
   * pertama yang tersedia.
   *
   * Tidak menggunakan useEffect + setState sehingga tidak terjadi
   * cascading render dan lolos react-hooks/set-state-in-effect.
   */
  const effectiveSelectedId =
    selectedAssignmentId &&
    destinations.some((item) => item.id === selectedAssignmentId)
      ? selectedAssignmentId
      : selectedId && destinations.some((item) => item.id === selectedId)
        ? selectedId
        : destinations[0]?.id ?? null;

  const selected =
    destinations.find((item) => item.id === effectiveSelectedId) ?? null;

  const defaultCenter: [number, number] = selected
    ? [
        selected.order.address.latitude!,
        selected.order.address.longitude!,
      ]
    : userLocation ?? [0, 0];

  function locateCourier() {
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini tidak mendukung lokasi GPS.");
      return;
    }

    setLocationMessage("Mengambil lokasi Anda...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);

        setLocationMessage("Lokasi Anda berhasil diperbarui.");
      },
      () => {
        setLocationMessage(
          "Lokasi tidak dapat diakses. Pastikan izin lokasi diberikan.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--pisjo-primary)]">
              Operasional Kurir
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Navigasi Pengantaran
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pilih tujuan pengantaran untuk melihat lokasinya di dalam
              aplikasi. Google Maps hanya digunakan jika Anda membutuhkan
              navigasi turn-by-turn.
            </p>
          </div>

          <button
            type="button"
            onClick={locateCourier}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
          >
            <LocateFixed className="h-4 w-4 text-[var(--pisjo-primary)]" />
            Lokasi Saya
          </button>
        </div>

        {locationMessage ? (
          <p className="mt-3 text-xs text-slate-500">
            {locationMessage}
          </p>
        ) : null}
      </section>

      <section className="grid min-h-[640px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(300px,360px)_1fr]">
        <div className="order-2 flex min-h-0 flex-col border-t border-slate-200 bg-white lg:order-1 lg:border-t-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  Tujuan Aktif
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {destinations.length} tujuan dengan koordinat tersedia
                </p>
              </div>

              <Route className="h-5 w-5 text-[var(--pisjo-primary)]" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {destinations.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center">
                <MapPin className="h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Belum ada tujuan aktif
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Tugas aktif akan muncul setelah admin menugaskan pesanan
                  kepada Anda dan alamat memiliki koordinat.
                </p>

                <Link
                  href="/courier"
                  className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[var(--pisjo-primary)] px-4 text-sm font-semibold text-white"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            ) : (
              destinations.map((assignment) => {
                const address = assignment.order.address;

                const isSelected =
                  assignment.id === effectiveSelectedId;

                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;

                return (
                  <div
                    key={assignment.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(assignment.id)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setSelectedId(assignment.id);
                      }
                    }}
                    className={[
                      "mb-2 w-full cursor-pointer rounded-2xl border p-4 text-left transition",
                      isSelected
                        ? "border-[var(--pisjo-primary)] bg-[var(--pisjo-soft-blue)]/50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          {assignment.order.orderNumber}
                        </p>

                        <p className="mt-1 truncate font-bold text-slate-900">
                          {address.receiverName}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                        {formatStatus(assignment.status)}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">
                      {address.fullAddress}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <a
                        href={`tel:${address.receiverPhone}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--pisjo-primary)]"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {address.receiverPhone}
                      </a>

                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Google Maps
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="relative order-1 min-h-[420px] lg:order-2 lg:min-h-0">
          <MapContainer
            center={defaultCenter}
            zoom={selected || userLocation ? 15 : 12}
            scrollWheelZoom
            zoomControl
            className="h-full min-h-[420px] w-full lg:min-h-[640px]"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewport
              selected={selected}
              userLocation={userLocation}
            />

            {destinations.map((assignment) => {
              const latitude = assignment.order.address.latitude!;
              const longitude = assignment.order.address.longitude!;

              const isSelected =
                assignment.id === effectiveSelectedId;

              return (
                <Marker
                  key={assignment.id}
                  position={[latitude, longitude]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => setSelectedId(assignment.id),
                  }}
                  opacity={isSelected ? 1 : 0.75}
                >
                  <Popup>
                    <div className="min-w-44">
                      <p className="text-xs font-bold text-slate-400">
                        {assignment.order.orderNumber}
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {assignment.order.address.receiverName}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {assignment.order.address.fullAddress}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {userLocation ? (
              <Marker
                position={userLocation}
                icon={courierIcon}
              />
            ) : null}
          </MapContainer>

          {selected ? (
            <div className="absolute inset-x-3 bottom-3 z-[1000] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:inset-x-4 sm:bottom-4 sm:max-w-md">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Tujuan dipilih
                  </p>

                  <p className="mt-1 truncate font-bold text-slate-900">
                    {selected.order.orderNumber} ·{" "}
                    {selected.order.address.receiverName}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {selected.order.address.fullAddress}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selected.order.address.receiverPhone}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  <Phone className="h-4 w-4" />
                  Hubungi
                </a>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.order.address.latitude},${selected.order.address.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-3 text-xs font-semibold text-white"
                >
                  <Navigation className="h-4 w-4" />
                  Navigasi Google
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default CourierNavigation;