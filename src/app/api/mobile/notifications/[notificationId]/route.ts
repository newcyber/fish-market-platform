import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import notificationService from "@/services/notification/notification.service";

interface RouteContext {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const user = await requireMobileAuth(request);

    const { notificationId } = await context.params;
    const normalizedNotificationId = notificationId.trim();

    if (!normalizedNotificationId) {
      return mobileError(
        "INVALID_NOTIFICATION_ID",
        "ID notifikasi tidak valid.",
        400
      );
    }

    await notificationService.deleteNotification(
      user.id,
      normalizedNotificationId
    );

    return mobileSuccess(
      {
        id: normalizedNotificationId,
        deleted: true,
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
      "[MOBILE_NOTIFICATION_DELETE]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
