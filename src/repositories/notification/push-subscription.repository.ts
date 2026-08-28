import {
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * PUSH SUBSCRIPTION REPOSITORY
 * ============================================================
 *
 * Repository untuk seluruh akses database PushSubscription.
 *
 * Prinsip utama:
 *
 * - Subscription selalu memiliki userId.
 * - Semua operasi user-facing harus user-scoped.
 * - User tidak boleh membaca / mengubah / menghapus
 *   subscription milik user lain.
 *
 * Flow:
 *
 * Browser
 *    ↓
 * Server Action
 *    ↓
 * PushSubscription Repository
 *    ↓
 * Prisma
 *    ↓
 * PostgreSQL
 *
 * ============================================================
 */

export interface CreatePushSubscriptionInput {
  userId: string;

  endpoint: string;

  p256dh: string;

  auth: string;

  userAgent?: string | null;
}

class PushSubscriptionRepository {
  /**
   * ==========================================================
   * UPSERT
   * ==========================================================
   *
   * Endpoint menjadi identitas subscription dari browser.
   *
   * Unique constraint:
   *
   * @@unique([userId, endpoint])
   *
   * Jika browser melakukan subscribe ulang dengan endpoint
   * yang sama, credentials akan diperbarui.
   */

  async upsert(
    data: CreatePushSubscriptionInput
  ) {
    const userId =
      data.userId.trim();

    const endpoint =
      data.endpoint.trim();

    const p256dh =
      data.p256dh.trim();

    const auth =
      data.auth.trim();

    if (
      !userId ||
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      throw new Error(
        "Data push subscription tidak lengkap."
      );
    }

    return prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,

          endpoint,
        },
      },

      create: {
        userId,

        endpoint,

        p256dh,

        auth,

        userAgent:
          data.userAgent?.trim() ||
          null,
      },

      update: {
        p256dh,

        auth,

        userAgent:
          data.userAgent?.trim() ||
          null,

        updatedAt:
          new Date(),
      },
    });
  }

  /**
   * ==========================================================
   * FIND MANY BY USER
   * ==========================================================
   *
   * Hanya mengambil subscription milik user tertentu.
   */

  async findManyByUserId(
    userId: string
  ) {
    return prisma.pushSubscription.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ==========================================================
   * FIND BY USER + ENDPOINT
   * ==========================================================
   */

  async findByUserIdAndEndpoint(
    userId: string,
    endpoint: string
  ) {
    return prisma.pushSubscription.findUnique({
      where: {
        userId_endpoint: {
          userId,

          endpoint,
        },
      },
    });
  }

  /**
   * ==========================================================
   * DELETE ONE
   * ==========================================================
   *
   * userId wajib menjadi bagian dari authorization scope.
   *
   * Kita menggunakan deleteMany karena:
   *
   * - id bukan composite unique dengan userId
   * - userId harus tetap menjadi boundary keamanan
   */

  async delete(
    userId: string,
    id: string
  ) {
    return prisma.pushSubscription.deleteMany({
      where: {
        id,

        userId,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE BY ENDPOINT
   * ==========================================================
   *
   * Digunakan ketika browser melakukan unsubscribe.
   */

  async deleteByEndpoint(
    userId: string,
    endpoint: string
  ) {
    return prisma.pushSubscription.deleteMany({
      where: {
        userId,

        endpoint,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE ALL BY USER
   * ==========================================================
   *
   * Digunakan misalnya ketika user logout dari seluruh
   * perangkat atau melakukan reset notification subscription.
   */

  async deleteManyByUserId(
    userId: string
  ) {
    return prisma.pushSubscription.deleteMany({
      where: {
        userId,
      },
    });
  }

  /**
   * ==========================================================
   * FIND MANY BY USERS
   * ==========================================================
   *
   * Digunakan oleh notification delivery untuk mengambil
   * seluruh subscription milik beberapa user sekaligus.
   *
   * Contoh:
   *
   * ADMIN A
   *   ├── Chrome
   *   └── Edge
   *
   * ADMIN B
   *   └── Chrome
   *
   * Semua subscription tersebut akan menerima push.
   *
   * userIds selalu berasal dari server-side recipient resolution.
   */

  async findManyByUserIds(
    userIds: string[]
  ) {
    const normalizedUserIds = [
      ...new Set(
        userIds
          .map((id) => id.trim())
          .filter(Boolean)
      ),
    ];

    if (normalizedUserIds.length === 0) {
      return [];
    }

    return prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: normalizedUserIds,
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ==========================================================
   * COUNT BY USER
   * ==========================================================
   */

  async countByUserId(
    userId: string
  ) {
    return prisma.pushSubscription.count({
      where: {
        userId,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE MANY
   * ==========================================================
   *
   * Maintenance internal.
   *
   * Method ini bukan untuk operasi user-facing.
   */

  async deleteMany(
    where: Prisma.PushSubscriptionWhereInput
  ) {
    return prisma.pushSubscription.deleteMany({
      where,
    });
  }
}

const pushSubscriptionRepository =
  new PushSubscriptionRepository();

export default pushSubscriptionRepository;
