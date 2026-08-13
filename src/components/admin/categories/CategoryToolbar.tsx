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

interface CategoryToolbarProps {
  search?: string;
}

export function CategoryToolbar({
  search = "",
}: CategoryToolbarProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] =
    useState(search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      if (searchValue.trim()) {
        params.set(
          "search",
          searchValue.trim()
        );
      } else {
        params.delete("search");
      }

      const nextUrl =
        `${pathname}?${params.toString()}`;

      const currentUrl =
        `${pathname}?${searchParams.toString()}`;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    searchValue,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={searchValue}
          onChange={(e) =>
            setSearchValue(
              e.target.value
            )
          }
          placeholder="Cari kategori..."
          className="pl-10"
        />
      </div>

      <Link href="/admin/categories/create">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </Link>
    </div>
  );
}

export default CategoryToolbar;