import { requireAdmin } from "@/lib/auth/admin";
import ProductReviewModerationTable from "@/components/admin/product-reviews/ProductReviewModerationTable";

interface AdminProductReviewsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    rating?: string;
    search?: string;
    sort?: string;
  }>;
}

function normalizePositivePage(value?: string) {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeStatus(value?: string) {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED"
    ? value
    : "";
}

function normalizeRating(value?: string) {
  return value && /^[1-5]$/.test(value) ? value : "";
}

function normalizeSort(value?: string) {
  return value === "oldest" ||
    value === "highest-rating" ||
    value === "lowest-rating"
    ? value
    : "newest";
}

export default async function AdminProductReviewsPage({
  searchParams,
}: AdminProductReviewsPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const initialPage = normalizePositivePage(params.page);
  const initialStatus = normalizeStatus(params.status);
  const initialRating = normalizeRating(params.rating);
  const initialSearch = params.search?.trim() ?? "";
  const initialSort = normalizeSort(params.sort);

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

      <ProductReviewModerationTable
        initialPage={initialPage}
        initialStatus={initialStatus}
        initialRating={initialRating}
        initialSearch={initialSearch}
        initialSort={initialSort}
      />
    </div>
  );
}
