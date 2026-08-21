import {
  FlashSaleStatus,
} from "@prisma/client";

import FlashSaleService from "@/services/flash-sale/flash-sale.service";

import {
  FlashSaleTable,
  type FlashSaleTableItem,
} from "@/components/admin/flash-sales/FlashSaleTable";

import {
  FlashSaleToolbar,
} from "@/components/admin/flash-sales/FlashSaleToolbar";

/**
 * ============================================================
 * ADMIN FLASH SALE PAGE
 * ============================================================
 */

export const dynamic = "force-dynamic";

interface FlashSalesPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

/**
 * ============================================================
 * PARSE FLASH SALE STATUS
 * ============================================================
 *
 * URL selalu menghasilkan string.
 * Method getMany() membutuhkan FlashSaleStatus.
 */

function parseFlashSaleStatus(
  status?: string
): FlashSaleStatus | undefined {
  if (!status) {
    return undefined;
  }

  const validStatuses =
    Object.values(
      FlashSaleStatus
    );

  if (
    validStatuses.includes(
      status as FlashSaleStatus
    )
  ) {
    return status as FlashSaleStatus;
  }

  return undefined;
}

export default async function FlashSalesPage({
  searchParams,
}: FlashSalesPageProps) {
  const params =
    (await searchParams) ?? {};

  /**
   * ==========================================================
   * PARSE STATUS
   * ==========================================================
   */

  const status =
    parseFlashSaleStatus(
      params.status
    );

  /**
   * ==========================================================
   * GET FLASH SALES
   * ==========================================================
   */

  const result =
    await FlashSaleService.getMany({
      page:
        params.page
          ? Number(params.page)
          : 1,

      search:
        params.search,

      status,
    });

  /**
   * ==========================================================
   * TRANSFORM TABLE DATA
   * ==========================================================
   */

  const tableData: FlashSaleTableItem[] =
    result.data.map(
      (flashSale) => ({
        id:
          flashSale.id,

        name:
          flashSale.name,

        slug:
          flashSale.slug,

        status:
          flashSale.status,

        startAt:
          flashSale.startAt,

        endAt:
          flashSale.endAt,

        createdAt:
          flashSale.createdAt,

        updatedAt:
          flashSale.updatedAt,

        itemCount:
          flashSale._count.items,
      })
    );

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="flex flex-col gap-6">
      {/* ==================================================== */}
      {/* PAGE HEADER */}
      {/* ==================================================== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Flash Sale
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kelola campaign Flash Sale, jadwal,
          dan produk promo.
        </p>
      </div>

      {/* ==================================================== */}
      {/* TOOLBAR */}
      {/* ==================================================== */}

      <FlashSaleToolbar
        search={params.search}
        status={params.status}
      />

      {/* ==================================================== */}
      {/* TABLE */}
      {/* ==================================================== */}

      <FlashSaleTable
        flashSales={tableData}
      />
    </div>
  );
}