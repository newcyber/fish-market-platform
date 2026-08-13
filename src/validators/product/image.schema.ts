import { z } from "zod";

/**
 * Enterprise Image Validator
 */

export const MAX_IMAGE_SIZE =
  5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ProductImageSchema = z
  .instanceof(File, {
    message: "File gambar wajib dipilih.",
  })
  .refine(
    (file) => file.size > 0,
    "File gambar kosong."
  )
  .refine(
    (file) =>
      file.size <= MAX_IMAGE_SIZE,
    "Ukuran gambar maksimal 5 MB."
  )
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      ),
    "Format gambar harus JPG, JPEG, PNG atau WEBP."
  );

export const ProductImagesSchema =
  z
    .array(ProductImageSchema)
    .min(
      1,
      "Minimal upload satu gambar."
    )
    .max(
      10,
      "Maksimal upload 10 gambar."
    );

export type ProductImageInput =
  z.infer<typeof ProductImageSchema>;

export type ProductImagesInput =
  z.infer<typeof ProductImagesSchema>;