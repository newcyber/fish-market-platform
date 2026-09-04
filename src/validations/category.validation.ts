import { z } from "zod";

/**
 * ============================================================
 * CATEGORY VALIDATION
 * ============================================================
 */

export const categorySchema =
  z.object({
    name:
      z
        .string()
        .trim()
        .min(
          1,
          "Nama kategori wajib diisi."
        )
        .max(
          100,
          "Nama kategori maksimal 100 karakter."
        ),

    slug:
      z
        .string()
        .trim()
        .min(
          1,
          "Slug kategori wajib diisi."
        )
        .max(
          120,
          "Slug kategori maksimal 120 karakter."
        )
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug hanya boleh menggunakan huruf kecil, angka, dan tanda hubung."
        ),

    description:
      z
        .string()
        .trim()
        .max(
          1000,
          "Deskripsi kategori maksimal 1000 karakter."
        )
        .optional(),

    image:
      z
    .string()
    .trim()
    .optional()
    .nullable(),

    sortOrder:
      z
        .number({
          message:
            "Urutan kategori tidak valid.",
        })
        .int(
          "Urutan kategori harus berupa angka bulat."
        )
        .min(
          0,
          "Urutan kategori tidak boleh kurang dari 0."
        ),

    isActive:
      z.boolean(),
  });

/**
 * ============================================================
 * CATEGORY INPUT TYPE
 * ============================================================
 */

export type CategoryInput =
  z.infer<
    typeof categorySchema
  >;
