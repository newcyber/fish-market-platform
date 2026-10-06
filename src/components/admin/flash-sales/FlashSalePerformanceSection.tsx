import { BarChart3, CircleDollarSign, Percent, ShoppingCart } from "lucide-react";

interface FlashSalePerformanceItem {
  id: string;
  productName: string;
  sku: string | null;
  skuLabel: string;
  quota: number;
  soldQuantity: number;
  remainingQuantity: number;
  sellThroughRate: number;
  revenue: number;
  discount: number;
}

interface FlashSalePerformanceSectionProps {
  totalItems: number;
  totalQuota: number;
  totalSoldQuantity: number;
  totalRemainingQuantity: number;
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  sellThroughRate: number;
  items: FlashSalePerformanceItem[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPercent(value: number) {
  return `${value.toLocaleString("id-ID", {
    maximumFractionDigits: 1,
  })}%`;
}

export function FlashSalePerformanceSection({
  totalItems,
  totalQuota,
  totalSoldQuantity,
  totalRemainingQuantity,
  totalOrders,
  totalRevenue,
  totalDiscount,
  sellThroughRate,
  items,
}: FlashSalePerformanceSectionProps) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Performa Flash Sale</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan penjualan berdasarkan snapshot transaksi, bukan konfigurasi promo saat ini.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Transaksi</span>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{formatNumber(totalOrders)}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Unit Terjual</span>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {formatNumber(totalSoldQuantity)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              / {formatNumber(totalQuota)}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sisa {formatNumber(totalRemainingQuantity)} unit
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Omzet Promo</span>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Diskon {formatCurrency(totalDiscount)}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Sell-through</span>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{formatPercent(sellThroughRate)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalItems} SKU dalam campaign
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Produk / SKU</th>
              <th className="px-4 py-3 text-right font-medium">Quota</th>
              <th className="px-4 py-3 text-right font-medium">Terjual</th>
              <th className="px-4 py-3 text-right font-medium">Sisa</th>
              <th className="px-4 py-3 text-right font-medium">Sell-through</th>
              <th className="px-4 py-3 text-right font-medium">Omzet</th>
              <th className="px-4 py-3 text-right font-medium">Diskon</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.productName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.skuLabel || item.sku || "SKU tidak tersedia"}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(item.quota)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatNumber(item.soldQuantity)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(item.remainingQuantity)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(item.sellThroughRate)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.revenue)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.discount)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada SKU dalam campaign ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
