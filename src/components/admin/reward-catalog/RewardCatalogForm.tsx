"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

/**
 * ============================================================
 * REWARD CATALOG FORM
 * ============================================================
 *
 * Digunakan untuk:
 *
 * - Create Reward Catalog
 * - Edit Reward Catalog
 *
 * Flow:
 *
 * 1. Admin mengisi data reward
 * 2. Admin memilih category
 * 3. Admin memilih gambar
 * 4. Gambar diupload ke storage reward
 * 5. URL gambar diterima
 * 6. Reward Catalog dibuat / diperbarui
 *
 * Category endpoint:
 *
 * GET /api/admin/reward-categories
 *
 * Image endpoint:
 *
 * POST /api/admin/reward-catalog/upload
 *
 * Create endpoint:
 *
 * POST /api/admin/reward-catalog
 *
 * Update endpoint:
 *
 * PATCH /api/admin/reward-catalog/[id]
 *
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type RewardCatalogFormValues = {
  name: string;

  description: string;

  categoryId: string;

  requiredPoints: string;

  stock: string;

  sortOrder: string;

  isActive: boolean;
};

type RewardCategory = {
  id: string;

  name: string;

  slug: string;

  isActive: boolean;

  sortOrder: number;
};

type RewardCatalogFormProps = {
  mode?: "create" | "edit";

  initialData?: {
    id?: string;

    name: string;

    description?: string | null;

    image?: string | null;

    categoryId?: string | null;

    requiredPoints:
      | number
      | string;

    stock:
      | number
      | string;

    sortOrder?:
      | number
      | string;

    isActive: boolean;
  };
};

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

/**
 * ============================================================
 * INITIAL VALUES
 * ============================================================
 */

function getInitialValues(
  initialData?: RewardCatalogFormProps["initialData"]
): RewardCatalogFormValues {
  return {
    name:
      initialData?.name ?? "",

    description:
      initialData?.description ?? "",

    categoryId:
      initialData?.categoryId ?? "",

    requiredPoints:
      initialData !== undefined
        ? String(
            initialData.requiredPoints
          )
        : "",

    stock:
      initialData !== undefined
        ? String(
            initialData.stock
          )
        : "0",

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

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function RewardCatalogForm({
  mode = "create",
  initialData,
}: RewardCatalogFormProps) {
  const router =
    useRouter();

  /**
   * ----------------------------------------------------------
   * FORM STATE
   * ----------------------------------------------------------
   */

  const [
    form,
    setForm,
  ] =
    useState<RewardCatalogFormValues>(
      getInitialValues(
        initialData
      )
    );

  /**
   * ----------------------------------------------------------
   * CATEGORY STATE
   * ----------------------------------------------------------
   */

  const [
    categories,
    setCategories,
  ] =
    useState<RewardCategory[]>(
      []
    );

  const [
    isLoadingCategories,
    setIsLoadingCategories,
  ] =
    useState(true);

  const [
    categoryError,
    setCategoryError,
  ] =
    useState<string | null>(
      null
    );

  /**
   * ----------------------------------------------------------
   * IMAGE STATE
   * ----------------------------------------------------------
   */

  const [
    imageUrl,
    setImageUrl,
  ] =
    useState<string | null>(
      initialData?.image ??
        null
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      initialData?.image ??
        null
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  /**
   * ----------------------------------------------------------
   * UI STATE
   * ----------------------------------------------------------
   */

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  /**
   * ==========================================================
   * LOAD REWARD CATEGORIES
   * ==========================================================
   *
   * CREATE:
   *
   * GET /api/admin/reward-categories
   *
   * Hanya category aktif.
   *
   * EDIT:
   *
   * GET /api/admin/reward-categories?currentId=<categoryId>
   *
   * Mengembalikan:
   *
   * - seluruh category aktif
   * - category inactive yang sedang digunakan reward
   *
   * Dengan demikian category existing tidak hilang ketika
   * category tersebut sudah dinonaktifkan.
   *
   * ==========================================================
   */

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoadingCategories(
        true
      );

      setCategoryError(
        null
      );

      try {
        /**
         * ------------------------------------------------------
         * BUILD ENDPOINT
         * ------------------------------------------------------
         */

        const currentCategoryId =
          mode === "edit"
            ? initialData?.categoryId?.trim()
            : undefined;

        const endpoint =
          currentCategoryId
            ? `/api/admin/reward-categories?currentId=${encodeURIComponent(
                currentCategoryId
              )}`
            : "/api/admin/reward-categories";

        /**
         * ------------------------------------------------------
         * FETCH
         * ------------------------------------------------------
         */

        const response =
          await fetch(
            endpoint,
            {
              method: "GET",

              cache: "no-store",
            }
          );

        /**
         * ------------------------------------------------------
         * PARSE RESPONSE
         * ------------------------------------------------------
         */

        const result =
          await response.json();

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ??
              "Gagal mengambil kategori reward."
          );
        }

        /**
         * ------------------------------------------------------
         * NORMALIZE DATA
         * ------------------------------------------------------
         */

        const data =
          Array.isArray(
            result?.data
          )
            ? result.data
            : [];

        /**
         * ------------------------------------------------------
         * MOUNT CHECK
         * ------------------------------------------------------
         */

        if (!isMounted) {
          return;
        }

        setCategories(
          data
        );
      } catch (
        categoryLoadError
      ) {
        if (!isMounted) {
          return;
        }

        setCategories(
          []
        );

        setCategoryError(
          categoryLoadError instanceof Error
            ? categoryLoadError.message
            : "Gagal mengambil kategori reward."
        );
      } finally {
        if (isMounted) {
          setIsLoadingCategories(
            false
          );
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [
    mode,
    initialData?.categoryId,
  ]);

  /**
   * ==========================================================
   * CLEANUP OBJECT URL
   * ==========================================================
   */

  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [
    previewUrl,
  ]);

  /**
   * ==========================================================
   * UPDATE FIELD
   * ==========================================================
   */

  function updateField<
    K extends keyof RewardCatalogFormValues
  >(
    key: K,
    value: RewardCatalogFormValues[K]
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
   * IMAGE VALIDATION
   * ==========================================================
   */

  function validateImage(
    file: File
  ): string | null {
    if (
      file.size <= 0
    ) {
      return "File gambar kosong.";
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      return "Ukuran gambar maksimal 5 MB.";
    }

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
      )
    ) {
      return "Format gambar harus JPG, JPEG, PNG atau WEBP.";
    }

    return null;
  }

  /**
   * ==========================================================
   * SELECT IMAGE
   * ==========================================================
   */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError(
      null
    );

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError =
      validateImage(
        file
      );

    if (
      validationError
    ) {
      setSelectedFile(
        null
      );

      if (
        previewUrl &&
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl(
        imageUrl
      );

      event.target.value =
        "";

      setError(
        validationError
      );

      return;
    }

    if (
      previewUrl &&
      previewUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    const newPreviewUrl =
      URL.createObjectURL(
        file
      );

    setSelectedFile(
      file
    );

    setPreviewUrl(
      newPreviewUrl
    );
  }

  /**
   * ==========================================================
   * REMOVE SELECTED IMAGE
   * ==========================================================
   */

  function removeSelectedImage() {
    if (
      isUploading ||
      isSubmitting
    ) {
      return;
    }

    if (
      previewUrl &&
      previewUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setSelectedFile(
      null
    );

    setPreviewUrl(
      imageUrl
    );

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  /**
   * ==========================================================
   * UPLOAD IMAGE
   * ==========================================================
   */

  async function uploadImage(): Promise<
    string | null
  > {
    if (
      !selectedFile
    ) {
      return imageUrl;
    }

    setIsUploading(
      true
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "image",
        selectedFile
      );

      const response =
        await fetch(
          "/api/admin/reward-catalog/upload",
          {
            method:
              "POST",

            body:
              formData,
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
            "Gagal mengupload gambar reward."
        );
      }

      const uploadedImage =
        result?.image;

      if (
        typeof uploadedImage !==
          "string" ||
        !uploadedImage
      ) {
        throw new Error(
          "Server tidak mengembalikan URL gambar."
        );
      }

      setImageUrl(
        uploadedImage
      );

      return uploadedImage;
    } catch (
      uploadError
    ) {
      throw new Error(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal mengupload gambar reward."
      );
    } finally {
      setIsUploading(
        false
      );
    }
  }

  /**
   * ==========================================================
   * FORM VALIDATION
   * ==========================================================
   */

  function validateForm():
    | string
    | null {
    const name =
      form.name.trim();

    const categoryId =
      form.categoryId.trim();

    const requiredPoints =
      Number(
        form.requiredPoints
      );

    const stock =
      Number(
        form.stock
      );

    const sortOrder =
      Number(
        form.sortOrder
      );

    /**
     * --------------------------------------------------------
     * NAME
     * --------------------------------------------------------
     */

    if (!name) {
      return "Nama hadiah wajib diisi.";
    }

    /**
     * --------------------------------------------------------
     * CATEGORY
     * --------------------------------------------------------
     */

    if (!categoryId) {
      return "Kategori reward wajib dipilih.";
    }

    /**
     * --------------------------------------------------------
     * REQUIRED POINTS
     * --------------------------------------------------------
     */

    if (
      !Number.isInteger(
        requiredPoints
      ) ||
      requiredPoints <= 0
    ) {
      return "Required points harus berupa bilangan bulat lebih dari 0.";
    }

    /**
     * --------------------------------------------------------
     * STOCK
     * --------------------------------------------------------
     */

    if (
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      return "Stock harus berupa bilangan bulat 0 atau lebih.";
    }

    /**
     * --------------------------------------------------------
     * SORT ORDER
     * --------------------------------------------------------
     */

    if (
      !Number.isInteger(
        sortOrder
      ) ||
      sortOrder < 0
    ) {
      return "Sort order harus berupa bilangan bulat 0 atau lebih.";
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

    setError(
      null
    );

    /**
     * --------------------------------------------------------
     * VALIDATE FORM
     * --------------------------------------------------------
     */

    const validationError =
      validateForm();

    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE EDIT ID
     * --------------------------------------------------------
     */

    if (
      mode === "edit" &&
      !initialData?.id
    ) {
      setError(
        "ID reward tidak valid."
      );

      return;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE CATEGORY EXISTENCE
     * --------------------------------------------------------
     *
     * Pastikan category yang dipilih memang tersedia
     * pada daftar category aktif yang dimuat dari server.
     *
     * Untuk edit, category lama yang sudah tidak aktif
     * tetap diperbolehkan jika masih tersimpan pada
     * initialData.
     * --------------------------------------------------------
     */

    const selectedCategory =
      categories.find(
        (category) =>
          category.id ===
          form.categoryId
      );

    if (
      !selectedCategory &&
      form.categoryId !==
        initialData?.categoryId
    ) {
      setError(
        "Kategori reward yang dipilih tidak valid."
      );

      return;
    }

    /**
     * --------------------------------------------------------
     * START SUBMIT
     * --------------------------------------------------------
     */

    setIsSubmitting(
      true
    );

    try {
      /**
       * ------------------------------------------------------
       * UPLOAD IMAGE
       * ------------------------------------------------------
       *
       * Upload hanya dilakukan jika admin memilih
       * file baru.
       */

      const uploadedImage =
        await uploadImage();

      /**
       * ------------------------------------------------------
       * BUILD PAYLOAD
       * ------------------------------------------------------
       */

      const payload = {
        name:
          form.name.trim(),

        description:
          form.description.trim() ||
          null,

        image:
          uploadedImage,

        categoryId:
          form.categoryId.trim(),

        requiredPoints:
          Number(
            form.requiredPoints
          ),

        stock:
          Number(
            form.stock
          ),

        sortOrder:
          Number(
            form.sortOrder
          ),

        isActive:
          form.isActive,
      };

      /**
       * ------------------------------------------------------
       * ENDPOINT
       * ------------------------------------------------------
       */

      const url =
        mode === "create"
          ? "/api/admin/reward-catalog"
          : `/api/admin/reward-catalog/${initialData?.id}`;

      /**
       * ------------------------------------------------------
       * REQUEST
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * RESPONSE VALIDATION
       * ------------------------------------------------------
       */

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ??
            "Gagal menyimpan reward catalog."
        );
      }

      /**
       * ------------------------------------------------------
       * SUCCESS
       * ------------------------------------------------------
       */

      router.push(
        "/admin/reward-catalog"
      );

      router.refresh();
    } catch (
      submitError
    ) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan reward catalog."
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /**
   * ==========================================================
   * DISABLED STATE
   * ==========================================================
   */

  const disabled =
    isSubmitting ||
    isUploading ||
    isLoadingCategories;

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

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      ) : null}

      {/* ======================================================
          INFORMASI REWARD
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Informasi Reward
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan nama, kategori,
            deskripsi, dan gambar
            hadiah yang akan
            ditampilkan kepada
            customer.
          </p>
        </div>

        <div className="space-y-5">
          {/* NAME */}

          <div>
            <label
              htmlFor="reward-name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nama Reward
            </label>

            <input
              id="reward-name"
              type="text"
              value={
                form.name
              }
              onChange={(
                event
              ) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              placeholder="Contoh: Rice Cooker"
              disabled={
                disabled
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
            />
          </div>

{/* CATEGORY */}

<div>
  <label
    htmlFor="reward-category"
    className="mb-2 block text-sm font-medium text-gray-700"
  >
    Kategori Reward
  </label>

  <select
    id="reward-category"
    value={form.categoryId}
    onChange={(event) =>
      updateField(
        "categoryId",
        event.target.value
      )
    }
    disabled={disabled}
    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
  >
    <option value="">
      {isLoadingCategories
        ? "Memuat kategori..."
        : "Pilih kategori reward"}
    </option>

    {/*
     * ==========================================================
     * ACTIVE CATEGORIES
     * ==========================================================
     */}

    {categories.map((category) => (
      <option
        key={category.id}
        value={category.id}
      >
        {category.name}
      </option>
    ))}

    {/*
     * ==========================================================
     * INACTIVE CATEGORY YANG SEDANG DIPAKAI
     * ==========================================================
     *
     * Dalam mode edit, category lama yang sudah inactive
     * tetap ditampilkan agar admin dapat melihat nilai
     * category yang tersimpan.
     *
     * Category inactive ini tidak berasal dari daftar
     * category aktif.
     */}

    {mode === "edit" &&
    initialData?.categoryId &&
    !categories.some(
      (category) =>
        category.id ===
        initialData.categoryId
    ) ? (
      <option
        value={initialData.categoryId}
      >
        {`Kategori saat ini (inactive)`}
      </option>
    ) : null}
  </select>

  {categoryError ? (
    <p className="mt-1.5 text-xs font-medium text-red-600">
      {categoryError}
    </p>
  ) : (
    <p className="mt-1.5 text-xs text-gray-500">
      {mode === "edit" &&
      initialData?.categoryId &&
      !categories.some(
        (category) =>
          category.id ===
          initialData.categoryId
      )
        ? "Kategori saat ini sudah inactive. Pilih kategori aktif jika ingin memindahkan reward."
        : "Pilih kategori aktif untuk mengelompokkan reward ini."}
    </p>
  )}

  {!isLoadingCategories &&
  !categoryError &&
  categories.length === 0 &&
  !(
    mode === "edit" &&
    initialData?.categoryId
  ) ? (
    <p className="mt-1.5 text-xs font-medium text-amber-600">
      Belum ada kategori reward aktif.
      Buat kategori terlebih dahulu.
    </p>
  ) : null}
</div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="reward-description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Deskripsi
            </label>

            <textarea
              id="reward-description"
              value={
                form.description
              }
              onChange={(
                event
              ) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Contoh: Rice cooker 1.8 liter."
              rows={4}
              disabled={
                disabled
              }
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* ======================================================
          GAMBAR REWARD
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Gambar Reward
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload satu gambar utama
            untuk reward ini.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* PREVIEW */}

          <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  previewUrl
                }
                alt={
                  form.name ||
                  "Preview reward"
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-4 text-center text-xs text-gray-400">
                Belum ada gambar
              </span>
            )}
          </div>

          {/* CONTROLS */}

          <div className="space-y-3">
            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={
                handleImageChange
              }
              disabled={
                disabled
              }
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
            />

            <p className="text-xs text-gray-500">
              JPG, JPEG, PNG atau
              WEBP. Maksimal 5 MB.
            </p>

            {selectedFile ? (
              <p className="text-xs font-medium text-gray-700">
                File dipilih:{" "}
                {
                  selectedFile.name
                }
              </p>
            ) : null}

            {selectedFile ? (
              <button
                type="button"
                onClick={
                  removeSelectedImage
                }
                disabled={
                  disabled
                }
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batalkan Gambar
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ======================================================
          POINT & STOCK
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Point & Stock
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Tentukan jumlah point yang
            diperlukan dan jumlah stok
            hadiah yang tersedia.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* REQUIRED POINTS */}

          <div>
            <label
              htmlFor="reward-required-points"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Required Points
            </label>

            <input
              id="reward-required-points"
              type="number"
              min="1"
              step="1"
              value={
                form.requiredPoints
              }
              onChange={(
                event
              ) =>
                updateField(
                  "requiredPoints",
                  event.target.value
                )
              }
              placeholder="Contoh: 5000"
              disabled={
                disabled
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Point yang diperlukan
              customer untuk menukar
              satu reward.
            </p>
          </div>

          {/* STOCK */}

          <div>
            <label
              htmlFor="reward-stock"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Stock
            </label>

            <input
              id="reward-stock"
              type="number"
              min="0"
              step="1"
              value={
                form.stock
              }
              onChange={(
                event
              ) =>
                updateField(
                  "stock",
                  event.target.value
                )
              }
              placeholder="Contoh: 10"
              disabled={
                disabled
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Gunakan 0 jika reward
              belum tersedia.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          PENGATURAN
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Pengaturan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Atur urutan tampil dan
            status reward.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* SORT ORDER */}

          <div>
            <label
              htmlFor="reward-sort-order"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Sort Order
            </label>

            <input
              id="reward-sort-order"
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
              placeholder="0"
              disabled={
                disabled
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Semakin kecil nilainya,
              semakin awal tampil.
            </p>
          </div>

          {/* ACTIVE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "isActive",
                    event.target.checked
                  )
                }
                disabled={
                  disabled
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />

              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Reward Aktif
                </span>

                <span className="block text-xs text-gray-500">
                  Customer dapat melihat
                  reward jika aktif dan
                  stock tersedia.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/reward-catalog"
            )
          }
          disabled={
            disabled
          }
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={
            disabled ||
            categories.length ===
              0
          }
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingCategories
            ? "Memuat kategori..."
            : isUploading
              ? "Mengupload gambar..."
              : isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan Reward"
                  : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
