import type { OrderStatus } from "@prisma/client";

/**
 * Dashboard Recent Order DTO
 *
 * Data yang digunakan oleh Dashboard,
 * bukan representasi penuh dari model Order.
 */

export interface RecentOrderDTO {
  /**
   * Primary Key
   */
  id: string;

  /**
   * Nomor Order
   */
  orderNumber: string;

  /**
   * Nama Customer
   */
  customer: string;

  /**
   * Total Pembayaran
   */
  total: number;

  /**
   * Status Order
   */
  status: OrderStatus;

  /**
   * Tanggal dibuat
   */
  createdAt: Date;
}