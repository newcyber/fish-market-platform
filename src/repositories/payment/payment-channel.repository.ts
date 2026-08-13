import {
  PaymentChannelType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 *
 * PAYMENT CHANNEL REPOSITORY
 *
 * Database access layer untuk:
 *
 * - Payment Channel
 * - Bank Transfer
 * - Payment Method Configuration
 *
 * Repository tidak menangani business logic.
 *
 * ============================================================
 */

export class PaymentChannelRepository {
  /**
   * ============================================================
   * FIND ALL
   *
   * Digunakan Admin.
   *
   * Mengambil seluruh payment channel
   * termasuk yang tidak aktif.
   *
   * ============================================================
   */

  static async findAll() {
    return prisma.paymentChannel.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ============================================================
   * FIND ALL ACTIVE
   *
   * Digunakan Customer Checkout.
   *
   * ============================================================
   */

  static async findAllActive() {
    return prisma.paymentChannel.findMany({
      where: {
        isActive: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
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
    id: string
  ) {
    return prisma.paymentChannel.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ============================================================
   * FIND BY SLUG
   * ============================================================
   */

  static async findBySlug(
    slug: string
  ) {
    return prisma.paymentChannel.findUnique({
      where: {
        slug,
      },
    });
  }

  /**
   * ============================================================
   * FIND ACTIVE BY ID
   *
   * Digunakan ketika customer memilih
   * payment channel pada checkout.
   *
   * ============================================================
   */

  static async findActiveById(
    id: string
  ) {
    return prisma.paymentChannel.findFirst({
      where: {
        id,
        isActive: true,
      },
    });
  }

  /**
   * ============================================================
   * FIND BY TYPE
   * ============================================================
   */

  static async findByType(
    type: PaymentChannelType
  ) {
    return prisma.paymentChannel.findMany({
      where: {
        type,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  static async create(
    data: Prisma.PaymentChannelCreateInput
  ) {
    return prisma.paymentChannel.create({
      data,
    });
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */

  static async update(
    id: string,
    data: Prisma.PaymentChannelUpdateInput
  ) {
    return prisma.paymentChannel.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * ============================================================
   * DELETE
   *
   * Permanent delete.
   *
   * Saat ini aman karena PaymentChannel
   * belum memiliki relasi ke Order.
   *
   * ============================================================
   */

  static async delete(
    id: string
  ) {
    return prisma.paymentChannel.delete({
      where: {
        id,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE ACTIVE STATUS
   * ============================================================
   */

  static async updateActiveStatus(
    id: string,
    isActive: boolean
  ) {
    return prisma.paymentChannel.update({
      where: {
        id,
      },

      data: {
        isActive,
      },
    });
  }

  /**
   * ============================================================
   * COUNT BY SLUG
   *
   * Digunakan untuk validasi slug unik.
   * excludeId digunakan saat proses update.
   *
   * ============================================================
   */

  static async countBySlug(
    slug: string,
    excludeId?: string
  ) {
    return prisma.paymentChannel.count({
      where: {
        slug,

        ...(excludeId
          ? {
              NOT: {
                id: excludeId,
              },
            }
          : {}),
      },
    });
  }
}