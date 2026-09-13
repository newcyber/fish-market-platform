"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Loader2,
  MapPin,
  Navigation,
  Save,
} from "lucide-react";

import {
  updateAddressAction,
} from "@/actions/address/update-address";

import RegionSelector, {
  type RegionOption,
} from "@/components/customer/address/RegionSelector";

import useRegionOptions from "@/hooks/useRegionOptions";

import dynamic from "next/dynamic";

const AddressMapPicker = dynamic(
  () =>
    import(
      "@/components/customer/address/AddressMapPicker"
    ),
  {
    ssr: false,
  }
);

interface EditAddressFormProps {
  initialAddress: {
    id: string;

    receiverName: string;
    receiverPhone: string;

    province: string;
    provinceCode?: string | null;

    city: string;
    cityCode?: string | null;

    district: string;
    districtCode?: string | null;

    village: string;
    villageCode?: string | null;

    postalCode: string;
    fullAddress: string;

    latitude: number | null;
    longitude: number | null;

    label: string;
    notes: string;

    isDefault: boolean;
  };
}

export default function EditAddressForm({
  initialAddress,
}: EditAddressFormProps) {
  const router = useRouter();

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
  clearCities,
  clearDistricts,
  clearVillages,
} = useRegionOptions();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);

  const [
  isLocating,
  setIsLocating,
] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState({
    label:
      initialAddress.label,

    receiverName:
      initialAddress.receiverName,

    receiverPhone:
      initialAddress.receiverPhone,

    province:
      initialAddress.province,

    provinceCode:
      initialAddress.provinceCode ?? "",

    city:
      initialAddress.city,

    cityCode:
      initialAddress.cityCode ?? "",

    district:
      initialAddress.district,

    districtCode:
      initialAddress.districtCode ?? "",

    village:
      initialAddress.village,

    villageCode:
      initialAddress.villageCode ?? "",

    postalCode:
      initialAddress.postalCode,

    fullAddress:
      initialAddress.fullAddress,

    latitude:
      initialAddress.latitude !== null
        ? String(
            initialAddress.latitude
          )
        : "",

    longitude:
      initialAddress.longitude !== null
        ? String(
            initialAddress.longitude
          )
        : "",

    notes:
      initialAddress.notes,
  });

  const [selectedProvince, setSelectedProvince] =
    useState<RegionOption | null>(null);

  const [selectedCity, setSelectedCity] =
    useState<RegionOption | null>(null);

  const [selectedDistrict, setSelectedDistrict] =
    useState<RegionOption | null>(null);

  const [selectedVillage, setSelectedVillage] =
    useState<RegionOption | null>(null);

  /**
   * ============================================================
   * HANDLE CHANGE
   * ============================================================
   */
  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  function handleProvinceChange(
  option: RegionOption | null,
) {
  setSelectedProvince(option);

  setSelectedCity(null);
  setSelectedDistrict(null);
  setSelectedVillage(null);

  clearCities();
  clearDistricts();
  clearVillages();

  setFormData((previous) => ({
    ...previous,

    provinceCode:
      option?.code ?? "",

    province:
      option?.name ?? "",

    cityCode: "",
    city: "",

    districtCode: "",
    district: "",

    villageCode: "",
    village: "",
  }));

  if (option) {
    void loadCities(option.code);
  }
}

function handleCityChange(
  option: RegionOption | null,
) {
  setSelectedCity(option);

  setSelectedDistrict(null);
  setSelectedVillage(null);

  clearDistricts();
  clearVillages();

  setFormData((previous) => ({
    ...previous,

    cityCode:
      option?.code ?? "",

    city:
      option?.name ?? "",

    districtCode: "",
    district: "",

    villageCode: "",
    village: "",
  }));

  if (option) {
    void loadDistricts(option.code);
  }
}

function handleDistrictChange(
  option: RegionOption | null,
) {
  setSelectedDistrict(option);

  setSelectedVillage(null);

  clearVillages();

  setFormData((previous) => ({
    ...previous,

    districtCode:
      option?.code ?? "",

    district:
      option?.name ?? "",

    villageCode: "",
    village: "",
  }));

  if (option) {
    void loadVillages(option.code);
  }
}

function handleVillageChange(
  option: RegionOption | null,
) {
  setSelectedVillage(option);

  setFormData((previous) => ({
    ...previous,

    villageCode:
      option?.code ?? "",

    village:
      option?.name ?? "",
  }));
}

useEffect(() => {
  let cancelled = false;

  async function preloadRegion() {
    if (!provinces.length) {
      return;
    }

    const province =
      provinces.find(
        (item) =>
          item.code ===
          initialAddress.provinceCode,
      ) ??
      provinces.find(
        (item) =>
          item.name.trim().toLowerCase() ===
          initialAddress.province
            .trim()
            .toLowerCase(),
      );

    if (!province) {
      return;
    }

    if (cancelled) {
      return;
    }

    setSelectedProvince(province);

    setFormData((previous) => ({
      ...previous,
      provinceCode: province.code,
      province: province.name,
    }));

    const cityOptions =
      await loadCities(province.code);

    if (cancelled) {
      return;
    }

    const city =
      cityOptions.find(
        (item) =>
          item.code ===
          initialAddress.cityCode,
      ) ??
      cityOptions.find(
        (item) =>
          item.name.trim().toLowerCase() ===
          initialAddress.city
            .trim()
            .toLowerCase(),
      );

    if (!city) {
      return;
    }

    setSelectedCity(city);

    setFormData((previous) => ({
      ...previous,
      cityCode: city.code,
      city: city.name,
    }));

    const districtOptions =
      await loadDistricts(city.code);

    if (cancelled) {
      return;
    }

    const district =
      districtOptions.find(
        (item) =>
          item.code ===
          initialAddress.districtCode,
      ) ??
      districtOptions.find(
        (item) =>
          item.name.trim().toLowerCase() ===
          initialAddress.district
            .trim()
            .toLowerCase(),
      );

    if (!district) {
      return;
    }

    setSelectedDistrict(district);

    setFormData((previous) => ({
      ...previous,
      districtCode: district.code,
      district: district.name,
    }));

    const villageOptions =
      await loadVillages(district.code);

    if (cancelled) {
      return;
    }

    const village =
      villageOptions.find(
        (item) =>
          item.code ===
          initialAddress.villageCode,
      ) ??
      villageOptions.find(
        (item) =>
          item.name.trim().toLowerCase() ===
          initialAddress.village
            .trim()
            .toLowerCase(),
      );

    if (!village) {
      return;
    }

    setSelectedVillage(village);

    setFormData((previous) => ({
      ...previous,
      villageCode: village.code,
      village: village.name,
    }));
  }

  void preloadRegion();

  return () => {
    cancelled = true;
  };
}, [
  provinces,
  initialAddress.province,
  initialAddress.provinceCode,
  initialAddress.city,
  initialAddress.cityCode,
  initialAddress.district,
  initialAddress.districtCode,
  initialAddress.village,
  initialAddress.villageCode,
  loadCities,
  loadDistricts,
  loadVillages,
]);

  /**
 * ============================================================
 * DETECT CURRENT LOCATION
 * ============================================================
 */
function handleDetectLocation() {
  setMessage(null);
  setIsSuccess(false);

  if (!("geolocation" in navigator)) {
    setMessage(
      "Browser atau perangkat ini tidak mendukung GPS."
    );

    return;
  }

  setIsLocating(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      setFormData((previous) => ({
        ...previous,

        latitude:
          latitude.toFixed(7),

        longitude:
          longitude.toFixed(7),
      }));

      setIsLocating(false);

      setMessage(
        `Lokasi berhasil diperbarui. Akurasi sekitar ±${Math.round(
          position.coords.accuracy
        )} meter.`
      );
    },

    (error) => {
      setIsLocating(false);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          setMessage(
            "Izin lokasi ditolak. Aktifkan izin lokasi pada browser Anda."
          );
          break;

        case error.POSITION_UNAVAILABLE:
          setMessage(
            "Lokasi tidak tersedia. Pastikan GPS atau layanan lokasi perangkat aktif."
          );
          break;

        case error.TIMEOUT:
          setMessage(
            "Waktu pencarian lokasi habis. Silakan coba lagi."
          );
          break;

        default:
          setMessage(
            "Terjadi kesalahan saat mengambil lokasi."
          );
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
}
  /**
   * ============================================================
   * HANDLE SUBMIT
   * ============================================================
   */
  function handleSubmit(
    event: React.FormEvent<
      HTMLFormElement
    >
  ) {
    event.preventDefault();

    setMessage(null);
    setIsSuccess(false);

    /**
     * ==========================================================
     * CONVERT COORDINATES
     * ==========================================================
     */
    const latitude =
      formData.latitude.trim() === ""
        ? null
        : Number(
            formData.latitude
          );

    const longitude =
      formData.longitude.trim() === ""
        ? null
        : Number(
            formData.longitude
          );

    /**
     * ==========================================================
     * VALIDATE COORDINATES
     * ==========================================================
     */
    if (
      latitude !== null &&
      !Number.isFinite(latitude)
    ) {
      setMessage(
        "Latitude tidak valid."
      );

      return;
    }

    if (
      longitude !== null &&
      !Number.isFinite(longitude)
    ) {
      setMessage(
        "Longitude tidak valid."
      );

      return;
    }

    /**
     * ==========================================================
     * UPDATE ADDRESS
     * ==========================================================
     */
    startTransition(
      async () => {
        const result =
          await updateAddressAction(
            initialAddress.id,
            {
              label:
                formData.label.trim() ||
                null,

              receiverName:
                formData.receiverName,

              receiverPhone:
                formData.receiverPhone,

              provinceCode:
                formData.provinceCode || null,

              province:
                formData.province,

              cityCode:
                formData.cityCode || null,

              city:
                formData.city,

              districtCode:
                formData.districtCode || null,

              district:
                formData.district,

              villageCode:
                formData.villageCode || null,

              village:
                formData.village,

              postalCode:
                formData.postalCode,

              fullAddress:
                formData.fullAddress,

              latitude,

              longitude,

              notes:
                formData.notes.trim() ||
                null,
            }
          );

        setIsSuccess(
          result.success
        );

        setMessage(
          result.message
        );

        if (result.success) {
          setTimeout(() => {
            router.push(
              "/customer/addresses"
            );

            router.refresh();
          }, 700);
        }
      }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* INFORMASI PENERIMA */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">
          Informasi Penerima
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="label"
              className="mb-2 block text-sm font-medium"
            >
              Label Alamat
            </label>

            <input
              id="label"
              name="label"
              type="text"
              value={formData.label}
              onChange={handleChange}
              placeholder="Contoh: Rumah, Kantor"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

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
              required
              type="text"
              value={
                formData.receiverName
              }
              onChange={handleChange}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

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
              required
              type="tel"
              value={
                formData.receiverPhone
              }
              onChange={handleChange}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* WILAYAH */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">
          Wilayah
        </h2>

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
    disabled={!selectedProvince}
    required
    placeholder={
      selectedProvince
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
    disabled={!selectedCity}
    required
    placeholder={
      selectedCity
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
    disabled={!selectedDistrict}
    required
    placeholder={
      selectedDistrict
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
      required
      value={formData.postalCode}
      onChange={handleChange}
      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
    />
  </div>
</div>
      </div>

      {/* ====================================================== */}
      {/* DETAIL ALAMAT */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">
          Detail Alamat
        </h2>

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
          value={
            formData.fullAddress
          }
          onChange={handleChange}
          className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
        />

        <div className="mt-5">
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium"
          >
            Catatan untuk Kurir
            <span className="ml-1 text-muted-foreground">
              (opsional)
            </span>
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={
              formData.notes
            }
            onChange={handleChange}
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
      <h2 className="text-base font-semibold">
        Lokasi Pengiriman
      </h2>

      <p className="text-sm text-muted-foreground">
        Geser marker atau klik peta untuk memperbarui
        titik lokasi pengiriman.
      </p>
    </div>
  </div>

<div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-cyan-600" />

        <h3 className="font-semibold text-slate-900">
          Perbarui Lokasi
        </h3>
      </div>

      <p className="mt-1 text-sm text-slate-600">
        Gunakan GPS perangkat untuk memperbarui titik lokasi alamat Anda.
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

          Perbarui Lokasi Saya
        </>
      )}
    </button>
  </div>
</div>

  <AddressMapPicker
    latitude={
      formData.latitude.trim() === ""
        ? null
        : Number(formData.latitude)
    }
    longitude={
      formData.longitude.trim() === ""
        ? null
        : Number(formData.longitude)
    }
    onChange={(
      newLatitude,
      newLongitude
    ) => {
      setFormData((previous) => ({
        ...previous,

        latitude:
          newLatitude.toString(),

        longitude:
          newLongitude.toString(),
      }));
    }}
  />

  {/* ==================================================== */}
  {/* MANUAL COORDINATE INPUT */}
  {/* ==================================================== */}

  <div className="mt-5 grid gap-5 sm:grid-cols-2">
    <div>
      <label
        htmlFor="latitude"
        className="mb-2 block text-sm font-medium"
      >
        Latitude
      </label>

      <input
        id="latitude"
        name="latitude"
        type="number"
        step="any"
        value={formData.latitude}
        onChange={handleChange}
        placeholder="-6.2088000"
        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
      />
    </div>

    <div>
      <label
        htmlFor="longitude"
        className="mb-2 block text-sm font-medium"
      >
        Longitude
      </label>

      <input
        id="longitude"
        name="longitude"
        type="number"
        step="any"
        value={formData.longitude}
        onChange={handleChange}
        placeholder="106.8456000"
        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
      />
    </div>
  </div>
</div>

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
      {/* ACTIONS */}
      {/* ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            router.push(
              "/customer/addresses"
            )
          }
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

              Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </form>
  );
}