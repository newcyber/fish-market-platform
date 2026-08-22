"use client";

import {
  SessionProvider as NextAuthSessionProvider,
} from "next-auth/react";

type SessionProviderProps = {
  children: React.ReactNode;
};

/**
 * ==========================================================
 * GLOBAL SESSION PROVIDER
 * ==========================================================
 *
 * Menyediakan NextAuth session untuk seluruh
 * Client Component.
 *
 * Contoh penggunaan:
 *
 * const { status } = useSession();
 */

export default function SessionProvider({
  children,
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}