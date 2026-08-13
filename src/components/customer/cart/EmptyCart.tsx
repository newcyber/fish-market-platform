import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function EmptyCart() {
  return (
    <div
      className="
        flex
        min-h-[420px]
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-slate-300
        bg-white
        px-6
        py-12
        text-center
      "
    >
      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-slate-100
        "
      >
        <ShoppingCart className="h-8 w-8 text-slate-500" />
      </div>

      <h2 className="mt-6 text-xl font-bold text-slate-900">
        Keranjang Anda masih kosong
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Belum ada produk di keranjang. Yuk pilih seafood
        segar untuk kebutuhan Anda.
      </p>

      <Link
        href="/customer/products"
        className="
          mt-6
          inline-flex
          h-11
          items-center
          justify-center
          rounded-xl
          bg-cyan-600
          px-6
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-cyan-700
        "
      >
        Lihat Produk
      </Link>
    </div>
  );
}