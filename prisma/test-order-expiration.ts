import { PrismaClient } from "@prisma/client";

import OrderExpirationService from "../src/services/order/order-expiration.service";

const prisma = new PrismaClient();

/**
 * ============================================================
 * ORDER EXPIRATION TEST
 * ============================================================
 *
 * Script ini mencari order yang belum:
 *
 * - COMPLETED
 * - CANCELLED
 * - VERIFIED
 *
 * Kemudian menjalankan OrderExpirationService dengan timeout
 * sangat kecil agar order test dapat langsung diproses.
 *
 * IMPORTANT:
 *
 * Jalankan hanya ketika Anda sudah memiliki order test
 * yang belum dibayar.
 * ============================================================
 */

async function main() {
  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "       ORDER EXPIRATION TEST"
  );

  console.log(
    "========================================"
  );

  console.log("");

  /**
   * ==========================================================
   * FIND TEST CANDIDATE
   * ==========================================================
   */

  const candidate =
    await prisma.order.findFirst({
      where: {
        deletedAt: null,

        status: {
          notIn: [
            "COMPLETED",
            "CANCELLED",
          ],
        },

        paymentStatus: {
          not: "VERIFIED",
        },
      },

      orderBy: {
        createdAt: "asc",
      },

      include: {
        voucherUsage: {
          include: {
            voucher: true,
          },
        },

        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
          },
        },
      },
    });

  /**
   * ==========================================================
   * NO CANDIDATE
   * ==========================================================
   */

  if (!candidate) {
    console.log(
      "❌ Tidak ditemukan order yang dapat digunakan untuk test expiration."
    );

    console.log("");

    console.log(
      "Buat terlebih dahulu order test yang belum dibayar."
    );

    process.exitCode = 1;

    return;
  }

  /**
   * ==========================================================
   * BEFORE
   * ==========================================================
   */

  console.log(
    "ORDER TEST DITEMUKAN"
  );

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Order ID:",
    candidate.id
  );

  console.log(
    "Order Number:",
    candidate.orderNumber
  );

  console.log(
    "Status:",
    candidate.status
  );

  console.log(
    "Payment Status:",
    candidate.paymentStatus
  );

  console.log(
    "Created At:",
    candidate.createdAt.toISOString()
  );

  console.log(
    "Voucher:",
    candidate.voucherCode ??
      "-"
  );

  console.log(
    "VoucherUsage:",
    candidate.voucherUsage
      ? "ADA"
      : "TIDAK ADA"
  );

  if (candidate.voucherUsage) {
    console.log(
      "Voucher Usage Count Before:",
      candidate.voucherUsage.voucher.usageCount
    );
  }

  console.log("");

  /**
   * ==========================================================
   * EXPIRE ORDER
   * ==========================================================
   *
   * Timeout:
   *
   * 0.0001 jam ≈ 0.36 detik.
   *
   * Order yang baru dibuat pun akan memenuhi syarat
   * setelah melewati waktu tersebut.
   * ==========================================================
   */

  console.log(
    "MENJALANKAN EXPIRATION..."
  );

  console.log("");

  const result =
    await OrderExpirationService.expirePendingOrders(
      0.0001
    );

  /**
   * ==========================================================
   * RESULT
   * ==========================================================
   */

  console.log(
    "EXPIRATION RESULT"
  );

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Success:",
    result.success
  );

  console.log(
    "Message:",
    result.message
  );

  console.log(
    "Total Found:",
    result.totalFound
  );

  console.log(
    "Total Expired:",
    result.totalExpired
  );

  console.log(
    "Total Failed:",
    result.totalFailed
  );

  console.log("");

  /**
   * ==========================================================
   * RELOAD ORDER
   * ==========================================================
   */

  const updatedOrder =
    await prisma.order.findUnique({
      where: {
        id: candidate.id,
      },

      include: {
        voucherUsage: {
          include: {
            voucher: true,
          },
        },
      },
    });

  /**
   * ==========================================================
   * AFTER
   * ==========================================================
   */

  console.log(
    "ORDER AFTER EXPIRATION"
  );

  console.log(
    "----------------------------------------"
  );

  if (!updatedOrder) {
    console.log(
      "❌ Order tidak ditemukan setelah expiration."
    );

    process.exitCode = 1;

    return;
  }

  console.log(
    "Status:",
    updatedOrder.status
  );

  console.log(
    "Payment Status:",
    updatedOrder.paymentStatus
  );

  console.log(
    "VoucherUsage:",
    updatedOrder.voucherUsage
      ? "MASIH ADA"
      : "SUDAH DIRELEASE"
  );

  if (candidate.voucherUsage) {
    const voucherAfter =
      await prisma.voucher.findUnique({
        where: {
          id:
            candidate.voucherUsage.voucherId,
        },

        select: {
          code: true,
          usageCount: true,
        },
      });

    console.log(
      "Voucher Usage Count After:",
      voucherAfter?.usageCount ??
        "-"
    );
  }

  console.log("");

  /**
   * ==========================================================
   * VALIDATION
   * ==========================================================
   */

  const orderCancelled =
    updatedOrder.status ===
    "CANCELLED";

  const voucherReleased =
    !candidate.voucherUsage ||
    updatedOrder.voucherUsage === null;

  console.log(
    "VALIDATION"
  );

  console.log(
    "----------------------------------------"
  );

  console.log(
    "Order CANCELLED:",
    orderCancelled
      ? "✅ VALID"
      : "❌ FAILED"
  );

  console.log(
    "Voucher Released:",
    voucherReleased
      ? "✅ VALID"
      : "❌ FAILED"
  );

  const success =
    orderCancelled &&
    voucherReleased &&
    result.totalFailed === 0;

  console.log("");

  console.log(
    success
      ? "🎉 ORDER EXPIRATION TEST BERHASIL"
      : "❌ ORDER EXPIRATION TEST BELUM LULUS"
  );

  console.log(
    "========================================"
  );

  if (!success) {
    process.exitCode = 1;
  }
}

main()
  .catch(
    (error) => {
      console.error(
        "[ORDER_EXPIRATION_TEST_ERROR]",
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );