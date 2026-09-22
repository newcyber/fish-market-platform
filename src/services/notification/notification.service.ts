import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import notificationRepository from "@/repositories/notification/notification.repository";

import pushDeliveryService from "@/services/notification/push/push-delivery.service";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

import { renderOrderNotificationTemplate } from "@/services/notification/order-notification-template";

import settingsRepository from "@/repositories/settings/settings.repository";

/**
 * ============================================================
 * NOTIFICATION SERVICE
 * ============================================================
 *
 * Business logic untuk Notification.
 *
 * Prinsip:
 *
 * - Notification selalu mempunyai recipient user.
 * - User-facing query selalu user-scoped.
 * - Event system dapat melakukan broadcast ke beberapa user.
 *
 * Push notification:
 *
 * - Bersifat best-effort.
 * - Kegagalan push tidak menggagalkan notification database.
 * - Kegagalan push tidak menggagalkan checkout/order.
 * - Detail Web Push ditangani oleh PushDeliveryService.
 *
 * ============================================================
 */

export interface CreateOrderNotificationInput {
  orderId: string;

  orderNumber: string;

  customerName?: string | null;

  totalAmount?: number | null;
}

export interface NotificationListOptions {
  userId: string;

  take?: number;

  skip?: number;

  unreadOnly?: boolean;
}

export interface CreatePaymentProofNotificationInput {
  orderId: string;
  orderNumber: string;
  paymentProofId: string;
  confirmationEventId?: string;
}

export interface CreateCustomerPaymentNotificationInput {
  paymentProofId: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface CreateCustomerOrderStatusNotificationInput {
  userId: string;
  orderId: string;
  orderNumber: string;
  status: string;
}

export interface CreateCustomerRewardPointsNotificationInput {
  userId: string;
  orderId: string;
  orderNumber: string;
  points: number;
}

class NotificationService {
  /**
   * ==========================================================
   * CREATE ORDER NOTIFICATION
   * ==========================================================
   *
   * Order baru harus diberitahukan kepada seluruh ADMIN
   * dan SUPER_ADMIN aktif.
   *
   * Customer yang membuat order BUKAN recipient notification
   * admin ini.
   *
   * Flow:
   *
   * Order
   *   ↓
   * resolve active admin recipients
   *   ↓
   * create Notification records
   *   ↓
   * PushDeliveryService
   *   ↓
   * seluruh device recipient
   *
   * Push bersifat best-effort.
   */

  async createOrderNotification(input: CreateOrderNotificationInput) {
    /**
     * --------------------------------------------------------
     * VALIDATE ORDER ID
     * --------------------------------------------------------
     */

    const orderId = input.orderId?.trim();

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    /**
     * --------------------------------------------------------
     * NORMALIZE MESSAGE DATA
     * --------------------------------------------------------
     */

    const orderNumber = input.orderNumber?.trim() || "Pesanan Baru";

    const customerName = input.customerName?.trim() || "Customer";

    const formattedTotal =
      typeof input.totalAmount === "number"
        ? new Intl.NumberFormat("id-ID", {
            style: "currency",

            currency: "IDR",

            minimumFractionDigits: 0,
          }).format(input.totalAmount)
        : null;

    /**
     * ========================================================
     * LOAD WAPI ORDER NOTIFICATION SETTINGS
     * ========================================================
     *
     * Pengaturan template dibaca dari StoreSettings.
     * Jika template kosong, helper akan menggunakan
     * default template.
     */
    const wapiSettings =
      await settingsRepository.getWapiOrderNotificationSettings();

    /**
     * ========================================================
     * LOAD ORDER DETAILS FOR WHATSAPP MESSAGE
     * ========================================================
     *
     * Mengambil snapshot item dari OrderItem agar detail
     * produk sesuai dengan kondisi ketika checkout dibuat.
     */
    const orderDetails = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        notes: true,
        shippingProvider: true,
        shippingService: true,
        items: {
          orderBy: {
            id: "asc",
          },
          select: {
            productName: true,
            productVariant: true,
            productWeight: true,
            weightSku: true,
            weightGrams: true,
            quantity: true,
            customerNote: true,
          },
        },
      },
    });

    /**
     * ========================================================
     * FORMAT ORDER ITEMS
     * ========================================================
     *
     * Contoh hasil:
     *
     * Ikan Kakap Merah | 1 Kg Dibersihkan x2
     * Ikan Tuna | 500 gram | Dibersihkan x2
     */
    const orderItems =
      orderDetails?.items
        .map((item) => {
          const productName = item.productName.trim();

          const productWeight =
            item.productWeight?.trim() ||
            item.weightSku?.trim() ||
            (typeof item.weightGrams === "number"
              ? `${item.weightGrams} gram`
              : "");

          const productVariant = item.productVariant?.trim() || "";

          const productOptions = [productWeight, productVariant]
            .filter(Boolean)
            .join(" ");

          const productLabel = [productName, productOptions]
            .filter(Boolean)
            .join(" | ");

          return `${productLabel} x${item.quantity}`;
        })
        .join("\n") || "Tidak ada detail produk";

    /**
     * ========================================================
     * FORMAT SHIPPING METHOD
     * ========================================================
     */
    const shippingMethod =
      [
        orderDetails?.shippingProvider?.trim(),
        orderDetails?.shippingService?.trim(),
      ]
        .filter(Boolean)
        .join(" | ") || "Metode pengiriman belum ditentukan";

    /**
     * ========================================================
     * FORMAT ORDER NOTE
     * ========================================================
     */
    const orderNote = orderDetails?.notes?.trim() || "-";

    /**
     * ========================================================
     * RENDER WAPI MESSAGE
     * ========================================================
     */
    const message = renderOrderNotificationTemplate(wapiSettings.template, {
      orderNumber,
      customerName,
      orderTotal: formattedTotal ?? "Tidak tersedia",
      orderItems,
      shippingMethod,
      orderNote,
    });

    /**
     * ========================================================
     * GET ACTIVE ADMIN RECIPIENTS
     * ========================================================
     *
     * Recipient ditentukan sepenuhnya oleh server.
     */

    const recipients = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },

        isActive: true,

        deletedAt: null,
      },

      select: {
        id: true,
        phone: true,
      },
    });

    /**
     * --------------------------------------------------------
     * NO ACTIVE RECIPIENT
     * --------------------------------------------------------
     */

    if (recipients.length === 0) {
      return {
        count: 0,

        push: {
          totalSubscriptions: 0,
          sent: 0,
          failed: 0,
          removed: 0,
        },
      };
    }

    /**
     * ========================================================
     * CREATE NOTIFICATIONS
     * ========================================================
     *
     * createManyAndReturn() digunakan karena kita membutuhkan
     * ID notification untuk payload Web Push.
     */

    const notifications = await notificationRepository.createManyAndReturn(
      recipients.map((recipient) => ({
        userId: recipient.id,

        title: "Pesanan Baru",

        message,

        type: NotificationType.NEW_ORDER,

        href: `/admin/orders/${orderId}`,

        orderId,
      })),
    );

    /**
     * ========================================================
     * WEB PUSH DELIVERY
     * ========================================================
     *
     * Push tidak boleh menggagalkan proses order.
     *
     * PushDeliveryService menangani:
     *
     * - pencarian subscription
     * - pengiriman ke seluruh device
     * - invalid subscription 404/410
     * - cleanup subscription invalid
     * - error handling per subscription
     */

    let pushResult = {
      totalNotifications: 0,
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      removed: 0,
    };

    try {
      pushResult = await pushDeliveryService.deliver({
        notifications: notifications.map((notification) => ({
          userId: notification.userId,

          notificationId: notification.id,

          title: notification.title,

          message: notification.message,

          href: notification.href,

          type: notification.type,

          createdAt: notification.createdAt,
        })),
      });
    } catch (error) {
      console.error("[WEB_PUSH_DELIVERY_FATAL_ERROR]", error);
    }

    /**
     * ========================================================
     * WHATSAPP DELIVERY
     * ========================================================
     *
     * WhatsApp bersifat best-effort.
     *
     * Jika nomor tidak tersedia:
     * - dilewati
     *
     * Jika gateway gagal:
     * - tidak menggagalkan order
     * - tidak menggagalkan notification database
     * - error hanya dicatat ke log
     */

    /**
     * ========================================================
     * WHATSAPP ORDER NOTIFICATION
     * ========================================================
     *
     * Pengiriman WhatsApp dapat dinonaktifkan melalui
     * Admin Settings tanpa menghentikan notifikasi push.
     */

    const whatsappResult = {
      recipients: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      disabled: !wapiSettings.enabled,
    };

    if (wapiSettings.enabled) {
      for (const recipient of recipients) {
        const phone = recipient.phone?.trim();

        if (!phone) {
          whatsappResult.skipped += 1;
          continue;
        }

        whatsappResult.recipients += 1;

        try {
          await whatsappService.sendText({
            phone,
            message,
          });

          whatsappResult.sent += 1;
        } catch (error) {
          whatsappResult.failed += 1;

          console.error("[WHATSAPP_ORDER_NOTIFICATION_ERROR]", {
            userId: recipient.id,
            error,
          });
        }
      }
    }

    /**
     * ========================================================
     * RESULT
     * ========================================================
     */

    return {
      count: notifications.length,

      push: pushResult,

      whatsapp: whatsappResult,
    };
  }

  /**
   * ==========================================================
   * CREATE PAYMENT PROOF NOTIFICATION
   * ==========================================================
   *
   * Bukti pembayaran baru harus diberitahukan kepada seluruh
   * ADMIN dan SUPER_ADMIN aktif.
   *
   * Customer yang upload bukti BUKAN recipient notification
   * admin ini.
   *
   * Push bersifat best-effort.
   */

  async createPaymentProofNotification(
    input: CreatePaymentProofNotificationInput,
  ) {
    /**
     * --------------------------------------------------------
     * VALIDATE ORDER ID
     * --------------------------------------------------------
     */

    const orderId = input.orderId?.trim();

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    const paymentProofId = input.paymentProofId?.trim();

    if (!paymentProofId) {
      throw new Error("Payment proof ID tidak valid.");
    }

    const confirmationEventId = input.confirmationEventId?.trim();

    if (!confirmationEventId) {
      throw new Error("Confirmation event ID tidak valid.");
    }

    /**
     * --------------------------------------------------------
     * NORMALIZE MESSAGE DATA
     * --------------------------------------------------------
     */

    const orderNumber = input.orderNumber?.trim() || "Pesanan";

    const message = `Konfirmasi pembayaran baru untuk pesanan ${orderNumber}.`;

    /**
     * ========================================================
     * GET ACTIVE ADMIN RECIPIENTS
     * ========================================================
     */

    const recipients = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },

        isActive: true,

        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    /**
     * --------------------------------------------------------
     * NO ACTIVE RECIPIENT
     * --------------------------------------------------------
     */

    if (recipients.length === 0) {
      return {
        count: 0,

        push: {
          totalSubscriptions: 0,
          sent: 0,
          failed: 0,
          removed: 0,
        },
      };
    }

    /**
     * ========================================================
     * CREATE NOTIFICATIONS
     * ========================================================
     */

    const notificationResults = await Promise.all(
      recipients.map(async (recipient) => {
        const eventKey = `PAYMENT_CONFIRMATION:${confirmationEventId}:${recipient.id}`;

        return notificationRepository.createIdempotent({
          userId: recipient.id,
          title: "Konfirmasi Pembayaran QRIS",
          message,
          type: NotificationType.PAYMENT_PROOF,
          href: "/admin/payments",
          orderId,
          eventKey,
        });
      }),
    );

    const notifications = notificationResults
      .filter((result) => result.created)
      .map((result) => result.notification);

    /**
     * ========================================================
     * WEB PUSH DELIVERY
     * ========================================================
     *
     * Push bersifat best-effort dan tidak boleh menggagalkan
     * proses upload bukti pembayaran.
     */

    let pushResult = {
      totalNotifications: 0,
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      removed: 0,
    };

    try {
      pushResult = await pushDeliveryService.deliver({
        notifications: notifications.map((notification) => ({
          userId: notification.userId,

          notificationId: notification.id,

          title: notification.title,

          message: notification.message,

          href: notification.href,

          type: notification.type,

          createdAt: notification.createdAt,
        })),
      });
    } catch (error) {
      console.error("[WEB_PUSH_PAYMENT_PROOF_FATAL_ERROR]", error);
    }

    /**
     * ========================================================
     * RESULT
     * ========================================================
     */

    return {
      count: notifications.length,

      push: pushResult,
    };
  }

  /**
   * ==========================================================
   * CREATE CUSTOMER PAYMENT NOTIFICATION
   * ==========================================================
   *
   * Notification untuk pemilik pesanan.
   *
   * Database notification menggunakan eventKey idempotent.
   * Web Push bersifat best-effort.
   *
   * Event key:
   * - PAYMENT_PROOF:{paymentProofId}:VERIFIED
   * - PAYMENT_PROOF:{paymentProofId}:REJECTED
   *
   * Push hanya dikirim ketika notification baru berhasil dibuat.
   * ==========================================================
   */

  async createCustomerPaymentNotification(
    input: CreateCustomerPaymentNotificationInput,
  ) {
    const paymentProofId = input.paymentProofId?.trim();
    const userId = input.userId?.trim();
    const orderId = input.orderId?.trim();
    const orderNumber = input.orderNumber?.trim() || "Pesanan";
    const title = input.title?.trim();
    const message = input.message?.trim();

    /*
     * --------------------------------------------------------
     * VALIDATE INPUT
     * --------------------------------------------------------
     */

    if (!paymentProofId) {
      throw new Error("Payment proof ID tidak valid.");
    }

    if (!userId) {
      throw new Error("User ID customer tidak valid.");
    }

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    if (!title) {
      throw new Error("Judul notifikasi tidak valid.");
    }

    if (!message) {
      throw new Error("Pesan notifikasi tidak valid.");
    }

    /*
     * --------------------------------------------------------
     * RESOLVE PAYMENT EVENT
     * --------------------------------------------------------
     *
     * NotificationType.PAYMENT_VERIFIED digunakan untuk event
     * pembayaran yang berhasil diverifikasi.
     *
     * NotificationType.SYSTEM digunakan oleh caller saat
     * pembayaran ditolak.
     */

    const paymentEvent =
      input.type === NotificationType.PAYMENT_VERIFIED
        ? "VERIFIED"
        : "REJECTED";

    /*
     * --------------------------------------------------------
     * IDEMPOTENCY EVENT KEY
     * --------------------------------------------------------
     *
     * Setiap payment proof memiliki event key terpisah
     * untuk VERIFIED dan REJECTED.
     */

    const eventKey = `PAYMENT_PROOF:${paymentProofId}:${paymentEvent}`;

    /*
     * --------------------------------------------------------
     * CREATE DATABASE NOTIFICATION
     * --------------------------------------------------------
     *
     * createIdempotent() akan:
     *
     * 1. Membuat notification jika eventKey belum ada.
     * 2. Mengambil notification existing jika eventKey
     *    sudah pernah diproses.
     * 3. Mengembalikan flag created untuk kontrol Web Push.
     */

    const { notification, created } =
      await notificationRepository.createIdempotent({
        userId,
        title,
        message,
        type: input.type,
        href: `/customer/orders/${orderId}`,
        orderId,
        eventKey,
      });

    /*
     * --------------------------------------------------------
     * WEB PUSH DELIVERY
     * --------------------------------------------------------
     *
     * Push hanya dikirim apabila notification baru dibuat.
     *
     * Jika eventKey sudah ada:
     * - Tidak membuat notification duplikat.
     * - Tidak mengirim push ulang.
     *
     * Kegagalan Web Push tidak menggagalkan proses notification
     * database yang sudah berhasil dibuat.
     */

    let pushResult = {
      totalNotifications: 0,
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      removed: 0,
    };

    if (created) {
      try {
        pushResult = await pushDeliveryService.deliver({
          notifications: [
            {
              userId: notification.userId,
              notificationId: notification.id,
              title: notification.title,
              message: notification.message,
              href: notification.href,
              type: notification.type,
              createdAt: notification.createdAt,
            },
          ],
        });
      } catch (error) {
        console.error("[WEB_PUSH_CUSTOMER_PAYMENT_ERROR]", error);
      }
    }

    /*
     * --------------------------------------------------------
     * RETURN RESULT
     * --------------------------------------------------------
     */

    return {
      count: created ? 1 : 0,
      notification,
      created,
      eventKey,
      push: pushResult,
    };
  }

  /**
   * ==========================================================
   * CREATE CUSTOMER ORDER STATUS NOTIFICATION
   * ==========================================================
   *
   * Memberikan notifikasi kepada customer ketika status
   * order berubah, misalnya PROCESSING → SHIPPING.
   *
   * Database notification wajib berhasil dibuat.
   * Web Push bersifat best-effort.
   *
   * Idempotency:
   * - ORDER_STATUS:{orderId}:{status}
   *
   * Event yang sama tidak membuat notification database
   * baru dan tidak mengirim Web Push ulang.
   *
   * ==========================================================
   */

  async createCustomerOrderStatusNotification(
    input: CreateCustomerOrderStatusNotificationInput,
  ) {
    /**
     * --------------------------------------------------------
     * NORMALIZE INPUT
     * --------------------------------------------------------
     */

    const userId = input.userId?.trim();
    const orderId = input.orderId?.trim();
    const orderNumber = input.orderNumber?.trim() || "Pesanan";
    const status = input.status?.trim().toUpperCase();

    /**
     * --------------------------------------------------------
     * VALIDATE INPUT
     * --------------------------------------------------------
     */

    if (!userId) {
      throw new Error("User ID customer tidak valid.");
    }

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    if (!status) {
      throw new Error("Status order tidak valid.");
    }

    /**
     * --------------------------------------------------------
     * PREPARE NOTIFICATION CONTENT
     * --------------------------------------------------------
     */

    const statusMessageMap: Record<
      string,
      {
        title: string;
        message: string;
      }
    > = {
      SHIPPING: {
        title: "Pesanan sedang dikirim 🚚",
        message: `Pesanan ${orderNumber} sedang dalam perjalanan menuju alamat Anda.`,
      },

      COMPLETED: {
        title: "Pesanan selesai 🎉",
        message: `Pesanan ${orderNumber} telah selesai.`,
      },

      CANCELLED: {
        title: "Pesanan dibatalkan",
        message: `Pesanan ${orderNumber} telah dibatalkan.`,
      },
    };

    const notificationContent = statusMessageMap[status] ?? {
      title: "Status pesanan diperbarui",
      message: `Status pesanan ${orderNumber} telah diperbarui.`,
    };

    /**
     * --------------------------------------------------------
     * PREPARE IDEMPOTENCY EVENT KEY
     * --------------------------------------------------------
     *
     * Contoh:
     * ORDER_STATUS:order-id:SHIPPING
     * ORDER_STATUS:order-id:COMPLETED
     *
     * Satu order hanya memiliki satu event notification
     * untuk setiap status.
     */

    const eventKey = `ORDER_STATUS:${orderId}:${status}`;

    /**
     * --------------------------------------------------------
     * CREATE DATABASE NOTIFICATION IDEMPOTENT
     * --------------------------------------------------------
     *
     * created:
     * - true  = notification baru berhasil dibuat
     * - false = event sudah pernah diproses
     */

    const notificationResult = await notificationRepository.createIdempotent({
      userId,
      title: notificationContent.title,
      message: notificationContent.message,
      type: NotificationType.ORDER_STATUS,
      href: `/customer/orders/${orderId}`,
      orderId,
      eventKey,
    });

    const { notification, created } = notificationResult;

    /**
     * --------------------------------------------------------
     * WEB PUSH DELIVERY
     * --------------------------------------------------------
     *
     * Push hanya dikirim ketika notification baru dibuat.
     *
     * Jika event yang sama diproses ulang:
     * - Database tidak membuat record baru.
     * - Web Push tidak dikirim ulang.
     */

    let pushResult = {
      totalNotifications: 0,
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      removed: 0,
    };

    if (created) {
      try {
        pushResult = await pushDeliveryService.deliver({
          notifications: [
            {
              userId: notification.userId,
              notificationId: notification.id,
              title: notification.title,
              message: notification.message,
              href: notification.href,
              type: notification.type,
              createdAt: notification.createdAt,
            },
          ],
        });
      } catch (error) {
        console.error("[WEB_PUSH_CUSTOMER_ORDER_STATUS_ERROR]", error);
      }
    }

    /**
     * --------------------------------------------------------
     * RETURN RESULT
     * --------------------------------------------------------
     */

    return {
      count: created ? 1 : 0,
      notification,
      created,
      push: pushResult,
    };
  }

  /**
   * ==========================================================
   * CREATE CUSTOMER REWARD POINTS NOTIFICATION
   * ==========================================================
   *
   * Memberikan notifikasi kepada customer ketika reward point
   * berhasil diberikan setelah order berstatus COMPLETED.
   *
   * Database notification wajib berhasil dibuat.
   * Web Push bersifat best-effort.
   */

  /**
   * ==========================================================
   * CREATE CUSTOMER REWARD POINTS NOTIFICATION
   * ==========================================================
   *
   * Memberikan notifikasi kepada customer ketika reward point
   * berhasil diberikan setelah order berstatus COMPLETED.
   *
   * Database notification menggunakan eventKey idempotent.
   * Web Push bersifat best-effort dan hanya dikirim ketika
   * notification baru berhasil dibuat.
   */
  async createCustomerRewardPointsNotification(
    input: CreateCustomerRewardPointsNotificationInput,
  ) {
    const userId = input.userId?.trim();
    const orderId = input.orderId?.trim();
    const orderNumber = input.orderNumber?.trim() || "Pesanan";
    const points = Number(input.points);

    /*
     * --------------------------------------------------------
     * VALIDATE INPUT
     * --------------------------------------------------------
     */

    if (!userId) {
      throw new Error("User ID customer tidak valid.");
    }

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    if (!Number.isFinite(points) || points <= 0) {
      throw new Error("Jumlah reward point tidak valid.");
    }

    const formattedPoints = new Intl.NumberFormat("id-ID").format(points);

    const title = "Reward point berhasil 🎁";

    const message =
      `Selamat! Anda mendapatkan ${formattedPoints} poin reward ` +
      `dari pesanan ${orderNumber}. Terima kasih telah berbelanja ` +
      `di Pisjo Market.`;

    /*
     * --------------------------------------------------------
     * IDEMPOTENCY EVENT KEY
     * --------------------------------------------------------
     *
     * Satu order hanya memiliki satu event reward points EARN.
     */
    const eventKey = `REWARD_POINTS:${orderId}:EARN`;

    /*
     * --------------------------------------------------------
     * CREATE DATABASE NOTIFICATION
     * --------------------------------------------------------
     */

    const { notification, created } =
      await notificationRepository.createIdempotent({
        userId,
        title,
        message,
        type: NotificationType.SYSTEM,
        href: `/customer/orders/${orderId}`,
        orderId,
        eventKey,
      });

    /*
     * --------------------------------------------------------
     * WEB PUSH DELIVERY
     * --------------------------------------------------------
     *
     * Push hanya dikirim ketika notification baru dibuat.
     * Jika event sudah pernah diproses, push dilewati.
     */

    let pushResult = {
      totalNotifications: 0,
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      removed: 0,
    };

    if (created) {
      try {
        pushResult = await pushDeliveryService.deliver({
          notifications: [
            {
              userId: notification.userId,
              notificationId: notification.id,
              title: notification.title,
              message: notification.message,
              href: notification.href,
              type: notification.type,
              createdAt: notification.createdAt,
            },
          ],
        });
      } catch (error) {
        console.error("[WEB_PUSH_CUSTOMER_REWARD_POINTS_ERROR]", error);
      }
    }

    return {
      count: created ? 1 : 0,
      notification,
      created,
      push: pushResult,
    };
  }

  /**
   * ==========================================================
   * GET LATEST NOTIFICATIONS
   * ==========================================================
   */

  async getLatestNotifications(options: NotificationListOptions) {
    const userId = options.userId?.trim();

    if (!userId) {
      throw new Error("User ID tidak valid.");
    }

    return notificationRepository.findMany({
      userId,

      take: options.take ?? 20,

      skip: options.skip ?? 0,

      unreadOnly: options.unreadOnly ?? false,
    });
  }

  /**
   * ==========================================================
   * COUNT UNREAD
   * ==========================================================
   */

  async getUnreadCount(userId: string) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      throw new Error("User ID tidak valid.");
    }

    return notificationRepository.countUnread(normalizedUserId);
  }

  /**
   * ==========================================================
   * GET UNREAD COUNT BY TYPE
   * ==========================================================
   */

  async getUnreadCountByType(userId: string, type: NotificationType) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      throw new Error("User ID tidak valid.");
    }

    return notificationRepository.countUnreadByType(normalizedUserId, type);
  }

  /**
   * ==========================================================
   * MARK AS READ
   * ==========================================================
   */

  async markAsRead(userId: string, notificationId: string) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      throw new Error("User ID tidak valid.");
    }

    const normalizedNotificationId = notificationId?.trim();

    if (!normalizedNotificationId) {
      throw new Error("ID notifikasi tidak valid.");
    }

    return notificationRepository.markAsRead(
      normalizedUserId,
      normalizedNotificationId,
    );
  }

  /**
   * ==========================================================
   * MARK ALL AS READ
   * ==========================================================
   */

  async markAllAsRead(userId: string) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      throw new Error("User ID tidak valid.");
    }

    return notificationRepository.markAllAsRead(normalizedUserId);
  }

  /**
   * ==========================================================
   * DELETE NOTIFICATION
   * ==========================================================
   */

  async deleteNotification(userId: string, notificationId: string) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      throw new Error("User ID tidak valid.");
    }

    const normalizedNotificationId = notificationId?.trim();

    if (!normalizedNotificationId) {
      throw new Error("ID notifikasi tidak valid.");
    }

    return notificationRepository.delete(
      normalizedUserId,
      normalizedNotificationId,
    );
  }
}

const notificationService = new NotificationService();

export default notificationService;
