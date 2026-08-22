"use client";

import {
  Check,
  ChevronRight,
  Truck,
} from "lucide-react";

import type {
  AvailableShippingProvider,
  ShippingProviderCode,
} from "@/services/shipping/shipping.types";

/**
 * ============================================================
 * SHIPPING METHOD SELECTOR
 * ============================================================
 *
 * Premium shipping provider selector.
 *
 * Komponen ini hanya menangani UI selection.
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
      <div
        className="
          rounded-3xl

          border
          border-dashed
          border-slate-200

          bg-linear-to-br
          from-slate-50
          via-white
          to-cyan-50/40

          p-5

          shadow-[0_4px_16px_rgba(23,50,77,0.04)]
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center

              rounded-2xl

              bg-slate-100

              text-slate-500
            "
          >
            <Truck className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Metode pengiriman belum tersedia
            </p>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {providers.map(
        (provider) => {
          const isSelected =
            selectedProvider ===
            provider.code;

          const isDisabled =
            disabled ||
            !provider.enabled;

          return (
            <button
              key={provider.code}
              type="button"
              disabled={
                isDisabled
              }
              onClick={() => {
                if (
                  !isDisabled
                ) {
                  onChange(
                    provider.code
                  );
                }
              }}
              className={[
                `
                  group
                  relative

                  flex
                  w-full
                  items-center
                  gap-4

                  overflow-hidden

                  rounded-2xl

                  border

                  p-4

                  text-left

                  transition-all
                  duration-300
                  ease-out

                  active:scale-[0.99]
                `,

                isSelected
                  ? `
                      border-cyan-200

                      bg-linear-to-r
                      from-cyan-50/90
                      via-white
                      to-sky-50/50

                      shadow-[0_6px_20px_rgba(8,145,178,0.08)]
                    `
                  : `
                      border-slate-100

                      bg-white/80

                      shadow-[0_2px_8px_rgba(23,50,77,0.025)]

                      hover:-translate-y-px
                      hover:border-cyan-100
                      hover:bg-white
                      hover:shadow-[0_8px_22px_rgba(23,50,77,0.07)]
                    `,

                isDisabled
                  ? `
                      cursor-not-allowed
                      opacity-50
                    `
                  : `
                      cursor-pointer
                    `,
              ].join(" ")}
            >
              {/* ================================================= */}
              {/* SELECTED ACCENT */}
              {/* ================================================= */}

              {isSelected && (
                <div
                  className="
                    absolute
                    inset-y-3
                    left-0

                    w-1

                    rounded-r-full

                    bg-cyan-500

                    shadow-[0_0_12px_rgba(6,182,212,0.35)]
                  "
                />
              )}

              {/* ================================================= */}
              {/* RADIO INDICATOR */}
              {/* ================================================= */}

              <div
                className={[
                  `
                    relative

                    flex
                    h-6
                    w-6
                    shrink-0
                    items-center
                    justify-center

                    rounded-full

                    border-2

                    transition-all
                    duration-300
                    ease-out
                  `,

                  isSelected
                    ? `
                        border-cyan-600

                        bg-cyan-600

                        text-white

                        shadow-[0_0_0_4px_rgba(8,145,178,0.10)]
                      `
                    : `
                        border-slate-300

                        bg-white

                        text-transparent

                        group-hover:border-cyan-300
                      `,
                ].join(" ")}
              >
                <Check
                  className={[
                    `
                      h-3.5
                      w-3.5

                      transition-all
                      duration-300
                    `,

                    isSelected
                      ? `
                          scale-100
                          opacity-100
                        `
                      : `
                          scale-50
                          opacity-0
                        `,
                  ].join(" ")}
                  strokeWidth={3}
                />
              </div>

              {/* ================================================= */}
              {/* PROVIDER ICON */}
              {/* ================================================= */}

              <div
                className={[
                  `
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center

                    rounded-2xl

                    transition-all
                    duration-300
                  `,

                  isSelected
                    ? `
                        bg-cyan-100

                        text-cyan-700

                        shadow-[0_4px_12px_rgba(8,145,178,0.10)]
                      `
                    : `
                        bg-slate-50

                        text-slate-500

                        group-hover:bg-cyan-50
                        group-hover:text-cyan-600
                      `,
                ].join(" ")}
              >
                <Truck
                  className="
                    h-5
                    w-5

                    transition-transform
                    duration-300

                    group-hover:translate-x-0.5
                  "
                />
              </div>

              {/* ================================================= */}
              {/* PROVIDER INFO */}
              {/* ================================================= */}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={[
                      `
                        text-sm
                        font-semibold

                        transition-colors
                        duration-300
                      `,

                      isSelected
                        ? "text-cyan-950"
                        : "text-slate-900",
                    ].join(" ")}
                  >
                    {provider.name}
                  </p>

                  {provider.code ===
                    "INTERNAL" && (
                    <span
                      className="
                        rounded-full

                        border
                        border-emerald-100

                        bg-emerald-50

                        px-2.5
                        py-0.5

                        text-[10px]
                        font-semibold

                        text-emerald-700
                      "
                    >
                      Tersedia
                    </span>
                  )}

                  {!provider.enabled && (
                    <span
                      className="
                        rounded-full

                        bg-slate-100

                        px-2.5
                        py-0.5

                        text-[10px]
                        font-medium

                        text-slate-500
                      "
                    >
                      Tidak tersedia
                    </span>
                  )}
                </div>

                <p
                  className="
                    mt-1.5

                    text-xs
                    leading-relaxed

                    text-slate-500
                  "
                >
                  {getProviderDescription(
                    provider.code
                  )}
                </p>
              </div>

              {/* ================================================= */}
              {/* CHEVRON */}
              {/* ================================================= */}

              <ChevronRight
                className={[
                  `
                    h-5
                    w-5
                    shrink-0

                    transition-all
                    duration-300
                    ease-out
                  `,

                  isSelected
                    ? `
                        translate-x-0

                        text-cyan-600
                      `
                    : `
                        text-slate-300

                        group-hover:translate-x-0.5
                        group-hover:text-slate-500
                      `,
                ].join(" ")}
              />
            </button>
          );
        }
      )}
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