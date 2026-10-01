"use client";

import Link from "next/link";

import {
  ChevronRight,
  Package,
} from "lucide-react";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import AdminDataTable from "@/components/admin/common/AdminDataTable";
import { Button } from "@/components/ui/button";

/**
 * ==========================================================
 * TYPES
 * ==========================================================
 */

interface OrderTableItem {
  id: string;
  orderNumber: string;

  user: {
    id: string;
    name: string;
    email: string;
  };

  total: number;

  status: OrderStatus;
  paymentStatus: PaymentStatus;

  createdAt: Date;

  items: Array<{
    id: string;
    productName: string;
    productVariant: string | null;
    productWeight: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface OrderTableProps {
  data: OrderTableItem[];
}

/**
 * ==========================================================
 * STATUS LABEL
 * ==========================================================
 */

function getOrderStatusLabel(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.PENDING:
      return "Pending";

    case OrderStatus.WAITING_PAYMENT:
      return "Menunggu Pembayaran";

    case OrderStatus.WAITING_VERIFICATION:
      return "Menunggu Verifikasi";

    case OrderStatus.PROCESSING:
      return "Diproses";

    case OrderStatus.SHIPPING:
      return "Dikirim";

    case OrderStatus.COMPLETED:
      return "Selesai";

    case OrderStatus.CANCELLED:
      return "Dibatalkan";

    default:
      return status;
  }
}

/**
 * ==========================================================
 * PAYMENT STATUS LABEL
 * ==========================================================
 */

function getPaymentStatusLabel(
  status: PaymentStatus
) {
  switch (status) {
    case PaymentStatus.PENDING:
      return "Menunggu";

    case PaymentStatus.VERIFIED:
      return "Terverifikasi";

    case PaymentStatus.REJECTED:
      return "Ditolak";

    default:
      return status;
  }
}

/**
 * ==========================================================
 * STATUS STYLE
 * ==========================================================
 */

function getOrderStatusClass(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case OrderStatus.SHIPPING:
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

    case OrderStatus.PROCESSING:
      return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";

    case OrderStatus.WAITING_VERIFICATION:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

    case OrderStatus.WAITING_PAYMENT:
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";

    case OrderStatus.CANCELLED:
      return "bg-red-50 text-red-700 ring-1 ring-red-200";

    case OrderStatus.PENDING:
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

/**
 * ==========================================================
 * PAYMENT STYLE
 * ==========================================================
 */

function getPaymentStatusClass(
  status: PaymentStatus
) {
  switch (status) {
    case PaymentStatus.VERIFIED:
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case PaymentStatus.REJECTED:
      return "bg-red-50 text-red-700 ring-1 ring-red-200";

    case PaymentStatus.PENDING:
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

/**
 * ==========================================================
 * CURRENCY
 * ==========================================================
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
 * ==========================================================
 * DATE
 * ==========================================================
 */

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }
  ).format(new Date(value));
}

/**
 * ==========================================================
 * PRODUCT SUMMARY
 * ==========================================================
 */

function getMobileOrderStatusLabel(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.WAITING_VERIFICATION:
      return "Menunggu Verif";

    case OrderStatus.WAITING_PAYMENT:
      return "Menunggu Bayar";

    case OrderStatus.PROCESSING:
      return "Diproses";

    case OrderStatus.SHIPPING:
      return "Dikirim";

    case OrderStatus.COMPLETED:
      return "Selesai";

    case OrderStatus.CANCELLED:
      return "Dibatalkan";

    case OrderStatus.PENDING:
    default:
      return "Pending";
  }
}

function formatMobileDate(
  value: Date
) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }
  ).format(date);

  const timePart = new Intl.DateTimeFormat(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      hour12: false,
    }
  ).format(date);

  return `${datePart} • ${timePart}`;
}

function getMobileProductSummary(
  order: OrderTableItem
) {
  if (!order.items.length) {
    return "Tidak ada item";
  }

  const firstItem = order.items[0];
  const weight = firstItem.productWeight
    ? ` ${firstItem.productWeight}`
    : "";

  const firstProduct = `${firstItem.productName}${weight} × ${firstItem.quantity}`;

  if (order.items.length === 1) {
    return firstProduct;
  }

  return `${firstProduct} +${order.items.length - 1} produk lainnya`;
}

/**
 * ==========================================================
 * PRODUCT SUMMARY
 * ==========================================================
 */

function getProductSummary(
  order: OrderTableItem
) {
  if (!order.items.length) {
    return "Tidak ada item";
  }

  const firstItem = order.items[0];

  const variantParts = [
    firstItem.productVariant,
    firstItem.productWeight,
  ].filter(Boolean);

  const variantLabel =
    variantParts.length > 0
      ? ` • ${variantParts.join(" • ")}`
      : "";

  const firstProduct =
    `${firstItem.productName}${variantLabel}`;

  if (order.items.length === 1) {
    return `${firstProduct} × ${firstItem.quantity}`;
  }

  return `${firstProduct} × ${firstItem.quantity} + ${order.items.length - 1} produk lainnya`;
}

/**
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

export default function OrderTable({
  data,
}: OrderTableProps) {
  return (
    <>
      {/* ================================================== */}
      {/* DESKTOP TABLE                                      */}
      {/* ================================================== */}

      <div className="hidden min-w-0 md:block">
        <AdminDataTable
          tableClassName="table-fixed"
          wrapperClassName="overflow-x-hidden"
          headers={[
            "Order",
            "Customer",
            "Produk",
            "Total",
            "Pembayaran",
            "Status",
            "Tanggal",
            "Aksi",
          ]}
        >
          {data.map((order) => (
            <tr
              key={order.id}
              className="border-b border-slate-100 last:border-b-0"
            >
              {/* ========================================== */}
              {/* ORDER                                      */}
              {/* ========================================== */}

              <td className="w-[22%] min-w-0 overflow-hidden px-3 py-4 align-middle">
                <div className="min-w-0">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    title={order.orderNumber}
                    className="block min-w-0 max-w-full line-clamp-2 break-words text-[12px] font-semibold leading-5 text-[var(--pisjo-ocean)] underline decoration-[var(--pisjo-primary)]/40 underline-offset-2 transition hover:text-[var(--pisjo-primary)]"
                  >
                    {order.orderNumber}
                  </Link>

                  <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                    {order.items.length}{" "}
                    item
                    {order.items.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </td>

              {/* ========================================== */}
              {/* CUSTOMER                                   */}
              {/* ========================================== */}

              <td className="w-[13%] min-w-0 px-3 py-4 align-middle">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {order.user.name}
                  </p>

                  <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                    {order.user.email}
                  </p>
                </div>
              </td>

              {/* ========================================== */}
              {/* PRODUCT                                    */}
              {/* ========================================== */}

              <td className="w-[17%] min-w-0 px-3 py-4 align-middle">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                    <Package className="h-4 w-4" />
                  </div>

                  <p className="min-w-0 line-clamp-2 break-words text-sm text-slate-700">
                    {getProductSummary(order)}
                  </p>
                </div>
              </td>

              {/* ========================================== */}
              {/* TOTAL                                      */}
              {/* ========================================== */}

              <td className="w-[9%] px-3 py-4 align-middle">
                <p className="font-semibold text-[var(--pisjo-navy)]">
                  {formatCurrency(order.total)}
                </p>
              </td>

              {/* ========================================== */}
              {/* PAYMENT                                    */}
              {/* ========================================== */}

              <td className="w-[11%] px-3 py-4 align-middle">
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                    getPaymentStatusClass(
                      order.paymentStatus
                    ),
                  ].join(" ")}
                >
                  {getPaymentStatusLabel(
                    order.paymentStatus
                  )}
                </span>
              </td>

              {/* ========================================== */}
              {/* ORDER STATUS                               */}
              {/* ========================================== */}

              <td className="w-[10%] px-3 py-4 align-middle">
                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                    getOrderStatusClass(
                      order.status
                    ),
                  ].join(" ")}
                >
                  {getOrderStatusLabel(
                    order.status
                  )}
                </span>
              </td>

              {/* ========================================== */}
              {/* DATE                                       */}
              {/* ========================================== */}

              <td className="w-[9%] px-3 py-4 align-middle">
                <p className="break-words text-xs leading-5 text-slate-600">
                  {formatDate(
                    order.createdAt
                  )}
                </p>
              </td>

              {/* ========================================== */}
              {/* ACTION                                     */}
              {/* ========================================== */}

              <td className="w-[9%] whitespace-nowrap px-3 py-4 text-right align-middle">
                <Link
                  href={`/admin/orders/${order.id}`}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 rounded-lg border-slate-200 px-2.5 text-xs text-[var(--pisjo-ocean)] hover:border-[var(--pisjo-primary)] hover:bg-[var(--pisjo-soft-blue)]"
                  >
                    Detail

                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </AdminDataTable>

        {/* ================================================== */}
        {/* DESKTOP EMPTY STATE                               */}
        {/* ================================================== */}

        {data.length === 0 && (
          <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white px-6 py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              Tidak ada pesanan
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Belum ada pesanan yang sesuai
              dengan filter saat ini.
            </p>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* MOBILE ORDER CARDS                                */}
      {/* ================================================== */}

      <div className="grid min-w-0 gap-2.5 px-2 py-1 md:hidden">
        {data.map((order) => (
          <article
            key={order.id}
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm"
          >
            {/* ============================================ */}
            {/* ORDER + STATUS                               */}
            {/* ============================================ */}

            <div className="flex min-w-0 items-center justify-between gap-2">
              <Link
                href={`/admin/orders/${order.id}`}
                title={order.orderNumber}
                className="min-w-0 truncate text-[13px] font-bold text-[var(--pisjo-ocean)]"
              >
                {order.orderNumber}
              </Link>

              <span
                className={[
                  "inline-flex max-w-[42%] shrink-0 truncate rounded-full px-2 py-1 text-[10px] font-semibold",
                  getOrderStatusClass(
                    order.status
                  ),
                ].join(" ")}
              >
                {getMobileOrderStatusLabel(
                  order.status
                )}
              </span>
            </div>

            {/* ============================================ */}
            {/* CUSTOMER + DATE                              */}
            {/* ============================================ */}

            <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[12px] font-semibold text-slate-800">
                {order.user.name}
              </p>

              <p className="shrink-0 text-[10px] text-slate-500">
                {formatMobileDate(
                  order.createdAt
                )}
              </p>
            </div>

            {/* ============================================ */}
            {/* PRODUCT SUMMARY                              */}
            {/* ============================================ */}

            <p
              className="mt-2 min-w-0 truncate text-[12px] leading-5 text-slate-600"
              title={getMobileProductSummary(order)}
            >
              {getMobileProductSummary(order)}
            </p>

            {/* ============================================ */}
            {/* TOTAL + DETAIL                               */}
            {/* ============================================ */}

            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
              <p className="min-w-0 truncate text-[15px] font-bold text-[var(--pisjo-navy)]">
                {formatCurrency(order.total)}
              </p>

              <Link
                href={`/admin/orders/${order.id}`}
                className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[var(--pisjo-ocean)] transition hover:text-[var(--pisjo-primary)]"
              >
                Detail
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}

        {/* ================================================== */}
        {/* MOBILE EMPTY STATE                                */}
        {/* ================================================== */}

        {data.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <Package className="mx-auto h-9 w-9 text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              Tidak ada pesanan
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Belum ada pesanan yang sesuai
              dengan filter saat ini.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
