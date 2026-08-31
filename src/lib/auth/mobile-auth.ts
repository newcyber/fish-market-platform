import { prisma } from "@/lib/prisma";

import {
  verifyMobileAccessToken,
} from "@/lib/auth/mobile-token";

/**
 * ============================================================
 * MOBILE AUTHENTICATION
 * ============================================================
 *
 * Authentication guard khusus Mobile API.
 *
 * Flow:
 *
 * Authorization: Bearer <accessToken>
 *          ↓
 * Extract token
 *          ↓
 * Verify JWT
 *          ↓
 * Find current user
 *          ↓
 * Validate account state
 *          ↓
 * Validate password change
 *          ↓
 * Return authenticated user
 *
 * ============================================================
 */

/**
 * ============================================================
 * ERROR TYPES
 * ============================================================
 */

export type MobileAuthErrorCode =
  | "MISSING_AUTHORIZATION"
  | "INVALID_AUTHORIZATION"
  | "INVALID_ACCESS_TOKEN"
  | "ACCOUNT_INACTIVE"
  | "EMAIL_NOT_VERIFIED"
  | "SESSION_INVALIDATED";

/**
 * ============================================================
 * AUTHENTICATED USER
 * ============================================================
 *
 * Jangan mengembalikan password atau field sensitif lainnya.
 */

export interface MobileAuthenticatedUser {
  id: string;

  name: string;

  email: string;

  avatar: string | null;

  role: string;
}

/**
 * ============================================================
 * MOBILE AUTH ERROR
 * ============================================================
 */

export class MobileAuthError extends Error {
  readonly code: MobileAuthErrorCode;

  constructor(
    code: MobileAuthErrorCode,
    message: string
  ) {
    super(message);

    this.name =
      "MobileAuthError";

    this.code = code;
  }
}

/**
 * ============================================================
 * EXTRACT BEARER TOKEN
 * ============================================================
 */

function extractBearerToken(
  request: Request
): string {
  const authorization =
    request.headers.get(
      "authorization"
    );

  /**
   * --------------------------------------------------------
   * MISSING AUTHORIZATION
   * --------------------------------------------------------
   */

  if (!authorization) {
    throw new MobileAuthError(
      "MISSING_AUTHORIZATION",
      "Authorization header diperlukan."
    );
  }

  /**
   * --------------------------------------------------------
   * PARSE AUTHORIZATION
   * --------------------------------------------------------
   */

  const parts =
    authorization
      .trim()
      .split(/\s+/);

  /**
   * --------------------------------------------------------
   * INVALID AUTHORIZATION
   * --------------------------------------------------------
   */

  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !==
      "bearer" ||
    !parts[1]
  ) {
    throw new MobileAuthError(
      "INVALID_AUTHORIZATION",
      "Authorization header tidak valid."
    );
  }

  return parts[1];
}

/**
 * ============================================================
 * REQUIRE MOBILE AUTHENTICATION
 * ============================================================
 *
 * Digunakan oleh seluruh endpoint Mobile API yang membutuhkan
 * user terautentikasi.
 *
 * Contoh:
 *
 * const user =
 *   await requireMobileAuth(request);
 *
 * ============================================================
 */

export async function requireMobileAuth(
  request: Request
): Promise<MobileAuthenticatedUser> {
  /**
   * --------------------------------------------------------
   * EXTRACT ACCESS TOKEN
   * --------------------------------------------------------
   */

  const accessToken =
    extractBearerToken(request);

  /**
   * --------------------------------------------------------
   * VERIFY JWT
   * --------------------------------------------------------
   *
   * verifyMobileAccessToken() memastikan:
   *
   * - signature valid
   * - algorithm sesuai
   * - token belum expired
   * - type = mobile-access
   * - subject/userId tersedia
   * - role tersedia
   * - issuedAt tersedia
   */

  const payload =
    await verifyMobileAccessToken(
      accessToken
    );

  if (!payload) {
    throw new MobileAuthError(
      "INVALID_ACCESS_TOKEN",
      "Access token tidak valid atau sudah kedaluwarsa."
    );
  }

  /**
   * --------------------------------------------------------
   * LOAD CURRENT USER
   * --------------------------------------------------------
   *
   * Jangan hanya mempercayai data dari JWT.
   *
   * Database tetap menjadi source of truth untuk status akun.
   */

  const user =
    await prisma.user.findFirst({
      where: {
        id: payload.userId,

        deletedAt: null,
      },

      select: {
        id: true,

        name: true,

        email: true,

        avatar: true,

        role: true,

        isActive: true,

        emailVerified: true,

        passwordChangedAt: true,
      },
    });

  /**
   * --------------------------------------------------------
   * USER NOT FOUND
   * --------------------------------------------------------
   */

  if (!user) {
    throw new MobileAuthError(
      "INVALID_ACCESS_TOKEN",
      "Access token tidak valid."
    );
  }

  /**
   * --------------------------------------------------------
   * ACCOUNT STATUS
   * --------------------------------------------------------
   */

  if (!user.isActive) {
    throw new MobileAuthError(
      "ACCOUNT_INACTIVE",
      "Akun Anda tidak dapat digunakan."
    );
  }

  /**
   * --------------------------------------------------------
   * EMAIL VERIFICATION
   * --------------------------------------------------------
   */

  if (!user.emailVerified) {
    throw new MobileAuthError(
      "EMAIL_NOT_VERIFIED",
      "Email Anda belum diverifikasi."
    );
  }

  /**
   * --------------------------------------------------------
   * PASSWORD CHANGE INVALIDATION
   * --------------------------------------------------------
   *
   * Jika password berubah setelah access token diterbitkan,
   * access token lama langsung dianggap tidak valid.
   *
   * JWT menggunakan Unix timestamp dalam satuan detik,
   * sedangkan Date menggunakan millisecond.
   */

  const tokenIssuedAt =
    new Date(
      payload.issuedAt * 1000
    );

  if (
    user.passwordChangedAt &&
    user.passwordChangedAt >
      tokenIssuedAt
  ) {
    throw new MobileAuthError(
      "SESSION_INVALIDATED",
      "Sesi aplikasi tidak berlaku karena password telah diubah."
    );
  }

  /**
   * --------------------------------------------------------
   * RETURN SAFE USER
   * --------------------------------------------------------
   */

  return {
    id: user.id,

    name: user.name,

    email: user.email,

    avatar: user.avatar,

    role: user.role,
  };
}
