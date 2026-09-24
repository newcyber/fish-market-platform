"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Filter,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductToolbarProps {
  search?: string;
  status?: string;
  category?: string;
  stock?: string;
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

export function ProductToolbar({
  search = "",
  status = "all",
  category = "all",
  stock = "all",
  categories = [],
}: ProductToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(search);
  const [statusValue, setStatusValue] = useState(status);
  const [categoryValue, setCategoryValue] = useState(category);
  const [stockValue, setStockValue] = useState(stock);

useEffect(() => {
  const timeout = window.setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }

    if (categoryValue && categoryValue !== "all") {
      params.set("category", categoryValue);
    } else {
      params.delete("category");
    }

    if (statusValue && statusValue !== "all") {
      params.set("status", statusValue);
    } else {
      params.delete("status");
    }

    if (stockValue && stockValue !== "all") {
      params.set("stock", stockValue);
    } else {
      params.delete("stock");
    }

    // Filter/search berubah → kembali ke halaman pertama.
    params.delete("page");

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    // Hindari router.replace() jika URL tidak berubah.
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (nextUrl === currentUrl) {
      return;
    }

    router.replace(nextUrl);
  }, 400);

  return () => {
    window.clearTimeout(timeout);
  };
}, [
  searchValue,
  categoryValue,
  statusValue,
  stockValue,
  pathname,
  router,
  searchParams,
]);

  const hasFilters =
    Boolean(searchValue.trim()) ||
    categoryValue !== "all" ||
    statusValue !== "all" ||
    stockValue !== "all";

  function resetFilters() {
    setSearchValue("");
    setStatusValue("all");
    setCategoryValue("all");
    setStockValue("all");

    router.replace(pathname);
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              placeholder="Cari nama produk, SKU, atau variant..."
              className="h-10 pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0">
            <Select
              value={statusValue}
              onValueChange={(value) => {
                setStatusValue(value ?? "all");
              }}
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Semua Status
                </SelectItem>

                <SelectItem value="published">
                  Published
                </SelectItem>

                <SelectItem value="draft">
                  Draft
                </SelectItem>

                <SelectItem value="featured">
                  Featured
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryValue}
              onValueChange={(value) => {
                setCategoryValue(value ?? "all");
              }}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Semua Kategori
                </SelectItem>

                {categories.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={stockValue}
              onValueChange={(value) => {
                setStockValue(value ?? "all");
              }}
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Stok" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Semua Stok
                </SelectItem>

                <SelectItem value="available">
                  Tersedia
                </SelectItem>

                <SelectItem value="low">
                  Menipis
                </SelectItem>

                <SelectItem value="out">
                  Habis
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-8 items-center gap-2 text-sm text-muted-foreground">
            {hasFilters ? (
              <>
                <Filter className="h-4 w-4" />

                <span>Filter aktif</span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </>
            ) : (
              <span>
                Cari dan filter katalog produk dengan cepat.
              </span>
            )}
          </div>

          <Link
            href="/admin/products/create"
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductToolbar;
