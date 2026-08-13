import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  OrderStatus,
} from "@prisma/client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  ShoppingBag,
  User,
  XCircle,
} from "lucide-react";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * FORMAT CURRENCY
 * ============================================================
 */

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "long",
      timeStyle: "short",
    }
  ).format(date);
}

/**
 * ============================================================
 * ORDER STATUS CONFIG
 * ============================================================
 */

function getOrderStatusConfig(
  status: OrderStatus
) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pesanan Baru",
        className:
          "bg-amber-100 text-amber-700",
        icon: Clock3,
      };

    case "WAITING_PAYMENT":
      return {
        label: "Menunggu Pembayaran",
        className:
          "bg-orange-100 text-orange-700",
        icon: Clock3,
      };

    case "WAITING_VERIFICATION":
      return {
        label: "Menunggu Verifikasi",
        className:
          "bg-blue-100 text-blue-700",
        icon: Clock3,
      };

    case "PROCESSING":
      return {
        label: "Sedang Diproses",
        className:
          "bg-violet-100 text-violet-700",
        icon: Package,
      };

    case "SHIPPING":
      return {
        label: "Dalam Pengiriman",
        className:
          "bg-cyan-100 text-cyan-700",
        icon: Package,
      };

    case "COMPLETED":
      return {
        label: "Selesai",
        className:
          "bg-emerald-100 text-emerald-700",
        icon: CheckCircle2,
      };

    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className:
          "bg-red-100 text-red-700",
        icon: XCircle,
      };

    default:
      return {
        label: status,
        className:
          "bg-slate-100 text-slate-700",
        icon: Clock3,
      };
  }
}

/**
 * ============================================================
 * PAYMENT STATUS CONFIG
 * ============================================================
 */

function getPaymentStatusConfig(
  status: string
) {
  switch (status) {
    case "PENDING":
      return {
        label: "Menunggu Pembayaran",
        className:
          "bg-amber-100 text-amber-700",
      };

    case "VERIFIED":
      return {
        label: "Pembayaran Terverifikasi",
        className:
          "bg-emerald-100 text-emerald-700",
      };

    case "REJECTED":
      return {
        label: "Pembayaran Ditolak",
        className:
          "bg-red-100 text-red-700",
      };

    default:
      return {
        label: status,
        className:
          "bg-slate-100 text-slate-700",
      };
  }
}

/**
 * ============================================================
 * CUSTOMER ORDER DETAIL PAGE
 * ============================================================
 */

interface CustomerOrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerOrderDetailPage({
  params,
}: CustomerOrderDetailPageProps) {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session =
    await auth();

  if (
    !session?.user?.id
  ) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * GET PARAMS
   * ==========================================================
   */

  const {
    id,
  } = await params;

  /**
   * ==========================================================
   * GET ORDER
   * ==========================================================
   */

  let order;

  try {
    order =
      await OrderService.getOrderById(
        id
      );
  } catch {
    notFound();
  }

  /**
   * ==========================================================
   * SECURITY
   *
   * Customer hanya boleh melihat
   * order miliknya sendiri.
   * ==========================================================
   */

  if (
    order.userId !==
    session.user.id
  ) {
    notFound();
  }

  /**
   * ==========================================================
   * HIDE DELETED ORDER
   * ==========================================================
   */

  if (
    order.deletedAt
  ) {
    notFound();
  }

  /**
   * ==========================================================
   * STATUS CONFIG
   * ==========================================================
   */

  const orderStatus =
    getOrderStatusConfig(
      order.status
    );

  const paymentStatus =
    getPaymentStatusConfig(
      order.paymentStatus
    );

  const OrderStatusIcon =
    orderStatus.icon;

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ==================================================== */}
        {/* BACK BUTTON */}
        {/* ==================================================== */}

        <Link
          href="/customer/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali ke Pesanan Saya
        </Link>

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <ReceiptText className="h-5 w-5" />

                <span className="text-sm">
                  Detail Pesanan
                </span>
              </div>

              <h1 className="break-all text-2xl font-bold tracking-tight text-slate-950">
                {order.orderNumber}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />

                  {formatDate(
                    order.createdAt
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />

                  {order.items.length} Produk
                </div>

              </div>
            </div>

            <div className="flex flex-wrap gap-3">

              {/* ORDER STATUS */}

              <div
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${orderStatus.className}`}
              >
                <OrderStatusIcon className="h-4 w-4" />

                {orderStatus.label}
              </div>

              {/* PAYMENT STATUS */}

              <div
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${paymentStatus.className}`}
              >
                {paymentStatus.label}
              </div>

            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CONTENT GRID */}
        {/* ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* ================================================== */}
          {/* LEFT COLUMN */}
          {/* ================================================== */}

          <div className="space-y-6">

            {/* ================================================ */}
            {/* ORDER ITEMS */}
            {/* ================================================ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Package className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Produk Pesanan
                  </h2>

                  <p className="text-sm text-slate-500">
                    {order.items.length} produk dalam pesanan ini
                  </p>
                </div>
              </div>

              <div className="space-y-5">

                {order.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="font-medium text-slate-900">
                          {item.productName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatCurrency(
                            Number(
                              item.price
                            )
                          )}
                          {" × "}
                          {item.quantity}
                        </p>

                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-slate-950">
                          {formatCurrency(
                            Number(
                              item.subtotal
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}

              </div>
            </section>

            {/* ================================================ */}
            {/* SHIPPING ADDRESS */}
            {/* ================================================ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <MapPin className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Alamat Pengiriman
                  </h2>

                  <p className="text-sm text-slate-500">
                    Lokasi tujuan pesanan
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div>
                    <p className="font-medium text-slate-900">
                      {order.address.receiverName}
                    </p>

                    {order.address.label && (
                      <p className="mt-1 text-sm text-slate-500">
                        {order.address.label}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <p className="text-sm text-slate-600">
                    {order.address.receiverPhone}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div className="text-sm leading-6 text-slate-600">

                    <p>
                      {order.address.fullAddress}
                    </p>

                    <p>
                      {order.address.village}
                      {", "}
                      {order.address.district}
                    </p>

                    <p>
                      {order.address.city}
                      {", "}
                      {order.address.province}
                    </p>

                    <p>
                      {order.address.postalCode}
                    </p>

                  </div>
                </div>

                {/* ============================================ */}
                {/* SAVED COORDINATES */}
                {/* ============================================ */}

                {order.address.latitude !== null &&
                  order.address.longitude !== null && (
                    <div className="rounded-xl bg-slate-50 p-4">

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />

                        <p className="text-sm font-medium text-slate-700">
                          Pin Lokasi Tersimpan
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">

                        <div>
                          <p className="text-xs text-slate-500">
                            Latitude
                          </p>

                          <p className="mt-1 font-mono text-sm font-medium">
                            {order.address.latitude.toString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Longitude
                          </p>

                          <p className="mt-1 font-mono text-sm font-medium">
                            {order.address.longitude.toString()}
                          </p>
                        </div>

                      </div>
                    </div>
                  )}

                {/* ============================================ */}
                {/* NOTES */}
                {/* ============================================ */}

                {order.address.notes && (
                  <div className="rounded-xl border border-slate-200 p-4">

                    <p className="mb-2 text-sm font-medium text-slate-800">
                      Catatan Alamat
                    </p>

                    <p className="text-sm leading-6 text-slate-600">
                      {order.address.notes}
                    </p>

                  </div>
                )}

              </div>
            </section>

            {/* ================================================ */}
            {/* ORDER NOTES */}
            {/* ================================================ */}

            {order.notes && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <h2 className="mb-3 font-semibold text-slate-950">
                  Catatan Pesanan
                </h2>

                <p className="text-sm leading-6 text-slate-600">
                  {order.notes}
                </p>

              </section>
            )}

          </div>

          {/* ================================================== */}
          {/* RIGHT COLUMN */}
          {/* ================================================== */}

          <div className="space-y-6">

            {/* ================================================ */}
            {/* PAYMENT SUMMARY */}
            {/* ================================================ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <CreditCard className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Rincian Pembayaran
                  </h2>

                  <p className="text-sm text-slate-500">
                    Total tagihan pesanan
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatCurrency(
                      Number(
                        order.subtotal
                      )
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Ongkos Kirim
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatCurrency(
                      Number(
                        order.shippingCost
                      )
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">

                  <div className="flex items-center justify-between gap-4">

                    <span className="font-semibold text-slate-950">
                      Total
                    </span>

                    <span className="text-xl font-bold text-slate-950">
                      {formatCurrency(
                        Number(
                          order.total
                        )
                      )}
                    </span>

                  </div>
                </div>

              </div>
            </section>

            {/* ================================================ */}
{/* PAYMENT METHOD */}
{/* ================================================ */}

{/* ================================================ */}
{/* PAYMENT METHOD */}
{/* ================================================ */}

<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

  <div className="mb-5 flex items-center gap-3">

    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
      <CreditCard className="h-5 w-5 text-slate-700" />
    </div>

    <div>
      <h2 className="font-semibold text-slate-950">
        Metode Pembayaran
      </h2>

      <p className="text-sm text-slate-500">
        Informasi pembayaran pesanan
      </p>
    </div>

  </div>

  {order.paymentChannel ? (

    <div className="space-y-4">

      {/* PAYMENT CHANNEL NAME */}
      <div className="rounded-xl bg-slate-50 p-4">

        <p className="text-sm font-semibold text-slate-900">
          {order.paymentChannel.name}
        </p>

        {order.paymentChannel.description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {order.paymentChannel.description}
          </p>
        )}

      </div>


      {/* BANK NAME */}
      {order.paymentChannel.bankName && (
        <div className="border-b border-slate-100 pb-4">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Bank / Provider
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            {order.paymentChannel.bankName}
          </p>

        </div>
      )}


      {/* ACCOUNT NUMBER */}
      {order.paymentChannel.accountNumber && (
        <div className="border-b border-slate-100 pb-4">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Nomor Rekening
          </p>

          <p className="mt-1 break-all text-base font-semibold text-slate-950">
            {order.paymentChannel.accountNumber}
          </p>

        </div>
      )}


      {/* ACCOUNT HOLDER */}
      {order.paymentChannel.accountHolder && (
        <div className="border-b border-slate-100 pb-4">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Atas Nama
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            {order.paymentChannel.accountHolder}
          </p>

        </div>
      )}


      {/* PAYMENT INSTRUCTIONS */}
      {order.paymentChannel.instructions && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">

          <p className="mb-2 text-sm font-semibold text-slate-900">
            Instruksi Pembayaran
          </p>

          <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
            {order.paymentChannel.instructions}
          </p>

        </div>
      )}

    </div>

  ) : (

    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-sm font-medium text-slate-900">
        Metode pembayaran belum tersedia
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        Informasi metode pembayaran untuk pesanan ini tidak ditemukan.
      </p>

    </div>

  )}


  {/* UPLOAD PAYMENT PROOF */}

  {order.paymentStatus !== "VERIFIED" && (
    <Link
      href={`/customer/orders/${order.id}/payment`}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <CreditCard className="h-4 w-4" />

      Upload Bukti Pembayaran
    </Link>
  )}

</section>

            {/* ================================================ */}
            {/* SHIPPING STATUS */}
            {/* ================================================ */}

            {order.status === "SHIPPING" && (
              <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">

                <div className="flex items-start gap-3">

                  <MapPin className="mt-0.5 h-5 w-5 text-cyan-600" />

                  <div>
                    <h2 className="font-semibold text-cyan-950">
                      Pesanan Sedang Dikirim
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-cyan-800">
                      Pesanan Anda sedang dalam perjalanan menuju alamat tujuan.
                    </p>
                  </div>

                </div>

              </section>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}