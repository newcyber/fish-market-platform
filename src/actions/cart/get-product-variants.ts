"use server";

import ProductService from "@/services/product/product.service";

interface GetProductVariantsInput {
  productId: string;
}

export async function getProductVariants(
  input: GetProductVariantsInput
) {
  try {
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

    if (!product.isPublished) {
      return {
        success: false,
        message: "Produk tidak tersedia.",
      };
    }

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

    return {
      success: true,

      data: {
        productId:
          product.id,

        productName:
          product.name,

        variantGroups,

        skus,
      },
    };
  } catch (error) {
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
