import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Heart,
  Package,
  ShoppingBag,
  Truck,
  User,
  WalletCards,
} from "lucide-react";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

import CustomerService from "@/services/customer/customer.service";
import CartService from "@/services/cart/cart.service";
import WishlistService from "@/services/wishlist/wishlist.service";

import {
  OrderRepository,
} from "@/repositories/OrderRepository";

/**
 * ============================================================
 * CUSTOMER ACCOUNT PAGE
 * ============================================================
 *
 * Dashboard utama akun customer.
 *
 * Halaman ini BUKAN pengganti /customer/profile.
 *
 * /customer/account
 *   → dashboard akun
 *
 * /customer/profile
 *   → pengaturan informasi pribadi
 * ============================================================
 */

export default async function CustomerAccountPage() {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * CUSTOMER
   * ==========================================================
   */

  const customer =
    await CustomerService.getCustomerById(
      session.user.id
    );

  if (!customer) {
    redirect("/login");
  }

  if (!customer.isActive) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * LOAD ACCOUNT DATA
   * ==========================================================
   *
   * Semua data menggunakan userId dari session.
   */

  const [
    orderSummary,
    wishlistCount,
    cartCount,
  ] = await Promise.all([
    OrderRepository.getCustomerOrderSummary(
      session.user.id
    ),

    WishlistService.getItemCount(
      session.user.id
    ),

    CartService.getItemCount(
      session.user.id
    ),
  ]);

  /**
   * ==========================================================
   * CUSTOMER DISPLAY
   * ==========================================================
   */

  const customerName =
    customer.name?.trim() ||
    "Customer";

  const customerEmail =
    customer.email?.trim() ||
    "";

  const customerInitial =
    customerName
      .charAt(0)
      .toUpperCase();

  /**
   * ==========================================================
   * ORDER STATUS
   * ==========================================================
   */

  const waitingPayment =
    orderSummary.pending +
    orderSummary.waitingPayment;

  const processing =
    orderSummary.waitingVerification +
    orderSummary.processing;

  const shipping =
    orderSummary.shipping;

  const completed =
    orderSummary.completed;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* ACCOUNT HEADER */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-slate-900 px-6 py-7 text-white sm:px-8">

            <div className="flex items-center gap-4">

              {/* AVATAR */}

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20">
                {customerInitial}
              </div>

              {/* CUSTOMER */}

              <div className="min-w-0">

                <p className="text-sm font-medium text-slate-300">
                  Selamat datang kembali
                </p>

                <h1 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                  {customerName}
                </h1>

                <p className="mt-1 truncate text-sm text-slate-300">
                  {customerEmail}
                </p>

              </div>

            </div>

          </div>

          {/* ACCOUNT QUICK INFO */}

          <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">

            <Link
              href="/customer/profile"
              className="group flex items-center gap-3 px-5 py-5 transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
                <User className="h-5 w-5 text-cyan-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  Akun
                </p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  Profil Saya
                </p>
              </div>
            </Link>

            <Link
              href="/customer/wishlist"
              className="group flex items-center gap-3 px-5 py-5 transition hover:bg-slate-50"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <Heart className="h-5 w-5 text-rose-500" />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount > 99
                      ? "99+"
                      : wishlistCount}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  Koleksi
                </p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  Wishlist
                </p>
              </div>
            </Link>

            <Link
              href="/customer/cart"
              className="group flex items-center gap-3 px-5 py-5 transition hover:bg-slate-50"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <ShoppingBag className="h-5 w-5 text-amber-600" />

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99
                      ? "99+"
                      : cartCount}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  Belanja
                </p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  Keranjang
                </p>
              </div>
            </Link>

          </div>

        </section>

        {/* ================================================== */}
        {/* ORDER SUMMARY */}
        {/* ================================================== */}

        <section className="mt-6">

          <div className="mb-4 flex items-end justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pesanan Saya
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pantau status pesanan Anda.
              </p>
            </div>

            <Link
              href="/customer/orders"
              className="hidden items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 sm:flex"
            >
              Lihat semua
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {/* WAITING PAYMENT */}

            <Link
              href="/customer/orders?status=PAYMENT"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <WalletCards className="h-5 w-5 text-amber-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

              </div>

              <p className="mt-4 text-2xl font-bold text-slate-900">
                {waitingPayment}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-600">
                Belum Bayar
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pesanan yang membutuhkan pembayaran
              </p>
            </Link>

            {/* PROCESSING */}

            <Link
              href="/customer/orders?status=PROCESSING"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                  <Package className="h-5 w-5 text-cyan-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

              </div>

              <p className="mt-4 text-2xl font-bold text-slate-900">
                {processing}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-600">
                Diproses
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pesanan sedang dipersiapkan
              </p>
            </Link>

            {/* SHIPPING */}

            <Link
              href="/customer/orders?status=SHIPPING"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                  <Truck className="h-5 w-5 text-indigo-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

              </div>

              <p className="mt-4 text-2xl font-bold text-slate-900">
                {shipping}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-600">
                Dikirim
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pesanan sedang dikirim
              </p>
            </Link>

            {/* COMPLETED */}

            <Link
              href="/customer/orders?status=COMPLETED"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

              </div>

              <p className="mt-4 text-2xl font-bold text-slate-900">
                {completed}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-600">
                Selesai
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pesanan yang telah selesai
              </p>
            </Link>

          </div>

          <Link
            href="/customer/orders"
            className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:hidden"
          >
            Lihat semua pesanan
            <ArrowRight className="h-4 w-4" />
          </Link>

        </section>

        {/* ================================================== */}
        {/* ACCOUNT MENU + REWARD */}
        {/* ================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* ACCOUNT MENU */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Pengaturan Akun
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Kelola akun dan preferensi Anda.
              </p>
            </div>

            <div className="divide-y divide-slate-100">

              <Link
                href="/customer/profile"
                className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
                    <User className="h-5 w-5 text-cyan-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Profil Saya
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Nama, email, dan nomor telepon
                    </p>
                  </div>

                </div>

                <ChevronRight className="h-5 w-5 text-slate-300" />
              </Link>

              <Link
                href="/customer/wishlist"
                className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                    <Heart className="h-5 w-5 text-rose-500" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Wishlist
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Produk yang Anda simpan
                    </p>
                  </div>

                </div>

                <ChevronRight className="h-5 w-5 text-slate-300" />
              </Link>

              <Link
                href="/customer/orders"
                className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <ShoppingBag className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Riwayat Pesanan
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Lihat seluruh transaksi Anda
                    </p>
                  </div>

                </div>

                <ChevronRight className="h-5 w-5 text-slate-300" />
              </Link>

            </div>

          </section>

          {/* REWARD PLACEHOLDER */}

          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-50" />

            <div className="relative">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                <ShoppingBag className="h-5 w-5 text-cyan-600" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
                Reward
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                Program Reward Segera Hadir
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nantikan program poin dan berbagai keuntungan
                menarik dari setiap transaksi Anda.
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Status
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Belum tersedia
                </p>
              </div>

            </div>

          </section>

        </div>

      </div>
    </main>
  );
}