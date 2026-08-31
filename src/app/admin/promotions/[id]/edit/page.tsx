import {
  notFound,
} from "next/navigation";

import Link from "next/link";

import PromotionService from "@/services/promotion/promotion.service";

import PromotionForm from "@/components/admin/promotions/PromotionForm";

/**
 * ============================================================
 * EDIT PROMOTION PAGE
 * ============================================================
 */

export const dynamic = "force-dynamic";

interface PromotionEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function PromotionEditPage({
  params,
}: PromotionEditPageProps) {
  const {
    id,
  } = await params;

  const promotion =
    await PromotionService.getById(
      id
    );

  if (!promotion) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Promotion
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Perbarui informasi promotion tanpa mengubah lifecycle campaign.
          </p>
        </div>

        <Link
          href={`/admin/promotions/${promotion.id}`}
          className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
        >
          Kembali ke Detail
        </Link>
      </div>

      <PromotionForm
        mode="edit"
        initialData={{
          id: promotion.id,
          name: promotion.name,
          slug: promotion.slug,
          description:
            promotion.description,
          banner:
            promotion.banner,
          type:
            promotion.type,
          discountType:
            promotion.discountType,
          discountValue:
            promotion.discountValue
              ? promotion.discountValue.toString()
              : null,
          startAt:
            promotion.startAt,
          endAt:
            promotion.endAt,
          sortOrder:
            promotion.sortOrder,
          isFeatured:
            promotion.isFeatured,
        }}
      />
    </div>
  );
}
