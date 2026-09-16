"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import ProductStockService, {
  type ProductStockUpdateInput,
} from "@/services/product/product-stock.service";

export async function updateProductStockAction(
  input: ProductStockUpdateInput
) {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.isActive !== true
  ) {
    return {
      success: false,
      message: "Sesi admin tidak valid atau sudah tidak aktif.",
    };
  }

  if (
    session.user.role !== Role.ADMIN &&
    session.user.role !== Role.SUPER_ADMIN
  ) {
    return {
      success: false,
      message:
        "Anda tidak memiliki izin untuk mengubah stock produk.",
    };
  }

  try {
    const result =
      await ProductStockService.updateProductStock(
        input
      );

    revalidatePath("/admin/products");

    return {
      success: true,
      message:
        result.changedCount > 0
          ? `${result.changedCount} SKU berhasil diperbarui.`
          : "Tidak ada perubahan stock.",
      data: result,
    };
  } catch (error) {
    console.error(
      "[updateProductStockAction]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui stock produk.",
    };
  }
}
