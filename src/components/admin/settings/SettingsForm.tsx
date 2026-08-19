"use client";

import {
  useState,
  useTransition,
} from "react";

import dynamic from "next/dynamic";

import {
  Store,
  Mail,
  Phone,
  MapPin,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Navigation,
  LocateFixed,
  Truck,
} from "lucide-react";

import {
  updateSettingsAction,
} from "@/actions/admin/settings/update-settings";

/**
 * ============================================================
 * STORE LOCATION MAP PREVIEW
 * ============================================================
 *
 * Leaflet hanya dijalankan di browser.
 */

const StoreLocationMapPreview = dynamic(
  () =>
    import(
      "@/components/admin/settings/StoreLocationMapPreview"
    ),
  {
    ssr: false,
  }
);

/**
 * ============================================================
 * SETTINGS FORM
 * ============================================================
 */

interface SettingsFormProps {
  settings: {
    storeName: string;
    storeDescription: string | null;
    footerDescription: string | null;

    email: string | null;
    whatsapp: string | null;

    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;

    /**
     * STORE LOCATION / SHIPPING ORIGIN
     */

    latitude: number | null;
    longitude: number | null;

    /**
     * INTERNAL SHIPPING CONFIGURATION
     */

    internalShippingEnabled: boolean;
    internalShippingName: string;
    internalShippingBaseFee: number;
    internalShippingPerKmFee: number;
    internalShippingMaxDistance: number;
    internalShippingFreeThreshold: number | null;

    /**
     * OPERATIONAL
     */

    openingTime: string | null;
    closingTime: string | null;
  };
}

export default function SettingsForm({
  settings,
}: SettingsFormProps) {
  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState<boolean | null>(null);

  /**
   * ==========================================================
   * STORE GPS STATE
   * ==========================================================
   */

  const [latitude, setLatitude] =
    useState<string>(
      settings.latitude !== null &&
      settings.latitude !== undefined
        ? String(settings.latitude)
        : ""
    );

  const [longitude, setLongitude] =
    useState<string>(
      settings.longitude !== null &&
      settings.longitude !== undefined
        ? String(settings.longitude)
        : ""
    );

  const [isLocating, setIsLocating] =
    useState(false);

  /**
   * ==========================================================
   * INTERNAL SHIPPING STATE
   * ==========================================================
   */

  const [
    internalShippingEnabled,
    setInternalShippingEnabled,
  ] = useState(
    settings.internalShippingEnabled
  );

  /**
   * ==========================================================
   * MAP PREVIEW COORDINATES
   * ==========================================================
   */

  const previewLatitude =
    Number(latitude);

  const previewLongitude =
    Number(longitude);

  const hasValidLocation =
    latitude.trim() !== "" &&
    longitude.trim() !== "" &&
    Number.isFinite(previewLatitude) &&
    Number.isFinite(previewLongitude) &&
    previewLatitude >= -90 &&
    previewLatitude <= 90 &&
    previewLongitude >= -180 &&
    previewLongitude <= 180;

  /**
   * ==========================================================
   * GET CURRENT LOCATION
   * ==========================================================
   */

  function handleGetCurrentLocation() {
    setMessage(null);
    setIsSuccess(null);

    if (!navigator.geolocation) {
      setMessage(
        "Browser atau perangkat ini tidak mendukung akses lokasi GPS."
      );

      setIsSuccess(false);

      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude =
          position.coords.latitude;

        const nextLongitude =
          position.coords.longitude;

        setLatitude(
          nextLatitude.toFixed(7)
        );

        setLongitude(
          nextLongitude.toFixed(7)
        );

        setMessage(
          "Lokasi toko berhasil diperoleh. Jangan lupa menyimpan pengaturan."
        );

        setIsSuccess(true);

        setIsLocating(false);
      },

      (error) => {
        console.error(
          "Failed to get store location:",
          error
        );

        let errorMessage =
          "Gagal mengambil lokasi saat ini.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          errorMessage =
            "Izin akses lokasi ditolak. Silakan izinkan akses lokasi terlebih dahulu.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          errorMessage =
            "Lokasi perangkat tidak tersedia.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          errorMessage =
            "Waktu pengambilan lokasi habis. Silakan coba lagi.";
        }

        setMessage(errorMessage);
        setIsSuccess(false);
        setIsLocating(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  /**
   * ==========================================================
   * PARSE COORDINATE
   * ==========================================================
   */

  function parseCoordinate(
    value: string
  ): number | null {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed =
      Number(trimmed);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  /**
   * ==========================================================
   * PARSE NUMBER
   * ==========================================================
   */

  function parseNumber(
    value: FormDataEntryValue | null,
    fallback: number
  ): number {
    if (
      value === null ||
      String(value).trim() === ""
    ) {
      return fallback;
    }

    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  /**
   * ==========================================================
   * PARSE OPTIONAL NUMBER
   * ==========================================================
   *
   * Nilai kosong akan menjadi null.
   */

  function parseOptionalNumber(
    value: FormDataEntryValue | null
  ): number | null {
    if (
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  function handleSubmit(
    formData: FormData
  ) {
    setMessage(null);
    setIsSuccess(null);

    const input = {
      /**
       * STORE INFORMATION
       */

      storeName: String(
        formData.get("storeName") ?? ""
      ),

      storeDescription: String(
        formData.get("storeDescription") ?? ""
      ),

      footerDescription: String(
        formData.get("footerDescription") ?? ""
      ),

      email: String(
        formData.get("email") ?? ""
      ),

      whatsapp: String(
        formData.get("whatsapp") ?? ""
      ),

      /**
       * STORE ADDRESS
       */

      address: String(
        formData.get("address") ?? ""
      ),

      city: String(
        formData.get("city") ?? ""
      ),

      province: String(
        formData.get("province") ?? ""
      ),

      postalCode: String(
        formData.get("postalCode") ?? ""
      ),

      /**
       * STORE LOCATION / SHIPPING ORIGIN
       */

      latitude:
        parseCoordinate(latitude),

      longitude:
        parseCoordinate(longitude),

      /**
       * INTERNAL SHIPPING
       */

      internalShippingEnabled,

      internalShippingName: String(
        formData.get(
          "internalShippingName"
        ) ?? ""
      ),

      internalShippingBaseFee:
        parseNumber(
          formData.get(
            "internalShippingBaseFee"
          ),
          0
        ),

      internalShippingPerKmFee:
        parseNumber(
          formData.get(
            "internalShippingPerKmFee"
          ),
          0
        ),

      internalShippingMaxDistance:
        parseNumber(
          formData.get(
            "internalShippingMaxDistance"
          ),
          10
        ),

      internalShippingFreeThreshold:
        parseOptionalNumber(
          formData.get(
            "internalShippingFreeThreshold"
          )
        ),

      /**
       * OPERATIONAL
       */

      openingTime: String(
        formData.get("openingTime") ?? ""
      ),

      closingTime: String(
        formData.get("closingTime") ?? ""
      ),
    };

    startTransition(async () => {
      try {
        const result =
          await updateSettingsAction(
            input
          );

        setMessage(result.message);
        setIsSuccess(result.success);
      } catch (error) {
        console.error(
          "Failed to update store settings:",
          error
        );

        setMessage(
          "Terjadi kesalahan saat menyimpan pengaturan toko."
        );

        setIsSuccess(false);
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* FEEDBACK */}
      {/* ====================================================== */}

      {message && (
        <div
          className={[
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}

          <span>{message}</span>
        </div>
      )}

      {/* ====================================================== */}
      {/* INFORMASI TOKO */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Store className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Informasi Toko
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kelola informasi utama toko.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="storeName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Toko
            </label>

            <input
              id="storeName"
              name="storeName"
              type="text"
              required
              defaultValue={settings.storeName}
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Contoh: Pisjo Market"
            />
          </div>

          <div>
            <label
              htmlFor="storeDescription"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Deskripsi Toko
            </label>

            <textarea
              id="storeDescription"
              name="storeDescription"
              rows={4}
              defaultValue={
                settings.storeDescription ?? ""
              }
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Tuliskan deskripsi singkat tentang toko..."
            />
          </div>

          <div>
            <label
              htmlFor="footerDescription"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Deskripsi Footer
            </label>

            <textarea
              id="footerDescription"
              name="footerDescription"
              rows={4}
              defaultValue={
                settings.footerDescription ?? ""
              }
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Masukkan deskripsi yang ingin ditampilkan pada bagian footer..."
            />

            <p className="mt-2 text-xs text-slate-500">
              Deskripsi ini akan ditampilkan pada bagian footer halaman customer.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* KONTAK */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Phone className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Kontak
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informasi kontak yang dapat digunakan pelanggan.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={
                  settings.email ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="whatsapp"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              WhatsApp
            </label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                defaultValue={
                  settings.whatsapp ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="081234567890"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* ALAMAT TOKO */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Alamat Toko
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tentukan alamat dan lokasi origin untuk pengiriman.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Alamat Lengkap
            </label>

            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={
                settings.address ?? ""
              }
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Masukkan alamat lengkap toko..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Kota
              </label>

              <input
                id="city"
                name="city"
                type="text"
                defaultValue={
                  settings.city ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Jakarta"
              />
            </div>

            <div>
              <label
                htmlFor="province"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Provinsi
              </label>

              <input
                id="province"
                name="province"
                type="text"
                defaultValue={
                  settings.province ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="DKI Jakarta"
              />
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Kode Pos
              </label>

              <input
                id="postalCode"
                name="postalCode"
                type="text"
                defaultValue={
                  settings.postalCode ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="12345"
              />
            </div>
          </div>

          {/* ================================================== */}
          {/* STORE GPS / SHIPPING ORIGIN */}
          {/* ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Navigation className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lokasi Origin Toko
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Digunakan sebagai titik awal perhitungan jarak dan ongkos kirim kurir internal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleGetCurrentLocation
                }
                disabled={
                  isPending ||
                  isLocating
                }
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengambil...
                  </>
                ) : (
                  <>
                    <LocateFixed className="h-4 w-4" />
                    Ambil Lokasi
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="latitude"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Latitude
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(event) =>
                    setLatitude(
                      event.target.value
                    )
                  }
                  disabled={isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="-6.2000000"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Longitude
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(event) =>
                    setLongitude(
                      event.target.value
                    )
                  }
                  disabled={isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="106.8166667"
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Klik <strong>Ambil Lokasi</strong> saat Anda berada di lokasi toko, atau masukkan koordinat secara manual.
              Lokasi ini akan digunakan sebagai origin pengiriman.
            </p>

            {/* ================================================ */}
            {/* STORE LOCATION MAP PREVIEW */}
            {/* ================================================ */}

            {hasValidLocation && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Preview Lokasi Origin
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Pastikan titik pada peta sesuai dengan lokasi toko.
                    </p>
                  </div>

                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    Lokasi Valid
                  </div>
                </div>

                <StoreLocationMapPreview
                  latitude={
                    previewLatitude
                  }
                  longitude={
                    previewLongitude
                  }
                  label={
                    settings.storeName ||
                    "Lokasi Origin Toko"
                  }
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* INTERNAL SHIPPING CONFIGURATION */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Truck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Konfigurasi Pengiriman
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Atur layanan dan perhitungan ongkos kirim kurir internal.
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* ENABLE / DISABLE */}
        {/* ================================================== */}

        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Aktifkan Kurir Internal
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Jika dinonaktifkan, layanan kurir internal tidak akan tersedia pada checkout.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={
              internalShippingEnabled
            }
            onClick={() =>
              setInternalShippingEnabled(
                (previous) => !previous
              )
            }
            disabled={isPending}
            className={[
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
              internalShippingEnabled
                ? "bg-emerald-600"
                : "bg-slate-300",
              isPending
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
                internalShippingEnabled
                  ? "translate-x-6"
                  : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        {/* ================================================== */}
        {/* SHIPPING FORM */}
        {/* ================================================== */}

        <div
          className={[
            "grid gap-5 transition",
            !internalShippingEnabled
              ? "pointer-events-none opacity-50"
              : "",
          ].join(" ")}
        >
          <div>
            <label
              htmlFor="internalShippingName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Layanan
            </label>

            <input
              id="internalShippingName"
              name="internalShippingName"
              type="text"
              defaultValue={
                settings.internalShippingName ||
                "Kurir Internal"
              }
              disabled={
                isPending ||
                !internalShippingEnabled
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Contoh: Pisjo Market Express"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="internalShippingBaseFee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Biaya Dasar
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  Rp
                </span>

                <input
                  id="internalShippingBaseFee"
                  name="internalShippingBaseFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    settings.internalShippingBaseFee
                  }
                  disabled={
                    isPending ||
                    !internalShippingEnabled
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="internalShippingPerKmFee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Biaya per KM
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  Rp
                </span>

                <input
                  id="internalShippingPerKmFee"
                  name="internalShippingPerKmFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    settings.internalShippingPerKmFee
                  }
                  disabled={
                    isPending ||
                    !internalShippingEnabled
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="internalShippingMaxDistance"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Jarak Maksimum Pengiriman
              </label>

              <div className="relative">
                <input
                  id="internalShippingMaxDistance"
                  name="internalShippingMaxDistance"
                  type="number"
                  min="0.1"
                  step="0.1"
                  defaultValue={
                    settings.internalShippingMaxDistance
                  }
                  disabled={
                    isPending ||
                    !internalShippingEnabled
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="10"
                />

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  KM
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="internalShippingFreeThreshold"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Gratis Ongkir Minimum Belanja
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  Rp
                </span>

                <input
                  id="internalShippingFreeThreshold"
                  name="internalShippingFreeThreshold"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    settings.internalShippingFreeThreshold ??
                    ""
                  }
                  disabled={
                    isPending ||
                    !internalShippingEnabled
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Opsional"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs leading-5 text-blue-700">
              Ongkir akan dihitung dari lokasi origin toko ke lokasi alamat customer.
              Perhitungan dasar:
              <strong>
                {" "}
                biaya dasar + (jarak × biaya per KM).
              </strong>
              {" "}
              Jika nilai belanja mencapai minimum gratis ongkir, biaya pengiriman menjadi Rp0.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* JAM OPERASIONAL */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Clock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Jam Operasional
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tentukan jam buka dan jam tutup toko.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="openingTime"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Jam Buka
            </label>

            <input
              id="openingTime"
              name="openingTime"
              type="time"
              defaultValue={
                settings.openingTime ?? ""
              }
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="closingTime"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Jam Tutup
            </label>

            <input
              id="closingTime"
              name="closingTime"
              type="time"
              defaultValue={
                settings.closingTime ?? ""
              }
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SUBMIT */}
      {/* ====================================================== */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isPending ||
            isLocating
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Pengaturan
            </>
          )}
        </button>
      </div>
    </form>
  );
}