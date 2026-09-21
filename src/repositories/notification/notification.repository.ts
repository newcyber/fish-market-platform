
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
  orderId?: string | null;
  eventKey?: string | null;
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

  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title.trim(),
        message: data.message.trim(),
        type: data.type,
        href: data.href?.trim() || null,
        orderId: data.orderId?.trim() || null,
        eventKey: data.eventKey?.trim() || null,
      },
    });
  }

    /**
   * ==========================================================
   * CREATE IDEMPOTENT
   * ==========================================================
   *
   * Membuat notification berdasarkan eventKey unik.
   *
   * Perilaku:
   * - Event baru       => created: true
   * - Event duplikat   => created: false
   * - Race condition   => ditangani melalui P2002
   *
   * Digunakan untuk event yang tidak boleh menghasilkan
   * notification berulang, misalnya:
   *
   * - Order SHIPPING
   * - Order COMPLETED
   * - Reward points
   *
   * ==========================================================
   */

  async createIdempotent(
    data: CreateNotificationInput & {
      eventKey: string;
    },
  ) {
    const eventKey = data.eventKey.trim();

    if (!eventKey) {
      throw new Error(
        "eventKey wajib diisi untuk notification idempotent.",
      );
    }

    try {
      const notification = await this.create({
        ...data,
        eventKey,
      });

      return {
        notification,
        created: true,
      };
    } catch (error) {
      /**
       * P2002 = unique constraint violation.
       *
       * Karena eventKey memiliki unique index, error ini
       * dapat terjadi ketika event yang sama diproses
       * secara bersamaan oleh beberapa request/worker.
       */
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError
        ) ||
        error.code !== "P2002"
      ) {
        throw error;
      }

      const existingNotification =
        await prisma.notification.findUnique({
          where: {
            eventKey,
          },
        });

      /**
       * Jika data tidak ditemukan, jangan menyembunyikan
       * error asli karena kemungkinan konflik berasal
       * dari kondisi lain.
       */
      if (!existingNotification) {
        throw error;
      }

      return {
        notification: existingNotification,
        created: false,
      };
    }
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
   * Masing-masing mendapatkan notification sendiri.
   *
   * Method ini hanya mengembalikan count.
   */

  async createMany(data: CreateNotificationInput[]) {
    if (data.length === 0) {
      return {
        count: 0,
      };
    }

    return prisma.notification.createMany({
      data: data.map((item) => ({
        userId: item.userId,
        title: item.title.trim(),
        message: item.message.trim(),
        type: item.type,
        href: item.href?.trim() || null,
        orderId: item.orderId?.trim() || null,
        eventKey: item.eventKey?.trim() || null,
      })),
    });
  }

  /**
   * ==========================================================
   * CREATE MANY AND RETURN
   * ==========================================================
   *
   * Digunakan ketika setiap notification membutuhkan ID
   * hasil insert.
   */

  async createManyAndReturn(data: CreateNotificationInput[]) {
    if (data.length === 0) {
      return [];
    }

    return prisma.notification.createManyAndReturn({
      data: data.map((item) => ({
        userId: item.userId,
        title: item.title.trim(),
        message: item.message.trim(),
        type: item.type,
        href: item.href?.trim() || null,
        orderId: item.orderId?.trim() || null,
        eventKey: item.eventKey?.trim() || null,
      })),
    });
  }

  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   *
   * Hanya mengambil notification milik user tertentu.
   */

  async findMany(options: NotificationListOptions) {
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
        createdAt: "desc",
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

  async findById(userId: string, id: string) {
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

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * ==========================================================
   * COUNT UNREAD BY TYPE
   * ==========================================================
   *
   * Digunakan oleh UI yang membutuhkan counter spesifik
   * berdasarkan jenis notification.
   */

  async countUnreadByType(
    userId: string,
    type: NotificationType,
  ) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
        type,
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
   */

  async markAsRead(userId: string, id: string) {
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

  async markAllAsRead(userId: string) {
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
   * Operasi delete tetap user-scoped.
   */

  async delete(userId: string, id: string) {
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
    where: Prisma.NotificationWhereInput,
  ) {
    return prisma.notification.deleteMany({
      where,
    });
  }
}

const notificationRepository =
  new NotificationRepository();

export default notificationRepository;
