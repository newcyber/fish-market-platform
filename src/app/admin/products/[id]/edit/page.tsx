import {
  notFound,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import ProductForm from "@/components/admin/products/ProductForm";

import ProductGallery from "@/components/admin/products/ProductGallery";

import {
  ProductService,
} from "@/services/product/product.service";

import {
  updateProductAction,
} from "@/actions/product/update-product";

/**
 * ============================================================
 *
 * EDIT PRODUCT PAGE
 *
 * ============================================================
 */

export const dynamic =
  "force-dynamic";

/**
 * ============================================================
 *
 * PAGE PROPS
 *
 * ============================================================
 */

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 *
 * EDIT PRODUCT PAGE
 *
 * ============================================================
 */

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  /**
   * ==========================================================
   *
   * GET PRODUCT ID
   *
   * ==========================================================
   */

  const {
    id,
  } =
    await params;

  /**
   * ==========================================================
   *
   * LOAD PRODUCT
   *
   * ==========================================================
   */

  const product =
    await ProductService.getProductById(
      id
    );

  /**
   * ==========================================================
   *
   * PRODUCT NOT FOUND
   *
   * ==========================================================
   */

  if (!product) {
    notFound();
  }

  /**
   * ==========================================================
   *
   * LOAD CATEGORIES
   *
   * Penting:
   *
   * Selalu sertakan kategori produk saat ini.
   *
   * Hal ini mencegah select category menjadi
   * kosong ketika kategori produk tidak masuk
   * query kategori aktif.
   *
   * ==========================================================
   */

  const categories =
    await prisma.category.findMany({
      where: {
        OR: [
          {
            deletedAt: null,
          },

          {
            id:
              product.categoryId,
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
    });

  /**
   * ==========================================================
   *
   * PRODUCT VARIANT OPTIONS
   *
   * Database:
   *
   * [
   *   {
   *     id: "...",
   *     label: "Utuh"
   *   }
   * ]
   *
   * ProductForm:
   *
   * [
   *   "Utuh"
   * ]
   *
   * ==========================================================
   */

  const variantOptions =
  product.variantOptions.map(
    (option) => ({
      id: option.id,

      label: option.label,

      priceAdjustment:
        Number(
          option.priceAdjustment ?? 0
        ),
    })
  );

  /**
   * ==========================================================
   *
   * PRODUCT WEIGHT OPTIONS
   *
   * Database:
   *
   * [
   *   {
   *     label: "500gr",
   *     price: Decimal
   *   }
   * ]
   *
   * ProductForm:
   *
   * [
   *   {
   *     label: "500gr",
   *     price: 25000
   *   }
   * ]
   *
   * ==========================================================
   */

  const weightOptions =
  product.weightOptions.map(
    (option) => ({
      id: option.id,

      label: option.label,

      price:
        Number(
          option.price
        ),
    })
  );

    const weightVariantPrices =
  product.weightVariantPrices.map(
    (item) => ({
      weightLabel:
        item.weightOption.label,

      variantLabel:
        item.variantOption.label,

      price:
        Number(item.price),
    })
  );

  /**
   * ==========================================================
   *
   * BIND UPDATE ACTION
   *
   * Before bind:
   *
   * (
   *   id,
   *   prevState,
   *   formData
   * )
   *
   * After bind:
   *
   * (
   *   prevState,
   *   formData
   * )
   *
   * Compatible dengan useActionState().
   *
   * ==========================================================
   */

  const updateAction =
    updateProductAction.bind(
      null,
      product.id
    );

  /**
   * ==========================================================
   *
   * RENDER
   *
   * ==========================================================
   */

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
          Perbarui informasi produk, stok,
          varian, pilihan berat, harga setiap
          berat, dan gallery gambar produk.
        </p>
      </div>

      {/* ====================================================== */}
      {/* PRODUCT GALLERY */}
      {/* ====================================================== */}

      <ProductGallery
        productId={
          product.id
        }
        images={
          product.images
        }
      />

      {/* ====================================================== */}
      {/* PRODUCT FORM */}
      {/* ====================================================== */}

      <ProductForm
        categories={
          categories
        }

        submitLabel="Update Produk"

        action={
          updateAction
        }

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

  variantOptions,

  weightOptions,

  weightVariantPrices,

  isPublished:
    product.isPublished,

  featured:
    product.featured,
}}
      />
    </div>
  );
}
