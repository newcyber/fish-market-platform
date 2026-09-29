import { VoucherWallet } from "@/components/customer/vouchers/VoucherWallet";

export default function CustomerVouchersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Voucher Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Klaim voucher promo dan gunakan saat checkout Pisjo Market.
        </p>
      </div>

      <VoucherWallet />
    </div>
  );
}
