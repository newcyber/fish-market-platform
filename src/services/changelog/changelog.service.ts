import type { ChangelogType } from "@prisma/client";
import changelogRepository, {
  type CreateChangelogReleasePayload,
  type UpdateChangelogReleasePayload,
} from "@/repositories/changelog/changelog.repository";

export interface CreateChangelogEntryInput {
  releaseId: string;
  type: ChangelogType;
  title: string;
  description: string;
  highlights?: string[];
  sortOrder?: number;
}

export interface UpdateChangelogEntryInput {
  type?: ChangelogType;
  title?: string;
  description?: string;
  highlights?: string[];
  sortOrder?: number;
}

const normalizeText = (
  value?: string | null,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value.trim() || null;
};

const normalizeRequiredText = (value: string): string => {
  return value.trim();
};

const normalizeHighlights = (
  highlights?: string[],
): string[] | undefined => {
  if (highlights === undefined) {
    return undefined;
  }

  return highlights
    .map((item) => item.trim())
    .filter(Boolean);
};

class ChangelogService {
  async getPublishedReleases() {
    return changelogRepository.getPublishedReleases();
  }

  async getAllReleases() {
    return changelogRepository.getAllReleases();
  }

  async getReleaseById(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new Error("ID changelog tidak valid.");
    }

    return changelogRepository.getReleaseById(normalizedId);
  }

  async createRelease(
    payload: CreateChangelogReleasePayload,
  ) {
    const version = normalizeRequiredText(payload.version);
    const title = normalizeRequiredText(payload.title);

    if (!version) {
      throw new Error("Versi changelog wajib diisi.");
    }

    if (!title) {
      throw new Error("Judul changelog wajib diisi.");
    }

    return changelogRepository.createRelease({
      ...payload,
      version,
      title,
      description: normalizeText(payload.description),
    });
  }

  async updateRelease(
    id: string,
    payload: UpdateChangelogReleasePayload,
  ) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new Error("ID changelog tidak valid.");
    }

    const normalizedPayload: UpdateChangelogReleasePayload = {
      ...payload,
    };

    if (payload.version !== undefined) {
      normalizedPayload.version =
        normalizeRequiredText(payload.version);
    }

    if (payload.title !== undefined) {
      normalizedPayload.title =
        normalizeRequiredText(payload.title);
    }

    if (payload.description !== undefined) {
      normalizedPayload.description =
        normalizeText(payload.description);
    }

    if (
      normalizedPayload.version !== undefined &&
      !normalizedPayload.version
    ) {
      throw new Error("Versi changelog wajib diisi.");
    }

    if (
      normalizedPayload.title !== undefined &&
      !normalizedPayload.title
    ) {
      throw new Error("Judul changelog wajib diisi.");
    }

    return changelogRepository.updateRelease(
      normalizedId,
      normalizedPayload,
    );
  }

  async deleteRelease(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new Error("ID changelog tidak valid.");
    }

    return changelogRepository.deleteRelease(normalizedId);
  }

  async createEntry(
    payload: CreateChangelogEntryInput,
  ) {
    const releaseId = payload.releaseId.trim();
    const title = normalizeRequiredText(payload.title);
    const description = normalizeRequiredText(
      payload.description,
    );

    if (!releaseId) {
      throw new Error("Release changelog wajib dipilih.");
    }

    if (!title) {
      throw new Error("Judul entry wajib diisi.");
    }

    if (!description) {
      throw new Error("Deskripsi entry wajib diisi.");
    }

    return changelogRepository.createEntry({
      releaseId,
      type: payload.type,
      title,
      description,
      highlights:
        payload.highlights === undefined
          ? undefined
          : normalizeHighlights(payload.highlights),
      sortOrder: payload.sortOrder,
    });
  }

  async updateEntry(
    id: string,
    payload: UpdateChangelogEntryInput,
  ) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new Error("ID entry changelog tidak valid.");
    }

    const normalizedPayload = {
      ...payload,
    };

    if (payload.title !== undefined) {
      normalizedPayload.title =
        normalizeRequiredText(payload.title);
    }

    if (payload.description !== undefined) {
      normalizedPayload.description =
        normalizeRequiredText(payload.description);
    }

    if (
      normalizedPayload.title !== undefined &&
      !normalizedPayload.title
    ) {
      throw new Error("Judul entry wajib diisi.");
    }

    if (
      normalizedPayload.description !== undefined &&
      !normalizedPayload.description
    ) {
      throw new Error("Deskripsi entry wajib diisi.");
    }

    if (payload.highlights !== undefined) {
      normalizedPayload.highlights =
        normalizeHighlights(payload.highlights);
    }

    return changelogRepository.updateEntry(
      normalizedId,
      normalizedPayload,
    );
  }

  async deleteEntry(id: string) {
    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new Error("ID entry changelog tidak valid.");
    }

    return changelogRepository.deleteEntry(normalizedId);
  }
}

const changelogService = new ChangelogService();

export default changelogService;
