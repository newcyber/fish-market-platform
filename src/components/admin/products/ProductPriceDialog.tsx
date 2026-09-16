"use client";

import * as React from "react";
import { Loader2, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateProductPriceAction } from "@/actions/product/update-product-price";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ProductPriceItem {
  skuId: string;
  sku: string;
  price: number;
  optionLabels: string[];
}

interface ProductPriceDialogProps {
  productId: string;
  productName: string;
  items: ProductPriceItem[];
  trigger?: React.ReactNode;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export default function ProductPriceDialog({
  productId,
  productName,
  items,
  trigger,
}: ProductPriceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, number>>({});
  const [bulkPrice, setBulkPrice] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;

    const nextValues: Record<string, number> = {};
    for (const item of items) {
      nextValues[item.skuId] = item.price;
    }

    setValues(nextValues);
    setBulkPrice("");
    setError(null);
    setSuccess(null);
  }, [open, items]);

  const applyBulkPrice = () => {
    const parsed = Number(bulkPrice);

    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      setError("Harga massal harus berupa angka bulat >= 0.");
      return;
    }

    const nextValues: Record<string, number> = {};
    for (const item of items) {
      nextValues[item.skuId] = parsed;
    }

    setValues(nextValues);
    setError(null);
  };

  const updatePriceValue = (skuId: string, value: string) => {
    if (value === "") {
      setValues((current) => ({ ...current, [skuId]: 0 }));
      return;
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) return;

    setValues((current) => ({ ...current, [skuId]: parsed }));
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);

    const payload = items.map((item) => {
      const price = values[item.skuId];

      if (!Number.isSafeInteger(price) || price < 0) {
        throw new Error(`Harga SKU "${item.sku}" tidak valid.`);
      }

      return { skuId: item.skuId, price };
    });

    startTransition(async () => {
      try {
        const result = await updateProductPriceAction({
          productId,
          items: payload,
        });

        if (!result.success) {
          setError(result.message ?? "Gagal memperbarui harga.");
          return;
        }

        setSuccess(result.message ?? "Harga berhasil diperbarui.");
        router.refresh();

        window.setTimeout(() => setOpen(false), 500);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Gagal memperbarui harga."
        );
      }
    });
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          <Tag className="h-4 w-4" />
          Atur Harga
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isPending) return;
          setOpen(nextOpen);
        }}
      >
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Atur Harga Produk</DialogTitle>
            <DialogDescription>{productName}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">SKU belum tersedia</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Silakan konfigurasi SKU produk terlebih dahulu pada halaman
                  edit produk.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label
                        htmlFor={`bulk-price-${productId}`}
                        className="mb-1.5 block text-sm font-medium"
                      >
                        Ubah Massal
                      </label>
                      <Input
                        id={`bulk-price-${productId}`}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={bulkPrice}
                        onChange={(event) => setBulkPrice(event.target.value)}
                        placeholder="Masukkan harga"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyBulkPrice}
                      disabled={isPending}
                    >
                      Terapkan ke Semua
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border">
                  <div className="grid grid-cols-[1fr_180px] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
                    <span>SKU / Variant</span>
                    <span className="text-right">Harga</span>
                  </div>

                  <div className="divide-y">
                    {items.map((item) => (
                      <div
                        key={item.skuId}
                        className="grid grid-cols-[1fr_180px] items-center gap-4 px-4 py-3"
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
                          <p className="mt-1 text-xs text-muted-foreground">
                            Saat ini: {formatRupiah(item.price)}
                          </p>
                        </div>

                        <Input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={values[item.skuId] ?? 0}
                          onChange={(event) =>
                            updatePriceValue(item.skuId, event.target.value)
                          }
                          className="text-right"
                          disabled={isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>

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

          <DialogFooter className="px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || items.length === 0}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Menyimpan..." : "Update Harga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
