import {
  mkdir,
  writeFile,
  unlink,
} from "fs/promises";

import path from "path";

import {
  randomUUID,
} from "crypto";

/**
 * ============================================================
 *
 * STORAGE SERVICE
 *
 * ============================================================
 *
 * Service untuk menyimpan dan menghapus file upload produk.
 *
 * Storage:
 *
 * public/uploads/products
 *
 * File URL:
 *
 * /uploads/products/{filename}
 *
 * ============================================================
 */

/**
 * ============================================================
 * STATIC UPLOAD DIRECTORY
 * ============================================================
 *
 * Turbopack dapat memberikan warning apabila filesystem path
 * terlihat terlalu dinamis saat proses output tracing.
 *
 * Ignore comment ini memberi tahu Turbopack agar process.cwd()
 * tidak dianggap sebagai dynamic project-wide dependency.
 */

const UPLOAD_DIRECTORY =
  path.join(
    /* turbopackIgnore: true */
    process.cwd(),
    "public",
    "uploads",
    "products"
  );

export class StorageService {
  /**
   * ==========================================================
   * SIMPAN FILE PRODUK
   * ==========================================================
   */

  static async save(
    file: File
  ): Promise<string> {
    /**
     * Pastikan folder upload tersedia.
     */

    await mkdir(
      UPLOAD_DIRECTORY,
      {
        recursive: true,
      }
    );

    /**
     * Ambil extension file.
     */

    const extension =
      path.extname(
        file.name
      ) || ".jpg";

    /**
     * Generate nama file unik.
     */

    const filename =
      `${randomUUID()}${extension}`;

    /**
     * Convert File menjadi Buffer.
     */

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /**
     * Generate absolute file path.
     */

    const filepath =
      path.join(
        UPLOAD_DIRECTORY,
        filename
      );

    /**
     * Simpan file.
     */

    await writeFile(
      filepath,
      buffer
    );

    /**
     * Return public URL.
     */

    return `/uploads/products/${filename}`;
  }

  /**
   * ==========================================================
   * HAPUS FILE PRODUK
   * ==========================================================
   */

  static async delete(
    imagePath: string
  ): Promise<void> {
    try {
      /**
       * ======================================================
       * NORMALIZE PATH
       * ======================================================
       */

      const normalizedPath =
        imagePath
          .replace(
            /\\/g,
            "/"
          )
          .replace(
            /^\/+/,
            ""
          );

      /**
       * ======================================================
       * SECURITY CHECK
       * ======================================================
       *
       * Hanya izinkan file dari:
       *
       * uploads/products/
       */

      if (
        !normalizedPath.startsWith(
          "uploads/products/"
        )
      ) {
        return;
      }

      /**
       * ======================================================
       * GET SAFE FILENAME
       * ======================================================
       */

      const filename =
        path.basename(
          normalizedPath
        );

      /**
       * Hindari path traversal.
       */

      if (
        !filename ||
        filename === "." ||
        filename === ".."
      ) {
        return;
      }

      /**
       * ======================================================
       * BUILD FILE PATH
       * ======================================================
       */

      const filepath =
        path.join(
          UPLOAD_DIRECTORY,
          filename
        );

      /**
       * ======================================================
       * DELETE FILE
       * ======================================================
       */

      await unlink(
        filepath
      );
    } catch {
      /**
       * File mungkin sudah tidak tersedia.
       *
       * Jangan menghentikan proses utama hanya karena
       * file fisik sudah dihapus sebelumnya.
       */
    }
  }

  /**
   * ==========================================================
   * AMBIL NAMA FILE
   * ==========================================================
   */

  static filename(
    imagePath: string
  ): string {
    return path.basename(
      imagePath
    );
  }

  /**
   * ==========================================================
   * GENERATE PUBLIC URL
   * ==========================================================
   */

  static url(
    imagePath: string
  ): string {
    return imagePath;
  }
}

export default StorageService;