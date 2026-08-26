import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProductForm from "@/components/admin/products/ProductForm";
import ProductGallery from "@/components/admin/products/ProductGallery";

import { ProductService } from "@/services/product/product.service";

import {
  updateProductAction,
} from "@/actions/product/update-product";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * EDIT PRODUCT PAGE - VARIANT/SKU V3
 * ============================================================
 *
 * Source of truth:
 *
 * Product
 *   ├── variantGroups
 *   │     └── options
 *   └── skus
 *         └── skuOptions
 *
 * Tidak ada lagi:
 *   - variantOptions
 *   - weightOptions
 *   - weightVariantPrices
 *
 * Penting:
 * - Tidak membuat default variant.
 * - Produk tanpa variant => variantGroups = [] dan skus = [].
 * - Existing option memakai id database.
 * - Existing SKU memakai id + optionRefs.
 */
export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    ProductService.getProductById(id),

    prisma.category.findMany({
      where: {
        OR: [
          {
            deletedAt: null,
          },
          {
            id,
          },
        ],
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  /**
   * ==========================================================
   * VARIANT GROUPS
   * ==========================================================
   *
   * Jangan membuat fallback variant.
   *
   * Kalau database kosong:
   *   []
   *
   * Kalau database memiliki variant:
   *   tampilkan persis yang tersimpan.
   */
  const variantGroups = product.variantGroups.map(
    (group) => ({
      id: group.id,
      name: group.name,
      sortOrder: group.sortOrder,
      isActive: group.isActive,

      options: group.options.map(
        (option) => ({
          id: option.id,

          /**
           * Existing option menggunakan database ID sebagai
           * stable reference. ProductForm akan memakai id
           * tersebut untuk optionRefs.
           */
          key: option.id,

          label: option.label,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        })
      ),
    })
  );

  /**
   * ==========================================================
   * SKU
   * ==========================================================
   *
   * optionRefs berasal dari ProductSkuOption.variantOptionId.
   *
   * Tidak ada lagi weightVariantPrices.
   * Harga dan stok adalah milik SKU.
   */
  const skus = product.skus.map(
    (sku) => ({
      id: sku.id,
      sku: sku.sku,
      price: Number(sku.price),
      stock: sku.stock,

      optionRefs: sku.skuOptions
        .map(
          (skuOption) =>
            skuOption.variantOptionId
        ),

      isActive: sku.isActive,
    })
  );

  /**
   * ==========================================================
   * UPDATE ACTION
   * ==========================================================
   */
  const updateAction =
    updateProductAction.bind(
      null,
      product.id
    );

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Produk
        </h1>

        <p className="mt-1 text-muted-foreground">
          Perbarui informasi produk, variant group,
          SKU, harga, stok, dan gallery gambar produk.
        </p>
      </div>

      {/* ====================================================== */}
      {/* PRODUCT GALLERY */}
      {/* ====================================================== */}

      <ProductGallery
        productId={product.id}
        images={product.images}
      />

      {/* ====================================================== */}
      {/* PRODUCT FORM */}
      {/* ====================================================== */}

      <ProductForm
        categories={categories}
        submitLabel="Update Produk"
        action={updateAction}
        defaultValues={{
          categoryId: product.categoryId,

          name: product.name,

          slug: product.slug,

          description:
            product.description ?? "",

          sku:
            product.sku ?? "",

          price:
            Number(product.price),

          isDiscountActive:
            product.isDiscountActive,

          discountType:
            product.discountType ?? "",

          discountValue:
            product.discountValue !== null
              ? Number(product.discountValue)
              : "",

          discountStartAt:
            product.discountStartAt
              ? new Date(
                  product.discountStartAt
                )
                  .toISOString()
                  .slice(0, 16)
              : "",

          discountEndAt:
            product.discountEndAt
              ? new Date(
                  product.discountEndAt
                )
                  .toISOString()
                  .slice(0, 16)
              : "",

          stock:
            product.stock,

          /**
           * ====================================================
           * NEW VARIANT SYSTEM
           * ====================================================
           */
          variantGroups,

          skus,

          isPublished:
            product.isPublished,

          featured:
            product.featured,
        }}
      />
    </div>
  );
}
