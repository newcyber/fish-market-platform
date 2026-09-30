"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";

import { reorderOrderAction } from "@/actions/order/reorder-order";

interface ReorderItem {
  id: string;
  productName: string;
  productVariant: string | null;
  productWeight: string | null;
  quantity: number;
  image: string | null;
}

export interface HomeReorderOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  items: ReorderItem[];
}

interface HomeReorderSectionProps {
  order: HomeReorderOrder | null;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function HomeReorderSection({ order }: HomeReorderSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!order || order.items.length === 0) {
    return null;
  }

  const currentOrder = order;
  const visibleItems = currentOrder.items.slice(0, 4);
  const remainingItems = Math.max(
    0,
    currentOrder.items.length - visibleItems.length,
  );

  function handleReorder() {
    setMessage(null);

    startTransition(async () => {
      const result = await reorderOrderAction(currentOrder.id);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      if (result.skipped.length > 0) {
        setMessage(result.message);
      }

      router.push("/customer/cart");
      router.refresh();
    });
  }

  return (
    <section className="w-full py-6 sm:py-8 lg:py-9">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--ocean-50) text-(--ocean-700) sm:h-10 sm:w-10">
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-(--ocean-700)">
                    PISJO REORDER
                  </p>
                  <h2 className="mt-0.5 text-lg font-black tracking-tight text-(--ocean-950) sm:text-xl">
                    Belanja seperti pesanan terakhir
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    {currentOrder.orderNumber} ·{" "}
                    {formatDate(currentOrder.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Total pesanan terakhir
              </p>
              <p className="mt-0.5 text-base font-black text-slate-900 sm:text-lg">
                {formatRupiah(currentOrder.total)}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex min-w-[220px] flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:min-w-0"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                        P
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-xs">
                      {item.quantity}x
                      {item.productWeight ? ` · ${item.productWeight}` : ""}
                      {item.productVariant ? ` · ${item.productVariant}` : ""}
                    </p>
                  </div>
                </div>
              ))}

              {remainingItems > 0 && (
                <div className="flex min-w-[80px] shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 text-xs font-bold text-slate-500">
                  +{remainingItems} item
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Jumlah mengikuti pesanan terakhir. Harga dan stok akan dihitung
                ulang saat dimasukkan ke keranjang.
              </p>

              <button
                type="button"
                onClick={handleReorder}
                disabled={isPending}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-(--pisjo-primary) px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  "Menambahkan..."
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Beli Lagi
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {message && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
