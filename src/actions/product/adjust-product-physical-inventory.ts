"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import ProductPhysicalInventoryAdminService, {
  type AdjustProductPhysicalInventoryInput,
} from "@/services/product/product-physical-inventory-admin.service";

export async function adjustProductPhysicalInventoryAction(
  input: AdjustProductPhysicalInventoryInput,
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
      message: "Anda tidak memiliki izin untuk mengubah stok fisik produk.",
    };
  }

  try {
    const result = await ProductPhysicalInventoryAdminService.adjust(
      input,
      session.user.id,
    );

    revalidatePath("/admin/products");

    return {
      success: true,
      message: `${result.changedCount} inventory pool berhasil disesuaikan.`,
      data: result,
    };
  } catch (error) {
    console.error("[adjustProductPhysicalInventoryAction]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menyesuaikan stok fisik produk.",
    };
  }
}

export async function setProductPhysicalInventoryUnitsAction(
  input: Parameters<
    typeof ProductPhysicalInventoryAdminService.setByUnits
  >[0],
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
      message: "Anda tidak memiliki izin untuk mengubah stok unit produk.",
    };
  }

  try {
    const result = await ProductPhysicalInventoryAdminService.setByUnits(
      input,
      session.user.id,
    );

    revalidatePath("/admin/products");

    return {
      success: true,
      message: `${result.changedCount} inventory pool berhasil diperbarui dari stok unit.`,
      data: result,
    };
  } catch (error) {
    console.error("[setProductPhysicalInventoryUnitsAction]", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui stok unit produk.",
    };
  }
}
