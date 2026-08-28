import {
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * NOTIFICATION REPOSITORY
 * ============================================================
 *
 * Repository untuk seluruh akses database Notification.
 *
 * Prinsip utama:
 *
 * - Notification selalu memiliki userId.
 * - Semua operasi user-facing harus user-scoped.
 * - User tidak boleh membaca / mengubah / menghapus
 *   notification milik user lain.
 *
 * ============================================================
 */

export interface CreateNotificationInput {
  userId: string;

  title: string;

  message: string;

  type: NotificationType;

  href?: string | null;
}

export interface NotificationListOptions {
  userId: string;

  take?: number;

  skip?: number;

  unreadOnly?: boolean;
}

class NotificationRepository {
  /**
   * ==========================================================
   * CREATE
   * ==========================================================
   */

  async create(
    data: CreateNotificationInput
  ) {
    return prisma.notification.create({
      data: {
        userId:
          data.userId,

        title:
          data.title.trim(),

        message:
          data.message.trim(),

        type:
          data.type,

        href:
          data.href?.trim() || null,
      },
    });
  }

  /**
   * ==========================================================
   * CREATE MANY
   * ==========================================================
   *
   * Digunakan ketika satu event harus dikirim ke beberapa user.
   *
   * Contoh:
   *
   * Order baru
   *      ↓
   * ADMIN + SUPER_ADMIN
   *      ↓
   * masing-masing mendapatkan notification sendiri.
   *
   * createMany() sengaja berada di repository agar service
   * tidak perlu mengetahui detail Prisma.
   */

  async createMany(
    data: CreateNotificationInput[]
  ) {
    if (data.length === 0) {
      return {
        count: 0,
      };
    }

    return prisma.notification.createMany({
      data: data.map(
        (item) => ({
          userId:
            item.userId,

          title:
            item.title.trim(),

          message:
            item.message.trim(),

          type:
            item.type,

          href:
            item.href?.trim() || null,
        })
      ),
    });
  }

  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   *
   * Hanya mengambil notification milik user tertentu.
   */

  async findMany(
    options: NotificationListOptions
  ) {
    const {
      userId,
      take = 20,
      skip = 0,
      unreadOnly = false,
    } = options;

    return prisma.notification.findMany({
      where: {
        userId,

        ...(unreadOnly
          ? {
              isRead: false,
            }
          : {}),
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take,

      skip,
    });
  }

  /**
   * ==========================================================
   * FIND BY ID
   * ==========================================================
   *
   * ID saja tidak cukup.
   *
   * UserId harus ikut digunakan sebagai authorization scope.
   */

  async findById(
    userId: string,
    id: string
  ) {
    return prisma.notification.findFirst({
      where: {
        id,

        userId,
      },
    });
  }

  /**
   * ==========================================================
   * COUNT UNREAD
   * ==========================================================
   */

  async countUnread(
    userId: string
  ) {
    return prisma.notification.count({
      where: {
        userId,

        isRead: false,
      },
    });
  }

  /**
   * ==========================================================
   * MARK AS READ
   * ==========================================================
   *
   * updateMany digunakan agar userId menjadi bagian dari
   * authorization scope.
   *
   * Jika notification bukan milik user tersebut:
   *
   * count = 0
   *
   * Tidak ada data user lain yang berubah.
   */

  async markAsRead(
    userId: string,
    id: string
  ) {
    return prisma.notification.updateMany({
      where: {
        id,

        userId,

        isRead: false,
      },

      data: {
        isRead: true,
      },
    });
  }

  /**
   * ==========================================================
   * MARK ALL AS READ
   * ==========================================================
   */

  async markAllAsRead(
    userId: string
  ) {
    return prisma.notification.updateMany({
      where: {
        userId,

        isRead: false,
      },

      data: {
        isRead: true,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE
   * ==========================================================
   *
   * Jangan menggunakan delete({ where: { id } }) karena
   * notification sekarang user-scoped.
   *
   * ID notification tidak boleh menjadi satu-satunya
   * authorization boundary.
   *
   * deleteMany() digunakan karena id + userId belum menjadi
   * composite unique key pada schema.
   */

  async delete(
    userId: string,
    id: string
  ) {
    return prisma.notification.deleteMany({
      where: {
        id,

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
   * Method ini sengaja tetap menerima Prisma where input
   * karena bukan operasi user-facing langsung.
   */

  async deleteMany(
    where: Prisma.NotificationWhereInput
  ) {
    return prisma.notification.deleteMany({
      where,
    });
  }
}

const notificationRepository =
  new NotificationRepository();

export default notificationRepository;