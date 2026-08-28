/**
 * ============================================================
 * WEB PUSH TYPES
 * ============================================================
 */

export interface WebPushSubscription {
  endpoint: string;

  keys: {
    p256dh: string;

    auth: string;
  };
}

export interface SendWebPushNotificationInput {
  subscription: WebPushSubscription;

  title: string;

  message: string;

  href?: string | null;

  notificationId?: string;

  type?: string;

  createdAt?: string;
}
