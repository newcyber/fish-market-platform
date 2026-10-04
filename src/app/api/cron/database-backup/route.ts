import { NextResponse } from "next/server";

import databaseBackupService, {
  type DatabaseBackupType,
} from "@/services/database-backup/database-backup.service";

function parseType(
  value: string | null,
): DatabaseBackupType {
  if (
    value === "DAILY" ||
    value === "WEEKLY" ||
    value === "MONTHLY" ||
    value === "MANUAL"
  ) {
    return value;
  }

  return "DAILY";
}

function isAuthorized(request: Request) {
  const secret =
    process.env.DATABASE_BACKUP_CRON_SECRET?.trim();

  if (!secret) {
    return false;
  }

  const authorization =
    request.headers.get("authorization");

  const headerSecret =
    authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

  return headerSecret === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const url = new URL(
    request.url,
  );

  const type = parseType(
    url.searchParams.get("type"),
  );

  try {
    const result =
      await databaseBackupService.createBackup(
        type,
        null,
      );

    return NextResponse.json({
      success: true,
      message:
        "Scheduled database backup berhasil.",
      data: result,
    });
  } catch (error) {
    console.error(
      "[CRON_DATABASE_BACKUP]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Scheduled backup gagal.",
      },
      { status: 500 },
    );
  }
}
