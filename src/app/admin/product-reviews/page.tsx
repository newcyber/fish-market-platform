import { requireAdmin } from "@/lib/auth/admin";
import ProductReviewModerationTable from "@/components/admin/product-reviews/ProductReviewModerationTable";

export default async function AdminProductReviewsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Product Reviews
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Moderasikan penilaian dan ulasan customer sebelum ditampilkan di
          halaman produk.
        </p>
      </div>

      <ProductReviewModerationTable />
    </div>
  );
}
