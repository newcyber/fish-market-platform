import {
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";

export default function CartPromoSection() {
  return (
    <section className="bg-white px-4 py-4 sm:px-5">
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
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-emerald-600">
          <Check className="h-4 w-4" />

          Kamu bisa tebus produk ini
        </span>

        <ChevronRight className="h-4 w-4 text-emerald-600" />
      </button>
    </section>
  );
}
