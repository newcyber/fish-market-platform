import Link from "next/link";

import {
  ArrowRight,
  Award,
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

import RewardPointPopup from "@/components/customer/reward-point/RewardPointPopup";

import { getUnseenReward } from "@/services/reward-point/reward-point.service";

import { getAvailableRewardVouchers } from "@/services/reward-voucher/reward-voucher.service";

import RewardVoucherSection from "@/components/customer/reward-voucher/RewardVoucherSection";
import CustomerRewardSummary from "@/components/customer/reward/CustomerRewardSummary";
import CustomerMemberTier from "@/components/customer/member/CustomerMemberTier";

import { getCustomerRewardSummary } from "@/services/customer/customer-reward-summary.service";

import { getCustomerMemberTierSummary } from "@/services/customer/member-tier.service";

import { OrderRepository } from "@/repositories/OrderRepository";

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

  const customer = await CustomerService.getCustomerById(session.user.id);

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
    unseenReward,
    availableRewardVouchers,
    customerRewardSummary,
    customerMemberTierSummary,
  ] = await Promise.all([
    OrderRepository.getCustomerOrderSummary(session.user.id),

    WishlistService.getItemCount(session.user.id),

    CartService.getItemCount({
      type: "customer",
      userId: session.user.id,
    }),

    getUnseenReward(session.user.id),

    getAvailableRewardVouchers(),

    getCustomerRewardSummary(session.user.id),

    getCustomerMemberTierSummary(session.user.id),
  ]);

  const rewardVoucherItems = availableRewardVouchers.map((rewardVoucher) => ({
    id: rewardVoucher.id,

    name: rewardVoucher.name,

    requiredPoints: rewardVoucher.requiredPoints,

    discountType: rewardVoucher.discountType,

    discountValue: rewardVoucher.discountValue.toNumber(),

    minimumPurchase: rewardVoucher.minimumPurchase?.toNumber() ?? null,

    maximumDiscount: rewardVoucher.maximumDiscount?.toNumber() ?? null,

    sortOrder: rewardVoucher.sortOrder,
  }));

  /**
   * ==========================================================
   * CUSTOMER DISPLAY
   * ==========================================================
   */

  const customerName = customer.name?.trim() || "Customer";

  const customerEmail = customer.email?.trim() || "";

  const customerInitial = customerName.charAt(0).toUpperCase();

  /**
   * ==========================================================
   * REWARD POINT BALANCE
   * ==========================================================
   */

  const rewardPoints = customer.rewardPointsBalance ?? 0;

  /**
   * ==========================================================
   * ORDER STATUS
   * ==========================================================
   */

  const waitingPayment = orderSummary.pending + orderSummary.waitingPayment;

  const processing = orderSummary.waitingVerification + orderSummary.processing;

  const shipping = orderSummary.shipping;

  const completed = orderSummary.completed;

  return (
    <main className="min-h-screen bg-slate-50 pb-20 sm:pb-0">
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* ================================================== */}
        {/* ACCOUNT HEADER */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
          <div className="bg-slate-900 px-4 py-4 text-white sm:px-8 sm:py-7">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* AVATAR */}

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-bold ring-1 ring-white/20 sm:h-16 sm:w-16 sm:rounded-2xl sm:text-xl">
                {customerInitial}
              </div>

              {/* CUSTOMER */}

              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-300 sm:text-sm">
                  Selamat datang kembali
                </p>

                <h1 className="mt-0.5 truncate text-xl font-bold sm:mt-1 sm:text-3xl">
                  {customerName}
                </h1>

                <p className="mt-0.5 truncate text-xs text-slate-300 sm:mt-1 sm:text-sm">
                  {customerEmail}
                </p>
              </div>
            </div>
          </div>

          {/* ACCOUNT QUICK INFO */}

          <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
            <Link
              href="/customer/profile"
              className="group flex min-w-0 items-center gap-2.5 px-3 py-3 transition hover:bg-slate-50 sm:gap-3 sm:px-5 sm:py-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 sm:h-10 sm:w-10 sm:rounded-xl">
                <User className="h-5 w-5 text-cyan-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Akun</p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  Profil Saya
                </p>
              </div>
            </Link>

            <Link
              href="/customer/wishlist"
              className="group flex min-w-0 items-center gap-2.5 px-3 py-3 transition hover:bg-slate-50 sm:gap-3 sm:px-5 sm:py-5"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 sm:h-10 sm:w-10 sm:rounded-xl">
                <Heart className="h-5 w-5 text-rose-500" />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Koleksi</p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  Wishlist
                </p>
              </div>
            </Link>

            <Link
              href="/customer/cart"
              className="group flex min-w-0 items-center gap-2.5 px-3 py-3 transition hover:bg-slate-50 sm:gap-3 sm:px-5 sm:py-5"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 sm:h-10 sm:w-10 sm:rounded-xl">
                <ShoppingBag className="h-5 w-5 text-amber-600" />

                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Belanja</p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  Keranjang
                </p>
              </div>
            </Link>

            <Link
              href="/customer/rewards"
              className="group flex min-w-0 items-center gap-2.5 px-3 py-3 transition hover:bg-slate-50 sm:gap-3 sm:px-5 sm:py-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 sm:h-10 sm:w-10 sm:rounded-xl">
                <Award className="h-5 w-5 text-cyan-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">Point Anda</p>

                <p className="truncate text-sm font-semibold text-slate-900">
                  {rewardPoints.toLocaleString("id-ID")} Poin
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* ORDER SUMMARY */}
        {/* ================================================== */}

        <section className="mt-4 sm:mt-6">
          <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4 sm:gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Pesanan Saya</h2>

              <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
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

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {/* WAITING PAYMENT */}

            <Link
              href="/customer/orders?status=PAYMENT"
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 sm:h-11 sm:w-11 sm:rounded-xl">
                  <WalletCards className="h-5 w-5 text-amber-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-4 sm:text-2xl">
                {waitingPayment}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-600 sm:mt-1 sm:text-sm">
                Belum Bayar
              </p>

              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400 sm:mt-1 sm:text-xs">
                Pesanan yang membutuhkan pembayaran
              </p>
            </Link>

            {/* PROCESSING */}

            <Link
              href="/customer/orders?status=PROCESSING"
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 sm:h-11 sm:w-11 sm:rounded-xl">
                  <Package className="h-5 w-5 text-cyan-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-4 sm:text-2xl">
                {processing}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-600 sm:mt-1 sm:text-sm">
                Diproses
              </p>

              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400 sm:mt-1 sm:text-xs">
                Pesanan sedang dipersiapkan
              </p>
            </Link>

            {/* SHIPPING */}

            <Link
              href="/customer/orders?status=SHIPPING"
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 sm:h-11 sm:w-11 sm:rounded-xl">
                  <Truck className="h-5 w-5 text-indigo-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-4 sm:text-2xl">
                {shipping}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-600 sm:mt-1 sm:text-sm">Dikirim</p>

              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400 sm:mt-1 sm:text-xs">
                Pesanan sedang dikirim
              </p>
            </Link>

            {/* COMPLETED */}

            <Link
              href="/customer/orders?status=COMPLETED"
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 sm:h-11 sm:w-11 sm:rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900 sm:mt-4 sm:text-2xl">
                {completed}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-600 sm:mt-1 sm:text-sm">Selesai</p>

              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400 sm:mt-1 sm:text-xs">
                Pesanan yang telah selesai
              </p>
            </Link>
          </div>

          <Link
            href="/customer/orders"
            className="mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:hidden"
          >
            Lihat semua pesanan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* ================================================== */}
        {/* ACCOUNT MENU + REWARD */}
        {/* ================================================== */}

        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ACCOUNT MENU */}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-2.5">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Pengaturan Akun
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
                Kelola akun dan preferensi Anda.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              <Link
                href="/customer/profile"
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 sm:gap-4 sm:py-4"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 sm:h-10 sm:w-10 sm:rounded-xl">
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
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 sm:gap-4 sm:py-4"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
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
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 sm:gap-4 sm:py-4"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 sm:h-10 sm:w-10 sm:rounded-xl">
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

          {/* ================================================== */}
          {/* REWARD POINT */}
          {/* ================================================== */}

          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {/* DECORATIVE CIRCLE */}

            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-50" />

            <div className="relative">
              {/* ICON */}

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 sm:h-11 sm:w-11 sm:rounded-xl">
                <WalletCards className="h-5 w-5 text-cyan-600" />
              </div>

              {/* LABEL */}

              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600 sm:mt-5 sm:text-xs">
                Reward Point
              </p>

              {/* BALANCE */}

              <div className="mt-1.5 flex items-end gap-2 sm:mt-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {rewardPoints.toLocaleString("id-ID")}
                </h2>

                <span className="mb-1 text-sm font-semibold text-slate-500">
                  Poin
                </span>
              </div>

              {/* DESCRIPTION */}

              <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
                Kumpulkan poin dari setiap pembelian yang telah selesai.
              </p>

              {/* BALANCE STATUS */}

              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 sm:mt-5 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Saldo Reward Anda
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {rewardPoints.toLocaleString("id-ID")} Poin
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100">
                    <WalletCards className="h-4 w-4 text-cyan-600" />
                  </div>
                </div>
              </div>

              {/* INFO */}

              <div className="mt-3 flex items-start gap-2 sm:mt-4">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />

                <p className="text-xs leading-5 text-slate-500">
                  Setiap 1 kg pembelian mendapatkan 10 poin reward.
                </p>
              </div>
            </div>
          </section>

          <div className="space-y-4 sm:space-y-6">
            <CustomerRewardSummary summary={customerRewardSummary} />

            <CustomerMemberTier summary={customerMemberTierSummary} />

            <RewardVoucherSection
            rewardPoints={rewardPoints}
            rewards={rewardVoucherItems}
            />
          </div>
        </div>
      </div>

      {unseenReward && (
        <RewardPointPopup
          reward={{
            id: unseenReward.id,
            points: unseenReward.points,
            weightGrams: unseenReward.weightGrams,
            description: unseenReward.description,
          }}
        />
      )}
    </main>
  );
}
