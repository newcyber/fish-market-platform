import { FlashSaleForm } from "@/components/admin/flash-sales/FlashSaleForm";

/**
 * ============================================================
 * CREATE FLASH SALE PAGE
 * ============================================================
 */

export const dynamic = "force-dynamic";

export default function CreateFlashSalePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Buat Flash Sale
        </h1>

        <p className="mt-2 text-muted-foreground">
          Buat campaign Flash Sale baru dan tentukan periode
          promo.
        </p>
      </div>

      {/* ==================================================== */}
      {/* FORM */}
      {/* ==================================================== */}

      <FlashSaleForm
        mode="create"
      />
    </div>
  );
}