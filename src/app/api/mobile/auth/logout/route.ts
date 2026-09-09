import MobileAuthService from "@/services/auth/mobile-auth.service";
import { mobileError, mobileSuccess } from "@/lib/api/mobile-response";

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
        400
      );
    }

    await MobileAuthService.logout(refreshToken);

    return mobileSuccess({});
  } catch (error) {
    console.error("[MOBILE_LOGOUT_API_ERROR]", error);

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
