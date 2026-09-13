export interface RegionItem {
  code: string;
  name: string;
}

interface WilayahApiItem {
  code?: string;
  name?: string;
}

interface WilayahApiResponse {
  data?: WilayahApiItem[];
}

const WILAYAH_API_BASE =
  "https://wilayah.id/api";

const CACHE_SECONDS = 60 * 60 * 24;

export default class RegionService {
  private static async fetchRegions(
    url: string,
  ): Promise<RegionItem[]> {
    const response = await fetch(url, {
      next: {
        revalidate: CACHE_SECONDS,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data wilayah. HTTP ${response.status}.`,
      );
    }

    const result =
      (await response.json()) as WilayahApiResponse;

    if (!Array.isArray(result.data)) {
      throw new Error(
        "Format data wilayah dari provider tidak valid.",
      );
    }

    return result.data
      .filter(
        (item): item is Required<WilayahApiItem> =>
          typeof item.code === "string" &&
          typeof item.name === "string",
      )
      .map((item) => ({
        code: item.code.trim(),
        name: item.name.trim(),
      }))
      .filter(
        (item) =>
          item.code.length > 0 &&
          item.name.length > 0,
      );
  }

  static async getProvinces(): Promise<RegionItem[]> {
    return this.fetchRegions(
      `${WILAYAH_API_BASE}/provinces.json`,
    );
  }

  static async getCities(
    provinceCode: string,
  ): Promise<RegionItem[]> {
    const code = provinceCode.trim();

    if (!code) {
      throw new Error(
        "Kode provinsi wajib diisi.",
      );
    }

    return this.fetchRegions(
      `${WILAYAH_API_BASE}/regencies/${encodeURIComponent(code)}.json`,
    );
  }

  static async getDistricts(
    cityCode: string,
  ): Promise<RegionItem[]> {
    const code = cityCode.trim();

    if (!code) {
      throw new Error(
        "Kode kabupaten/kota wajib diisi.",
      );
    }

    return this.fetchRegions(
      `${WILAYAH_API_BASE}/districts/${encodeURIComponent(code)}.json`,
    );
  }

  static async getVillages(
    districtCode: string,
  ): Promise<RegionItem[]> {
    const code = districtCode.trim();

    if (!code) {
      throw new Error(
        "Kode kecamatan wajib diisi.",
      );
    }

    return this.fetchRegions(
      `${WILAYAH_API_BASE}/villages/${encodeURIComponent(code)}.json`,
    );
  }
}
