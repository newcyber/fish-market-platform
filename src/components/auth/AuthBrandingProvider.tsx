"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

/**
 * ============================================================
 * AUTH BRANDING
 * ============================================================
 */

export interface AuthBranding {
  storeName: string;
  storeDescription: string;
  siteLogo: string | null;
  storeInitial: string;
}

interface AuthBrandingProviderProps {
  branding: AuthBranding;
  children: ReactNode;
}

/**
 * ============================================================
 * CONTEXT
 * ============================================================
 */

const AuthBrandingContext =
  createContext<AuthBranding | null>(
    null
  );

/**
 * ============================================================
 * PROVIDER
 * ============================================================
 */

export function AuthBrandingProvider({
  branding,
  children,
}: AuthBrandingProviderProps) {
  return (
    <AuthBrandingContext.Provider
      value={branding}
    >
      {children}
    </AuthBrandingContext.Provider>
  );
}

/**
 * ============================================================
 * HOOK
 * ============================================================
 */

export function useAuthBranding() {
  const context =
    useContext(AuthBrandingContext);

  if (!context) {
    throw new Error(
      "useAuthBranding must be used inside AuthBrandingProvider."
    );
  }

  return context;
}