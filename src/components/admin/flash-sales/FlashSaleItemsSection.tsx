"use client";

import {
  useState,
} from "react";

import {
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  Button,
} from "@/components/ui/button";

import {
  FlashSaleItemForm,
  FlashSaleProductOption,
} from "./FlashSaleItemForm";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface FlashSaleItem {
  id: string;

  originalPrice: number;

  flashPrice: number;

  stockLimit: number;

  soldQuantity: number;

  perUserLimit: number;

  sortOrder: number;

  isActive: boolean;

  product: {
    id: string;

    name: string;
  };

  weightOption: {
    id: string;

    label: string;
  } | null;
}

interface FlashSaleItemsSectionProps {
  flashSaleId: string;

  items:
    FlashSaleItem[];

  products:
    FlashSaleProductOption[];
}

/**
 * ============================================================
 * FORMAT CURRENCY
 * ============================================================
 */

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",

      currency: "IDR",

      maximumFractionDigits: 0,
    }
  ).format(value);
}

/**
 * ============================================================
 * FLASH SALE ITEMS SECTION
 * ============================================================
 */

export function FlashSaleItemsSection({
  flashSaleId,

  items,

  products,
}: FlashSaleItemsSectionProps) {
  const router =
    useRouter();

  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [
    isAddingItem,
    setIsAddingItem,
  ] = useState(false);

  const [
    editingItem,
    setEditingItem,
  ] = useState<FlashSaleItem | null>(
    null
  );

  const [
    deletingItemId,
    setDeletingItemId,
  ] = useState<string | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  /**
   * ==========================================================
   * OPEN ADD FORM
   * ==========================================================
   */

  function handleAddItem() {
    setError(null);

    setEditingItem(null);

    setIsAddingItem(true);
  }

  /**
   * ==========================================================
   * OPEN EDIT FORM
   * ==========================================================
   */

  function handleEditItem(
    item: FlashSaleItem
  ) {
    setError(null);

    setIsAddingItem(false);

    setEditingItem(item);
  }

  /**
   * ==========================================================
   * CANCEL FORM
   * ==========================================================
   */

  function handleCancel() {
    setIsAddingItem(false);

    setEditingItem(null);

    setError(null);
  }

  /**
   * ==========================================================
   * FORM SUCCESS
   * ==========================================================
   */

  function handleSuccess() {
    setIsAddingItem(false);

    setEditingItem(null);

    setError(null);

    router.refresh();
  }

  /**
   * ==========================================================
   * DELETE ITEM
   * ==========================================================
   */

  async function handleDeleteItem(
    item: FlashSaleItem
  ) {
    const confirmed =
      window.confirm(
        `Hapus "${item.product.name}" dari Flash Sale?\n\nTindakan ini tidak dapat dibatalkan.`
      );

    if (!confirmed) {
      return;
    }

    setError(null);

    setDeletingItemId(
      item.id
    );

    try {
      const response =
        await fetch(
          `/api/admin/flash-sales/${flashSaleId}/items/${item.id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Gagal menghapus item Flash Sale."
        );
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus item Flash Sale."
      );
    } finally {
      setDeletingItemId(null);
    }
  }

  /**
   * ==========================================================
   * RENDER CREATE FORM
   * ==========================================================
   */

  if (isAddingItem) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            Tambah Produk Flash Sale
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pilih produk dan atur harga serta
            kuota Flash Sale.
          </p>
        </div>

        <div className="p-6">
          <FlashSaleItemForm
            flashSaleId={flashSaleId}
            products={products}
            mode="create"
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * RENDER EDIT FORM
   * ==========================================================
   */

  if (editingItem) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            Edit Produk Flash Sale
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui harga promo, kuota, batas
            pembelian, urutan, atau status produk.
          </p>
        </div>

        <div className="p-6">
          <FlashSaleItemForm
            flashSaleId={flashSaleId}
            products={products}
            mode="edit"
            item={{
  id: editingItem.id,

  productId:
    editingItem.product.id,

  weightOptionId:
    editingItem.weightOption?.id ??
    null,

  originalPrice:
    editingItem.originalPrice,

  flashPrice:
    editingItem.flashPrice,

  stockLimit:
    editingItem.stockLimit,

  soldQuantity:
    editingItem.soldQuantity,

  perUserLimit:
    editingItem.perUserLimit,

  sortOrder:
    editingItem.sortOrder,

  isActive:
    editingItem.isActive,
}}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * RENDER ITEMS
   * ==========================================================
   */

  return (
    <div className="rounded-xl border bg-card">
      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Produk Flash Sale
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Kelola produk dan harga promo
            dalam campaign ini.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleAddItem}
        >
          <Plus className="mr-2 h-4 w-4" />

          Tambah Produk
        </Button>
      </div>

      {/* ERROR */}

      {error ? (
        <div className="mx-6 mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* EMPTY STATE */}

      {items.length === 0 ? (
        <div className="flex min-h-65 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>

          <div>
            <h3 className="font-semibold">
              Belum ada produk
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan produk ke campaign
              Flash Sale ini.
            </p>
          </div>

          <Button
            type="button"
            className="mt-2"
            onClick={handleAddItem}
          >
            <Plus className="mr-2 h-4 w-4" />

            Tambah Produk
          </Button>
        </div>
      ) : (
        <div className="divide-y">
          {items.map(
  (item) => {
    const remainingStock =
      Math.max(
        0,
        item.stockLimit -
          item.soldQuantity
      );

    const hasSales =
      item.soldQuantity > 0;

    const discountPercent =
      item.originalPrice > 0
        ? Math.max(
            0,
            Math.round(
              (
                (
                  item.originalPrice -
                  item.flashPrice
                ) /
                item.originalPrice
              ) *
                100
            )
          )
        : 0;

              const isDeleting =
                deletingItemId ===
                item.id;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* PRODUCT */}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {item.product.name}
                      </p>

                      {!item.isActive ? (
                        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                          Tidak Aktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-500/15 dark:text-green-400">
                          Aktif
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.weightOption
                        ? item.weightOption.label
                        : "Semua pilihan berat"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span>
                        Kuota:{" "}
                        {item.stockLimit}
                      </span>

                      <span>
                        Terjual:{" "}
                        {item.soldQuantity}
                      </span>

                      <span>
                        Sisa:{" "}
                        {remainingStock}
                      </span>

                      <span>
                        Maks. per user:{" "}
                        {item.perUserLimit}
                      </span>
                    </div>
                  </div>

                  {/* PRICE */}

                  <div className="flex flex-row items-end justify-between gap-6 lg:flex-col lg:items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Harga Normal
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground line-through">
                        {formatCurrency(
                          item.originalPrice
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          -{discountPercent}%
                        </span>

                        <p className="font-semibold">
                          {formatCurrency(
                            item.flashPrice
                          )}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Urutan:{" "}
                        {item.sortOrder}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() =>
                        handleEditItem(
                          item
                        )
                      }
                    >
                      <Pencil className="mr-2 h-4 w-4" />

                      Edit
                    </Button>

                    <Button
  type="button"
  variant="destructive"
  size="sm"
  disabled={
    isDeleting ||
    hasSales
  }
  title={
    hasSales
      ? "Item tidak dapat dihapus karena sudah memiliki penjualan."
      : "Hapus item Flash Sale"
  }
  onClick={() =>
    handleDeleteItem(
      item
    )
  }
>
  {isDeleting ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <Trash2 className="mr-2 h-4 w-4" />
  )}

  {isDeleting
    ? "Menghapus..."
    : "Hapus"}
</Button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}