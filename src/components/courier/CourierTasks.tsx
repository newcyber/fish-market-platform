"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Route,
} from "lucide-react";
import { MapContainer, Marker, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";

import type { CourierAssignmentListItem, CourierDashboardStats } from "@/services/courier/courier.service";
import {
  CourierHeader,
  OperationalBadge,
  PaymentBadge,
  shortDate,
  StatusBadge,
} from "@/components/courier/CourierUi";

type Tab = "active" | "delivered" | "failed";



function haversineKm(
  a: [number, number],
  b: [number, number],
) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function eta(km: number | null) {
  if (km === null) return "—";
  return `± ${Math.max(3, Math.round((km / 25) * 60))} menit`;
}

function TaskCard({
  assignment,
  distance,
}: {
  assignment: CourierAssignmentListItem;
  distance: number | null;
}) {
  const address = assignment.order.address;
  return (
    <Link
      href={`/courier/tasks/${assignment.id}`}
      className="block rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] text-[#64748B]">
            {assignment.order.orderNumber}
          </p>
          <h3 className="mt-1 truncate text-[18px] font-bold text-[#0F2448]">
            {address.receiverName}
          </h3>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <div className="mt-2 flex items-start gap-2">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0F2448]" />
        <p className="line-clamp-2 text-[14px] leading-5 text-[#64748B]">
          {address.fullAddress}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <OperationalBadge icon={Package}>
          {assignment.order.itemsCount} paket
        </OperationalBadge>
        <PaymentBadge paid={assignment.order.paymentStatus === "VERIFIED"} />
        <OperationalBadge icon={Navigation}>
          Hak Kurir {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(assignment.order.courierPayoutEstimate)}
        </OperationalBadge>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-4 text-[13px] font-semibold text-[#64748B]">
          <span className="inline-flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-[#0B84F3]" />
            {distance === null ? "—" : `${distance.toFixed(1)} km`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-[#0F2448]" />
            {eta(distance)}
          </span>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9]">
          <ChevronRight className="h-5 w-5 text-[#0F2448]" />
        </span>
      </div>
    </Link>
  );
}

export function CourierTasks({
  active,
  history,
  stats,
  initialTab = "active",
}: {
  active: CourierAssignmentListItem[];
  history: CourierAssignmentListItem[];
  stats: CourierDashboardStats;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [sorted, setSorted] = useState(false);

  const activeWithCoords = useMemo(
    () =>
      active.filter(
        (row) =>
          row.order.address.latitude !== null &&
          row.order.address.longitude !== null,
      ),
    [active],
  );

  const distances = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const row of active) {
      if (!position) {
        map.set(row.id, null);
        continue;
      }
      const lat = row.order.address.latitude;
      const lng = row.order.address.longitude;
      map.set(row.id, lat === null || lng === null ? null : haversineKm(position, [lat, lng]));
    }
    return map;
  }, [active, position]);

  const displayedActive = useMemo(() => {
    if (!sorted) return active;
    return [...active].sort((a, b) => {
      const da = distances.get(a.id);
      const db = distances.get(b.id);
      if (da === null || da === undefined) return 1;
      if (db === null || db === undefined) return -1;
      return da - db;
    });
  }, [active, distances, sorted]);

  function locateAndSort() {
    if (!navigator.geolocation) {
      setSorted(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition([p.coords.latitude, p.coords.longitude]);
        setSorted(true);
      },
      () => setSorted(true),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }

  const list =
    tab === "active"
      ? displayedActive
      : history.filter((row) =>
          tab === "delivered"
            ? row.status === "DELIVERED"
            : row.status === "FAILED",
        );

  const mapCenter: [number, number] =
    position ??
    (activeWithCoords[0]
      ? [
          activeWithCoords[0].order.address.latitude!,
          activeWithCoords[0].order.address.longitude!,
        ]
      : [-7.888, 110.33]);

  return (
    <div>
      <CourierHeader
        title="Tugas Pengantaran"
        subtitle={`Total ${stats.totalToday} tugas hari ini`}
        menu
      />

      <div className="space-y-3 px-3 py-3">
        <div className="grid grid-cols-3 rounded-full bg-[#EAF5FF] p-1">
          {[
            ["active", "Aktif", active.length],
            ["delivered", "Selesai", stats.deliveredToday],
            ["failed", "Gagal", stats.failedToday],
          ].map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as Tab)}
              className={[
                "h-11 rounded-full text-[14px] font-semibold",
                tab === key ? "bg-[#0B84F3] text-white" : "text-[#0F2448]",
              ].join(" ")}
            >
              {label}{" "}
              <span className={tab === key ? "ml-1 text-white" : "ml-1 text-[#64748B]"}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {tab === "active" ? (
          <>
            <section className="overflow-hidden rounded-[18px] border border-[#DCE6F1] bg-white shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
              <div className="h-[220px] w-full">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {position ? (
                    <CircleMarker
                      center={position}
                      radius={9}
                      pathOptions={{ color: "#0B84F3", fillColor: "#0B84F3", fillOpacity: 0.9 }}
                    />
                  ) : null}
                  {activeWithCoords.map((row, index) => (
                    <Marker
                      key={row.id}
                      position={[
                        row.order.address.latitude!,
                        row.order.address.longitude!,
                      ]}
                      icon={L.divIcon({
                        className: "pisjo-task-marker",
                        html: `<div style="width:30px;height:30px;border-radius:50%;background:#0B84F3;border:3px solid white;box-shadow:0 2px 8px rgba(15,46,94,.25);color:white;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center">${index + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                      })}
                    >
                      <Popup>{row.order.address.receiverName}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </section>

            <button
              type="button"
              onClick={locateAndSort}
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0B84F3] text-[16px] font-semibold text-white"
            >
              <Route className="h-5 w-5" />
              Urutkan Rute Terdekat
            </button>
          </>
        ) : null}

        {list.length === 0 ? (
          <div className="rounded-[18px] border border-[#DCE6F1] bg-white p-10 text-center shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
            <ClipboardList className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-[#0F2448]">
              {tab === "active" ? "Tidak ada tugas aktif" : "Belum ada riwayat"}
            </p>
            <p className="mt-1 text-xs text-[#64748B]">
              Data akan berubah otomatis setelah status pengantaran diperbarui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((assignment) => (
              <TaskCard
                key={assignment.id}
                assignment={assignment}
                distance={tab === "active" ? distances.get(assignment.id) ?? null : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
