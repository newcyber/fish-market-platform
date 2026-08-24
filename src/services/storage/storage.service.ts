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
 * STORAGE SERVICE
 * ============================================================
 *
 * Centralized service untuk:
 *
 * - menyimpan file upload
 * - menghapus file upload
 * - menghasilkan public URL
 *
 * Storage:
 *
 * public/uploads/products
 * public/uploads/settings
 * public/uploads/settings/qris
 *
 * Public URL:
 *
 * /uploads/products/{filename}
 * /uploads/settings/{filename}
 * /uploads/settings/qris/{filename}
 *
 * ============================================================
 */

/**
 * ============================================================
 * PROJECT ROOT
 * ============================================================
 *
 * process.cwd() digunakan sebagai project root
 * ketika aplikasi berjalan.
 *
 * Komentar turbopackIgnore digunakan agar operasi
 * filesystem tidak menyebabkan Turbopack melakukan
 * tracing seluruh project secara tidak sengaja.
 *
 * ============================================================
 */

const PROJECT_ROOT =
  process.cwd(
    /* turbopackIgnore: true */
  );

/**
 * ============================================================
 * UPLOAD DIRECTORIES
 * ============================================================
 */

const QRIS_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings",
    "qris"
  );

const PRODUCT_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "products"
  );

const SETTINGS_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings"
  );

/**
 * ============================================================
 * ALLOWED IMAGE MIME TYPES
 * ============================================================
 *
 * Extension file tidak boleh dipercaya sepenuhnya.
 *
 * MIME type sudah divalidasi oleh API sebelum file
 * sampai ke service ini.
 *
 * Service tetap memiliki whitelist sebagai lapisan
 * keamanan tambahan.
 *
 * ============================================================
 */

const MIME_TO_EXTENSION:
  Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };

/**
 * ============================================================
 * STORAGE SERVICE
 * ============================================================
 */

export class StorageService {
  /**
   * ==========================================================
   * SAVE PAYMENT QRIS
   * ==========================================================
   *
   * Storage:
   *
   * public/uploads/settings/qris
   *
   * Public URL:
   *
   * /uploads/settings/qris/{filename}
   *
   * ==========================================================
   */

  static async savePaymentQris(
    file: File
  ): Promise<string> {
    return this.saveToDirectory(
      file,
      QRIS_UPLOAD_DIRECTORY,
      "/uploads/settings/qris"
    );
  }

  /**
   * ==========================================================
   * SAVE PRODUCT FILE
   * ==========================================================
   *
   * Storage:
   *
   * public/uploads/products
   *
   * Public URL:
   *
   * /uploads/products/{filename}
   *
   * ==========================================================
   */

  static async save(
    file: File
  ): Promise<string> {
    return this.saveToDirectory(
      file,
      PRODUCT_UPLOAD_DIRECTORY,
      "/uploads/products"
    );
  }

  /**
   * ==========================================================
   * SAVE SETTINGS LOGO
   * ==========================================================
   *
   * Storage:
   *
   * public/uploads/settings
   *
   * Public URL:
   *
   * /uploads/settings/{filename}
   *
   * ==========================================================
   */

  static async saveSettingsLogo(
    file: File
  ): Promise<string> {
    return this.saveToDirectory(
      file,
      SETTINGS_UPLOAD_DIRECTORY,
      "/uploads/settings"
    );
  }

  /**
   * ==========================================================
   * INTERNAL SAVE HELPER
   * ==========================================================
   *
   * Semua upload melewati method ini.
   *
   * ==========================================================
   */

  private static async saveToDirectory(
    file: File,
    directory: string,
    publicPath: string
  ): Promise<string> {
    /**
     * ========================================================
     * BASIC FILE VALIDATION
     * ========================================================
     */

    if (
      !(file instanceof File)
    ) {
      throw new Error(
        "File upload tidak valid."
      );
    }

    if (file.size <= 0) {
      throw new Error(
        "File upload kosong."
      );
    }

    /**
     * ========================================================
     * MIME TYPE VALIDATION
     * ========================================================
     *
     * Hanya image yang didukung.
     *
     */

    const extension =
      MIME_TO_EXTENSION[
        file.type
      ];

    if (!extension) {
      throw new Error(
        "Format file tidak didukung."
      );
    }

    /**
     * ========================================================
     * ENSURE DIRECTORY
     * ========================================================
     */

    await mkdir(
      directory,
      {
        recursive: true,
      }
    );

    /**
     * ========================================================
     * GENERATE UNIQUE FILE NAME
     * ========================================================
     *
     * Jangan menggunakan nama file asli sebagai nama
     * file di server.
     *
     * randomUUID() mencegah:
     *
     * - filename collision
     * - karakter aneh
     * - path traversal melalui filename
     *
     */

    const filename =
      `${randomUUID()}${extension}`;

    /**
     * ========================================================
     * READ FILE
     * ========================================================
     */

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /**
     * ========================================================
     * BUILD FILE PATH
     * ========================================================
     */

    const filepath =
      path.join(
        directory,
        filename
      );

    /**
     * ========================================================
     * WRITE FILE
     * ========================================================
     */

    await writeFile(
      filepath,
      buffer
    );

    /**
     * ========================================================
     * RETURN PUBLIC URL
     * ========================================================
     */

    return `${publicPath}/${filename}`;
  }

  /**
   * ==========================================================
   * DELETE PRODUCT FILE
   * ==========================================================
   */

  static async delete(
    imagePath: string
  ): Promise<void> {
    await this.deleteFromDirectory(
      imagePath,
      "uploads/products/",
      PRODUCT_UPLOAD_DIRECTORY
    );
  }

  /**
   * ==========================================================
   * DELETE PAYMENT QRIS
   * ==========================================================
   *
   * Digunakan ketika file QRIS lama perlu dihapus.
   *
   * ==========================================================
   */

  static async deletePaymentQris(
    imagePath: string
  ): Promise<void> {
    await this.deleteFromDirectory(
      imagePath,
      "uploads/settings/qris/",
      QRIS_UPLOAD_DIRECTORY
    );
  }

  /**
   * ==========================================================
   * DELETE SETTINGS LOGO
   * ==========================================================
   */

  static async deleteSettingsLogo(
    imagePath: string
  ): Promise<void> {
    await this.deleteFromDirectory(
      imagePath,
      "uploads/settings/",
      SETTINGS_UPLOAD_DIRECTORY
    );
  }

  /**
   * ==========================================================
   * INTERNAL DELETE HELPER
   * ==========================================================
   *
   * Security:
   *
   * Method ini hanya mengizinkan file yang berada
   * di dalam prefix directory yang sudah ditentukan.
   *
   * path.basename() memastikan kita tidak menerima
   * path traversal seperti:
   *
   * ../../some-file
   *
   * ==========================================================
   */

  private static async deleteFromDirectory(
    filePath: string,
    allowedPrefix: string,
    directory: string
  ): Promise<void> {
    try {
      /**
       * ======================================================
       * NORMALIZE PATH
       * ======================================================
       */

      const normalizedPath =
        filePath
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
       * PREFIX VALIDATION
       * ======================================================
       */

      if (
        !normalizedPath.startsWith(
          allowedPrefix
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

      if (
        !filename ||
        filename === "." ||
        filename === ".."
      ) {
        return;
      }

      /**
       * ======================================================
       * BUILD FILEPATH
       * ======================================================
       */

      const filepath =
        path.join(
          directory,
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
       * ======================================================
       * IGNORE MISSING FILE
       * ======================================================
       *
       * File mungkin sudah tidak tersedia.
       *
       * Jangan menggagalkan proses utama hanya karena
       * file fisik sudah dihapus sebelumnya.
       *
       * ======================================================
       */
    }
  }

  /**
   * ==========================================================
   * GET FILENAME
   * ==========================================================
   */

  static filename(
    filePath: string
  ): string {
    return path.basename(
      filePath
    );
  }

  /**
   * ==========================================================
   * GENERATE PUBLIC URL
   * ==========================================================
   */

  static url(
    filePath: string
  ): string {
    return filePath;
  }
}

/**
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default StorageService;