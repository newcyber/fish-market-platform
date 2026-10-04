import { prisma } from "@/lib/prisma";
import type {
  DatabaseBackupType,
} from "@prisma/client";

export class DatabaseBackupRepository {
  async create(data: {
    filename: string;
    backupType: DatabaseBackupType;
    createdById?: string | null;
  }) {
    return prisma.databaseBackup.create({
      data: {
        filename: data.filename,
        backupType: data.backupType,
        createdById: data.createdById ?? null,
        status: "RUNNING",
      },
    });
  }

  async markSuccess(
    id: string,
    data: {
      sizeBytes: bigint;
      checksum: string;
      storageKey: string;
      completedAt: Date;
      verifiedAt: Date;
    },
  ) {
    return prisma.databaseBackup.update({
      where: { id },
      data: {
        status: "SUCCESS",
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        storageKey: data.storageKey,
        completedAt: data.completedAt,
        verifiedAt: data.verifiedAt,
        errorMessage: null,
      },
    });
  }

  async createRestoredSafetyRecord(data: {
    filename: string;
    sizeBytes: bigint;
    checksum: string;
    createdById?: string | null;
  }) {
    const now = new Date();

    return prisma.databaseBackup.create({
      data: {
        filename: data.filename,
        storageKey: data.filename,
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        status: "SUCCESS",
        backupType: "MANUAL",
        startedAt: now,
        completedAt: now,
        verifiedAt: now,
        createdById: data.createdById ?? null,
      },
    });
  }

  async markFailed(id: string, errorMessage: string) {
    return prisma.databaseBackup.update({
      where: { id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: errorMessage.slice(0, 4000),
      },
    });
  }

  async findMany(limit = 50) {
    return prisma.databaseBackup.findMany({
      orderBy: { startedAt: "desc" },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  async findById(id: string) {
    return prisma.databaseBackup.findUnique({
      where: { id },
    });
  }

  async deleteById(id: string) {
    return prisma.databaseBackup.delete({
      where: { id },
    });
  }

  async findExpired(
    type: DatabaseBackupType,
    keep: number,
  ) {
    const rows = await prisma.databaseBackup.findMany({
      where: {
        backupType: type,
        status: "SUCCESS",
      },
      orderBy: { startedAt: "desc" },
      skip: keep,
      select: {
        id: true,
        filename: true,
      },
    });

    return rows;
  }
}

export default new DatabaseBackupRepository();
