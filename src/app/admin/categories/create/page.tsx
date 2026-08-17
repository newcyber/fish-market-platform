import {
  CategoryForm,
} from "@/components/admin/categories/CategoryForm";

import {
  createCategoryAction,
} from "@/actions/category/create-category";

import type {
  ActionResult,
} from "@/types/action-result";

/**
 * ============================================================
 *
 * CREATE CATEGORY PAGE
 *
 * ============================================================
 */

export default function CreateCategoryPage() {
  /**
   * ==========================================================
   *
   * SERVER ACTION ADAPTER
   *
   * CategoryForm menggunakan useActionState().
   *
   * Signature harus:
   *
   * (
   *   prevState: ActionResult | null,
   *   formData: FormData
   * )
   *
   * ==========================================================
   */

  async function action(
    prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> {
    "use server";

    /**
     * createCategoryAction membutuhkan
     * ActionResult non-null.
     *
     * Jika prevState null, gunakan initial state.
     */

    const safePrevState: ActionResult =
      prevState ?? {
        success: false,
        message: "",
      };

    return createCategoryAction(
      safePrevState,
      formData
    );
  }

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tambah Kategori
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Buat kategori baru untuk mengelompokkan produk.
        </p>
      </div>

      {/* ====================================================== */}
      {/* CATEGORY FORM */}
      {/* ====================================================== */}

      <CategoryForm
        submitLabel="Simpan Kategori"
        action={action}
      />
    </div>
  );
}