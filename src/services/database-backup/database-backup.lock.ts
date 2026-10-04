import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { databaseBackupConfig } from "./database-backup.config";

type OperationType = "BACKUP" | "RESTORE";

interface LockMetadata {
  operation: OperationType;
  pid: number;
  startedAt: string;
  actorId: string | null;
}

const LOCK_DIRECTORY_NAME = ".operation-lock";

function getLockDirectory() {
  return path.join(
    databaseBackupConfig.directory,
    LOCK_DIRECTORY_NAME,
  );
}

function readLockMetadata(lockDirectory: string): LockMetadata | null {
  try {
    const raw = readFileSync(
      path.join(lockDirectory, "metadata.json"),
      "utf8",
    );

    return JSON.parse(raw) as LockMetadata;
  } catch {
    return null;
  }
}

function isStale(metadata: LockMetadata | null) {
  if (!metadata) return true;

  const startedAt = Date.parse(metadata.startedAt);

  if (!Number.isFinite(startedAt)) return true;

  return (
    Date.now() - startedAt >
    databaseBackupConfig.operationLockTtlMs
  );
}

export function getOperationLockStatus() {
  const directory = getLockDirectory();

  if (!existsSync(directory)) {
    return {
      active: false,
      operation: null,
      startedAt: null,
      pid: null,
    };
  }

  const metadata = readLockMetadata(directory);

  if (isStale(metadata)) {
    try {
      rmSync(directory, {
        recursive: true,
        force: true,
      });
    } catch {
      // A concurrent process may still own the lock.
    }

    return {
      active: false,
      operation: null,
      startedAt: null,
      pid: null,
    };
  }

  return {
    active: true,
    operation: metadata?.operation ?? null,
    startedAt: metadata?.startedAt ?? null,
    pid: metadata?.pid ?? null,
  };
}

export function acquireOperationLock(
  operation: OperationType,
  actorId?: string | null,
) {
  const directory = getLockDirectory();

  try {
    mkdirSync(directory);
  } catch (error) {
    if (isStale(readLockMetadata(directory))) {
      try {
        rmSync(directory, {
          recursive: true,
          force: true,
        });
        mkdirSync(directory);
      } catch {
        throw new Error(
          "Operasi backup/restore lain sedang berjalan. Silakan tunggu sampai selesai.",
        );
      }
    } else {
      throw new Error(
        "Operasi backup/restore lain sedang berjalan. Silakan tunggu sampai selesai.",
      );
    }
  }

  const metadata: LockMetadata = {
    operation,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    actorId: actorId ?? null,
  };

  try {
    writeFileSync(
      path.join(directory, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf8",
    );
  } catch (error) {
    try {
      rmSync(directory, {
        recursive: true,
        force: true,
      });
    } catch {
      // Ignore cleanup failure and preserve the original error.
    }

    throw error;
  }

  let released = false;

  return {
    metadata,
    release() {
      if (released) return;
      released = true;

      try {
        const current = readLockMetadata(directory);

        if (
          current?.pid === metadata.pid &&
          current?.startedAt === metadata.startedAt
        ) {
          rmSync(directory, {
            recursive: true,
            force: true,
          });
        }
      } catch (error) {
        console.error(
          "[DATABASE_BACKUP_LOCK_RELEASE]",
          error,
        );
      }
    },
  };
}
