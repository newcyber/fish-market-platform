import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin";
import productGoogleSheetsSyncService, {
  type ProductGoogleSheetsSyncType,
} from "@/services/product/product-google-sheets-sync.service";

function authError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      {
        success: false,
        message: "Anda harus login.",
      },
      { status: 401 },
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        success: false,
        message: "Anda tidak memiliki akses.",
      },
      { status: 403 },
    );
  }

  return null;
}

function parseType(value: unknown): ProductGoogleSheetsSyncType | null {
  if (
    value === "PRICE" ||
    value === "STOCK" ||
    value === "PRICE_STOCK"
  ) {
    return value;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    const body =
      (await request.json()) as {
        type?: unknown;
      };

    const type = parseType(body?.type);

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tipe sinkronisasi tidak valid.",
        },
        { status: 400 },
      );
    }

    const result =
      await productGoogleSheetsSyncService.sync(
        type,
        session.user.id,
      );

    return NextResponse.json({
      success: true,
      message:
        "Sinkronisasi Google Sheets berhasil diproses.",
      data: result,
    });
  } catch (error) {
    const authResponse =
      authError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error(
      "[ADMIN_PRODUCT_GOOGLE_SHEETS_SYNC]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal melakukan sinkronisasi Google Sheets.",
      },
      { status: 400 },
    );
  }
}
