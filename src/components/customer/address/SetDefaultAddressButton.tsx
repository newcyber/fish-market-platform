"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Check,
  Loader2,
  Star,
} from "lucide-react";

import {
  setDefaultAddressAction,
} from "@/actions/address/set-default-address";

interface SetDefaultAddressButtonProps {
  addressId: string;

  isDefault: boolean;
}

export default function SetDefaultAddressButton({
  addressId,
  isDefault,
}: SetDefaultAddressButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  function handleSetDefault() {
    if (isDefault) {
      return;
    }

    setMessage(null);

    startTransition(
      async () => {
        const result =
          await setDefaultAddressAction(
            addressId
          );

        setMessage(
          result.message
        );

        if (result.success) {
          window.location.reload();
        }
      }
    );
  }

  /**
   * ============================================================
   * DEFAULT ADDRESS
   * ============================================================
   */
  if (isDefault) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
        <Check className="h-4 w-4" />

        Alamat Utama
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSetDefault}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            Memproses...
          </>
        ) : (
          <>
            <Star className="h-4 w-4" />

            Jadikan Utama
          </>
        )}
      </button>

      {message && (
        <p className="mt-2 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}