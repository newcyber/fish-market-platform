"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const targetIcon = new L.DivIcon({
  className: "pisjo-target-marker",
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#EF4444;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(15,46,94,.25)"><div style="width:9px;height:9px;border-radius:50%;background:white;margin:9px"></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

export function CourierDetailMap({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCourierLocation([position.coords.latitude, position.coords.longitude]),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }, []);

  if (latitude === null || longitude === null) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[18px] bg-[#F1F5F9] text-sm text-[#64748B]">
        Koordinat alamat belum tersedia.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#DCE6F1]">
      <div className="h-[280px]">
        <MapContainer
          center={[latitude, longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={[latitude, longitude]}
            radius={8}
            pathOptions={{
              color: "#0B84F3",
              fillColor: "#0B84F3",
              fillOpacity: 0.85,
            }}
          />
          <Marker position={[latitude, longitude]} icon={targetIcon}>
            <Popup>Lokasi customer</Popup>
          </Marker>
          {courierLocation ? (
            <>
              <CircleMarker
                center={courierLocation}
                radius={9}
                pathOptions={{
                  color: "#0B84F3",
                  fillColor: "#0B84F3",
                  fillOpacity: 0.9,
                }}
              >
                <Popup>Posisi kurir</Popup>
              </CircleMarker>
              <Polyline
                positions={[courierLocation, [latitude, longitude]]}
                pathOptions={{ color: "#0B84F3", weight: 4, dashArray: "8 8" }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-[54px] items-center justify-center gap-2 bg-white text-[15px] font-bold text-[#0B84F3]"
      >
        Buka di Google Maps
      </a>
    </div>
  );
}
