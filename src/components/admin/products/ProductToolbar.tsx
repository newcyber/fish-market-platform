"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { Plus, Search } from "lucide-react";

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
}

export function ProductToolbar({
  search = "",
  status = "all",
  category = "all",
}: ProductToolbarProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] =
  useState(() => search);

const [statusValue, setStatusValue] =
  useState(() => status);

const [categoryValue, setCategoryValue] =
  useState(() => category);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      } else {
        params.delete("search");
      }

      if (
        categoryValue &&
        categoryValue !== "all"
      ) {
        params.set(
          "category",
          categoryValue
        );
      } else {
        params.delete("category");
      }

      if (
        statusValue &&
        statusValue !== "all"
      ) {
        params.set(
          "status",
          statusValue
        );
      } else {
        params.delete("status");
      }

      router.replace(
        `${pathname}?${params.toString()}`
      );
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    searchValue,
    statusValue,
    categoryValue,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={searchValue}
            onChange={(e) =>
              setSearchValue(
                e.target.value
              )
            }
            placeholder="Cari produk..."
            className="pl-10"
          />
        </div>

        <Select
  value={categoryValue}
  onValueChange={(value) => {
    setCategoryValue(value ?? "all");
  }}
>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              Semua Kategori
            </SelectItem>

            {/*
              Sprint berikutnya:
              kategori dari database
            */}
          </SelectContent>
        </Select>

        <Select
  value={statusValue}
  onValueChange={(value) => {
    setStatusValue(value ?? "all");
  }}
>
          <SelectTrigger className="w-full md:w-44">
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
      </div>

      <Link href="/admin/products/create">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </Link>
    </div>
  );
}

export default ProductToolbar;