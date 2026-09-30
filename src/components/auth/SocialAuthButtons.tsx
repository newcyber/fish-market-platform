"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

interface SocialAuthButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.74-.07-1.46-.2-2.15H12v4.07h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.31Z"
      />
      <path
        fill="#34A853"
        d="M12 21.83c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.83Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.91A5.86 5.86 0 0 1 6.23 12c0-.66.11-1.31.31-1.91V7.56H3.3A9.82 9.82 0 0 0 2.27 12c0 1.6.38 3.11 1.03 4.44l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.06c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.16 14.63 2.17 12 2.17a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.78 9.46 6.06 12 6.06Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.43H7.08v-3.5h3.05V9.4c0-3.04 1.79-4.72 4.55-4.72 1.32 0 2.7.24 2.7.24v2.98h-1.52c-1.5 0-1.97.94-1.97 1.9v2.27h3.35l-.54 3.5h-2.81V24C19.61 23.09 24 18.09 24 12.07Z"
      />
    </svg>
  );
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
    <div className="flex items-center justify-center gap-3">
      {showFacebook ? (
        <button
          type="button"
          onClick={() => void handleSignIn("facebook")}
          disabled={disabled || isLoading}
          aria-label="Masuk dengan Facebook"
          title="Masuk dengan Facebook"
          aria-busy={loadingProvider === "facebook"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pisjo-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FacebookIcon />
        </button>
      ) : null}

      {showGoogle ? (
        <button
          type="button"
          onClick={() => void handleSignIn("google")}
          disabled={disabled || isLoading}
          aria-label="Masuk dengan Google"
          title="Masuk dengan Google"
          aria-busy={loadingProvider === "google"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pisjo-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon />
        </button>
      ) : null}
    </div>
  );
}
