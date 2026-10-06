import Link from "next/link";
import {
  ArrowLeft,
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
import { OrderStatus, PaymentStatus } from "@prisma/client";

import OrderService from "@/services/order/order.service";

import OrderTimeline from "@/components/admin/orders/OrderTimeline";
import CourierFriendlyAddress from "@/components/admin/orders/CourierFriendlyAddress";
import PaymentOrderReferencePanel from "@/components/admin/orders/PaymentOrderReferencePanel";
import DeleteOrderButton from "@/components/admin/orders/DeleteOrderButton";
import CreateInternalShipmentButton from "@/components/admin/orders/CreateInternalShipmentButton";
import PrintInternalShippingLabelButton from "@/components/admin/orders/PrintInternalShippingLabelButton";
import AssignCourierOrderButton from "@/components/admin/orders/AssignCourierOrderButton";

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

function getOrderItemPromotion(item: {
  normalPriceSnapshot?: unknown;
  promoPriceSnapshot?: unknown;
  discountAmountSnapshot?: unknown;
  promotionName?: string | null;
  promotionType?: string | null;
  flashSaleId?: string | null;
}) {
  const normalPrice = Number(item.normalPriceSnapshot);
  const promoPrice = Number(item.promoPriceSnapshot);
  const snapshotDiscount = Number(item.discountAmountSnapshot);

  const hasSnapshotPrices =
    Number.isFinite(normalPrice) &&
    normalPrice > 0 &&
    Number.isFinite(promoPrice) &&
    promoPrice > 0 &&
    promoPrice < normalPrice;

  const discountAmount =
    Number.isFinite(snapshotDiscount) && snapshotDiscount > 0
      ? snapshotDiscount
      : hasSnapshotPrices
        ? normalPrice - promoPrice
        : 0;

  const isFlashSale = Boolean(item.flashSaleId);
  const hasPromotion = hasSnapshotPrices && discountAmount > 0;

  return {
    hasPromotion,
    isFlashSale,
    normalPrice,
    promoPrice,
    discountAmount,
    promotionName: item.promotionName?.trim() || null,
    promotionType: item.promotionType ?? null,
  };
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
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
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };

    default:
      return {
        label: "Belum Dikirim",
        description: "Pengiriman belum dimulai.",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };
  }
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
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

  /**
   * Serialize Prisma Decimal values before passing
   * address data to the Client Component.
   */
  const courierAddress = order.address
    ? {
        receiverName: order.address.receiverName ?? "",
        receiverPhone: order.address.receiverPhone ?? "",
        province: order.address.province ?? "",
        city: order.address.city ?? "",
        district: order.address.district ?? "",
        village: order.address.village ?? "",
        postalCode: order.address.postalCode ?? "",
        fullAddress: order.address.fullAddress ?? "",
        latitude:
          order.address.latitude !== null &&
          order.address.latitude !== undefined
            ? order.address.latitude.toString()
            : null,
        longitude:
          order.address.longitude !== null &&
          order.address.longitude !== undefined
            ? order.address.longitude.toString()
            : null,
        notes: order.address.notes ?? null,
        label: order.address.label ?? null,
      }
    : null;

  const shippingStatus = getShippingStatus(order.status);

  const productCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const isPaid = order.paymentStatus === PaymentStatus.VERIFIED;
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isCompleted = order.status === OrderStatus.COMPLETED;

  return (
    <div className="min-w-0 space-y-5 pb-8 sm:space-y-6">
      {/* HEADER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--pisjo-text-secondary)] sm:text-sm">
          <Link
            href="/admin/orders"
            className="transition hover:text-[var(--pisjo-ocean)]"
          >
            Pesanan
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-[var(--pisjo-navy)]">
            Detail Order
          </span>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--pisjo-navy)] shadow-sm transition hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Pesanan
        </Link>

        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 className="min-w-0 break-all text-2xl font-extrabold tracking-tight text-[var(--pisjo-navy)] sm:text-3xl">
                {order.orderNumber}
              </h1>
              <span
                className={`inline-flex shrink-0 items-center rounded-lg border px-3 py-1.5 text-xs font-bold ${getOrderStatusClass(order.status)}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--pisjo-text-secondary)] sm:text-sm">
              <span>Dibuat {formatDate(order.createdAt)}</span>
              <span>•</span>
              <span>
                {order.items.length} produk · {productCount} item
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            {isPaid &&
            (order.status === OrderStatus.PROCESSING ||
              order.status === OrderStatus.SHIPPING) ? (
              <AssignCourierOrderButton
                orderId={order.id}
                orderNumber={order.orderNumber}
              />
            ) : null}

            <Link
              href={`/admin/orders/${order.id}/edit`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--pisjo-navy)] transition hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)]"
            >
              Edit Pesanan
            </Link>

            <DeleteOrderButton id={order.id} orderNumber={order.orderNumber} />
          </div>
        </div>
      </div>

      {/* QUICK SUMMARY */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
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
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
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
          <div className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isPaid ? "bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]" : "bg-amber-50 text-amber-600"}`}
            >
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                Pembayaran
              </p>
              <p
                className={`truncate text-sm font-bold ${isPaid ? "text-[var(--pisjo-green)]" : "text-amber-700"}`}
              >
                {getPaymentStatusLabel(order.paymentStatus)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isCompleted ? "bg-[var(--pisjo-green)]/10 text-[var(--pisjo-green)]" : isCancelled ? "bg-[var(--pisjo-red)]/10 text-[var(--pisjo-red)]" : "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]"}`}
            >
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                Status Order
              </p>
              <p className="truncate text-sm font-bold text-[var(--pisjo-navy)]">
                {getOrderStatusLabel(order.status)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER + PAYMENT */}
      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            icon={User}
            title="Informasi Customer & Alamat Pengiriman"
            description="Data customer dan alamat yang tersimpan pada order ini"
          />
          <div className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                  Nama
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
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
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                  Telepon
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--pisjo-navy)]">
                  {order.user.phone ?? "-"}
                </p>
              </div>
              {courierAddress ? (
                <div className="min-w-0 sm:col-span-2 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--pisjo-text-secondary)]">
                    <MapPin className="h-4 w-4 text-[var(--pisjo-ocean)]" />
                    Alamat Pengiriman
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-[var(--pisjo-soft-blue)]/40 p-3.5">
                    <CourierFriendlyAddress address={courierAddress} />
                  </div>
                </div>
              ) : (
                <div className="min-w-0 sm:col-span-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--pisjo-text-secondary)]">
                    <MapPin className="h-4 w-4 text-[var(--pisjo-ocean)]" />
                    Alamat Pengiriman
                  </div>
                  <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      Informasi alamat tidak tersedia.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <PaymentOrderReferencePanel
          orderId={order.id}
          paymentMethod={String(order.paymentMethod)}
          paymentStatus={order.paymentStatus}
          orderStatus={order.status}
          hasPaymentProof={Boolean(order.paymentProof)}
          paymentProofId={order.paymentProof?.id ?? null}
          paymentStatusLabel={getPaymentStatusLabel(order.paymentStatus)}
          orderStatusLabel={getOrderStatusLabel(order.status)}
        />
      </section>
      {/* PRODUK PESANAN */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          icon={Package}
          title="Produk Pesanan"
          description={`${order.items.length} jenis produk · ${productCount} item`}
        />
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-[var(--pisjo-soft-blue)]/45">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Produk
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Varian
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Harga
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
                  Qty
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
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
                  <td className="px-5 py-4 align-top">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {(() => {
                          const thumbnail =
                            item.product?.images?.find(
                              (image) =>
                                !image.mediaType || image.mediaType === "IMAGE",
                            )?.image ?? item.product?.images?.[0]?.image;

                          return thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[var(--pisjo-text-secondary)]">
                              <Package className="h-5 w-5" />
                            </div>
                          );
                        })()}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--pisjo-navy)]">
                          {item.productName}
                        </p>
                        {item.product ? (
                          <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                            SKU: {item.product.sku ?? "-"}
                          </p>
                        ) : null}
                        {item.customerNote?.trim() ? (
                          <p className="mt-2 text-xs text-[var(--pisjo-text-secondary)]">
                            Catatan: {item.customerNote.trim()}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
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
                  </td>
                  <td className="px-5 py-4 text-right align-top text-[var(--pisjo-navy)]">
                    {(() => {
                      const promotion = getOrderItemPromotion(item);

                      if (!promotion.hasPromotion) {
                        return (
                          <span className="whitespace-nowrap">
                            {formatCurrency(item.price)}
                          </span>
                        );
                      }

                      return (
                        <div className="flex min-w-[150px] flex-col items-end gap-1">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <span className="text-xs font-medium text-slate-400 line-through">
                              {formatCurrency(promotion.normalPrice)}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                                promotion.isFlashSale
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]"
                              }`}
                            >
                              {promotion.isFlashSale ? "FLASH SALE" : "PROMO"}
                            </span>
                          </div>
                          <span className="whitespace-nowrap text-sm font-extrabold text-[var(--pisjo-ocean)]">
                            {formatCurrency(promotion.promoPrice)}
                          </span>
                          {promotion.discountAmount > 0 ? (
                            <span className="whitespace-nowrap text-[11px] font-semibold text-emerald-600">
                              Hemat {formatCurrency(promotion.discountAmount)}
                            </span>
                          ) : null}
                          {promotion.promotionName ? (
                            <span className="max-w-[180px] truncate text-[10px] font-medium text-slate-500">
                              {promotion.promotionName}
                            </span>
                          ) : null}
                        </div>
                      );
                    })()}
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
        <div className="divide-y divide-slate-100 md:hidden">
          {order.items.map((item) => {
            const thumbnail =
              item.product?.images?.find(
                (image) => !image.mediaType || image.mediaType === "IMAGE",
              )?.image ?? item.product?.images?.[0]?.image;

            return (
              <article key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--pisjo-text-secondary)]">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-bold text-[var(--pisjo-navy)]">
                        {item.productName}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                        {item.productVariant || "-"}
                        {item.productWeight ? ` · ${item.productWeight}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-lg bg-[var(--pisjo-soft-blue)] px-2.5 py-1 text-xs font-bold text-[var(--pisjo-ocean)]">
                    × {item.quantity}
                  </span>
                </div>

                {(() => {
                  const promotion = getOrderItemPromotion(item);

                  if (!promotion.hasPromotion) {
                    return (
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-xs text-[var(--pisjo-text-secondary)]">
                          Harga
                        </span>
                        <span className="text-sm font-semibold text-[var(--pisjo-navy)]">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-[var(--pisjo-text-secondary)]">
                          Harga normal
                        </span>
                        <span className="text-xs font-medium text-slate-400 line-through">
                          {formatCurrency(promotion.normalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-[var(--pisjo-text-secondary)]">
                          Harga promo
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                              promotion.isFlashSale
                                ? "bg-orange-50 text-orange-600"
                                : "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]"
                            }`}
                          >
                            {promotion.isFlashSale ? "FLASH SALE" : "PROMO"}
                          </span>
                          <span className="text-sm font-extrabold text-[var(--pisjo-ocean)]">
                            {formatCurrency(promotion.promoPrice)}
                          </span>
                        </div>
                      </div>
                      {promotion.discountAmount > 0 ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[var(--pisjo-text-secondary)]">
                            Hemat
                          </span>
                          <span className="text-xs font-bold text-emerald-600">
                            {formatCurrency(promotion.discountAmount)}
                          </span>
                        </div>
                      ) : null}
                      {promotion.promotionName ? (
                        <p className="text-[11px] font-medium text-slate-500">
                          {promotion.promotionName}
                        </p>
                      ) : null}
                    </div>
                  );
                })()}

                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--pisjo-text-secondary)]">
                    Subtotal
                  </span>
                  <span className="text-sm font-bold text-[var(--pisjo-ocean)]">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>

                {item.customerNote?.trim() ? (
                  <p className="mt-3 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                    Catatan: {item.customerNote.trim()}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {/* SHIPPING + PAYMENT SUMMARY */}
      <section className="grid min-w-0 gap-4 xl:grid-cols-5">
        {/* PENGIRIMAN */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-3">
          <SectionHeader
            icon={Truck}
            title="Pengiriman"
            description="Informasi pengiriman dan nomor resi order"
          />

          <div className="p-4 sm:p-5">
            {order.trackingNumber ? (
              <div className="rounded-xl border border-slate-200 bg-[var(--pisjo-soft-blue)]/30 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[var(--pisjo-ocean)] shadow-sm">
                      <Truck className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-[var(--pisjo-text-secondary)]">
                        Nomor Resi
                      </p>

                      <p className="mt-1 break-all text-sm font-bold text-[var(--pisjo-navy)]">
                        {order.trackingNumber}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${shippingStatus.className}`}
                      >
                        {shippingStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <PrintInternalShippingLabelButton
                      orderId={order.id}
                      trackingNumber={order.trackingNumber}
                    />
                  </div>
                </div>

                <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                  {shippingStatus.description}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 sm:p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--pisjo-ocean)] shadow-sm">
                    <Truck className="h-6 w-6" />
                  </div>

                  <p className="mt-3 text-sm font-bold text-[var(--pisjo-navy)]">
                    Belum ada pengiriman
                  </p>

                  <p className="mt-1 max-w-md text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                    Nomor resi dan informasi kurir akan muncul setelah
                    pengiriman dibuat.
                  </p>

                  {order.status === OrderStatus.PROCESSING ? (
                    <div className="mt-4">
                      <CreateInternalShipmentButton
                        orderId={order.id}
                        orderNumber={order.orderNumber}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RINGKASAN PEMBAYARAN */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <SectionHeader
            icon={Receipt}
            title="Ringkasan Pembayaran"
            description="Rincian biaya order"
          />

          <div className="p-4 sm:p-5">
            <div className="divide-y divide-slate-100">
              <InfoRow
                label="Subtotal"
                value={formatCurrency(order.subtotal)}
              />

              <InfoRow
                label="Biaya Pengiriman"
                value={formatCurrency(order.shippingCost)}
              />

              <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                <div>
                  <p className="text-sm font-bold text-[var(--pisjo-navy)]">
                    Total Pesanan
                  </p>
                </div>

                <p className="text-xl font-extrabold text-[var(--pisjo-ocean)]">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* TIMELINE */}
      <OrderTimeline
        createdAt={order.createdAt}
        paidAt={order.paidAt}
        completedAt={order.completedAt}
        deletedAt={order.deletedAt}
        status={order.status}
        paymentStatus={order.paymentStatus}
      />

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
