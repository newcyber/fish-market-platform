"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import ReorderService from "@/services/order/reorder.service";

export async function reorderOrderAction(orderId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message: "Silakan login untuk menggunakan Belanja Lagi.",
        skipped: [],
      };
    }

    const result = await ReorderService.reorderOrder(userId, orderId);

    if (result.addedCount === 0) {
      return {
        success: false,
        message:
          result.skipped[0]?.reason ??
          "Tidak ada produk dari pesanan tersebut yang masih tersedia.",
        skipped: result.skipped,
      };
    }

    revalidatePath("/customer");
    revalidatePath("/customer/cart");

    return {
      success: true,
      addedCount: result.addedCount,
      skipped: result.skipped,
      message:
        result.skipped.length > 0
          ? `${result.addedCount} produk ditambahkan. Beberapa produk tidak tersedia.`
          : `${result.addedCount} produk dari pesanan terakhir berhasil dimasukkan ke keranjang.`,
    };
  } catch (error) {
    console.error("[REORDER_ORDER_ACTION_ERROR]", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal mengulang pesanan.",
      skipped: [],
    };
  }
}
