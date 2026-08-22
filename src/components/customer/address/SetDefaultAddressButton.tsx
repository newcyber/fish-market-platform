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

/**
 * ============================================================
 * SET DEFAULT ADDRESS BUTTON
 * ============================================================
 *
 * Premium UI untuk:
 * - Menampilkan status alamat utama
 * - Menjadikan alamat sebagai alamat utama
 * - Loading state
 * - Result message
 *
 * Logic server action tetap dipertahankan.
 * ============================================================
 */

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
   * ==========================================================
   * DEFAULT ADDRESS STATE
   * ==========================================================
   */

  if (isDefault) {
    return (
      <div
        className="
          inline-flex
          items-center
          gap-2

          rounded-full

          border
          border-emerald-100

          bg-linear-to-r
          from-emerald-50
          via-white
          to-emerald-50

          px-3
          py-2

          text-sm
          font-semibold

          text-emerald-700

          shadow-[0_3px_10px_rgba(16,185,129,0.08)]

          ring-1
          ring-white/80
        "
      >
        <span
          className="
            flex
            h-5
            w-5
            items-center
            justify-center

            rounded-full

            bg-emerald-500

            text-white

            shadow-[0_2px_6px_rgba(16,185,129,0.25)]
          "
        >
          <Check
            className="h-3 w-3"
            strokeWidth={3}
          />
        </span>

        Alamat Utama
      </div>
    );
  }

  /**
   * ==========================================================
   * SET DEFAULT BUTTON
   * ==========================================================
   */

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={handleSetDefault}
        disabled={isPending}
        className="
          group

          inline-flex
          h-10
          items-center
          justify-center
          gap-2

          rounded-xl

          border
          border-amber-100

          bg-linear-to-r
          from-amber-50
          via-white
          to-yellow-50

          px-4

          text-sm
          font-semibold

          text-amber-700

          shadow-[0_3px_10px_rgba(245,158,11,0.06)]

          transition-all
          duration-300
          ease-out

          active:scale-[0.97]

          hover:-translate-y-px
          hover:border-amber-200
          hover:shadow-[0_6px_16px_rgba(245,158,11,0.12)]

          disabled:cursor-not-allowed
          disabled:translate-y-0
          disabled:opacity-60
          disabled:shadow-none
          disabled:active:scale-100
        "
      >
        {isPending ? (
          <>
            <Loader2
              className="
                h-4
                w-4

                animate-spin
              "
            />

            Memproses...
          </>
        ) : (
          <>
            <Star
              className="
                h-4
                w-4

                transition-transform
                duration-300

                group-hover:scale-110
                group-hover:rotate-6
              "
            />

            Jadikan Utama
          </>
        )}
      </button>

      {/* ======================================================
          STATUS MESSAGE
      ====================================================== */}

      {message && (
        <p
          className="
            mt-2

            max-w-[240px]

            rounded-lg

            bg-slate-50/80

            px-2.5
            py-1.5

            text-xs
            leading-relaxed

            text-slate-500
          "
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}