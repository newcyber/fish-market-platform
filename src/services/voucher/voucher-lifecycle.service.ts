import {
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import {
  createAuditLog,
} from "@/services/audit/audit-log.service";

/**
 * ============================================================
 * VOUCHER LIFECYCLE SERVICE
 * ============================================================
 *
 * Mengatur lifecycle penggunaan voucher setelah voucher
 * berhasil di-consume saat order dibuat.
 *
 * Service ini TIDAK melakukan:
 *
 * - validasi voucher
 * - perhitungan diskon
 * - create order
 *
 * Tanggung jawab:
 *
 * - menentukan apakah voucher boleh dilepas
 * - menghapus VoucherUsage
 * - mengembalikan usageCount secara aman
 *
 * Semua proses dijalankan menggunakan TransactionClient
 * agar perubahan VoucherUsage, usageCount, dan Order dapat
 * di-commit atau rollback secara bersamaan.
 * ============================================================
 */

export class VoucherLifecycleService {
  /**
   * ==========================================================
   * RELEASE VOUCHER FOR CANCELLED ORDER
   * ==========================================================
   *
   * Voucher hanya dikembalikan jika:
   *
   * 1. Order memang memiliki VoucherUsage.
   * 2. Pembayaran belum VERIFIED.
   *
   * Jika pembayaran sudah VERIFIED, voucher dianggap telah
   * benar-benar consumed dan tidak dikembalikan otomatis.
   *
   * Method ini idempotent:
   *
   * Jika VoucherUsage sudah tidak ada, method hanya return
   * tanpa melakukan perubahan apa pun.
   * ==========================================================
   */

  static async releaseForCancelledOrder(
    orderId: string,
    paymentStatus: PaymentStatus,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    /**
     * ========================================================
     * VERIFIED PAYMENT
     * ========================================================
     *
     * Voucher tidak boleh dikembalikan untuk transaksi yang
     * pembayarannya sudah berhasil diverifikasi.
     */

    if (
      paymentStatus ===
      PaymentStatus.VERIFIED
    ) {
      return;
    }

    /**
     * ========================================================
     * FIND VOUCHER USAGE
     * ========================================================
     *
     * orderId bersifat unique pada VoucherUsage sehingga satu
     * order hanya dapat memiliki satu penggunaan voucher.
     */

    const voucherUsage =
      await tx.voucherUsage.findUnique({
        where: {
          orderId,
        },

        select: {
          id: true,

          voucherId: true,

          userId: true,
        },
      });

    /**
     * ========================================================
     * IDEMPOTENCY
     * ========================================================
     *
     * Tidak ada VoucherUsage berarti:
     *
     * - order tidak memakai voucher, atau
     * - voucher sudah pernah dilepas.
     */

    if (!voucherUsage) {
      return;
    }

    /**
     * ========================================================
     * SERIALIZE PER-USER VOUCHER RELEASE
     * ========================================================
     *
     * Checkout menggunakan advisory lock yang sama ketika
     * voucher memiliki perUserLimit. Cancellation wajib ikut
     * mengambil lock tersebut agar release tidak berjalan
     * bersamaan dengan checkout user yang sama.
     */

    const voucher =
      await tx.voucher.findUnique({
        where: {
          id: voucherUsage.voucherId,
        },
        select: {
          perUserLimit: true,
        },
      });

    if (voucher?.perUserLimit !== null && voucher) {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(
            ${voucherUsage.voucherId} || ':' || ${voucherUsage.userId}
          )::bigint
        )
      `;
    }

    /**
     * ========================================================
     * DELETE VOUCHER USAGE
     * ========================================================
     *
     * Hapus terlebih dahulu.
     *
     * Jika proses berikutnya gagal, seluruh transaction akan
     * rollback sehingga VoucherUsage tetap aman.
     */

    await tx.voucherUsage.delete({
      where: {
        id:
          voucherUsage.id,
      },
    });

    /**
     * ========================================================
     * SAFELY DECREMENT USAGE COUNT
     * ========================================================
     *
     * usageCount tidak boleh menjadi negatif.
     *
     * updateMany digunakan sebagai guarded update:
     *
     * WHERE usageCount > 0
     * SET usageCount = usageCount - 1
     */

    const releaseResult =
      await tx.voucher.updateMany({
        where: {
          id:
            voucherUsage.voucherId,

          usageCount: {
            gt: 0,
          },
        },

        data: {
          usageCount: {
            decrement:
              1,
          },
        },
      });

    /**
     * ========================================================
     * CONSISTENCY CHECK
     * ========================================================
     *
     * VoucherUsage ditemukan tetapi voucher tidak berhasil
     * dikurangi.
     *
     * Lempar error agar seluruh transaction rollback.
     */

    if (
      releaseResult.count !== 1
    ) {
      throw new Error(
        "Gagal mengembalikan kuota voucher."
      );
    }

    await createAuditLog(
      {
        eventType: "VOUCHER_LIFECYCLE",
        entityType: "VOUCHER",
        entityId: voucherUsage.voucherId,
        action: "RELEASED",
        metadata: {
          orderId,
          quantity: 1,
          reason: "ORDER_CANCELLED",
        },
      },
      tx,
    );
  }
}

export default VoucherLifecycleService;