import {
  UserRepository,
} from "@/repositories/user.repository";

import {
  prisma,
} from "@/lib/prisma";

import {
  LoginSchema,
} from "@/validations/auth/login.schema";

import {
  verifyPassword,
} from "@/lib/auth/password";

import {
  createMobileAccessToken,
  createMobileRefreshToken,
  hashMobileRefreshToken,
  getMobileRefreshTokenExpiry,
} from "@/lib/auth/mobile-token";

/**
 * ============================================================
 * MOBILE AUTH SERVICE
 * ============================================================
 *
 * Authentication khusus Mobile API.
 *
 * Web:
 *   Auth.js + JWT session
 *
 * Mobile:
 *   Access Token + Refresh Token
 *   +
 *   MobileSession
 *
 * ============================================================
 */

export interface MobileLoginInput {
  email: string;
  password: string;
}

export interface MobileAuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };

  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * ============================================================
 * MOBILE AUTH SERVICE
 * ============================================================
 */

export class MobileAuthService {
  /**
   * ==========================================================
   * LOGIN
   * ==========================================================
   */

  static async login(
    input: MobileLoginInput
  ): Promise<MobileAuthResult> {
    /**
     * --------------------------------------------------------
     * VALIDATE INPUT
     * --------------------------------------------------------
     */

    const parsed =
      LoginSchema.safeParse({
        email: input.email,
        password: input.password,
      });

    if (!parsed.success) {
      throw new Error(
        "INVALID_LOGIN_INPUT"
      );
    }

    const {
      email,
      password,
    } = parsed.data;

    /**
     * --------------------------------------------------------
     * FIND USER
     * --------------------------------------------------------
     *
     * Repository sudah memastikan:
     *
     * - user exists
     * - isActive = true
     * - deletedAt = null
     */

    const user =
      await UserRepository.findForAuth(
        email
      );

    if (!user) {
      throw new Error(
        "INVALID_CREDENTIALS"
      );
    }

    /**
     * --------------------------------------------------------
     * EMAIL VERIFICATION
     * --------------------------------------------------------
     */

    if (!user.emailVerified) {
      throw new Error(
        "EMAIL_NOT_VERIFIED"
      );
    }

    /**
     * --------------------------------------------------------
     * PASSWORD
     * --------------------------------------------------------
     */

    const passwordValid =
      await verifyPassword(
        password,
        user.password
      );

    if (!passwordValid) {
      throw new Error(
        "INVALID_CREDENTIALS"
      );
    }

    /**
     * --------------------------------------------------------
     * CREATE ACCESS TOKEN
     * --------------------------------------------------------
     */

    const accessToken =
      await createMobileAccessToken({
        userId: user.id,
        role: user.role,
      });

    /**
     * --------------------------------------------------------
     * CREATE REFRESH TOKEN
     * --------------------------------------------------------
     */

    const refreshToken =
      createMobileRefreshToken();

    const refreshTokenHash =
      hashMobileRefreshToken(
        refreshToken
      );

    const refreshTokenExpiresAt =
      getMobileRefreshTokenExpiry();

    /**
     * --------------------------------------------------------
     * CREATE MOBILE SESSION
     * --------------------------------------------------------
     */

    await prisma.mobileSession.create({
      data: {
        userId: user.id,

        refreshTokenHash,

        expiresAt:
          refreshTokenExpiresAt,
      },
    });

    /**
     * --------------------------------------------------------
     * RESULT
     * --------------------------------------------------------
     */

    return {
      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        avatar: user.avatar,

        role: user.role,
      },

      accessToken,

      refreshToken,

      refreshTokenExpiresAt,
    };
  }

  /**
   * ==========================================================
   * REFRESH
   * ==========================================================
   */

  static async refresh(
    refreshToken: string
  ): Promise<MobileAuthResult> {
    /**
     * --------------------------------------------------------
     * BASIC VALIDATION
     * --------------------------------------------------------
     */

    if (
      !refreshToken ||
      typeof refreshToken !== "string"
    ) {
      throw new Error(
        "INVALID_REFRESH_TOKEN"
      );
    }

    /**
     * --------------------------------------------------------
     * HASH TOKEN
     * --------------------------------------------------------
     */

    const refreshTokenHash =
      hashMobileRefreshToken(
        refreshToken
      );

    /**
     * --------------------------------------------------------
     * FIND SESSION
     * --------------------------------------------------------
     */

    const mobileSession =
      await prisma.mobileSession.findUnique({
        where: {
          refreshTokenHash,
        },

        include: {
          user: true,
        },
      });

    if (!mobileSession) {
      throw new Error(
        "INVALID_REFRESH_TOKEN"
      );
    }

    /**
     * --------------------------------------------------------
     * SESSION REVOCATION
     * --------------------------------------------------------
     */

    if (
      mobileSession.revokedAt
    ) {
      throw new Error(
        "REFRESH_TOKEN_REVOKED"
      );
    }

    /**
     * --------------------------------------------------------
     * SESSION EXPIRATION
     * --------------------------------------------------------
     */

    if (
      mobileSession.expiresAt <=
      new Date()
    ) {
      await prisma.mobileSession.update({
        where: {
          id: mobileSession.id,
        },

        data: {
          revokedAt: new Date(),
        },
      });

      throw new Error(
        "REFRESH_TOKEN_EXPIRED"
      );
    }

    /**
     * --------------------------------------------------------
     * CURRENT USER STATE
     * --------------------------------------------------------
     */

    const user =
      mobileSession.user;

    if (
      user.deletedAt ||
      !user.isActive
    ) {
      await prisma.mobileSession.update({
        where: {
          id: mobileSession.id,
        },

        data: {
          revokedAt: new Date(),
        },
      });

      throw new Error(
        "ACCOUNT_INACTIVE"
      );
    }

    /**
     * --------------------------------------------------------
     * EMAIL VERIFICATION
     * --------------------------------------------------------
     */

    if (!user.emailVerified) {
      await prisma.mobileSession.update({
        where: {
          id: mobileSession.id,
        },

        data: {
          revokedAt: new Date(),
        },
      });

      throw new Error(
        "EMAIL_NOT_VERIFIED"
      );
    }

    /**
     * --------------------------------------------------------
     * PASSWORD CHANGE INVALIDATION
     * --------------------------------------------------------
     *
     * Jika password diubah setelah MobileSession dibuat,
     * refresh token lama tidak boleh digunakan lagi.
     */

    if (
      user.passwordChangedAt &&
      user.passwordChangedAt >
        mobileSession.createdAt
    ) {
      await prisma.mobileSession.update({
        where: {
          id: mobileSession.id,
        },

        data: {
          revokedAt: new Date(),
        },
      });

      throw new Error(
        "SESSION_INVALIDATED"
      );
    }

    /**
     * --------------------------------------------------------
     * ROTATE REFRESH TOKEN
     * --------------------------------------------------------
     *
     * Refresh token lama langsung direvoke.
     *
     * Ini mencegah reuse token lama setelah rotation.
     */

    const newRefreshToken =
      createMobileRefreshToken();

    const newRefreshTokenHash =
      hashMobileRefreshToken(
        newRefreshToken
      );

    const newRefreshTokenExpiresAt =
      getMobileRefreshTokenExpiry();

    const accessToken =
      await createMobileAccessToken({
        userId: user.id,
        role: user.role,
      });

    /**
     * --------------------------------------------------------
     * ROTATE SESSION
     * --------------------------------------------------------
     */

    await prisma.$transaction(async (tx) => {
  /**
   * Revoke hanya jika session masih aktif.
   *
   * Ini penting untuk mencegah concurrent refresh:
   *
   * Request A ─┐
   *            ├── refresh token yang sama
   * Request B ─┘
   *
   * Hanya satu request yang boleh berhasil
   * melakukan rotation.
   */
  const revokedSession =
    await tx.mobileSession.updateMany({
      where: {
        id: mobileSession.id,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });

  /**
   * Jika count = 0 berarti request lain sudah
   * lebih dahulu melakukan rotation/revoke.
   */
  if (revokedSession.count !== 1) {
    throw new Error(
      "REFRESH_TOKEN_REVOKED"
    );
  }

  /**
   * Hanya request yang berhasil melakukan revoke
   * yang boleh membuat refresh session baru.
   */
  await tx.mobileSession.create({
    data: {
      userId: user.id,

      refreshTokenHash:
        newRefreshTokenHash,

      expiresAt:
        newRefreshTokenExpiresAt,
    },
  });
});

    /**
     * --------------------------------------------------------
     * RESULT
     * --------------------------------------------------------
     */

    return {
      user: {
        id: user.id,

        name: user.name,

        email: user.email,

        avatar: user.avatar,

        role: user.role,
      },

      accessToken,

      refreshToken:
        newRefreshToken,

      refreshTokenExpiresAt:
        newRefreshTokenExpiresAt,
    };
  }

  /**
   * ==========================================================
   * LOGOUT
   * ==========================================================
   */

  static async logout(
    refreshToken: string
  ): Promise<void> {
    if (
      !refreshToken ||
      typeof refreshToken !== "string"
    ) {
      return;
    }

    const refreshTokenHash =
      hashMobileRefreshToken(
        refreshToken
      );

    await prisma.mobileSession.updateMany({
      where: {
        refreshTokenHash,

        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export default MobileAuthService;
