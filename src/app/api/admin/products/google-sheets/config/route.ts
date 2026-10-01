import { NextResponse } from "next/server";

import { requireAdmin, requireSuperAdmin } from "@/lib/auth/admin";
import productGoogleSheetsSyncService, {
  type ProductGoogleSheetsConfigInput,
} from "@/services/product/product-google-sheets-sync.service";

function authError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { success: false, message: "Anda harus login." },
      { status: 401 },
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      { success: false, message: "Anda tidak memiliki akses." },
      { status: 403 },
    );
  }

  return null;
}

function parseConfigInput(body: Record<string, unknown>): ProductGoogleSheetsConfigInput {
  return {
    enabled: body.enabled === true,
    spreadsheetId: typeof body.spreadsheetId === "string" ? body.spreadsheetId : null,
    sheetName: typeof body.sheetName === "string" ? body.sheetName : "",
    range: typeof body.range === "string" ? body.range : "",
    skuColumn: typeof body.skuColumn === "string" ? body.skuColumn : "",
    priceColumn: typeof body.priceColumn === "string" ? body.priceColumn : "",
    stockColumn: typeof body.stockColumn === "string" ? body.stockColumn : "",
    headerRow: Number(body.headerRow),
  };
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      success: true,
      data: await productGoogleSheetsSyncService.getPublicConfig(),
    });
  } catch (error) {
    const authResponse = authError(error);
    if (authResponse) return authResponse;

    console.error("[ADMIN_PRODUCT_GOOGLE_SHEETS_CONFIG_GET]", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal mengambil konfigurasi Google Sheets.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();
    const body = (await request.json()) as Record<string, unknown>;

    const result = await productGoogleSheetsSyncService.updateConfig(parseConfigInput(body));

    return NextResponse.json({
      success: true,
      message: "Konfigurasi Google Sheets berhasil disimpan.",
      data: result,
    });
  } catch (error) {
    const authResponse = authError(error);
    if (authResponse) return authResponse;

    console.error("[ADMIN_PRODUCT_GOOGLE_SHEETS_CONFIG_PATCH]", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan konfigurasi Google Sheets.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;

    if (body.action !== "test") {
      return NextResponse.json(
        { success: false, message: "Action tidak valid." },
        { status: 400 },
      );
    }

    const result = await productGoogleSheetsSyncService.testConnection(
      parseConfigInput(body),
    );

    return NextResponse.json({
      success: true,
      message: "Google Sheets berhasil terhubung.",
      data: result,
    });
  } catch (error) {
    const authResponse = authError(error);
    if (authResponse) return authResponse;

    console.error("[ADMIN_PRODUCT_GOOGLE_SHEETS_TEST]", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menguji koneksi Google Sheets.",
      },
      { status: 400 },
    );
  }
}
