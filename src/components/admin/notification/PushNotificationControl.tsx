"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";

import {
  registerPushSubscriptionAction,
} from "@/actions/notification/push.actions";

import pushClientService from "@/services/notification/push/push-client.service";

/**
 * ============================================================
 * PUSH NOTIFICATION CONTROL
 * ============================================================
 *
 * Tanggung jawab:
 *
 * - Mengecek dukungan browser terhadap Web Push.
 * - Mengecek Notification permission.
 * - Mengecek subscription browser yang sudah ada.
 * - Mengaktifkan Web Push.
 * - Menyimpan subscription ke database melalui Server Action.
 * - Menonaktifkan Web Push.
 *
 * SECURITY:
 *
 * - Tidak pernah menerima userId dari client.
 * - userId ditentukan oleh Server Action melalui auth().
 * - Client hanya mengirim data subscription browser.
 *
 * ============================================================
 */

type PushStatus =
  | "checking"
  | "unsupported"
  | "blocked"
  | "inactive"
  | "active"
  | "loading"
  | "error";

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function PushNotificationControl() {
  const [
    status,
    setStatus,
  ] = useState<PushStatus>(
    "checking"
  );

  const [
    message,
    setMessage,
  ] = useState(
    "Memeriksa status notifikasi..."
  );

  /**
   * ==========================================================
   * CHECK CURRENT SUBSCRIPTION
   * ==========================================================
   */

  const checkSubscription =
    useCallback(
      async () => {
        if (
          !pushClientService.isSupported()
        ) {
          setStatus(
            "unsupported"
          );

          setMessage(
            "Browser ini tidak mendukung push notification."
          );

          return;
        }

        /**
 * ----------------------------------------------------
 * PERMISSION
 * ----------------------------------------------------
 */

const {
  permission,
} = Notification;

if (
  permission ===
  "denied"
) {
  setStatus(
    "blocked"
  );

  setMessage(
    "Notifikasi diblokir oleh browser."
  );

  return;
}

        /**
         * ----------------------------------------------------
         * SERVICE WORKER
         * ----------------------------------------------------
         */

        try {
          const registration =
            await navigator.serviceWorker.getRegistration(
              "/"
            );

          if (!registration) {
            setStatus(
              "inactive"
            );

            setMessage(
              "Notifikasi belum diaktifkan."
            );

            return;
          }

          /**
           * --------------------------------------------------
           * EXISTING SUBSCRIPTION
           * --------------------------------------------------
           */

          const subscription =
            await registration.pushManager.getSubscription();

          if (!subscription) {
            setStatus(
              "inactive"
            );

            setMessage(
              "Notifikasi belum diaktifkan."
            );

            return;
          }

          /**
           * --------------------------------------------------
           * BROWSER SUBSCRIPTION EXISTS
           * --------------------------------------------------
           *
           * Browser sudah mempunyai subscription.
           *
           * Kita anggap aktif dari sisi browser.
           */

          setStatus(
            "active"
          );

          setMessage(
            "Notifikasi sudah aktif."
          );
        } catch (error) {
          console.error(
            "[CHECK_PUSH_SUBSCRIPTION_ERROR]",
            error
          );

          setStatus(
            "error"
          );

          setMessage(
            "Gagal memeriksa status notifikasi."
          );
        }
      },
      []
    );

  /**
   * ==========================================================
   * INITIAL CHECK
   * ==========================================================
   *
   * Jangan melakukan setState secara langsung ketika effect
   * dieksekusi.
   *
   * Kita jadwalkan pemeriksaan ke macrotask berikutnya.
   */

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void checkSubscription();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    checkSubscription,
  ]);

  /**
   * ==========================================================
   * ACTIVATE PUSH
   * ==========================================================
   */

  const handleEnable =
    useCallback(
      async () => {
        if (
          status === "loading"
        ) {
          return;
        }

        if (
          !pushClientService.isSupported()
        ) {
          setStatus(
            "unsupported"
          );

          setMessage(
            "Browser ini tidak mendukung push notification."
          );

          return;
        }

        /**
         * ----------------------------------------------------
         * PERMISSION ALREADY BLOCKED
         * ----------------------------------------------------
         */

        if (
          Notification.permission ===
          "denied"
        ) {
          setStatus(
            "blocked"
          );

          setMessage(
            "Notifikasi diblokir oleh browser."
          );

          return;
        }

        setStatus(
          "loading"
        );

        setMessage(
          "Mengaktifkan notifikasi..."
        );

        try {
          /**
           * --------------------------------------------------
           * SUBSCRIBE BROWSER
           * --------------------------------------------------
           *
           * Method ini:
           *
           * - meminta permission
           * - register service worker
           * - mengambil VAPID public key
           * - membuat PushSubscription
           */

          const subscription =
            await pushClientService.subscribe();

          /**
           * --------------------------------------------------
           * SAVE TO DATABASE
           * --------------------------------------------------
           *
           * userId TIDAK dikirim.
           *
           * Server Action mengambil userId dari auth().
           */

          const result =
            await registerPushSubscriptionAction(
              {
                endpoint:
                  subscription.endpoint,

                keys: {
                  p256dh:
                    subscription.keys.p256dh,

                  auth:
                    subscription.keys.auth,
                },

                userAgent:
                  navigator.userAgent,
              }
            );

          if (!result.success) {
            /**
             * Browser sudah subscribe tetapi server gagal
             * menyimpan subscription.
             *
             * Kita rollback subscription browser supaya
             * state browser tidak berbeda dengan database.
             */

            try {
              await pushClientService.unsubscribe();
            } catch (unsubscribeError) {
              console.error(
                "[PUSH_ROLLBACK_ERROR]",
                unsubscribeError
              );
            }

            setStatus(
              "error"
            );

            setMessage(
              result.message ||
                "Gagal menyimpan subscription notifikasi."
            );

            return;
          }

          setStatus(
            "active"
          );

          setMessage(
            "Notifikasi berhasil diaktifkan."
          );
        } catch (error) {
          console.error(
            "[ENABLE_PUSH_ERROR]",
            error
          );

          setStatus(
            "error"
          );

          if (
            error instanceof Error &&
            error.message.trim()
          ) {
            setMessage(
              error.message
            );
          } else {
            setMessage(
              "Gagal mengaktifkan notifikasi."
            );
          }
        }
      },
      [status]
    );

    /**
   * ==========================================================
   * DEACTIVATE PUSH
   * ==========================================================
   *
   * Seluruh proses unsubscribe ditangani oleh
   * PushClientService.
   *
   * PushClientService bertanggung jawab untuk:
   *
   * - mengambil browser subscription
   * - mengambil endpoint
   * - unsubscribe browser
   * - menghapus subscription dari database
   *
   * Component hanya mengatur UI state.
   */

  const handleDisable =
    useCallback(
      async () => {
        if (
          status === "loading"
        ) {
          return;
        }

        if (
          !pushClientService.isSupported()
        ) {
          setStatus(
            "unsupported"
          );

          setMessage(
            "Browser ini tidak mendukung push notification."
          );

          return;
        }

        /**
         * ------------------------------------------------------
         * START LOADING
         * ------------------------------------------------------
         */

        setStatus(
          "loading"
        );

        setMessage(
          "Menonaktifkan notifikasi..."
        );

        try {
          /**
           * ----------------------------------------------------
           * UNSUBSCRIBE
           * ----------------------------------------------------
           *
           * PushClientService menangani seluruh proses:
           *
           * Browser subscription
           *        ↓
           * browser unsubscribe
           *        ↓
           * removePushSubscriptionAction(endpoint)
           *
           * Component tidak perlu mengetahui userId.
           */

          const unsubscribed =
            await pushClientService.unsubscribe();

          /**
           * ----------------------------------------------------
           * NO SUBSCRIPTION
           * ----------------------------------------------------
           *
           * false dapat berarti:
           *
           * - service worker belum tersedia
           * - browser subscription memang tidak ada
           * - browser menolak unsubscribe
           *
           * Untuk kondisi UI, kita perlu membedakan
           * subscription yang memang sudah tidak ada.
           */

          if (!unsubscribed) {
            const registration =
              await navigator.serviceWorker.getRegistration(
                "/"
              );

            if (!registration) {
              setStatus(
                "inactive"
              );

              setMessage(
                "Notifikasi sudah tidak aktif."
              );

              return;
            }

            const subscription =
              await registration.pushManager.getSubscription();

            if (!subscription) {
              setStatus(
                "inactive"
              );

              setMessage(
                "Notifikasi sudah tidak aktif."
              );

              return;
            }

            /**
             * Browser masih memiliki subscription tetapi
             * unsubscribe gagal.
             */

            setStatus(
              "error"
            );

            setMessage(
              "Gagal menonaktifkan notifikasi."
            );

            return;
          }

          /**
           * ----------------------------------------------------
           * SUCCESS
           * ----------------------------------------------------
           */

          setStatus(
            "inactive"
          );

          setMessage(
            "Notifikasi berhasil dinonaktifkan."
          );
        } catch (error) {
          console.error(
            "[DISABLE_PUSH_ERROR]",
            error
          );

          setStatus(
            "error"
          );

          if (
            error instanceof Error &&
            error.message.trim()
          ) {
            setMessage(
              error.message
            );
          } else {
            setMessage(
              "Gagal menonaktifkan notifikasi."
            );
          }
        }
      },
      [status]
    );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  if (
    status === "checking"
  ) {
    return (
      <div
        className="
          flex
          items-center
          gap-2
          px-3
          py-2
          text-xs
          text-muted-foreground
        "
      >
        <Loader2
          className="
            h-4
            w-4
            animate-spin
          "
        />

        <span>
          Memeriksa notifikasi...
        </span>
      </div>
    );
  }

  /**
   * ----------------------------------------------------------
   * UNSUPPORTED
   * ----------------------------------------------------------
   */

  if (
    status === "unsupported"
  ) {
    return (
      <div
        className="
          flex
          items-start
          gap-2
          px-3
          py-2
          text-xs
          text-muted-foreground
        "
      >
        <BellOff
          className="
            mt-0.5
            h-4
            w-4
            shrink-0
          "
        />

        <span>
          Browser ini tidak mendukung
          push notification.
        </span>
      </div>
    );
  }

  /**
   * ----------------------------------------------------------
   * BLOCKED
   * ----------------------------------------------------------
   */

  if (
    status === "blocked"
  ) {
    return (
      <div
        className="
          flex
          items-start
          gap-2
          px-3
          py-2
          text-xs
          text-muted-foreground
        "
      >
        <BellOff
          className="
            mt-0.5
            h-4
            w-4
            shrink-0
          "
        />

        <div className="min-w-0">
          <p className="font-medium">
            Notifikasi diblokir
          </p>

          <p className="mt-0.5 leading-relaxed">
            Izinkan notifikasi dari pengaturan
            browser untuk mengaktifkannya.
          </p>
        </div>
      </div>
    );
  }

  /**
   * ----------------------------------------------------------
   * ACTIVE
   * ----------------------------------------------------------
   */

  if (
    status === "active"
  ) {
    return (
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
          rounded-md
          border
          px-3
          py-2.5
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
          "
        >
          <Bell
            className="
              h-4
              w-4
              shrink-0
              text-primary
            "
          />

          <div className="min-w-0">
            <p className="text-xs font-medium">
              Notifikasi aktif
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-[11px]
                text-muted-foreground
              "
            >
              Anda akan menerima notifikasi
              pesanan baru.
            </p>
          </div>
        </div>

        <button
  type="button"
  onClick={() => {
    void handleDisable();
  }}
  className="
    shrink-0
    rounded-md
    border
    px-2.5
    py-1.5
    text-xs
    font-medium
    transition-colors
    hover:bg-muted
    disabled:cursor-not-allowed
    disabled:opacity-50
  "
>
  Matikan
</button>
      </div>
    );
  }

  /**
   * ----------------------------------------------------------
   * LOADING
   * ----------------------------------------------------------
   */

  if (
    status === "loading"
  ) {
    return (
      <div
        className="
          flex
          items-center
          gap-2
          rounded-md
          border
          px-3
          py-2.5
          text-xs
          text-muted-foreground
        "
      >
        <Loader2
          className="
            h-4
            w-4
            animate-spin
          "
        />

        <span>
          {message}
        </span>
      </div>
    );
  }

  /**
   * ----------------------------------------------------------
   * INACTIVE / ERROR
   * ----------------------------------------------------------
   */

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
        rounded-md
        border
        px-3
        py-2.5
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-2
        "
      >
        <Bell
          className="
            h-4
            w-4
            shrink-0
            text-muted-foreground
          "
        />

        <div className="min-w-0">
          <p className="text-xs font-medium">
            {status === "error"
              ? "Notifikasi belum aktif"
              : "Aktifkan notifikasi"}
          </p>

          <p
            className="
              mt-0.5
              text-[11px]
              leading-relaxed
              text-muted-foreground
            "
          >
            {message}
          </p>
        </div>
      </div>

      <button
  type="button"
  onClick={() => {
    void handleEnable();
  }}
  className="
    shrink-0
    rounded-md
    bg-primary
    px-2.5
    py-1.5
    text-xs
    font-medium
    text-primary-foreground
    transition-opacity
    hover:opacity-90
    disabled:cursor-not-allowed
    disabled:opacity-50
  "
>
  Aktifkan
</button>
    </div>
  );
}

export default PushNotificationControl;