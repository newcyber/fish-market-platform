import { NotificationType, WapiDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import notificationRepository from "@/repositories/notification/notification.repository";

import pushDeliveryService from "@/services/notification/push/push-delivery.service";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

import { renderOrderNotificationTemplate } from "@/services/notification/order-notification-template";
import WapiCustomerDeliveryService from "@/services/notification/wapi-customer-delivery.service";

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

export interface CreateCustomerOrderCreatedNotificationInput {
  userId: string;
  orderId: string;
  orderNumber: string;
  totalAmount?: number | null;
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
        paymentMethod: true,
        subtotal: true,
        voucherDiscount: true,
        shippingCost: true,
        total: true,
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
     * FORMAT FINANCIAL ORDER DATA
     * ========================================================
     */

    const formatRupiah = (value: unknown): string => {
      const numericValue = Number(value ?? 0);

      if (!Number.isFinite(numericValue)) {
        return "Rp0";
      }

      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(numericValue);
    };

    const paymentMethod =
      orderDetails?.paymentMethod === "BANK_TRANSFER"
        ? "Transfer Bank"
        : orderDetails?.paymentMethod === "QRIS"
          ? "QRIS"
          : orderDetails?.paymentMethod || "Belum ditentukan";

    const orderSubtotal = formatRupiah(orderDetails?.subtotal);
    const voucherDiscount = formatRupiah(orderDetails?.voucherDiscount);
    const shippingCost = formatRupiah(orderDetails?.shippingCost);

    const orderTotal = orderDetails?.total
      ? formatRupiah(orderDetails.total)
      : (formattedTotal ?? "Tidak tersedia");

    /**
     * ========================================================
     * RENDER WAPI MESSAGE
     * ========================================================
     */
    const message = renderOrderNotificationTemplate(wapiSettings.template, {
      orderNumber,
      customerName,
      orderTotal,
      orderItems,
      paymentMethod,
      orderSubtotal,
      voucherDiscount,
      shippingMethod,
      shippingCost,
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

          await prisma.wapiDelivery.upsert({
            where: {
              orderId_userId: {
                orderId,
                userId: recipient.id,
              },
            },
            create: {
              orderId,
              userId: recipient.id,
              phone: "",
              message,
              status: WapiDeliveryStatus.SKIPPED,
              errorMessage: "Recipient tidak memiliki nomor telepon.",
            },
            update: {
              phone: "",
              message,
              status: WapiDeliveryStatus.SKIPPED,
              errorMessage: "Recipient tidak memiliki nomor telepon.",
            },
          });

          continue;
        }

        whatsappResult.recipients += 1;

        const existingDelivery = await prisma.wapiDelivery.findUnique({
          where: {
            orderId_userId: {
              orderId,
              userId: recipient.id,
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (existingDelivery?.status === WapiDeliveryStatus.SENT) {
          whatsappResult.sent += 1;

          console.info("[WHATSAPP_ORDER_NOTIFICATION_ALREADY_SENT]", {
            orderId,
            userId: recipient.id,
            deliveryId: existingDelivery.id,
          });

          continue;
        }

        const delivery = await prisma.wapiDelivery.upsert({
          where: {
            orderId_userId: {
              orderId,
              userId: recipient.id,
            },
          },
          create: {
            orderId,
            userId: recipient.id,
            phone,
            message,
            status: WapiDeliveryStatus.PENDING,
            attempts: 0,
          },
          update: {
            phone,
            message,
          },
        });

        const claimResult = await prisma.wapiDelivery.updateMany({
          where: {
            id: delivery.id,
            status: {
              in: [WapiDeliveryStatus.PENDING, WapiDeliveryStatus.FAILED],
            },
          },
          data: {
            status: WapiDeliveryStatus.PROCESSING,
            phone,
            message,
            errorMessage: null,
            processingStartedAt: new Date(),
          },
        });

        if (claimResult.count === 0) {
          const currentDelivery = await prisma.wapiDelivery.findUnique({
            where: {
              id: delivery.id,
            },
            select: {
              status: true,
            },
          });

          if (currentDelivery?.status === WapiDeliveryStatus.SENT) {
            whatsappResult.sent += 1;
          }

          console.info("[WHATSAPP_ORDER_NOTIFICATION_CLAIM_SKIPPED]", {
            orderId,
            userId: recipient.id,
            deliveryId: delivery.id,
            status: currentDelivery?.status ?? "NOT_FOUND",
          });

          continue;
        }

        try {
          const result = await whatsappService.sendText({
            phone,
            message,
          });

          await prisma.wapiDelivery.update({
            where: {
              id: delivery.id,
            },
            data: {
              status: WapiDeliveryStatus.SENT,
              messageId: result.messageId,
              jid: result.jid,
              attempts: {
                increment: 1,
              },
              errorMessage: null,
              processingStartedAt: null,
              sentAt: new Date(),
            },
          });

          whatsappResult.sent += 1;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown WhatsApp gateway error.";

          await prisma.wapiDelivery.update({
            where: {
              id: delivery.id,
            },
            data: {
              status: WapiDeliveryStatus.FAILED,
              attempts: {
                increment: 1,
              },
              errorMessage,
              processingStartedAt: null,
            },
          });

          whatsappResult.failed += 1;

          console.error("[WHATSAPP_ORDER_NOTIFICATION_ERROR]", {
            orderId,
            userId: recipient.id,
            deliveryId: delivery.id,
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
     * ========================================================
     * VALIDATE INPUT
     * ========================================================
     */

    const orderId = input.orderId?.trim();
    const paymentProofId = input.paymentProofId?.trim();
    const confirmationEventId =
      input.confirmationEventId?.trim();

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    if (!paymentProofId) {
      throw new Error("Payment proof ID tidak valid.");
    }

    if (!confirmationEventId) {
      throw new Error("Confirmation event ID tidak valid.");
    }

    /**
     * ========================================================
     * LOAD LATEST ORDER + PAYMENT PROOF
     * ========================================================
     *
     * Jangan mengandalkan field/relation yang tidak ada di
     * schema OrderItem/Address. Semua field di bawah berasal
     * dari generated Prisma client terbaru project.
     */

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        paymentMethod: true,
        subtotal: true,
        shippingCost: true,
        total: true,
        notes: true,

        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },

        address: {
          select: {
            receiverName: true,
            receiverPhone: true,
            province: true,
            city: true,
            district: true,
            village: true,
            postalCode: true,
            fullAddress: true,
            label: true,
          },
        },

        items: {
          orderBy: {
            id: "asc",
          },
          select: {
            productName: true,
            quantity: true,
            price: true,
            subtotal: true,
          },
        },

        paymentProof: {
          select: {
            id: true,
            image: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Pesanan tidak ditemukan.");
    }

    if (!order.paymentProof) {
      throw new Error("Bukti pembayaran tidak ditemukan.");
    }

    if (order.paymentProof.id !== paymentProofId) {
      throw new Error(
        "Bukti pembayaran tidak sesuai dengan pesanan.",
      );
    }

    /**
     * ========================================================
     * FORMAT HELPERS
     * ========================================================
     */

    const formatRupiah = (value: unknown): string => {
      const numericValue = Number(value ?? 0);

      if (!Number.isFinite(numericValue)) {
        return "Rp0";
      }

      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(numericValue);
    };

    const orderNumber =
      input.orderNumber?.trim() ||
      order.orderNumber.trim();

    const customerName =
      order.user?.name?.trim() ||
      order.user?.email?.trim() ||
      order.user?.phone?.trim() ||
      order.address?.receiverName?.trim() ||
      "Customer";

    const paymentMethod =
      order.paymentMethod || "UNKNOWN";

    const orderItems =
      order.items
        .map((item) => {
          const productName =
            item.productName.trim();

          return `• ${productName} x${item.quantity} — ${formatRupiah(item.subtotal)}`;
        })
        .join("\n") ||
      "• Tidak ada detail produk";

    const shippingAddress =
      order.address?.fullAddress?.trim() ||
      [
        order.address?.receiverName?.trim(),
        order.address?.receiverPhone?.trim(),
        order.address?.label?.trim(),
        order.address?.province?.trim(),
        order.address?.city?.trim(),
        order.address?.district?.trim(),
        order.address?.village?.trim(),
        order.address?.postalCode?.trim(),
      ]
        .filter(Boolean)
        .join(", ") ||
      "-";

    /**
     * ========================================================
     * BUILD PUBLIC URL
     * ========================================================
     */

    const appUrl =
      process.env.APP_URL?.trim() ||
      process.env.AUTH_URL?.trim() ||
      "http://localhost:3000";

    const normalizedAppUrl =
      appUrl.replace(/\/+$/, "");

    const paymentProofPath =
      order.paymentProof.image?.trim() || "";

    const paymentProofUrl =
      paymentProofPath.startsWith("http://") ||
      paymentProofPath.startsWith("https://")
        ? paymentProofPath
        : `${normalizedAppUrl}${
            paymentProofPath.startsWith("/")
              ? paymentProofPath
              : `/${paymentProofPath}`
          }`;

    const orderUrl =
      `${normalizedAppUrl}/admin/orders/${order.id}`;

    /**
     * ========================================================
     * WAPI MESSAGE
     * ========================================================
     */

    const message = [
      "🔔 BUKTI PEMBAYARAN BARU",
      "",
      `Pesanan: ${orderNumber}`,
      `Customer: ${customerName}`,
      "",
      "💰 TOTAL PESANAN",
      formatRupiah(order.total),
      "",
      "📦 DETAIL PESANAN",
      orderItems,
      "",
      "💳 PEMBAYARAN",
      `Metode: ${paymentMethod}`,
      `Status: ${order.paymentStatus}`,
      order.paymentProof.bankName
        ? `Bank: ${order.paymentProof.bankName}`
        : null,
      order.paymentProof.accountName
        ? `Nama Rekening: ${order.paymentProof.accountName}`
        : null,
      order.paymentProof.accountNumber
        ? `No. Rekening: ${order.paymentProof.accountNumber}`
        : null,
      "",
      "🧾 RINGKASAN",
      `Subtotal: ${formatRupiah(order.subtotal)}`,
      `Ongkir: ${formatRupiah(order.shippingCost)}`,
      `Total: ${formatRupiah(order.total)}`,
      "",
      "📍 ALAMAT PENGIRIMAN",
      shippingAddress,
      "",
      "📝 CATATAN",
      order.notes?.trim() || "-",
      "",
      "🖼️ BUKTI PEMBAYARAN",
      paymentProofUrl,
      "",
      "🔎 BUKA ORDER",
      orderUrl,
      "",
      "⚠️ Status: MENUNGGU VERIFIKASI",
    ]
      .filter(
        (line): line is string =>
          line !== null,
      )
      .join("\n");

    /**
     * ========================================================
     * GET ACTIVE ADMIN RECIPIENTS
     * ========================================================
     */

    const recipients =
      await prisma.user.findMany({
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

    if (recipients.length === 0) {
      return {
        count: 0,
        push: {
          totalNotifications: 0,
          totalSubscriptions: 0,
          sent: 0,
          failed: 0,
          removed: 0,
        },
        whatsapp: {
          recipients: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
          disabled: false,
        },
      };
    }

    /**
     * ========================================================
     * DATABASE NOTIFICATION
     * ========================================================
     */

    const notificationResults =
      await Promise.all(
        recipients.map(async (recipient) => {
          const eventKey =
            `PAYMENT_CONFIRMATION:${confirmationEventId}:${recipient.id}`;

          return notificationRepository.createIdempotent({
            userId: recipient.id,
            title: "Bukti Pembayaran Baru",
            message:
              `Customer ${customerName} mengupload bukti pembayaran untuk pesanan ${orderNumber}.`,
            type: NotificationType.PAYMENT_PROOF,
            href: `/admin/orders/${orderId}`,
            orderId,
            eventKey,
          });
        }),
      );

    const notifications =
      notificationResults
        .filter((result) => result.created)
        .map((result) => result.notification);

    /**
     * ========================================================
     * WEB PUSH
     * ========================================================
     */

    let pushResult = {
      totalNotifications: 0,
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      removed: 0,
    };

    try {
      pushResult =
        await pushDeliveryService.deliver({
          notifications: notifications.map(
            (notification) => ({
              userId: notification.userId,
              notificationId:
                notification.id,
              title: notification.title,
              message:
                notification.message,
              href: notification.href,
              type: notification.type,
              createdAt:
                notification.createdAt,
            }),
          ),
        });
    } catch (error) {
      console.error(
        "[WEB_PUSH_PAYMENT_PROOF_FATAL_ERROR]",
        error,
      );
    }

    /**
     * ========================================================
     * WHATSAPP DELIVERY
     * ========================================================
     *
     * Hanya upload bukti pembayaran yang memicu
     * WAPI. Order baru tidak lagi mengirim WAPI.
     */

    const wapiSettings =
      await settingsRepository
        .getWapiOrderNotificationSettings();

    const whatsappResult = {
      recipients: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      disabled: !wapiSettings.paymentProofEnabled,
    };

    if (wapiSettings.paymentProofEnabled) {
      for (const recipient of recipients) {
        const phone =
          recipient.phone?.trim();

        if (!phone) {
          whatsappResult.skipped += 1;

          await prisma.wapiDelivery.upsert({
            where: {
              orderId_userId: {
                orderId,
                userId: recipient.id,
              },
            },
            create: {
              orderId,
              userId: recipient.id,
              phone: "",
              message,
              status:
                WapiDeliveryStatus.SKIPPED,
              errorMessage:
                "Recipient tidak memiliki nomor telepon.",
            },
            update: {
              phone: "",
              message,
              status:
                WapiDeliveryStatus.SKIPPED,
              errorMessage:
                "Recipient tidak memiliki nomor telepon.",
              messageId: null,
              jid: null,
              processingStartedAt: null,
              sentAt: null,
            },
          });

          continue;
        }

        whatsappResult.recipients += 1;

        const existingDelivery =
          await prisma.wapiDelivery.findUnique({
            where: {
              orderId_userId: {
                orderId,
                userId: recipient.id,
              },
            },
            select: {
              id: true,
              status: true,
              message: true,
            },
          });

        if (
          existingDelivery?.status ===
            WapiDeliveryStatus.SENT &&
          existingDelivery.message === message
        ) {
          whatsappResult.sent += 1;

          continue;
        }

        const delivery =
          await prisma.wapiDelivery.upsert({
            where: {
              orderId_userId: {
                orderId,
                userId: recipient.id,
              },
            },
            create: {
              orderId,
              userId: recipient.id,
              phone,
              message,
              status:
                WapiDeliveryStatus.PENDING,
              attempts: 0,
            },
            update: {
              phone,
              message,
              status:
                WapiDeliveryStatus.PENDING,
              errorMessage: null,
              messageId: null,
              jid: null,
              processingStartedAt: null,
              sentAt: null,
            },
          });

        const claimResult =
          await prisma.wapiDelivery.updateMany({
            where: {
              id: delivery.id,
              status: {
                in: [
                  WapiDeliveryStatus.PENDING,
                  WapiDeliveryStatus.FAILED,
                ],
              },
            },
            data: {
              status:
                WapiDeliveryStatus.PROCESSING,
              phone,
              message,
              errorMessage: null,
              processingStartedAt:
                new Date(),
            },
          });

        if (claimResult.count === 0) {
          const currentDelivery =
            await prisma.wapiDelivery.findUnique({
              where: {
                id: delivery.id,
              },
              select: {
                status: true,
              },
            });

          if (
            currentDelivery?.status ===
            WapiDeliveryStatus.SENT
          ) {
            whatsappResult.sent += 1;
          }

          continue;
        }

        try {
          const result =
            await whatsappService.sendText({
              phone,
              message,
            });

          await prisma.wapiDelivery.update({
            where: {
              id: delivery.id,
            },
            data: {
              status:
                WapiDeliveryStatus.SENT,
              messageId: result.messageId,
              jid: result.jid,
              attempts: {
                increment: 1,
              },
              errorMessage: null,
              processingStartedAt: null,
              sentAt: new Date(),
            },
          });

          whatsappResult.sent += 1;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown WhatsApp gateway error.";

          await prisma.wapiDelivery.update({
            where: {
              id: delivery.id,
            },
            data: {
              status:
                WapiDeliveryStatus.FAILED,
              attempts: {
                increment: 1,
              },
              errorMessage,
              processingStartedAt: null,
            },
          });

          whatsappResult.failed += 1;

          console.error(
            "[WHATSAPP_PAYMENT_PROOF_ERROR]",
            {
              orderId,
              userId: recipient.id,
              deliveryId: delivery.id,
              error,
            },
          );
        }
      }
    }

    return {
      count: notifications.length,
      push: pushResult,
      whatsapp: whatsappResult,
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
     * CUSTOMER WHATSAPP DELIVERY
     * --------------------------------------------------------
     *
     * Transactional WhatsApp memakai ledger terpisah sehingga
     * satu order dapat memiliki banyak event tanpa bentrok.
     * Delivery tetap best-effort dan tidak menggagalkan proses payment.
     */
    const wapiEventType =
      paymentEvent === "VERIFIED" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED";

    let wapiResult;
    try {
      wapiResult = await WapiCustomerDeliveryService.deliver({
        userId,
        orderId,
        eventKey,
        eventType: wapiEventType,
        message,
      });

      console.log("[WAPI_CUSTOMER_PAYMENT_RESULT]", {
        userId,
        orderId,
        eventKey,
        eventType: wapiEventType,
        result: wapiResult,
      });
    } catch (error) {
      console.error("[WAPI_CUSTOMER_PAYMENT_DELIVERY_FATAL]", error);
      wapiResult = {
        status: "FAILED" as const,
        errorMessage:
          error instanceof Error ? error.message : "WAPI delivery failed.",
      };
    }

    return {
      count: created ? 1 : 0,
      notification,
      created,
      eventKey,
      push: pushResult,
      whatsapp: wapiResult,
    };
  }

  /**
   * ==========================================================
   * CREATE CUSTOMER ORDER CREATED NOTIFICATION
   * ==========================================================
   *
   * Dikirim segera setelah checkout berhasil membuat order.
   *
   * Event ini berbeda dari ORDER_STATUS karena order baru
   * belum mengalami perubahan status. Event key:
   *
   *   ORDER_CREATED:{orderId}
   *
   * Database notification dan WhatsApp sama-sama idempotent.
   * Kegagalan WhatsApp tidak menggagalkan checkout.
   */
  async createCustomerOrderCreatedNotification(
    input: CreateCustomerOrderCreatedNotificationInput,
  ) {
    const userId = input.userId?.trim();
    const orderId = input.orderId?.trim();
    const orderNumber = input.orderNumber?.trim() || "Pesanan Baru";

    if (!userId) {
      throw new Error("User ID customer tidak valid.");
    }

    if (!orderId) {
      throw new Error("Order ID tidak valid.");
    }

    const customer = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });

    if (!customer) {
      throw new Error("Customer tidak ditemukan.");
    }

    const customerName = customer.name?.trim() || "Customer";
    const totalAmount =
      typeof input.totalAmount === "number" &&
      Number.isFinite(input.totalAmount)
        ? new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(input.totalAmount)
        : null;

    const title = "Pesanan berhasil dibuat 🐟";
    const message = [
      `Halo ${customerName},`,
      "",
      `Pesanan ${orderNumber} berhasil dibuat di Pisjo Market.`,
      totalAmount ? `Total pesanan: ${totalAmount}` : null,
      "",
      "Silakan cek detail pesanan di akun Pisjo Market Anda.",
      "Terima kasih sudah berbelanja di Pisjo Market.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const eventKey = `ORDER_CREATED:${orderId}`;

    const { notification, created } =
      await notificationRepository.createIdempotent({
        userId,
        title,
        message,
        type: NotificationType.ORDER_STATUS,
        href: `/customer/orders/${orderId}`,
        orderId,
        eventKey,
      });

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
        console.error("[WEB_PUSH_CUSTOMER_ORDER_CREATED_ERROR]", error);
      }
    }

    let wapiResult;

    try {
      wapiResult = await WapiCustomerDeliveryService.deliver({
        userId,
        orderId,
        eventKey,
        eventType: "ORDER_CREATED",
        message,
      });
    } catch (error) {
      console.error("[WAPI_CUSTOMER_ORDER_CREATED_DELIVERY_FATAL]", error);

      wapiResult = {
        status: "FAILED" as const,
        errorMessage:
          error instanceof Error ? error.message : "WAPI delivery failed.",
      };
    }

    return {
      count: created ? 1 : 0,
      notification,
      created,
      eventKey,
      push: pushResult,
      whatsapp: wapiResult,
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
     * CUSTOMER WHATSAPP DELIVERY
     * --------------------------------------------------------
     */
    let wapiResult;
    try {
      wapiResult = await WapiCustomerDeliveryService.deliver({
        userId,
        orderId,
        eventKey,
        eventType: "ORDER_STATUS",
        message: notificationContent.message,
      });
    } catch (error) {
      console.error("[WAPI_CUSTOMER_ORDER_STATUS_DELIVERY_FATAL]", error);
      wapiResult = {
        status: "FAILED" as const,
        errorMessage:
          error instanceof Error ? error.message : "WAPI delivery failed.",
      };
    }

    return {
      count: created ? 1 : 0,
      notification,
      created,
      push: pushResult,
      whatsapp: wapiResult,
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

    let wapiResult;
    try {
      wapiResult = await WapiCustomerDeliveryService.deliver({
        userId,
        orderId,
        eventKey,
        eventType: "REWARD_POINTS",
        message,
      });
    } catch (error) {
      console.error("[WAPI_CUSTOMER_REWARD_DELIVERY_FATAL]", error);
      wapiResult = {
        status: "FAILED" as const,
        errorMessage:
          error instanceof Error ? error.message : "WAPI delivery failed.",
      };
    }

    return {
      count: created ? 1 : 0,
      notification,
      created,
      push: pushResult,
      whatsapp: wapiResult,
    };
  }

  /**
   * ==========================================================
   * COURIER ASSIGNMENT NOTIFICATION
   * ==========================================================
   *
   * Database Notification adalah source of truth.
   * Push/OneSignal bersifat best-effort.
   *
   * eventKey memakai assignmentId sehingga retry/reload tidak
   * membuat notifikasi assignment yang sama berulang.
   *
   * Menggunakan NotificationType.SYSTEM agar tidak membutuhkan
   * perubahan enum/migration hanya untuk V1 courier notification.
   */
  async createCourierAssignmentNotification(input: {
    assignmentId: string;
  }) {
    const assignmentId = input.assignmentId?.trim();

    if (!assignmentId) {
      throw new Error("Assignment ID tidak valid.");
    }

    const assignment = await prisma.courierAssignment.findUnique({
      where: {
        id: assignmentId,
      },
      select: {
        id: true,
        courierId: true,
        orderId: true,
        status: true,
        courier: {
          select: {
            id: true,
            name: true,
            isActive: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            deletedAt: true,
          },
        },
      },
    });

    if (
      !assignment ||
      assignment.status !== "ASSIGNED" ||
      assignment.order.deletedAt ||
      !assignment.courier.isActive ||
      assignment.courier.role !== "COURIER"
    ) {
      return {
        created: false,
        notification: null,
        push: null,
      };
    }

    const eventKey = `COURIER_ASSIGNMENT_ASSIGNED:${assignment.id}`;

    const result = await notificationRepository.createIdempotent({
      userId: assignment.courierId,
      title: "Tugas Pengantaran Baru",
      message: `Anda mendapatkan tugas pengantaran pesanan ${assignment.order.orderNumber}.`,
      type: NotificationType.SYSTEM,
      href: `/courier?assignment=${encodeURIComponent(assignment.id)}`,
      orderId: assignment.orderId,
      eventKey,
    });

    if (!result.created) {
      return {
        ...result,
        push: null,
      };
    }

    let pushResult = null;

    try {
      pushResult = await pushDeliveryService.deliver({
        notifications: [
          {
            userId: assignment.courierId,
            notificationId: result.notification.id,
            title: result.notification.title,
            message: result.notification.message,
            href: result.notification.href,
            type: result.notification.type,
            createdAt: result.notification.createdAt,
          },
        ],
      });
    } catch (error) {
      console.error("[COURIER_ASSIGNMENT_PUSH_ERROR]", {
        assignmentId: assignment.id,
        courierId: assignment.courierId,
        notificationId: result.notification.id,
        error,
      });
    }

    return {
      ...result,
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
