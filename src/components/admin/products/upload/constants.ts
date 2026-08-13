/**
 * ============================================================================
 * Enterprise Product Upload Constants
 * ============================================================================
 */

export const DEFAULT_UPLOAD_ENDPOINT =
  "/api/products/upload";

/**
 * Maksimum ukuran file:
 * 5 MB
 */
export const DEFAULT_MAX_FILE_SIZE =
  5 * 1024 * 1024;

/**
 * Maksimum jumlah file dalam satu upload.
 */
export const DEFAULT_MAX_FILES = 20;

/**
 * MIME type yang diperbolehkan.
 */
export const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Attribute accept untuk input[type=file].
 */
export const DEFAULT_ACCEPT_ATTRIBUTE =
  DEFAULT_ACCEPTED_TYPES.join(",");

/**
 * Pesan error bawaan.
 */
export const UPLOAD_MESSAGES = {
  EMPTY:
    "Pilih minimal satu gambar.",

  INVALID_TYPE:
    "Format gambar tidak didukung.",

  FILE_TOO_LARGE:
    "Ukuran gambar melebihi batas maksimum 5 MB.",

  TOO_MANY_FILES:
    "Jumlah gambar melebihi batas maksimum.",

  NETWORK_ERROR:
    "Tidak dapat terhubung ke server.",

  UNKNOWN_ERROR:
    "Terjadi kesalahan saat upload.",

  SUCCESS:
    "Upload gambar berhasil.",
} as const;

/**
 * Status upload.
 */
export const UPLOAD_STATUS = {
  IDLE: "idle",

  WAITING: "waiting",

  UPLOADING: "uploading",

  SUCCESS: "success",

  ERROR: "error",
} as const;

/**
 * Nilai progress.
 */
export const UPLOAD_PROGRESS = {
  MIN: 0,

  MAX: 100,
} as const;