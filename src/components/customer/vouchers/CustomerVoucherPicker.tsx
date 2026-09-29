"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Loader2,
  Ticket,
} from "lucide-react";

export interface CustomerVoucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "DISCOUNT" | "FREE_SHIPPING";
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string | number;
  minimumPurchase: string | number | null;
  maximumDiscount: string | number | null;
  maximumShippingDiscount: string | number | null;
  claimable: boolean;
  claimCount: number;
  claimLimit: number | null;
  usageCount: number;
  usageLimit: number | null;
  perUserLimit: number | null;
  userUsageCount: number;
  startAt: string | null;
  endAt: string | null;
  claimedAt?: string;
}

interface CustomerVoucherPickerProps {
  subtotal: number;
  onUse: (voucher: CustomerVoucher) => void | Promise<void>;
  disabled?: boolean;
  autoUseVoucherId?: string | null;
  appliedVoucherId?: string | null;
  compact?: boolean;
  allowFreeShipping?: boolean;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function numberValue(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getBenefit(voucher: CustomerVoucher) {
  if (voucher.type === "FREE_SHIPPING") {
    const maximum = numberValue(voucher.maximumShippingDiscount);

    return maximum > 0
      ? `Gratis ongkir hingga ${formatRupiah(maximum)}`
      : "Gratis ongkir";
  }

  const value = numberValue(voucher.discountValue);

  if (voucher.discountType === "PERCENTAGE") {
    const maximum = numberValue(voucher.maximumDiscount);

    return maximum > 0
      ? `Diskon ${value}% maks. ${formatRupiah(maximum)}`
      : `Diskon ${value}%`;
  }

  return `Diskon ${formatRupiah(value)}`;
}

function getEligibility(
  voucher: CustomerVoucher,
  subtotal: number,
) {
  const now = Date.now();

  if (voucher.startAt && now < new Date(voucher.startAt).getTime()) {
    return {
      usable: false,
      reason: "Voucher belum mulai berlaku.",
    };
  }

  if (voucher.endAt && now >= new Date(voucher.endAt).getTime()) {
    return {
      usable: false,
      reason: "Voucher sudah berakhir.",
    };
  }

  if (!voucher.claimable && voucher.claimedAt == null) {
    return {
      usable: false,
      reason: "Voucher belum menjadi milik Anda.",
    };
  }

  if (
    voucher.usageLimit !== null &&
    voucher.usageCount >= voucher.usageLimit
  ) {
    return {
      usable: false,
      reason: "Kuota penggunaan voucher sudah habis.",
    };
  }

  if (
    voucher.perUserLimit !== null &&
    voucher.userUsageCount >= voucher.perUserLimit
  ) {
    return {
      usable: false,
      reason: "Batas penggunaan voucher Anda sudah tercapai.",
    };
  }

  const minimumPurchase = numberValue(voucher.minimumPurchase);

  if (minimumPurchase > 0 && subtotal < minimumPurchase) {
    return {
      usable: false,
      reason: `Minimum belanja ${formatRupiah(minimumPurchase)}.`,
    };
  }

  return {
    usable: true,
    reason: "",
  };
}

export default function CustomerVoucherPicker({
  subtotal,
  onUse,
  disabled = false,
  autoUseVoucherId = null,
  appliedVoucherId = null,
  compact = false,
  allowFreeShipping = true,
}: CustomerVoucherPickerProps) {
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);
  const autoAppliedRef = useRef<string | null>(null);

  async function loadVouchers() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/customer/vouchers", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? "Gagal memuat Voucher Saya.",
        );
      }

      const mine = (result.data?.mine ?? []) as Array<{
        voucher: CustomerVoucher;
        claimedAt?: string;
      }>;

      setVouchers(
        mine.map((item) => ({
          ...item.voucher,
          claimedAt:
            item.claimedAt ??
            item.voucher.claimedAt,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat Voucher Saya.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVouchers();
  }, []);

  useEffect(() => {
    if (
      !autoUseVoucherId ||
      autoAppliedRef.current === autoUseVoucherId ||
      loading ||
      disabled
    ) {
      return;
    }

    const voucher = vouchers.find(
      (item) => item.id === autoUseVoucherId,
    );

    if (!voucher) {
      return;
    }

    autoAppliedRef.current = autoUseVoucherId;

    if (voucher.type === "FREE_SHIPPING" && !allowFreeShipping) {
      return;
    }

    const eligibility = getEligibility(
      voucher,
      subtotal,
    );

    if (!eligibility.usable) {
      return;
    }

    void handleUse(voucher);
  }, [
    autoUseVoucherId,
    allowFreeShipping,
    disabled,
    loading,
    subtotal,
    vouchers,
  ]);

  async function handleUse(voucher: CustomerVoucher) {
    if (disabled || usingId) {
      return;
    }

    if (voucher.type === "FREE_SHIPPING" && !allowFreeShipping) {
      setError(
        "Voucher gratis ongkir hanya dapat digunakan saat Checkout karena ongkir belum dihitung di Cart.",
      );
      return;
    }

    const eligibility = getEligibility(
      voucher,
      subtotal,
    );

    if (!eligibility.usable) {
      setError(eligibility.reason);
      return;
    }

    setUsingId(voucher.id);
    setError(null);

    try {
      await onUse(voucher);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Voucher gagal diterapkan.",
      );
    } finally {
      setUsingId(null);
    }
  }

  const sortedVouchers = useMemo(
    () =>
      [...vouchers].sort((a, b) => {
        const aEligibility = getEligibility(a, subtotal);
        const bEligibility = getEligibility(b, subtotal);

        if (aEligibility.usable !== bEligibility.usable) {
          return aEligibility.usable ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      }),
    [subtotal, vouchers],
  );

  return (
    <section
      className={[
        "mt-3 overflow-hidden rounded-2xl border border-sky-100 bg-white",
        compact ? "" : "shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Ticket className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Voucher Saya
            </p>
            <p className="text-[11px] text-slate-500">
              {vouchers.length > 0
                ? `${vouchers.length} voucher tersimpan`
                : "Voucher yang Anda miliki"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat voucher...
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 px-3 py-3 text-xs leading-5 text-red-600">
            {error}
          </div>
        ) : sortedVouchers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-xs leading-5 text-slate-500">
            Belum ada voucher yang tersimpan di Voucher Saya.
          </div>
        ) : (
          sortedVouchers.map((voucher) => {
            const eligibility = getEligibility(
              voucher,
              subtotal,
            );

            const using =
              usingId === voucher.id;

            // A voucher is considered applied only when it is the
            // voucher currently stored by CheckoutForm. The URL's
            // autoUseVoucherId is only a fallback for the initial
            // auto-apply state and must not keep an old voucher looking
            // applied after the customer selects another voucher.
            const applied =
              appliedVoucherId === voucher.id ||
              (!appliedVoucherId && autoUseVoucherId === voucher.id);

            return (
              <div
                key={voucher.id}
                className={[
                  "rounded-xl border p-3",
                  eligibility.usable
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                      {voucher.type === "FREE_SHIPPING"
                        ? "Gratis Ongkir"
                        : "Voucher Diskon"}
                    </p>

                    <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                      {voucher.name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {getBenefit(voucher)}
                    </p>

                    {numberValue(voucher.minimumPurchase) > 0 && (
                      <p className="mt-1 text-[10px] text-slate-500">
                        Min. belanja{" "}
                        {formatRupiah(
                          numberValue(voucher.minimumPurchase),
                        )}
                      </p>
                    )}

                    {voucher.type === "FREE_SHIPPING" && !allowFreeShipping ? (
                      <p className="mt-1 text-[10px] font-medium text-slate-500">
                        Gunakan saat Checkout karena ongkir belum dihitung di Cart.
                      </p>
                    ) : !eligibility.usable ? (
                      <p className="mt-1 text-[10px] font-medium text-amber-700">
                        {eligibility.reason}
                      </p>
                    ) : null}

                    {voucher.endAt && eligibility.usable && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Berlaku sampai{" "}
                        {new Date(voucher.endAt).toLocaleDateString(
                          "id-ID",
                        )}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      disabled ||
                      using ||
                      applied ||
                      (voucher.type === "FREE_SHIPPING" && !allowFreeShipping) ||
                      !eligibility.usable
                    }
                    onClick={() => void handleUse(voucher)}
                    className={[
                      "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] font-bold transition",
                      applied
                        ? "bg-emerald-100 text-emerald-700"
                        : voucher.type === "FREE_SHIPPING" && !allowFreeShipping
                          ? "bg-slate-200 text-slate-400"
                          : eligibility.usable
                            ? "bg-cyan-600 text-white hover:bg-cyan-700"
                            : "bg-slate-200 text-slate-400",
                    ].join(" ")}
                  >
                    {using ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : applied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Voucher Diterapkan
                      </>
                    ) : voucher.type === "FREE_SHIPPING" && !allowFreeShipping ? (
                      "Gunakan di Checkout"
                    ) : eligibility.usable ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Pakai Voucher
                      </>
                    ) : (
                      "Tidak tersedia"
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
