"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import CategoryService from "@/services/category/category.service";

import {
  createCategorySchema,
} from "@/validators/categories/create-category.validator";

export async function createCategoryAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed =
    createCategorySchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description:
        formData.get("description"),
      image: formData.get("image"),
      sortOrder:
        formData.get("sortOrder"),
      isActive:
        formData.get("isActive"),
    });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal.",
      errors:
        parsed.error.flatten()
          .fieldErrors,
    };
  }

  try {
    await CategoryService.createCategory(
      parsed.data,
    );
  } catch (error) {
    console.error(
      "Create category failed:",
      error,
    );

    /*
     * Duplicate slug.
     *
     * Database menggunakan UNIQUE constraint
     * pada field slug. Service sudah melakukan
     * pengecekan terlebih dahulu, tetapi
     * pengecekan database tetap diperlukan
     * sebagai safety net terhadap race condition.
     */
    if (
      isUniqueConstraintError(error)
    ) {
      return {
        success: false,
        message:
          "Slug kategori sudah digunakan. Silakan gunakan slug yang berbeda.",
        errors: {
          slug: [
            "Slug kategori sudah digunakan. Silakan gunakan slug yang berbeda.",
          ],
        },
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat kategori.",
    };
  }

  revalidatePath(
    "/admin/categories",
  );

  /*
   * Jangan letakkan redirect()
   * di dalam try/catch.
   *
   * Next.js menggunakan redirect
   * sebagai control-flow signal.
   */
  redirect("/admin/categories");
}

/**
 * Prisma unique constraint error.
 *
 * Tidak perlu mengimpor Prisma hanya untuk
 * melakukan pengecekan ini sehingga action
 * tetap kompatibel dengan struktur project
 * saat ini.
 */
function isUniqueConstraintError(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const candidate =
    error as {
      code?: unknown;
      meta?: {
        target?: unknown;
      };
    };

  if (candidate.code !== "P2002") {
    return false;
  }

  const target =
    candidate.meta?.target;

  if (Array.isArray(target)) {
    return target.includes("slug");
  }

  if (typeof target === "string") {
    return target
      .toLowerCase()
      .includes("slug");
  }

  /*
   * Kalau Prisma tidak mengirim metadata
   * target, P2002 tetap dianggap sebagai
   * unique constraint.
   */
  return true;
}