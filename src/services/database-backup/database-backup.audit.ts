import {
  appendFileSync,
  mkdirSync,
} from "node:fs";
import path from "node:path";

import { databaseBackupConfig } from "./database-backup.config";

export type DatabaseBackupAuditEvent =
  | "BACKUP_STARTED"
  | "BACKUP_SUCCESS"
  | "BACKUP_FAILED"
  | "RESTORE_STARTED"
  | "RESTORE_SUCCESS"
  | "RESTORE_FAILED";

export interface DatabaseBackupAuditEntry {
  event: DatabaseBackupAuditEvent;
  operationId: string;
  timestamp: string;
  actorId: string | null;
  backupId: string | null;
  filename: string | null;
  checksum: string | null;
  safetyBackupFilename: string | null;
  message: string | null;
}

const AUDIT_FILENAME = "operations.jsonl";

export function appendDatabaseBackupAudit(
  entry: DatabaseBackupAuditEntry,
) {
  try {
    mkdirSync(
      databaseBackupConfig.directory,
      { recursive: true },
    );

    appendFileSync(
      path.join(
        databaseBackupConfig.directory,
        AUDIT_FILENAME,
      ),
      `${JSON.stringify(entry)}\n`,
      "utf8",
    );
  } catch (error) {
    console.error(
      "[DATABASE_BACKUP_AUDIT_WRITE]",
      error,
    );
  }
}
