import { NextRequest, NextResponse } from "next/server";

import RegionService from "@/services/region/region.service";

export async function GET(
  request: NextRequest,
) {
  try {
    const cityCode =
      request.nextUrl.searchParams.get(
        "cityCode",
      )?.trim();

    if (!cityCode) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message:
            "Parameter cityCode wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    const data =
      await RegionService.getDistricts(
        cityCode,
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "[REGIONS_DISTRICTS_GET]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        message:
          "Gagal mengambil daftar kecamatan.",
      },
      {
        status: 500,
      },
    );
  }
}
