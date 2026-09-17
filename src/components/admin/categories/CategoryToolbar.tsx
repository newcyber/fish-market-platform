"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Filter,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryToolbarProps {
  search?: string;
  active?: string;
  status?: string;
}

type CategoryStatus =
  | "all"
  | "active"
  | "inactive"
  | "deleted";

function normalizeStatus(
  active?: string,
  status?: string,
): CategoryStatus {
  if (status === "deleted") {
    return "deleted";
  }

  if (active === "active") {
    return "active";
  }

  if (active === "inactive") {
    return "inactive";
  }

  return "all";
}

export function CategoryToolbar({
  search = "",
  active = "all",
  status = "all",
}: CategoryToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
   * State lokal hanya digunakan untuk input yang sedang diedit
   * oleh user.
   *
   * Nilai awal berasal dari server/URL.
   *
   * Kita sengaja tidak melakukan setState() di useEffect
   * untuk menghindari synchronous state update di effect.
   */
  const [searchValue, setSearchValue] = useState(
    () => search,
  );

  const [statusValue, setStatusValue] =
    useState<CategoryStatus>(() =>
      normalizeStatus(active, status),
    );

  /*
   * Update URL ketika search/status berubah.
   *
   * Search menggunakan debounce 400ms agar tidak melakukan
   * request setiap kali user mengetik satu karakter.
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString(),
      );

      /*
       * SEARCH
       */
      const trimmedSearch = searchValue.trim();

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      } else {
        params.delete("search");
      }

      /*
       * STATUS
       *
       * Recycle Bin:
       * ?status=deleted
       *
       * Active:
       * ?active=active
       *
       * Inactive:
       * ?active=inactive
       */
      if (statusValue === "deleted") {
        params.set("status", "deleted");
        params.delete("active");
      } else {
        params.delete("status");

        if (
          statusValue === "active" ||
          statusValue === "inactive"
        ) {
          params.set("active", statusValue);
        } else {
          params.delete("active");
        }
      }

      /*
       * Setiap perubahan filter kembali ke halaman pertama.
       */
      params.delete("page");

      const query = params.toString();

      const nextUrl = query
        ? `${pathname}?${query}`
        : pathname;

      const currentQuery = searchParams.toString();

      const currentUrl = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname;

      /*
       * Hindari router.replace() jika URL sebenarnya
       * tidak berubah.
       */
      if (nextUrl !== currentUrl) {
        router.replace(nextUrl);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    searchValue,
    statusValue,
    pathname,
    router,
    searchParams,
  ]);

  /*
   * Menentukan apakah tombol Reset perlu ditampilkan.
   */
  const hasFilters =
    Boolean(searchValue.trim()) ||
    statusValue !== "all";

  /*
   * Reset seluruh filter.
   */
  function resetFilters() {
    setSearchValue("");
    setStatusValue("all");

    router.replace(pathname);
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3">
        {/* =====================================================
            SEARCH + STATUS FILTER
        ====================================================== */}
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
              }}
              placeholder="Cari nama atau slug kategori..."
              className="h-10 pl-10"
            />
          </div>

          {/* STATUS + RESET */}
          <div className="flex gap-2">
            <Select
              value={statusValue}
              onValueChange={(value) => {
                setStatusValue(
                  (value || "all") as CategoryStatus,
                );
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-[190px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Semua kategori
                </SelectItem>

                <SelectItem value="active">
                  Aktif
                </SelectItem>

                <SelectItem value="inactive">
                  Nonaktif
                </SelectItem>

                <SelectItem value="deleted">
                  Recycle Bin
                </SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resetFilters}
                title="Reset filter"
                aria-label="Reset filter"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* =====================================================
            HELPER TEXT + ADD CATEGORY
        ====================================================== */}
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <Filter className="h-4 w-4 shrink-0" />

            {statusValue === "deleted" ? (
              <span>
                Menampilkan kategori yang berada
                di Recycle Bin.
              </span>
            ) : (
              <span>
                Cari dan filter kategori dengan
                cepat.
              </span>
            )}
          </p>

          {/* TAMBAH KATEGORI */}
          {statusValue !== "deleted" && (
            <Link href="/admin/categories/create">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kategori
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryToolbar;