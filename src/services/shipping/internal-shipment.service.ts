import {
  OrderStatus,
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

/**
 * ============================================================
 * INTERNAL SHIPMENT SERVICE
 * ============================================================
 *
 * Service khusus untuk pengiriman menggunakan
 * Kurir Internal Pisjo Market.
 *
 * Tanggung jawab:
 *
 * - Validasi order
 * - Pastikan order siap dikirim
 * - Generate nomor resi internal
 * - Pastikan nomor resi unik
 * - Simpan informasi pengiriman
 * - Mengubah status order menjadi SHIPPING
 *
 * ============================================================
 */

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const INTERNAL_PROVIDER = "INTERNAL";

const INTERNAL_SERVICE_NAME =
  "Pisjo Internal Delivery";

const TRACKING_PREFIX =
  "PSJ-INT";

/**
 * ============================================================
 * RESULT TYPES
 * ============================================================
 */

export interface CreateInternalShipmentResult {
  success: boolean;

  message: string;

  data?: {
    orderId: string;

    orderNumber: string;

    trackingNumber: string;

    shippingProvider: string;

    shippingService: string;

    shippedAt: Date;
  };
}

/**
 * ============================================================
 * INTERNAL SHIPMENT SERVICE
 * ============================================================
 */

class InternalShipmentService {
  /**
   * ==========================================================
   * GENERATE RANDOM CODE
   * ==========================================================
   *
   * Menghasilkan kode acak yang aman digunakan
   * sebagai bagian dari nomor resi.
   *
   * Contoh:
   *
   * A7K92X
   *
   * Karakter ambigu seperti:
   *
   * O
   * 0
   * I
   * 1
   *
   * tidak digunakan.
   * ==========================================================
   */

  private generateRandomCode(
    length: number = 6
  ): string {
    const characters =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (
      let index = 0;
      index < length;
      index += 1
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
            characters.length
        );

      result +=
        characters.charAt(
          randomIndex
        );
    }

    return result;
  }

  /**
   * ==========================================================
   * GET DATE CODE
   * ==========================================================
   *
   * Format:
   *
   * YYYYMMDD
   *
   * Contoh:
   *
   * 20260816
   * ==========================================================
   */

  private getDateCode(
    date: Date
  ): string {
    const year =
      date
        .getFullYear()
        .toString();

    const month =
      (
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0");

    const day =
      date
        .getDate()
        .toString()
        .padStart(2, "0");

    return `${year}${month}${day}`;
  }

  /**
   * ==========================================================
   * GENERATE TRACKING NUMBER
   * ==========================================================
   *
   * Format:
   *
   * FM-INT-YYYYMMDD-XXXXXX
   *
   * Contoh:
   *
   * FM-INT-20260816-A7K92X
   * ==========================================================
   */

  private generateTrackingNumber(
    date: Date
  ): string {
    const dateCode =
      this.getDateCode(
        date
      );

    const randomCode =
      this.generateRandomCode(
        6
      );

    return `${TRACKING_PREFIX}-${dateCode}-${randomCode}`;
  }

  /**
   * ==========================================================
   * GENERATE UNIQUE TRACKING NUMBER
   * ==========================================================
   *
   * Nomor resi dicek terlebih dahulu ke database.
   *
   * Walaupun kemungkinan duplikasi sangat kecil,
   * database tetap menjadi sumber kebenaran.
   * ==========================================================
   */

  private async generateUniqueTrackingNumber(): Promise<string> {
    /**
     * Maksimal percobaan untuk mencegah
     * loop tanpa batas.
     */

    const maxAttempts = 20;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt += 1
    ) {
      const trackingNumber =
        this.generateTrackingNumber(
          new Date()
        );

      const existingOrder =
        await prisma.order.findUnique({
          where: {
            trackingNumber,
          },

          select: {
            id: true,
          },
        });

      if (!existingOrder) {
        return trackingNumber;
      }
    }

    throw new Error(
      "Gagal menghasilkan nomor resi unik. Silakan coba kembali."
    );
  }

  /**
   * ==========================================================
   * CREATE INTERNAL SHIPMENT
   * ==========================================================
   *
   * Flow:
   *
   * PROCESSING
   *      ↓
   * Generate Resi
   *      ↓
   * INTERNAL Shipment
   *      ↓
   * SHIPPING
   * ==========================================================
   */

  async createShipment(
    orderId: string
  ): Promise<CreateInternalShipmentResult> {
    try {
      /**
       * ========================================================
       * VALIDATE ORDER ID
       * ========================================================
       */

      const normalizedOrderId =
        orderId?.trim();

      if (!normalizedOrderId) {
        return {
          success: false,

          message:
            "Order ID wajib diisi.",
        };
      }

      /**
       * ========================================================
       * GET CURRENT ORDER
       * ========================================================
       */

      const order =
        await prisma.order.findUnique({
          where: {
            id: normalizedOrderId,
          },

          select: {
            id: true,

            orderNumber: true,

            status: true,

            trackingNumber: true,

            shippingProvider: true,
          },
        });

      /**
       * ========================================================
       * ORDER NOT FOUND
       * ========================================================
       */

      if (!order) {
        return {
          success: false,

          message:
            "Pesanan tidak ditemukan.",
        };
      }

      /**
       * ========================================================
       * VALIDATE ORDER STATUS
       * ========================================================
       *
       * Resi hanya boleh dibuat ketika pesanan
       * berada pada status PROCESSING.
       */

      if (
        order.status !==
        OrderStatus.PROCESSING
      ) {
        return {
          success: false,

          message:
            "Resi hanya dapat dibuat untuk pesanan yang sedang diproses.",
        };
      }

      /**
       * ========================================================
       * PREVENT DUPLICATE SHIPMENT
       * ========================================================
       */

      if (
        order.trackingNumber
      ) {
        return {
          success: false,

          message:
            `Pesanan ini sudah memiliki nomor resi: ${order.trackingNumber}`,
        };
      }

      /**
       * ========================================================
       * GENERATE TRACKING NUMBER
       * ========================================================
       */

      const trackingNumber =
        await this.generateUniqueTrackingNumber();

      /**
       * ========================================================
       * SHIPMENT TIMESTAMP
       * ========================================================
       */

      const now =
        new Date();

      /**
       * ========================================================
       * ATOMIC UPDATE
       * ========================================================
       *
       * Semua perubahan dilakukan dalam transaction:
       *
       * - Provider
       * - Service
       * - Tracking number
       * - Timestamp
       * - Status
       *
       * Jika salah satu gagal,
       * seluruh perubahan dibatalkan.
       * ========================================================
       */

      const updatedOrder =
  await prisma.$transaction(
    async (
      tx: Prisma.TransactionClient
    ) => {
            /**
             * ==================================================
             * RE-CHECK ORDER
             * ==================================================
             *
             * Menghindari race condition apabila admin
             * menekan tombol dua kali atau terdapat request
             * bersamaan.
             */

            const currentOrder =
              await tx.order.findUnique({
                where: {
                  id: normalizedOrderId,
                },

                select: {
                  id: true,

                  orderNumber: true,

                  status: true,

                  trackingNumber: true,
                },
              });

            if (!currentOrder) {
              throw new Error(
                "Pesanan tidak ditemukan."
              );
            }

            if (
              currentOrder.status !==
              OrderStatus.PROCESSING
            ) {
              throw new Error(
                "Pesanan tidak lagi berada pada status PROCESSING."
              );
            }

            if (
              currentOrder.trackingNumber
            ) {
              throw new Error(
                `Pesanan ini sudah memiliki nomor resi: ${currentOrder.trackingNumber}`
              );
            }

            /**
             * ==================================================
             * UPDATE ORDER
             * ==================================================
             */

            return tx.order.update({
              where: {
                id: normalizedOrderId,
              },

              data: {
                shippingProvider:
                  INTERNAL_PROVIDER,

                shippingService:
                  INTERNAL_SERVICE_NAME,

                trackingNumber,

                shippedAt:
                  now,

                /**
                 * Field lama tetap diisi
                 * untuk menjaga kompatibilitas
                 * dengan sistem sebelumnya.
                 */

                shippingAt:
                  now,

                status:
                  OrderStatus.SHIPPING,
              },

              select: {
                id: true,

                orderNumber: true,

                trackingNumber: true,

                shippingProvider: true,

                shippingService: true,

                shippedAt: true,
              },
            });
          }
        );

      /**
       * ========================================================
       * SUCCESS
       * ========================================================
       */

      return {
        success: true,

        message:
          "Resi Kurir Internal berhasil dibuat.",

        data: {
          orderId:
            updatedOrder.id,

          orderNumber:
            updatedOrder.orderNumber,

          trackingNumber:
            updatedOrder.trackingNumber!,

          shippingProvider:
            updatedOrder.shippingProvider!,

          shippingService:
            updatedOrder.shippingService!,

          shippedAt:
            updatedOrder.shippedAt!,
        },
      };
    } catch (error) {
      console.error(
        "[INTERNAL_SHIPMENT_CREATE_ERROR]",
        error
      );

      return {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat membuat resi internal.",
      };
    }
  }
}

/**
 * ============================================================
 * SINGLETON INSTANCE
 * ============================================================
 */

const internalShipmentService =
  new InternalShipmentService();

export default internalShipmentService;