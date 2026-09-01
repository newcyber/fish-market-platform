import {
  NextRequest,
  NextResponse,
} from "next/server";

import ProductService from "@/services/product/product.service";

/**
 * ============================================================
 * MOBILE PRODUCT DETAIL API
 * ============================================================
 *
 * GET /api/mobile/products/[slug]
 *
 * PUBLIC endpoint.
 *
 * Tidak membutuhkan login.
 *
 * Digunakan ketika customer membuka detail produk sebelum
 * login dan sebelum menambahkan produk ke cart.
 *
 * ============================================================
 */

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } =
      await context.params;

    const normalizedSlug =
      slug.trim();

    if (!normalizedSlug) {
      return NextResponse.json(
        {
          success: false,

          error: {
            code:
              "INVALID_PRODUCT_SLUG",

            message:
              "Slug produk tidak valid.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const product =
      await ProductService.getPublishedProductBySlug(
        normalizedSlug
      );

    if (!product) {
      return NextResponse.json(
        {
          success: false,

          error: {
            code:
              "PRODUCT_NOT_FOUND",

            message:
              "Produk tidak ditemukan.",
          },
        },
        {
          status: 404,
        }
      );
    }

    const images =
      product.images?.map(
        (image) => ({
          id: image.id,

          image:
            image.image,

          sortOrder:
            image.sortOrder,

          isThumbnail:
            image.isThumbnail,
        })
      ) ?? [];

    const variantGroups =
      product.variantGroups?.map(
        (group) => ({
          id: group.id,

          name: group.name,

          sortOrder:
            group.sortOrder,

          options:
            group.options?.map(
              (option) => ({
                id: option.id,

                label:
                  option.label,

                sortOrder:
                  option.sortOrder,
              })
            ) ?? [],
        })
      ) ?? [];

    const skus =
      product.skus?.map(
        (sku) => ({
          id: sku.id,

          sku: sku.sku,

          price:
            Number(sku.price),

          stock:
            sku.stock,

          isActive:
            sku.isActive,

          options:
            sku.skuOptions?.map(
              (skuOption) => ({
                variantOptionId:
                  skuOption.variantOptionId,

                label:
                  skuOption
                    .variantOption
                    ?.label ?? null,

                groupId:
                  skuOption
                    .variantOption
                    ?.group
                    ?.id ?? null,

                groupName:
                  skuOption
                    .variantOption
                    ?.group
                    ?.name ?? null,
              })
            ) ?? [],
        })
      ) ?? [];

    return NextResponse.json(
      {
        success: true,

        data: {
          product: {
            id: product.id,

            name: product.name,

            slug: product.slug,

            description:
              product.description,

            category:
              product.category
                ? {
                    id:
                      product.category.id,

                    name:
                      product.category.name,

                    slug:
                      product.category.slug,
                  }
                : null,

            featured:
              product.featured,

            image:
              images.find(
                (image) =>
                  image.isThumbnail
              )?.image ??
              images[0]?.image ??
              null,

            images,

            variantGroups,

            skus,

            /**
             * Legacy fallback.
             *
             * Hanya relevan untuk product yang belum
             * menggunakan kombinasi SKU.
             */
            legacy: {
              price:
                product.price !== null
                  ? Number(product.price)
                  : null,

              stock:
                product.stock ?? 0,
            },
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[MOBILE_PRODUCT_DETAIL_GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error: {
          code:
            "INTERNAL_SERVER_ERROR",

          message:
            "Gagal mengambil detail produk.",
        },
      },
      {
        status: 500,
      }
    );
  }
}
