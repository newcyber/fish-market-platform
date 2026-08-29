import {
  Prisma,
  VoucherDiscountType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type RewardVoucherRepositoryClient =
  | typeof prisma
  | Prisma.TransactionClient;

export type CreateRewardVoucherSettingInput = {
  name: string;
  requiredPoints: number;
  discountType: VoucherDiscountType;
  discountValue: Prisma.Decimal | number | string;
  minimumPurchase?: Prisma.Decimal | number | string | null;
  maximumDiscount?: Prisma.Decimal | number | string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateRewardVoucherSettingInput = {
  name?: string;
  requiredPoints?: number;
  discountType?: VoucherDiscountType;
  discountValue?: Prisma.Decimal | number | string;
  minimumPurchase?: Prisma.Decimal | number | string | null;
  maximumDiscount?: Prisma.Decimal | number | string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export class RewardVoucherRepository {
  /**
   * ============================================================
   * FIND MANY
   * ============================================================
   */

  static async findMany(
    client: RewardVoucherRepositoryClient = prisma
  ) {
    return client.rewardVoucherSetting.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          requiredPoints: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ============================================================
   * FIND BY ID
   * ============================================================
   */

  static async findById(
    id: string,
    client: RewardVoucherRepositoryClient = prisma
  ) {
    return client.rewardVoucherSetting.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  static async create(
    data: CreateRewardVoucherSettingInput,
    client: RewardVoucherRepositoryClient = prisma
  ) {
    return client.rewardVoucherSetting.create({
      data: {
        name: data.name,

        requiredPoints:
          data.requiredPoints,

        discountType:
          data.discountType,

        discountValue:
          data.discountValue,

        minimumPurchase:
          data.minimumPurchase ?? null,

        maximumDiscount:
          data.maximumDiscount ?? null,

        isActive:
          data.isActive ?? true,

        sortOrder:
          data.sortOrder ?? 0,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */

  static async update(
    id: string,
    data: UpdateRewardVoucherSettingInput,
    client: RewardVoucherRepositoryClient = prisma
  ) {
    return client.rewardVoucherSetting.update({
      where: {
        id,
      },
      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.requiredPoints !== undefined && {
          requiredPoints:
            data.requiredPoints,
        }),

        ...(data.discountType !== undefined && {
          discountType:
            data.discountType,
        }),

        ...(data.discountValue !== undefined && {
          discountValue:
            data.discountValue,
        }),

        ...(data.minimumPurchase !== undefined && {
          minimumPurchase:
            data.minimumPurchase,
        }),

        ...(data.maximumDiscount !== undefined && {
          maximumDiscount:
            data.maximumDiscount,
        }),

        ...(data.isActive !== undefined && {
          isActive:
            data.isActive,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder:
            data.sortOrder,
        }),
      },
    });
  }

  /**
   * ============================================================
   * SET ACTIVE
   * ============================================================
   */

  static async setActive(
    id: string,
    isActive: boolean,
    client: RewardVoucherRepositoryClient = prisma
  ) {
    return client.rewardVoucherSetting.update({
      where: {
        id,
      },

      data: {
        isActive,
      },
    });
  }
}