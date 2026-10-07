"use client";

import { useMemo, useState } from "react";

import { Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { FlashSaleProductOption, FlashSaleSkuOption } from "./FlashSaleItemForm";

interface FlashSaleBulkItemFormProps {
  flashSaleId: string;
  products: FlashSaleProductOption[];
  existingSkuIds: string[];
  onCancel: () => void;
  onSuccess?: () => void;
}

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FIXED_PRICE";

type Draft = {
  sku: FlashSaleSkuOption;
  selected: boolean;
  flashPrice: string;
  stockLimit: string;
  perUserLimit: string;
  sortOrder: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSkuLabel(sku: FlashSaleSkuOption) {
  const options = sku.skuOptions
    .map((option) => `${option.variantOption.group.name}: ${option.variantOption.label}`)
    .join(" • ");
  return options ? `${sku.sku} • ${options}` : sku.sku;
}

function calculateFlashPrice(normalPrice: number, type: DiscountType, value: number) {
  if (!Number.isFinite(normalPrice) || !Number.isFinite(value)) return 0;
  if (type === "PERCENTAGE") return Math.round(normalPrice * (1 - value / 100));
  if (type === "FIXED_AMOUNT") return Math.round(normalPrice - value);
  return Math.round(value);
}

export function FlashSaleBulkItemForm({
  flashSaleId,
  products,
  existingSkuIds,
  onCancel,
  onSuccess,
}: FlashSaleBulkItemFormProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [bulkType, setBulkType] = useState<DiscountType>("PERCENTAGE");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkStockLimit, setBulkStockLimit] = useState("");
  const [bulkPerUserLimit, setBulkPerUserLimit] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds]
  );

  const existing = useMemo(() => new Set(existingSkuIds), [existingSkuIds]);

  function addProduct(value: string) {
    if (!value || selectedProductIds.includes(value)) return;
    const product = products.find((item) => item.id === value);
    if (!product) return;

    setSelectedProductIds((current) => [...current, value]);
    setDrafts((current) => {
      const next = { ...current };
      for (const sku of product.skus) {
        if (existing.has(sku.id) || next[sku.id]) continue;
        next[sku.id] = {
          sku,
          selected: false,
          flashPrice: "",
          stockLimit: sku.stock > 0 ? String(sku.stock) : "",
          perUserLimit: "1",
          sortOrder: "0",
        };
      }
      return next;
    });
    setError("");
  }

  function removeProduct(productId: string) {
    setSelectedProductIds((current) => current.filter((id) => id !== productId));
    const product = products.find((item) => item.id === productId);
    const skuIds = new Set(product?.skus.map((sku) => sku.id) ?? []);
    setDrafts((current) => {
      const next = { ...current };
      for (const skuId of skuIds) delete next[skuId];
      return next;
    });
  }

  function updateDraft(skuId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [skuId]: { ...current[skuId], ...patch },
    }));
  }

  function toggleAll(selected: boolean) {
    setDrafts((current) => {
      const next = { ...current };
      for (const skuId of Object.keys(next)) next[skuId] = { ...next[skuId], selected };
      return next;
    });
  }

  function applyBulk() {
    const value = Number(bulkValue);
    const quota = Number(bulkStockLimit);
    const perUser = Number(bulkPerUserLimit);

    if (!Number.isFinite(value) || value <= 0) {
      setError("Nilai diskon/harga bulk harus lebih besar dari 0.");
      return;
    }
    if (!Number.isInteger(quota) || quota < 1) {
      setError("Kuota bulk minimal adalah 1.");
      return;
    }
    if (!Number.isInteger(perUser) || perUser < 1 || perUser > quota) {
      setError("Limit per customer harus minimal 1 dan tidak boleh melebihi kuota.");
      return;
    }

    setDrafts((current) => {
      const next = { ...current };
      for (const [skuId, draft] of Object.entries(current)) {
        if (!draft.selected) continue;
        const flashPrice = calculateFlashPrice(draft.sku.price, bulkType, value);
        next[skuId] = {
          ...draft,
          flashPrice: String(flashPrice),
          stockLimit: String(Math.min(quota, draft.sku.stock)),
          perUserLimit: String(Math.min(perUser, Math.min(quota, draft.sku.stock))),
        };
      }
      return next;
    });
    setError("");
  }

  async function handleSubmit() {
    setError("");

    if (selectedProductIds.length === 0 || selectedProducts.length === 0) {
      setError("Silakan pilih minimal satu produk terlebih dahulu.");
      return;
    }

    const selected = Object.values(drafts).filter((draft) => draft.selected);
    if (selected.length === 0) {
      setError("Pilih minimal satu SKU aktif.");
      return;
    }

    for (const draft of selected) {
      const flashPrice = Number(draft.flashPrice);
      const stockLimit = Number(draft.stockLimit);
      const perUserLimit = Number(draft.perUserLimit);

      if (!draft.sku.isActive) {
        setError(`SKU ${draft.sku.sku} sedang tidak aktif.`);
        return;
      }
      if (!Number.isFinite(flashPrice) || flashPrice <= 0 || flashPrice >= draft.sku.price) {
        setError(`Harga Flash Sale untuk ${formatSkuLabel(draft.sku)} harus lebih dari 0 dan lebih rendah dari harga normal.`);
        return;
      }
      if (!Number.isInteger(stockLimit) || stockLimit < 1 || stockLimit > draft.sku.stock) {
        setError(`Kuota untuk ${formatSkuLabel(draft.sku)} harus 1 sampai ${draft.sku.stock}.`);
        return;
      }
      if (!Number.isInteger(perUserLimit) || perUserLimit < 1 || perUserLimit > stockLimit) {
        setError(`Limit per customer untuk ${formatSkuLabel(draft.sku)} tidak valid.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/flash-sales/${flashSaleId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map((draft) => ({
            productId: selectedProducts.find((product) => product.skus.some((sku) => sku.id === draft.sku.id))!.id,
            skuId: draft.sku.id,
            flashPrice: Number(draft.flashPrice),
            stockLimit: Number(draft.stockLimit),
            perUserLimit: Number(draft.perUserLimit),
            sortOrder: Number(draft.sortOrder),
            isActive: true,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menambahkan SKU Flash Sale.");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan SKU Flash Sale.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const allSelected = Object.values(drafts).length > 0 && Object.values(drafts).every((draft) => draft.selected);
  const selectedCount = Object.values(drafts).filter((draft) => draft.selected).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)]">
        <div className="rounded-xl border p-4">
          <label className="mb-2 block text-sm font-semibold">Tambah Produk</label>
          <select
            value=""
            onChange={(event) => addProduct(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Pilih produk...</option>
            {products.filter((product) => !selectedProductIds.includes(product.id)).map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            Pilih satu atau beberapa produk. Semua SKU yang tersedia akan masuk ke matrix.
          </p>
          {selectedProducts.length > 0 ? (
            <div className="mt-4 space-y-2">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <span className="truncate font-medium">{product.name}</span>
                  <button type="button" className="shrink-0 text-destructive hover:underline" onClick={() => removeProduct(product.id)} disabled={isSubmitting}>Hapus</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-semibold">Mode Harga</label>
              <select
                value={bulkType}
                onChange={(event) => setBulkType(event.target.value as DiscountType)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Diskon %</option>
                <option value="FIXED_AMOUNT">Potong Nominal</option>
                <option value="FIXED_PRICE">Harga Flash</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold">Nilai</label>
              <Input value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} inputMode="numeric" placeholder={bulkType === "PERCENTAGE" ? "15" : "25000"} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold">Kuota Promo</label>
              <Input value={bulkStockLimit} onChange={(event) => setBulkStockLimit(event.target.value)} inputMode="numeric" placeholder="20" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold">Maks. Qty Flash Sale / Customer</label>
              <Input value={bulkPerUserLimit} onChange={(event) => setBulkPerUserLimit(event.target.value)} inputMode="numeric" placeholder="2" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Bulk hanya diterapkan ke SKU yang dicentang.</p>
            <Button type="button" variant="outline" size="sm" onClick={applyBulk} disabled={isSubmitting || selectedCount === 0}>
              Terapkan ke {selectedCount} SKU
            </Button>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      {selectedProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Pilih produk untuk menampilkan SKU.</div>
      ) : Object.keys(drafts).length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Semua SKU aktif produk ini sudah ada di Flash Sale atau belum memiliki SKU yang dapat dipilih.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-3 py-3 text-center">
                  <input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} aria-label="Pilih semua SKU" />
                </th>
                <th className="px-3 py-3 text-left">Produk / SKU</th>
                <th className="px-3 py-3 text-right">Harga Normal</th>
                <th className="w-40 px-3 py-3 text-right">Harga Flash</th>
                <th className="w-32 px-3 py-3 text-right">Kuota Promo</th>
                <th className="w-36 px-3 py-3 text-right">Maks. Qty Flash Sale / Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.values(drafts).map((draft) => (
                <tr key={draft.sku.id} className={draft.selected ? "bg-primary/5" : ""}>
                  <td className="px-3 py-3 text-center">
                    <input type="checkbox" checked={draft.selected} disabled={!draft.sku.isActive || isSubmitting} onChange={(event) => updateDraft(draft.sku.id, { selected: event.target.checked })} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{selectedProducts.find((product) => product.skus.some((sku) => sku.id === draft.sku.id))?.name ?? "Produk"}</div>
                    <div className="mt-1 font-medium">{formatSkuLabel(draft.sku)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Stok: {draft.sku.stock} · Aktif</div>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{formatCurrency(draft.sku.price)}</td>
                  <td className="px-3 py-3">
                    <Input value={draft.flashPrice} disabled={!draft.selected || isSubmitting} onChange={(event) => updateDraft(draft.sku.id, { flashPrice: event.target.value })} inputMode="numeric" placeholder="Harga flash" className="text-right" />
                  </td>
                  <td className="px-3 py-3">
                    <Input value={draft.stockLimit} disabled={!draft.selected || isSubmitting} onChange={(event) => updateDraft(draft.sku.id, { stockLimit: event.target.value })} inputMode="numeric" className="text-right" />
                  </td>
                  <td className="px-3 py-3">
                    <Input value={draft.perUserLimit} disabled={!draft.selected || isSubmitting} onChange={(event) => updateDraft(draft.sku.id, { perUserLimit: event.target.value })} inputMode="numeric" className="text-right" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}><X className="mr-2 h-4 w-4" />Batal</Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || selectedCount === 0}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSubmitting ? "Menyimpan..." : `Simpan ${selectedCount} SKU`}
        </Button>
      </div>
    </div>
  );
}
