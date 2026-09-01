import CartService from "@/services/cart/cart.service";

export function serializeCart(
  cart: Awaited<
    ReturnType<typeof CartService.getCart>
  >
) {
  if (!cart) {
    return null;
  }

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
            stock: item.sku.stock,
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
