import {
  notFound,
  redirect,
} from "next/navigation";

import { ArrowLeft } from "lucide-react";

import Link from "next/link";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

import PrintShippingLabelButton from "@/components/admin/orders/PrintShippingLabelButton";

import ShippingBarcode from "@/components/admin/orders/ShippingBarcode";

/**
 * ============================================================
 * SHIPPING LABEL PAGE
 * ============================================================
 *
 * Halaman cetak resi / label pengiriman
 * untuk Kurir Internal.
 *
 * ============================================================
 */

interface ShippingLabelPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */


/**
 * ============================================================
 * PAGE
 * ============================================================
 */

export default async function ShippingLabelPage({
  params,
}: ShippingLabelPageProps) {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session =
    await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * PARAMS
   * ==========================================================
   */

  const { id } =
    await params;

  /**
   * ==========================================================
   * GET ORDER
   * ==========================================================
   */

  const order =
  await OrderService.getOrderById(
    id
  );

if (!order) {
  notFound();
}

  /**
   * ==========================================================
   * VALIDATE TRACKING NUMBER
   * ==========================================================
   */

  if (!order.trackingNumber) {
    redirect(
      `/admin/orders/${id}`
    );
  }

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">

        {/* ================================================== */}
        {/* ACTION BAR */}
        {/* ================================================== */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/admin/orders/${order.id}`}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
            "
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Pesanan
          </Link>

          <PrintShippingLabelButton />
        </div>

        {/* ================================================== */}
        {/* SHIPPING LABEL */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-lg print:rounded-none print:border print:shadow-none">

          
<div
  id="shipping-label"
  className="mx-auto w-full max-w-205 bg-white p-8 text-black"
>
  {/* ===================================================== */}
  {/* HEADER */}
  {/* ===================================================== */}

  <div className="flex items-start justify-between border-b-2 border-black pb-5">
    <div>
      <h1 className="text-3xl font-black tracking-tight">
        PISJO MARKET
      </h1>

      <p className="mt-1 text-sm">
        FRESH SEAFOOD DELIVERY
      </p>
    </div>

    <div className="text-right">
      <p className="text-xs font-semibold uppercase">
        Pengiriman Internal
      </p>

      <p className="mt-2 text-lg font-black">
        PISJO DELIVERY - KURIR INTERNAL
      </p>
    </div>
  </div>

  {/* ===================================================== */}
  {/* TRACKING */}
  {/* ===================================================== */}

  <div className="border-b-2 border-black py-6">
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider">
      Nomor Resi
    </p>

    <ShippingBarcode
      value={order.trackingNumber}
    />
  </div>

  {/* ===================================================== */}
  {/* SHIPPING INFORMATION */}
  {/* ===================================================== */}

  <div className="grid grid-cols-1 gap-8 border-b-2 border-black py-6 md:grid-cols-2">
    {/* PENGIRIM */}

    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider">
        Dari
      </p>

      <p className="text-lg font-black">
        Pijso Market
      </p>

      <p className="mt-2 text-sm leading-6">
        Fresh Seafood Market
      </p>

      <p className="text-sm leading-6">
        Pengiriman menggunakan Kurir Internal.
      </p>
    </div>

    {/* PENERIMA */}

    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider">
        Kepada
      </p>

      <p className="text-xl font-black">
        {order.user?.name ?? "Customer"}
      </p>

      <p className="mt-2 text-sm leading-6">
        {order.address?.receiverPhone}
      </p>

      <p className="mt-2 text-sm leading-6">
        {order.address?.fullAddress}
      </p>

      <p className="text-sm leading-6">
        {[
          order.address?.village,
          order.address?.district,
          order.address?.city,
          order.address?.province,
          order.address?.postalCode,
        ]
          .filter(Boolean)
          .join(", ")}
      </p>
    </div>
  </div>

  {/* ===================================================== */}
{/* ORDER INFORMATION */}
{/* ===================================================== */}

<div className="border-b-2 border-black py-6">
  <div className="grid grid-cols-2 gap-4">
    {/* NOMOR PESANAN */}

    <div>
      <p className="text-xs font-semibold uppercase">
        Nomor Pesanan
      </p>

      <p className="mt-2 font-mono text-sm font-bold">
        {order.orderNumber}
      </p>
    </div>

    {/* TOTAL PRODUK */}

    <div>
      <p className="text-xs font-semibold uppercase">
        Total Produk
      </p>

      <p className="mt-2 text-lg font-black">
        {order.items?.reduce(
          (total, item) => total + item.quantity,
          0
        ) ?? 0}{" "}
        Item
      </p>
    </div>
  </div>

  {/* ===================================================== */}
{/* DETAIL ISI PAKET */}
{/* ===================================================== */}

<div className="mt-6 border-t border-black pt-5">
  <p className="mb-4 text-xs font-bold uppercase tracking-wider">
    Detail Isi Paket
  </p>

  <div className="space-y-4">
    {order.items?.map((item, index) => {
      const productName =
        item.product?.name ??
        item.productName ??
        "Produk";

      const variant =
        item.productVariant;

      const weight =
        item.productWeight;

      const customerNote =
        item.customerNote;

      return (
        <div
          key={item.id ?? index}
          className="border-b border-dashed border-black pb-4 last:border-b-0"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-black">
                {index + 1}. {productName}
              </p>

              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {variant && (
                  <p>
                    <span className="font-semibold">
                      Varian:
                    </span>{" "}
                    {variant}
                  </p>
                )}

                {weight && (
                  <p>
                    <span className="font-semibold">
                      Berat:
                    </span>{" "}
                    {weight}
                  </p>
                )}

                {customerNote && (
                  <p className="mt-2">
                    <span className="font-semibold">
                      Catatan:
                    </span>{" "}
                    {customerNote}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Jumlah
              </p>

              <p className="mt-1 text-lg font-black">
                × {item.quantity}
              </p>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>
</div>

  {/* ===================================================== */}
  {/* FOOTER */}
  {/* ===================================================== */}

  <div className="pt-6 text-center">
    <p className="text-xs font-semibold">
      Pastikan paket dan alamat penerima sesuai sebelum pengiriman.
    </p>

    <p className="mt-2 text-[10px] text-gray-500">
      Generated by Pisjo Market Internal Shipping System
    </p>
  </div>
</div>

        </section>
      </div>
    </main>
  );
}