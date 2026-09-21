
export interface RegionItem {
  code: string;
  name: string;
  postalCode?: string | null;
}

interface EmsifaVillageItem {
  id?: string;
  name?: string;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  has_path?: boolean;
}

interface EmsifaVillageResponse {
  data?: EmsifaVillageItem[];
}

interface WilayahApiItem {
  code?: string;
  name?: string;
}

interface WilayahApiResponse {
  data?: WilayahApiItem[];
}

const WILAYAH_API_BASE = "https://wilayah.id/api";

const EMSIFA_API_BASE =
  "https://www.emsifa.com/api-wilayah-indonesia/v2";

const CACHE_SECONDS = 60 * 60 * 24;

export default class RegionService {
  /**
   * Mengambil data wilayah dari Wilayah.id.
   *
   * Digunakan untuk:
   * - Provinsi
   * - Kabupaten/Kota
   * - Kecamatan
   */
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

  /**
   * Mengambil daftar kelurahan beserta kode pos
   * dari Emsifa API V2.
   *
   * Contoh:
   * /villages/31.74.09.json
   */
  static async getVillagesWithPostalCode(
    districtCode: string,
  ): Promise<RegionItem[]> {
    const normalizedDistrictCode = districtCode.trim();

    if (!normalizedDistrictCode) {
      return [];
    }

    const response = await fetch(
      `${EMSIFA_API_BASE}/villages/${encodeURIComponent(
        normalizedDistrictCode,
      )}.json`,
      {
        next: {
          revalidate: CACHE_SECONDS,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data kelurahan dari Emsifa: ${response.status}.`,
      );
    }

    const result =
      (await response.json()) as EmsifaVillageResponse;

    if (!Array.isArray(result.data)) {
      throw new Error(
        "Format response kelurahan Emsifa tidak valid.",
      );
    }

    return result.data
      .filter(
        (
          item,
        ): item is EmsifaVillageItem & {
          id: string;
          name: string;
        } =>
          typeof item.id === "string" &&
          item.id.trim().length > 0 &&
          typeof item.name === "string" &&
          item.name.trim().length > 0,
      )
      .map((item) => ({
        code: item.id.trim(),
        name: item.name.trim(),
        postalCode:
          typeof item.postal_code === "string"
            ? item.postal_code.trim() || null
            : null,
      }))
      .filter(
        (item) =>
          item.code.length > 0 &&
          item.name.length > 0,
      );
  }

  /**
   * Mengambil daftar provinsi.
   */
  static async getProvinces(): Promise<RegionItem[]> {
    return this.fetchRegions(
      `${WILAYAH_API_BASE}/provinces.json`,
    );
  }

  /**
   * Mengambil daftar kabupaten/kota
   * berdasarkan kode provinsi.
   */
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
      `${WILAYAH_API_BASE}/regencies/${encodeURIComponent(
        code,
      )}.json`,
    );
  }

  /**
   * Mengambil daftar kecamatan
   * berdasarkan kode kabupaten/kota.
   */
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
      `${WILAYAH_API_BASE}/districts/${encodeURIComponent(
        code,
      )}.json`,
    );
  }

  /**
   * Mengambil daftar kelurahan beserta kode pos.
   *
   * Method ini mempertahankan nama method lama
   * agar route API yang sudah ada tetap kompatibel.
   */
  static async getVillages(
    districtCode: string,
  ): Promise<RegionItem[]> {
    const code = districtCode.trim();

    if (!code) {
      throw new Error(
        "Kode kecamatan wajib diisi.",
      );
    }

    return this.getVillagesWithPostalCode(code);
  }
}
