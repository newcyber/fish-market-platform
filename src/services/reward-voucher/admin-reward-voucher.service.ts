import {
  Prisma,
  VoucherDiscountType,
} from "@prisma/client";

import {
  RewardVoucherRepository,
  CreateRewardVoucherSettingInput,
  UpdateRewardVoucherSettingInput,
} from "@/repositories/reward-voucher/reward-voucher.repository";

/**
 * ============================================================
 * ADMIN REWARD VOUCHER SERVICE
 * ============================================================
 *
 * Business logic khusus administrator untuk mengelola
 * RewardVoucherSetting.
 *
 * Service ini TIDAK membuat Voucher personal.
 *
 * Voucher personal hanya dibuat ketika customer melakukan
 * redeem melalui reward-voucher.service.ts.
 */

function normalizeName(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function parseRequiredPoints(
  value: unknown
): number {
  const points =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(points) ||
    points <= 0
  ) {
    throw new Error(
      "Required points harus berupa bilangan bulat lebih dari 0."
    );
  }

  return points;
}

function parseSortOrder(
  value: unknown
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const sortOrder =
    typeof value === "number"
      ? value
      : Number(value);

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error(
      "Sort order harus berupa bilangan bulat 0 atau lebih."
    );
  }

  return sortOrder;
}

function parseDecimal(
  value: unknown,
  fieldName: string,
  options?: {
    nullable?: boolean;
    positive?: boolean;
    nonNegative?: boolean;
  }
): Prisma.Decimal | null {
  const nullable =
    options?.nullable ?? true;

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (nullable) {
      return null;
    }

    throw new Error(
      `${fieldName} wajib diisi.`
    );
  }

  let decimal: Prisma.Decimal;

  try {
    decimal =
      new Prisma.Decimal(
        value as Prisma.Decimal.Value
      );
  } catch {
    throw new Error(
      `${fieldName} tidak valid.`
    );
  }

  if (!decimal.isFinite()) {
    throw new Error(
      `${fieldName} tidak valid.`
    );
  }

  if (
    options?.positive &&
    decimal.lte(0)
  ) {
    throw new Error(
      `${fieldName} harus lebih dari 0.`
    );
  }

  if (
    options?.nonNegative &&
    decimal.lt(0)
  ) {
    throw new Error(
      `${fieldName} tidak boleh negatif.`
    );
  }

  return decimal;
}

function validateDiscount(
  discountType: VoucherDiscountType,
  discountValue: Prisma.Decimal,
  maximumDiscount: Prisma.Decimal | null
) {
  if (discountType === "PERCENTAGE") {
    if (discountValue.gt(100)) {
      throw new Error(
        "Diskon persentase tidak boleh lebih dari 100%."
      );
    }

    return;
  }

  if (discountType === "FIXED_AMOUNT") {
    if (maximumDiscount !== null) {
      throw new Error(
        "Maximum discount hanya digunakan untuk voucher persentase."
      );
    }

    return;
  }

  throw new Error(
    "Tipe diskon voucher tidak valid."
  );
}

function validatePurchaseRules(
  minimumPurchase: Prisma.Decimal | null,
  maximumDiscount: Prisma.Decimal | null
) {
  if (
    minimumPurchase !== null &&
    minimumPurchase.lt(0)
  ) {
    throw new Error(
      "Minimum purchase tidak boleh negatif."
    );
  }

  if (
    maximumDiscount !== null &&
    maximumDiscount.lte(0)
  ) {
    throw new Error(
      "Maximum discount harus lebih dari 0."
    );
  }
}

export class AdminRewardVoucherService {
  /**
   * ============================================================
   * LIST
   * ============================================================
   */

  static async getAll() {
    return RewardVoucherRepository.findMany();
  }

  /**
   * ============================================================
   * GET DETAIL
   * ============================================================
   */

  static async getById(
    id: string
  ) {
    const normalizedId =
      String(id ?? "").trim();

    if (!normalizedId) {
      throw new Error(
        "Reward voucher ID tidak valid."
      );
    }

    const setting =
      await RewardVoucherRepository.findById(
        normalizedId
      );

    if (!setting) {
      throw new Error(
        "Reward voucher tidak ditemukan."
      );
    }

    return setting;
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  static async create(
    input: CreateRewardVoucherSettingInput
  ) {
    const name =
      normalizeName(input.name);

    if (!name) {
      throw new Error(
        "Nama reward voucher wajib diisi."
      );
    }

    const requiredPoints =
      parseRequiredPoints(
        input.requiredPoints
      );

    const discountValue =
      parseDecimal(
        input.discountValue,
        "Discount value",
        {
          nullable: false,
          positive: true,
        }
      );

    if (!discountValue) {
      throw new Error(
        "Discount value tidak valid."
      );
    }

    const minimumPurchase =
      parseDecimal(
        input.minimumPurchase,
        "Minimum purchase",
        {
          nullable: true,
          nonNegative: true,
        }
      );

    const maximumDiscount =
      parseDecimal(
        input.maximumDiscount,
        "Maximum discount",
        {
          nullable: true,
          positive: true,
        }
      );

    validateDiscount(
      input.discountType,
      discountValue,
      maximumDiscount
    );

    validatePurchaseRules(
      minimumPurchase,
      maximumDiscount
    );

    const sortOrder =
      parseSortOrder(
        input.sortOrder
      );

    return RewardVoucherRepository.create({
      name,
      requiredPoints,
      discountType:
        input.discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      isActive:
        input.isActive ?? true,
      sortOrder,
    });
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */

  static async update(
    id: string,
    input: UpdateRewardVoucherSettingInput
  ) {
    const normalizedId =
      String(id ?? "").trim();

    if (!normalizedId) {
      throw new Error(
        "Reward voucher ID tidak valid."
      );
    }

    const existing =
      await RewardVoucherRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward voucher tidak ditemukan."
      );
    }

    const name =
      input.name !== undefined
        ? normalizeName(input.name)
        : existing.name;

    if (!name) {
      throw new Error(
        "Nama reward voucher wajib diisi."
      );
    }

    const requiredPoints =
      input.requiredPoints !== undefined
        ? parseRequiredPoints(
            input.requiredPoints
          )
        : existing.requiredPoints;

    const discountType =
      input.discountType ??
      existing.discountType;

    const discountValue =
      input.discountValue !== undefined
        ? parseDecimal(
            input.discountValue,
            "Discount value",
            {
              nullable: false,
              positive: true,
            }
          )
        : existing.discountValue;

    if (!discountValue) {
      throw new Error(
        "Discount value tidak valid."
      );
    }

    const minimumPurchase =
      input.minimumPurchase !== undefined
        ? parseDecimal(
            input.minimumPurchase,
            "Minimum purchase",
            {
              nullable: true,
              nonNegative: true,
            }
          )
        : existing.minimumPurchase;

    const maximumDiscount =
      input.maximumDiscount !== undefined
        ? parseDecimal(
            input.maximumDiscount,
            "Maximum discount",
            {
              nullable: true,
              positive: true,
            }
          )
        : existing.maximumDiscount;

    validateDiscount(
      discountType,
      discountValue,
      maximumDiscount
    );

    validatePurchaseRules(
      minimumPurchase,
      maximumDiscount
    );

    const sortOrder =
      input.sortOrder !== undefined
        ? parseSortOrder(
            input.sortOrder
          )
        : existing.sortOrder;

    return RewardVoucherRepository.update(
      normalizedId,
      {
        name,
        requiredPoints,
        discountType,
        discountValue,
        minimumPurchase,
        maximumDiscount,
        ...(input.isActive !== undefined && {
          isActive:
            input.isActive,
        }),
        sortOrder,
      }
    );
  }

  /**
   * ============================================================
   * ACTIVATE / DEACTIVATE
   * ============================================================
   */

  static async setActive(
    id: string,
    isActive: boolean
  ) {
    const normalizedId =
      String(id ?? "").trim();

    if (!normalizedId) {
      throw new Error(
        "Reward voucher ID tidak valid."
      );
    }

    const existing =
      await RewardVoucherRepository.findById(
        normalizedId
      );

    if (!existing) {
      throw new Error(
        "Reward voucher tidak ditemukan."
      );
    }

    return RewardVoucherRepository.setActive(
      normalizedId,
      Boolean(isActive)
    );
  }
}