import { Prisma } from "@prisma/client";

import {
  MemberTierRepository,
  type MemberTierRepositoryCreateInput,
  type MemberTierRepositoryUpdateInput,
} from "@/repositories/member-tier/member-tier.repository";

function normalizeText(value: unknown, field: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`${field} wajib diisi.`);
  }

  return text;
}

function normalizeSlug(value: unknown, fallbackName?: string) {
  const source = String(value ?? fallbackName ?? "")
    .trim()
    .toLowerCase();

  const slug = source
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Slug tier tidak valid.");
  }

  return slug;
}

function parseNonNegativeNumber(value: unknown, field: string): number {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} harus berupa angka 0 atau lebih.`);
  }

  return number;
}

function parseInteger(value: unknown, field: string): number {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${field} harus berupa bilangan bulat 0 atau lebih.`);
  }

  return number;
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new Error("Status benefit tidak valid.");
  }

  return value;
}

function toInput(
  input: Record<string, unknown>,
): MemberTierRepositoryCreateInput {
  const name = normalizeText(input.name, "Nama tier");
  const slug = normalizeSlug(input.slug, name);
  const minSpend = parseNonNegativeNumber(input.minSpend, "Minimum spend");
  const bonusPointsPercent = parseNonNegativeNumber(
    input.bonusPointsPercent ?? 0,
    "Bonus point",
  );

  if (bonusPointsPercent > 1000) {
    throw new Error("Bonus point tidak boleh lebih dari 1000%.");
  }

  const sortOrder = parseInteger(input.sortOrder ?? 0, "Urutan");

  return {
    name,
    slug,
    minSpend,
    bonusPointsPercent,
    freeShipping: parseBoolean(input.freeShipping, false),
    prioritySupport: parseBoolean(input.prioritySupport, false),
    exclusivePricing: parseBoolean(input.exclusivePricing, false),
    isActive: parseBoolean(input.isActive, true),
    sortOrder,
  };
}

async function validateUniqueRules(
  input: MemberTierRepositoryCreateInput,
  excludeId?: string,
) {
  const existingSlug = await MemberTierRepository.findBySlug(input.slug);

  if (existingSlug && existingSlug.id !== excludeId) {
    throw new Error("Slug tier sudah digunakan.");
  }

  const existingMinSpend = await MemberTierRepository.findByMinSpend(
    input.minSpend,
    excludeId,
  );

  if (existingMinSpend) {
    throw new Error(
      `Minimum spend sama dengan tier "${existingMinSpend.name}".`,
    );
  }

  if (input.isActive && input.minSpend === 0) {
    const activeBasicCount = await MemberTierRepository.countBasicCandidates();

    if (activeBasicCount > 0) {
      throw new Error(
        "Hanya boleh ada satu tier aktif dengan minimum spend Rp0.",
      );
    }
  }
}

export class AdminMemberTierService {
  static async getAll() {
    return MemberTierRepository.seedDefaultsIfEmpty();
  }

  static async getById(id: string) {
    const normalizedId = String(id ?? "").trim();

    if (!normalizedId) {
      throw new Error("Member tier ID tidak valid.");
    }

    const tier = await MemberTierRepository.findById(normalizedId);

    if (!tier) {
      throw new Error("Member tier tidak ditemukan.");
    }

    return tier;
  }

  static async create(input: Record<string, unknown>) {
    const data = toInput(input);

    await validateUniqueRules(data);

    return MemberTierRepository.create(data);
  }

  static async update(id: string, input: Record<string, unknown>) {
    const existing = await this.getById(id);

    const merged: Record<string, unknown> = {
      name: existing.name,
      slug: existing.slug,
      minSpend: existing.minSpend.toNumber(),
      bonusPointsPercent: existing.bonusPointsPercent,
      freeShipping: existing.freeShipping,
      prioritySupport: existing.prioritySupport,
      exclusivePricing: existing.exclusivePricing,
      isActive: existing.isActive,
      sortOrder: existing.sortOrder,
      ...input,
    };

    const data = toInput(merged);

    const existingWasBasic = existing.minSpend.eq(new Prisma.Decimal(0));

    if (existingWasBasic && data.minSpend !== 0) {
      const activeBasicCount =
        await MemberTierRepository.countBasicCandidates();

      if (data.isActive || activeBasicCount <= 1) {
        throw new Error(
          "Tier dengan minimum spend Rp0 harus tetap tersedia sebagai tier dasar.",
        );
      }
    }

    if (existingWasBasic && data.isActive === false) {
      throw new Error("Tier Basic tidak boleh dinonaktifkan.");
    }

    await validateUniqueRules(data, existing.id);

    return MemberTierRepository.update(existing.id, data);
  }

  static async setActive(id: string, isActive: boolean) {
    const existing = await this.getById(id);

    if (!isActive) {
      const activeCount = await MemberTierRepository.countActive();

      if (activeCount <= 1) {
        throw new Error("Minimal satu tier harus tetap aktif.");
      }
    }

    if (existing.minSpend.eq(new Prisma.Decimal(0)) && !isActive) {
      throw new Error("Tier Basic tidak boleh dinonaktifkan.");
    }

    return MemberTierRepository.update(id, {
      isActive,
    });
  }
}
