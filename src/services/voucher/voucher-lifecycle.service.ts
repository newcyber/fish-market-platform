import {
  PaymentStatus,
  Prisma,
} from "@prisma/client";

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
  }
}

export default VoucherLifecycleService;