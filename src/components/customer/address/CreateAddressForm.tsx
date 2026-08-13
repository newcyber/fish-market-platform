"use client";

import dynamic from "next/dynamic";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Loader2,
  MapPin,
  Save,
} from "lucide-react";

import { createAddressAction } from "@/actions/address/create-address";

const AddressMapPicker = dynamic(
  () =>
    import(
      "@/components/customer/address/AddressMapPicker"
    ),
  {
    ssr: false,
  }
);

export default function CreateAddressForm() {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [formData, setFormData] =
    useState({
      label: "",
      receiverName: "",
      receiverPhone: "",

      province: "",
      city: "",
      district: "",
      village: "",

      postalCode: "",
      fullAddress: "",

      latitude: "",
      longitude: "",

      notes: "",
      isDefault: false,
    });

  /**
   * ============================================================
   * HANDLE CHANGE
   * ============================================================
   */
  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const {
      name,
      value,
      type,
    } = event.target;

    const checked =
      type === "checkbox"
        ? (
            event.target as HTMLInputElement
          ).checked
        : undefined;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  /**
   * ============================================================
   * HANDLE SUBMIT
   * ============================================================
   */
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
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
        : Number(formData.latitude);

    const longitude =
      formData.longitude.trim() === ""
        ? null
        : Number(formData.longitude);

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

    startTransition(async () => {
      const result =
        await createAddressAction({
          label:
            formData.label.trim() || null,

          receiverName:
            formData.receiverName,

          receiverPhone:
            formData.receiverPhone,

          province:
            formData.province,

          city:
            formData.city,

          district:
            formData.district,

          village:
            formData.village,

          postalCode:
            formData.postalCode,

          fullAddress:
            formData.fullAddress,

          latitude,

          longitude,

          notes:
            formData.notes.trim() || null,

          isDefault:
            formData.isDefault,
        });

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
        }, 800);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* BASIC INFO */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">
          Informasi Penerima
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* LABEL */}

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
              placeholder="Contoh: Rumah, Kantor"
              value={formData.label}
              onChange={handleChange}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

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
        </div>
      </div>

      {/* ====================================================== */}
      {/* REGION */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">
          Wilayah
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="province"
              className="mb-2 block text-sm font-medium"
            >
              Provinsi
            </label>

            <input
              id="province"
              name="province"
              required
              value={formData.province}
              onChange={handleChange}
              placeholder="Contoh: Jawa Barat"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium"
            >
              Kota / Kabupaten
            </label>

            <input
              id="city"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              placeholder="Contoh: Bandung"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="district"
              className="mb-2 block text-sm font-medium"
            >
              Kecamatan
            </label>

            <input
              id="district"
              name="district"
              required
              value={formData.district}
              onChange={handleChange}
              placeholder="Nama kecamatan"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="village"
              className="mb-2 block text-sm font-medium"
            >
              Kelurahan / Desa
            </label>

            <input
              id="village"
              name="village"
              required
              value={formData.village}
              onChange={handleChange}
              placeholder="Nama kelurahan"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>

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
              placeholder="Contoh: 40123"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FULL ADDRESS */}
      {/* ====================================================== */}

      <div className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="mb-5 text-base font-semibold">
          Detail Alamat
        </h2>

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
      <h2 className="text-base font-semibold">
        Lokasi Pengiriman
      </h2>

      <p className="text-sm text-muted-foreground">
        Pilih titik lokasi pengiriman agar kurir dapat
        menemukan alamat dengan lebih akurat.
      </p>
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
          <p className="text-sm font-medium">
            Jadikan sebagai alamat utama
          </p>

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
          onClick={() =>
            router.push("/customer/addresses")
          }
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