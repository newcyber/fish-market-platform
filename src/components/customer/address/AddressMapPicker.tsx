"use client";

import "leaflet/dist/leaflet.css";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import {
  Crosshair,
  Loader2,
  MapPin,
} from "lucide-react";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface AddressMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;

  onChange: (
    latitude: number,
    longitude: number
  ) => void;
}

/**
 * ============================================================
 * DEFAULT LOCATION
 *
 * Indonesia - Jakarta
 * Digunakan jika customer belum memilih lokasi.
 * ============================================================
 */

const DEFAULT_POSITION: [number, number] = [
  -6.2088,
  106.8456,
];

/**
 * ============================================================
 * FIX LEAFLET DEFAULT MARKER
 * ============================================================
 */

const defaultIcon = L.icon({
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

L.Marker.prototype.options.icon =
  defaultIcon;

/**
 * ============================================================
 * MAP CLICK HANDLER
 * ============================================================
 */

interface MapClickHandlerProps {
  onLocationChange: (
    latitude: number,
    longitude: number
  ) => void;
}

function MapClickHandler({
  onLocationChange,
}: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onLocationChange(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}

/**
 * ============================================================
 * MAP CENTER CONTROLLER
 *
 * Bertugas memindahkan center peta ketika position berubah.
 * ============================================================
 */

interface MapCenterControllerProps {
  latitude: number;
  longitude: number;
}

function MapCenterController({
  latitude,
  longitude,
}: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    const currentCenter =
      map.getCenter();

    const latitudeChanged =
      Math.abs(
        currentCenter.lat - latitude
      ) > 0.0000001;

    const longitudeChanged =
      Math.abs(
        currentCenter.lng - longitude
      ) > 0.0000001;

    if (
      !latitudeChanged &&
      !longitudeChanged
    ) {
      return;
    }

    map.setView(
      [latitude, longitude],
      Math.max(
        map.getZoom(),
        16
      ),
      {
        animate: true,
      }
    );
  }, [
    map,
    latitude,
    longitude,
  ]);

  return null;
}

/**
 * ============================================================
 * ADDRESS MAP PICKER
 * ============================================================
 */

export default function AddressMapPicker({
  latitude,
  longitude,
  onChange,
}: AddressMapPickerProps) {
  /**
   * ==========================================================
   * INITIAL POSITION
   *
   * useMemo digunakan agar posisi dari props tidak dibuat ulang
   * secara tidak perlu.
   * ==========================================================
   */

  const externalPosition =
    useMemo<[number, number] | null>(() => {
      if (
        typeof latitude === "number" &&
        typeof longitude === "number"
      ) {
        return [
          latitude,
          longitude,
        ];
      }

      return null;
    }, [
      latitude,
      longitude,
    ]);

  /**
   * ==========================================================
   * STATE POSITION
   * ==========================================================
   */

  const [position, setPosition] =
    useState<[number, number]>(() => {
      return (
        externalPosition ??
        DEFAULT_POSITION
      );
    });

  /**
   * ==========================================================
   * GETTING LOCATION STATE
   * ==========================================================
   */

  const [
    isGettingLocation,
    setIsGettingLocation,
  ] = useState(false);

  /**
   * ==========================================================
   * TRACK EXTERNAL POSITION
   *
   * Ref digunakan untuk menyimpan posisi props sebelumnya.
   * ==========================================================
   */

  const previousExternalPosition =
    useRef<[number, number] | null>(
      externalPosition
    );

  /**
   * ==========================================================
   * SYNC EXTERNAL VALUE
   *
   * Penting untuk halaman Edit Address.
   *
   * State hanya diubah jika koordinat dari luar benar-benar
   * berubah.
   * ==========================================================
   */

  useEffect(() => {
    if (!externalPosition) {
      return;
    }

    const previous =
      previousExternalPosition.current;

    const hasChanged =
      !previous ||
      previous[0] !==
        externalPosition[0] ||
      previous[1] !==
        externalPosition[1];

    if (!hasChanged) {
      return;
    }

    previousExternalPosition.current =
      externalPosition;

    queueMicrotask(() => {
      setPosition(
        externalPosition
      );
    });
  }, [
    externalPosition,
  ]);

  /**
   * ==========================================================
   * HANDLE LOCATION CHANGE
   * ==========================================================
   */

  function handleLocationChange(
    newLatitude: number,
    newLongitude: number
  ) {
    const newPosition:
      [number, number] = [
        newLatitude,
        newLongitude,
      ];

    previousExternalPosition.current =
      newPosition;

    setPosition(
      newPosition
    );

    onChange(
      newLatitude,
      newLongitude
    );
  }

  /**
   * ==========================================================
   * GET CURRENT LOCATION
   * ==========================================================
   */

  function handleGetCurrentLocation() {
    if (
      !navigator.geolocation
    ) {
      window.alert(
        "Browser Anda tidak mendukung fitur lokasi."
      );

      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        const newLatitude =
          currentPosition.coords.latitude;

        const newLongitude =
          currentPosition.coords.longitude;

        handleLocationChange(
          newLatitude,
          newLongitude
        );

        setIsGettingLocation(false);
      },

      (error) => {
        console.error(
          "[GET_CURRENT_LOCATION_ERROR]",
          error
        );

        let message =
          "Gagal mendapatkan lokasi Anda.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Izin lokasi ditolak. Silakan aktifkan izin lokasi pada browser.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Informasi lokasi tidak tersedia.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Waktu untuk mendapatkan lokasi telah habis. Silakan coba lagi.";
        }

        window.alert(
          message
        );

        setIsGettingLocation(false);
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 0,
      }
    );
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-4">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />

            <h3 className="font-semibold">
              Pin Lokasi Pengiriman
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Klik pada peta untuk menentukan lokasi
            pengiriman secara lebih akurat.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleGetCurrentLocation
          }
          disabled={
            isGettingLocation
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Mengambil Lokasi...
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" />

              Gunakan Lokasi Saya
            </>
          )}
        </button>
      </div>

      {/* ====================================================== */}
      {/* MAP */}
      {/* ====================================================== */}

      <div className="overflow-hidden rounded-xl border">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom
          className="h-[400px] w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onLocationChange={
              handleLocationChange
            }
          />

          <MapCenterController
            latitude={
              position[0]
            }
            longitude={
              position[1]
            }
          />

          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker =
                  event.target;

                const newPosition =
                  marker.getLatLng();

                handleLocationChange(
                  newPosition.lat,
                  newPosition.lng
                );
              },
            }}
          />

          <Circle
            center={position}
            radius={20}
          />
        </MapContainer>
      </div>

      {/* ====================================================== */}
      {/* COORDINATES */}
      {/* ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Latitude
          </p>

          <p className="mt-1 font-mono text-sm font-medium">
            {position[0].toFixed(7)}
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Longitude
          </p>

          <p className="mt-1 font-mono text-sm font-medium">
            {position[1].toFixed(7)}
          </p>
        </div>
      </div>
    </div>
  );
}