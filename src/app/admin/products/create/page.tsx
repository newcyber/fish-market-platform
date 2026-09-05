import { prisma } from "@/lib/prisma";

import ProductForm from "@/components/admin/products/ProductForm";

import {
  createProductAction,
} from "@/actions/product/create-product";

import type {
  ActionResult,
} from "@/types/action-result";

/**
 * ============================================================
 *
 * FORCE DYNAMIC
 *
 * ============================================================
 */

export const dynamic = "force-dynamic";

/**
 * ============================================================
 *
 * CREATE PRODUCT PAGE
 *
 * ============================================================
 */

export default async function CreateProductPage() {
  /**
   * ==========================================================
   *
   * LOAD CATEGORIES
   *
   * ==========================================================
   */

  const categories =
    await prisma.category.findMany({
      where: {
        deletedAt: null,
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  /**
   * ==========================================================
   *
   * SERVER ACTION
   *
   * IMPORTANT:
   *
   * ProductForm menggunakan useActionState().
   *
   * Karena itu action wajib memiliki signature:
   *
   * (
   *   state: ActionResult,
   *   formData: FormData
   * ) => Promise<ActionResult>
   *
   * ==========================================================
   */

  async function action(
    state: ActionResult,
    formData: FormData
  ): Promise<ActionResult> {
    "use server";

    /**
     * Langsung teruskan state dan FormData
     * ke Server Action utama.
     */

    return createProductAction(
      state,
      formData
    );
  }

  /**
   * ==========================================================
   *
   * PAGE
   *
   * ==========================================================
   */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Tambah Produk
        </h1>

        <p className="text-muted-foreground">
          Tambahkan produk baru ke katalog.
        </p>
      </div>

<ProductForm
  categories={categories}
  submitLabel="Simpan Produk"
  action={action}
  showPreviewAfterSuccess
/>
    </div>
  );
}
