import {
  BarChart3,
  Boxes,
  ClipboardList,
  PackagePlus,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";

import { DashboardService } from "@/services/dashboard/dashboard.service";

import { DashboardHeader } from "@/components/admin/dashboard/sections/DashboardHeader";

import { StatCard } from "@/components/admin/dashboard/cards/StatCard";
import { QuickActionCard } from "@/components/admin/dashboard/cards/QuickActionCard";

import { RecentOrders } from "@/components/admin/dashboard/sections/RecentOrders";
import { RecentCustomers } from "@/components/admin/dashboard/sections/RecentCustomers";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const dashboard = await DashboardService.getDashboard();

  const { stats } = dashboard;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />

      {/* Statistics */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Produk"
          value={stats.totalProducts}
          description="Produk aktif"
          icon={Boxes}
        />

        <StatCard
          title="Total Customer"
          value={stats.totalCustomers}
          description="Customer terdaftar"
          icon={Users}
        />

        <StatCard
          title="Total Order"
          value={stats.totalOrders}
          description="Seluruh transaksi"
          icon={ShoppingCart}
        />

        <StatCard
          title="Menunggu Verifikasi"
          value={stats.pendingPayments}
          description="Transfer belum diverifikasi"
          icon={Wallet}
        />
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      {/* Tables */}
      <section className="grid gap-6 xl:grid-cols-2">
        <RecentOrders
          orders={dashboard.recentOrders}
        />

        <RecentCustomers
          customers={dashboard.recentCustomers}
        />
      </section>
    </div>
  );
}