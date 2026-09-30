"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

interface SocialAuthButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
}

export function SocialAuthButtons({
  callbackUrl = "/customer",
  disabled = false,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "facebook" | null
  >(null);
  const [availableProviders, setAvailableProviders] = useState<
    Set<string> | null
  >(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/providers", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("AUTH_PROVIDERS_UNAVAILABLE");
        }

        return response.json() as Promise<Record<string, unknown>>;
      })
      .then((providers) => {
        if (active) {
          setAvailableProviders(new Set(Object.keys(providers)));
        }
      })
      .catch((error) => {
        console.error("[SOCIAL_AUTH_PROVIDERS]", error);
        if (active) {
          setAvailableProviders(new Set());
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = async (provider: "google" | "facebook") => {
    if (disabled || loadingProvider) {
      return;
    }

    setLoadingProvider(provider);

    try {
      await signIn(provider, {
        redirectTo: callbackUrl,
      });
    } catch (error) {
      console.error(`[SOCIAL_AUTH_${provider.toUpperCase()}]`, error);
      toast.error("Gagal memulai login. Silakan coba lagi.");
      setLoadingProvider(null);
    }
  };

  const isLoading = loadingProvider !== null;
  const showGoogle = availableProviders?.has("google") === true;
  const showFacebook = availableProviders?.has("facebook") === true;

  if (availableProviders !== null && !showGoogle && !showFacebook) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showGoogle ? (
        <button
          type="button"
          onClick={() => void handleSignIn("google")}
          disabled={disabled || isLoading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center text-base font-bold" aria-hidden="true">
            G
          </span>
          {loadingProvider === "google" ? "Menghubungkan Google..." : "Lanjut dengan Google"}
        </button>
      ) : null}

      {showFacebook ? (
        <button
          type="button"
          onClick={() => void handleSignIn("facebook")}
          disabled={disabled || isLoading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1877F2] text-sm font-bold text-white" aria-hidden="true">
            f
          </span>
          {loadingProvider === "facebook" ? "Menghubungkan Facebook..." : "Lanjut dengan Facebook"}
        </button>
      ) : null}
    </div>
  );
}
