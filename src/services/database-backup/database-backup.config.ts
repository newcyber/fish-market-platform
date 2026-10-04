import path from "node:path";

export type DatabaseBackupType =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "MANUAL";

const DEFAULT_BACKUP_DIR =
  process.env.DATABASE_BACKUP_DIR ||
  path.join(process.cwd(), "storage", "database-backups");

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const databaseBackupConfig = {
  directory: DEFAULT_BACKUP_DIR,
  pgDumpPath:
    process.env.DATABASE_BACKUP_PG_DUMP_PATH ||
    "pg_dump",
  pgRestorePath:
    process.env.DATABASE_BACKUP_PG_RESTORE_PATH ||
    "pg_restore",
  retention: {
    daily: positiveInt(
      process.env.DATABASE_BACKUP_RETENTION_DAILY,
      14,
    ),
    weekly: positiveInt(
      process.env.DATABASE_BACKUP_RETENTION_WEEKLY,
      8,
    ),
    monthly: positiveInt(
      process.env.DATABASE_BACKUP_RETENTION_MONTHLY,
      12,
    ),
    manual: positiveInt(
      process.env.DATABASE_BACKUP_RETENTION_MANUAL,
      10,
    ),
  },
  /**
   * Optional shell command used to copy a verified backup to
   * off-site storage (rclone, S3-compatible CLI, rsync to a
   * separate backup host, etc.).
   *
   * The command receives:
   * BACKUP_FILE
   * BACKUP_FILENAME
   * BACKUP_SHA256
   * BACKUP_TYPE
   *
   * Keep this secret/configuration on the server only.
   */
  uploadCommand:
    process.env.DATABASE_BACKUP_UPLOAD_COMMAND?.trim() || "",
  cronSecret:
    process.env.DATABASE_BACKUP_CRON_SECRET?.trim() || "",
  operationLockTtlMs: positiveInt(
    process.env.DATABASE_BACKUP_OPERATION_LOCK_TTL_MS,
    2 * 60 * 60 * 1000,
  ),
} as const;
