import {
  removePushSubscriptionAction,
} from "@/actions/notification/push.actions";

/**
 * ============================================================
 * PUSH CLIENT SERVICE
 * ============================================================
 *
 * Client-side helper untuk:
 *
 * - Register Service Worker
 * - Mengambil VAPID public key
 * - Meminta permission notification
 * - Membuat PushSubscription
 *
 * Database tidak disentuh di sini.
 * Penyimpanan subscription dilakukan melalui Server Action/API.
 *
 * ============================================================
 */

export interface BrowserPushSubscription {
  endpoint: string;

  keys: {
    p256dh: string;

    auth: string;
  };
}

class PushClientService {
  /**
   * ==========================================================
   * SUPPORT CHECK
   * ==========================================================
   */

  isSupported() {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /**
   * ==========================================================
   * REGISTER SERVICE WORKER
   * ==========================================================
   */

  async registerServiceWorker() {
    if (!this.isSupported()) {
      throw new Error(
        "Browser tidak mendukung Push Notification."
      );
    }

    return navigator.serviceWorker.register(
      "/sw.js"
    );
  }

  /**
   * ==========================================================
   * GET VAPID PUBLIC KEY
   * ==========================================================
   */

  private async getPublicKey() {
    const response =
      await fetch(
        "/api/notifications/push/public-key",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

    if (!response.ok) {
      throw new Error(
        "Gagal mengambil VAPID public key."
      );
    }

    const data =
      await response.json();

    if (
      typeof data.publicKey !==
      "string" ||
      !data.publicKey.trim()
    ) {
      throw new Error(
        "VAPID public key tidak tersedia."
      );
    }

    return data.publicKey;
  }

  /**
   * ==========================================================
   * BASE64 URL → UINT8 ARRAY
   * ==========================================================
   */

  private urlBase64ToUint8Array(
    base64String: string
  ) {
    const padding =
      "=".repeat(
        (4 -
          (base64String.length %
            4)) %
          4
      );

    const base64 =
      (
        base64String +
        padding
      )
        .replace(
          /-/g,
          "+"
        )
        .replace(
          /_/g,
          "/"
        );

    const rawData =
      window.atob(base64);

    return Uint8Array.from(
      [...rawData].map(
        (char) =>
          char.charCodeAt(0)
      )
    );
  }

  /**
   * ==========================================================
   * REQUEST PERMISSION
   * ==========================================================
   */

  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error(
        "Browser tidak mendukung Push Notification."
      );
    }

    return Notification.requestPermission();
  }

  /**
   * ==========================================================
   * SUBSCRIBE
   * ==========================================================
   */

  async subscribe(): Promise<BrowserPushSubscription> {
    if (!this.isSupported()) {
      throw new Error(
        "Browser tidak mendukung Push Notification."
      );
    }

    const permission =
      await this.requestPermission();

    if (
      permission !==
      "granted"
    ) {
      throw new Error(
        "Izin notifikasi tidak diberikan."
      );
    }

    const registration =
      await this.registerServiceWorker();

    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (
      existingSubscription
    ) {
      return this.serializeSubscription(
        existingSubscription
      );
    }

    const publicKey =
      await this.getPublicKey();

    const subscription =
      await registration.pushManager.subscribe(
        {
          userVisibleOnly: true,

          applicationServerKey:
            this.urlBase64ToUint8Array(
              publicKey
            ),
        }
      );

    return this.serializeSubscription(
      subscription
    );
  }

  /**
   * ==========================================================
   * SERIALIZE
   * ==========================================================
   */

  private serializeSubscription(
    subscription: PushSubscription
  ): BrowserPushSubscription {
    const json =
      subscription.toJSON();

    if (
      !json.endpoint ||
      !json.keys?.p256dh ||
      !json.keys?.auth
    ) {
      throw new Error(
        "Push subscription browser tidak valid."
      );
    }

    return {
      endpoint:
        json.endpoint,

      keys: {
        p256dh:
          json.keys.p256dh,

        auth:
          json.keys.auth,
      },
    };
  }

  /**
   * ==========================================================
   * UNSUBSCRIBE
   * ==========================================================
   */

  /**
 * ==========================================================
 * UNSUBSCRIBE
 * ==========================================================
 *
 * Browser subscription dan database harus sama-sama
 * dibersihkan.
 *
 * SECURITY:
 * removePushSubscriptionAction() mengambil userId
 * dari auth() di server. Client tidak pernah mengirim
 * userId.
 */

async unsubscribe() {
  if (!this.isSupported()) {
    return false;
  }

  const registration =
    await navigator.serviceWorker.getRegistration("/");

  if (!registration) {
    return false;
  }

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  const serialized =
    this.serializeSubscription(
      subscription
    );

  const browserUnsubscribed =
    await subscription.unsubscribe();

  if (!browserUnsubscribed) {
    return false;
  }

  /**
   * Browser sudah unsubscribe.
   *
   * Sekarang hapus subscription milik user
   * dari database.
   */

  const result =
    await removePushSubscriptionAction(
      serialized.endpoint
    );

  if (!result.success) {
    console.error(
      "[PUSH_DB_UNSUBSCRIBE_ERROR]",
      result.message
    );

    /**
     * Browser sudah unsubscribe tetapi DB gagal
     * dibersihkan.
     *
     * Jangan mengembalikan false seolah browser gagal.
     * Subscription browser memang sudah nonaktif.
     */
  }

  return true;
}
}

const pushClientService =
  new PushClientService();

export default pushClientService;
