"use server";

import ProductService from "@/services/product/product.service";

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
    const skus =
      product.skus.map(
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
        })
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