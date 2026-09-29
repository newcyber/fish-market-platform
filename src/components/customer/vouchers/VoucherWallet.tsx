"use client";

import { useEffect, useState } from "react";
import { VoucherType, VoucherDiscountType } from "@prisma/client";

type Voucher = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: VoucherType;
  discountType: VoucherDiscountType;
  discountValue: string | number;
  minimumPurchase: string | number | null;
  maximumDiscount: string | number | null;
  maximumShippingDiscount: string | number | null;
  claimLimit: number | null;
  claimCount: number;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startAt: string | null;
  endAt: string | null;
  claimable: boolean;
  userVouchers?: Array<{ id: string; claimedAt: string }>;
  usages?: Array<{
    usedAt: string;
    discountAmount: string | number;
    shippingDiscountAmount: string | number;
  }>;
};

function rupiah(value: string | number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function benefit(voucher: Voucher) {
  if (voucher.type === VoucherType.FREE_SHIPPING) {
    const max = Number(voucher.maximumShippingDiscount ?? 0);
    return max > 0 ? `Gratis ongkir hingga ${rupiah(max)}` : "Gratis ongkir";
  }

  if (voucher.discountType === VoucherDiscountType.PERCENTAGE) {
    const max = voucher.maximumDiscount
      ? ` maks. ${rupiah(voucher.maximumDiscount)}`
      : "";
    return `${voucher.discountValue}%${max}`;
  }

  return `${rupiah(voucher.discountValue)} off`;
}

function VoucherCard({
  voucher,
  claimed,
  onClaim,
}: {
  voucher: Voucher;
  claimed: boolean;
  onClaim: (id: string) => void;
}) {
  const loading = false;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
            {voucher.type === VoucherType.FREE_SHIPPING ? "Gratis Ongkir" : "Voucher Diskon"}
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{voucher.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-700">{benefit(voucher)}</p>
        </div>

        <button
          type="button"
          disabled={claimed || loading}
          onClick={() => onClaim(voucher.id)}
          className="shrink-0 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {claimed ? "Sudah Diklaim" : "Klaim"}
        </button>
      </div>

      {voucher.description && (
        <p className="mt-3 text-xs leading-5 text-slate-500">{voucher.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
        {Number(voucher.minimumPurchase ?? 0) > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            Min. {rupiah(voucher.minimumPurchase)}
          </span>
        )}
        {voucher.endAt && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            Berlaku sampai {new Date(voucher.endAt).toLocaleDateString("id-ID")}
          </span>
        )}
      </div>
    </div>
  );
}

export function VoucherWallet() {
  const [available, setAvailable] = useState<Voucher[]>([]);
  const [mine, setMine] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/vouchers", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memuat voucher.");

      setAvailable(result.data.available ?? []);
      setMine(
        (result.data.mine ?? []).map((item: { voucher: Voucher }) => ({
          ...item.voucher,
          usages: item.voucher.usages,
        })),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat voucher.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function claim(id: string) {
    setClaimingId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/customer/vouchers/${id}/claim`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengklaim voucher.");

      setMessage("Voucher berhasil masuk ke Voucher Saya.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengklaim voucher.");
    } finally {
      setClaimingId(null);
    }
  }

  const mineIds = new Set(mine.map((voucher) => voucher.id));

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Memuat voucher...</div>;
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          {message}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Voucher Tersedia</h2>
          <p className="mt-1 text-sm text-slate-500">Klaim voucher sebelum digunakan saat checkout.</p>
        </div>

        {available.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Belum ada voucher yang dapat diklaim.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {available.map((voucher) => (
              <div key={voucher.id} className={claimingId === voucher.id ? "opacity-60" : ""}>
                <VoucherCard
                  voucher={voucher}
                  claimed={mineIds.has(voucher.id)}
                  onClaim={claim}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Voucher Saya</h2>
          <p className="mt-1 text-sm text-slate-500">Voucher yang sudah Anda klaim dan dapat digunakan saat checkout.</p>
        </div>

        {mine.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Anda belum memiliki voucher.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mine.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} claimed onClaim={claim} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
