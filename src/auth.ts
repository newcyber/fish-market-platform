import crypto from "node:crypto";

import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { LoginSchema } from "@/validations/auth/login.schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { UserRepository } from "@/repositories/user.repository";

import WhatsAppRegistrationOtpService from "@/services/auth/whatsapp-registration-otp.service";
import WhatsAppLoginOtpService from "@/services/auth/whatsapp-login-otp.service";

/**
 * Auth.js expects the standard Prisma adapter User model to expose
 * `image` and does not know about Pisjo's custom `avatar` field or
 * the required legacy `password` column. Keep the existing Prisma
 * adapter for Account/Session operations, but override OAuth user
 * creation so Google/Facebook can create a valid Pisjo customer.
 */
const baseAdapter = PrismaAdapter(prisma);

const adapter: Adapter = {
  ...baseAdapter,

  async createUser(data) {
    const password = await hashPassword(
      `oauth:${crypto.randomUUID()}:${crypto.randomUUID()}`,
    );

    const user = await prisma.user.create({
      data: {
        name: data.name || "Customer Pisjo",
        email: data.email,
        password,
        avatar: data.image ?? null,
        emailVerified: data.emailVerified ?? new Date(),
        role: Role.CUSTOMER,
        isActive: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.avatar,
      role: user.role,
      isActive: user.isActive,
      passwordChangedAt: user.passwordChangedAt,
    };
  },
};

const oauthProviders = [
  ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),

  ...(env.AUTH_FACEBOOK_ID && env.AUTH_FACEBOOK_SECRET
    ? [
        Facebook({
          clientId: env.AUTH_FACEBOOK_ID,
          clientSecret: env.AUTH_FACEBOOK_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
];

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
 * 4. Google OAuth
 * 5. Facebook OAuth
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
  adapter,

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
    ...oauthProviders,

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
     * OAuth safety + account linking.
     *
     * Google/Facebook must provide an email before Pisjo accepts
     * the identity. The provider options above allow Auth.js to
     * link a provider to an existing Pisjo user with the same
     * trusted provider email instead of creating a duplicate.
     */
    async signIn({ user, account }) {
      if (account?.type === "oauth") {
        if (!user.email) {
          return false;
        }

        const existingUser = await prisma.user.findFirst({
          where: {
            email: user.email.toLowerCase(),
            deletedAt: null,
          },
          select: {
            id: true,
            role: true,
            isActive: true,
            emailVerified: true,
          },
        });

        // Social login is intended for customer accounts. Keep admin
        // authentication on the existing credentials/WhatsApp flows.
        if (existingUser && existingUser.role !== Role.CUSTOMER) {
          return false;
        }

        if (existingUser && !existingUser.isActive) {
          return false;
        }

        // A trusted OAuth provider has verified the email identity.
        // Upgrade an existing unverified customer so the existing JWT
        // callback does not immediately invalidate the new OAuth session.
        if (existingUser && !existingUser.emailVerified) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          });
        }
      }

      return true;
    },

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
        token.id = user.id;

        // Credentials/WhatsApp providers already return these fields.
        // OAuth users are created by the adapter, so hydrate the
        // application-specific authorization fields from Prisma.
        if (user.role && typeof user.isActive === "boolean") {
          token.role = user.role as Role;
          token.isActive = user.isActive;
          token.passwordChangedAt = user.passwordChangedAt
            ? user.passwordChangedAt.getTime()
            : 0;
        } else {
          const oauthUser = await prisma.user.findFirst({
            where: {
              id: user.id,
              deletedAt: null,
            },
            select: {
              role: true,
              isActive: true,
              passwordChangedAt: true,
            },
          });

          token.role = oauthUser?.role ?? Role.CUSTOMER;
          token.isActive = oauthUser?.isActive === true;
          token.passwordChangedAt = oauthUser?.passwordChangedAt
            ? oauthUser.passwordChangedAt.getTime()
            : 0;
        }

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