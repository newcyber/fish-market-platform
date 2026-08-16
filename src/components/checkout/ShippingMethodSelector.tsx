"use client";

import type {
  AvailableShippingProvider,
  ShippingProviderCode,
} from "@/services/shipping/shipping.types";

/**
 * ============================================================
 * SHIPPING METHOD SELECTOR
 * ============================================================
 *
 * Komponen untuk memilih metode pengiriman.
 *
 * Saat ini:
 * - INTERNAL
 *
 * Masa depan:
 * - JNE
 * - JNT
 * - SICEPAT
 * - ANTERAJA
 * - POS
 *
 * Komponen ini hanya menangani UI selection.
 *
 * Perhitungan ongkir tetap dilakukan oleh server.
 * ============================================================
 */

interface ShippingMethodSelectorProps {
  providers: AvailableShippingProvider[];

  selectedProvider:
    | ShippingProviderCode
    | null;

  onChange: (
    provider: ShippingProviderCode
  ) => void;

  disabled?: boolean;
}

export default function ShippingMethodSelector({
  providers,
  selectedProvider,
  onChange,
  disabled = false,
}: ShippingMethodSelectorProps) {
  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (providers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-medium text-slate-700">
          Metode pengiriman belum tersedia
        </p>

        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const isSelected =
          selectedProvider === provider.code;

        return (
          <button
            key={provider.code}
            type="button"
            disabled={
              disabled ||
              !provider.enabled
            }
            onClick={() => {
              if (
                !disabled &&
                provider.enabled
              ) {
                onChange(
                  provider.code
                );
              }
            }}
            className={[
              "group relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",

              isSelected
                ? "border-slate-900 bg-slate-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",

              disabled ||
              !provider.enabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer",
            ].join(" ")}
          >
            {/* ================================================= */}
            {/* RADIO INDICATOR */}
            {/* ================================================= */}

            <div
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",

                isSelected
                  ? "border-slate-900"
                  : "border-slate-300",
              ].join(" ")}
            >
              {isSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
              )}
            </div>

            {/* ================================================= */}
            {/* PROVIDER INFO */}
            {/* ================================================= */}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {provider.name}
                </p>

                {provider.code ===
                  "INTERNAL" && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Tersedia
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {getProviderDescription(
                  provider.code
                )}
              </p>
            </div>

            {/* ================================================= */}
            {/* CHEVRON */}
            {/* ================================================= */}

            <div
              className={[
                "text-sm transition-transform",

                isSelected
                  ? "translate-x-0 text-slate-900"
                  : "text-slate-300 group-hover:translate-x-0.5",
              ].join(" ")}
            >
              ›
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * ============================================================
 * PROVIDER DESCRIPTION
 * ============================================================
 */

function getProviderDescription(
  providerCode: ShippingProviderCode
): string {
  switch (providerCode) {
    case "INTERNAL":
      return "Pesanan akan dikirim menggunakan kurir internal toko.";

    case "JNE":
      return "Pengiriman menggunakan layanan JNE.";

    case "JNT":
      return "Pengiriman menggunakan layanan J&T Express.";

    case "SICEPAT":
      return "Pengiriman menggunakan layanan SiCepat.";

    case "ANTERAJA":
      return "Pengiriman menggunakan layanan AnterAja.";

    case "POS":
      return "Pengiriman menggunakan layanan Pos Indonesia.";

    default:
      return "Metode pengiriman tersedia.";
  }
}