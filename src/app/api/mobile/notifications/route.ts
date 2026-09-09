import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import notificationService from "@/services/notification/notification.service";

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  try {
    const user = await requireMobileAuth(request);

    const url = new URL(request.url);

    const limit = parsePositiveInteger(
      url.searchParams.get("limit"),
      20,
      50
    );

    const offset = parsePositiveInteger(
      url.searchParams.get("offset"),
      0,
      100000
    );

    const [
      notifications,
      unreadCount,
    ] = await Promise.all([
      notificationService.getLatestNotifications({
        userId: user.id,
        take: limit + 1,
        skip: offset,
      }),
      notificationService.getUnreadCount(user.id),
    ]);

    const hasMore = notifications.length > limit;

    const items = notifications
      .slice(0, limit)
      .map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        href: notification.href,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      }));

    return mobileSuccess(
      {
        items,
        unreadCount,
        pagination: {
          limit,
          offset,
          hasMore,
        },
      },
      200
    );
    } catch (error) {
    if (error instanceof MobileAuthError) {
      switch (error.code) {
        case "MISSING_AUTHORIZATION":
        case "INVALID_AUTHORIZATION":
        case "INVALID_ACCESS_TOKEN":
          return mobileError(
            error.code,
            error.message,
            401
          );

        case "ACCOUNT_INACTIVE":
        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            error.code,
            error.message,
            403
          );

        case "SESSION_INVALIDATED":
          return mobileError(
            "SESSION_INVALIDATED",
            "Sesi aplikasi tidak berlaku karena password telah diubah. Silakan login kembali.",
            401
          );
      }
    }

    console.error(
      "[MOBILE_NOTIFICATIONS_GET]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
