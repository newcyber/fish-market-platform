"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  VoucherDiscountType,
} from "@prisma/client";

import {
  useRouter,
} from "next/navigation";

type VoucherFormValues = {
  code: string;

  name: string;

  description: string;

  discountType:
    VoucherDiscountType;

  discountValue: string;

  minimumPurchase: string;

  maximumDiscount: string;

  usageLimit: string;

  perUserLimit: string;

  startAt: string;

  endAt: string;

  isActive: boolean;
};

type VoucherFormProps = {
  initialData?: {
    id?: string;

    code: string;
    name: string;
    description?: string | null;

    discountType:
      VoucherDiscountType;

    discountValue:
      number | string;

    minimumPurchase?:
  number | null;

maximumDiscount?:
  number | null;  

    usageLimit?:
      number | null;

    perUserLimit?:
      number | null;

    startAt?:
      Date | string | null;

    endAt?:
      Date | string | null;

    isActive: boolean;
  };

  mode?: "create" | "edit";
};

function formatDateTimeLocal(
  value?: Date | string | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() *
    60_000;

  return new Date(
    date.getTime() -
      timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

function getInitialValues(
  initialData?: VoucherFormProps["initialData"]
): VoucherFormValues {
  return {
    code:
      initialData?.code ?? "",

    name:
      initialData?.name ?? "",

    description:
      initialData?.description ?? "",

    discountType:
      initialData?.discountType ??
      VoucherDiscountType.FIXED_AMOUNT,

    discountValue:
      initialData
        ? String(
            initialData.discountValue
          )
        : "",

        minimumPurchase:
  initialData?.minimumPurchase !==
  null
    ? initialData?.minimumPurchase !==
      undefined
      ? String(
          initialData.minimumPurchase
        )
      : ""
    : "",

maximumDiscount:
  initialData?.maximumDiscount !==
  null
    ? initialData?.maximumDiscount !==
      undefined
      ? String(
          initialData.maximumDiscount
        )
      : ""
    : "",
    
    usageLimit:
      initialData?.usageLimit !==
      null
        ? initialData?.usageLimit !==
          undefined
          ? String(
              initialData.usageLimit
            )
          : ""
        : "",

    perUserLimit:
      initialData?.perUserLimit !==
      null
        ? initialData?.perUserLimit !==
          undefined
          ? String(
              initialData.perUserLimit
            )
          : ""
        : "",

    startAt:
      formatDateTimeLocal(
        initialData?.startAt
      ),

    endAt:
      formatDateTimeLocal(
        initialData?.endAt
      ),

    isActive:
      initialData?.isActive ??
      true,
  };
}

export function VoucherForm({
  initialData,
  mode = "create",
}: VoucherFormProps) {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<VoucherFormValues>(
      getInitialValues(
        initialData
      )
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const isPercentage =
    form.discountType ===
    VoucherDiscountType.PERCENTAGE;

  const submitLabel =
    mode === "create"
      ? "Simpan Voucher"
      : "Simpan Perubahan";

  const discountPreview =
    useMemo(() => {
      const value =
        Number(
          form.discountValue
        );

      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {
        return null;
      }

      if (isPercentage) {
        return `${value}%`;
      }

      return new Intl.NumberFormat(
        "id-ID",
        {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }
      ).format(value);
    }, [
      form.discountValue,
      isPercentage,
    ]);

  function updateField<
    K extends keyof VoucherFormValues
  >(
    key: K,
    value: VoucherFormValues[K]
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  }

  function validateForm():
    | string
    | null {
    const code =
      form.code.trim();

    const name =
      form.name.trim();

    const discountValue =
      Number(
        form.discountValue
      );

    if (!code) {
      return (
        "Kode voucher wajib diisi."
      );
    }

    if (
      !/^[A-Z0-9_-]+$/i.test(
        code
      )
    ) {
      return (
        "Kode voucher hanya boleh menggunakan huruf, angka, underscore, atau tanda minus."
      );
    }

    if (!name) {
      return (
        "Nama voucher wajib diisi."
      );
    }

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue <= 0
    ) {
      return (
        "Nilai diskon harus lebih dari 0."
      );
    }

    if (
      form.discountType ===
        VoucherDiscountType.PERCENTAGE &&
      discountValue > 100
    ) {
      return (
        "Diskon persentase tidak boleh lebih dari 100%."
      );
    }

    if (
  form.minimumPurchase !== ""
) {
  const minimumPurchase =
    Number(
      form.minimumPurchase
    );

  if (
    !Number.isFinite(
      minimumPurchase
    ) ||
    minimumPurchase < 0
  ) {
    return (
      "Minimum pembelian harus berupa angka 0 atau lebih."
    );
  }
}

if (
  form.maximumDiscount !== ""
) {
  const maximumDiscount =
    Number(
      form.maximumDiscount
    );

  if (
    !Number.isFinite(
      maximumDiscount
    ) ||
    maximumDiscount <= 0
  ) {
    return (
      "Maximum diskon harus lebih dari 0."
    );
  }

  if (
    form.discountType !==
    VoucherDiscountType.PERCENTAGE
  ) {
    return (
      "Maximum diskon hanya dapat digunakan untuk voucher persentase."
    );
  }
}

    if (
      form.usageLimit !== ""
    ) {
      const usageLimit =
        Number(
          form.usageLimit
        );

      if (
        !Number.isInteger(
          usageLimit
        ) ||
        usageLimit < 1
      ) {
        return (
          "Batas penggunaan harus berupa angka bulat minimal 1."
        );
      }
    }

    if (
      form.perUserLimit !== ""
    ) {
      const perUserLimit =
        Number(
          form.perUserLimit
        );

      if (
        !Number.isInteger(
          perUserLimit
        ) ||
        perUserLimit < 1
      ) {
        return (
          "Batas penggunaan per user harus berupa angka bulat minimal 1."
        );
      }
    }

    if (
      form.startAt &&
      form.endAt
    ) {
      const startAt =
        new Date(
          form.startAt
        );

      const endAt =
        new Date(
          form.endAt
        );

      if (
        endAt <= startAt
      ) {
        return (
          "Tanggal berakhir harus setelah tanggal mulai."
        );
      }
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        code:
          form.code
            .trim()
            .toUpperCase(),

        name:
          form.name.trim(),

        description:
          form.description.trim() ||
          null,

        discountType:
          form.discountType,

        discountValue:
          Number(
            form.discountValue
          ),

          minimumPurchase:
  form.minimumPurchase === ""
    ? null
    : Number(
        form.minimumPurchase
      ),

maximumDiscount:
  form.maximumDiscount === ""
    ? null
    : Number(
        form.maximumDiscount
      ),

        usageLimit:
          form.usageLimit === ""
            ? null
            : Number(
                form.usageLimit
              ),

        perUserLimit:
          form.perUserLimit === ""
            ? null
            : Number(
                form.perUserLimit
              ),

        startAt:
          form.startAt
            ? new Date(
                form.startAt
              ).toISOString()
            : null,

        endAt:
          form.endAt
            ? new Date(
                form.endAt
              ).toISOString()
            : null,

        isActive:
          form.isActive,
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/vouchers"
          : `/api/admin/vouchers/${initialData?.id}`;

      const method =
        mode === "create"
          ? "POST"
          : "PATCH";

      const response =
        await fetch(
          endpoint,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Gagal menyimpan voucher."
        );
      }

      router.push(
        "/admin/vouchers"
      );

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan saat menyimpan voucher."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ================================================
          INFORMASI VOUCHER
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Informasi Voucher
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Informasi dasar untuk voucher promo.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Kode Voucher
            </label>

            <input
              id="code"
              type="text"
              value={form.code}
              onChange={(event) =>
                updateField(
                  "code",
                  event.target.value
                    .toUpperCase()
                )
              }
              placeholder="Contoh: HEMAT10"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <p className="mt-2 text-xs text-gray-500">
              Gunakan huruf, angka, underscore,
              atau tanda minus.
            </p>
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nama Voucher
            </label>

            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              placeholder="Contoh: Diskon Belanja Akhir Pekan"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Deskripsi
            <span className="ml-1 font-normal text-gray-400">
              (Opsional)
            </span>
          </label>

          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            placeholder="Masukkan deskripsi voucher..."
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
          />
        </div>
      </section>

      {/* ================================================
          DISKON
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Pengaturan Diskon
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan jenis dan nilai diskon voucher.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="discountType"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Tipe Diskon
            </label>

            <select
              id="discountType"
              value={
                form.discountType
              }
              onChange={(event) =>
                updateField(
                  "discountType",
                  event.target
                    .value as VoucherDiscountType
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            >
              <option
                value={
                  VoucherDiscountType.FIXED_AMOUNT
                }
              >
                Nominal
              </option>

              <option
                value={
                  VoucherDiscountType.PERCENTAGE
                }
              >
                Persentase
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="discountValue"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nilai Diskon
            </label>

            <input
              id="discountValue"
              type="number"
              min="1"
              max={
                isPercentage
                  ? 100
                  : undefined
              }
              step={
                isPercentage
                  ? "0.01"
                  : "1"
              }
              value={
                form.discountValue
              }
              onChange={(event) =>
                updateField(
                  "discountValue",
                  event.target.value
                )
              }
              placeholder={
                isPercentage
                  ? "Contoh: 10"
                  : "Contoh: 10000"
              }
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            {discountPreview && (
              <p className="mt-2 text-xs text-gray-500">
                Diskon:{" "}
                <span className="font-semibold text-gray-900">
                  {discountPreview}
                </span>
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
  <div>
    <label
      htmlFor="minimumPurchase"
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      Minimum Pembelian
      <span className="ml-1 font-normal text-gray-400">
        (Opsional)
      </span>
    </label>

    <input
      id="minimumPurchase"
      type="number"
      min="0"
      step="1"
      value={form.minimumPurchase}
      onChange={(event) =>
        updateField(
          "minimumPurchase",
          event.target.value
        )
      }
      placeholder="Contoh: 100000"
      disabled={isSubmitting}
      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
    />

    <p className="mt-2 text-xs text-gray-500">
      Minimum total belanja agar voucher dapat digunakan.
    </p>
  </div>

  {isPercentage && (
    <div>
      <label
        htmlFor="maximumDiscount"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Maximum Diskon
        <span className="ml-1 font-normal text-gray-400">
          (Opsional)
        </span>
      </label>

      <input
        id="maximumDiscount"
        type="number"
        min="1"
        step="1"
        value={form.maximumDiscount}
        onChange={(event) =>
          updateField(
            "maximumDiscount",
            event.target.value
          )
        }
        placeholder="Contoh: 50000"
        disabled={isSubmitting}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
      />

      <p className="mt-2 text-xs text-gray-500">
        Batas maksimal nominal diskon.
      </p>
    </div>
  )}
</div>
        </div>
      </section>

      {/* ================================================
          BATAS PENGGUNAAN
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Batas Penggunaan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Kosongkan nilai untuk penggunaan tanpa batas.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="usageLimit"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Total Batas Penggunaan
            </label>

            <input
              id="usageLimit"
              type="number"
              min="1"
              step="1"
              value={
                form.usageLimit
              }
              onChange={(event) =>
                updateField(
                  "usageLimit",
                  event.target.value
                )
              }
              placeholder="Kosongkan untuk unlimited"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="perUserLimit"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Batas per User
            </label>

            <input
              id="perUserLimit"
              type="number"
              min="1"
              step="1"
              value={
                form.perUserLimit
              }
              onChange={(event) =>
                updateField(
                  "perUserLimit",
                  event.target.value
                )
              }
              placeholder="Kosongkan untuk unlimited"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>
        </div>
      </section>

      {/* ================================================
          PERIODE
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Periode Voucher
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan kapan voucher mulai dan berakhir.
            Kosongkan jika tidak dibatasi.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="startAt"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Mulai
            </label>

            <input
              id="startAt"
              type="datetime-local"
              value={
                form.startAt
              }
              onChange={(event) =>
                updateField(
                  "startAt",
                  event.target.value
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="endAt"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Berakhir
            </label>

            <input
              id="endAt"
              type="datetime-local"
              value={
                form.endAt
              }
              onChange={(event) =>
                updateField(
                  "endAt",
                  event.target.value
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>
        </div>
      </section>

      {/* ================================================
          STATUS
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Status Voucher
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Voucher aktif dapat digunakan jika seluruh
              syarat lainnya terpenuhi.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {form.isActive
                ? "Aktif"
                : "Nonaktif"}
            </span>

            <input
              type="checkbox"
              checked={
                form.isActive
              }
              onChange={(event) =>
                updateField(
                  "isActive",
                  event.target.checked
                )
              }
              disabled={isSubmitting}
              className="h-5 w-5"
            />
          </label>
        </div>
      </section>

      {/* ================================================
          ACTIONS
      ================================================= */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/vouchers"
            )
          }
          disabled={isSubmitting}
          className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Menyimpan..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}