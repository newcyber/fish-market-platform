import { NextResponse } from "next/server";

import {
  requireAdmin,
  requireSuperAdmin,
} from "@/lib/auth/admin";
import databaseBackupService, {
  type DatabaseBackupType,
} from "@/services/database-backup/database-backup.service";

function authError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      {
        success: false,
        message: "Anda harus login.",
      },
      { status: 401 },
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        success: false,
        message: "Anda tidak memiliki akses.",
      },
      { status: 403 },
    );
  }

  return null;
}

function serializeForJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) =>
      typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue,
    ),
  ) as T;
}

function parseType(value: unknown): DatabaseBackupType {
  if (
    value === "DAILY" ||
    value === "WEEKLY" ||
    value === "MONTHLY" ||
    value === "MANUAL"
  ) {
    return value;
  }

  return "MANUAL";
}

export async function GET() {
  try {
    await requireAdmin();

    const [
      backups,
      health,
      audits,
    ] = await Promise.all([
      databaseBackupService.listBackups(50),
      databaseBackupService.getHealth(),
      databaseBackupService.listAuditEvents(30),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        backups: serializeForJson(backups),
        health: serializeForJson(health),
        audits: serializeForJson(audits),
      },
    });
  } catch (error) {
    const response =
      authError(error);

    if (response) return response;

    console.error(
      "[ADMIN_DATABASE_BACKUPS_GET]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data backup database.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session =
      await requireSuperAdmin();

    const body =
      (await request.json().catch(
        () => ({}),
      )) as {
        type?: unknown;
      };

    const result =
      await databaseBackupService.createBackup(
        parseType(body.type),
        session.user.id,
      );

    return NextResponse.json({
      success: true,
      message:
        "Backup database berhasil dibuat dan diverifikasi.",
      data: serializeForJson(result),
    });
  } catch (error) {
    const response =
      authError(error);

    if (response) return response;

    console.error(
      "[ADMIN_DATABASE_BACKUPS_POST]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal membuat backup database.",
      },
      { status: 500 },
    );
  }
}
