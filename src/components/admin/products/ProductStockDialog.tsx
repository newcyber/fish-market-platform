"use client";

import * as React from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateProductStockAction } from "@/actions/product/update-product-stock";
import {
  adjustProductPhysicalInventoryAction,
  setProductPhysicalInventoryUnitsAction,
} from "@/actions/product/adjust-product-physical-inventory";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ProductStockItem {
  skuId: string;
  sku: string;
  stock: number;
  optionLabels: string[];
  usesPhysicalPool?: boolean;
  poolId?: string | null;
  sizeLabel?: string | null;
  weightGrams?: number | null;
  stockGrams?: number | null;
}

interface ProductStockDialogProps {
  productId: string;
  productName: string;
  items: ProductStockItem[];
  trigger?: React.ReactNode;
  readOnly?: boolean;
}

export default function ProductStockDialog({
  productId,
  productName,
  items,
  trigger,
  readOnly = false,
}: ProductStockDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<
    Record<string, number>
  >({});
  const [bulkStock, setBulkStock] = React.useState("");
  const [error, setError] = React.useState<string | null>(
    null
  );
  const [success, setSuccess] = React.useState<string | null>(
    null
  );
  const [isPending, startTransition] =
    React.useTransition();

  const physicalPoolItems = React.useMemo(() => {
    const pools = new Map<
      string,
      {
        poolId: string;
        sizeLabel: string;
        stockGrams: number;
        skuCount: number;
      }
    >();

    for (const item of items) {
      if (!item.usesPhysicalPool || !item.poolId) continue;

      const existing = pools.get(item.poolId);
      if (existing) {
        existing.skuCount += 1;
        continue;
      }

      pools.set(item.poolId, {
        poolId: item.poolId,
        sizeLabel:
          item.sizeLabel ||
          item.optionLabels.find((label) =>
            label.toLowerCase().startsWith("ukuran:")
          ) ||
          "Ukuran",
        stockGrams: item.stockGrams ?? 0,
        skuCount: 1,
      });
    }

    return [...pools.values()];
  }, [items]);

  const usesPhysicalPool = physicalPoolItems.length > 0;
  const [physicalAdjustments, setPhysicalAdjustments] =
    React.useState<Record<string, string>>({});
  const [physicalNote, setPhysicalNote] = React.useState("");
  const [unitValues, setUnitValues] = React.useState<Record<string, number>>({});
  const [unitNote, setUnitNote] = React.useState("");

  const hasPhysicalChanges = React.useMemo(
    () =>
      physicalPoolItems.some(
        (pool) => Number(physicalAdjustments[pool.poolId] || 0) !== 0,
      ),
    [physicalAdjustments, physicalPoolItems],
  );

  const hasUnitChanges = React.useMemo(
    () =>
      items.some(
        (item) =>
          item.usesPhysicalPool &&
          item.weightGrams &&
          item.weightGrams > 0 &&
          unitValues[item.skuId] !== undefined &&
          unitValues[item.skuId] !==
            Math.floor((item.stockGrams ?? 0) / item.weightGrams),
      ),
    [items, unitValues],
  );

  const resetFormState = () => {
    const nextValues: Record<string, number> = {};

    for (const item of items) {
      nextValues[item.skuId] = item.stock;
    }

    const nextUnitValues: Record<string, number> = {};

    for (const item of items) {
      if (
        item.usesPhysicalPool &&
        item.weightGrams &&
        item.weightGrams > 0
      ) {
        nextUnitValues[item.skuId] = Math.floor(
          (item.stockGrams ?? 0) / item.weightGrams,
        );
      }
    }

    setValues(nextValues);
    setBulkStock("");
    setPhysicalAdjustments({});
    setPhysicalNote("");
    setUnitValues(nextUnitValues);
    setUnitNote("");
    setError(null);
    setSuccess(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;

    if (nextOpen) {
      resetFormState();
    }

    setOpen(nextOpen);
  };

  const applyBulkStock = () => {
    if (readOnly) return;

    const parsed = Number(bulkStock);

    if (
      !Number.isInteger(parsed) ||
      parsed < 0
    ) {
      setError(
        "Stock massal harus berupa angka bulat >= 0."
      );
      return;
    }

    const nextValues: Record<string, number> = {};

    for (const item of items) {
      nextValues[item.skuId] = parsed;
    }

    setValues(nextValues);
    setError(null);
  };

  const updateStockValue = (
    skuId: string,
    value: string
  ) => {
    if (value === "") {
      setValues((current) => ({
        ...current,
        [skuId]: 0,
      }));
      return;
    }

    const parsed = Number(value);

    if (
      !Number.isInteger(parsed) ||
      parsed < 0
    ) {
      return;
    }

    setValues((current) => ({
      ...current,
      [skuId]: parsed,
    }));

    setError(null);
  };

  const handlePhysicalSubmit = () => {
    setError(null);
    setSuccess(null);

    const adjustments = physicalPoolItems
      .map((pool) => ({
        poolId: pool.poolId,
        quantityGrams: Number(physicalAdjustments[pool.poolId] || 0),
      }))
      .filter((item) => item.quantityGrams !== 0);

    if (adjustments.length === 0) {
      setError("Masukkan minimal satu perubahan stok fisik.");
      return;
    }

    if (!physicalNote.trim()) {
      setError("Catatan penyesuaian wajib diisi.");
      return;
    }

    if (adjustments.some((item) => !Number.isInteger(item.quantityGrams))) {
      setError("Penyesuaian stok harus berupa angka gram bulat.");
      return;
    }

    startTransition(async () => {
      try {
        const result =
          await adjustProductPhysicalInventoryAction({
            productId,
            adjustments: adjustments.map((item) => ({
              ...item,
              note: physicalNote.trim(),
            })),
          });

        if (!result.success) {
          setError(
            result.message ??
              "Gagal menyesuaikan stok fisik."
          );
          return;
        }

        setSuccess(
          result.message ??
            "Stok fisik berhasil disesuaikan."
        );

        router.refresh();

        window.setTimeout(() => {
          setOpen(false);
        }, 500);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Gagal menyesuaikan stok fisik."
        );
      }
    });
  };

  const handleUnitSubmit = () => {
    setError(null);
    setSuccess(null);

    const edits = items
      .filter(
        (item) =>
          item.usesPhysicalPool &&
          item.weightGrams &&
          item.weightGrams > 0 &&
          unitValues[item.skuId] !== undefined &&
          unitValues[item.skuId] !== Math.floor((item.stockGrams ?? 0) / item.weightGrams),
      )
      .map((item) => ({
        skuId: item.skuId,
        desiredUnits: unitValues[item.skuId],
      }));

    if (edits.length === 0) {
      setError("Tidak ada perubahan stok unit.");
      return;
    }

    if (!unitNote.trim()) {
      setError("Catatan pengaturan stok unit wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await setProductPhysicalInventoryUnitsAction({
          productId,
          unitEdits: edits,
          note: unitNote.trim(),
        });

        if (!result.success) {
          setError(result.message ?? "Gagal memperbarui stok unit.");
          return;
        }

        setSuccess(result.message ?? "Stok unit berhasil diperbarui.");
        router.refresh();
        window.setTimeout(() => setOpen(false), 700);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Gagal memperbarui stok unit.",
        );
      }
    });
  };

  const handleSubmit = () => {
    if (readOnly) return;

    setError(null);
    setSuccess(null);

    const payload = items.map((item) => {
      const stock = values[item.skuId];

      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        throw new Error(
          `Stock SKU "${item.sku}" tidak valid.`
        );
      }

      return {
        skuId: item.skuId,
        stock,
      };
    });

    startTransition(async () => {
      try {
        const result =
          await updateProductStockAction({
            productId,
            items: payload,
          });

        if (!result.success) {
          setError(
            result.message ??
              "Gagal memperbarui stock."
          );
          return;
        }

        setSuccess(
          result.message ??
            "Stock berhasil diperbarui."
        );

        router.refresh();

        window.setTimeout(() => {
          setOpen(false);
        }, 500);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Gagal memperbarui stock."
        );
      }
    });
  };

  return (
    <>
      {trigger ? (
        <span
          onClick={() => handleOpenChange(true)}
          className="inline-flex"
        >
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
        >
          Atur Stok
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="flex w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)] max-h-[calc(100dvh-1rem)]">
          <DialogHeader className="shrink-0 border-b bg-background px-4 py-4 sm:px-6 sm:py-5">
            <DialogTitle>
              Atur Stok Produk
            </DialogTitle>
            <DialogDescription>
              {productName}
              {usesPhysicalPool ? (
                <span className="mt-1 block">
                  Stok fisik dikelola oleh Physical Inventory Pool dan dapat disesuaikan dalam gram.
                </span>
              ) : readOnly ? (
                <span className="mt-1 block">
                  Stok produk ini dikelola oleh Inventory Pool dan tidak dapat diubah dari SKU.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <PackageCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">
                  SKU belum tersedia
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Silakan konfigurasi SKU produk terlebih dahulu
                  pada halaman edit produk.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {usesPhysicalPool ? (
                  <>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">Stok Fisik</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                            Atur perubahan stok berdasarkan berat fisik. Gunakan angka positif untuk menambah dan angka negatif untuk mengurangi.
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                          gram
                        </span>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                      <div className="hidden grid-cols-[1fr_170px] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium sm:grid">
                        <span>Ukuran / Pool</span>
                        <span className="text-right">Perubahan (gram)</span>
                      </div>

                      <div className="divide-y">
                        {physicalPoolItems.map((pool) => (
                          <div
                            key={pool.poolId}
                            className="grid gap-3 px-3 py-3.5 sm:grid-cols-[1fr_170px] sm:items-center sm:gap-4 sm:px-4 sm:py-4"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                {pool.sizeLabel}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                                <span>
                                  Stok saat ini:{" "}
                                  <span className="font-semibold text-foreground">
                                    {pool.stockGrams.toLocaleString("id-ID")} g
                                  </span>
                                </span>
                                <span aria-hidden="true">•</span>
                                <span>{pool.skuCount} SKU</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:block">
                              <div className="min-w-0 flex-1 sm:w-full">
                                <label
                                  htmlFor={`physical-adjustment-${pool.poolId}`}
                                  className="mb-1 block text-xs font-medium text-muted-foreground sm:hidden"
                                >
                                  Tambah / Kurangi
                                </label>
                                <Input
                                  id={`physical-adjustment-${pool.poolId}`}
                                  type="number"
                                  step={1}
                                  inputMode="decimal"
                                  value={physicalAdjustments[pool.poolId] ?? ""}
                                  onChange={(event) =>
                                    setPhysicalAdjustments((current) => ({
                                      ...current,
                                      [pool.poolId]: event.target.value,
                                    }))
                                  }
                                  placeholder="+1.000 / -500"
                                  className="h-11 w-full text-right text-base sm:text-sm"
                                  disabled={isPending}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-sm font-semibold">Pengaturan Stok Unit</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                        Jumlah unit dihitung dari stok fisik ÷ berat SKU. Saat Anda mengubah unit, stok gram pada ukuran yang sama ikut disesuaikan.
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border">
                      {/* Desktop */}
                      <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium sm:grid">
                        <span>SKU / Variant</span>
                        <span className="text-right">Berat</span>
                        <span className="text-right">Stok Unit</span>
                      </div>

                      <div className="divide-y">
                        {items.filter((item) => item.usesPhysicalPool).map((item) => {
                          const currentUnits =
                            item.weightGrams && item.weightGrams > 0
                              ? Math.floor((item.stockGrams ?? 0) / item.weightGrams)
                              : 0;

                          return (
                            <div key={`unit-${item.skuId}`}>
                              {/* Mobile card */}
                              <div className="grid gap-3 px-3 py-3.5 sm:hidden">
                                <div className="min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.optionLabels.length > 0 ? (
                                          item.optionLabels.map((label) => (
                                            <span
                                              key={`${item.skuId}-${label}`}
                                              className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium leading-4"
                                            >
                                              {label}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-sm font-semibold">
                                            Default SKU
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1.5 break-all text-[11px] leading-4 text-muted-foreground">
                                        SKU: {item.sku}
                                      </p>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-background px-2.5 py-1.5 text-xs font-semibold ring-1 ring-border">
                                      {item.weightGrams
                                        ? `${item.weightGrams.toLocaleString("id-ID")} g`
                                        : "-"}
                                    </span>
                                  </div>
                                </div>

                                <div className="rounded-lg bg-muted/30 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-semibold">Stok Unit</p>
                                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        Saat ini: {currentUnits} unit
                                      </p>
                                    </div>
                                    <Input
                                      type="number"
                                      min={0}
                                      step={1}
                                      inputMode="numeric"
                                      value={unitValues[item.skuId] ?? currentUnits}
                                      onChange={(event) => {
                                        const raw = event.target.value;
                                        const value = raw === "" ? 0 : Number(raw);
                                        if (Number.isInteger(value) && value >= 0) {
                                          setUnitValues((current) => ({
                                            ...current,
                                            [item.skuId]: value,
                                          }));
                                        }
                                      }}
                                      aria-label={`Stok unit ${item.sku}`}
                                      className="h-11 w-24 text-right text-base font-semibold"
                                      disabled={isPending}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Desktop row */}
                              <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px] items-center gap-4 px-4 py-3 sm:grid">
                                <div className="min-w-0">
                                  <p className="font-medium">
                                    {item.optionLabels.length > 0
                                      ? item.optionLabels.join(" • ")
                                      : "Default SKU"}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    SKU: {item.sku}
                                  </p>
                                </div>
                                <p className="text-right text-sm text-muted-foreground">
                                  {item.weightGrams
                                    ? `${item.weightGrams.toLocaleString("id-ID")} g`
                                    : "-"}
                                </p>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  inputMode="numeric"
                                  value={unitValues[item.skuId] ?? currentUnits}
                                  onChange={(event) => {
                                    const raw = event.target.value;
                                    const value = raw === "" ? 0 : Number(raw);
                                    if (Number.isInteger(value) && value >= 0) {
                                      setUnitValues((current) => ({
                                        ...current,
                                        [item.skuId]: value,
                                      }));
                                    }
                                  }}
                                  className="text-right"
                                  disabled={isPending}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border bg-muted/20 p-3 sm:border-0 sm:bg-transparent sm:p-0">
                      <div>
                        <label
                          htmlFor={`unit-note-${productId}`}
                          className="mb-1.5 block text-sm font-medium"
                        >
                          Catatan Perubahan Stok Unit
                        </label>
                        <Input
                          id={`unit-note-${productId}`}
                          value={unitNote}
                          onChange={(event) => setUnitNote(event.target.value)}
                          placeholder="Contoh: Koreksi stok hasil opname"
                          disabled={isPending}
                          className="h-11"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full border-primary/30 bg-background font-semibold sm:w-auto"
                        onClick={handleUnitSubmit}
                        disabled={isPending || !hasUnitChanges}
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isPending ? "Menyimpan..." : "Terapkan Stok Unit"}
                      </Button>
                    </div>

                    <div>
                      <label
                        htmlFor={`physical-note-${productId}`}
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Catatan Perubahan Stok Fisik
                      </label>
                      <Input
                        id={`physical-note-${productId}`}
                        value={physicalNote}
                        onChange={(event) =>
                          setPhysicalNote(event.target.value)
                        }
                        placeholder="Contoh: Restock supplier 8 Oktober 2026"
                        disabled={isPending}
                        className="h-11"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label
                            htmlFor={`bulk-stock-${productId}`}
                            className="mb-1.5 block text-sm font-medium"
                          >
                            Ubah Massal
                          </label>
                          <Input
                            id={`bulk-stock-${productId}`}
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={bulkStock}
                            onChange={(event) =>
                              setBulkStock(event.target.value)
                            }
                            placeholder="Masukkan stok"
                            disabled={isPending || readOnly}
                            className="h-11"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={applyBulkStock}
                          disabled={isPending || readOnly}
                          className="h-11 w-full sm:w-auto"
                        >
                          Terapkan ke Semua
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border">
                      <div className="grid grid-cols-[1fr_150px] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
                        <span>SKU / Variant</span>
                        <span className="text-right">Stock</span>
                      </div>

                      <div className="divide-y">
                        {items.map((item) => (
                          <div
                            key={item.skuId}
                            className="grid grid-cols-[1fr_150px] items-center gap-4 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                {item.optionLabels.length > 0
                                  ? item.optionLabels.join(" • ")
                                  : "Default SKU"}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                SKU: {item.sku}
                              </p>
                            </div>

                            <Input
                              type="number"
                              min={0}
                              step={1}
                              inputMode="numeric"
                              value={values[item.skuId] ?? 0}
                              onChange={(event) =>
                                updateStockValue(
                                  item.skuId,
                                  event.target.value
                                )
                              }
                              className="text-right"
                              disabled={isPending || readOnly}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm"
                  >
                    {success}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-11 w-full rounded-lg font-medium sm:w-auto"
            >
              Batal
            </Button>

            {usesPhysicalPool ? (
              <Button
                type="button"
                onClick={handlePhysicalSubmit}
                disabled={
                  isPending ||
                  physicalPoolItems.length === 0 ||
                  !hasPhysicalChanges
                }
                className="h-11 w-full rounded-lg font-semibold shadow-sm sm:w-auto"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isPending ? "Menyimpan..." : "Simpan Perubahan Fisik"}
              </Button>
            ) : !readOnly && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  items.length === 0
                }
                className="h-11 w-full rounded-lg font-semibold shadow-sm sm:w-auto"
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
