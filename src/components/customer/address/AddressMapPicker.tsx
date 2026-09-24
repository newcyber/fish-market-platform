
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

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface AddressMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  showCoordinates?: boolean;

  onChange: (
    latitude: number,
    longitude: number
  ) => void;
}

interface MapClickHandlerProps {
  onLocationChange: (
    latitude: number,
    longitude: number
  ) => void;
}

interface MapCenterControllerProps {
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  category?: string;
}

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const DEFAULT_POSITION: [number, number] = [
  -6.2088,
  106.8456,
];

const SEARCH_DEBOUNCE_MS = 500;

/**
 * ============================================================
 * LEAFLET DEFAULT MARKER
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

L.Marker.prototype.options.icon = defaultIcon;

/**
 * ============================================================
 * MAP CLICK HANDLER
 * ============================================================
 */

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
 * ============================================================
 */

function MapCenterController({
  latitude,
  longitude,
}: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    const currentCenter = map.getCenter();

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
      Math.max(map.getZoom(), 16),
      {
        animate: true,
      }
    );
  }, [map, latitude, longitude]);

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
  showCoordinates = true,
}: AddressMapPickerProps) {
  /**
   * ==========================================================
   * EXTERNAL POSITION
   * ==========================================================
   */

  const externalPosition =
    useMemo<[number, number] | null>(() => {
      if (
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {
        return [latitude, longitude];
      }

      return null;
    }, [latitude, longitude]);

  /**
   * ==========================================================
   * POSITION STATE
   * ==========================================================
   */

  const [position, setPosition] =
    useState<[number, number]>(() => {
      return (
        externalPosition ??
        DEFAULT_POSITION
      );
    });

  const previousExternalPosition =
    useRef<[number, number] | null>(
      externalPosition
    );

  /**
   * ==========================================================
   * SEARCH STATE
   * ==========================================================
   */

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<NominatimResult[]>([]);

  const [isSearching, setIsSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState<string | null>(null);

  const [showResults, setShowResults] =
    useState(false);

  const searchRequestId =
    useRef(0);

  /**
 * ==========================================================
 * HANDLE SEARCH QUERY CHANGE
 * ==========================================================
 */

function handleSearchQueryChange(
  value: string
) {
  setSearchQuery(value);

  const query = value.trim();

  if (query.length < 4) {
    setSearchResults([]);
    setSearchError(null);
    setIsSearching(false);
    setShowResults(false);

    return;
  }

  setShowResults(true);
}

  /**
   * ==========================================================
   * SYNC EXTERNAL POSITION
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
      previous[0] !== externalPosition[0] ||
      previous[1] !== externalPosition[1];

    if (!hasChanged) {
      return;
    }

    previousExternalPosition.current =
      externalPosition;

    setPosition(externalPosition);
  }, [externalPosition]);

  /**
   * ==========================================================
   * SEARCH ADDRESS
   * ==========================================================
   */

useEffect(() => {
  const query = searchQuery.trim();

  if (query.length < 4) {
    return;
  }

  const requestId =
    ++searchRequestId.current;

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(async () => {
        try {
          setIsSearching(true);
          setSearchError(null);
          setShowResults(true);

          const response = await fetch(
            `/api/maps/search?q=${encodeURIComponent(query)}`,
            {
              method: "GET",
              signal: controller.signal,
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              "Layanan pencarian alamat sedang tidak tersedia."
            );
          }

          const data =
            (await response.json()) as
              | NominatimResult[]
              | { message?: string };

          if (
            requestId !==
            searchRequestId.current
          ) {
            return;
          }

          if (!Array.isArray(data)) {
            throw new Error(
              data.message ??
                "Format hasil pencarian tidak valid."
            );
          }

          setSearchResults(data);
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          if (
            requestId !==
            searchRequestId.current
          ) {
            return;
          }

          console.error(
            "[ADDRESS_MAP_SEARCH_ERROR]",
            error
          );

          setSearchResults([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : "Gagal mencari alamat."
          );
        } finally {
          if (
            requestId ===
            searchRequestId.current
          ) {
            setIsSearching(false);
          }
        }
      }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  /**
   * ==========================================================
   * HANDLE LOCATION CHANGE
   * ==========================================================
   */

  function handleLocationChange(
    newLatitude: number,
    newLongitude: number
  ) {
    const newPosition: [number, number] = [
      newLatitude,
      newLongitude,
    ];

    previousExternalPosition.current =
      newPosition;

    setPosition(newPosition);

    onChange(
      newLatitude,
      newLongitude
    );
  }

  /**
   * ==========================================================
   * SELECT SEARCH RESULT
   * ==========================================================
   */

  function handleSelectSearchResult(
    result: NominatimResult
  ) {
    const newLatitude =
      Number.parseFloat(result.lat);

    const newLongitude =
      Number.parseFloat(result.lon);

    if (
      !Number.isFinite(newLatitude) ||
      !Number.isFinite(newLongitude)
    ) {
      setSearchError(
        "Koordinat lokasi tidak valid."
      );

      return;
    }

    handleLocationChange(
      newLatitude,
      newLongitude
    );

    setSearchQuery(
      result.display_name
    );

    setSearchResults([]);
    setShowResults(false);
    setSearchError(null);
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-4">
      {/* ======================================================
          SEARCH HEADER
          ====================================================== */}

      <div className="relative space-y-2">
        <label
          htmlFor="address-map-search"
          className="text-sm font-medium"
        >
          📍 Cari lokasi alamat (Kelurahan)
        </label>

        <div className="relative">
          <input
            id="address-map-search"
            type="search"
            value={searchQuery}
              onChange={(event) => {
                handleSearchQueryChange(
                event.target.value
                );
              }}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder="Cari alamat, jalan, kelurahan, atau kota..."
            className="h-11 w-full rounded-lg border bg-background px-3 pr-24 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            autoComplete="off"
          />

          {isSearching && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              Mencari...
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Ketik minimal 4 karakter, lalu pilih hasil
          pencarian untuk memindahkan marker.
        </p>

        {searchError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {searchError}
          </div>
        )}

        {showResults &&
          searchResults.length > 0 && (
            <div className="absolute z-[1000] mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => {
                    handleSelectSearchResult(result);
                  }}
                  className="block w-full border-b px-3 py-3 text-left text-sm transition last:border-b-0 hover:bg-muted"
                >
                  <span className="block font-medium">
                    {result.display_name}
                  </span>

                  {(result.type ||
                    result.category) && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {[
                        result.category,
                        result.type,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

        {showResults &&
          !isSearching &&
          searchQuery.trim().length >= 4 &&
          searchResults.length === 0 &&
          !searchError && (
            <div className="rounded-lg border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
              Lokasi tidak ditemukan. Coba gunakan
              kata kunci alamat yang lebih lengkap.
            </div>
          )}
      </div>

      {/* ======================================================
          MAP
          ====================================================== */}

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
            latitude={position[0]}
            longitude={position[1]}
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

      {/* ======================================================
          COORDINATES
          ====================================================== */}

      {showCoordinates && (
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
      )}
    </div>
  );
}
