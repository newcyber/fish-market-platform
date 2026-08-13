"use client";

import {
  useState,
  useTransition,
} from "react";

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
} from "lucide-react";

import {
  updateSettingsAction,
} from "@/actions/admin/settings/update-settings";

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
 * SUBMIT
 * ==========================================================
 */
function handleSubmit(
  formData: FormData
) {
  setMessage(null);
  setIsSuccess(null);

  const input = {
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
        await updateSettingsAction(input);

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
              Kelola informasi utama Fish Market.
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
              placeholder="Contoh: Fish Market"
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
        </div>
      </section>

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
    defaultValue={settings.footerDescription ?? ""}
    disabled={isPending}
    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
    placeholder="Masukkan deskripsi yang ingin ditampilkan pada bagian footer..."
  />

  <p className="mt-2 text-xs text-slate-500">
    Deskripsi ini akan ditampilkan pada bagian footer halaman customer.
  </p>
</div>

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
                defaultValue={settings.email ?? ""}
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
                defaultValue={settings.whatsapp ?? ""}
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
              Tentukan lokasi dan alamat operasional toko.
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
              defaultValue={settings.address ?? ""}
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
                defaultValue={settings.city ?? ""}
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
                defaultValue={settings.province ?? ""}
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
                defaultValue={settings.postalCode ?? ""}
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="12345"
              />
            </div>
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
          disabled={isPending}
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