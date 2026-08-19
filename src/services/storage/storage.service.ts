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
 * Service untuk menyimpan dan menghapus file upload.
 *
 * Storage:
 *
 * - public/uploads/products
 * - public/uploads/settings
 *
 * Public URL:
 *
 * - /uploads/products/{filename}
 * - /uploads/settings/{filename}
 *
 * ============================================================
 */

/**
 * ============================================================
 * PROJECT ROOT
 * ============================================================
 *
 * process.cwd() digunakan sebagai project root saat runtime.
 *
 * Komentar turbopackIgnore diperlukan agar operasi filesystem
 * runtime tidak menyebabkan Turbopack melakukan tracing seluruh
 * project saat production build.
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
 * STORAGE SERVICE
 * ============================================================
 */

export class StorageService {
  /**
   * ==========================================================
   * SAVE PRODUCT FILE
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
   */

  private static async saveToDirectory(
    file: File,
    directory: string,
    publicPath: string
  ): Promise<string> {
    await mkdir(
      directory,
      {
        recursive: true,
      }
    );

    const extension =
      path.extname(
        file.name
      ).toLowerCase() || ".jpg";

    const filename =
      `${randomUUID()}${extension}`;

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    const filepath =
      path.join(
        directory,
        filename
      );

    await writeFile(
      filepath,
      buffer
    );

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
   */

  private static async deleteFromDirectory(
    filePath: string,
    allowedPrefix: string,
    directory: string
  ): Promise<void> {
    try {
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

      if (
        !normalizedPath.startsWith(
          allowedPrefix
        )
      ) {
        return;
      }

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

      const filepath =
        path.join(
          directory,
          filename
        );

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

export default StorageService;