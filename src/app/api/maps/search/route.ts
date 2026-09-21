import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

export async function GET(
  request: NextRequest
) {
  try {
    const query =
      request.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    if (query.length < 4) {
      return NextResponse.json([]);
    }

    const url = new URL(NOMINATIM_URL);

    url.searchParams.set("q", `${query}, Indonesia`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "id");
    url.searchParams.set("accept-language", "id");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PisjoMarket/1.0 (address-search)",
      },
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            "Layanan pencarian alamat sedang tidak tersedia.",
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "[MAP_SEARCH_API_ERROR]",
      error
    );

    return NextResponse.json(
      {
        message: "Gagal mencari alamat.",
      },
      {
        status: 500,
      }
    );
  }
}