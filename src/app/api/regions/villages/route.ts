import { NextRequest, NextResponse } from "next/server";

import RegionService from "@/services/region/region.service";

export async function GET(
  request: NextRequest,
) {
  try {
    const districtCode =
      request.nextUrl.searchParams.get(
        "districtCode",
      )?.trim();

    if (!districtCode) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message:
            "Parameter districtCode wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    const data =
      await RegionService.getVillages(
        districtCode,
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "[REGIONS_VILLAGES_GET]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        message:
          "Gagal mengambil daftar kelurahan/desa.",
      },
      {
        status: 500,
      },
    );
  }
}
