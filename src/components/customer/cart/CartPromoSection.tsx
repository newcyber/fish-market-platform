"use client";

import {
  Check,
  ChevronRight,
  Loader2,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { validateVoucherAction } from "@/actions/voucher/validate-voucher";

import CustomerVoucherPicker, {
  type CustomerVoucher,
} from "@/components/customer/vouchers/CustomerVoucherPicker";

interface CartVoucherItem {
  id: string;
  price: number | string;
  quantity: number;
}

interface CartPromoSectionProps {
  items: CartVoucherItem[];
  appliedVoucherId?: string | null;
}

export default function CartPromoSection({
  items,
  appliedVoucherId = null,
}: CartPromoSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showVouchers, setShowVouchers] = useState(false);

  const selectedIds = useMemo(() => {
    if (!searchParams.has("selected")) {
      return new Set(items.map((item) => item.id));
    }

    return new Set(
      (searchParams.get("selected") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }, [items, searchParams]);

  const selectedSubtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        if (!selectedIds.has(item.id)) {
          return total;
        }

        return (
          total +
          Number(item.price) * Number(item.quantity)
        );
      }, 0),
    [items, selectedIds],
  );

  async function handleUseVoucher(voucher: CustomerVoucher) {
    if (voucher.type === "FREE_SHIPPING") {
      throw new Error(
        "Voucher gratis ongkir hanya dapat digunakan saat Checkout karena ongkir belum dihitung di Cart.",
      );
    }

    if (selectedSubtotal <= 0) {
      throw new Error("Pilih minimal satu produk terlebih dahulu.");
    }

    const result = await validateVoucherAction({
      code: voucher.code,
      subtotal: selectedSubtotal,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    if (!result.voucher) {
      throw new Error("Data voucher tidak lengkap.");
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("voucher", result.voucher.id);

    router.replace(
      params.toString()
        ? `/cart?${params.toString()}`
        : "/cart",
      { scroll: false },
    );
  }

  return (
    <section className="border-t border-slate-100 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />

        <h2 className="text-base font-bold text-slate-950">
          Harga WOW!
          <span className="ml-1 text-emerald-600">
            Promo Dahsyat!
          </span>
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setShowVouchers((value) => !value)}
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-cyan-700">
          <Ticket className="h-4 w-4" />
          Lihat Voucher Saya
        </span>

        <ChevronRight
          className={[
            "h-4 w-4 text-cyan-700 transition-transform",
            showVouchers ? "rotate-90" : "",
          ].join(" ")}
        />
      </button>

      {showVouchers && (
        <CustomerVoucherPicker
          subtotal={selectedSubtotal}
          onUse={handleUseVoucher}
          autoUseVoucherId={appliedVoucherId}
          allowFreeShipping={false}
          compact
        />
      )}
    </section>
  );
}
