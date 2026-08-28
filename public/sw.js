/**
 * ============================================================
 * PISJO MARKET - SERVICE WORKER
 * ============================================================
 *
 * Menangani:
 *
 * - Web Push
 * - Menampilkan browser notification
 * - Klik notification
 * - Membuka/fokus aplikasi
 *
 * ============================================================
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

/**
 * ============================================================
 * PUSH EVENT
 * ============================================================
 */

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let data = {};

  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Pisjo Market",
      message: event.data.text(),
    };
  }

  const title =
    data.title ||
    "Pisjo Market";

  const message =
    data.message ||
    "Anda memiliki notifikasi baru.";

  const href =
    data.href ||
    "/admin";

  const notificationId =
    data.notificationId ||
    null;

  const type =
    data.type ||
    "SYSTEM";

  const createdAt =
    data.createdAt ||
    new Date().toISOString();

  const options = {
    body: message,

    icon:
      "/web-app-manifest-192x192.png",

    badge:
      "/web-app-manifest-192x192.png",

    data: {
      href,
      notificationId,
      type,
      createdAt,
    },

    tag:
      notificationId ||
      `pisjo-${type}`,

    renotify: true,

    requireInteraction:
      type === "NEW_ORDER",

    actions:
      type === "NEW_ORDER"
        ? [
            {
              action: "open",
              title: "Buka Pesanan",
            },
          ]
        : [],
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

/**
 * ============================================================
 * NOTIFICATION CLICK
 * ============================================================
 */

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const notificationData =
      event.notification.data || {};

    const href =
      notificationData.href ||
      "/admin";

    event.waitUntil(
      openApplication(href)
    );
  }
);

/**
 * ============================================================
 * OPEN / FOCUS APPLICATION
 * ============================================================
 */

async function openApplication(href) {
  const clientList =
    await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

  const targetUrl =
    new URL(
      href,
      self.location.origin
    ).href;

  /**
   * Jika aplikasi sudah terbuka,
   * fokus ke tab tersebut dan navigasi
   * ke halaman notification.
   */
  for (const client of clientList) {
    if (
      "focus" in client
    ) {
      try {
        await client.focus();

        if (
          "navigate" in client
        ) {
          await client.navigate(
            targetUrl
          );
        }

        return;
      } catch {
        // lanjut ke client berikutnya
      }
    }
  }

  /**
   * Jika aplikasi belum terbuka,
   * buka window baru.
   */
  if (
    self.clients.openWindow
  ) {
    await self.clients.openWindow(
      targetUrl
    );
  }
}
