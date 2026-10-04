import {
  createHash,
  randomUUID,
} from "node:crypto";
import {
  createReadStream,
  existsSync,
  readFileSync,
  mkdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { prisma } from "@/lib/prisma";
import {
  databaseBackupConfig,
  type DatabaseBackupType,
} from "./database-backup.config";

export type { DatabaseBackupType } from "./database-backup.config";
import databaseBackupRepository from "@/repositories/database-backup/database-backup.repository";
import {
  appendDatabaseBackupAudit,
} from "./database-backup.audit";
import {
  acquireOperationLock,
  getOperationLockStatus,
} from "./database-backup.lock";

const execFileAsync = promisify(execFile);

function assertServerEnvironment() {
  if (typeof window !== "undefined") {
    throw new Error(
      "Database backup hanya dapat dijalankan di server.",
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL belum dikonfigurasi.",
    );
  }
}

function safeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function createFilename(type: DatabaseBackupType) {
  const timestamp = new Date()
    .toISOString()
    .replace(/\.\d{3}Z$/, "")
    .replace(/[:]/g, "-");

  return `pisjo-market_${safeFilenamePart(type.toLowerCase())}_${timestamp}.dump`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const processError = error as Error & {
      stderr?: string;
      stdout?: string;
    };

    const stderr =
      typeof processError.stderr === "string"
        ? processError.stderr.trim()
        : "";

    if (stderr) {
      return `${error.message}: ${stderr}`;
    }

    return error.message;
  }

  return String(error);
}

async function calculateSha256(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function verifyArchive(filePath: string) {
  await execFileAsync(
    databaseBackupConfig.pgRestorePath,
    ["--list", filePath],
    {
      env: process.env,
      maxBuffer: 1024 * 1024 * 8,
    },
  );
}

async function uploadOffsite(
  filePath: string,
  filename: string,
  checksum: string,
  type: DatabaseBackupType,
) {
  const command =
    databaseBackupConfig.uploadCommand;

  if (!command) {
    return {
      configured: false,
      success: true,
    };
  }

  /**
   * The generated filename contains only safe characters.
   * Values are passed through environment variables instead of
   * interpolating them into the command string.
   *
   * Example:
   * DATABASE_BACKUP_UPLOAD_COMMAND="rclone copy \"$BACKUP_FILE\" remote:pisjo/"
   */
  const env = {
    ...process.env,
    BACKUP_FILE: filePath,
    BACKUP_FILENAME: filename,
    BACKUP_SHA256: checksum,
    BACKUP_TYPE: type,
  };

  await execFileAsync(
    process.platform === "win32"
      ? "cmd.exe"
      : "/bin/sh",
    process.platform === "win32"
      ? ["/d", "/s", "/c", command]
      : ["-c", command],
    {
      env,
      maxBuffer: 1024 * 1024 * 8,
    },
  );

  return {
    configured: true,
    success: true,
  };
}

async function ensureDirectory() {
  mkdirSync(
    databaseBackupConfig.directory,
    {
      recursive: true,
    },
  );
}

async function applyRetention() {
  const retentionMap: Array<[
    DatabaseBackupType,
    number,
  ]> = [
    ["DAILY", databaseBackupConfig.retention.daily],
    ["WEEKLY", databaseBackupConfig.retention.weekly],
    ["MONTHLY", databaseBackupConfig.retention.monthly],
    ["MANUAL", databaseBackupConfig.retention.manual],
  ];

  for (const [type, keep] of retentionMap) {
    const expired =
      await databaseBackupRepository.findExpired(
        type,
        keep,
      );

    for (const item of expired) {
      const filePath = path.join(
        databaseBackupConfig.directory,
        item.filename,
      );

      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (error) {
        console.error(
          "[DATABASE_BACKUP_RETENTION_FILE_DELETE]",
          {
            filename: item.filename,
            error,
          },
        );
      }

      try {
        await databaseBackupRepository.deleteById(
          item.id,
        );
      } catch (error) {
        console.error(
          "[DATABASE_BACKUP_RETENTION_DB_DELETE]",
          {
            id: item.id,
            error,
          },
        );
      }
    }
  }
}

export class DatabaseBackupService {
  private async createBackupUnlocked(
    type: DatabaseBackupType = "MANUAL",
    createdById?: string | null,
    operationId = randomUUID(),
  ) {
    assertServerEnvironment();
    await ensureDirectory();

    const filename = createFilename(type);
    const filePath = path.join(
      databaseBackupConfig.directory,
      filename,
    );

    appendDatabaseBackupAudit({
      event: "BACKUP_STARTED",
      operationId,
      timestamp: new Date().toISOString(),
      actorId: createdById ?? null,
      backupId: null,
      filename,
      checksum: null,
      safetyBackupFilename: null,
      message: `Backup ${type.toLowerCase()} dimulai.`,
    });

    const record =
      await databaseBackupRepository.create({
        filename,
        backupType: type,
        createdById,
      });

    try {
      await execFileAsync(
        databaseBackupConfig.pgDumpPath,
        [
          "--format=custom",
          "--no-owner",
          "--no-acl",
          "--file",
          filePath,
          process.env.DATABASE_URL as string,
        ],
        {
          env: process.env,
          maxBuffer: 1024 * 1024 * 8,
        },
      );

      const stat = statSync(filePath);

      if (!stat.isFile() || stat.size <= 0) {
        throw new Error(
          "pg_dump selesai tetapi file backup kosong atau tidak ditemukan.",
        );
      }

      await verifyArchive(filePath);

      const checksum =
        await calculateSha256(filePath);

      const completedAt = new Date();

      await uploadOffsite(
        filePath,
        filename,
        checksum,
        type,
      );

      const result =
        await databaseBackupRepository.markSuccess(
          record.id,
          {
            sizeBytes: BigInt(stat.size),
            checksum,
            storageKey: filename,
            completedAt,
            verifiedAt: completedAt,
          },
        );

      appendDatabaseBackupAudit({
        event: "BACKUP_SUCCESS",
        operationId,
        timestamp: completedAt.toISOString(),
        actorId: createdById ?? null,
        backupId: result.id,
        filename,
        checksum,
        safetyBackupFilename: null,
        message: "Backup berhasil dibuat dan diverifikasi.",
      });

      await applyRetention();

      return {
        ...this.serialize(result),
        offsiteConfigured:
          Boolean(
            databaseBackupConfig.uploadCommand,
          ),
      };
    } catch (error) {
      const message =
        toErrorMessage(error);

      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error(
          "[DATABASE_BACKUP_CLEANUP]",
          cleanupError,
        );
      }

      await databaseBackupRepository.markFailed(
        record.id,
        message,
      );

      appendDatabaseBackupAudit({
        event: "BACKUP_FAILED",
        operationId,
        timestamp: new Date().toISOString(),
        actorId: createdById ?? null,
        backupId: record.id,
        filename,
        checksum: null,
        safetyBackupFilename: null,
        message,
      });

      throw new Error(
        `Backup database gagal: ${message}`,
      );
    }
  }

  async createBackup(
    type: DatabaseBackupType = "MANUAL",
    createdById?: string | null,
  ) {
    const lock = acquireOperationLock(
      "BACKUP",
      createdById,
    );

    try {
      return await this.createBackupUnlocked(
        type,
        createdById,
      );
    } finally {
      lock.release();
    }
  }

  async listBackups(limit = 50) {
    const rows =
      await databaseBackupRepository.findMany(
        limit,
      );

    return rows.map((row) =>
      this.serialize(row),
    );
  }

  async getBackup(id: string) {
    const row =
      await databaseBackupRepository.findById(id);

    if (!row) {
      return null;
    }

    return this.serialize(row);
  }

  getFilePath(filename: string) {
    /**
     * Never accept a path from the client. Only a filename that
     * resolves inside the configured backup directory is allowed.
     */
    const basename =
      path.basename(filename);

    if (
      basename !== filename ||
      !basename.endsWith(".dump")
    ) {
      throw new Error(
        "Nama file backup tidak valid.",
      );
    }

    return path.join(
      databaseBackupConfig.directory,
      basename,
    );
  }

  async restoreBackup(
    id: string,
    restoredById?: string | null,
  ) {
    assertServerEnvironment();
    await ensureDirectory();

    const lock = acquireOperationLock(
      "RESTORE",
      restoredById,
    );
    const operationId = randomUUID();

    let targetFilename: string | null = null;
    let targetChecksum: string | null = null;
    let safetyFilename: string | null = null;

    appendDatabaseBackupAudit({
      event: "RESTORE_STARTED",
      operationId,
      timestamp: new Date().toISOString(),
      actorId: restoredById ?? null,
      backupId: id,
      filename: null,
      checksum: null,
      safetyBackupFilename: null,
      message: "Restore dimulai.",
    });

    try {
      const row =
        await databaseBackupRepository.findById(id);

      if (!row) {
        throw new Error(
          "Backup tidak ditemukan.",
        );
      }

      if (row.status !== "SUCCESS") {
        throw new Error(
          "Hanya backup berstatus sukses yang dapat direstore.",
        );
      }

      targetFilename = row.filename;
      targetChecksum = row.checksum;

      const filePath =
        this.getFilePath(row.filename);

      if (!existsSync(filePath)) {
        throw new Error(
          "File backup tidak ditemukan di storage server.",
        );
      }

      const safetyBackup =
        await this.createBackupUnlocked(
          "MANUAL",
          restoredById,
          `${operationId}:safety`,
        );

      safetyFilename = safetyBackup.filename;

      const currentChecksum =
        await calculateSha256(filePath);

      if (
        row.checksum &&
        currentChecksum !== row.checksum
      ) {
        throw new Error(
          "Checksum backup tidak cocok. Restore dibatalkan untuk mencegah penggunaan file backup yang berubah atau rusak.",
        );
      }

      await verifyArchive(filePath);

      try {
        await execFileAsync(
          databaseBackupConfig.pgRestorePath,
          [
            "--dbname",
            process.env.DATABASE_URL as string,
            "--clean",
            "--if-exists",
            "--no-owner",
            "--no-acl",
            "--exit-on-error",
            "--single-transaction",
            filePath,
          ],
          {
            env: process.env,
            maxBuffer: 1024 * 1024 * 16,
          },
        );
      } catch (error) {
        const message =
          toErrorMessage(error);

        throw new Error(
          `Restore database gagal. Safety backup otomatis tetap tersedia: ${message}`,
        );
      }

      const databaseHealthy =
        await this.checkDatabaseConnection();

      if (!databaseHealthy) {
        throw new Error(
          "Restore selesai, tetapi health check database gagal. Safety backup otomatis tetap tersedia.",
        );
      }

      /**
       * pg_restore also restores the DatabaseBackup table itself.
       * Recreate the safety-backup metadata after the restore so
       * the emergency rollback file remains discoverable in the UI.
       */
      const safetyFilePath =
        this.getFilePath(
          safetyBackup.filename,
        );

      const safetyStat =
        statSync(safetyFilePath);

      const safetyChecksum =
        await calculateSha256(
          safetyFilePath,
        );

      let persistedSafetyBackup = null;
      let safetyBackupMetadataPersisted = true;

      try {
        persistedSafetyBackup =
          await databaseBackupRepository.createRestoredSafetyRecord(
            {
              filename: safetyBackup.filename,
              sizeBytes: BigInt(
                safetyStat.size,
              ),
              checksum: safetyChecksum,
              createdById: restoredById,
            },
          );
      } catch (metadataError) {
        safetyBackupMetadataPersisted = false;

        console.error(
          "[DATABASE_BACKUP_SAFETY_METADATA_RESTORE]",
          metadataError,
        );
      }

      const result = {
        restoredBackup: this.serialize(row),
        safetyBackup: persistedSafetyBackup
          ? this.serialize(
              persistedSafetyBackup,
            )
          : {
              filename: safetyBackup.filename,
              sizeBytes: safetyStat.size.toString(),
              checksum: safetyChecksum,
            },
        safetyBackupMetadataPersisted,
        healthCheck: {
          databaseConnected: true,
        },
      };

      appendDatabaseBackupAudit({
        event: "RESTORE_SUCCESS",
        operationId,
        timestamp: new Date().toISOString(),
        actorId: restoredById ?? null,
        backupId: id,
        filename: targetFilename,
        checksum: targetChecksum,
        safetyBackupFilename: safetyFilename,
        message: safetyBackupMetadataPersisted
          ? "Restore berhasil dan health check database lulus."
          : "Restore berhasil dan health check database lulus, tetapi metadata safety backup tidak dapat disimpan kembali ke database. File safety backup tetap tersedia di storage server.",
      });

      return result;
    } catch (error) {
      const message =
        toErrorMessage(error);

      appendDatabaseBackupAudit({
        event: "RESTORE_FAILED",
        operationId,
        timestamp: new Date().toISOString(),
        actorId: restoredById ?? null,
        backupId: id,
        filename: targetFilename,
        checksum: targetChecksum,
        safetyBackupFilename: safetyFilename,
        message,
      });

      throw error;
    } finally {
      lock.release();
    }
  }

  async getDownloadInfo(id: string) {
    const row =
      await databaseBackupRepository.findById(id);

    if (!row) {
      throw new Error(
        "Backup tidak ditemukan.",
      );
    }

    if (row.status !== "SUCCESS") {
      throw new Error(
        "Backup belum berstatus sukses.",
      );
    }

    const filePath =
      this.getFilePath(row.filename);

    if (!existsSync(filePath)) {
      throw new Error(
        "File backup tidak ditemukan di storage server.",
      );
    }

    return {
      filePath,
      filename: row.filename,
      sizeBytes: row.sizeBytes
        ? row.sizeBytes.toString()
        : "0",
      checksum: row.checksum,
    };
  }

  async listAuditEvents(limit = 20) {
    const auditPath = path.join(
      databaseBackupConfig.directory,
      "operations.jsonl",
    );

    if (!existsSync(auditPath)) {
      return [];
    }

    try {
      const lines = readFileSync(
        auditPath,
        "utf8",
      )
        .split("\n")
        .filter(Boolean)
        .slice(-Math.min(Math.max(limit, 1), 100));

      return lines
        .reverse()
        .flatMap((line) => {
          try {
            return [JSON.parse(line)];
          } catch {
            return [];
          }
        });
    } catch (error) {
      console.error(
        "[DATABASE_BACKUP_AUDIT_READ]",
        error,
      );

      return [];
    }
  }

  async getHealth() {
    const latest =
      await databaseBackupRepository.findMany(
        1,
      );

    const databaseConnected =
      await this.checkDatabaseConnection();

    return {
      databaseConnected,
      backupDirectory:
        databaseBackupConfig.directory,
      pgDumpConfigured:
        Boolean(databaseBackupConfig.pgDumpPath),
      pgRestoreConfigured:
        Boolean(databaseBackupConfig.pgRestorePath),
      offsiteConfigured:
        Boolean(
          databaseBackupConfig.uploadCommand,
        ),
      latestBackup:
        latest[0] ?? null,
      retention:
        databaseBackupConfig.retention,
      operationLock:
        getOperationLockStatus(),
    };
  }

  async checkDatabaseConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  serialize<
    T extends {
      id: string;
      filename: string;
      storageKey: string | null;
      sizeBytes: bigint | null;
      checksum: string | null;
      status: string;
      backupType: string;
      startedAt: Date;
      completedAt: Date | null;
      verifiedAt: Date | null;
      errorMessage: string | null;
      createdById: string | null;
      createdAt: Date;
    },
  >(row: T) {
    return {
      id: row.id,
      filename: row.filename,
      storageKey: row.storageKey,
      sizeBytes: row.sizeBytes?.toString() ?? null,
      checksum: row.checksum,
      status: row.status,
      backupType: row.backupType,
      startedAt: row.startedAt.toISOString(),
      completedAt:
        row.completedAt?.toISOString() ??
        null,
      verifiedAt:
        row.verifiedAt?.toISOString() ??
        null,
      errorMessage: row.errorMessage,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

export default new DatabaseBackupService();
