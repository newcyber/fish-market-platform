"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { Plus } from "lucide-react";

import AdminToolbar from "@/components/admin/common/AdminToolbar";
import AdminSearch from "@/components/admin/common/AdminSearch";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerToolbarProps {
  search?: string;
  status?: string;
  segment?: string;
  area?: string;
  areas?: string[];
}

export default function CustomerToolbar({
  search = "",
  status = "all",
  segment = "all",
  area = "all",
  areas = [],
}: CustomerToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Search membutuhkan local state karena user
   * mengetik secara bertahap sebelum URL diperbarui.
   */
  const [searchValue, setSearchValue] =
    useState(search);

  /**
   * URL menjadi source of truth untuk filter.
   */
  const segmentValue =
    searchParams.get("segment") ??
    segment ??
    "all";

  const statusValue =
    searchParams.get("status") ??
    status ??
    "all";

  const areaValue =
    searchParams.get("area") ??
    area ??
    "all";

  /**
   * Sinkronisasi search dari URL dilakukan tanpa
   * setState di useEffect.
   *
   * Search state hanya berubah ketika user mengetik.
   */
  useEffect(() => {
    if (searchValue === search) {
      return;
    }

    /**
     * Tidak perlu melakukan setState.
     *
     * Perubahan search dari URL tidak akan mengganggu
     * filter lain. State search tetap mengikuti input user.
     */
  }, [search, searchValue]);

  /**
   * Debounce search.
   *
   * Filter lain langsung menggunakan URL sebagai source
   * of truth.
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      const currentSearch =
        params.get("search") ?? "";

      const nextSearch =
        searchValue.trim();

      if (
        currentSearch === nextSearch
      ) {
        return;
      }

      if (nextSearch) {
        params.set(
          "search",
          nextSearch
        );
      } else {
        params.delete("search");
      }

      /**
       * Search berubah → kembali ke page 1.
       */
      params.delete("page");

      const queryString =
        params.toString();

      router.replace(
        queryString
          ? `${pathname}?${queryString}`
          : pathname
      );
    }, 400);

    return () =>
      clearTimeout(timeout);
  }, [
    searchValue,
    pathname,
    router,
    searchParams,
  ]);

  /**
   * Update filter.
   *
   * Setiap filter baru menghapus page sehingga
   * hasil selalu dimulai dari halaman pertama.
   */
  const updateFilter = (
    key: "segment" | "status" | "area",
    value: string
  ) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page");

    const queryString =
      params.toString();

    router.replace(
      queryString
        ? `${pathname}?${queryString}`
        : pathname
    );
  };

  return (
    <AdminToolbar
      search={
        <AdminSearch
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Cari nama, HP/WA, atau email..."
        />
      }
      filters={
        <>
          <Select
            value={segmentValue}
            onValueChange={(value) => {
              updateFilter(
                "segment",
                value ?? "all"
              );
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Segmen" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Segmen
              </SelectItem>

              <SelectItem value="BARU">
                Baru
              </SelectItem>

              <SelectItem value="REPEAT">
                Repeat
              </SelectItem>

              <SelectItem value="LOYAL">
                Loyal
              </SelectItem>

              <SelectItem value="VIP">
                VIP
              </SelectItem>

              <SelectItem value="AKTIF">
                Aktif
              </SelectItem>

              <SelectItem value="DORMANT">
                Dormant
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusValue}
            onValueChange={(value) => {
              updateFilter(
                "status",
                value ?? "all"
              );
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Status
              </SelectItem>

              <SelectItem value="active">
                Aktif
              </SelectItem>

              <SelectItem value="inactive">
                Nonaktif
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={areaValue}
            onValueChange={(value) => {
              updateFilter(
                "area",
                value ?? "all"
              );
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Area" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Area
              </SelectItem>

              {areas.map((item) => (
                <SelectItem
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
      actions={
        <Link href="/admin/customers/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Customer
          </Button>
        </Link>
      }
    />
  );
}
