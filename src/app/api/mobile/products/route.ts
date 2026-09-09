import { NextRequest } from "next/server";

import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import ProductService from "@/services/product/product.service";

/**
 * ============================================================
 * MOBILE PRODUCT API
 * ============================================================
 *
 * GET /api/mobile/products
 *
 * PUBLIC endpoint.
 *
 * Query:
 * - page
 * - limit
 * - search
 * - categoryId
 * - featured=true|false
 * - discounted=true|false
 *
 * published selalu TRUE.
 *
 * ============================================================
 */

function parseBoolean(
  value: string | null
): boolean | undefined {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parsePositiveInteger(
  value: string | null,
  fallback: number
): number {
  if (value === null) {
    return fallback;
  }

  const parsed =
    Number.parseInt(value, 10);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        1
      );

    const limit =
      parsePositiveInteger(
        searchParams.get("limit"),
        20
      );

    const search =
      searchParams.get("search")?.trim() ||
      undefined;

    const categoryId =
      searchParams
        .get("categoryId")
        ?.trim() ||
      undefined;

    const featured =
      parseBoolean(
        searchParams.get("featured")
      );

    const discounted =
      parseBoolean(
        searchParams.get("discounted")
      );

    const result =
      await ProductService.getProductsPaginated(
        {
          search,
          categoryId,
          featured,
          discounted,

          /**
           * Public mobile catalog hanya boleh
           * menampilkan product published.
           */
          published: true,
        },
        page,
        limit
      );

    const items =
      result.items.map(
        (product) => {
          const thumbnail =
            product.images?.[0] ??
            null;

          const activeSkus =
            product.skus ?? [];

          const hasActiveSku =
            activeSkus.length > 0;

          const minSkuPrice =
            hasActiveSku
              ? Number(activeSkus[0].price)
              : Number(product.price);

          const maxSkuPrice =
            hasActiveSku
              ? Number(
                  activeSkus[
                    activeSkus.length - 1
                  ].price
                )
              : Number(product.price);

          const hasAvailableSkuStock =
            activeSkus.some(
              (sku) => sku.stock > 0
            );

          return {
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

            image:
              thumbnail?.image ??
              null,

            featured:
              product.featured,

            pricing: {
              minPrice: minSkuPrice,
              maxPrice: maxSkuPrice,
              isRange:
                minSkuPrice !== maxSkuPrice,
            },

            stock: {
              available: hasActiveSku
                ? hasAvailableSkuStock
                : (product.stock ?? 0) > 0,
            },
          };
        }
      );

    return mobileSuccess(
      {
        items,

        pagination: {
          page:
            result.page,

          limit:
            result.limit,

          total:
            result.total,

          totalPages:
            result.totalPages,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "[MOBILE_PRODUCTS_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Gagal mengambil produk.",
      500
    );
  }
}
