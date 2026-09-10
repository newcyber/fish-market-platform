import { prisma } from "@/lib/prisma";
import type {
  ChangelogType,
  Prisma,
} from "@prisma/client";

export interface CreateChangelogReleasePayload {
  version: string;
  date: Date;
  title: string;
  description?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateChangelogReleasePayload {
  version?: string;
  date?: Date;
  title?: string;
  description?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface CreateChangelogEntryPayload {
  releaseId: string;
  type: ChangelogType;
  title: string;
  description: string;
  highlights?: Prisma.InputJsonValue;
  sortOrder?: number;
}

export interface UpdateChangelogEntryPayload {
  type?: ChangelogType;
  title?: string;
  description?: string;
  highlights?: Prisma.InputJsonValue;
  sortOrder?: number;
}

const changelogEntrySelect = {
  id: true,
  releaseId: true,
  type: true,
  title: true,
  description: true,
  highlights: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChangelogEntrySelect;

const changelogReleaseInclude = {
  entries: {
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
    select: changelogEntrySelect,
  },
} satisfies Prisma.ChangelogReleaseInclude;

class ChangelogRepository {
  async getPublishedReleases() {
    return prisma.changelogRelease.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [
        { date: "desc" },
        { sortOrder: "asc" },
      ],
      include: changelogReleaseInclude,
    });
  }

  async getAllReleases() {
    return prisma.changelogRelease.findMany({
      orderBy: [
        { date: "desc" },
        { sortOrder: "asc" },
      ],
      include: changelogReleaseInclude,
    });
  }

  async getReleaseById(id: string) {
    return prisma.changelogRelease.findUnique({
      where: { id },
      include: changelogReleaseInclude,
    });
  }

  async createRelease(payload: CreateChangelogReleasePayload) {
    return prisma.changelogRelease.create({
      data: payload,
      include: changelogReleaseInclude,
    });
  }

  async updateRelease(
    id: string,
    payload: UpdateChangelogReleasePayload,
  ) {
    return prisma.changelogRelease.update({
      where: { id },
      data: payload,
      include: changelogReleaseInclude,
    });
  }

  async deleteRelease(id: string) {
    return prisma.changelogRelease.delete({
      where: { id },
    });
  }

  async createEntry(payload: CreateChangelogEntryPayload) {
    return prisma.changelogEntry.create({
      data: payload,
      select: changelogEntrySelect,
    });
  }

  async updateEntry(
    id: string,
    payload: UpdateChangelogEntryPayload,
  ) {
    return prisma.changelogEntry.update({
      where: { id },
      data: payload,
      select: changelogEntrySelect,
    });
  }

  async deleteEntry(id: string) {
    return prisma.changelogEntry.delete({
      where: { id },
    });
  }
}

const changelogRepository = new ChangelogRepository();

export default changelogRepository;
