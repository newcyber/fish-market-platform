"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import Link from "next/link";

import {
  Bell,
  CheckCheck,
  Loader2,
} from "lucide-react";

import {
  getNotificationsAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
  type NotificationActionItem,
} from "@/actions/notification/notification.actions";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * ============================================================
 * NOTIFICATION BELL
 * ============================================================
 *
 * Menampilkan:
 *
 * - Icon bell
 * - Badge unread notification
 * - Notification dropdown
 * - Mark as read
 * - Mark all as read
 * - Background polling
 *
 * ============================================================
 */

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

/**
 * Cek notification baru setiap 5 detik.
 */
const NOTIFICATION_POLLING_INTERVAL = 5000;

export function NotificationBell() {
  const [
    notifications,
    setNotifications,
  ] = useState<NotificationActionItem[]>([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  /**
   * ==========================================================
   * LOAD NOTIFICATIONS
   * ==========================================================
   */

    /**
   * ==========================================================
   * LOAD NOTIFICATIONS
   * ==========================================================
   */

  const loadNotifications =
    useCallback(
      async (
        showLoading = false
      ) => {
        /**
         * Spinner hanya ditampilkan ketika
         * memang diperlukan.
         *
         * Polling background tidak menampilkan
         * spinner agar UI tidak berkedip.
         */
        if (showLoading) {
          setIsLoading(true);
        }

        try {
          const result =
            await getNotificationsAction();

          if (!result.success) {
            return;
          }

          setNotifications(
            result.notifications
          );

          setUnreadCount(
            result.unreadCount
          );
        } catch (error) {
          console.error(
            "[LOAD_NOTIFICATIONS_ERROR]",
            error
          );
        } finally {
          if (showLoading) {
            setIsLoading(false);
          }
        }
      },
      []
    );

  /**
   * ==========================================================
   * INITIAL LOAD
   * ==========================================================
   *
   * React/ESLint pada project ini melarang setState
   * secara langsung dari lifecycle effect.
   *
   * Karena loadNotifications() melakukan setState,
   * kita jadwalkan initial load ke macrotask berikutnya.
   *
   * Hasilnya tetap:
   *
   * component mount
   *       ↓
   * initial notification load
   *       ↓
   * badge unread langsung muncul
   */

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadNotifications(true);
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [loadNotifications]);

  /**
   * ==========================================================
   * BACKGROUND POLLING
   * ==========================================================
   *
   * Notification diperiksa setiap 5 detik.
   *
   * Polling hanya aktif ketika browser tab sedang terlihat.
   *
   * Jika user pindah tab:
   * - polling dihentikan
   *
   * Jika user kembali:
   * - notification langsung diperiksa
   * - polling dijalankan kembali
   */

  useEffect(() => {
    let intervalId:
      | number
      | null = null;

    const stopPolling =
      () => {
        if (
          intervalId !== null
        ) {
          window.clearInterval(
            intervalId
          );

          intervalId = null;
        }
      };

    const startPolling =
      () => {
        stopPolling();

        if (
          document.visibilityState !==
          "visible"
        ) {
          return;
        }

        intervalId =
          window.setInterval(
            () => {
              if (
                document.visibilityState ===
                "visible"
              ) {
                void loadNotifications();
              }
            },
            NOTIFICATION_POLLING_INTERVAL
          );
      };

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          /**
           * Jangan menunggu interval berikutnya.
           * Begitu tab kembali aktif, langsung refresh.
           */
          window.setTimeout(() => {
            void loadNotifications();
          }, 0);

          startPolling();

          return;
        }

        stopPolling();
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    startPolling();

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      stopPolling();
    };
  }, [loadNotifications]);

  /**
   * ==========================================================
   * REFRESH WHEN POPOVER OPENS
   * ==========================================================
   *
   * Polling tetap berjalan walaupun Popover tertutup.
   *
   * Ketika user membuka bell, kita lakukan refresh tambahan
   * supaya isi dropdown selalu paling baru.
   */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void loadNotifications(true);
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [
    isOpen,
    loadNotifications,
  ]);

  /**
   * ==========================================================
   * MARK SINGLE AS READ
   * ==========================================================
   */

  function handleNotificationClick(
    notification: NotificationActionItem
  ) {
    if (notification.isRead) {
      return;
    }

    startTransition(async () => {
      const result =
        await markNotificationAsReadAction(
          notification.id
        );

      if (!result.success) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    });
  }

  /**
   * ==========================================================
   * MARK ALL AS READ
   * ==========================================================
   */

  function handleMarkAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    startTransition(async () => {
      const result =
        await markAllNotificationsAsReadAction();

      if (!result.success) {
        return;
      }

      setNotifications((current) =>
        current.map(
          (notification) => ({
            ...notification,
            isRead: true,
          })
        )
      );

      setUnreadCount(0);
    });
  }

  /**
   * ==========================================================
   * FORMAT DATE
   * ==========================================================
   */

  function formatNotificationDate(
    value: Date | string
  ) {
    const date =
      new Date(value);

    const now =
      new Date();

    const difference =
      now.getTime() -
      date.getTime();

    const minutes =
      Math.floor(
        difference / 60000
      );

    if (minutes < 1) {
      return "Baru saja";
    }

    if (minutes < 60) {
      return `${minutes} menit lalu`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours} jam lalu`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days === 1) {
      return "Kemarin";
    }

    if (days < 7) {
      return `${days} hari lalu`;
    }

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger
        className="
          relative
          inline-flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-md
          transition-colors
          hover:bg-accent
          hover:text-accent-foreground
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2
        "
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-destructive
              px-1
              text-[10px]
              font-bold
              leading-5
              text-destructive-foreground
            "
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="
          w-[calc(100vw-2rem)]
          max-w-md
          overflow-hidden
          p-0
        "
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            px-4
            py-3
          "
        >
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">
              Notifikasi
            </h3>

            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} belum dibaca`
                : "Semua notifikasi sudah dibaca"}
            </p>
          </div>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="
                h-8
                shrink-0
                gap-1.5
                text-xs
              "
              disabled={isPending}
              onClick={
                handleMarkAllAsRead
              }
            >
              {isPending ? (
                <Loader2
                  className="
                    h-3.5
                    w-3.5
                    animate-spin
                  "
                />
              ) : (
                <CheckCheck
                  className="h-3.5 w-3.5"
                />
              )}

              Tandai dibaca
            </Button>
          ) : null}
        </div>

        {/* ================================================= */}
        {/* NOTIFICATION LIST */}
        {/* ================================================= */}

        <div
          className="
            max-h-[min(70vh,420px)]
            overflow-y-auto
          "
        >
          {isLoading ? (
            <div
              className="
                flex
                items-center
                justify-center
                py-10
              "
            >
              <Loader2
                className="
                  h-5
                  w-5
                  animate-spin
                  text-muted-foreground
                "
              />
            </div>
          ) : notifications.length === 0 ? (
            <div
              className="
                px-4
                py-10
                text-center
              "
            >
              <Bell
                className="
                  mx-auto
                  mb-3
                  h-8
                  w-8
                  text-muted-foreground/60
                "
              />

              <p className="text-sm font-medium">
                Belum ada notifikasi
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Notifikasi pesanan baru akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(
                (notification) => {
                  const content = (
                    <>
                      {!notification.isRead ? (
                        <span
                          className="
                            absolute
                            left-2
                            top-1/2
                            h-2
                            w-2
                            -translate-y-1/2
                            rounded-full
                            bg-primary
                          "
                        />
                      ) : null}

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-3
                          "
                        >
                          <p
                            className="
                              truncate
                              text-sm
                              font-medium
                            "
                          >
                            {notification.title}
                          </p>

                          <span
                            className="
                              shrink-0
                              whitespace-nowrap
                              text-[11px]
                              text-muted-foreground
                            "
                          >
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </span>
                        </div>

                        <p
                          className="
                            mt-1
                            line-clamp-2
                            text-xs
                            leading-relaxed
                            text-muted-foreground
                          "
                        >
                          {notification.message}
                        </p>
                      </div>
                    </>
                  );

                  const className =
                    [
                      "relative",
                      "flex",
                      "gap-3",
                      "px-5",
                      "py-4",
                      "transition-colors",
                      "hover:bg-muted/60",
                      notification.isRead
                        ? "bg-background"
                        : "bg-muted/40",
                    ].join(" ");

                  /**
                   * Jika memiliki href,
                   * gunakan Link agar langsung menuju
                   * halaman detail order.
                   */

                  if (notification.href) {
                    return (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        className={className}
                        onClick={() => {
                          handleNotificationClick(
                            notification
                          );

                          setIsOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className={[
                        className,
                        "w-full",
                        "text-left",
                      ].join(" ")}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    >
                      {content}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;