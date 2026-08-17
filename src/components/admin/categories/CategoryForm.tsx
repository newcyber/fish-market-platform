"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

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

    sortOrder:
      defaultValues?.sortOrder ?? 0,

    isActive:
      defaultValues?.isActive ?? true,
  });

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