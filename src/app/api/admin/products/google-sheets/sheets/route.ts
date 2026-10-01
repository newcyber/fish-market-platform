import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import productGoogleSheetsSyncService from "@/services/product/product-google-sheets-sync.service";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const spreadsheetId = new URL(request.url).searchParams.get("spreadsheetId");

    const sheets = await productGoogleSheetsSyncService.listSheets(spreadsheetId);

    return NextResponse.json({
      success: true,
      data: sheets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil daftar sheet.";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;

    return NextResponse.json(
      { success: false, message },
      { status },
    );
  }
}
