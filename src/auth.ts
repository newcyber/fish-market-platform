import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { LoginSchema } from "@/validations/auth/login.schema";
import { verifyPassword } from "@/lib/auth/password";
import { UserRepository } from "@/repositories/user.repository";

/**
 * ============================================================
 * AUTH CONFIGURATION
 * ============================================================
 *
 * Authentication system:
 *
 * - Credentials authentication
 * - JWT session
 * - Active user validation
 * - Email verification validation
 * - Soft deleted user protection
 * - Password change session invalidation
 *
 * ============================================================
 */

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),

  trustHost: true,

  secret: env.AUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      id: "credentials",

      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      /**
       * ========================================================
       * AUTHORIZE USER
       * ========================================================
       */

      async authorize(credentials) {
        /**
         * ======================================================
         * VALIDATE LOGIN INPUT
         * ======================================================
         */

        const parsed =
          LoginSchema.safeParse({
            email: credentials?.email,
            password: credentials?.password,
          });

        if (!parsed.success) {
          return null;
        }

        const {
          email,
          password,
        } = parsed.data;

        /**
         * ======================================================
         * FIND USER
         * ======================================================
         */

        const user =
          await UserRepository.findForAuth(
            email
          );

        if (!user) {
          return null;
        }

        /**
         * ======================================================
         * ACCOUNT STATUS CHECK
         * ======================================================
         *
         * User yang tidak aktif tidak dapat login.
         */

        if (!user.isActive) {
          return null;
        }

        /**
         * ======================================================
         * EMAIL VERIFICATION CHECK
         * ======================================================
         *
         * User wajib memverifikasi alamat email sebelum
         * dapat melakukan login.
         *
         * Untuk user lama, pastikan kolom emailVerified sudah
         * memiliki nilai jika memang akun tersebut harus tetap
         * dapat mengakses sistem.
         */

        if (!user.emailVerified) {
          throw new Error(
            "EMAIL_NOT_VERIFIED"
          );
        }

        /**
         * ======================================================
         * PASSWORD VERIFICATION
         * ======================================================
         */

        const passwordValid =
          await verifyPassword(
            password,
            user.password
          );

        if (!passwordValid) {
          return null;
        }

        /**
         * ======================================================
         * RETURN AUTHENTICATED USER
         * ======================================================
         */

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
          isActive: user.isActive,
          passwordChangedAt:
            user.passwordChangedAt,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * ========================================================
     * JWT CALLBACK
     * ========================================================
     */

    async jwt({
      token,
      user,
    }) {
      /**
       * ======================================================
       * INITIAL LOGIN
       * ======================================================
       */

      if (user) {
        token.id = user.id;

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
       * ======================================================
       * EXISTING SESSION VALIDATION
       * ======================================================
       */

      if (!token.id) {
        return token;
      }

      /**
       * ======================================================
       * ALWAYS VERIFY CURRENT USER STATE
       * ======================================================
       *
       * Memastikan user:
       *
       * - Masih ada
       * - Tidak di-soft-delete
       * - Masih aktif
       * - Email masih terverifikasi
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
       * ======================================================
       * USER NO LONGER EXISTS OR WAS SOFT DELETED
       * ======================================================
       */

      if (!currentUser) {
        token.isActive = false;

        return token;
      }

      /**
       * ======================================================
       * BLOCK INACTIVE USERS
       * ======================================================
       */

      if (!currentUser.isActive) {
        token.isActive = false;

        return token;
      }

      /**
       * ======================================================
       * EMAIL VERIFICATION VALIDATION
       * ======================================================
       *
       * Jika status email tidak lagi terverifikasi,
       * session dianggap tidak aktif.
       */

      if (!currentUser.emailVerified) {
        token.isActive = false;

        return token;
      }

      /**
       * ======================================================
       * PASSWORD CHANGE VALIDATION
       * ======================================================
       *
       * Jika password berubah setelah JWT diterbitkan,
       * tandai session sebagai tidak aktif.
       */

      const currentPasswordChangedAt =
        currentUser.passwordChangedAt
          ? currentUser.passwordChangedAt.getTime()
          : 0;

      const tokenPasswordChangedAt =
        typeof token.passwordChangedAt === "number"
          ? token.passwordChangedAt
          : 0;

      if (
        currentPasswordChangedAt >
        tokenPasswordChangedAt
      ) {
        token.isActive = false;

        return token;
      }

      /**
       * ======================================================
       * REFRESH AUTHORIZATION DATA
       * ======================================================
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
     * ========================================================
     * SESSION CALLBACK
     * ========================================================
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

      /**
       * ======================================================
       * ONLY ASSIGN ROLE WHEN AVAILABLE
       * ======================================================
       */

      if (token.role) {
        session.user.role =
          token.role as Role;
      }

      return session;
    },
  },
});