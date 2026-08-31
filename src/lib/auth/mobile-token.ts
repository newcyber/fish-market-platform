import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

/**
 * ============================================================
 * MOBILE TOKEN CONFIGURATION
 * ============================================================
 */

/**
 * Access token:
 *
 * Digunakan Android untuk mengakses Mobile API.
 *
 * Umur pendek digunakan agar apabila access token bocor,
 * window penyalahgunaannya terbatas.
 */
const ACCESS_TOKEN_EXPIRES_IN = "15m";

/**
 * Refresh token:
 *
 * Refresh token bersifat opaque/random dan TIDAK disimpan
 * dalam bentuk plaintext di database.
 */
const REFRESH_TOKEN_BYTES = 32;

/**
 * Refresh token lifetime.
 *
 * 30 hari sebagai baseline aplikasi mobile.
 */
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

/**
 * ============================================================
 * JWT SECRET
 * ============================================================
 */

const JWT_SECRET = new TextEncoder().encode(
  env.AUTH_SECRET
);

/**
 * ============================================================
 * ACCESS TOKEN PAYLOAD
 * ============================================================
 */

export interface MobileAccessTokenPayload {
  userId: string;
  role: string;
  issuedAt: number;
}

/**
 * ============================================================
 * CREATE ACCESS TOKEN
 * ============================================================
 */

export async function createMobileAccessToken(
  payload: Omit<
    MobileAccessTokenPayload,
    "issuedAt"
  >
): Promise<string> {
  return new SignJWT({
    role: payload.role,
    type: "mobile-access",
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(
      ACCESS_TOKEN_EXPIRES_IN
    )
    .sign(JWT_SECRET);
}

/**
 * ============================================================
 * VERIFY ACCESS TOKEN
 * ============================================================
 */

export async function verifyMobileAccessToken(
  token: string
): Promise<MobileAccessTokenPayload | null> {
  try {
    const { payload } =
      await jwtVerify(
        token,
        JWT_SECRET,
        {
          algorithms: ["HS256"],
        }
      );

    /**
     * --------------------------------------------------------
     * TOKEN TYPE
     * --------------------------------------------------------
     */

    if (
      payload.type !==
      "mobile-access"
    ) {
      return null;
    }

    /**
     * --------------------------------------------------------
     * USER ID
     * --------------------------------------------------------
     */

    if (
      typeof payload.sub !==
      "string"
    ) {
      return null;
    }

    /**
     * --------------------------------------------------------
     * ROLE
     * --------------------------------------------------------
     */

    if (
      typeof payload.role !==
      "string"
    ) {
      return null;
    }

    /**
     * --------------------------------------------------------
     * ISSUED AT
     * --------------------------------------------------------
     *
     * iat diperlukan untuk membandingkan waktu token
     * diterbitkan dengan passwordChangedAt user.
     */

    if (
      typeof payload.iat !==
      "number"
    ) {
      return null;
    }

    /**
     * --------------------------------------------------------
     * RESULT
     * --------------------------------------------------------
     */

    return {
      userId: payload.sub,

      role: payload.role,

      issuedAt: payload.iat,
    };
  } catch {
    return null;
  }
}

/**
 * ============================================================
 * CREATE REFRESH TOKEN
 * ============================================================
 *
 * Refresh token menggunakan cryptographically secure random
 * bytes.
 *
 * Token plaintext hanya dikembalikan kepada client.
 * Database hanya menyimpan hash-nya.
 */

export function createMobileRefreshToken(): string {
  return crypto
    .randomBytes(
      REFRESH_TOKEN_BYTES
    )
    .toString("hex");
}

/**
 * ============================================================
 * HASH REFRESH TOKEN
 * ============================================================
 *
 * Database menyimpan SHA-256 hash, bukan token asli.
 */

export function hashMobileRefreshToken(
  token: string
): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * ============================================================
 * REFRESH TOKEN EXPIRATION
 * ============================================================
 */

export function getMobileRefreshTokenExpiry(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() +
      REFRESH_TOKEN_EXPIRES_IN_DAYS
  );

  return expiresAt;
}
