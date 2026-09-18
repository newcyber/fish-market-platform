import {
  mkdir,
  writeFile,
  unlink,
} from "fs/promises";

import path from "path";

import { createHash, randomUUID } from "node:crypto";

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
 * public/uploads/rewards
 * public/uploads/settings
 * public/uploads/settings/qris
 *
 * Public URL:
 *
 * /uploads/products/{filename}
 * /uploads/rewards/{filename}
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

const REWARD_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "rewards"
  );

const CATEGORY_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "categories"
  );

const SETTINGS_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings"
  );

const LANDING_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings",
    "landing"
  );

  const LANDING_ANDROID_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings",
    "landing",
    "android",
  );

const LOGIN_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings",
    "login"
  );

const PROMO_UPLOAD_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "settings",
    "promo"
  );

  const PROMO_POPUP_UPLOAD_DIRECTORY =
  path.join(
    process.cwd(),
    "public",
    "uploads",
    "settings",
    "promo-popup"
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
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };

/**
 * ============================================================
 * STORAGE SERVICE
 * ============================================================
 */

export class StorageService {

  static async saveLandingAndroidApk(
  file: File,
): Promise<{
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
}> {
  if (!(file instanceof File)) {
    throw new Error("File APK tidak valid.");
  }

  const originalFileName = file.name?.trim() ?? "";

  if (
    !originalFileName ||
    !originalFileName.toLowerCase().endsWith(".apk")
  ) {
    throw new Error(
      "File harus menggunakan ekstensi .apk.",
    );
  }

  const mimeType =
    file.type?.trim().toLowerCase() || "";

  const allowedMimeTypes = new Set([
    "",
    "application/vnd.android.package-archive",
    "application/octet-stream",
    "application/x-apk",
  ]);

  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error(
      "Format MIME file APK tidak didukung.",
    );
  }

  const MAX_APK_SIZE =
    100 * 1024 * 1024;

  if (file.size <= 0) {
    throw new Error("File APK kosong.");
  }

  if (file.size > MAX_APK_SIZE) {
    throw new Error(
      "Ukuran APK maksimal 100 MB.",
    );
  }

  const buffer = Buffer.from(
    await file.arrayBuffer(),
  );

  if (!buffer.length) {
    throw new Error("File APK kosong.");
  }

  /*
   * APK pada dasarnya adalah ZIP archive.
   * Validasi signature dasar untuk mencegah file
   * non-ZIP yang hanya diganti ekstensi menjadi .apk.
   */
  const isZip =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (
      (
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      ) ||
      (
        buffer[2] === 0x05 &&
        buffer[3] === 0x06
      ) ||
      (
        buffer[2] === 0x07 &&
        buffer[3] === 0x08
      )
    );

  if (!isZip) {
    throw new Error(
      "File tidak terlihat seperti APK/ZIP yang valid.",
    );
  }

  await mkdir(
    LANDING_ANDROID_UPLOAD_DIRECTORY,
    {
      recursive: true,
    },
  );

  const generatedFileName =
    `${randomUUID()}.apk`;

  const filepath = path.join(
    LANDING_ANDROID_UPLOAD_DIRECTORY,
    generatedFileName,
  );

  await writeFile(filepath, buffer);

  const sha256 =
    createHash("sha256")
      .update(buffer)
      .digest("hex");

  return {
    fileName: originalFileName,
    fileUrl:
      `/uploads/settings/landing/android/${generatedFileName}`,
    mimeType:
      mimeType ||
      "application/vnd.android.package-archive",
    fileSize: buffer.length,
    sha256,
  };
}

static async deleteLandingAndroidApk(
  fileUrl: string | null,
): Promise<void> {
  if (!fileUrl) {
    return;
  }

  await this.deleteFromDirectory(
    fileUrl,
    "uploads/settings/landing/android/",
    LANDING_ANDROID_UPLOAD_DIRECTORY,
  );
}

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
   * SAVE REWARD IMAGE
   * ==========================================================
   *
   * Storage:
   *
   * public/uploads/rewards
   *
   * Public URL:
   *
   * /uploads/rewards/{filename}
   *
   * ==========================================================
   */

  static async saveRewardImage(
    file: File
  ): Promise<string> {
    return this.saveToDirectory(
      file,
      REWARD_UPLOAD_DIRECTORY,
      "/uploads/rewards"
    );
  }

  /**
 * ==========================================================
 * SAVE CATEGORY IMAGE
 * ==========================================================
 *
 * Storage:
 *
 * public/uploads/categories
 *
 * Public URL:
 *
 * /uploads/categories/{filename}
 *
 * ==========================================================
 */

static async saveCategoryImage(
  file: File
): Promise<string> {
  return this.saveToDirectory(
    file,
    CATEGORY_UPLOAD_DIRECTORY,
    "/uploads/categories"
  );
}

/**
 * ==========================================================
 * DELETE CATEGORY IMAGE
 * ==========================================================
 */

static async deleteCategoryImage(
  imagePath: string
): Promise<void> {
  await this.deleteFromDirectory(
    imagePath,
    "uploads/categories/",
    CATEGORY_UPLOAD_DIRECTORY
  );
}

  /**
   * ==========================================================
   * DELETE REWARD IMAGE
   * ==========================================================
   */

  static async deleteRewardImage(
    imagePath: string
  ): Promise<void> {
    await this.deleteFromDirectory(
      imagePath,
      "uploads/rewards/",
      REWARD_UPLOAD_DIRECTORY
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

  static async saveLandingImage(
  file: File
): Promise<string> {
  return this.saveToDirectory(
    file,
    LANDING_UPLOAD_DIRECTORY,
    "/uploads/settings/landing"
  );
}

static async deleteLandingImage(
  imagePath: string
): Promise<void> {
  await this.deleteFromDirectory(
    imagePath,
    "uploads/settings/landing/",
    LANDING_UPLOAD_DIRECTORY
  );
}

  /**
 * ==========================================================
 * SAVE LOGIN SLIDER IMAGE
 * ==========================================================
 *
 * Storage:
 *
 * public/uploads/settings/login
 *
 * Public URL:
 *
 * /uploads/settings/login/{filename}
 *
 * ==========================================================
 */

static async saveLoginImage(
  file: File
): Promise<string> {
  return this.saveToDirectory(
    file,
    LOGIN_UPLOAD_DIRECTORY,
    "/uploads/settings/login"
  );
}

/**
 * ==========================================================
 * SAVE PROMO IMAGE
 * ==========================================================
 *
 * Storage:
 *
 * public/uploads/settings/promo
 *
 * Public URL:
 *
 * /uploads/settings/promo/{filename}
 *
 * Digunakan untuk gambar Promo Pilihan pada homepage.
 *
 * ==========================================================
 */

static async savePromoImage(
  file: File
): Promise<string> {
  return this.saveToDirectory(
    file,
    PROMO_UPLOAD_DIRECTORY,
    "/uploads/settings/promo"
  );
}

  /**
   * ==========================================================
   * SAVE PROMO POPUP IMAGE
   * ==========================================================
   *
   * Storage:
   *
   * public/uploads/settings/promo-popup
   *
   * Public URL:
   *
   * /uploads/settings/promo-popup/{filename}
   *
   * ==========================================================
   */

  static async savePromoPopupImage(
    file: File
  ): Promise<string> {
    return this.saveToDirectory(
      file,
      PROMO_POPUP_UPLOAD_DIRECTORY,
      "/uploads/settings/promo-popup"
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
