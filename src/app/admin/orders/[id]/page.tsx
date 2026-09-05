import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Receipt,
  Truck,
  User,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

import OrderTimeline from "@/components/admin/orders/OrderTimeline";
import PaymentVerification from "@/components/admin/orders/PaymentVerification";
import OrderStatusControl from "@/components/admin/orders/OrderStatusControl";
import DeleteOrderButton from "@/components/admin/orders/DeleteOrderButton";
import CreateInternalShipmentButton from "@/components/admin/orders/CreateInternalShipmentButton";
import PrintInternalShippingLabelButton from "@/components/admin/orders/PrintInternalShippingLabelButton";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (
      value as {
        toNumber: () => number;
      }
    ).toNumber === "function"
      ? (
          value as {
            toNumber: () => number;
          }
        ).toNumber()
      : Number(value);

  if (!Number.isFinite(amount)) {
    return "Rp 0";
  }

  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

function getOrderStatusLabel(status: OrderStatus) {
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

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PENDING:
      return "Pending";

    case PaymentStatus.VERIFIED:
      return "Terverifikasi";

    case PaymentStatus.REJECTED:
      return "Ditolak";

    default:
      return status;
  }
}

function getOrderStatusClass(status: OrderStatus) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "border-[var(--pisjo-green)]/20 bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]";

    case OrderStatus.CANCELLED:
      return "border-[var(--pisjo-red)]/20 bg-[var(--pisjo-red)]/10 text-[var(--pisjo-red)]";

    case OrderStatus.SHIPPING:
      return "border-[var(--pisjo-primary)]/20 bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]";

    case OrderStatus.PROCESSING:
      return "border-[var(--pisjo-primary)]/20 bg-[var(--pisjo-primary)]/10 text-[var(--pisjo-ocean)]";

    case OrderStatus.WAITING_PAYMENT:
    case OrderStatus.WAITING_VERIFICATION:
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getPaymentStatusClass(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.VERIFIED:
      return "border-[var(--pisjo-green)]/20 bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]";

    case PaymentStatus.REJECTED:
      return "border-[var(--pisjo-red)]/20 bg-[var(--pisjo-red)]/10 text-[var(--pisjo-red)]";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getShippingStatus(orderStatus: OrderStatus) {
  switch (orderStatus) {
    case OrderStatus.SHIPPING:
      return {
        label: "Sedang Dikirim",
        description: "Pesanan sedang dalam proses pengiriman ke customer.",
        className:
          "border-[var(--pisjo-primary)]/20 bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]",
      };

    case OrderStatus.COMPLETED:
      return {
        label: "Pesanan Selesai",
        description: "Pesanan telah selesai diproses.",
        className:
          "border-[var(--pisjo-green)]/20 bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]",
      };

    case OrderStatus.CANCELLED:
      return {
        label: "Pengiriman Dibatalkan",
        description: "Order ini sudah dibatalkan.",
        className:
          "border-[var(--pisjo-red)]/20 bg-[var(--pisjo-red)]/10 text-[var(--pisjo-red)]",
      };

    case OrderStatus.PROCESSING:
      return {
        label: "Siap Dikirim",
        description: "Order sudah diproses dan siap untuk dikirim.",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    default:
      return {
        label: "Belum Dikirim",
        description: "Pengiriman belum dimulai.",
        className:
          "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
}

function getAddressEntries(address: unknown) {
  if (!address || typeof address !== "object") {
    return [];
  }

  return Object.entries(address).filter(([key, value]) => {
    if (
      key === "id" ||
      key === "userId" ||
      key === "createdAt" ||
      key === "updatedAt" ||
      key === "deletedAt"
    ) {
      return false;
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return false;
    }

    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  });
}

function formatAddressKey(key: string) {
  const labels: Record<string, string> = {
    label: "Label",
    name: "Nama",
    phone: "Telepon",
    address: "Alamat",
    district: "Kecamatan",
    city: "Kota",
    province: "Provinsi",
    postalCode: "Kode Pos",
    country: "Negara",
    notes: "Catatan",
    whatsapp: "WhatsApp",
    senderName: "Nama Pengirim",
    senderPhone: "Telepon Pengirim",
    isDefault: "Alamat Utama",
  };

  return (
    labels[key] ??
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (value) => value.toUpperCase())
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[var(--pisjo-navy)] sm:text-base">
          {title}
        </h2>

        {description ? (
          <p className="mt-0.5 text-xs text-[var(--pisjo-text-secondary)] sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs text-[var(--pisjo-text-secondary)] sm:text-sm">
        {label}
      </span>

      <span className="min-w-0 text-right text-sm font-medium text-[var(--pisjo-navy)] sm:text-sm">
        {value}
      </span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  let order;

  try {
    order = await OrderService.getOrderById(id);
  } catch {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const addressEntries = getAddressEntries(order.address);
  const shippingStatus = getShippingStatus(order.status);

  const productCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isPaid = order.paymentStatus === PaymentStatus.VERIFIED;
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isCompleted = order.status === OrderStatus.COMPLETED;

  return (
    <div className="min-w-0 space-y-4 pb-8 sm:space-y-6">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <Link
            href="/admin/orders"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--pisjo-text-secondary)] transition hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pesanan
          </Link>

          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 break-all text-xl font-bold tracking-tight text-[var(--pisjo-navy)] sm:text-2xl lg:text-3xl">
                  {order.orderNumber}
                </h1>

                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusClass(
                    order.status
                  )}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--pisjo-text-secondary)] sm:text-sm">
                <span>
                  Dibuat {formatDate(order.createdAt)}
                </span>

                <span className="hidden sm:inline">
                  •
                </span>

                <span>
                  {order.items.length} produk · {productCount} item
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              {!order.trackingNumber &&
                order.status === OrderStatus.PROCESSING && (
                  <CreateInternalShipmentButton
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                  />
                )}

              {order.trackingNumber && (
                <PrintInternalShippingLabelButton
                  orderId={order.id}
                  trackingNumber={order.trackingNumber}
                />
              )}

              <Link
                href={`/admin/orders/${order.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--pisjo-navy)] transition hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
              >
                Edit Pesanan
              </Link>

              <DeleteOrderButton
                id={order.id}
                orderNumber={order.orderNumber}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          QUICK SUMMARY
      ============================================================ */}

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
              <User className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                Customer
              </p>
              <p className="truncate text-sm font-bold text-[var(--pisjo-navy)]">
                {order.user.name}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
              <Receipt className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                Total Pesanan
              </p>
              <p className="truncate text-sm font-bold text-[var(--pisjo-navy)]">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isPaid
                  ? "bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <CreditCard className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                Pembayaran
              </p>

              <p
                className={`truncate text-sm font-bold ${
                  isPaid
                    ? "text-[var(--pisjo-green)]"
                    : "text-amber-700"
                }`}
              >
                {getPaymentStatusLabel(order.paymentStatus)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isCompleted
                  ? "bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]"
                  : isCancelled
                    ? "bg-[var(--pisjo-red)]/10 text-[var(--pisjo-red)]"
                    : "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]"
              }`}
            >
              <Package className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                Status
              </p>

              <p className="truncate text-sm font-bold text-[var(--pisjo-navy)]">
                {getOrderStatusLabel(order.status)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CUSTOMER + PAYMENT
      ============================================================ */}

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        {/* CUSTOMER */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={User}
            title="Informasi Customer"
            description="Data customer yang membuat pesanan"
          />

          <div className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                  Nama
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-[var(--pisjo-navy)]">
                  {order.user.name}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-medium text-[var(--pisjo-navy)]">
                  {order.user.email}
                </p>
              </div>

              <div className="min-w-0 sm:col-span-2">
                <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                  Telepon
                </p>

                <p className="mt-1 text-sm font-medium text-[var(--pisjo-navy)]">
                  {order.user.phone ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENT */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={CreditCard}
            title="Pembayaran"
            description="Status dan verifikasi pembayaran"
          />

          <div className="p-4 sm:p-5">
            <div className="divide-y divide-slate-100">
              <InfoRow
                label="Metode"
                value={String(order.paymentMethod).replace(
                  /_/g,
                  " "
                )}
              />

              <InfoRow
                label="Status"
                value={
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
                      order.paymentStatus
                    )}`}
                  >
                    {getPaymentStatusLabel(
                      order.paymentStatus
                    )}
                  </span>
                }
              />

              <InfoRow
                label="Dibayar"
                value={formatDate(order.paidAt)}
              />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <PaymentVerification
                orderId={order.id}
                paymentStatus={order.paymentStatus}
                orderStatus={order.status}
                hasPaymentProof={Boolean(order.paymentProof)}
              />
            </div>

            {order.paymentProof ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--pisjo-green)]/20 bg-[var(--pisjo-green)]/5 p-3.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-green)]" />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--pisjo-navy)]">
                    Bukti pembayaran tersedia
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                    Bukti pembayaran sudah terhubung dengan order ini.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </section>

      {/* ============================================================
          TIMELINE
      ============================================================ */}

      <section className="min-w-0">
        <OrderTimeline
          createdAt={order.createdAt}
          paidAt={order.paidAt}
          completedAt={order.completedAt}
          deletedAt={order.deletedAt}
          status={order.status}
          paymentStatus={order.paymentStatus}
        />
      </section>

      {/* ============================================================
          STATUS CONTROL
      ============================================================ */}

      <section className="min-w-0">
        <OrderStatusControl
          orderId={order.id}
          status={order.status}
          paymentStatus={order.paymentStatus}
        />
      </section>

      {/* ============================================================
          ORDER ITEMS
      ============================================================ */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          icon={Package}
          title="Produk Pesanan"
          description={`${order.items.length} jenis produk · ${productCount} item`}
        />

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Produk
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Harga
                </th>

                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Qty
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="max-w-[480px] px-5 py-4 align-top">
                    <p className="font-semibold text-[var(--pisjo-navy)]">
                      {item.productName}
                    </p>

                    {item.product && (
                      <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                        SKU: {item.product.sku ?? "-"}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.productVariant ? (
                        <span className="inline-flex rounded-full bg-[var(--pisjo-soft-blue)] px-2.5 py-1 text-xs font-medium text-[var(--pisjo-ocean)]">
                          Varian: {item.productVariant}
                        </span>
                      ) : null}

                      {item.productWeight ? (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Berat: {item.productWeight}
                        </span>
                      ) : null}
                    </div>

                    {typeof item.customerNote === "string" &&
                    item.customerNote.trim() !== "" ? (
                      <div className="mt-3 rounded-xl border border-[var(--pisjo-primary)]/15 bg-[var(--pisjo-soft-blue)] p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-ocean)]" />

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--pisjo-ocean)]">
                              Catatan Customer
                            </p>

                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-[var(--pisjo-navy)]">
                              {item.customerNote.trim()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right align-top text-[var(--pisjo-navy)]">
                    {formatCurrency(item.price)}
                  </td>

                  <td className="px-5 py-4 text-center align-top font-semibold text-[var(--pisjo-navy)]">
                    {item.quantity}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right align-top font-bold text-[var(--pisjo-navy)]">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}

        <div className="divide-y divide-slate-100 md:hidden">
          {order.items.map((item) => (
            <article key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-bold text-[var(--pisjo-navy)]">
                    {item.productName}
                  </h3>

                  {item.product && (
                    <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                      SKU: {item.product.sku ?? "-"}
                    </p>
                  )}
                </div>

                <span className="shrink-0 rounded-lg bg-[var(--pisjo-soft-blue)] px-2.5 py-1 text-xs font-bold text-[var(--pisjo-ocean)]">
                  × {item.quantity}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.productVariant ? (
                  <span className="rounded-full bg-[var(--pisjo-soft-blue)] px-2.5 py-1 text-xs font-medium text-[var(--pisjo-ocean)]">
                    {item.productVariant}
                  </span>
                ) : null}

                {item.productWeight ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {item.productWeight}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-[11px] text-[var(--pisjo-text-secondary)]">
                    Harga
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-[var(--pisjo-text-secondary)]">
                    Subtotal
                  </p>

                  <p className="mt-1 text-sm font-bold text-[var(--pisjo-ocean)]">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              </div>

              {typeof item.customerNote === "string" &&
              item.customerNote.trim() !== "" ? (
                <div className="mt-3 rounded-xl border border-[var(--pisjo-primary)]/15 bg-[var(--pisjo-soft-blue)] p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-ocean)]" />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--pisjo-ocean)]">
                        Catatan Customer
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-[var(--pisjo-navy)]">
                        {item.customerNote.trim()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* ============================================================
          ADDRESS + SHIPPING
      ============================================================ */}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* ADDRESS */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={MapPin}
            title="Alamat Pengiriman"
            description="Alamat yang digunakan untuk order ini"
          />

          <div className="p-4 sm:p-5">
            {addressEntries.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {addressEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className={
                      key === "address" ||
                      key === "notes"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                      {formatAddressKey(key)}
                    </p>

                    <div className="mt-1 break-words whitespace-pre-line text-sm font-medium leading-6 text-[var(--pisjo-navy)]">
                      {typeof value === "boolean" ? (
                        value ? (
                          <span className="inline-flex items-center rounded-full border border-[var(--pisjo-green)]/20 bg-[var(--pisjo-green)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--pisjo-green)]">
                            Alamat Utama
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            Bukan Alamat Utama
                          </span>
                        )
                      ) : (
                        String(value)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <MapPin className="mx-auto h-6 w-6 text-slate-400" />

                <p className="mt-2 text-sm font-medium text-slate-600">
                  Informasi alamat tidak tersedia.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* SHIPPING */}

        {order.trackingNumber ? (
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Truck}
              title="Informasi Pengiriman"
              description="Detail pengiriman order"
            />

            <div className="p-4 sm:p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Kurir
                  </p>

                  <p className="mt-1 text-sm font-bold text-[var(--pisjo-navy)]">
                    {order.shippingProvider === "INTERNAL"
                      ? "Pisjo Delivery"
                      : order.shippingProvider}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Layanan
                  </p>

                  <p className="mt-1 break-words text-sm font-medium text-[var(--pisjo-navy)]">
                    {order.shippingService ??
                      "Pengiriman Internal Pisjo Market"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Nomor Resi
                  </p>

                  <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[var(--pisjo-primary)]/15 bg-[var(--pisjo-soft-blue)] px-3.5 py-3">
                    <span className="min-w-0 break-all font-mono text-sm font-bold text-[var(--pisjo-ocean)]">
                      {order.trackingNumber}
                    </span>

                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--pisjo-primary)]" />
                  </div>
                </div>

                {order.shippedAt ? (
                  <div>
                    <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                      Tanggal Pengiriman
                    </p>

                    <p className="mt-1 text-sm font-medium text-[var(--pisjo-navy)]">
                      {formatDate(new Date(order.shippedAt))}
                    </p>
                  </div>
                ) : null}

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Status Pengiriman
                  </p>

                  <div
                    className={`mt-2 rounded-xl border p-3.5 ${shippingStatus.className}`}
                  >
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-4 w-4 shrink-0" />

                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          {shippingStatus.label}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 opacity-80">
                          {shippingStatus.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <PrintInternalShippingLabelButton
                    orderId={order.id}
                    trackingNumber={order.trackingNumber}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="min-w-0 overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={Truck}
              title="Pengiriman"
              description="Informasi pengiriman order"
            />

            <div className="p-4 sm:p-5">
              <div className="rounded-xl bg-slate-50 p-5 text-center">
                <Truck className="mx-auto h-7 w-7 text-slate-400" />

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Belum ada pengiriman
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Nomor resi dan informasi kurir akan muncul setelah
                  pengiriman dibuat.
                </p>

                {order.status === OrderStatus.PROCESSING ? (
                  <div className="mt-4 flex justify-center">
                    <CreateInternalShipmentButton
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </section>

      {/* ============================================================
          TOTAL
      ============================================================ */}

      <section className="overflow-hidden rounded-2xl border border-[var(--pisjo-primary)]/15 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <div className="hidden border-r border-slate-100 bg-[var(--pisjo-soft-blue)]/40 p-6 lg:block">
            <div className="flex h-full flex-col justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pisjo-primary)] text-white shadow-sm">
                <Receipt className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-lg font-bold text-[var(--pisjo-navy)]">
                Ringkasan Pembayaran
              </h2>

              <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--pisjo-text-secondary)]">
                Rincian nilai transaksi berdasarkan data order yang
                tersimpan.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--pisjo-text-secondary)]">
                  Subtotal
                </span>

                <span className="font-medium text-[var(--pisjo-navy)]">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--pisjo-text-secondary)]">
                  Biaya Pengiriman
                </span>

                <span className="font-medium text-[var(--pisjo-navy)]">
                  {formatCurrency(order.shippingCost)}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--pisjo-navy)]">
                      Total Pesanan
                    </p>

                    <p className="mt-0.5 text-xs text-[var(--pisjo-text-secondary)]">
                      Nilai akhir transaksi
                    </p>
                  </div>

                  <span className="text-xl font-extrabold text-[var(--pisjo-ocean)] sm:text-2xl">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          NOTES
      ============================================================ */}

      {order.notes ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={FileText}
            title="Catatan Order"
            description="Catatan tambahan dari order"
          />

          <div className="p-4 sm:p-5">
            <div className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-[var(--pisjo-navy)]">
              {order.notes}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
