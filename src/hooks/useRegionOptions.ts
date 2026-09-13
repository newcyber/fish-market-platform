"use client";

import { useCallback, useEffect, useState } from "react";

import type { RegionOption } from "@/components/customer/address/RegionSelector";

interface RegionsResponse {
  success: boolean;
  data?: RegionOption[];
  error?: string;
}

interface UseRegionOptionsReturn {
  provinces: RegionOption[];
  cities: RegionOption[];
  districts: RegionOption[];
  villages: RegionOption[];

  provincesLoading: boolean;
  citiesLoading: boolean;
  districtsLoading: boolean;
  villagesLoading: boolean;

  error: string | null;

  loadCities: (
    provinceCode: string,
  ) => Promise<RegionOption[]>;

  loadDistricts: (
    cityCode: string,
  ) => Promise<RegionOption[]>;

  loadVillages: (
    districtCode: string,
  ) => Promise<RegionOption[]>;

  clearCities: () => void;
  clearDistricts: () => void;
  clearVillages: () => void;
}

async function fetchRegions(
  url: string,
): Promise<RegionOption[]> {
  const response = await fetch(url);

  let result: RegionsResponse;

  try {
    result =
      (await response.json()) as RegionsResponse;
  } catch {
    throw new Error(
      "Respons server tidak valid.",
    );
  }

  if (
    !response.ok ||
    !result.success ||
    !Array.isArray(result.data)
  ) {
    throw new Error(
      result.error ??
        "Gagal mengambil data wilayah.",
    );
  }

  return result.data;
}

export default function useRegionOptions(): UseRegionOptionsReturn {
  const [provinces, setProvinces] =
    useState<RegionOption[]>([]);

  const [cities, setCities] =
    useState<RegionOption[]>([]);

  const [districts, setDistricts] =
    useState<RegionOption[]>([]);

  const [villages, setVillages] =
    useState<RegionOption[]>([]);

  const [provincesLoading, setProvincesLoading] =
    useState(false);

  const [citiesLoading, setCitiesLoading] =
    useState(false);

  const [districtsLoading, setDistrictsLoading] =
    useState(false);

  const [villagesLoading, setVillagesLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProvinces() {
      setProvincesLoading(true);
      setError(null);

      try {
        const data = await fetchRegions(
          "/api/regions/provinces",
        );

        if (!cancelled) {
          setProvinces(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data provinsi.",
          );
        }
      } finally {
        if (!cancelled) {
          setProvincesLoading(false);
        }
      }
    }

    void loadProvinces();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadCities = useCallback(
    async (
      provinceCode: string,
    ): Promise<RegionOption[]> => {
      if (!provinceCode) {
        setCities([]);
        return [];
      }

      setCitiesLoading(true);
      setError(null);

      try {
        const data = await fetchRegions(
          `/api/regions/cities?provinceCode=${encodeURIComponent(
            provinceCode,
          )}`,
        );

        setCities(data);

        return data;
      } catch (err) {
        setCities([]);

        const message =
          err instanceof Error
            ? err.message
            : "Gagal mengambil data kabupaten/kota.";

        setError(message);

        return [];
      } finally {
        setCitiesLoading(false);
      }
    },
    [],
  );

  const loadDistricts = useCallback(
    async (
      cityCode: string,
    ): Promise<RegionOption[]> => {
      if (!cityCode) {
        setDistricts([]);
        return [];
      }

      setDistrictsLoading(true);
      setError(null);

      try {
        const data = await fetchRegions(
          `/api/regions/districts?cityCode=${encodeURIComponent(
            cityCode,
          )}`,
        );

        setDistricts(data);

        return data;
      } catch (err) {
        setDistricts([]);

        const message =
          err instanceof Error
            ? err.message
            : "Gagal mengambil data kecamatan.";

        setError(message);

        return [];
      } finally {
        setDistrictsLoading(false);
      }
    },
    [],
  );

  const loadVillages = useCallback(
    async (
      districtCode: string,
    ): Promise<RegionOption[]> => {
      if (!districtCode) {
        setVillages([]);
        return [];
      }

      setVillagesLoading(true);
      setError(null);

      try {
        const data = await fetchRegions(
          `/api/regions/villages?districtCode=${encodeURIComponent(
            districtCode,
          )}`,
        );

        setVillages(data);

        return data;
      } catch (err) {
        setVillages([]);

        const message =
          err instanceof Error
            ? err.message
            : "Gagal mengambil data kelurahan/desa.";

        setError(message);

        return [];
      } finally {
        setVillagesLoading(false);
      }
    },
    [],
  );

  const clearCities = useCallback(() => {
    setCities([]);
  }, []);

  const clearDistricts = useCallback(() => {
    setDistricts([]);
  }, []);

  const clearVillages = useCallback(() => {
    setVillages([]);
  }, []);

  return {
    provinces,
    cities,
    districts,
    villages,

    provincesLoading,
    citiesLoading,
    districtsLoading,
    villagesLoading,

    error,

    loadCities,
    loadDistricts,
    loadVillages,

    clearCities,
    clearDistricts,
    clearVillages,
  };
}