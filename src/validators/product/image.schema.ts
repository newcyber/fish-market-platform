import { z } from "zod";

/**
 * Enterprise Product Media Validator
 *
 * Existing image upload contract tetap dipertahankan.
 * Video menggunakan endpoint upload terpisah agar tidak
 * terikat batas body Server Action.
 */

export const MAX_IMAGE_SIZE =
  5 * 1024 * 1024; // 5 MB

export const MAX_VIDEO_SIZE =
  50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
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

export const ProductVideoSchema = z
  .instanceof(File, {
    message: "File video wajib dipilih.",
  })
  .refine(
    (file) => file.size > 0,
    "File video kosong."
  )
  .refine(
    (file) =>
      file.size <= MAX_VIDEO_SIZE,
    "Ukuran video maksimal 50 MB."
  )
  .refine(
    (file) =>
      ALLOWED_VIDEO_TYPES.includes(
        file.type as (typeof ALLOWED_VIDEO_TYPES)[number]
      ),
    "Format video harus MP4 atau WebM."
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

export const ProductVideosSchema =
  z
    .array(ProductVideoSchema)
    .min(
      1,
      "Minimal upload satu video."
    )
    .max(
      5,
      "Maksimal upload 5 video."
    );

export type ProductImageInput =
  z.infer<typeof ProductImageSchema>;

export type ProductImagesInput =
  z.infer<typeof ProductImagesSchema>;

export type ProductVideoInput =
  z.infer<typeof ProductVideoSchema>;

export type ProductVideosInput =
  z.infer<typeof ProductVideosSchema>;
