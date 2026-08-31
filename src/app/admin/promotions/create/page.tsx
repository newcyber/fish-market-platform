import Link from "next/link";

import PromotionForm from "@/components/admin/promotions/PromotionForm";

export default function CreatePromotionPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8">

          <Link
            href="/admin/promotions"
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            ← Kembali ke Promotion
          </Link>

          <div className="mt-5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Buat Promotion
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Buat promotion baru untuk campaign atau
              program discount produk.
            </p>
          </div>

        </div>

        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <PromotionForm />

      </div>

    </main>
  );
}
