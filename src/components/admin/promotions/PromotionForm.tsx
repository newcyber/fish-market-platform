"use client";

import {
  useActionState,
  useMemo,
  useState,
} from "react";

import {
  PromotionDiscountType,
  PromotionType,
} from "@prisma/client";

import {
  createPromotionAction,
} from "@/actions/promotion/create-promotion";

import {
  updatePromotionAction,
} from "@/actions/promotion/update-promotion";

import type {
  ActionResult,
} from "@/types/action-result";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface PromotionFormInitialData {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  banner?: string | null;
  type?: PromotionType;
  discountType?: PromotionDiscountType | null;
  discountValue?: string | number | null;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  sortOrder?: number;
  isFeatured?: boolean;
}

interface PromotionFormProps {
  mode?: "create" | "edit";
  initialData?: PromotionFormInitialData;
}

/**
 * ============================================================
 * INITIAL STATE
 * ============================================================
 */

const initialState: ActionResult = {
  success: false,
  message: "",
};

/**
 * ============================================================
 * FORMAT DATETIME-LOCAL
 * ============================================================
 *
 * datetime-local tidak menerima ISO UTC secara langsung.
 * Nilai harus diformat menggunakan timezone browser.
 */

function formatDateTimeLocal(
  value?: Date | string | null
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) =>
    String(number).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") +
    "T" +
    [
      pad(date.getHours()),
      pad(date.getMinutes()),
    ].join(":");
}

/**
 * ============================================================
 * PROMOTION FORM
 * ============================================================
 */

export default function PromotionForm({
  mode = "create",
  initialData,
}: PromotionFormProps) {
  const isEdit =
    mode === "edit";

  const action =
    useMemo(
      () =>
        isEdit
          ? updatePromotionAction.bind(
              null,
              initialData?.id ?? ""
            )
          : createPromotionAction,
      [
        isEdit,
        initialData?.id,
      ]
    );

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    action,
    initialState
  );

  const [
    promotionType,
    setPromotionType,
  ] = useState<PromotionType>(
    initialData?.type ??
      PromotionType.MARKETING
  );

  const [
    slug,
    setSlug,
  ] = useState(
    initialData?.slug ?? ""
  );

  const [
    slugManuallyEdited,
    setSlugManuallyEdited,
  ] = useState(
    isEdit
      ? true
      : false
  );

  const [
    name,
    setName,
  ] = useState(
    initialData?.name ?? ""
  );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {/* ================================================== */}
      {/* ERROR / MESSAGE */}
      {/* ================================================== */}

      {state.message && (
        <div
          className={
            state.success
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {state.message}
        </div>
      )}

      {/* ================================================== */}
      {/* BASIC INFORMATION */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900">
            Informasi Promotion
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? "Perbarui informasi promotion yang sudah ada."
              : "Informasi dasar promotion yang akan ditampilkan di halaman customer."}
          </p>
        </div>

        <div className="grid gap-5">

          {/* NAME */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Promotion
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
  id="name"
  name="name"
  type="text"
  required
  value={name}
  onChange={(event) => {
    const nextName =
      event.target.value;

    setName(nextName);

    /**
     * Generate slug otomatis selama
     * admin belum mengubah slug secara manual.
     */
    if (!slugManuallyEdited) {
      const generatedSlug =
        nextName
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9\s-]/g,
            ""
          )
          .replace(
            /\s+/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          );

      setSlug(
        generatedSlug
      );
    }
  }}
              placeholder="Contoh: Promo Ikan Segar Weekend"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* SLUG */}

          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Slug
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(event) => {
                setSlug(
                  event.target.value
                );

                setSlugManuallyEdited(
                  true
                );
              }}
              placeholder="promo-ikan-segar-weekend"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Digunakan sebagai alamat URL promotion.
            </p>
          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Deskripsi
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={
                initialData?.description ?? ""
              }
              placeholder="Jelaskan detail promotion..."
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* BANNER */}

          <div>
            <label
              htmlFor="banner"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Banner URL
            </label>

            <input
              id="banner"
              name="banner"
              type="text"
              defaultValue={
                initialData?.banner ?? ""
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Untuk sementara menggunakan URL gambar.
              Upload banner dapat kita integrasikan
              kemudian dengan StorageService.
            </p>
          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* PROMOTION TYPE */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900">
            Aturan Promotion
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tentukan apakah promotion hanya campaign
            atau memberikan potongan harga.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* TYPE */}

          <div>
            <label
              htmlFor="type"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Tipe Promotion
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="type"
              name="type"
              value={promotionType}
              onChange={(event) =>
                setPromotionType(
                  event.target.value as PromotionType
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option
                value={
                  PromotionType.MARKETING
                }
              >
                Marketing
              </option>

              <option
                value={
                  PromotionType.PRICE_DISCOUNT
                }
              >
                Price Discount
              </option>
            </select>
          </div>

        </div>

        {/* ================================================= */}
        {/* PRICE DISCOUNT */}
        {/* ================================================= */}

        {promotionType ===
          PromotionType.PRICE_DISCOUNT && (
          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">

            <div className="mb-5">
              <p className="text-sm font-bold text-slate-900">
                Pengaturan Discount
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Promotion Price Discount wajib memiliki
                jenis dan nilai discount.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* DISCOUNT TYPE */}

              <div>
                <label
                  htmlFor="discountType"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Jenis Discount
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="discountType"
                  name="discountType"
                  required
                  defaultValue={
                    initialData?.discountType ??
                    PromotionDiscountType.PERCENTAGE
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option
                    value={
                      PromotionDiscountType.PERCENTAGE
                    }
                  >
                    Percentage (%)
                  </option>

                  <option
                    value={
                      PromotionDiscountType.FIXED_AMOUNT
                    }
                  >
                    Fixed Amount (Rp)
                  </option>
                </select>
              </div>

              {/* DISCOUNT VALUE */}

              <div>
                <label
                  htmlFor="discountValue"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nilai Discount
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={
                    initialData?.discountValue != null
                      ? String(initialData.discountValue)
                      : ""
                  }
                  placeholder="Contoh: 10"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>

            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* MARKETING INFO */}
        {/* ================================================= */}

        {promotionType ===
          PromotionType.MARKETING && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

            <p className="text-sm font-semibold text-slate-700">
              Marketing Promotion
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Promotion Marketing tidak mengubah harga
              produk sehingga pengaturan discount tidak
              diperlukan.
            </p>

          </div>
        )}

      </section>

      {/* ================================================== */}
      {/* SCHEDULE */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900">
            Periode Promotion
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tentukan kapan promotion mulai dan berakhir.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* START */}

          <div>
            <label
              htmlFor="startAt"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Mulai
            </label>

            <input
              id="startAt"
              name="startAt"
              type="datetime-local"
              defaultValue={
                formatDateTimeLocal(
                  initialData?.startAt
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* END */}

          <div>
            <label
              htmlFor="endAt"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Berakhir
            </label>

            <input
              id="endAt"
              name="endAt"
              type="datetime-local"
              defaultValue={
                formatDateTimeLocal(
                  initialData?.endAt
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

        </div>

        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">

          <p className="text-xs leading-5 text-amber-700">
            {isEdit
              ? "Perubahan data tidak mengubah lifecycle promotion. Schedule, Activate, End, dan Cancel tetap dilakukan melalui action lifecycle."
              : "Promotion yang baru dibuat akan berstatus DRAFT. Lifecycle seperti Schedule dan Activate dilakukan setelah promotion dibuat."}
          </p>

        </div>

      </section>

      {/* ================================================== */}
      {/* DISPLAY SETTINGS */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900">
            Pengaturan Tampilan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Atur prioritas tampilan promotion kepada customer.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* SORT ORDER */}

          <div>
            <label
              htmlFor="sortOrder"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Sort Order
            </label>

            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={
                initialData?.sortOrder ?? 0
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Angka lebih kecil tampil lebih dahulu.
            </p>
          </div>

          {/* FEATURED */}

          <div className="flex items-center">

            <label className="flex cursor-pointer items-start gap-3">

              <input
                name="isFeatured"
                type="checkbox"
                value="true"
                defaultChecked={
                  initialData?.isFeatured ?? false
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-700">
                  Featured Promotion
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Tandai promotion sebagai promotion unggulan.
                </span>
              </span>

            </label>

          </div>

        </div>

      </section>

      {/* ================================================== */}
      {/* ACTION */}
      {/* ================================================== */}

      <div className="flex items-center justify-end gap-3">

        <a
          href={
            isEdit && initialData?.id
              ? `/admin/promotions/${initialData.id}`
              : "/admin/promotions"
          }
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </a>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Menyimpan..."
            : isEdit
              ? "Simpan Perubahan"
              : "Buat Promotion"}
        </button>

      </div>

    </form>
  );
}
