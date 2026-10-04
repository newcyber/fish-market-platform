import { requireSuperAdmin } from "@/lib/auth/admin";
import databaseBackupService from "@/services/database-backup/database-backup.service";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const session =
      await requireSuperAdmin();

    const body =
      (await request.json().catch(
        () => ({}),
      )) as {
        confirmation?: unknown;
      };

    if (body.confirmation !== "RESTORE") {
      return Response.json(
        {
          success: false,
          message:
            'Konfirmasi restore tidak valid. Ketik "RESTORE" untuk melanjutkan.',
        },
        { status: 400 },
      );
    }

    const { id } = await context.params;

    const result =
      await databaseBackupService.restoreBackup(
        id,
        session.user.id,
      );

    const message =
      result.safetyBackupMetadataPersisted
        ? "Database berhasil direstore. Safety backup otomatis juga telah dibuat."
        : "Database berhasil direstore. Safety backup otomatis telah dibuat, tetapi metadata safety backup tidak dapat disimpan kembali ke database. File safety backup tetap tersedia di storage server.";

    return Response.json({
      success: true,
      message,
      data: result,
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
      "[ADMIN_DATABASE_BACKUP_RESTORE]",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          message ||
          "Gagal merestore database.",
      },
      { status: 400 },
    );
  }
}
