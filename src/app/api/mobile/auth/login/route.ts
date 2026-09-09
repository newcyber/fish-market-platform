import MobileAuthService from "@/services/auth/mobile-auth.service";
import { mobileError, mobileSuccess } from "@/lib/api/mobile-response";

export async function POST(request: Request) {
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

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof body.email === "string"
      ? body.email
      : "";

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof body.password === "string"
      ? body.password
      : "";

  try {
    const result = await MobileAuthService.login({
      email,
      password,
    });

    return mobileSuccess({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_LOGIN_INPUT":
          return mobileError(
            "INVALID_LOGIN_INPUT",
            "Data login tidak valid.",
            400
          );

        case "EMAIL_NOT_VERIFIED":
          return mobileError(
            "EMAIL_NOT_VERIFIED",
            "Email Anda belum diverifikasi.",
            403
          );

        case "INVALID_CREDENTIALS":
          return mobileError(
            "INVALID_CREDENTIALS",
            "Email atau password salah.",
            401
          );
      }
    }

    console.error("[MOBILE_LOGIN_API_ERROR]", error);

    return mobileError(
      "INTERNAL_SERVER_ERROR",
      "Terjadi kesalahan pada server.",
      500
    );
  }
}
