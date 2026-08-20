import {
  Prisma,
  Voucher,
  VoucherDiscountType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * VOUCHER REPOSITORY
 * ============================================================
 *
 * Repository layer untuk seluruh database access
 * yang berhubungan dengan:
 *
 * - Voucher
 * - Voucher Usage
 *
 * Business logic tidak ditempatkan di repository.
 *
 * VoucherRepository hanya bertugas untuk:
 *
 * - Query
 * - Create
 * - Update
 * - Soft Delete
 * - Usage persistence
 *
 * Repository mendukung optional Prisma TransactionClient
 * agar dapat digunakan secara aman di dalam transaction.
 */

export class VoucherRepository {
  /**
   * ============================================================
   * GET CLIENT
   * ============================================================
   *
   * Menggunakan transaction client apabila tersedia.
   *
   * Jika tidak ada transaction:
   *
   * fallback ke global prisma client.
   */

  private static getClient(
    tx?: Prisma.TransactionClient
  ) {
    return tx ?? prisma;
  }

  /**
   * ============================================================
   * FIND BY ID
   * ============================================================
   */

  static async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher | null> {
    const client =
      this.getClient(tx);

    return client.voucher.findFirst({
      where: {
        id,

        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * FIND BY CODE
   * ============================================================
   *
   * Voucher code disimpan dalam uppercase
   * agar pencarian konsisten.
   */

  static async findByCode(
    code: string,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher | null> {
    const client =
      this.getClient(tx);

    return client.voucher.findFirst({
      where: {
        code: code
          .trim()
          .toUpperCase(),

        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * FIND MANY
   * ============================================================
   */

    /**
   * ============================================================
   * FIND MANY
   * ============================================================
   *
   * Mendukung kebutuhan Voucher Engine dan Admin Management.
   *
   * Backward compatible dengan parameter lama:
   * - includeDeleted
   * - isActive
   * - skip
   * - take
   *
   * Admin additions:
   * - search
   * - discountType
   */

  static async findMany(
    options?: {
      includeDeleted?: boolean;

      isActive?: boolean;

      search?: string;

      discountType?: VoucherDiscountType;

      skip?: number;

      take?: number;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = this.getClient(tx);

    const {
      includeDeleted = false,
      isActive,
      search,
      discountType,
      skip,
      take,
    } = options ?? {};

    const where: Prisma.VoucherWhereInput = {
      ...(includeDeleted
        ? {}
        : {
            deletedAt: null,
          }),

      ...(typeof isActive === "boolean"
        ? {
            isActive,
          }
        : {}),

      ...(discountType
        ? {
            discountType,
          }
        : {}),
    };

    /**
     * ============================================================
     * SEARCH
     * ============================================================
     */

    if (search?.trim()) {
      const keyword = search.trim();

      where.OR = [
        {
          code: {
            contains: keyword,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      ];
    }

    return client.voucher.findMany({
      where,

      orderBy: {
        createdAt: "desc",
      },

      ...(typeof skip === "number"
        ? {
            skip,
          }
        : {}),

      ...(typeof take === "number"
        ? {
            take,
          }
        : {}),
    });
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  static async create(
    data: Prisma.VoucherCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    const client =
      this.getClient(tx);

    return client.voucher.create({
      data: {
        ...data,

        code: data.code
          .trim()
          .toUpperCase(),
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
    data: Prisma.VoucherUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    const client =
      this.getClient(tx);

    return client.voucher.update({
      where: {
        id,
      },

      data: {
        ...data,

        ...(typeof data.code ===
        "string"
          ? {
              code: data.code
                .trim()
                .toUpperCase(),
            }
          : {}),
      },
    });
  }

  /**
   * ============================================================
   * SOFT DELETE
   * ============================================================
   */

  static async softDelete(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    const client =
      this.getClient(tx);

    return client.voucher.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),

        isActive: false,
      },
    });
  }

  /**
   * ============================================================
   * RESTORE
   * ============================================================
   */

  static async restore(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    const client =
      this.getClient(tx);

    return client.voucher.update({
      where: {
        id,
      },

      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * COUNT USER USAGE
   * ============================================================
   *
   * Digunakan untuk validasi:
 *
 * perUserLimit
   */

  static async countUserUsage(
    voucherId: string,
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client =
      this.getClient(tx);

    return client.voucherUsage.count({
      where: {
        voucherId,

        userId,
      },
    });
  }

  /**
   * ============================================================
   * INCREMENT USAGE COUNT
   * ============================================================
   *
   * Method ini digunakan untuk menambah jumlah
   * penggunaan voucher.
   *
   * Untuk checkout production, kita nantinya akan
   * menggunakan guarded increment agar usageLimit
   * tidak dapat terlewati saat request bersamaan.
   */

  static async incrementUsageCount(
    voucherId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    const client =
      this.getClient(tx);

    return client.voucher.update({
      where: {
        id: voucherId,
      },

      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }


    /**
   * ============================================================
   * COUNT VOUCHERS
   * ============================================================
   *
   * Digunakan untuk pagination Admin Voucher Management.
   */

  static async count(
    options?: {
      includeDeleted?: boolean;

      isActive?: boolean;

      search?: string;

      discountType?: VoucherDiscountType;
    },
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = this.getClient(tx);

    const {
      includeDeleted = false,
      isActive,
      search,
      discountType,
    } = options ?? {};

    const where: Prisma.VoucherWhereInput = {
      ...(includeDeleted
        ? {}
        : {
            deletedAt: null,
          }),

      ...(typeof isActive === "boolean"
        ? {
            isActive,
          }
        : {}),

      ...(discountType
        ? {
            discountType,
          }
        : {}),
    };

    if (search?.trim()) {
      const keyword = search.trim();

      where.OR = [
        {
          code: {
            contains: keyword,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: keyword,
            mode: "insensitive",
          },
        },
      ];
    }

    return client.voucher.count({
      where,
    });
  }

  /**
   * ============================================================
   * SET ACTIVE STATUS
   * ============================================================
   *
   * Digunakan Admin untuk activate / deactivate voucher.
   */

  static async setActive(
    id: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    const client = this.getClient(tx);

    return client.voucher.update({
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
   * FIND VOUCHER USAGES
   * ============================================================
   *
   * Digunakan Admin untuk melihat riwayat penggunaan voucher.
   */

  static async findUsages(
    voucherId: string,
    options?: {
      skip?: number;

      take?: number;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = this.getClient(tx);

    const {
      skip,
      take,
    } = options ?? {};

    return client.voucherUsage.findMany({
      where: {
        voucherId,
      },

      orderBy: {
        usedAt: "desc",
      },

      ...(typeof skip === "number"
        ? {
            skip,
          }
        : {}),

      ...(typeof take === "number"
        ? {
            take,
          }
        : {}),

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            subtotal: true,
            voucherDiscount: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * COUNT VOUCHER USAGES
   * ============================================================
   *
   * Digunakan untuk pagination riwayat penggunaan voucher.
   */

  static async countUsages(
    voucherId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = this.getClient(tx);

    return client.voucherUsage.count({
      where: {
        voucherId,
      },
    });
  }

  
  /**
   * ============================================================
   * CREATE VOUCHER USAGE
   * ============================================================
   *
   * Mencatat penggunaan voucher pada order.
   */

  static async createUsage(
    data: {
      voucherId: string;

      userId: string;

      orderId: string;

      discountAmount:
        | number
        | Prisma.Decimal;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client =
      this.getClient(tx);

    return client.voucherUsage.create({
      data: {
        voucherId:
          data.voucherId,

        userId:
          data.userId,

        orderId:
          data.orderId,

        discountAmount:
          new Prisma.Decimal(
            data.discountAmount
          ),
      },
    });
  }

    /**
   * ============================================================
   * ACQUIRE USER VOUCHER LOCK
   * ============================================================
   *
   * Menggunakan PostgreSQL transaction advisory lock untuk
   * mengunci proses penggunaan voucher berdasarkan kombinasi:
   *
   * - voucherId
   * - userId
   *
   * Lock berlaku selama transaction aktif dan otomatis dilepas
   * ketika transaction commit atau rollback.
   *
   * Tujuan:
   *
   * Mencegah dua request checkout dari user yang sama memakai
   * voucher yang sama secara bersamaan sehingga perUserLimit
   * tidak dapat ditembus.
   * ============================================================
   */

  static async acquireUserVoucherLock(
    voucherId: string,
    userId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    /**
     * PostgreSQL advisory lock membutuhkan bigint.
     *
     * hashtext menghasilkan hash integer yang konsisten dari
     * kombinasi voucherId dan userId.
     *
     * pg_advisory_xact_lock:
     *
     * - transaction scoped
     * - otomatis release saat commit
     * - otomatis release saat rollback
     */

    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(
          ${voucherId} || ':' || ${userId}
        )::bigint
      )
    `;
  }
}