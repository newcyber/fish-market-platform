import Link from "next/link";
import { ChevronRight } from "lucide-react";

import ProductRecommendationCard, {
  type ProductRecommendation,
} from "./ProductRecommendationCard";

interface ProductRecommendationSectionProps {
  title: string;
  products: ProductRecommendation[];
  href?: string;
  showViewAll?: boolean;
}

export default function ProductRecommendationSection({
  title,
  products,
  href,
  showViewAll = false,
}: ProductRecommendationSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-3 bg-white px-5 py-5 lg:px-8 lg:py-6">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h2>

          {showViewAll && href ? (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900 sm:text-sm"
            >
              Lihat Semua Produk
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <div className="mt-4 -mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:-mx-8 lg:px-8">
          <div className="flex snap-x snap-mandatory gap-3">
            {products.map((product) => (
              <div key={product.id} className="snap-start">
                <ProductRecommendationCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
