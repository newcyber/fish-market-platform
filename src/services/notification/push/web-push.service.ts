import webpush from "web-push";

import "./push.config";

import type {
  SendWebPushNotificationInput,
} from "./push.types";

/**
 * ============================================================
 * WEB PUSH SERVICE
 * ============================================================
 *
 * Tanggung jawab:
 *
 * - Mengirim Web Push ke browser
 * - Menyediakan payload notification yang konsisten
 *
 * Service ini TIDAK mengakses database.
 * Database tetap menjadi tanggung jawab repository.
 * ============================================================
 */

class WebPushService {
  /**
   * ==========================================================
   * SEND NOTIFICATION
   * ==========================================================
   */

  async sendNotification(
    input: SendWebPushNotificationInput
  ) {
    const payload = JSON.stringify({
      title: input.title,

      message: input.message,

      href:
        input.href ?? null,

      notificationId:
        input.notificationId ?? null,

      type:
        input.type ?? "SYSTEM",

      createdAt:
        input.createdAt ??
        new Date().toISOString(),
    });

    try {
      return await webpush.sendNotification(
        input.subscription,
        payload
      );
    } catch (error) {
      console.error(
        "[WEB_PUSH_SEND_ERROR]",
        error
      );

      throw error;
    }
  }
}

const webPushService =
  new WebPushService();

export default webPushService;
