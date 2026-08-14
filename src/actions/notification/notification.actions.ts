"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import notificationService from "@/services/notification/notification.service";

/**
 * ============================================================
 * NOTIFICATION ACTIONS
 * ============================================================
 *
 * Server Actions untuk:
 *
 * - Mengambil notifikasi terbaru
 * - Menghitung notifikasi belum dibaca
 * - Menandai notifikasi sebagai sudah dibaca
 * - Menandai semua notifikasi sebagai sudah dibaca
 *
 * ============================================================
 */

export interface NotificationActionItem {
  id: string;

  title: string;

  message: string;

  type: string;

  href: string | null;

  isRead: boolean;

  createdAt: Date;
}

export interface GetNotificationsResult {
  success: boolean;

  notifications: NotificationActionItem[];

  unreadCount: number;
}

/**
 * ============================================================
 * GET NOTIFICATIONS
 * ============================================================
 */

export async function getNotificationsAction(): Promise<GetNotificationsResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        notifications: [],
        unreadCount: 0,
      };
    }

    const [notifications, unreadCount] =
      await Promise.all([
        notificationService.getLatestNotifications({
          take: 10,
        }),

        notificationService.getUnreadCount(),
      ]);

    return {
      success: true,

      notifications: notifications.map(
        (notification) => ({
          id: notification.id,

          title: notification.title,

          message: notification.message,

          type: notification.type,

          href: notification.href,

          isRead: notification.isRead,

          createdAt: notification.createdAt,
        })
      ),

      unreadCount,
    };
  } catch (error) {
    console.error(
      "[GET_NOTIFICATIONS_ACTION]",
      error
    );

    return {
      success: false,

      notifications: [],

      unreadCount: 0,
    };
  }
}

/**
 * ============================================================
 * MARK NOTIFICATION AS READ
 * ============================================================
 */

export async function markNotificationAsReadAction(
  notificationId: string
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    await notificationService.markAsRead(
      notificationId
    );

    revalidatePath("/admin");

    return {
      success: true,
      message:
        "Notifikasi berhasil ditandai sudah dibaca.",
    };
  } catch (error) {
    console.error(
      "[MARK_NOTIFICATION_AS_READ_ACTION]",
      error
    );

    return {
      success: false,
      message:
        "Gagal memperbarui notifikasi.",
    };
  }
}

/**
 * ============================================================
 * MARK ALL NOTIFICATIONS AS READ
 * ============================================================
 */

export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    await notificationService.markAllAsRead();

    revalidatePath("/admin");

    return {
      success: true,
      message:
        "Semua notifikasi telah ditandai sudah dibaca.",
    };
  } catch (error) {
    console.error(
      "[MARK_ALL_NOTIFICATIONS_AS_READ_ACTION]",
      error
    );

    return {
      success: false,
      message:
        "Gagal memperbarui notifikasi.",
    };
  }
}