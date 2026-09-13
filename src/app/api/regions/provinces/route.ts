import { NextResponse } from "next/server";

import RegionService from "@/services/region/region.service";

export async function GET() {
  try {
    const data =
      await RegionService.getProvinces();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "[REGIONS_PROVINCES_GET]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        message:
          "Gagal mengambil daftar provinsi.",
      },
      {
        status: 500,
      },
    );
  }
}
