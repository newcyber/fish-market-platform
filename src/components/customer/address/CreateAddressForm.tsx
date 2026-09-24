"use client";

import dynamic from "next/dynamic";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Loader2, MapPin, Navigation, Save } from "lucide-react";

import { createAddressAction } from "@/actions/address/create-address";

import RegionSelector, {
  type RegionOption,
} from "@/components/customer/address/RegionSelector";

import useRegionOptions from "@/hooks/useRegionOptions";

const AddressMapPicker = dynamic(
  () => import("@/components/customer/address/AddressMapPicker"),
  {
    ssr: false,
  },
);

export default function CreateAddressForm() {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [message, setMessage] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  const [isLocating, setIsLocating] = useState(false);

  const [formData, setFormData] = useState({
    label: "Rumah",
    receiverName: "",
    receiverPhone: "",

    province: "",
    provinceCode: "",

    city: "",
    cityCode: "",

    district: "",
    districtCode: "",

    village: "",
    villageCode: "",

    postalCode: "",
    fullAddress: "",

    latitude: "",
    longitude: "",

    notes: "",
    isDefault: false,
  });

  const {
    provinces,
    cities,
    districts,
    villages,

    provincesLoading,
    citiesLoading,
    districtsLoading,
    villagesLoading,

    error: regionError,

    loadCities,
    loadDistricts,
    loadVillages,
  } = useRegionOptions();

  const selectedProvince: RegionOption | null = formData.provinceCode
    ? {
        code: formData.provinceCode,
        name: formData.province,
      }
    : null;

  const selectedCity: RegionOption | null = formData.cityCode
    ? {
        code: formData.cityCode,
        name: formData.city,
      }
    : null;

  const selectedDistrict: RegionOption | null = formData.districtCode
    ? {
        code: formData.districtCode,
        name: formData.district,
      }
    : null;

  const selectedVillage: RegionOption | null = formData.villageCode
    ? {
        code: formData.villageCode,
        name: formData.village,
        postalCode: formData.postalCode || null,
      }
    : null;

  function handleProvinceChange(option: RegionOption | null) {
    setFormData((previous) => ({
      ...previous,

      province: option?.name ?? "",
      provinceCode: option?.code ?? "",

      city: "",
      cityCode: "",

      district: "",
      districtCode: "",

      village: "",
      villageCode: "",
      postalCode: "",
    }));

    void loadCities(option?.code ?? "");
  }

  function handleCityChange(option: RegionOption | null) {
    setFormData((previous) => ({
      ...previous,

      city: option?.name ?? "",
      cityCode: option?.code ?? "",

      district: "",
      districtCode: "",

      village: "",
      villageCode: "",
      postalCode: "",
    }));

    void loadDistricts(option?.code ?? "");
  }

  function handleDistrictChange(option: RegionOption | null) {
    setFormData((previous) => ({
      ...previous,

      district: option?.name ?? "",
      districtCode: option?.code ?? "",

      village: "",
      villageCode: "",
      postalCode: "",
    }));

    void loadVillages(option?.code ?? "");
  }

  const handleVillageChange = (option: RegionOption | null) => {
    const selectedOption = option
      ? (villages.find((village) => village.code === option.code) ?? option)
      : null;

    setFormData((previous) => ({
      ...previous,
      village: selectedOption?.name ?? "",
      villageCode: selectedOption?.code ?? "",
      postalCode: selectedOption?.postalCode ?? "",
    }));
  };

  /**
   * ============================================================
   * HANDLE CHANGE
   * ============================================================
   */
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = event.target;

    const checked =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : undefined;

    setFormData((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /**
   * ============================================================
   * DETECT CURRENT LOCATION
   * ============================================================
   */
  function handleDetectLocation() {
    setMessage(null);

    if (!("geolocation" in navigator)) {
      setMessage("Browser atau perangkat ini tidak mendukung GPS.");

      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;

        const longitude = position.coords.longitude;

        setFormData((previous) => ({
          ...previous,

          latitude: latitude.toFixed(7),

          longitude: longitude.toFixed(7),
        }));

        setIsLocating(false);

        setMessage(
          `Lokasi berhasil ditemukan. Akurasi sekitar ±${Math.round(
            position.coords.accuracy,
          )} meter.`,
        );
      },

      (error) => {
        setIsLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setMessage(
              "Izin lokasi ditolak. Aktifkan izin lokasi pada browser Anda.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setMessage(
              "Lokasi tidak tersedia. Pastikan GPS atau layanan lokasi perangkat aktif.",
            );
            break;

          case error.TIMEOUT:
            setMessage("Waktu pencarian lokasi habis. Silakan coba lagi.");
            break;

          default:
            setMessage("Terjadi kesalahan saat mengambil lokasi.");
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  /**
   * ============================================================
   * HANDLE SUBMIT
   * ============================================================
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setIsSuccess(false);

    /**
     * ==========================================================
     * CONVERT COORDINATES
     * ==========================================================
     */
    const latitude =
      formData.latitude.trim() === "" ? null : Number(formData.latitude);

    const longitude =
      formData.longitude.trim() === "" ? null : Number(formData.longitude);

    if (latitude !== null && !Number.isFinite(latitude)) {
      setMessage("Latitude tidak valid.");

      return;
    }

    if (longitude !== null && !Number.isFinite(longitude)) {
      setMessage("Longitude tidak valid.");

      return;
    }

    startTransition(async () => {
      const result = await createAddressAction({
        label: formData.label.trim() || null,

        receiverName: formData.receiverName,

        receiverPhone: formData.receiverPhone,

        provinceCode: formData.provinceCode || null,

        cityCode: formData.cityCode || null,

        districtCode: formData.districtCode || null,

        villageCode: formData.villageCode || null,

        province: formData.province,

        city: formData.city,

        district: formData.district,

        village: formData.village,

        postalCode: formData.postalCode,

        fullAddress: formData.fullAddress,

        latitude,

        longitude,

        notes: formData.notes.trim() || null,

        isDefault: formData.isDefault,
      });

      setIsSuccess(result.success);

      setMessage(result.message);

      if (result.success) {
        setTimeout(() => {
          router.push("/customer/addresses");

          router.refresh();
        }, 800);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ====================================================== */}
      {/* BASIC INFO */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">Informasi Penerima</h2>

        <div className="grid gap-5 sm:grid-cols-2">

          {/* RECEIVER NAME */}

          <div>
            <label
              htmlFor="receiverName"
              className="mb-2 block text-sm font-medium"
            >
              Nama Penerima
            </label>

            <input
              id="receiverName"
              name="receiverName"
              type="text"
              required
              placeholder="Nama penerima"
              value={formData.receiverName}
              onChange={handleChange}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

          {/* PHONE */}

          <div>
            <label
              htmlFor="receiverPhone"
              className="mb-2 block text-sm font-medium"
            >
              Nomor Telepon
            </label>

            <input
              id="receiverPhone"
              name="receiverPhone"
              type="tel"
              required
              placeholder="08xxxxxxxxxx"
              value={formData.receiverPhone}
              onChange={handleChange}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

{/* LABEL ALAMAT */}

<div className="sm:col-span-2">
  <div className="mb-2">
    <p className="text-sm font-medium">
      Label Alamat
    </p>

    <p className="mt-1 text-xs text-muted-foreground">
      Pilih jenis alamat
    </p>
  </div>

  <div className="grid grid-cols-2 gap-2 sm:max-w-md">
    {[
      {
        value: "Rumah",
        title: "Rumah",
        icon: "🏠",
      },
      {
        value: "Kantor",
        title: "Kantor",
        icon: "🏢",
      },
    ].map((option) => {
      const isSelected =
        formData.label === option.value;

      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={isSelected}
          onClick={() =>
            setFormData((previous) => ({
              ...previous,
              label: option.value,
            }))
          }
          className={`flex min-h-12 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition active:scale-[0.98] ${
            isSelected
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="text-lg leading-none"
              aria-hidden="true"
            >
              {option.icon}
            </span>

            <span className="truncate text-sm font-medium">
              {option.title}
            </span>
          </span>

          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40"
            }`}
            aria-hidden="true"
          >
            {isSelected && (
              <span className="text-[10px] font-bold leading-none">
                ✓
              </span>
            )}
          </span>
        </button>
      );
    })}
  </div>
</div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* REGION */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">Wilayah</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <RegionSelector
            id="province"
            label="Provinsi"
            value={selectedProvince}
            options={provinces}
            loading={provincesLoading}
            required
            placeholder="Cari provinsi..."
            onChange={handleProvinceChange}
          />

          <RegionSelector
            id="city"
            label="Kota / Kabupaten"
            value={selectedCity}
            options={cities}
            loading={citiesLoading}
            disabled={!formData.provinceCode}
            required
            placeholder={
              formData.provinceCode
                ? "Cari kota / kabupaten..."
                : "Pilih provinsi terlebih dahulu"
            }
            onChange={handleCityChange}
          />

          <RegionSelector
            id="district"
            label="Kecamatan"
            value={selectedDistrict}
            options={districts}
            loading={districtsLoading}
            disabled={!formData.cityCode}
            required
            placeholder={
              formData.cityCode
                ? "Cari kecamatan..."
                : "Pilih kota / kabupaten terlebih dahulu"
            }
            onChange={handleDistrictChange}
          />

          <RegionSelector
            id="village"
            label="Kelurahan / Desa"
            value={selectedVillage}
            options={villages}
            loading={villagesLoading}
            disabled={!formData.districtCode}
            required
            placeholder={
              formData.districtCode
                ? "Cari kelurahan / desa..."
                : "Pilih kecamatan terlebih dahulu"
            }
            onChange={handleVillageChange}
          />

          <div>
            <label
              htmlFor="postalCode"
              className="mb-2 block text-sm font-medium"
            >
              Kode Pos
            </label>

            <input
              id="postalCode"
              name="postalCode"
              type="text"
              inputMode="numeric"
              required
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Contoh: 55714"
              maxLength={5}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>
        </div>

        {regionError && (
          <p className="mt-3 text-sm text-red-600">{regionError}</p>
        )}
      </div>

      {/* ====================================================== */}
      {/* FULL ADDRESS */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">Detail Alamat</h2>

        <div>
          <label
            htmlFor="fullAddress"
            className="mb-2 block text-sm font-medium"
          >
            Alamat Lengkap
          </label>

          <textarea
            id="fullAddress"
            name="fullAddress"
            required
            rows={4}
            value={formData.fullAddress}
            onChange={handleChange}
            placeholder="Nama jalan, nomor rumah, RT/RW, patokan, dan detail lainnya"
            className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Catatan untuk Kurir
            <span className="ml-1 text-muted-foreground">(opsional)</span>
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Contoh: Rumah pagar hitam, dekat masjid"
            className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* LOKASI PENGIRIMAN */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <MapPin className="h-5 w-5" />

          <div>
            <h2 className="text-base font-semibold">Lokasi Pengiriman</h2>

            <p className="text-sm text-muted-foreground">
              Pilih titik lokasi pengiriman agar kurir dapat menemukan alamat
              dengan lebih akurat.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-600" />

                <h3 className="font-semibold text-slate-900">
                  Tentukan Lokasi
                </h3>
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Gunakan GPS perangkat untuk menentukan titik lokasi alamat Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating || isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencari Lokasi...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Gunakan Lokasi Saya
                </>
              )}
            </button>
          </div>
        </div>

        <AddressMapPicker
         showCoordinates={false}
          latitude={
            formData.latitude.trim() === "" ? null : Number(formData.latitude)
          }
          longitude={
            formData.longitude.trim() === "" ? null : Number(formData.longitude)
          }
          onChange={(newLatitude, newLongitude) => {
            setFormData((previous) => ({
              ...previous,

              latitude: newLatitude.toString(),

              longitude: newLongitude.toString(),
            }));
          }}
        />

      {/* ====================================================== */}

     </div>

     {/* DEFAULT */}
      {/* ====================================================== */}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="mt-1 h-4 w-4"
        />

        <div>
          <p className="text-sm font-medium">Jadikan sebagai alamat utama</p>

          <p className="text-xs text-muted-foreground">
            Alamat ini akan dipilih secara otomatis saat checkout.
          </p>
        </div>
      </label>

      {/* ====================================================== */}
      {/* MESSAGE */}
      {/* ====================================================== */}

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            isSuccess
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* ====================================================== */}
      {/* SUBMIT */}
      {/* ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/customer/addresses")}
          disabled={isPending}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Alamat
            </>
          )}
        </button>
      </div>
    </form>
  );
}
