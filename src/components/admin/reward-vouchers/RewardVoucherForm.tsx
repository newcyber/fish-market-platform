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

type RewardVoucherFormValues = {
  name: string;
  requiredPoints: string;

  discountType:
    VoucherDiscountType;

  discountValue: string;

  minimumPurchase: string;
  maximumDiscount: string;

  sortOrder: string;

  isActive: boolean;
};

type RewardVoucherFormProps = {
  initialData?: {
    id?: string;

    name: string;

    requiredPoints:
      | number
      | string;

    discountType:
      VoucherDiscountType;

    discountValue:
      | number
      | string;

    minimumPurchase?:
      | number
      | string
      | null;

    maximumDiscount?:
      | number
      | string
      | null;

    sortOrder?:
      | number
      | string;

    isActive: boolean;
  };

  mode?: "create" | "edit";
};

function getInitialValues(
  initialData?: RewardVoucherFormProps["initialData"]
): RewardVoucherFormValues {
  return {
    name:
      initialData?.name ?? "",

    requiredPoints:
      initialData !== undefined
        ? String(
            initialData.requiredPoints
          )
        : "",

    discountType:
      initialData?.discountType ??
      VoucherDiscountType.FIXED_AMOUNT,

    discountValue:
      initialData !== undefined
        ? String(
            initialData.discountValue
          )
        : "",

    minimumPurchase:
      initialData?.minimumPurchase !==
        null &&
      initialData?.minimumPurchase !==
        undefined
        ? String(
            initialData.minimumPurchase
          )
        : "",

    maximumDiscount:
      initialData?.maximumDiscount !==
        null &&
      initialData?.maximumDiscount !==
        undefined
        ? String(
            initialData.maximumDiscount
          )
        : "",

    sortOrder:
      initialData?.sortOrder !==
        undefined
        ? String(
            initialData.sortOrder
          )
        : "0",

    isActive:
      initialData?.isActive ??
      true,
  };
}

function toNullableNumber(
  value: string
): number | null {
  if (value.trim() === "") {
    return null;
  }

  return Number(value);
}

export function RewardVoucherForm({
  initialData,
  mode = "create",
}: RewardVoucherFormProps) {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState<RewardVoucherFormValues>(
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
      ? "Simpan Reward"
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
    K extends keyof RewardVoucherFormValues
  >(
    key: K,
    value: RewardVoucherFormValues[K]
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
    const name =
      form.name.trim();

    const requiredPoints =
      Number(
        form.requiredPoints
      );

    const discountValue =
      Number(
        form.discountValue
      );

    const sortOrder =
      Number(
        form.sortOrder
      );

    if (!name) {
      return (
        "Nama reward voucher wajib diisi."
      );
    }

    if (
      !Number.isInteger(
        requiredPoints
      ) ||
      requiredPoints <= 0
    ) {
      return (
        "Required points harus berupa bilangan bulat lebih dari 0."
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
      isPercentage &&
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

      if (!isPercentage) {
        return (
          "Maximum diskon hanya dapat digunakan untuk reward persentase."
        );
      }
    }

    if (
      !Number.isInteger(
        sortOrder
      ) ||
      sortOrder < 0
    ) {
      return (
        "Urutan harus berupa bilangan bulat 0 atau lebih."
      );
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

    setIsSubmitting(true);

    try {
      const payload = {
        name:
          form.name.trim(),

        requiredPoints:
          Number(
            form.requiredPoints
          ),

        discountType:
          form.discountType,

        discountValue:
          Number(
            form.discountValue
          ),

        minimumPurchase:
          toNullableNumber(
            form.minimumPurchase
          ),

        maximumDiscount:
          toNullableNumber(
            form.maximumDiscount
          ),

        sortOrder:
          Number(
            form.sortOrder
          ),

        isActive:
          form.isActive,
      };

      const url =
        mode === "create"
          ? "/api/admin/reward-vouchers"
          : `/api/admin/reward-vouchers/${initialData?.id}`;

      const response =
        await fetch(
          url,
          {
            method:
              mode === "create"
                ? "POST"
                : "PATCH",

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

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ??
            "Gagal menyimpan reward voucher."
        );
      }

      router.push(
        "/admin/reward-vouchers"
      );

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan reward voucher."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      {/* ================================================
          INFORMASI REWARD
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Informasi Reward
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan nama reward dan
            jumlah point yang diperlukan
            customer untuk menukarnya.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nama Reward
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
              placeholder="Contoh: Voucher Rp10.000"
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="requiredPoints"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Required Points
            </label>

            <input
              id="requiredPoints"
              type="number"
              min="1"
              step="1"
              value={
                form.requiredPoints
              }
              onChange={(event) =>
                updateField(
                  "requiredPoints",
                  event.target.value
                )
              }
              placeholder="Contoh: 500"
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <p className="mt-2 text-xs text-gray-500">
              Jumlah point yang harus
              dimiliki customer untuk
              menukar reward ini.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================
          BENEFIT
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Benefit Reward
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan jenis dan nilai
            diskon yang diberikan kepada
            customer.
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
              disabled={
                isSubmitting
              }
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
  min={
    isPercentage
      ? "0.01"
      : "1"
  }
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
                  ? "Contoh: 5"
                  : "Contoh: 10000"
              }
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            {discountPreview && (
              <p className="mt-2 text-xs text-gray-500">
                Benefit:{" "}
                <span className="font-semibold text-gray-900">
                  {discountPreview}
                </span>
              </p>
            )}
          </div>
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
              value={
                form.minimumPurchase
              }
              onChange={(event) =>
                updateField(
                  "minimumPurchase",
                  event.target.value
                )
              }
              placeholder="Contoh: 50000"
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <p className="mt-2 text-xs text-gray-500">
              Kosongkan jika tidak ada
              minimum pembelian.
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
                min="0.01"
                step="1"
                value={
                  form.maximumDiscount
                }
                onChange={(event) =>
                  updateField(
                    "maximumDiscount",
                    event.target.value
                  )
                }
                placeholder="Contoh: 20000"
                disabled={
                  isSubmitting
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
              />

              <p className="mt-2 text-xs text-gray-500">
                Batas maksimal nominal
                diskon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================
          DISPLAY
      ================================================= */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Pengaturan Tampilan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan urutan reward pada
            halaman customer.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="sortOrder"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Urutan Reward
            </label>

            <input
              id="sortOrder"
              type="number"
              min="0"
              step="1"
              value={
                form.sortOrder
              }
              onChange={(event) =>
                updateField(
                  "sortOrder",
                  event.target.value
                )
              }
              placeholder="0"
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <p className="mt-2 text-xs text-gray-500">
              Nilai lebih kecil akan
              ditampilkan lebih dahulu.
            </p>
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
              Status Reward
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Reward aktif dapat ditukar
              oleh customer.
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
              disabled={
                isSubmitting
              }
              className="h-5 w-5"
            />
          </label>
        </div>
      </section>

      {/* ================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* ================================================
          ACTIONS
      ================================================= */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/reward-vouchers"
            )
          }
          disabled={
            isSubmitting
          }
          className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={
            isSubmitting
          }
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