import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

import { requireSuperAdmin } from "@/lib/auth/admin";
import databaseBackupService from "@/services/database-backup/database-backup.service";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;

    const info =
      await databaseBackupService.getDownloadInfo(
        id,
      );

    const stream =
      Readable.toWeb(
        createReadStream(info.filePath),
      ) as ReadableStream;

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type":
          "application/octet-stream",
        "Content-Disposition":
          `attachment; filename="${info.filename}"`,
        "Content-Length":
          info.sizeBytes,
        "X-Backup-SHA256":
          info.checksum ?? "",
        "Cache-Control":
          "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (message === "UNAUTHORIZED") {
      return Response.json(
        {
          success: false,
          message: "Anda harus login.",
        },
        { status: 401 },
      );
    }

    if (message === "FORBIDDEN") {
      return Response.json(
        {
          success: false,
          message: "Anda tidak memiliki akses.",
        },
        { status: 403 },
      );
    }

    console.error(
      "[ADMIN_DATABASE_BACKUP_DOWNLOAD]",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          message ||
          "Gagal mengunduh backup.",
      },
      { status: 400 },
    );
  }
}
