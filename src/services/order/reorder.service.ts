import CartService from "@/services/cart/cart.service";
import OrderRepository from "@/repositories/OrderRepository";

export interface ReorderResult {
  addedCount: number;
  skipped: Array<{
    productName: string;
    quantity: number;
    reason: string;
  }>;
}

/**
 * ============================================================
 * PISJO REORDER SERVICE
 * ============================================================
 *
 * Mengubah order COMPLETED + pembayaran VERIFIED menjadi
 * keranjang baru menggunakan SKU yang masih aktif.
 *
 * Harga dan stok TIDAK diambil dari order lama. CartService
 * selalu melakukan validasi ulang terhadap produk/SKU saat ini.
 * ============================================================
 */
export default class ReorderService {
  static async getLatestReorderableOrder(userId: string) {
    if (!userId?.trim()) {
      return null;
    }

    return OrderRepository.findLatestCompletedByUserId(userId);
  }

  static async reorderOrder(
    userId: string,
    orderId: string,
  ): Promise<ReorderResult> {
    if (!userId?.trim()) {
      throw new Error("Customer tidak valid.");
    }

    if (!orderId?.trim()) {
      throw new Error("Order tidak valid.");
    }

    const order = await OrderRepository.findCompletedByIdAndUserId(
      orderId,
      userId,
    );

    if (!order) {
      throw new Error(
        "Pesanan tidak ditemukan atau belum memenuhi syarat untuk dibeli lagi.",
      );
    }

    const result: ReorderResult = {
      addedCount: 0,
      skipped: [],
    };

    for (const item of order.items) {
      if (
        !item.product ||
        item.product.deletedAt !== null ||
        !item.product.isPublished
      ) {
        result.skipped.push({
          productName: item.productName,
          quantity: item.quantity,
          reason: "Produk sudah tidak tersedia.",
        });
        continue;
      }

      let skuId = item.skuId ?? null;

      // Untuk order lama hasil migrasi SKU, otomatis gunakan SKU aktif
      // jika produk saat ini hanya memiliki satu SKU aktif.
      if (!skuId && item.product.skus.length === 1) {
        skuId = item.product.skus[0].id;
      }

      if (!skuId && item.product.skus.length > 1) {
        result.skipped.push({
          productName: item.productName,
          quantity: item.quantity,
          reason:
            "Produk memiliki beberapa varian. Silakan pilih varian kembali.",
        });
        continue;
      }

      if (skuId && (!item.sku || !item.sku.isActive) && item.skuId) {
        result.skipped.push({
          productName: item.productName,
          quantity: item.quantity,
          reason: "Varian yang dulu dibeli sudah tidak tersedia.",
        });
        continue;
      }

      try {
        await CartService.addItem({
          owner: {
            type: "customer",
            userId,
          },
          productId: item.productId,
          skuId,
          quantity: item.quantity,
        });

        result.addedCount += 1;
      } catch (error) {
        result.skipped.push({
          productName: item.productName,
          quantity: item.quantity,
          reason:
            error instanceof Error
              ? error.message
              : "Produk tidak dapat ditambahkan ke keranjang.",
        });
      }
    }

    return result;
  }
}
