import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export class StorageService {
  /**
   * Direktori upload produk.
   *
   * Dibuat secara statis agar Turbopack tidak melakukan
   * tracing ke seluruh project.
   */
  private static readonly UPLOAD_DIRECTORY =
    path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

  /**
   * Simpan file produk.
   */
  static async save(
    file: File
  ): Promise<string> {
    await mkdir(
      this.UPLOAD_DIRECTORY,
      {
        recursive: true,
      }
    );

    const extension =
      path.extname(file.name) || ".jpg";

    const filename =
      `${randomUUID()}${extension}`;

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const filepath = path.join(
      this.UPLOAD_DIRECTORY,
      filename
    );

    await writeFile(
      filepath,
      buffer
    );

    return `/uploads/products/${filename}`;
  }

  /**
   * Hapus file produk.
   */
  static async delete(
    imagePath: string
  ): Promise<void> {
    try {
      /**
       * Hanya izinkan file dari folder
       * /uploads/products/
       */
      const normalizedPath =
        imagePath
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");

      if (
        !normalizedPath.startsWith(
          "uploads/products/"
        )
      ) {
        return;
      }

      const filename =
        path.basename(normalizedPath);

      if (
        !filename ||
        filename === "." ||
        filename === ".."
      ) {
        return;
      }

      const filepath = path.join(
        this.UPLOAD_DIRECTORY,
        filename
      );

      await unlink(filepath);
    } catch {
      /**
       * File mungkin sudah tidak ada.
       * Tidak perlu menghentikan proses.
       */
    }
  }

  /**
   * Ambil nama file dari path.
   */
  static filename(
    imagePath: string
  ): string {
    return path.basename(
      imagePath
    );
  }

  /**
   * Menghasilkan URL public file.
   */
  static url(
    imagePath: string
  ): string {
    return imagePath;
  }
}

export default StorageService;