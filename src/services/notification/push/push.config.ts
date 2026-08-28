import webpush from "web-push";

/**
 * ============================================================
 * WEB PUSH CONFIGURATION
 * ============================================================
 *
 * VAPID credentials hanya boleh digunakan di server.
 *
 * JANGAN menggunakan NEXT_PUBLIC_ untuk private key.
 *
 * Environment:
 *
 * VAPID_PUBLIC_KEY
 * VAPID_PRIVATE_KEY
 * VAPID_SUBJECT
 * ============================================================
 */

const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY?.trim();

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY?.trim();

const vapidSubject =
  process.env.VAPID_SUBJECT?.trim();

if (
  !vapidPublicKey ||
  !vapidPrivateKey ||
  !vapidSubject
) {
  throw new Error(
    "[WEB_PUSH_CONFIG] VAPID environment variables are not configured."
  );
}

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

export const webPushConfig = {
  publicKey: vapidPublicKey,
  subject: vapidSubject,
};

