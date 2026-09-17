"use server";

import { revalidatePath } from "next/cache";

import CategoryRepository, {
  type CategoryFilters,
} from "@/repositories/CategoryRepository";
import CategoryService from "@/services/category/category.service";

export type BulkCategoryAction =
  | "activate"
  | "deactivate"
  | "delete"
  | "restore"
  | "permanent-delete";

export interface BulkCategoryActionInput {
  action: BulkCategoryAction;
  ids?: string[];
  filters?: CategoryFilters;
  excludedIds?: string[];
}

export interface BulkCategoryActionResult {
  success: boolean;
  message?: string;
  processed?: number;
}

function normalizeIds(ids: string[] = []) {
  return [
    ...new Set(
      ids
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeFilters(
  filters: CategoryFilters = {},
): CategoryFilters {
  return {
    search: filters.search?.trim() || undefined,
    active: filters.active,
    deleted: filters.deleted === true,
  };
}

async function resolveTargetIds(
  ids: string[],
  filters: CategoryFilters,
  excludedIds: string[],
) {
  if (ids.length > 0) {
    return ids;
  }

  if (!filters.deleted) {
    throw new Error(
      "Bulk restore/hapus permanen hanya dapat dilakukan dari Recycle Bin.",
    );
  }

  const rows = await CategoryRepository.findIdsByFilter(
    filters,
    excludedIds,
    5001,
  );

  if (rows.length > 5000) {
    throw new Error(
      "Maksimal 5.000 kategori dapat diproses sekaligus. Persempit filter terlebih dahulu.",
    );
  }

  return rows.map((row) => row.id);
}

export async function bulkCategoryAction(
  input: BulkCategoryActionInput,
): Promise<BulkCategoryActionResult> {
  const allowedActions: BulkCategoryAction[] = [
    "activate",
    "deactivate",
    "delete",
    "restore",
    "permanent-delete",
  ];

  if (!allowedActions.includes(input.action)) {
    return {
      success: false,
      message: "Aksi kategori tidak valid.",
    };
  }

  const ids = normalizeIds(input.ids);
  const excludedIds = normalizeIds(input.excludedIds);
  const filters = normalizeFilters(input.filters);

  if (ids.length > 5000 || excludedIds.length > 5000) {
    return {
      success: false,
      message: "Maksimal 5.000 kategori dapat diproses sekaligus.",
    };
  }

  if (ids.length === 0 && !input.filters) {
    return {
      success: false,
      message: "Tidak ada kategori yang dipilih.",
    };
  }

  const isRecycleAction =
    input.action === "restore" ||
    input.action === "permanent-delete";

  if (isRecycleAction && !filters.deleted && ids.length === 0) {
    return {
      success: false,
      message:
        "Aksi Recycle Bin hanya dapat dilakukan pada kategori yang telah dihapus.",
    };
  }

  try {
    if (input.action === "delete") {
      const categoriesWithProducts =
        await CategoryRepository.findManyWithProducts({
          ids: ids.length > 0 ? ids : undefined,
          filters: ids.length === 0 ? filters : undefined,
          excludedIds: ids.length === 0 ? excludedIds : [],
        });

      if (categoriesWithProducts.length > 0) {
        const preview = categoriesWithProducts
          .slice(0, 5)
          .map(
            (category) =>
              `• ${category.name} (${category._count.products.toLocaleString("id-ID")} produk)`,
          )
          .join("\n");

        const remaining =
          categoriesWithProducts.length > 5
            ? `\nDan ${categoriesWithProducts.length - 5} kategori lainnya.`
            : "";

        return {
          success: false,
          message:
            `Penghapusan dibatalkan. ${categoriesWithProducts.length.toLocaleString("id-ID")} kategori masih memiliki produk.\n\n${preview}${remaining}\n\nPindahkan produk ke kategori lain terlebih dahulu, lalu ulangi penghapusan.`,
        };
      }

      const result =
        ids.length > 0
          ? await CategoryRepository.bulkUpdate(ids, {
              deletedAt: new Date(),
            })
          : await CategoryRepository.bulkUpdateByFilter(
              filters,
              excludedIds,
              { deletedAt: new Date() },
            );

      revalidatePath("/admin/categories");

      return {
        success: true,
        processed: result.count,
        message: `${result.count.toLocaleString("id-ID")} kategori berhasil dipindahkan ke Recycle Bin.`,
      };
    }

    if (input.action === "activate" || input.action === "deactivate") {
      if (filters.deleted) {
        return {
          success: false,
          message:
            "Kategori di Recycle Bin tidak dapat diubah statusnya. Pulihkan terlebih dahulu.",
        };
      }

      const data =
        input.action === "activate"
          ? { isActive: true }
          : { isActive: false };

      const result =
        ids.length > 0
          ? await CategoryRepository.bulkUpdate(ids, data)
          : await CategoryRepository.bulkUpdateByFilter(
              filters,
              excludedIds,
              data,
            );

      revalidatePath("/admin/categories");

      return {
        success: true,
        processed: result.count,
        message: `${result.count.toLocaleString("id-ID")} kategori berhasil diproses.`,
      };
    }

    const targetIds = await resolveTargetIds(
      ids,
      filters,
      excludedIds,
    );

    if (targetIds.length === 0) {
      return {
        success: false,
        message: "Tidak ada kategori yang dapat diproses.",
      };
    }

    const deletedCategories =
      await CategoryRepository.findDeletedByIds(targetIds);

    if (deletedCategories.length !== targetIds.length) {
      return {
        success: false,
        message:
          "Sebagian kategori yang dipilih sudah tidak berada di Recycle Bin. Muat ulang halaman lalu coba lagi.",
      };
    }

    if (input.action === "permanent-delete") {
      const categoriesWithProducts =
        await CategoryRepository.findManyWithProducts({
          ids: targetIds,
          filters: { deleted: true },
        });

      if (categoriesWithProducts.length > 0) {
        const preview = categoriesWithProducts
          .slice(0, 5)
          .map(
            (category) =>
              `• ${category.name} (${category._count.products.toLocaleString("id-ID")} produk)`,
          )
          .join("\n");

        const remaining =
          categoriesWithProducts.length > 5
            ? `\nDan ${categoriesWithProducts.length - 5} kategori lainnya.`
            : "";

        return {
          success: false,
          message:
            `Hapus permanen dibatalkan. ${categoriesWithProducts.length.toLocaleString("id-ID")} kategori masih memiliki produk.\n\n${preview}${remaining}\n\nPindahkan semua produk terlebih dahulu.`,
        };
      }
    }

    let processed = 0;

    if (input.action === "restore") {
      const slugOwners = await Promise.all(
        deletedCategories.map((category) =>
          CategoryRepository.findBySlugAnyState(
            category.slug,
            category.id,
          ),
        ),
      );

      const conflictIndex = slugOwners.findIndex(
        (owner) => owner !== null,
      );

      if (conflictIndex !== -1) {
        const conflict = deletedCategories[conflictIndex];
        return {
          success: false,
          message:
            `Pemulihan dibatalkan karena slug "${conflict.slug}" pada kategori "${conflict.name}" sudah digunakan kategori lain. Selesaikan konflik slug terlebih dahulu.`,
        };
      }

      for (const id of targetIds) {
        await CategoryService.restoreCategory(id);
        processed += 1;
      }

      revalidatePath("/admin/categories");

      return {
        success: true,
        processed,
        message: `${processed.toLocaleString("id-ID")} kategori berhasil dipulihkan.`,
      };
    }

    for (const id of targetIds) {
      await CategoryService.permanentDeleteCategory(id);
      processed += 1;
    }

    revalidatePath("/admin/categories");

    return {
      success: true,
      processed,
      message: `${processed.toLocaleString("id-ID")} kategori berhasil dihapus permanen.`,
    };
  } catch (error) {
    console.error("Bulk category action failed:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Aksi massal kategori gagal dilakukan.",
    };
  }
}
