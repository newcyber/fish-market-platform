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
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  ShoppingBag,
  Truck,
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

function formatCurrency(value: number) {
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

function formatDate(date: Date) {
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
 * FORMAT SHORT DATE
 * ============================================================
 */

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

/**
 * ============================================================
 * ORDER STATUS LABEL
 * ============================================================
 */

function getOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Pesanan Baru";

    case "WAITING_PAYMENT":
      return "Menunggu Pembayaran";

    case "WAITING_VERIFICATION":
      return "Menunggu Verifikasi";

    case "PROCESSING":
      return "Sedang Diproses";

    case "SHIPPING":
      return "Dalam Pengiriman";

    case "COMPLETED":
      return "Selesai";

    case "CANCELLED":
      return "Dibatalkan";

    default:
      return status;
  }
}

/**
 * ============================================================
 * TRACKING STEP
 * ============================================================
 *
 * Urutan tracking:
 *
 * 1. Pesanan dibuat
 * 2. Diproses
 * 3. Dikirim
 * 4. Selesai
 *
 * Tidak membuat timestamp palsu.
 * Timestamp hanya ditampilkan jika data memang tersedia.
 *
 * ============================================================
 */

const trackingSteps = [
  {
    key: "created",
    label: "Pesanan dibuat",
  },
  {
    key: "processing",
    label: "Diproses",
  },
  {
    key: "shipping",
    label: "Dikirim",
  },
  {
    key: "completed",
    label: "Selesai",
  },
] as const;

/**
 * ============================================================
 * GET COMPLETED TRACKING STEPS
 * ============================================================
 */

function getCompletedStepIndex(status: OrderStatus) {
  switch (status) {
    case "PENDING":
    case "WAITING_PAYMENT":
    case "WAITING_VERIFICATION":
      return 0;

    case "PROCESSING":
      return 1;

    case "SHIPPING":
      return 2;

    case "COMPLETED":
      return 3;

    case "CANCELLED":
      return -1;

    default:
      return 0;
  }
}

/**
 * ============================================================
 * CUSTOMER ORDER TRACKING PAGE
 * ============================================================
 */

interface CustomerOrderTrackingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerOrderTrackingPage({
  params,
}: CustomerOrderTrackingPageProps) {
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
   * PARAMS
   * ==========================================================
   */

  const { id } = await params;

  /**
   * ==========================================================
   * GET ORDER
   * ==========================================================
   *
   * Customer hanya boleh melihat order miliknya sendiri.
   *
   * ==========================================================
   */

  let order;

  try {
    order =
      await OrderService.getOrderByIdForUser(
        id,
        session.user.id
      );
  } catch {
    notFound();
  }

  /**
   * ==========================================================
   * ORDER STATUS
   * ==========================================================
   */

  const orderStatusLabel =
    getOrderStatusLabel(order.status);

  const completedStepIndex =
    getCompletedStepIndex(order.status);

  const isCancelled =
    order.status === "CANCELLED";

  const isShipping =
    order.status === "SHIPPING";

  const isCompleted =
    order.status === "COMPLETED";

  const isPaymentVerified =
    order.paymentStatus === "VERIFIED";

  const isWaitingVerification =
    order.status === "WAITING_VERIFICATION";

  /**
   * ==========================================================
   * SHIPPING PROVIDER
   * ==========================================================
   */

  const shippingProvider =
    order.shippingProvider === "INTERNAL"
      ? "Kurir Pisjo"
      : order.shippingProvider;

  const shippingService =
    order.shippingService ??
    "Pengiriman Internal Pisjo Market";

  /**
   * ==========================================================
   * PAYMENT
   * ==========================================================
   */

  const paymentChannel =
    order.paymentChannel;

  const paymentName =
    paymentChannel?.name ??
    (
      paymentChannel?.type === "QRIS"
        ? "QRIS"
        : "Transfer Bank"
    );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main
      className="
        min-h-screen
        bg-[#eef9ff]
        pb-24
        text-slate-900
      "
    >
      {/* ====================================================== */}
      {/* MOBILE / DESKTOP HEADER                                */}
      {/* ====================================================== */}

      <header
        className="
          sticky
          top-0
          z-40
          overflow-hidden
          border-b
          border-sky-300/30
          bg-linear-to-br
          from-[#0077c8]
          via-[#078fd0]
          to-[#0065b3]
          text-white
          shadow-lg
        "
      >
        {/* Decorative background */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-20
          "
        >
          <div
            className="
              absolute
              -right-16
              -top-20
              h-64
              w-64
              rounded-full
              border
              border-white/40
            "
          />

          <div
            className="
              absolute
              -right-4
              -top-8
              h-40
              w-40
              rounded-full
              border
              border-white/30
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-0
              h-24
              w-64
              rounded-full
              bg-white/10
              blur-2xl
            "
          />
        </div>

        <div
          className="
            relative
            mx-auto
            flex
            min-h-[82px]
            w-full
            max-w-6xl
            items-center
            gap-3
            px-4
            py-3
            sm:min-h-[92px]
            sm:px-6
            lg:px-8
          "
        >
          <Link
            href={`/customer/orders/${order.id}`}
            aria-label="Kembali ke detail pesanan"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/10
              transition
              hover:bg-white/20
            "
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-cyan-100
                sm:text-xs
              "
            >
              Pisjo Market
            </p>

            <h1
              className="
                mt-0.5
                truncate
                text-lg
                font-bold
                tracking-tight
                sm:text-xl
              "
            >
              Lacak Pesanan
            </h1>

            <p
              className="
                mt-0.5
                truncate
                text-xs
                text-white/75
                sm:text-sm
              "
            >
              #{order.orderNumber}
            </p>
          </div>

          <div
            className="
              hidden
              shrink-0
              text-right
              sm:block
            "
          >
            <p className="text-xs text-cyan-100">
              Status Pesanan
            </p>

            <p className="mt-0.5 text-sm font-bold">
              {orderStatusLabel}
            </p>
          </div>
        </div>
      </header>

      {/* ====================================================== */}
      {/* MAIN CONTENT                                            */}
      {/* ====================================================== */}

      <div
        className="
          mx-auto
          w-full
          max-w-6xl
          px-3
          py-4
          sm:px-6
          sm:py-6
          lg:px-8
          lg:py-8
        "
      >
        {/* ==================================================== */}
        {/* STATUS SUMMARY                                        */}
        {/* ==================================================== */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-sky-100
            bg-white
            shadow-[0_4px_18px_rgba(23,50,77,0.06)]
          "
        >
          <div
            className={`
              relative
              overflow-hidden
              px-4
              py-5
              sm:px-6
              sm:py-6
              ${
                isCancelled
                  ? "bg-gradient-to-br from-red-50 via-white to-white"
                  : isCompleted
                    ? "bg-gradient-to-br from-emerald-50 via-white to-white"
                    : isShipping
                      ? "bg-gradient-to-br from-cyan-50 via-white to-white"
                      : "bg-gradient-to-br from-sky-50 via-white to-white"
              }
            `}
          >
            {/* Decorative background */}
            <div
              className="
                pointer-events-none
                absolute
                -right-16
                -top-16
                h-40
                w-40
                rounded-full
                bg-sky-100/40
                blur-2xl
              "
            />

            <div
              className="
                relative
                flex
                items-start
                gap-4
              "
            >
              <div
                className={`
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  ${
                    isCancelled
                      ? "bg-red-100 text-red-600"
                      : isCompleted
                        ? "bg-emerald-100 text-emerald-600"
                        : isShipping
                          ? "bg-cyan-100 text-cyan-600"
                          : "bg-sky-100 text-sky-600"
                  }
                `}
              >
                {isCancelled ? (
                  <XCircle className="h-6 w-6" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : isShipping ? (
                  <Truck className="h-6 w-6" />
                ) : (
                  <Package className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    ${
                      isCancelled
                        ? "text-red-600"
                        : isCompleted
                          ? "text-emerald-600"
                          : "text-cyan-600"
                    }
                  `}
                >
                  Status Pesanan
                </p>

                <h2
                  className="
                    mt-1
                    text-lg
                    font-bold
                    tracking-tight
                    text-slate-950
                    sm:text-xl
                  "
                >
                  {orderStatusLabel}
                </h2>

                <p
                  className="
                    mt-1.5
                    max-w-2xl
                    text-xs
                    leading-5
                    text-slate-600
                    sm:text-sm
                  "
                >
                  {isCancelled
                    ? "Pesanan ini telah dibatalkan."
                    : isCompleted
                      ? "Pesanan telah selesai diproses."
                      : isShipping
                        ? "Pesanan sedang dalam perjalanan menuju alamat tujuan Anda."
                        : order.status === "PROCESSING"
                          ? "Pesanan Anda sedang dipersiapkan oleh Pisjo Market."
                          : order.status === "WAITING_VERIFICATION"
                            ? "Pembayaran sedang diperiksa oleh admin."
                            : order.status === "WAITING_PAYMENT"
                              ? "Silakan selesaikan pembayaran untuk melanjutkan pesanan."
                              : "Pesanan Anda telah diterima dan menunggu diproses oleh Pisjo Market."}
                </p>
              </div>
            </div>
          </div>

          {/* Compact order information */}
          <div
            className="
              grid
              border-t
              border-slate-100
              sm:grid-cols-3
            "
          >
            {/* PAYMENT */}
            <div
              className="
                flex
                items-center
                gap-3
                border-b
                border-slate-100
                px-4
                py-3.5
                sm:border-b-0
                sm:border-r
                sm:px-5
              "
            >
              <div
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  ${
                    isPaymentVerified
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }
                `}
              >
                {isPaymentVerified ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Clock3 className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">
                  Pembayaran
                </p>

                <p
                  className={`
                    mt-0.5
                    truncate
                    text-sm
                    font-bold
                    ${
                      isPaymentVerified
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }
                  `}
                >
                  {isPaymentVerified
                    ? "Lunas"
                    : "Belum Lunas"}
                </p>

                <p className="truncate text-[10px] text-slate-400">
                  {paymentName}
                </p>
              </div>
            </div>

            {/* SHIPPING */}
            <div
              className="
                flex
                items-center
                gap-3
                border-b
                border-slate-100
                px-4
                py-3.5
                sm:border-b-0
                sm:border-r
                sm:px-5
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-sky-50
                  text-cyan-600
                "
              >
                <Truck className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">
                  Pengiriman
                </p>

                <p className="mt-0.5 truncate text-sm font-bold text-[var(--ocean-950)]">
                  {shippingProvider}
                </p>

                <p className="truncate text-[10px] text-slate-400">
                  {shippingService}
                </p>
              </div>
            </div>

            {/* ORDER DATE */}
            <div
              className="
                flex
                items-center
                gap-3
                px-4
                py-3.5
                sm:px-5
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-100
                  text-slate-600
                "
              >
                <ReceiptText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">
                  Pesanan
                </p>

                <p className="mt-0.5 truncate text-sm font-bold text-[var(--ocean-950)]">
                  {formatShortDate(order.createdAt)}
                </p>

                <p className="truncate text-[10px] text-slate-400">
                  {order.items.length} produk
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* TRACKING TIMELINE                                     */}
        {/* ==================================================== */}

        <section
          className="
            mt-4
            overflow-hidden
            rounded-2xl
            border
            border-sky-100
            bg-white
            shadow-[0_4px_18px_rgba(23,50,77,0.06)]
            sm:mt-6
          "
        >
          <div
            className="
              border-b
              border-slate-100
              px-4
              py-4
              sm:px-6
              sm:py-5
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-sky-50
                  text-cyan-600
                "
              >
                <Truck className="h-5 w-5" />
              </div>

              <div>
                <h2
                  className="
                    text-base
                    font-bold
                    text-[var(--ocean-950)]
                    sm:text-lg
                  "
                >
                  Perjalanan Pesanan
                </h2>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-500
                    sm:text-sm
                  "
                >
                  Pantau status pesanan Anda
                </p>
              </div>
            </div>
          </div>

          {isCancelled ? (
            <div
              className="
                m-4
                rounded-2xl
                border
                border-red-100
                bg-red-50
                p-4
                sm:m-6
                sm:p-5
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-red-100
                    text-red-600
                  "
                >
                  <XCircle className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3
                    className="
                      text-sm
                      font-bold
                      text-red-900
                    "
                  >
                    Pesanan Dibatalkan
                  </h3>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-red-700
                      sm:text-sm
                    "
                  >
                    Pesanan ini tidak lagi dalam
                    proses pengiriman.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 sm:px-6 sm:py-8">
              {/* MOBILE TIMELINE */}

              <div className="space-y-0 sm:hidden">
                {trackingSteps.map(
                  (step, index) => {
                    const isCompletedStep =
                      index <=
                      completedStepIndex;

                    const isCurrentStep =
                      index ===
                      completedStepIndex;

                    const isLastStep =
                      index ===
                      trackingSteps.length - 1;

                    return (
                      <div
                        key={step.key}
                        className="flex gap-3"
                      >
                        <div
                          className="
                            flex
                            w-8
                            shrink-0
                            flex-col
                            items-center
                          "
                        >
                          <div
                            className={`
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              border-2
                              ${
                                isCompletedStep
                                  ? "border-cyan-600 bg-cyan-600 text-white"
                                  : "border-slate-200 bg-white text-slate-300"
                              }
                            `}
                          >
                            {isCompletedStep ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span
                                className="
                                  h-2
                                  w-2
                                  rounded-full
                                  bg-current
                                "
                              />
                            )}
                          </div>

                          {!isLastStep && (
                            <div
                              className={`
                                min-h-12
                                w-0.5
                                ${
                                  index <
                                  completedStepIndex
                                    ? "bg-cyan-600"
                                    : "bg-slate-200"
                                }
                              `}
                            />
                          )}
                        </div>

                        <div
                          className={`
                            min-w-0
                            flex-1
                            pb-6
                            ${
                              isCurrentStep
                                ? ""
                                : ""
                            }
                          `}
                        >
                          <p
                            className={`
                              text-sm
                              font-bold
                              ${
                                isCompletedStep
                                  ? "text-[var(--ocean-950)]"
                                  : "text-slate-400"
                              }
                            `}
                          >
                            {step.label}
                          </p>

                          {index === 0 && (
                            <p
                              className="
                                mt-1
                                text-xs
                                text-slate-500
                              "
                            >
                              {formatDate(
                                order.createdAt
                              )}
                            </p>
                          )}

                          {index === 2 &&
                            order.shippedAt && (
                              <p
                                className="
                                  mt-1
                                  text-xs
                                  text-slate-500
                                "
                              >
                                {formatDate(
                                  new Date(
                                    order.shippedAt
                                  )
                                )}
                              </p>
                            )}

                          {isCurrentStep &&
                            !isCompleted && (
                              <span
                                className="
                                  mt-2
                                  inline-flex
                                  rounded-full
                                  bg-cyan-50
                                  px-2.5
                                  py-1
                                  text-[10px]
                                  font-bold
                                  text-cyan-700
                                "
                              >
                                Status saat ini
                              </span>
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* DESKTOP TIMELINE */}

              <div
                className="
                  hidden
                  sm:block
                "
              >
                <div
                  className="
                    relative
                    grid
                    grid-cols-4
                  "
                >
                  {/* CONNECTING LINE */}

                  <div
                    className="
                      absolute
                      left-[12.5%]
                      right-[12.5%]
                      top-5
                      h-1
                      rounded-full
                      bg-slate-200
                    "
                  />

<div
  className="
    absolute
    left-[12.5%]
    top-5
    h-1
    rounded-full
    bg-cyan-600
    transition-all
    duration-500
  "
  style={{
    width:
      completedStepIndex <= 0
        ? "0%"
        : `calc(${Math.min(
            completedStepIndex /
              (trackingSteps.length - 1),
            1
          ) * 100}% - ${
            completedStepIndex ===
            trackingSteps.length - 1
              ? "0%"
              : "0%"
          })`,
  }}
/>

                  {trackingSteps.map(
                    (step, index) => {
                      const isCompletedStep =
                        index <=
                        completedStepIndex;

                      const isCurrentStep =
                        index ===
                        completedStepIndex;

                      return (
                        <div
                          key={step.key}
                          className="
                            relative
                            z-10
                            flex
                            flex-col
                            items-center
                            text-center
                          "
                        >
                          <div
                            className={`
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-full
                              border-2
                              ${
                                isCompletedStep
                                  ? "border-cyan-600 bg-cyan-600 text-white shadow-[0_0_0_5px_rgba(8,145,178,0.10)]"
                                  : "border-slate-200 bg-white text-slate-300"
                              }
                            `}
                          >
                            {isCompletedStep ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <span
                                className="
                                  h-2.5
                                  w-2.5
                                  rounded-full
                                  bg-current
                                "
                              />
                            )}
                          </div>

                          <p
                            className={`
                              mt-3
                              text-sm
                              font-bold
                              ${
                                isCompletedStep
                                  ? "text-[var(--ocean-950)]"
                                  : "text-slate-400"
                              }
                            `}
                          >
                            {step.label}
                          </p>

                          {index === 0 && (
                            <p
                              className="
                                mt-1
                                max-w-32
                                text-xs
                                leading-5
                                text-slate-500
                              "
                            >
                              {formatDate(
                                order.createdAt
                              )}
                            </p>
                          )}

                          {index === 2 &&
                            order.shippedAt && (
                              <p
                                className="
                                  mt-1
                                  max-w-32
                                  text-xs
                                  leading-5
                                  text-slate-500
                                "
                              >
                                {formatDate(
                                  new Date(
                                    order.shippedAt
                                  )
                                )}
                              </p>
                            )}

                          {isCurrentStep && (
                            <span
                              className="
                                mt-2
                                rounded-full
                                bg-cyan-50
                                px-2.5
                                py-1
                                text-[10px]
                                font-bold
                                text-cyan-700
                              "
                            >
                              Status saat ini
                            </span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CURRENT DELIVERY MESSAGE */}

          {!isCancelled && (
            <div
              className="
                mx-4
                mb-4
                flex
                items-start
                gap-3
                rounded-2xl
                bg-sky-50
                px-4
                py-4
                sm:mx-6
                sm:mb-6
                sm:px-5
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-cyan-600
                  shadow-sm
                "
              >
                {isShipping ? (
                  <Truck className="h-5 w-5" />
                ) : isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
<h3
  className="
    text-sm
    font-bold
    text-sky-950
  "
>
  {isShipping
    ? "Pesanan sedang dalam perjalanan"
    : isCompleted
      ? "Pesanan telah selesai"
      : order.status === "PROCESSING"
        ? "Pesanan sedang diproses"
        : order.status === "WAITING_VERIFICATION"
          ? "Pembayaran sedang diverifikasi"
          : order.status === "WAITING_PAYMENT"
            ? "Menunggu pembayaran"
            : "Pesanan baru diterima"}
</h3>

<p
  className="
    mt-1
    text-xs
    leading-5
    text-sky-700
    sm:text-sm
  "
>
  {isShipping
    ? "Pesanan Anda sedang menuju alamat tujuan."
    : isCompleted
      ? "Pesanan telah berhasil diselesaikan."
      : order.status === "PROCESSING"
        ? "Pesanan Anda sedang dipersiapkan oleh Pisjo Market."
        : order.status === "WAITING_VERIFICATION"
          ? "Konfirmasi pembayaran Anda sedang diperiksa oleh admin."
          : order.status === "WAITING_PAYMENT"
            ? "Silakan selesaikan pembayaran untuk melanjutkan pesanan."
            : "Pesanan Anda telah diterima dan menunggu diproses oleh Pisjo Market."}
</p>
              </div>
            </div>
          )}
        </section>

{/* ==================================================== */}
{/* SHIPPING INFORMATION                                 */}
{/* ==================================================== */}

<section
  className="
    mt-4
    overflow-hidden
    rounded-2xl
    border
    border-sky-100
    bg-white
    shadow-[0_4px_18px_rgba(23,50,77,0.06)]
    sm:mt-6
  "
>
  <div
    className="
      flex
      items-center
      gap-3
      border-b
      border-slate-100
      px-4
      py-4
      sm:px-6
      sm:py-5
    "
  >
    <div
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-sky-50
        text-cyan-600
      "
    >
      <ReceiptText className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2
        className="
          text-base
          font-bold
          text-[var(--ocean-950)]
          sm:text-lg
        "
      >
        Informasi Pengiriman
      </h2>

      <p
        className="
          mt-0.5
          text-xs
          text-slate-500
        "
      >
        Detail layanan dan status pengiriman pesanan
      </p>
    </div>
  </div>

  <div
    className="
      grid
      gap-3
      p-4
      sm:grid-cols-2
      sm:p-6
    "
  >
    {/* KURIR */}
    <div
      className="
        rounded-xl
        border
        border-slate-100
        bg-slate-50
        p-4
      "
    >
      <p
        className="
          text-[10px]
          font-bold
          uppercase
          tracking-wide
          text-slate-400
        "
      >
        Kurir
      </p>

      <p
        className="
          mt-1
          text-sm
          font-bold
          text-slate-900
        "
      >
        {shippingProvider}
      </p>

      <p
        className="
          mt-0.5
          text-xs
          leading-5
          text-slate-500
        "
      >
        {shippingService}
      </p>
    </div>

    {/* NOMOR RESI */}
    <div
      className={`
        rounded-xl
        border
        p-4
        ${
          order.trackingNumber
            ? "border-cyan-100 bg-cyan-50/60"
            : "border-slate-100 bg-slate-50"
        }
      `}
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-slate-400
          "
        >
          Nomor Resi
        </p>

        {order.trackingNumber && (
          <span
            className="
              shrink-0
              rounded-full
              bg-cyan-100
              px-2
              py-0.5
              text-[9px]
              font-bold
              uppercase
              tracking-wide
              text-cyan-700
            "
          >
            Tersedia
          </span>
        )}
      </div>

      {order.trackingNumber ? (
        <p
          className="
            mt-2
            break-all
            font-mono
            text-sm
            font-bold
            leading-6
            tracking-wide
            text-[var(--ocean-950)]
          "
        >
          {order.trackingNumber}
        </p>
      ) : (
        <p
          className="
            mt-1
            text-sm
            font-medium
            text-slate-400
          "
        >
          Resi belum tersedia
        </p>
      )}

      {order.shippedAt && (
        <div
          className="
            mt-2
            flex
            items-center
            gap-1.5
            text-xs
            text-slate-500
          "
        >
          <Clock3 className="h-3.5 w-3.5 shrink-0" />

          <span>
            Dikirim{" "}
            {formatShortDate(
              new Date(order.shippedAt)
            )}
          </span>
        </div>
      )}
    </div>
  </div>
</section>

{/* ==================================================== */}
{/* ORDER ITEMS                                          */}
{/* ==================================================== */}

<section
  className="
    mt-4
    overflow-hidden
    rounded-2xl
    border
    border-sky-100
    bg-white
    shadow-[0_4px_18px_rgba(23,50,77,0.06)]
    sm:mt-6
  "
>
  <div
    className="
      flex
      items-center
      justify-between
      gap-3
      border-b
      border-slate-100
      px-4
      py-4
      sm:px-6
      sm:py-5
    "
  >
    <div className="min-w-0">
      <h2
        className="
          text-base
          font-bold
          text-[var(--ocean-950)]
          sm:text-lg
        "
      >
        Daftar Produk
      </h2>

      <p
        className="
          mt-0.5
          text-xs
          text-slate-500
        "
      >
        {order.items.length} produk dalam pesanan
      </p>
    </div>

    <ShoppingBag
      className="
        h-5
        w-5
        shrink-0
        text-cyan-600
      "
    />
  </div>

  <div className="divide-y divide-slate-100">
    {order.items.map((item) => (
      <div
        key={item.id}
        className="
          flex
          gap-3
          px-4
          py-4
          sm:gap-4
          sm:px-6
          sm:py-5
        "
      >
        {/* PRODUCT IMAGE PLACEHOLDER */}
        <div
          className="
            flex
            h-16
            w-16
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-xl
            bg-slate-100
            sm:h-20
            sm:w-20
          "
        >
          <Package
            className="
              h-7
              w-7
              text-slate-400
              sm:h-8
              sm:w-8
            "
          />
        </div>

        {/* PRODUCT INFORMATION */}
        <div
          className="
            min-w-0
            flex-1
          "
        >
          <h3
            className="
              line-clamp-2
              text-sm
              font-bold
              leading-5
              text-slate-900
              sm:text-base
              sm:leading-6
            "
          >
            {item.productName}
          </h3>

          <div
            className="
              mt-1.5
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-slate-500
                sm:text-sm
              "
            >
              {formatCurrency(Number(item.price))}
            </span>

            <span
              className="
                text-xs
                text-slate-300
              "
              aria-hidden="true"
            >
              ×
            </span>

            <span
              className="
                rounded-full
                bg-slate-100
                px-2
                py-0.5
                text-[10px]
                font-bold
                text-slate-600
                sm:text-xs
              "
            >
              {item.quantity} pcs
            </span>
          </div>
        </div>

        {/* SUBTOTAL */}
        <div
          className="
            w-[92px]
            shrink-0
            text-right
            sm:w-[120px]
          "
        >
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Subtotal
          </p>

          <p
            className="
              mt-1
              break-words
              text-sm
              font-bold
              leading-5
              text-[var(--ocean-950)]
              sm:text-base
              sm:leading-6
            "
          >
            {formatCurrency(Number(item.subtotal))}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>

{/* ==================================================== */}
{/* PAYMENT SUMMARY                                      */}
{/* ==================================================== */}

<section
  className="
    mt-4
    rounded-2xl
    border
    border-sky-100
    bg-white
    p-4
    shadow-[0_4px_18px_rgba(23,50,77,0.06)]
    sm:mt-6
    sm:p-6
  "
>
  <div
    className="
      flex
      items-center
      gap-3
    "
  >
    <div
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-sky-50
        text-cyan-600
      "
    >
      <CreditCard className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2
        className="
          text-base
          font-bold
          text-[var(--ocean-950)]
          sm:text-lg
        "
      >
        Rincian Pembayaran
      </h2>

      <p
        className="
          mt-0.5
          text-xs
          text-slate-500
        "
      >
        Ringkasan biaya pesanan
      </p>
    </div>
  </div>

  <div
    className="
      mt-5
      space-y-3
    "
  >
    {/* SUBTOTAL */}
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
        text-sm
      "
    >
      <span className="text-slate-500">
        Subtotal Produk
      </span>

      <span
        className="
          shrink-0
          text-right
          font-semibold
          text-slate-900
        "
      >
        {formatCurrency(Number(order.subtotal))}
      </span>
    </div>

    {/* SHIPPING COST */}
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
        text-sm
      "
    >
      <span className="text-slate-500">
        Ongkos Kirim
      </span>

      <span
        className="
          shrink-0
          text-right
          font-semibold
          text-slate-900
        "
      >
        {formatCurrency(Number(order.shippingCost))}
      </span>
    </div>

    {/* TOTAL */}
    <div
      className="
        mt-4
        flex
        items-center
        justify-between
        gap-4
        border-t
        border-slate-100
        pt-4
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-base
            font-bold
            text-[var(--ocean-950)]
          "
        >
          Total Pembayaran
        </p>

        <p
          className="
            mt-0.5
            text-[10px]
            text-slate-400
            sm:text-xs
          "
        >
          Total yang tercatat pada pesanan
        </p>
      </div>

      <span
        className="
          shrink-0
          text-right
          text-lg
          font-extrabold
          text-cyan-700
          sm:text-xl
        "
      >
        {formatCurrency(Number(order.total))}
      </span>
    </div>
  </div>
</section>

{/* ==================================================== */}
{/* SHIPPING ADDRESS                                     */}
{/* ==================================================== */}

<section
  className="
    mt-4
    rounded-2xl
    border
    border-sky-100
    bg-white
    p-4
    shadow-[0_4px_18px_rgba(23,50,77,0.06)]
    sm:mt-6
    sm:p-6
  "
>
  <div
    className="
      flex
      items-center
      gap-3
    "
  >
    <div
      className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-sky-50
        text-cyan-600
      "
    >
      <MapPin className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2
        className="
          text-base
          font-bold
          text-[var(--ocean-950)]
          sm:text-lg
        "
      >
        Alamat Pengiriman
      </h2>

      <p
        className="
          mt-0.5
          text-xs
          text-slate-500
        "
      >
        Tujuan pesanan Anda
      </p>
    </div>
  </div>

  <div
    className="
      mt-5
      space-y-4
    "
  >
    {/* RECEIVER */}
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <User
        className="
          mt-0.5
          h-4
          w-4
          shrink-0
          text-slate-400
        "
      />

      <div className="min-w-0 flex-1">
        <p
          className="
            break-words
            text-sm
            font-bold
            text-slate-900
          "
        >
          {order.address.receiverName}
        </p>

        {order.address.label && (
          <p
            className="
              mt-0.5
              break-words
              text-xs
              text-slate-500
            "
          >
            {order.address.label}
          </p>
        )}
      </div>
    </div>

    {/* PHONE */}
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <Phone
        className="
          mt-0.5
          h-4
          w-4
          shrink-0
          text-slate-400
        "
      />

      <p
        className="
          min-w-0
          break-words
          text-sm
          text-slate-600
        "
      >
        {order.address.receiverPhone}
      </p>
    </div>

    {/* ADDRESS */}
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <MapPin
        className="
          mt-0.5
          h-4
          w-4
          shrink-0
          text-slate-400
        "
      />

      <div
        className="
          min-w-0
          flex-1
          break-words
          text-sm
          leading-6
          text-slate-600
        "
      >
        <p className="break-words">
          {order.address.fullAddress}
        </p>

        <p className="break-words">
          {order.address.village},{" "}
          {order.address.district}
        </p>

        <p className="break-words">
          {order.address.city},{" "}
          {order.address.province}
        </p>

        <p className="break-words">
          {order.address.postalCode}
        </p>
      </div>
    </div>
  </div>
</section>

{/* ==================================================== */}
{/* PAYMENT STATUS                                       */}
{/* ==================================================== */}

<section
  className={`
    mt-4
    rounded-2xl
    border
    p-4
    shadow-[0_4px_18px_rgba(23,50,77,0.05)]
    sm:mt-6
    sm:p-5
    ${
      isPaymentVerified
        ? "border-emerald-100 bg-emerald-50"
        : isWaitingVerification
          ? "border-sky-100 bg-sky-50"
          : "border-amber-100 bg-amber-50"
    }
  `}
>
  <div
    className="
      flex
      items-start
      gap-3
    "
  >
    <div
      className={`
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-white
        ${
          isPaymentVerified
            ? "text-emerald-600"
            : isWaitingVerification
              ? "text-cyan-600"
              : "text-amber-600"
        }
      `}
    >
      {isPaymentVerified ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <Clock3 className="h-5 w-5" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <h2
        className={`
          text-sm
          font-bold
          ${
            isPaymentVerified
              ? "text-emerald-900"
              : isWaitingVerification
                ? "text-sky-900"
                : "text-amber-900"
          }
        `}
      >
        {isPaymentVerified
          ? "Pembayaran berhasil"
          : isWaitingVerification
            ? "Pembayaran sedang diverifikasi"
            : "Pembayaran belum selesai"}
      </h2>

      <p
        className={`
          mt-1
          text-xs
          leading-5
          ${
            isPaymentVerified
              ? "text-emerald-700"
              : isWaitingVerification
                ? "text-sky-700"
                : "text-amber-700"
          }
        `}
      >
        {isPaymentVerified
          ? "Pembayaran pesanan Anda telah diterima dan statusnya sudah terverifikasi."
          : isWaitingVerification
            ? "Konfirmasi pembayaran Anda sedang diperiksa oleh admin."
            : "Silakan selesaikan pembayaran melalui halaman pembayaran pesanan."}
      </p>
    </div>
  </div>

  {!isPaymentVerified && !isWaitingVerification && (
    <Link
      href={`/customer/orders/${order.id}/payment`}
      className="
        mt-4
        flex
        w-full
        items-center
        justify-center
        gap-2
        rounded-xl
        bg-cyan-600
        px-4
        py-3
        text-sm
        font-bold
        text-white
        transition
        hover:bg-cyan-700
      "
    >
      Lihat Pembayaran
    </Link>
  )}
</section>

        {/* ==================================================== */}
        {/* HELP                                                   */}
        {/* ==================================================== */}

        <section
          className="
            mt-4
            rounded-2xl
            border
            border-sky-100
            bg-white
            p-4
            shadow-[0_4px_18px_rgba(23,50,77,0.05)]
            sm:mt-6
            sm:p-5
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-sky-50
                text-cyan-600
              "
            >
              <Phone className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                className="
                  text-sm
                  font-bold
                  text-[var(--ocean-950)]
                "
              >
                Butuh Bantuan?
              </h2>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                Hubungi customer service Pisjo Market
                jika membutuhkan bantuan.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================== */}
        {/* BACK TO ORDER DETAIL                                  */}
        {/* ==================================================== */}

        <Link
          href={`/customer/orders/${order.id}`}
          className="
            mt-4
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-2xl
            border
            border-cyan-200
            bg-white
            px-4
            py-3.5
            text-sm
            font-bold
            text-cyan-700
            shadow-[0_4px_18px_rgba(23,50,77,0.04)]
            transition
            hover:bg-cyan-50
            sm:mt-6
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Detail Pesanan
        </Link>
      </div>
    </main>
  );
}
