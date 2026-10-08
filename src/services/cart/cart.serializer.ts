import CartService from "@/services/cart/cart.service";

import ProductInventoryAvailabilityService from "@/services/product/product-inventory-availability.service";

export async function serializeCart(
  cart: Awaited<
    ReturnType<typeof CartService.getCart>
  >
) {
  if (!cart) {
    return null;
  }

  /**
   * ==========================================================
   * PHYSICAL INVENTORY AVAILABILITY
   * ==========================================================
   *
   * Resolve all SKU availability in one bulk query.
   *
   * IMPORTANT:
   * - Tidak melakukan query per cart item.
   * - Pool-backed product membaca ProductInventoryPool.
   * - Legacy product tetap fallback melalui availability service.
   * - Serializer tetap read-only.
   */
  const skuIds = [
    ...new Set(
      cart.items
        .map((item) => item.sku?.id)
        .filter(
          (skuId): skuId is string =>
            typeof skuId === "string" &&
            skuId.length > 0
        )
    ),
  ];

  const availabilityList =
    skuIds.length > 0
      ? await ProductInventoryAvailabilityService.getSkuAvailabilities(
          skuIds
        )
      : [];

  const availabilityMap =
    new Map(
      availabilityList.map(
        (availability) => [
          availability.skuId,
          availability,
        ]
      )
    );

  const items = cart.items.map((item) => {
    const thumbnail =
      item.product.images.find(
        (image) =>
          image.isThumbnail
      ) ??
      item.product.images[0] ??
      null;

    const options =
      item.sku?.skuOptions.map(
        (skuOption) => ({
          variantOptionId:
            skuOption.variantOptionId,

          label:
            skuOption.variantOption.label,

          groupId:
            skuOption.variantOption.groupId,

          groupName:
            skuOption.variantOption.group.name,
        })
      ) ?? [];

    const unitPrice =
      Number(item.price);

    const availability =
      item.sku
        ? availabilityMap.get(
            item.sku.id
          )
        : null;

    return {
      id: item.id,

      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        image:
          thumbnail?.image ??
          null,
      },

      sku: item.sku
        ? {
            id: item.sku.id,
            sku: item.sku.sku,
            price:
              Number(item.sku.price),

            /**
             * Source of truth:
             * ProductInventoryPool for pool-backed products,
             * ProductSku.stock for legacy products.
             */
            stock:
              availability?.availableQuantity ??
              0,

            options,
          }
        : null,

      quantity:
        item.quantity,

      price:
        unitPrice,

      subtotal:
        unitPrice *
        item.quantity,

      customerNote:
        item.customerNote,

      isFlashSaleApplied:
        item.isFlashSaleApplied,

      flashSaleId:
        item.flashSaleId,

      flashSaleItemId:
        item.flashSaleItemId,
    };
  });

  const totalItems =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const subtotal =
    items.reduce(
      (total, item) =>
        total + item.subtotal,
      0
    );

  return {
    id: cart.id,
    items,
    totalItems,
    subtotal,
  };
}
