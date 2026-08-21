"use client";

import Link from "next/link";

import {
  Calendar,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FlashSaleTableItem {
  id: string;

  name: string;

  slug: string;

  status: string;

  startAt: Date;

  endAt: Date;

  createdAt: Date;

  updatedAt: Date;

  itemCount: number;
}

interface FlashSaleTableProps {
  flashSales: FlashSaleTableItem[];
}

/**
 * ============================================================
 * FLASH SALE TABLE
 * ============================================================
 *
 * Menampilkan daftar campaign Flash Sale.
 *
 * Features:
 *
 * - Campaign name
 * - Status
 * - Schedule
 * - Total items
 * - Detail action
 * - Edit action
 * - Empty state
 * - Responsive layout
 */

/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(date)
  );
}

/**
 * ============================================================
 * GET STATUS STYLE
 * ============================================================
 */

function getStatusStyle(
  status: string
) {
  switch (
    status
  ) {
    case "ACTIVE":
      return {
        label: "Aktif",

        className:
          "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
      };

    case "DRAFT":
      return {
        label: "Draft",

        className:
          "bg-muted text-muted-foreground",
      };

    case "ENDED":
      return {
        label: "Berakhir",

        className:
          "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
      };

    case "INACTIVE":
      return {
        label: "Tidak Aktif",

        className:
          "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
      };

    default:
      return {
        label:
          status,

        className:
          "bg-muted text-muted-foreground",
      };
  }
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function FlashSaleTable({
  flashSales,
}: FlashSaleTableProps) {
  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (
    flashSales.length === 0
  ) {
    return (
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-7 w-7 text-muted-foreground" />
          </div>

          <div>
            <h3 className="text-lg font-semibold">
              Belum ada Flash Sale
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Buat campaign Flash Sale pertama
              untuk mulai menawarkan promo
              dengan harga spesial.
            </p>
          </div>

          <Link
            href="/admin/flash-sales/create"
            className={buttonVariants()}
          >
            Buat Flash Sale
          </Link>
        </CardContent>
      </Card>
    );
  }

  /**
   * ==========================================================
   * TABLE
   * ==========================================================
   */

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="h-12 px-6 text-left text-sm font-medium text-muted-foreground">
                  Campaign
                </th>

                <th className="h-12 px-6 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>

                <th className="h-12 px-6 text-left text-sm font-medium text-muted-foreground">
                  Periode
                </th>

                <th className="h-12 px-6 text-center text-sm font-medium text-muted-foreground">
                  Produk
                </th>

                <th className="h-12 px-6 text-right text-sm font-medium text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {
                flashSales.map(
                  (
                    flashSale
                  ) => {
                    const status =
                      getStatusStyle(
                        flashSale.status
                      );

                    return (
                      <tr
                        key={
                          flashSale.id
                        }
                        className="border-b transition-colors hover:bg-muted/30 last:border-b-0"
                      >
                        {/* ==================================== */}
                        {/* CAMPAIGN */}
                        {/* ==================================== */}

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/admin/flash-sales/${flashSale.id}`}
                              className="font-medium transition-colors hover:text-primary"
                            >
                              {
                                flashSale.name
                              }
                            </Link>

                            <span className="text-xs text-muted-foreground">
                              {
                                flashSale.slug
                              }
                            </span>
                          </div>
                        </td>

                        {/* ==================================== */}
                        {/* STATUS */}
                        {/* ==================================== */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                          >
                            {
                              status.label
                            }
                          </span>
                        </td>

                        {/* ==================================== */}
                        {/* PERIOD */}
                        {/* ==================================== */}

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-sm">
                            <span>
                              {
                                formatDate(
                                  flashSale.startAt
                                )
                              }
                            </span>

                            <span className="text-xs text-muted-foreground">
                              sampai
                            </span>

                            <span>
                              {
                                formatDate(
                                  flashSale.endAt
                                )
                              }
                            </span>
                          </div>
                        </td>

                        {/* ==================================== */}
                        {/* ITEM COUNT */}
                        {/* ==================================== */}

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />

                            <span>
                              {
                                flashSale.itemCount
                              }
                            </span>
                          </div>
                        </td>

                        {/* ==================================== */}
{/* ACTION */}
{/* ==================================== */}

<td className="px-6 py-4 text-right">
  <DropdownMenu>
    <DropdownMenuTrigger
      className="
        inline-flex
        h-9
        w-9
        items-center
        justify-center
        rounded-md
        transition-colors
        hover:bg-accent
        hover:text-accent-foreground
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
        focus-visible:ring-offset-2
        disabled:pointer-events-none
        disabled:opacity-50
      "
    >
      <MoreHorizontal className="h-4 w-4" />

      <span className="sr-only">
        Buka menu
      </span>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
    >
      <DropdownMenuItem>
        <Link
          href={`/admin/flash-sales/${flashSale.id}`}
          className="
            flex
            w-full
            items-center
          "
        >
          <Eye className="mr-2 h-4 w-4" />

          Lihat Detail
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem>
        <Link
          href={`/admin/flash-sales/${flashSale.id}/edit`}
          className="
            flex
            w-full
            items-center
          "
        >
          <Pencil className="mr-2 h-4 w-4" />

          Edit Flash Sale
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</td>
                      </tr>
                    );
                  }
                )
              }
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}