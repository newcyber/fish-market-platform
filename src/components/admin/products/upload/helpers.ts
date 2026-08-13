import type { PreviewImage } from "./types";

/**
 * Membuat PreviewImage dari File[]
 */
export function createPreviewFiles(
  files: File[]
): PreviewImage[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),

    file,

    url: URL.createObjectURL(file),

    progress: 0,

    uploaded: false,

    uploading: false,

    error: undefined,
  }));
}

/**
 * Menggabungkan preview lama dengan preview baru.
 */
export function appendPreviewFiles(
  current: PreviewImage[],
  files: File[]
): PreviewImage[] {
  return [
    ...current,
    ...createPreviewFiles(files),
  ];
}

/**
 * Menghapus seluruh Object URL.
 */
export function revokePreviewUrls(
  previews: PreviewImage[]
): void {
  previews.forEach((preview) => {
    URL.revokeObjectURL(preview.url);
  });
}

/**
 * Menghapus satu Object URL.
 */
export function revokePreviewUrl(
  preview: PreviewImage
): void {
  URL.revokeObjectURL(preview.url);
}

/**
 * Mengubah ukuran file menjadi format yang mudah dibaca.
 */
export function formatFileSize(
  bytes: number
): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const exponent = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    bytes /
    Math.pow(
      1024,
      exponent
    );

  return `${value.toFixed(2)} ${
    units[exponent]
  }`;
}

/**
 * Menghitung progress upload.
 */
export function calculateProgress(
  loaded: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (loaded / total) *
          100
      )
    )
  );
}

/**
 * Memperbarui progress seluruh preview.
 * Digunakan pada upload batch
 * menggunakan XMLHttpRequest.
 */
export function updatePreviewProgress(
  previews: PreviewImage[],
  progress: number
): PreviewImage[] {
  return previews.map((preview) => ({
    ...preview,

    progress,

    uploading:
      progress > 0 &&
      progress < 100,

    uploaded:
      progress >= 100,

    error: undefined,
  }));
}

/**
 * Menandai upload berhasil.
 */
export function markUploadSuccess(
  previews: PreviewImage[]
): PreviewImage[] {
  return previews.map((preview) => ({
    ...preview,

    progress: 100,

    uploading: false,

    uploaded: true,

    error: undefined,
  }));
}

/**
 * Menandai upload gagal.
 */
export function markUploadFailed(
  previews: PreviewImage[],
  message: string
): PreviewImage[] {
  return previews.map((preview) => ({
    ...preview,

    uploading: false,

    uploaded: false,

    error: message,
  }));
}

/**
 * Menghapus satu preview berdasarkan id.
 */
export function removePreview(
  previews: PreviewImage[],
  id: string
): PreviewImage[] {
  const preview =
    previews.find(
      (item) =>
        item.id === id
    );

  if (preview) {
    revokePreviewUrl(preview);
  }

  return previews.filter(
    (item) => item.id !== id
  );
}