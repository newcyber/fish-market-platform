"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import Image from "next/image";

import SubmitButton from "@/components/admin/form/SubmitButton";

import FormSection from "@/components/admin/form/FormSection";

import FormGrid from "@/components/admin/form/FormGrid";

import FormActions from "@/components/admin/form/FormActions";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";

import type { ActionResult } from "@/types/action-result";

/**
 * ============================================================
 * CATEGORY FORM VALUES
 * ============================================================
 */

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormValues>;

  submitLabel?: string;

  action: (
    prevState: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
}

/**
 * ============================================================
 * INITIAL ACTION STATE
 * ============================================================
 */

const initialState: ActionResult = {
  success: false,
  message: "",
};

/**
 * ============================================================
 * CATEGORY FORM
 * ============================================================
 */

export function CategoryForm({
  defaultValues,
  submitLabel = "Simpan Kategori",
  action,
}: CategoryFormProps) {


  /**
   * ==========================================================
   * SERVER ACTION STATE
   * ==========================================================
   */

  const [
    state,
    formAction,
  ] = useActionState(
    action,
    initialState
  );

  /**
   * ==========================================================
   * FORM STATE
   * ==========================================================
   */

const [
  form,
  setForm,
] = useState<CategoryFormValues>({
  name:
    defaultValues?.name ?? "",

  slug:
    defaultValues?.slug ?? "",

  description:
    defaultValues?.description ?? "",

  image:
    defaultValues?.image ?? "",

  sortOrder:
    defaultValues?.sortOrder ?? 0,

  isActive:
    defaultValues?.isActive ?? true,
});

const [
  selectedFile,
  setSelectedFile,
] = useState<File | null>(null);

const [
  previewUrl,
  setPreviewUrl,
] = useState<string>(
  defaultValues?.image ?? ""
);

const [
  isUploading,
  setIsUploading,
] = useState(false);

  /**
   * ==========================================================
   * SLUG STATE
   * ==========================================================
   */

  const [
    slugEdited,
    setSlugEdited,
  ] = useState(false);

  /**
   * ==========================================================
   * ACTION RESULT
   * ==========================================================
   *
   * Jika action mengembalikan error,
   * tampilkan pesan di form.
   *
   * Redirect sukses ditangani oleh
   * Server Action.
   */

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  /**
   * ==========================================================
   * AUTO HIDE MESSAGE
   * ==========================================================
   */

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setMessage(null);
        },
        5000
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [message]);

  /**
   * ==========================================================
   * SLUGIFY
   * ==========================================================
   */

  function slugify(
    text: string
  ) {
    return text
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
  }

  /**
 * ============================================================
 * UPLOAD CATEGORY IMAGE
 * ============================================================
 */

async function uploadCategoryImage(
  file: File
): Promise<void> {
  setIsUploading(true);
  setMessage(null);

  try {
    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    const response =
      await fetch(
        "/api/admin/categories/upload",
        {
          method: "POST",
          body: formData,
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
          "Gagal mengupload gambar kategori."
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
        "Server tidak mengembalikan path gambar."
      );
    }

    setForm(
      (prev) => ({
        ...prev,
        image:
          uploadedImage,
      })
    );

    setPreviewUrl(
      uploadedImage
    );

    setSelectedFile(
      file
    );

    setMessage(
      "Gambar kategori berhasil diupload."
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Gagal mengupload gambar kategori."
    );
  } finally {
    setIsUploading(false);
  }
}

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      {/* ======================================================
          ACTION MESSAGE
      ====================================================== */}

      {state.message && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            state.success
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* ======================================================
          FORM VALIDATION ERROR
      ====================================================== */}

      {!state.success &&
        state.errors?.name?.[0] && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {state.errors.name[0]}
          </div>
        )}

      <FormSection
        title="Informasi Kategori"
        description="Lengkapi informasi kategori produk."
      >
        <FormGrid>
          {/* ==================================================
              NAME
          ================================================== */}

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Kategori
            </Label>

            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={(e) => {
                const name =
                  e.target.value;

                setForm(
                  (prev) => ({
                    ...prev,

                    name,

                    slug:
                      slugEdited
                        ? prev.slug
                        : slugify(
                            name
                          ),
                  })
                );
              }}
            />

            {state.errors?.name?.[0] && (
              <p className="text-xs text-red-600">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          {/* ==================================================
              SLUG
          ================================================== */}

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug
            </Label>

            <Input
              id="slug"
              name="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(
                  true
                );

                setForm(
                  (prev) => ({
                    ...prev,

                    slug:
                      e.target.value,
                  })
                );
              }}
            />

            <p className="text-xs text-muted-foreground">
              Digunakan pada URL kategori.
            </p>

            {state.errors?.slug?.[0] && (
              <p className="text-xs text-red-600">
                {state.errors.slug[0]}
              </p>
            )}
          </div>

          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <div className="space-y-2">
            <Label htmlFor="description">
              Deskripsi
            </Label>

            <Textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,

                    description:
                      e.target.value,
                  })
                )
              }
            />

            {state.errors?.description?.[0] && (
              <p className="text-xs text-red-600">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          {/* ==================================================
              SORT ORDER
          ================================================== */}

          <div className="space-y-2">
            <Label htmlFor="sortOrder">
              Urutan
            </Label>

            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              value={
                form.sortOrder
              }
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,

                    sortOrder:
                      Number(
                        e.target.value
                      ),
                  })
                )
              }
            />

            <p className="text-xs text-muted-foreground">
              Semakin kecil nilainya,
              semakin atas urutan kategori.
            </p>

            {state.errors?.sortOrder?.[0] && (
              <p className="text-xs text-red-600">
                {
                  state.errors
                    .sortOrder[0]
                }
              </p>
            )}
          </div>
        </FormGrid>

{/* ====================================================
    CATEGORY IMAGE
==================================================== */}

<div className="mt-6 space-y-3">
  <Label htmlFor="category-image">
    Gambar Kategori
  </Label>

  <input
    id="category-image"
    type="hidden"
    name="image"
    value={form.image}
    readOnly
  />

  {previewUrl ? (
    <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-xl border bg-muted">
      <Image
        src={previewUrl}
        alt={
          form.name ||
          "Preview gambar kategori"
        }
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 448px"
      />
    </div>
  ) : (
    <div className="flex aspect-[16/9] w-full max-w-md items-center justify-center rounded-xl border border-dashed bg-muted text-sm text-muted-foreground">
      Belum ada gambar kategori
    </div>
  )}

  <div className="flex items-center gap-3">
    <label
      htmlFor="category-image-file"
      className={`inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
        isUploading
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-muted"
      }`}
    >
      {isUploading
        ? "Mengupload..."
        : previewUrl
          ? "Ganti Gambar"
          : "Pilih Gambar"}

      <input
        id="category-image-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={isUploading}
        onChange={async (event) => {
          const file =
            event.target.files?.[0];

          if (!file) {
            return;
          }

          await uploadCategoryImage(
            file
          );

          event.target.value =
            "";
        }}
      />
    </label>

    {selectedFile && (
      <span className="text-xs text-muted-foreground">
        {selectedFile.name}
      </span>
    )}
  </div>

  <p className="text-xs text-muted-foreground">
    Gunakan gambar produk/kategori yang jelas.
    Format PNG, JPG, atau WEBP.
  </p>

  {state.errors?.image?.[0] && (
    <p className="text-xs text-red-600">
      {state.errors.image[0]}
    </p>
  )}
</div>

        {/* ====================================================
            STATUS
        ==================================================== */}

        <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>
              Status
            </Label>

            <p className="text-sm text-muted-foreground">
              Aktifkan kategori agar dapat digunakan pada produk.
            </p>
          </div>

          <input
            type="hidden"
            name="isActive"
            value={
              form.isActive
                ? "true"
                : "false"
            }
          />

          <Switch
            checked={
              form.isActive
            }
            onCheckedChange={(
              checked
            ) =>
              setForm(
                (prev) => ({
                  ...prev,

                  isActive:
                    checked,
                })
              )
            }
          />
        </div>

        {state.errors?.isActive?.[0] && (
          <p className="mt-2 text-xs text-red-600">
            {
              state.errors
                .isActive[0]
            }
          </p>
        )}
      </FormSection>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <FormActions
        cancelHref="/admin/categories"
      >
        <SubmitButton
          label={submitLabel}
        />
      </FormActions>
    </form>
  );
}

export default CategoryForm;
