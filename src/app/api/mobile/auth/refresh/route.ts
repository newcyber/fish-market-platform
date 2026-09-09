import MobileAuthService from "@/services/auth/mobile-auth.service";
import {
  mobileError,
  mobileSuccess,
} from "@/lib/api/mobile-response";

export async function POST(request: Request) {
  try {
    let body: unknown;

try {
  body = await request.json();
} catch {
  return mobileError(
    "INVALID_REQUEST_BODY",
    "Format request tidak valid.",
    400
  );
}

const refreshToken =
  typeof body === "object" &&
  body !== null &&
  "refreshToken" in body &&
  typeof body.refreshToken === "string"
    ? body.refreshToken.trim()
    : "";

    if (!refreshToken) {
      return mobileError(
        "INVALID_REFRESH_TOKEN",
        "Refresh token tidak valid.",
        401
      );
    }

    const result =
      await MobileAuthService.refresh(refreshToken);

    return mobileSuccess({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt:
        result.refreshTokenExpiresAt,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_REFRESH_TOKEN":
          return mobileError(
            "INVALID_REFRESH_TOKEN",
            "Refresh token tidak valid.",
            401
          );

        case "REFRESH_TOKEN_REVOKED":
          return mobileError(
            "REFRESH_TOKEN_REVOKED",
            "Session aplikasi sudah tidak berlaku. Silakan login kembali.",
            401
          );

        case "REFRESH_TOKEN_EXPIRED":
          return mobileError(
            "REFRESH_TOKEN_EXPIRED",
            "Session aplikasi sudah kedaluwarsa. Silakan login kembali.",
            401
          );

        case "ACCOUNT_INACTIVE":
          return mobileError(
            "ACCOUNT_INACTIVE",
            "Akun Anda tidak dapat digunakan.",
            403
          );

        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            "EMAIL_NOT_VERIFIED",
            "Email Anda belum diverifikasi.",
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
      "[MOBILE_REFRESH_API_ERROR]",
      error
    );

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
