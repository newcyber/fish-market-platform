import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
  totalQuantity: number;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CartSummary({
  subtotal,
  totalQuantity,
}: CartSummaryProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Ringkasan Belanja
      </h2>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Total Produk
          </span>

          <span className="font-medium text-slate-900">
            {totalQuantity} item
          </span>
        </div>

        <div className="border-t border-slate-200" />

        <div className="flex items-end justify-between gap-4">
          <span className="text-base font-medium text-slate-700">
            Subtotal
          </span>

          <span className="text-xl font-bold text-slate-900">
            {formatRupiah(subtotal)}
          </span>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          Ongkos kirim dan total pembayaran akan
          dihitung pada tahap checkout.
        </p>
      </div>

      <Link
        href="/customer/checkout"
        className="
          mt-6
          flex
          h-12
          w-full
          items-center
          justify-center
          rounded-xl
          bg-cyan-600
          px-4
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-cyan-700
        "
      >
        Lanjut ke Checkout
      </Link>
    </aside>
  );
}