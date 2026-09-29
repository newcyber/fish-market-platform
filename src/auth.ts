import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { LoginSchema } from "@/validations/auth/login.schema";
import { verifyPassword } from "@/lib/auth/password";
import { UserRepository } from "@/repositories/user.repository";

import WhatsAppRegistrationOtpService from "@/services/auth/whatsapp-registration-otp.service";
import WhatsAppLoginOtpService from "@/services/auth/whatsapp-login-otp.service";

/**
 * ============================================================
 * AUTH CONFIGURATION
 * ============================================================
 *
 * Authentication:
 *
 * 1. Email + Password
 * 2. WhatsApp OTP Registration
 * 3. WhatsApp OTP Login
 *
 * Session:
 * - JWT
 * - Active user validation
 * - Email verification validation
 * - Soft delete protection
 * - Password change invalidation
 *
 * ============================================================
 */

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter:
    PrismaAdapter(prisma),

  trustHost: true,

  secret:
    env.AUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    /**
     * ==========================================================
     * WHATSAPP LOGIN OTP
     * ==========================================================
     *
     * Dipakai customer existing untuk login
     * menggunakan nomor WhatsApp + OTP.
     */

    Credentials({
      id: "whatsapp-login-otp",

      name: "WhatsApp Login OTP",

      credentials: {
        phone: {
          label: "Nomor WhatsApp",
          type: "text",
        },

        otp: {
          label: "OTP",
          type: "text",
        },
      },

      async authorize(
        credentials,
      ) {
        const phone =
          typeof credentials?.phone ===
          "string"
            ? credentials.phone
            : "";

        const otp =
          typeof credentials?.otp ===
          "string"
            ? credentials.otp
            : "";

        if (
          !phone ||
          !/^\d{6}$/.test(otp)
        ) {
          return null;
        }

        try {
          const user =
            await WhatsAppLoginOtpService.verify(
              phone,
              otp,
            );

          return {
            id: user.id,

            name: user.name,

            email: user.email,

            image: user.avatar,

            role: user.role,

            isActive:
              user.isActive,

            passwordChangedAt:
              user.passwordChangedAt,
          };
        } catch {
          return null;
        }
      },
    }),

    /**
     * ==========================================================
     * WHATSAPP REGISTRATION OTP
     * ==========================================================
     *
     * JANGAN HAPUS.
     *
     * Provider ini digunakan RegisterForm.
     */

    Credentials({
      id: "whatsapp-otp",

      name: "WhatsApp OTP",

      credentials: {
        phone: {
          label: "Nomor WhatsApp",
          type: "text",
        },

        otp: {
          label: "OTP",
          type: "text",
        },

        name: {
          label: "Nama",
          type: "text",
        },
      },

      async authorize(
        credentials,
      ) {
        const phone =
          typeof credentials?.phone ===
          "string"
            ? credentials.phone
            : "";

        const otp =
          typeof credentials?.otp ===
          "string"
            ? credentials.otp
            : "";

        const name =
          typeof credentials?.name ===
          "string"
            ? credentials.name
            : "";

        if (
          !phone ||
          !/^\d{6}$/.test(otp) ||
          name.trim().length < 3
        ) {
          return null;
        }

        try {
          const user =
            await WhatsAppRegistrationOtpService.verifyAndActivate(
              phone,
              otp,
              name,
            );

          return {
            id: user.id,

            name: user.name,

            email: user.email,

            image: user.avatar,

            role: user.role,

            isActive:
              user.isActive,

            passwordChangedAt:
              user.passwordChangedAt,
          };
        } catch {
          return null;
        }
      },
    }),

    /**
     * ==========================================================
     * EMAIL + PASSWORD
     * ==========================================================
     */

    Credentials({
  id: "credentials",

  name: "Credentials",

  credentials: {
    email: {
      label:
        "Email atau Nomor WhatsApp",

      type: "text",
    },

    password: {
      label: "Password",

      type: "password",
    },
  },

  async authorize(
    credentials,
  ) {
    /**
     * ========================================================
     * VALIDATE INPUT
     * ========================================================
     */

    const parsed =
      LoginSchema.safeParse({
        email:
          credentials?.email,

        password:
          credentials?.password,
      });

    if (!parsed.success) {
      return null;
    }

    const identifier =
      parsed.data.email.trim();

    const password =
      parsed.data.password;

    /**
     * ========================================================
     * DETECT PHONE / EMAIL
     * ========================================================
     */

    const isPhone =
      !identifier.includes(
        "@",
      ) &&
      /\d/.test(
        identifier,
      );

    /**
     * ========================================================
     * NORMALIZE PHONE
     * ========================================================
     */

    let normalizedIdentifier =
      identifier.toLowerCase();

    if (isPhone) {
      const digits =
        identifier.replace(
          /\D/g,
          "",
        );

      if (
        digits.startsWith("62")
      ) {
        normalizedIdentifier =
          digits;
      } else if (
        digits.startsWith("0")
      ) {
        normalizedIdentifier =
          `62${digits.slice(1)}`;
      } else {
        normalizedIdentifier =
          digits;
      }
    }

    /**
     * ========================================================
     * FIND USER
     * ========================================================
     */

    const user =
      isPhone
        ? await UserRepository.findByPhone(
            normalizedIdentifier,
          )
        : await UserRepository.findForAuth(
            normalizedIdentifier,
          );

    if (!user) {
      return null;
    }

    /**
     * ========================================================
     * ACTIVE ACCOUNT
     * ========================================================
     */

    if (!user.isActive) {
      return null;
    }

    /**
     * ========================================================
     * EMAIL VERIFICATION
     * ========================================================
     *
     * Dipertahankan karena merupakan behaviour existing
     * credentials login Pisjo Market.
     */

    if (!user.emailVerified) {
      throw new Error(
        "EMAIL_NOT_VERIFIED",
      );
    }

    /**
     * ========================================================
     * PASSWORD
     * ========================================================
     */

    const passwordValid =
      await verifyPassword(
        password,
        user.password,
      );

    if (!passwordValid) {
      return null;
    }

    /**
     * ========================================================
     * AUTH USER
     * ========================================================
     */

    return {
      id: user.id,

      name: user.name,

      email: user.email,

      image: user.avatar,

      role: user.role,

      isActive:
        user.isActive,

      passwordChangedAt:
        user.passwordChangedAt,
    };
  },
}),
  ],

  callbacks: {
    /**
     * ==========================================================
     * JWT CALLBACK
     * ==========================================================
     */

    async jwt({
      token,
      user,
    }) {
      /**
       * Initial login.
       */
      if (user) {
        token.id =
          user.id;

        token.role =
          user.role as Role;

        token.isActive =
          user.isActive;

        token.passwordChangedAt =
          user.passwordChangedAt
            ? user.passwordChangedAt.getTime()
            : 0;

        return token;
      }

      /**
       * Existing session.
       */
      if (!token.id) {
        return token;
      }

      /**
       * Always verify current user state.
       */
      const currentUser =
        await prisma.user.findFirst({
          where: {
            id: token.id as string,

            deletedAt: null,
          },

          select: {
            id: true,

            role: true,

            isActive: true,

            emailVerified: true,

            passwordChangedAt: true,
          },
        });

      /**
       * User deleted / unavailable.
       */
      if (!currentUser) {
        token.isActive =
          false;

        return token;
      }

      /**
       * User inactive.
       */
      if (!currentUser.isActive) {
        token.isActive =
          false;

        return token;
      }

      /**
       * Email verification.
       *
       * Tetap dipertahankan untuk menjaga
       * behavior authentication existing.
       */
      if (
        !currentUser.emailVerified
      ) {
        token.isActive =
          false;

        return token;
      }

      /**
       * Password changed.
       */
      const currentPasswordChangedAt =
        currentUser.passwordChangedAt
          ? currentUser.passwordChangedAt.getTime()
          : 0;

      const tokenPasswordChangedAt =
        typeof token.passwordChangedAt ===
        "number"
          ? token.passwordChangedAt
          : 0;

      if (
        currentPasswordChangedAt >
        tokenPasswordChangedAt
      ) {
        token.isActive =
          false;

        return token;
      }

      /**
       * Refresh authorization data.
       */
      token.role =
        currentUser.role as Role;

      token.isActive =
        currentUser.isActive;

      token.passwordChangedAt =
        currentPasswordChangedAt;

      return token;
    },

    /**
     * ==========================================================
     * SESSION CALLBACK
     * ==========================================================
     */

    async session({
      session,
      token,
    }) {
      if (!session.user) {
        return session;
      }

      session.user.id =
        token.id as string;

      session.user.isActive =
        token.isActive === true;

      if (token.role) {
        session.user.role =
          token.role as Role;
      }

      return session;
    },
  },
});