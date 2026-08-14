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
 * Tanggung jawab:
 *
 * - Membuat notifikasi
 * - Mengambil notifikasi terbaru
 * - Menghitung notifikasi belum dibaca
 * - Menandai notifikasi sudah dibaca
 * - Menandai semua notifikasi sudah dibaca
 * - Menghapus notifikasi
 *
 * ============================================================
 */

export interface CreateNotificationInput {
  title: string;

  message: string;

  type: NotificationType;

  href?: string | null;
}

export interface NotificationListOptions {
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
        title: data.title.trim(),

        message: data.message.trim(),

        type: data.type,

        href:
          data.href?.trim() || null,
      },
    });
  }

  /**
   * ==========================================================
   * FIND MANY
   * ==========================================================
   *
   * Mengambil daftar notifikasi terbaru.
   */

  async findMany(
    options: NotificationListOptions = {}
  ) {
    const {
      take = 20,
      skip = 0,
      unreadOnly = false,
    } = options;

    return prisma.notification.findMany({
      where: unreadOnly
        ? {
            isRead: false,
          }
        : undefined,

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
   */

  async findById(
    id: string
  ) {
    return prisma.notification.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * ==========================================================
   * COUNT UNREAD
   * ==========================================================
   */

  async countUnread() {
    return prisma.notification.count({
      where: {
        isRead: false,
      },
    });
  }

  /**
   * ==========================================================
   * MARK AS READ
   * ==========================================================
   */

  async markAsRead(
    id: string
  ) {
    return prisma.notification.update({
      where: {
        id,
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

  async markAllAsRead() {
    return prisma.notification.updateMany({
      where: {
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
   */

  async delete(
    id: string
  ) {
    return prisma.notification.delete({
      where: {
        id,
      },
    });
  }

  /**
   * ==========================================================
   * DELETE MANY
   * ==========================================================
   *
   * Digunakan untuk maintenance atau pembersihan
   * notifikasi lama di masa depan.
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