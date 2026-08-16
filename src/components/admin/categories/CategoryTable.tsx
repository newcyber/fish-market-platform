"use client";

import { useRouter } from "next/navigation";

import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CategoryTableItem {
  id: string;

  name: string;

  slug: string;

  totalProducts: number;
}

interface CategoryTableProps {
  categories: CategoryTableItem[];
}

export function CategoryTable({
  categories,
}: CategoryTableProps) {
  const router = useRouter();

  /**
   * ============================================================
   * EMPTY STATE
   * ============================================================
   */

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada kategori.
        </p>
      </div>
    );
  }

  /**
   * ============================================================
   * TABLE
   * ============================================================
   */

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                Nama Kategori
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Slug
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Total Produk
              </th>

              <th className="px-4 py-3 text-right font-medium">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                className="border-b last:border-b-0 hover:bg-muted/40"
              >
                {/* ============================================================
                    CATEGORY NAME
                ============================================================ */}

                <td className="px-4 py-4 font-medium">
                  {category.name}
                </td>

                {/* ============================================================
                    SLUG
                ============================================================ */}

                <td className="px-4 py-4 text-muted-foreground">
                  {category.slug}
                </td>

                {/* ============================================================
                    TOTAL PRODUCTS
                ============================================================ */}

                <td className="px-4 py-4 text-center">
                  {category.totalProducts}
                </td>

                {/* ============================================================
                    ACTIONS
                ============================================================ */}

                <td className="px-4 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="
                        inline-flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-md
                        text-muted-foreground
                        transition-colors
                        hover:bg-muted
                        hover:text-foreground
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-ring
                        focus-visible:ring-offset-2
                        disabled:pointer-events-none
                        disabled:opacity-50
                      "
                      aria-label={`Aksi ${category.name}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(
                            `/admin/categories/${category.id}/edit`
                          );
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />

                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          console.log(
                            "Delete category:",
                            category.id
                          );
                        }}
                        className="
                          text-destructive
                          focus:text-destructive
                        "
                      >
                        <Trash2 className="mr-2 h-4 w-4" />

                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}