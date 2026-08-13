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
 * NextAuth configuration untuk autentikasi sistem.
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
         * VALIDATE INPUT
         * ======================================================
         */

        const parsed =
          LoginSchema.safeParse(credentials);

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
         * BLOCK INACTIVE USER
         * ======================================================
         *
         * User yang dinonaktifkan oleh Admin tidak boleh
         * melakukan login ke dalam sistem.
         */

        if (!user.isActive) {
          return null;
        }

        /**
         * ======================================================
         * VERIFY PASSWORD
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
      if (user) {
        token.id = user.id;
        token.role =
          user.role as Role;
        token.isActive =
          user.isActive;
      }

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
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.role =
          token.role as Role;

        session.user.isActive =
          Boolean(
            token.isActive
          );
      }

      return session;
    },
  },
});