"use client";

import { AlertTriangle, PackageSearch } from "lucide-react";

interface LowStockItem {
  id: string;
  sku: string;
  productId: string;
  productName: string;
  stock: number;
}

interface LowStockAlertProps {
  data: LowStockItem[];
}

function getStockStatus(stock: number) {
  if (stock <= 3) {
    return {
      label: "Kritis",
      className:
        "bg-[color:var(--pisjo-red)]/10 text-[var(--pisjo-red)]",
    };
  }

  if (stock <= 6) {
    return {
      label: "Rendah",
      className:
        "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Perlu Restock",
    className:
      "bg-yellow-50 text-yellow-700",
  };
}

export function LowStockAlert({
  data,
}: LowStockAlertProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Stok Menipis
            </h2>

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              SKU yang perlu segera diperiksa atau di-restock.
            </p>
          </div>
        </div>

        {data.length > 0 ? (
          <span className="w-fit shrink-0 rounded-full bg-[var(--pisjo-soft-blue)] px-3 py-1 text-xs font-semibold text-[var(--pisjo-ocean)]">
            {data.length} SKU
          </span>
        ) : null}
      </div>

      {data.length > 0 ? (
        <>
          {/* Desktop */}
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Produk</th>
                  <th className="pb-3 pr-4">SKU</th>
                  <th className="pb-3 pr-4 text-center">
                    Stok
                  </th>
                  <th className="pb-3 text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {data.map((item) => {
                  const stockStatus =
                    getStockStatus(item.stock);

                  return (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <p
                          className="max-w-[280px] truncate font-medium text-foreground"
                          title={item.productName}
                        >
                          {item.productName}
                        </p>
                      </td>

                      <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </td>

                      <td className="py-4 pr-4 text-center">
                        <span className="font-bold text-foreground">
                          {item.stock}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            stockStatus.className,
                          ].join(" ")}
                        >
                          {stockStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="mt-5 space-y-3 md:hidden">
            {data.map((item) => {
              const stockStatus =
                getStockStatus(item.stock);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold text-foreground"
                        title={item.productName}
                      >
                        {item.productName}
                      </p>

                      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        stockStatus.className,
                      ].join(" ")}
                    >
                      {stockStatus.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Stok tersedia
                    </span>

                    <span className="text-xl font-bold text-[var(--pisjo-navy)]">
                      {item.stock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center">
          <div>
            <PackageSearch className="mx-auto h-8 w-8 text-[var(--pisjo-green)]" />

            <p className="mt-3 text-sm font-medium text-foreground">
              Semua stok masih aman.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Tidak ada SKU dengan stok 10 atau kurang.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default LowStockAlert;
