import {
  notFound,
} from "next/navigation";

import {
  FlashSaleForm,
} from "@/components/admin/flash-sales/FlashSaleForm";

import {
  prisma,
} from "@/lib/prisma";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface FlashSaleEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * EDIT FLASH SALE PAGE
 * ============================================================
 */

export default async function FlashSaleEditPage({
  params,
}: FlashSaleEditPageProps) {
  /**
   * ==========================================================
   * PARAMS
   * ==========================================================
   */

  const {
    id,
  } = await params;

  /**
   * ==========================================================
   * GET FLASH SALE
   * ==========================================================
   */

  const flashSale =
    await prisma.flashSale.findFirst({
      where: {
        id,

        deletedAt: null,
      },

      select: {
        id: true,

        name: true,

        slug: true,

        description: true,

        status: true,

        startAt: true,

        endAt: true,
      },
    });

  /**
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   */

  if (!flashSale) {
    notFound();
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Flash Sale
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui informasi dan jadwal campaign
          Flash Sale.
        </p>
      </div>

      {/* FORM */}

      <FlashSaleForm
        mode="edit"
        initialData={{
          id: flashSale.id,

          name: flashSale.name,

          slug: flashSale.slug,

          description:
            flashSale.description,

          status:
            flashSale.status,

          startAt:
            flashSale.startAt,

          endAt:
            flashSale.endAt,
        }}
      />
    </div>
  );
}