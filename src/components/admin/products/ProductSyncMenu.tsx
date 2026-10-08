"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  Settings2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SyncType =
  | "PRICE"
  | "STOCK"
  | "PRICE_STOCK";

interface SyncResponse {
  success?: boolean;
  message?: string;
  data?: {
    processedRows?: number;
    invalidRows?: number;
    priceUpdated?: number;
    stockUpdated?: number;
    missingSkus?: number;
    inactiveSkus?: number;
    productNotFound?: number;
    variantNotFound?: number;
    ambiguousMatches?: number;
    changedRows?: number;
  };
}

function formatResult(
  type: SyncType,
  data: SyncResponse["data"],
) {
  const parts: string[] = [];

  if (type === "PRICE" || type === "PRICE_STOCK") {
    parts.push(
      `${data?.priceUpdated ?? 0} harga`,
    );
  }

  if (type === "STOCK" || type === "PRICE_STOCK") {
    parts.push(
      `${data?.stockUpdated ?? 0} stok`,
    );
  }

  return [
    parts.join(" dan "),
    `${data?.changedRows ?? 0} SKU berubah`,
    data?.productNotFound
      ? `${data.productNotFound} produk tidak ditemukan`
      : null,
    data?.variantNotFound
      ? `${data.variantNotFound} varian/SKU tidak ditemukan`
      : null,
    data?.ambiguousMatches
      ? `${data.ambiguousMatches} mapping ambigu`
      : null,
    data?.missingSkus
      ? `${data.missingSkus} SKU tidak ditemukan`
      : null,
    data?.inactiveSkus
      ? `${data.inactiveSkus} SKU tidak aktif`
      : null,
    data?.invalidRows
      ? `${data.invalidRows} baris invalid`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export function ProductSyncMenu() {
  const router = useRouter();

  const [pendingType, setPendingType] =
    React.useState<SyncType | null>(null);

  async function runSync(type: SyncType) {
    if (pendingType) {
      return;
    }

    setPendingType(type);

    try {
      const response =
        await fetch(
          "/api/admin/products/google-sheets/sync",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              type,
            }),
          },
        );

      const payload =
        (await response.json()) as SyncResponse;

      if (
        !response.ok ||
        payload.success !== true
      ) {
        throw new Error(
          payload.message ??
            "Sinkronisasi gagal.",
        );
      }

      toast.success(
        "Sinkronisasi selesai",
        {
          description:
            formatResult(
              type,
              payload.data,
            ),
          duration: 7000,
        },
      );

      router.refresh();
    } catch (error) {
      toast.error(
        "Sinkronisasi gagal",
        {
          description:
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat sinkronisasi.",
          duration: 8000,
        },
      );
    } finally {
      setPendingType(null);
    }
  }

  function renderIcon(type: SyncType) {
    if (pendingType === type) {
      return (
        <Loader2 className="h-4 w-4 animate-spin" />
      );
    }

    if (type === "PRICE") {
      return (
        <Tag className="h-4 w-4 text-emerald-600" />
      );
    }

    if (type === "STOCK") {
      return (
        <Boxes className="h-4 w-4 text-blue-600" />
      );
    }

    return (
      <RefreshCw className="h-4 w-4 text-violet-600" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={Boolean(pendingType)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-primary/50 bg-background px-3 text-sm font-medium text-primary shadow-xs transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {pendingType ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span>Sinkronisasi</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[290px]"
      >
        <DropdownMenuItem
          disabled={Boolean(pendingType)}
          onClick={() => {
            void runSync("PRICE");
          }}
          className="items-start gap-3 px-3 py-2.5"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50">
            {renderIcon("PRICE")}
          </span>

          <span className="min-w-0">
            <span className="block font-medium">
              Sinkronisasi Harga
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Update harga dari spreadsheet
            </span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={Boolean(pendingType)}
          onClick={() => {
            void runSync("STOCK");
          }}
          className="items-start gap-3 px-3 py-2.5"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50">
            {renderIcon("STOCK")}
          </span>

          <span className="min-w-0">
            <span className="block font-medium">
              Sinkronisasi Stok
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Update stok dari spreadsheet
            </span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={Boolean(pendingType)}
          onClick={() => {
            void runSync("PRICE_STOCK");
          }}
          className="items-start gap-3 px-3 py-2.5"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50">
            {renderIcon("PRICE_STOCK")}
          </span>

          <span className="min-w-0">
            <span className="block font-medium">
              Sinkronisasi Harga &amp; Stok
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Update harga dan stok sekaligus
            </span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            router.push(
              "/admin/products/google-sheets",
            );
          }}
          className="gap-3 px-3 py-2.5"
        >
          <Settings2 className="h-4 w-4" />

          <span className="flex-1">
            Pengaturan Google Spreadsheet
          </span>

          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProductSyncMenu;
