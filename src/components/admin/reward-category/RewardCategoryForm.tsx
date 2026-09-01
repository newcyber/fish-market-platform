"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

/**
 * ============================================================
 * REWARD CATEGORY FORM
 * ============================================================
 *
 * Digunakan untuk:
 *
 * - Create Reward Category
 * - Edit Reward Category
 *
 * Flow:
 *
 * Create:
 *   POST /api/admin/reward-categories
 *
 * Edit:
 *   PATCH /api/admin/reward-categories/[id]
 *
 * Business validation tetap berada di server:
 *
 * AdminRewardCategoryService
 *
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type RewardCategoryFormValues = {
  name: string;

  slug: string;

  sortOrder: string;

  isActive: boolean;
};

type RewardCategoryFormProps = {
  mode?: "create" | "edit";

  initialData?: {
    id?: string;

    name: string;

    slug: string;

    sortOrder?: number | string;

    isActive: boolean;
  };
};

/**
 * ============================================================
 * INITIAL VALUES
 * ============================================================
 */

function getInitialValues(
  initialData?: RewardCategoryFormProps["initialData"]
): RewardCategoryFormValues {
  return {
    name:
      initialData?.name ?? "",

    slug:
      initialData?.slug ?? "",

    sortOrder:
      initialData?.sortOrder !== undefined
        ? String(
            initialData.sortOrder
          )
        : "0",

    isActive:
      initialData?.isActive ??
      true,
  };
}

/**
 * ============================================================
 * SLUGIFY
 * ============================================================
 *
 * Membuat slug otomatis dari nama category.
 *
 * Contoh:
 *
 * Kebutuhan Rumah
 * ↓
 * kebutuhan-rumah
 * ============================================================
 */

function slugify(
  value: string
): string {
  return value
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
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function RewardCategoryForm({
  mode = "create",
  initialData,
}: RewardCategoryFormProps) {
  const router =
    useRouter();

  /**
   * ==========================================================
   * FORM STATE
   * ==========================================================
   */

  const [
    form,
    setForm,
  ] =
    useState<RewardCategoryFormValues>(
      getInitialValues(
        initialData
      )
    );

  /**
   * ==========================================================
   * SLUG STATE
   * ==========================================================
   *
   * Jika admin belum mengedit slug secara manual,
   * slug akan mengikuti nama.
   */

  const [
    slugEdited,
    setSlugEdited,
  ] =
    useState(
      mode === "edit"
    );

  /**
   * ==========================================================
   * UI STATE
   * ==========================================================
   */

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

  /**
   * ==========================================================
   * SUBMIT LABEL
   * ==========================================================
   */

  const submitLabel =
    mode === "create"
      ? "Simpan Category"
      : "Simpan Perubahan";

  /**
   * ==========================================================
   * UPDATE FIELD
   * ==========================================================
   */

  function updateField<
    K extends keyof RewardCategoryFormValues
  >(
    key: K,
    value: RewardCategoryFormValues[K]
  ) {
    setForm(
      (previous) => ({
        ...previous,

        [key]: value,
      })
    );
  }

  /**
   * ==========================================================
   * VALIDATE FORM
   * ==========================================================
   *
   * Client-side validation hanya untuk UX.
   *
   * Server tetap melakukan validasi final.
   * ==========================================================
   */

  function validateForm():
    | string
    | null {
    const name =
      form.name.trim();

    const slug =
      form.slug.trim();

    const sortOrder =
      Number(
        form.sortOrder
      );

    if (!name) {
      return (
        "Nama category wajib diisi."
      );
    }

    if (!slug) {
      return (
        "Slug category wajib diisi."
      );
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

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

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

    if (
      mode === "edit" &&
      !initialData?.id
    ) {
      setError(
        "Reward category ID tidak valid."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /**
       * --------------------------------------------------------
       * PAYLOAD
       * --------------------------------------------------------
       */

      const payload = {
        name:
          form.name.trim(),

        slug:
          form.slug.trim(),

        sortOrder:
          Number(
            form.sortOrder
          ),

        isActive:
          form.isActive,
      };

      /**
       * --------------------------------------------------------
       * URL
       * --------------------------------------------------------
       */

      const url =
        mode === "create"
          ? "/api/admin/reward-categories"
          : `/api/admin/reward-categories/${initialData?.id}`;

      /**
       * --------------------------------------------------------
       * METHOD
       * --------------------------------------------------------
       */

      const method =
        mode === "create"
          ? "POST"
          : "PATCH";

      /**
       * --------------------------------------------------------
       * REQUEST
       * --------------------------------------------------------
       */

      const response =
        await fetch(
          url,
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

      /**
       * --------------------------------------------------------
       * RESPONSE
       * --------------------------------------------------------
       */

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ??
            "Gagal menyimpan reward category."
        );
      }

      /**
       * --------------------------------------------------------
       * SUCCESS
       * --------------------------------------------------------
       */

      router.push(
        "/admin/reward-categories"
      );

      router.refresh();
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan reward category."
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          INFORMASI CATEGORY
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Informasi Reward Category
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan nama, slug, dan
            urutan category reward.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* ==================================================
              NAME
          ================================================== */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nama Category
            </label>

            <input
              id="name"
              type="text"
              value={
                form.name
              }
              onChange={(
                event
              ) => {
                const name =
                  event.target.value;

                setForm(
                  (previous) => ({
                    ...previous,

                    name,

                    slug:
                      slugEdited
                        ? previous.slug
                        : slugify(
                            name
                          ),
                  })
                );
              }}
              placeholder="Contoh: Kebutuhan Rumah"
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <p className="mt-2 text-xs text-gray-500">
              Nama yang akan ditampilkan
              pada Reward Catalog.
            </p>
          </div>

          {/* ==================================================
              SLUG
          ================================================== */}

          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Slug
            </label>

            <input
              id="slug"
              type="text"
              value={
                form.slug
              }
              onChange={(
                event
              ) => {
                setSlugEdited(
                  true
                );

                setForm(
                  (previous) => ({
                    ...previous,

                    slug:
                      event.target.value,
                  })
                );
              }}
              placeholder="Contoh: kebutuhan-rumah"
              disabled={
                isSubmitting
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <p className="mt-2 text-xs text-gray-500">
              Slug harus unik. Jika
              diubah manual, gunakan huruf
              kecil, angka, dan tanda hubung.
            </p>
          </div>
        </div>

        {/* ====================================================
            SORT ORDER
        ==================================================== */}

        <div className="mt-5">
          <label
            htmlFor="sortOrder"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Urutan
          </label>

          <input
            id="sortOrder"
            type="number"
            min="0"
            step="1"
            value={
              form.sortOrder
            }
            onChange={(
              event
            ) =>
              updateField(
                "sortOrder",
                event.target.value
              )
            }
            disabled={
              isSubmitting
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
          />

          <p className="mt-2 text-xs text-gray-500">
            Semakin kecil nilainya,
            semakin atas category ditampilkan.
          </p>
        </div>
      </section>

      {/* ======================================================
          STATUS
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Status Category
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Category aktif dapat dipilih
              ketika membuat atau mengedit
              Reward Catalog.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={
              form.isActive
            }
            disabled={
              isSubmitting
            }
            onClick={() =>
              updateField(
                "isActive",
                !form.isActive
              )
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
              form.isActive
                ? "bg-green-600"
                : "bg-gray-300"
            } ${
              isSubmitting
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition ${
                form.isActive
                  ? "translate-x-5"
                  : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-700">
            Status saat ini:{" "}
            <span className="font-semibold">
              {form.isActive
                ? "Aktif"
                : "Nonaktif"}
            </span>
          </p>
        </div>
      </section>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/reward-categories"
            )
          }
          disabled={
            isSubmitting
          }
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={
            isSubmitting
          }
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Menyimpan..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default RewardCategoryForm;
