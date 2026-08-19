import Link from "next/link";

import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  User,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

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

export const dynamic =
  "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatCurrency(
  value: unknown
) {
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

  return `Rp ${amount.toLocaleString(
    "id-ID"
  )}`;
}

function formatDate(
  value: Date | null
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "long",
      timeStyle: "short",
    }
  ).format(value);
}

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

function getPaymentStatusLabel(
  status: PaymentStatus
) {
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

function getOrderStatusClass(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "bg-green-100 text-green-700";

    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-700";

    case OrderStatus.SHIPPING:
      return "bg-blue-100 text-blue-700";

    case OrderStatus.PROCESSING:
      return "bg-purple-100 text-purple-700";

    case OrderStatus.WAITING_PAYMENT:
    case OrderStatus.WAITING_VERIFICATION:
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPaymentStatusClass(
  status: PaymentStatus
) {
  switch (status) {
    case PaymentStatus.VERIFIED:
      return "bg-green-100 text-green-700";

    case PaymentStatus.REJECTED:
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function getAddressEntries(
  address: unknown
) {
  if (
    !address ||
    typeof address !== "object"
  ) {
    return [];
  }

  return Object.entries(address).filter(
    ([key, value]) => {
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
        typeof value ===
          "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      );
    }
  );
}

function formatAddressKey(
  key: string
) {
  const labels: Record<
    string,
    string
  > = {
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
      .replace(
        /([A-Z])/g,
        " $1"
      )
      .replace(/^./, (value) =>
        value.toUpperCase()
      )
  );
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  let order;

  try {
    order =
      await OrderService.getOrderById(
        id
      );
  } catch {
    notFound();
  }

  if (!order) {
    notFound();
  }

  const addressEntries =
    getAddressEntries(
      order.address
    );

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Order
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">
              {order.orderNumber}
            </h1>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusClass(
                order.status
              )}`}
            >
              {getOrderStatusLabel(
                order.status
              )}
            </span>
          </div>

          <p className="mt-1 text-muted-foreground">
            Dibuat pada{" "}
            {formatDate(
              order.createdAt
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
    className="
      inline-flex
      items-center
      justify-center
      rounded-md
      border
      px-4
      py-2
      text-sm
      font-medium
      hover:bg-muted
    "
  >
    Edit Order
  </Link>

  <DeleteOrderButton
    id={order.id}
    orderNumber={order.orderNumber}
  />
</div>
      </div>

      {/* ================================================== */}
      {/* CUSTOMER + PAYMENT */}
      {/* ================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CUSTOMER */}

        <section className="rounded-xl border bg-background">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="rounded-lg bg-muted p-2">
              <User className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Customer
              </h2>

              <p className="text-sm text-muted-foreground">
                Informasi customer
              </p>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <p className="text-xs text-muted-foreground">
                Nama
              </p>

              <p className="mt-1 font-medium">
                {order.user.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Email
              </p>

              <p className="mt-1">
                {order.user.email}
              </p>
            </div>

            {order.user.phone && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Telepon
                </p>

                <p className="mt-1">
                  {order.user.phone}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PAYMENT */}

        <section className="rounded-xl border bg-background">
          <div className="flex items-center gap-3 border-b px-6 py-4">
            <div className="rounded-lg bg-muted p-2">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Pembayaran
              </h2>

              <p className="text-sm text-muted-foreground">
                Informasi pembayaran order
              </p>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Metode
              </span>

              <span className="font-medium">
                {String(
                  order.paymentMethod
                ).replace(
                  /_/g,
                  " "
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Status
              </span>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClass(
                  order.paymentStatus
                )}`}
              >
                {getPaymentStatusLabel(
                  order.paymentStatus
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Dibayar
              </span>

              <span className="font-medium">
                {formatDate(
                  order.paidAt
                )}
              </span>
            </div>

<div className="border-t pt-4">
  <PaymentVerification
    orderId={order.id}
    paymentStatus={
      order.paymentStatus
    }
    orderStatus={
      order.status
    }
    hasPaymentProof={
      Boolean(
        order.paymentProof
      )
    }
  />
</div>

            {order.paymentProof && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  Bukti pembayaran tersedia
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Bukti pembayaran sudah
                  terhubung dengan order ini.
                </p>
              </div>
            )}
            
          </div>
        </section>
      </div>

      {/* ORDER TIMELINE */}
<OrderTimeline
  createdAt={order.createdAt}
  paidAt={order.paidAt}
  completedAt={order.completedAt}
  deletedAt={order.deletedAt}
  status={order.status}
  paymentStatus={order.paymentStatus}
/>

<OrderStatusControl
  orderId={order.id}
  status={order.status}
  paymentStatus={
    order.paymentStatus
  }
/>

{/* ============================================================
    INTERNAL SHIPMENT
============================================================ */}

{order.trackingNumber && (
  <div className="rounded-xl border bg-card shadow-sm">
    <div className="border-b p-5">
      <h2 className="font-semibold">
        Informasi Pengiriman
      </h2>
    </div>

    <div className="space-y-5 p-5">
      <div>
        <p className="text-xs text-muted-foreground">
          Kurir
        </p>

        <p className="mt-1 font-medium">
          {order.shippingProvider === "INTERNAL"
            ? "Kurir Internal"
            : order.shippingProvider}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          Layanan
        </p>

        <p className="mt-1 font-medium">
          {order.shippingService ??
            "Pengiriman Internal Pisjo Market"}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          Nomor Resi
        </p>

        <div className="mt-1 rounded-lg bg-muted px-3 py-2 font-mono text-sm font-semibold">
          {order.trackingNumber}
        </div>
      </div>

      {order.shippedAt && (
        <div>
          <p className="text-xs text-muted-foreground">
            Tanggal Pengiriman
          </p>

          <p className="mt-1 font-medium">
            {new Intl.DateTimeFormat(
              "id-ID",
              {
                dateStyle: "long",
                timeStyle: "short",
              }
            ).format(
              new Date(order.shippedAt)
            )}
          </p>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground">
          Status Pengiriman
        </p>

        <div className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Sedang Dikirim
        </div>
      </div>
    </div>
  </div>
)}

      {/* ================================================== */}
      {/* ADDRESS */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="rounded-lg bg-muted p-2">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Alamat Pengiriman
            </h2>

            <p className="text-sm text-muted-foreground">
              Alamat yang digunakan untuk order
            </p>
          </div>
        </div>

        <div className="p-6">
          {addressEntries.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {addressEntries.map(
                ([key, value]) => (
                  <div
                    key={key}
                    className={
                      key === "address" ||
                      key === "notes"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatAddressKey(
                        key
                      )}
                    </p>

                    <div className="mt-1 whitespace-pre-line font-medium">
  {typeof value === "boolean" ? (
    value ? (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        ✓ Alamat Utama
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        Bukan Alamat Utama
      </span>
    )
  ) : (
    String(value)
  )}
</div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Informasi alamat tidak tersedia.
            </p>
          )}
        </div>
      </section>

      {/* ================================================== */}
      {/* ORDER ITEMS */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <div className="rounded-lg bg-muted p-2">
            <Package className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Produk
            </h2>

            <p className="text-sm text-muted-foreground">
              Daftar produk dalam order
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-4 text-left font-medium">
                  Produk
                </th>

                <th className="px-6 py-4 text-right font-medium">
                  Harga
                </th>

                <th className="px-6 py-4 text-right font-medium">
                  Qty
                </th>

                <th className="px-6 py-4 text-right font-medium">
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody>
              {order.items.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4">
  {/* ================================================ */}
  {/* PRODUCT NAME */}
  {/* ================================================ */}

  <div className="font-medium">
    {item.productName}
  </div>

  {/* ================================================ */}
  {/* SKU */}
  {/* ================================================ */}

  {item.product && (
    <div className="mt-1 text-xs text-muted-foreground">
      SKU:{" "}
      {item.product.sku ??
        "-"}
    </div>
  )}

  {/* ================================================ */}
  {/* PRODUCT VARIANT */}
  {/* ================================================ */}

  {item.productVariant && (
    <div className="mt-2">
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Varian: {item.productVariant}
      </span>
    </div>
  )}

  {/* ================================================ */}
  {/* PRODUCT WEIGHT */}
  {/* ================================================ */}

  {item.productWeight && (
    <div className="mt-2">
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Berat: {item.productWeight}
      </span>
    </div>
  )}

  {/* ================================================ */}
  {/* CUSTOMER PURCHASE NOTE */}
  {/* ================================================ */}

  {typeof item.customerNote === "string" &&
    item.customerNote.trim() !== "" && (
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs font-semibold text-blue-700">
          📝 Catatan Pembelian Customer
        </p>

        <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm text-blue-950">
          {item.customerNote.trim()}
        </p>
      </div>
    )}
</td>

                    <td className="px-6 py-4 text-right">
                      {formatCurrency(
                        item.price
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {item.quantity}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(
                        item.subtotal
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================================================== */}
      {/* TOTAL */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="ml-auto w-full max-w-md space-y-3 p-6">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Subtotal
            </span>

            <span>
              {formatCurrency(
                order.subtotal
              )}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Biaya Pengiriman
            </span>

            <span>
              {formatCurrency(
                order.shippingCost
              )}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between gap-4">
              <span className="text-base font-semibold">
                Total
              </span>

              <span className="text-xl font-bold">
                {formatCurrency(
                  order.total
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* NOTES */}
      {/* ================================================== */}

      {order.notes && (
        <section className="rounded-xl border bg-background">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold">
              Catatan Order
            </h2>
          </div>

          <div className="whitespace-pre-line p-6 text-sm">
            {order.notes}
          </div>
        </section>
      )}

    
    </div>
  );
}