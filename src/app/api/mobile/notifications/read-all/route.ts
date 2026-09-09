import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import notificationService from "@/services/notification/notification.service";

export async function PATCH(request: Request) {
  try {
    const user = await requireMobileAuth(request);

    const updatedCount = await notificationService.markAllAsRead(
      user.id
    );

    return mobileSuccess(
      {
        updatedCount,
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
      "[MOBILE_NOTIFICATIONS_MARK_ALL_READ]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
