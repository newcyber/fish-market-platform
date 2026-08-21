"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  Package,
  Save,
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface FlashSaleProductWeightOption {
  id: string;

  label: string;

  price: number;
}

export interface FlashSaleProductOption {
  id: string;

  name: string;

  price: number;

  stock: number;

  weightOptions:
    FlashSaleProductWeightOption[];
}

/**
 * ============================================================
 * EDIT ITEM
 * ============================================================
 */

export interface FlashSaleItemFormInitialItem {
  id: string;

  productId: string;

  weightOptionId: string | null;

  originalPrice: number;

  flashPrice: number;

  stockLimit: number;

  soldQuantity: number;

  perUserLimit: number;

  sortOrder: number;

  isActive: boolean;
}

interface FlashSaleItemFormProps {
  flashSaleId: string;

  products:
    FlashSaleProductOption[];

  mode?: "create" | "edit";

  item?: FlashSaleItemFormInitialItem;

  onCancel: () => void;

  onSuccess?: () => void;
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
 * FLASH SALE ITEM FORM
 * ============================================================
 */

export function FlashSaleItemForm({
  flashSaleId,

  products,

  mode = "create",

  item,

  onCancel,

  onSuccess,
}: FlashSaleItemFormProps) {
  /**
   * ==========================================================
   * MODE
   * ==========================================================
   */

  const isEditMode =
    mode === "edit";

  /**
   * ==========================================================
   * FORM STATE
   * ==========================================================
   */

  const [
    productId,
    setProductId,
  ] = useState(
    item?.productId ?? ""
  );

  const [
    weightOptionId,
    setWeightOptionId,
  ] = useState(
    item?.weightOptionId ?? ""
  );

  const [
    flashPrice,
    setFlashPrice,
  ] = useState(
    item
      ? String(item.flashPrice)
      : ""
  );

  const [
    stockLimit,
    setStockLimit,
  ] = useState(
    item
      ? String(item.stockLimit)
      : ""
  );

  const [
    perUserLimit,
    setPerUserLimit,
  ] = useState(
    item
      ? String(item.perUserLimit)
      : "1"
  );

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    item
      ? String(item.sortOrder)
      : "0"
  );

  const [
    isActive,
    setIsActive,
  ] = useState(
    item?.isActive ?? true
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  /**
   * ==========================================================
   * SELECTED PRODUCT
   * ==========================================================
   */

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id === productId
        ) ?? null,
      [
        productId,
        products,
      ]
    );

  /**
   * ==========================================================
   * SELECTED WEIGHT OPTION
   * ==========================================================
   */

  const selectedWeightOption =
    useMemo(() => {
      if (
        !selectedProduct ||
        !weightOptionId
      ) {
        return null;
      }

      return (
        selectedProduct.weightOptions.find(
          (option) =>
            option.id ===
            weightOptionId
        ) ?? null
      );
    }, [
      selectedProduct,
      weightOptionId,
    ]);

  /**
   * ==========================================================
   * ORIGINAL PRICE
   * ==========================================================
   *
   * CREATE:
   * Harga dihitung dari produk / weight option.
   *
   * EDIT:
   * Gunakan originalPrice yang tersimpan
   * agar histori harga item tidak berubah.
   */

  const originalPrice =
    isEditMode && item
      ? item.originalPrice
      : selectedWeightOption
        ? selectedWeightOption.price
        : selectedProduct
          ? selectedProduct.price
          : 0;

  /**
   * ==========================================================
   * SOLD QUANTITY
   * ==========================================================
   */

  const soldQuantity =
    isEditMode
      ? item?.soldQuantity ?? 0
      : 0;

  /**
   * ==========================================================
   * PRODUCT CHANGE
   * ==========================================================
   */

  function handleProductChange(
    value: string
  ) {
    if (isEditMode) {
      return;
    }

    setProductId(value);

    setWeightOptionId("");

    setFlashPrice("");

    setError(null);
  }

  /**
   * ==========================================================
   * WEIGHT OPTION CHANGE
   * ==========================================================
   */

  function handleWeightOptionChange(
    value: string
  ) {
    if (isEditMode) {
      return;
    }

    setWeightOptionId(value);

    setFlashPrice("");

    setError(null);
  }

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    /**
     * ========================================================
     * VALIDATE PRODUCT
     * ========================================================
     */

    if (!productId) {
      setError(
        "Silakan pilih produk."
      );

      return;
    }

    /**
     * ========================================================
     * VALIDATE FLASH PRICE
     * ========================================================
     */

    const parsedFlashPrice =
      Number(flashPrice);

    if (
      !Number.isFinite(
        parsedFlashPrice
      ) ||
      parsedFlashPrice < 0
    ) {
      setError(
        "Harga Flash Sale tidak valid."
      );

      return;
    }

    if (
      originalPrice > 0 &&
      parsedFlashPrice >=
        originalPrice
    ) {
      setError(
        "Harga Flash Sale harus lebih rendah dari harga normal."
      );

      return;
    }

    /**
     * ========================================================
     * VALIDATE STOCK LIMIT
     * ========================================================
     */

    const parsedStockLimit =
      Number(stockLimit);

    if (
      !Number.isInteger(
        parsedStockLimit
      ) ||
      parsedStockLimit < 1
    ) {
      setError(
        "Stock limit minimal adalah 1."
      );

      return;
    }

    /**
     * ========================================================
     * PREVENT STOCK BELOW SOLD QUANTITY
     * ========================================================
     */

    if (
      isEditMode &&
      parsedStockLimit <
        soldQuantity
    ) {
      setError(
        `Kuota Flash Sale tidak boleh lebih kecil dari jumlah yang sudah terjual (${soldQuantity}).`
      );

      return;
    }

    /**
     * ========================================================
     * VALIDATE PER USER LIMIT
     * ========================================================
     */

    const parsedPerUserLimit =
      Number(perUserLimit);

    if (
      !Number.isInteger(
        parsedPerUserLimit
      ) ||
      parsedPerUserLimit < 1
    ) {
      setError(
        "Batas pembelian per user minimal adalah 1."
      );

      return;
    }

    /**
     * ========================================================
     * PREVENT PER USER ABOVE STOCK
     * ========================================================
     */

    if (
      parsedPerUserLimit >
      parsedStockLimit
    ) {
      setError(
        "Batas pembelian per user tidak boleh lebih besar dari kuota Flash Sale."
      );

      return;
    }

    /**
     * ========================================================
     * VALIDATE SORT ORDER
     * ========================================================
     */

    const parsedSortOrder =
      Number(sortOrder);

    if (
      !Number.isInteger(
        parsedSortOrder
      ) ||
      parsedSortOrder < 0
    ) {
      setError(
        "Sort order tidak valid."
      );

      return;
    }

    /**
     * ========================================================
     * EDIT MODE VALIDATION
     * ========================================================
     */

    if (
      isEditMode &&
      !item?.id
    ) {
      setError(
        "Data item Flash Sale tidak ditemukan."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /**
       * ======================================================
       * CREATE
       * ======================================================
       */

      if (!isEditMode) {
        const response =
          await fetch(
            `/api/admin/flash-sales/${flashSaleId}/items`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId,

                weightOptionId:
                  weightOptionId ||
                  null,

                originalPrice:
                  Number(
                    originalPrice
                  ),

                flashPrice:
                  parsedFlashPrice,

                stockLimit:
                  parsedStockLimit,

                perUserLimit:
                  parsedPerUserLimit,

                sortOrder:
                  parsedSortOrder,

                isActive,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              "Gagal menambahkan produk ke Flash Sale."
          );
        }
      }

      /**
       * ======================================================
       * EDIT
       * ======================================================
       */

      else {
        if (!item?.id) {
          throw new Error(
            "Data item Flash Sale tidak ditemukan."
          );
        }

        const response =
          await fetch(
            `/api/admin/flash-sales/${flashSaleId}/items/${item.id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                flashPrice:
                  parsedFlashPrice,

                stockLimit:
                  parsedStockLimit,

                perUserLimit:
                  parsedPerUserLimit,

                sortOrder:
                  parsedSortOrder,

                isActive,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              "Gagal memperbarui item Flash Sale."
          );
        }
      }

      onSuccess?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "Terjadi kesalahan saat memperbarui produk."
            : "Terjadi kesalahan saat menambahkan produk."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ERROR */}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* PRODUCT */}

      <div className="grid gap-2">
        <label
          htmlFor="productId"
          className="text-sm font-medium"
        >
          Produk
        </label>

        <select
          id="productId"
          value={productId}
          onChange={(event) =>
            handleProductChange(
              event.target.value
            )
          }
          disabled={
            isSubmitting ||
            isEditMode
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            Pilih produk
          </option>

          {products.map(
            (product) => (
              <option
                key={product.id}
                value={product.id}
              >
                {product.name}
              </option>
            )
          )}
        </select>

        {isEditMode ? (
          <p className="text-xs text-muted-foreground">
            Produk tidak dapat diubah setelah
            item Flash Sale dibuat.
          </p>
        ) : null}
      </div>

      {/* WEIGHT OPTION */}

      {selectedProduct &&
      selectedProduct.weightOptions.length >
        0 ? (
        <div className="grid gap-2">
          <label
            htmlFor="weightOptionId"
            className="text-sm font-medium"
          >
            Pilihan Berat
          </label>

          <select
            id="weightOptionId"
            value={weightOptionId}
            onChange={(event) =>
              handleWeightOptionChange(
                event.target.value
              )
            }
            disabled={
              isSubmitting ||
              isEditMode
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              Semua pilihan berat
            </option>

            {selectedProduct.weightOptions.map(
              (option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.label} —{" "}
                  {formatCurrency(
                    option.price
                  )}
                </option>
              )
            )}
          </select>

          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? "Pilihan berat tidak dapat diubah setelah item Flash Sale dibuat."
              : "Jika tidak memilih pilihan berat, Flash Sale berlaku untuk produk secara umum."}
          </p>
        </div>
      ) : null}

      {/* ORIGINAL PRICE */}

      {selectedProduct ? (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Harga Normal
              </p>

              <p className="mt-1 font-semibold">
                {formatCurrency(
                  originalPrice
                )}
              </p>
            </div>

            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      ) : null}

      {/* FLASH PRICE */}

      <div className="grid gap-2">
        <label
          htmlFor="flashPrice"
          className="text-sm font-medium"
        >
          Harga Flash Sale
        </label>

        <Input
          id="flashPrice"
          type="number"
          min="0"
          value={flashPrice}
          onChange={(event) =>
            setFlashPrice(
              event.target.value
            )
          }
          placeholder="Contoh: 25000"
          disabled={
            isSubmitting ||
            !selectedProduct
          }
        />

        {originalPrice > 0 &&
        flashPrice ? (
          <p className="text-xs text-muted-foreground">
            Diskon:{" "}
            {Math.max(
              0,
              Math.round(
                (
                  (originalPrice -
                    Number(
                      flashPrice
                    )) /
                  originalPrice
                ) *
                  100
              )
            )}
            %
          </p>
        ) : null}
      </div>

      {/* STOCK LIMIT */}

      <div className="grid gap-2">
        <label
          htmlFor="stockLimit"
          className="text-sm font-medium"
        >
          Kuota Flash Sale
        </label>

        <Input
          id="stockLimit"
          type="number"
          min={
            isEditMode
              ? Math.max(
                  1,
                  soldQuantity
                )
              : 1
          }
          value={stockLimit}
          onChange={(event) =>
            setStockLimit(
              event.target.value
            )
          }
          placeholder="Contoh: 100"
          disabled={isSubmitting}
        />

        <p className="text-xs text-muted-foreground">
          {isEditMode &&
          soldQuantity > 0
            ? `Minimal kuota adalah ${soldQuantity}, karena jumlah tersebut sudah terjual.`
            : "Jumlah maksimal unit yang dapat terjual dalam Flash Sale ini."}
        </p>
      </div>

      {/* PER USER LIMIT */}

      <div className="grid gap-2">
        <label
          htmlFor="perUserLimit"
          className="text-sm font-medium"
        >
          Batas Pembelian per User
        </label>

        <Input
          id="perUserLimit"
          type="number"
          min="1"
          max={
            stockLimit
              ? Math.max(
                  1,
                  Number(stockLimit)
                )
              : undefined
          }
          value={perUserLimit}
          onChange={(event) =>
            setPerUserLimit(
              event.target.value
            )
          }
          disabled={isSubmitting}
        />

        <p className="text-xs text-muted-foreground">
          Maksimal jumlah unit yang dapat
          dibeli oleh satu customer dan tidak
          boleh melebihi kuota Flash Sale.
        </p>
      </div>

      {/* SORT ORDER */}

      <div className="grid gap-2">
        <label
          htmlFor="sortOrder"
          className="text-sm font-medium"
        >
          Urutan Tampilan
        </label>

        <Input
          id="sortOrder"
          type="number"
          min="0"
          value={sortOrder}
          onChange={(event) =>
            setSortOrder(
              event.target.value
            )
          }
          disabled={isSubmitting}
        />
      </div>

      {/* ACTIVE */}

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4">
        <div>
          <p className="font-medium">
            Aktifkan Produk
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Produk dapat digunakan dalam
            campaign Flash Sale.
          </p>
        </div>

        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) =>
            setIsActive(
              event.target.checked
            )
          }
          disabled={isSubmitting}
          className="h-4 w-4"
        />
      </label>

      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          <X className="mr-2 h-4 w-4" />

          Batal
        </Button>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !selectedProduct
          }
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}

          {isEditMode
            ? "Simpan Perubahan"
            : "Simpan Produk"}
        </Button>
      </div>
    </form>
  );
}