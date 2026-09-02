import { Prisma } from "@prisma/client";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: true;
    address: true;
    items: {
      include: {
        product: true;
        sku: true;
      };
    };
    paymentProof: true;
    paymentChannel: true;
  };
}>;

type OrderListWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: true;
        sku: true;
      };
    };
    paymentProof: true;
    paymentChannel: true;
  };
}>;

function serializeDecimal(
  value: Prisma.Decimal | number | string | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function serializeDate(
  value: Date | null | undefined
): string | null {
  return value ? value.toISOString() : null;
}

function serializeAddress(
  address: OrderWithRelations["address"]
) {
  if (!address) {
    return null;
  }

  return {
    id: address.id,
    receiverName: address.receiverName,
    receiverPhone: address.receiverPhone,
    province: address.province,
    city: address.city,
    district: address.district,
    village: address.village,
    postalCode: address.postalCode,
    fullAddress: address.fullAddress,
    label: address.label,
    notes: address.notes,
  };
}

function serializePaymentChannel(
  paymentChannel: OrderWithRelations["paymentChannel"]
) {
  if (!paymentChannel) {
    return null;
  }

  return {
    id: paymentChannel.id,
    name: paymentChannel.name,
    slug: paymentChannel.slug,
    type: paymentChannel.type,
    bankName: paymentChannel.bankName,
    accountNumber: paymentChannel.accountNumber,
    accountHolder: paymentChannel.accountHolder,
    instructions: paymentChannel.instructions,
    qrisImage: paymentChannel.qrisImage,
    description: paymentChannel.description,
    icon: paymentChannel.icon,
  };
}

function serializePaymentProof(
  paymentProof: OrderWithRelations["paymentProof"]
) {
  if (!paymentProof) {
    return null;
  }

  return {
    id: paymentProof.id,
    image: paymentProof.image,
    bankName: paymentProof.bankName,
    accountName: paymentProof.accountName,
    accountNumber: paymentProof.accountNumber,
    status: paymentProof.status,
    rejectionReason: paymentProof.rejectionReason,
    verifiedAt: serializeDate(paymentProof.verifiedAt),
    createdAt: serializeDate(paymentProof.createdAt),
    updatedAt: serializeDate(paymentProof.updatedAt),
  };
}

function serializeOrderItem(
  item: OrderWithRelations["items"][number]
) {
  return {
    id: item.id,
    productId: item.productId,
    skuId: item.skuId,
    productName: item.productName,
    productVariant: item.productVariant,
    productWeight: item.productWeight,
    weightSku: item.weightSku,
    customerNote: item.customerNote,
    price: serializeDecimal(item.price),
    quantity: item.quantity,
    subtotal: serializeDecimal(item.subtotal),
  };
}

export function serializeOrder(
  order: OrderWithRelations
) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,

    paymentChannel: serializePaymentChannel(
      order.paymentChannel
    ),

    subtotal: serializeDecimal(order.subtotal),

    voucher: order.voucherId || order.voucherCode
      ? {
          id: order.voucherId,
          code: order.voucherCode,
          name: order.voucherName,
          discount: serializeDecimal(order.voucherDiscount),
        }
      : null,

    shipping: {
      provider: order.shippingProvider,
      service: order.shippingService,
      cost: serializeDecimal(order.shippingCost),
      trackingNumber: order.trackingNumber,
      shippedAt: serializeDate(order.shippedAt),
      completedAt: serializeDate(order.completedAt),
    },

    total: serializeDecimal(order.total),
    notes: order.notes,
    paidAt: serializeDate(order.paidAt),

    address: serializeAddress(order.address),

    paymentProof: serializePaymentProof(
      order.paymentProof
    ),

    items: order.items.map(serializeOrderItem),

    createdAt: serializeDate(order.createdAt),
    updatedAt: serializeDate(order.updatedAt),
  };
}

export function serializeOrderListItem(
  order: OrderListWithRelations
) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,

    paymentChannel: order.paymentChannel
      ? {
          id: order.paymentChannel.id,
          name: order.paymentChannel.name,
          slug: order.paymentChannel.slug,
          type: order.paymentChannel.type,
          icon: order.paymentChannel.icon,
        }
      : null,

    subtotal: serializeDecimal(order.subtotal),
    voucherDiscount: serializeDecimal(order.voucherDiscount),
    shippingCost: serializeDecimal(order.shippingCost),
    total: serializeDecimal(order.total),

    paymentProof: order.paymentProof
      ? {
          id: order.paymentProof.id,
          status: order.paymentProof.status,
          rejectionReason:
            order.paymentProof.rejectionReason,
        }
      : null,

    items: order.items.map(serializeOrderItem),

    createdAt: serializeDate(order.createdAt),
    updatedAt: serializeDate(order.updatedAt),
  };
}
