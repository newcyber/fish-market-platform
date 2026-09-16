"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import ProductPriceService, {
  type ProductPriceUpdateInput,
} from "@/services/product/product-price.service";

export async function updateProductPriceAction(
  input: ProductPriceUpdateInput
) {
  const session = await auth();

  if (!session?.user?.id || session.user.isActive !== true) {
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
      message: "Anda tidak memiliki izin untuk mengubah harga produk.",
    };
  }

  try {
    const result = await ProductPriceService.updateProductPrice(input);

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${input.productId}/edit`);

    return {
      success: true,
      message:
        result.changedCount > 0
          ? `${result.changedCount} SKU berhasil diperbarui.`
          : "Tidak ada perubahan harga.",
      data: result,
    };
  } catch (error) {
    console.error("[updateProductPriceAction]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui harga produk.",
    };
  }
}
