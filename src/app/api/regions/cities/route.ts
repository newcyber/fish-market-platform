import { NextRequest, NextResponse } from "next/server";

import RegionService from "@/services/region/region.service";

export async function GET(
  request: NextRequest,
) {
  try {
    const provinceCode =
      request.nextUrl.searchParams.get(
        "provinceCode",
      )?.trim();

    if (!provinceCode) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message:
            "Parameter provinceCode wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    const data =
      await RegionService.getCities(
        provinceCode,
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "[REGIONS_CITIES_GET]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        message:
          "Gagal mengambil daftar kabupaten/kota.",
      },
      {
        status: 500,
      },
    );
  }
}
