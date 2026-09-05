import {
  BarChart3,
  Boxes,
  ClipboardList,
  PackagePlus,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import { DashboardKpiCard } from "@/components/admin/dashboard/cards/DashboardKpiCard";
import { DashboardTodayCards } from "@/components/admin/dashboard/cards/DashboardTodayCards";
import { QuickActionCard } from "@/components/admin/dashboard/cards/QuickActionCard";
import { CategorySalesChart } from "@/components/admin/dashboard/charts/CategorySalesChart";
import { OrderStatusDonut } from "@/components/admin/dashboard/charts/OrderStatusDonut";
import { SalesChart } from "@/components/admin/dashboard/charts/SalesChart";
import { DashboardHeader } from "@/components/admin/dashboard/sections/DashboardHeader";
import { LowStockAlert } from "@/components/admin/dashboard/sections/LowStockAlert";
import { RecentActivity } from "@/components/admin/dashboard/sections/RecentActivity";
import { RecentCustomers } from "@/components/admin/dashboard/sections/RecentCustomers";
import { RecentOrders } from "@/components/admin/dashboard/sections/RecentOrders";

import { DashboardService } from "@/services/dashboard/dashboard.service";

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000)
      .toFixed(2)
      .replace(".", ",")} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000)
      .toFixed(2)
      .replace(".", ",")} jt`;
  }

  if (value >= 1_000) {
    return `Rp ${(value / 1_000)
      .toFixed(0)
      .replace(".", ",")} rb`;
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatFullCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getDashboard();

  const { stats } = dashboard;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <DashboardHeader />

      {/* =========================================================
       * OVERVIEW
       * ========================================================= */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <DashboardKpiCard
          title="Total Pesanan"
          value={stats.totalOrders.toLocaleString("id-ID")}
          description="Seluruh pesanan"
          icon={ShoppingCart}
        />

        <DashboardKpiCard
          title="Total Penjualan"
          value={formatCompactCurrency(stats.totalSales)}
          description="Pembayaran terverifikasi"
          icon={Wallet}
        />

        <DashboardKpiCard
          title="Total Poin Customer"
          value={stats.totalRewardPoints.toLocaleString("id-ID")}
          description="Saldo poin seluruh customer"
          icon={Wallet}
        />

        <DashboardKpiCard
          title="Total Customer"
          value={stats.totalCustomers.toLocaleString("id-ID")}
          description="Customer terdaftar"
          icon={Users}
        />

        <DashboardKpiCard
          title="Total Produk"
          value={stats.totalProducts.toLocaleString("id-ID")}
          description="Produk aktif dalam katalog"
          icon={Boxes}
        />
      </section>

      {/* =========================================================
       * TODAY SUMMARY
       * ========================================================= */}
      <DashboardTodayCards
        orders={dashboard.today.orders}
        sales={dashboard.today.sales}
        pendingPayments={stats.pendingPayments}
      />

      {/* =========================================================
       * QUICK ACTIONS
       * ========================================================= */}
      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          title="Tambah Produk"
          description="Tambah produk baru"
          href="/admin/products/create"
          icon={PackagePlus}
        />

        <QuickActionCard
          title="Kelola Order"
          description="Lihat seluruh pesanan"
          href="/admin/orders"
          icon={ClipboardList}
        />

        <QuickActionCard
          title="Kelola Customer"
          description="Daftar pelanggan"
          href="/admin/customers"
          icon={Users}
        />

        <QuickActionCard
          title="Laporan"
          description="Lihat statistik penjualan"
          href="/admin/reports"
          icon={BarChart3}
        />
      </section>

      {/* =========================================================
       * SALES & ORDER STATUS
       * ========================================================= */}
      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)]">
        <SalesChart data={dashboard.salesLast7Days} />

        <OrderStatusDonut data={dashboard.orderStatusSummary} />
      </section>

      {/* =========================================================
       * SALES BY CATEGORY
       * ========================================================= */}
      <section className="min-w-0">
        <CategorySalesChart data={dashboard.salesByCategory} />
      </section>

      {/* =========================================================
       * RECENT ORDERS & LOW STOCK
       * ========================================================= */}
      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <RecentOrders data={dashboard.recentOrders} />

        <LowStockAlert data={dashboard.lowStockSkus} />
      </section>

      {/* =========================================================
       * RECENT ACTIVITY & CUSTOMERS
       * ========================================================= */}
      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
        <RecentActivity data={dashboard.recentActivities} />

        <RecentCustomers data={dashboard.recentCustomers} />
      </section>
    </div>
  );
}
