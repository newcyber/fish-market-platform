import { OrderStatus } from "@prisma/client";

/**
 * Seluruh status order.
 */
export const ORDER_STATUS = {
  PENDING: OrderStatus.PENDING,

  WAITING_PAYMENT: OrderStatus.WAITING_PAYMENT,

  WAITING_VERIFICATION: OrderStatus.WAITING_VERIFICATION,

  PROCESSING: OrderStatus.PROCESSING,

  SHIPPING: OrderStatus.SHIPPING,

  COMPLETED: OrderStatus.COMPLETED,

  CANCELLED: OrderStatus.CANCELLED,
} as const;

/**
 * Status order yang dianggap selesai.
 */
export const FINISHED_ORDER_STATUS: readonly OrderStatus[] = [
  OrderStatus.COMPLETED,
];

/**
 * Status order yang masih aktif.
 */
export const ACTIVE_ORDER_STATUS: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.WAITING_PAYMENT,
  OrderStatus.WAITING_VERIFICATION,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPING,
];