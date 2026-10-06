"use client";

import { useEffect, useMemo, useState } from "react";
import { PromotionDiscountType } from "@prisma/client";

export type PromotionSkuPricingDraft = {
  skuId: string;
  productId: string;
  promoPrice: string;
  discountType: PromotionDiscountType;
  discountValue: string;
  selected: boolean;
};

type SelectorSku = {
  id: string;
  sku: string;
  price: string;
  stock: number;
  isActive: boolean;
  options: Array<{
    id: string;
    label: string;
    groupName: string;
    groupSortOrder: number;
    optionSortOrder: number;
  }>;
};

type SelectorProduct = {
  id: string;
  name: string;
  slug: string;
  category: { id: string; name: string };
  skuCount: number;
  skus: SelectorSku[];
};

type InitialItem = {
  skuId: string;
  productId: string;
  normalPriceSnapshot: string | number;
  promoPrice: string | number;
  discountType: PromotionDiscountType | null;
  discountValue: string | number | null;
};

interface PromotionSkuPricingEditorProps {
  name?: string;
  initialItems?: InitialItem[];
}

function money(value: string | number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function optionLabel(sku: SelectorSku) {
  if (sku.options.length === 0) return sku.sku;
  return sku.options.map((option) => option.label).join(" • ");
}

function calculatePromoPrice(
  normalPrice: number,
  discountType: PromotionDiscountType,
  discountValue: number
) {
  if (!Number.isFinite(normalPrice) || !Number.isFinite(discountValue)) return normalPrice;

  if (discountType === PromotionDiscountType.PERCENTAGE) {
    return Math.max(0, Math.round(normalPrice * (1 - discountValue / 100)));
  }

  if (discountType === PromotionDiscountType.FIXED_AMOUNT) {
    return Math.max(0, Math.round(normalPrice - discountValue));
  }

  return Math.max(0, Math.round(discountValue));
}

export default function PromotionSkuPricingEditor({
  name = "skuPricingJson",
  initialItems = [],
}: PromotionSkuPricingEditorProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<SelectorProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    [...new Set(initialItems.map((item) => item.productId))]
  );
  const [drafts, setDrafts] = useState<Record<string, PromotionSkuPricingDraft>>(() => {
    const result: Record<string, PromotionSkuPricingDraft> = {};
    for (const item of initialItems) {
      result[item.skuId] = {
        skuId: item.skuId,
        productId: item.productId,
        promoPrice: String(item.promoPrice),
        discountType: item.discountType ?? PromotionDiscountType.PERCENTAGE,
        discountValue: item.discountValue == null ? "" : String(item.discountValue),
        selected: true,
      };
    }
    return result;
  });
  const [bulkType, setBulkType] = useState<PromotionDiscountType>(PromotionDiscountType.PERCENTAGE);
  const [bulkValue, setBulkValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/admin/promotions/products?search=${encodeURIComponent(search)}&limit=20${initialItems.length ? `&ids=${encodeURIComponent([...new Set(initialItems.map((item) => item.productId))].join(","))}` : ""}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message ?? "Gagal mengambil produk.");
        setProducts(json.data ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Gagal mengambil produk.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds]
  );

  const selectedRows = useMemo(
    () => Object.values(drafts).filter((draft) => draft.selected),
    [drafts]
  );

  function addProduct(product: SelectorProduct) {
    if (!selectedProductIds.includes(product.id)) {
      setSelectedProductIds((current) => [...current, product.id]);
    }

    setDrafts((current) => {
      const next = { ...current };
      for (const sku of product.skus) {
        if (!next[sku.id]) {
          next[sku.id] = {
            skuId: sku.id,
            productId: product.id,
            promoPrice: "",
            discountType: PromotionDiscountType.PERCENTAGE,
            discountValue: "",
            selected: false,
          };
        }
      }
      return next;
    });
  }

  function removeProduct(productId: string) {
    setSelectedProductIds((current) => current.filter((id) => id !== productId));
    setDrafts((current) => {
      const next = { ...current };
      for (const [skuId, draft] of Object.entries(next)) {
        if (draft.productId === productId) delete next[skuId];
      }
      return next;
    });
  }

  function setSelected(skuId: string, selected: boolean) {
    setDrafts((current) => ({
      ...current,
      [skuId]: { ...current[skuId], selected },
    }));
  }

  function applyBulk() {
    const value = Number(bulkValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Nilai bulk discount harus lebih besar dari 0.");
      return;
    }

    setDrafts((current) => {
      const next = { ...current };
      for (const draft of Object.values(current)) {
        if (!draft.selected) continue;
        const product = selectedProducts.find((item) => item.id === draft.productId);
        const sku = product?.skus.find((item) => item.id === draft.skuId);
        if (!sku) continue;

        const promoPrice = calculatePromoPrice(Number(sku.price), bulkType, value);
        next[draft.skuId] = {
          ...draft,
          discountType: bulkType,
          discountValue: String(value),
          promoPrice: String(promoPrice),
        };
      }
      return next;
    });
    setError("");
  }

  function updateDraft(
    skuId: string,
    patch: Partial<PromotionSkuPricingDraft>
  ) {
    setDrafts((current) => ({
      ...current,
      [skuId]: { ...current[skuId], ...patch },
    }));
  }

  const serialized = JSON.stringify(
    selectedRows.map(({ selected: _selected, ...item }) => item)
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900">Produk & SKU Promotion</h2>
        <p className="mt-1 text-sm text-slate-500">
          Pilih produk sekali. Seluruh SKU produk akan tampil otomatis, termasuk SKU nonaktif untuk kebutuhan audit.
        </p>
      </div>

      <input type="hidden" name={name} value={serialized} readOnly />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Cari Produk</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nama produk..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {loading && <p className="px-2 py-3 text-xs text-slate-500">Memuat produk...</p>}
            {!loading && products.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-500">Produk tidak ditemukan.</p>
            )}
            {products.map((product) => {
              const selected = selectedProductIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => (selected ? removeProduct(product.id) : addProduct(product))}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${selected ? "border-cyan-300 bg-cyan-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{product.category.name} · {product.skuCount} SKU</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-cyan-700">{selected ? "Dipilih" : "Pilih"}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Bulk Discount</label>
                <select
                  value={bulkType}
                  onChange={(event) => setBulkType(event.target.value as PromotionDiscountType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                >
                  <option value={PromotionDiscountType.PERCENTAGE}>Persentase (%)</option>
                  <option value={PromotionDiscountType.FIXED_AMOUNT}>Potong Nominal (Rp)</option>
                  <option value={PromotionDiscountType.FIXED_PRICE}>Harga Tetap (Rp)</option>
                </select>
              </div>
              <div className="w-full md:w-36">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nilai</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={bulkValue}
                  onChange={(event) => setBulkValue(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={applyBulk}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Terapkan
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Hanya SKU yang dicentang yang akan terkena bulk action.</p>
          </div>

          {selectedProducts.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">Belum ada produk dipilih</p>
              <p className="mt-1 text-xs text-slate-500">Pilih produk di panel kiri untuk menampilkan seluruh SKU.</p>
            </div>
          )}

          {selectedProducts.map((product) => {
            const activeSkus = product.skus.filter((sku) => sku.isActive);
            const allActiveSelected = activeSkus.length > 0 && activeSkus.every((sku) => drafts[sku.id]?.selected);
            return (
              <div key={product.id} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{product.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{product.skus.length} SKU · {activeSkus.length} aktif</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => activeSkus.forEach((sku) => setSelected(sku.id, !allActiveSelected))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {allActiveSelected ? "Batalkan Semua" : "Pilih Semua SKU Aktif"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Hapus Produk
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="w-10 px-4 py-3 text-left"> </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">SKU / Varian</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Normal</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Promo</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Diskon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {product.skus.map((sku) => {
                        const draft = drafts[sku.id];
                        const selected = Boolean(draft?.selected);
                        return (
                          <tr key={sku.id} className={sku.isActive ? "" : "bg-slate-50 opacity-70"}>
                            <td className="px-4 py-3 align-top">
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={!sku.isActive}
                                onChange={(event) => setSelected(sku.id, event.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600"
                              />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="font-semibold text-slate-900">{optionLabel(sku)}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">{sku.sku} · Stok {sku.stock}</p>
                              {!sku.isActive && <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">Nonaktif</span>}
                            </td>
                            <td className="px-4 py-3 text-right align-top font-semibold text-slate-700">{money(sku.price)}</td>
                            <td className="px-4 py-3 align-top">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                disabled={!sku.isActive || !selected}
                                value={draft?.promoPrice ?? ""}
                                onChange={(event) => updateDraft(sku.id, { promoPrice: event.target.value })}
                                placeholder="Rp"
                                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm disabled:bg-slate-100"
                              />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex gap-2">
                                <select
                                  disabled={!sku.isActive || !selected}
                                  value={draft?.discountType ?? PromotionDiscountType.PERCENTAGE}
                                  onChange={(event) => updateDraft(sku.id, { discountType: event.target.value as PromotionDiscountType })}
                                  className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs disabled:bg-slate-100"
                                >
                                  <option value={PromotionDiscountType.PERCENTAGE}>%</option>
                                  <option value={PromotionDiscountType.FIXED_AMOUNT}>Potong</option>
                                  <option value={PromotionDiscountType.FIXED_PRICE}>Harga</option>
                                </select>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  disabled={!sku.isActive || !selected}
                                  value={draft?.discountValue ?? ""}
                                  onChange={(event) => updateDraft(sku.id, { discountValue: event.target.value })}
                                  className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-right text-xs disabled:bg-slate-100"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
