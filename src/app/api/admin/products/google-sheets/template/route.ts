import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import productGoogleSheetsSyncService, {
  type ProductGoogleSheetsSyncTemplateRow,
} from "@/services/product/product-google-sheets-sync.service";

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  try {
    await requireAdmin();

    const rows: ProductGoogleSheetsSyncTemplateRow[] =
      await productGoogleSheetsSyncService.getSyncTemplateRows();

    const header = ["SKU", "PRODUK", "VARIAN", "STATUS", "HARGA", "STOK"];
    const csvRows = [
      header,
      ...rows.map((row: ProductGoogleSheetsSyncTemplateRow) => [
        row.sku,
        row.product,
        row.variant,
        row.status,
        row.price,
        row.stock,
      ]),
    ];

    const csv = "\\uFEFF" + csvRows.map((row) => row.map(escapeCsv).join(",")).join("\\r\\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="PISJO_SYNC_template.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat template PISJO_SYNC.";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Anda harus login." }, { status: 401 });
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Anda tidak memiliki akses." }, { status: 403 });
    }

    console.error("[ADMIN_PRODUCT_GOOGLE_SHEETS_TEMPLATE]", error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
