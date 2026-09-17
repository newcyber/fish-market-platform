"use server";

import { revalidatePath } from "next/cache";

import { ProductService } from "@/services/product/product.service";

export type BulkProductAction =
  | "publish"
  | "unpublish"
  | "delete";

export interface BulkProductFilters {
  search?: string;
  categoryId?: string;
  published?: boolean;
  featured?: boolean;
  stock?: "available" | "low" | "out";
}

interface BulkProductActionInput {
  action: BulkProductAction;
  ids?: string[];
  filters?: BulkProductFilters;
  excludedIds?: string[];
}

interface BulkProductActionResult {
  success: boolean;
  message?: string;
  processed?: number;
}

function normalizeIds(ids: string[] = []): string[] {
  return [
    ...new Set(
      ids
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ];
}

export async function bulkProductAction(
  input: BulkProductActionInput
): Promise<BulkProductActionResult> {
  if (
    input.action !== "publish" &&
    input.action !== "unpublish" &&
    input.action !== "delete"
  ) {
    return {
      success: false,
      message: "Aksi produk tidak valid.",
    };
  }

  try {
    if (input.filters) {
      const excludedIds = normalizeIds(input.excludedIds);

      if (excludedIds.length > 5000) {
        return {
          success: false,
          message: "Terlalu banyak pengecualian produk.",
        };
      }

      const result = await ProductService.bulkProductActionByFilter(
        input.filters,
        input.action,
        excludedIds
      );

      revalidatePath("/admin/products");

      return {
        success: true,
        message: `${result.count} produk berhasil diproses.`,
        processed: result.count,
      };
    }

    const ids = normalizeIds(input.ids);

    if (ids.length === 0) {
      return {
        success: false,
        message: "Tidak ada produk yang dipilih.",
      };
    }

    if (ids.length > 5000) {
      return {
        success: false,
        message: "Maksimal 5.000 produk dapat diproses sekaligus.",
      };
    }

    const result = await ProductService.bulkProductActionByIds(
      ids,
      input.action
    );

    revalidatePath("/admin/products");

    return {
      success: true,
      message: `${result.count} produk berhasil diproses.`,
      processed: result.count,
    };
  } catch (error) {
    console.error("Bulk product action failed:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Aksi massal produk gagal dilakukan.",
    };
  }
}
