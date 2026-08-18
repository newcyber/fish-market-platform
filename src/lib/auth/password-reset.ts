import crypto from "crypto";

/**
 * ============================================================
 * PASSWORD RESET TOKEN CONFIGURATION
 * ============================================================
 */

const PASSWORD_RESET_TOKEN_BYTES = 32;

const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 15;

/**
 * ============================================================
 * GENERATE SECURE RESET TOKEN
 * ============================================================
 *
 * Token menggunakan crypto.randomBytes().
 *
 * Raw token hanya dikirim ke user melalui reset link.
 * Raw token TIDAK boleh disimpan ke database.
 */

export function generatePasswordResetToken(): string {
  return crypto
    .randomBytes(
      PASSWORD_RESET_TOKEN_BYTES
    )
    .toString("hex");
}

/**
 * ============================================================
 * HASH RESET TOKEN
 * ============================================================
 *
 * Database hanya menyimpan SHA-256 hash.
 */

export function hashPasswordResetToken(
  token: string
): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * ============================================================
 * CALCULATE TOKEN EXPIRATION
 * ============================================================
 */

export function getPasswordResetTokenExpiry(): Date {
  const expiresAt = new Date();

  expiresAt.setMinutes(
    expiresAt.getMinutes() +
      PASSWORD_RESET_TOKEN_EXPIRY_MINUTES
  );

  return expiresAt;
}

/**
 * ============================================================
 * CREATE PASSWORD RESET TOKEN DATA
 * ============================================================
 *
 * Helper untuk menghasilkan:
 *
 * - rawToken
 * - tokenHash
 * - expiresAt
 *
 * rawToken:
 *   dikirim ke user
 *
 * tokenHash:
 *   disimpan di database
 */

export function createPasswordResetToken() {
  const rawToken =
    generatePasswordResetToken();

  const tokenHash =
    hashPasswordResetToken(rawToken);

  const expiresAt =
    getPasswordResetTokenExpiry();

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}