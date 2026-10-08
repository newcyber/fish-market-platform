"use server";

import ProductService from "@/services/product/product.service";
import ProductPricingService from "@/services/pricing/product-pricing.service";
import { prisma } from "@/lib/prisma";
import ProductInventoryAvailabilityService from "@/services/product/product-inventory-availability.service";

interface GetProductVariantsInput {
  productId: string;
}

export async function getProductVariants(
  input: GetProductVariantsInput
) {
  try {
    /**
     * ==========================================================
     * VALIDATE PRODUCT ID
     * ==========================================================
     */
    const productId =
      typeof input?.productId === "string"
        ? input.productId.trim()
        : "";

    if (!productId) {
      return {
        success: false,
        message: "Produk tidak valid.",
      };
    }

    /**
     * ==========================================================
     * GET PRODUCT
     * ==========================================================
     */
    const product =
      await ProductService.getProductById(
        productId
      );

    if (!product) {
      return {
        success: false,
        message: "Produk tidak ditemukan.",
      };
    }

    /**
     * ==========================================================
     * PRODUCT AVAILABILITY
     * ==========================================================
     */
    if (!product.isPublished) {
      return {
        success: false,
        message: "Produk tidak tersedia.",
      };
    }

    /**
     * ==========================================================
     * VARIANT GROUPS
     * ==========================================================
     */
    const variantGroups =
      product.variantGroups.map(
        (group) => ({
          id: group.id,

          name: group.name,

          sortOrder:
            group.sortOrder,

          options:
            group.options.map(
              (option) => ({
                id: option.id,

                label: option.label,

                sortOrder:
                  option.sortOrder,
              })
            ),
        })
      );

    /**
     * ==========================================================
     * SKU
     * ==========================================================
     *
     * Semua SKU dikirim ke client.
     *
     * Untuk Pre-Order:
     *
     *   isActive = true
     *   stock    = 0
     *
     * SKU tetap tersedia untuk dipilih.
     */
    const availability =
      await ProductInventoryAvailabilityService.getSkuAvailabilities(
        product.skus.map((sku) => sku.id)
      );

    const availabilityBySkuId = new Map(
      availability.map((item) => [
        item.skuId,
        item,
      ])
    );

    const pricingBySkuId = new Map(
      await prisma.$transaction(async (tx) =>
        Promise.all(
          product.skus.map(async (sku) => [
            sku.id,
            await ProductPricingService.resolve(tx, {
              productId: product.id,
              skuId: sku.id,
            }),
          ] as const),
        ),
      ),
    );

    const skus =
      product.skus.map(
        (sku) => {
          const pricing = pricingBySkuId.get(sku.id);

          return ({
          id: sku.id,

          sku: sku.sku,

          price:
            Number(sku.price),

          stock:
            availabilityBySkuId.get(
              sku.id
            )?.availableQuantity ?? 0,

          isActive:
            sku.isActive,

          normalPrice:
            Number(pricing?.originalPrice ?? sku.price),

          finalPrice:
            Number(pricing?.finalPrice ?? sku.price),

          discountAmount:
            Number(pricing?.discountAmount ?? 0),

          isDiscountApplied:
            pricing?.isDiscountApplied ?? false,

          isFlashSaleApplied:
            pricing?.isFlashSaleApplied ?? false,

          promotionName:
            pricing?.promotionName ?? null,

          flashSaleName:
            pricing?.flashSaleName ?? null,

          discountSource:
            pricing?.discountSource ?? "NONE",

          options:
            sku.skuOptions.map(
              (skuOption) => ({
                variantOptionId:
                  skuOption.variantOptionId,

                label:
                  skuOption.variantOption
                    .label,

                groupId:
                  skuOption.variantOption
                    .groupId,

                groupName:
                  skuOption.variantOption
                    .group.name,
              })
            ),
          });
        },
      );

    /**
     * ==========================================================
     * RESPONSE
     * ==========================================================
     *
     * Pre-Order adalah property Product,
     * bukan property SKU.
     */
    return {
      success: true,

      data: {
        productId:
          product.id,

        productName:
          product.name,

        isPreOrder:
          product.isPreOrder,

        preOrderMinDays:
          product.preOrderMinDays,

        preOrderMaxDays:
          product.preOrderMaxDays,

        variantGroups,

        skus,
      },
    };
  } catch (error) {
    /**
     * ==========================================================
     * ERROR HANDLING
     * ==========================================================
     */
    console.error(
      "[GET_PRODUCT_VARIANTS]",
      error
    );

    return {
      success: false,

      message:
        "Gagal mengambil pilihan varian produk.",
    };
  }
}