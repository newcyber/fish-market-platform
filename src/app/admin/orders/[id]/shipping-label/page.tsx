import { notFound, redirect } from "next/navigation";

import { ArrowLeft, CheckCircle2, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import OrderService from "@/services/order/order.service";
import PrintShippingLabelButton from "@/components/admin/orders/PrintShippingLabelButton";
import ShippingBarcode from "@/components/admin/orders/ShippingBarcode";

import settingsService from "@/services/settings/settings.service";

interface ShippingLabelPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value: unknown) {
  if (!value) return "-";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function maskPhone(value: unknown) {
  const phone = String(value ?? "").trim();

  if (!phone) return "-";
  if (phone.length <= 6) return phone;

  return `${phone.slice(0, 2)}••••••${phone.slice(-4)}`;
}

function readOptionalValue(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return undefined;
}

export default async function ShippingLabelPage({
  params,
}: ShippingLabelPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const order = await OrderService.getOrderById(id);

  if (!order) {
    notFound();
  }

  const settings = await settingsService.getSettings();
  const siteLogo = settings.siteLogo?.trim() || null;
  const storeName = settings.storeName?.trim() || "Pisjo Market";

  if (!order.trackingNumber) {
    redirect(`/admin/orders/${id}`);
  }

  const orderRecord = order as unknown as Record<string, unknown>;
  const addressRecord =
    (order.address as unknown as Record<string, unknown> | null) ?? {};

  const totalQuantity =
    order.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const shippingFee = readOptionalValue(orderRecord, [
    "shippingFee",
    "deliveryFee",
    "ongkir",
  ]);

  const deliveryDate = readOptionalValue(orderRecord, [
    "deliveryDate",
    "scheduledDeliveryDate",
    "shippingDate",
  ]);

  const deliveryTime = readOptionalValue(orderRecord, [
    "deliveryTime",
    "scheduledDeliveryTime",
    "shippingTime",
  ]);

  const distance = readOptionalValue(orderRecord, [
    "shippingDistanceKm",
    "distanceKm",
    "deliveryDistanceKm",
  ]);

  const paymentStatus = String(order.paymentStatus ?? "").toUpperCase();

  const paymentLabel =
    paymentStatus === "VERIFIED" || paymentStatus === "PAID"
      ? "LUNAS"
      : paymentStatus || "BELUM DITENTUKAN";

  const qrValue =
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}` + `/customer/orders/${order.id}`;

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pesanan
          </Link>

          <PrintShippingLabelButton />
        </div>

        <section className="shipping-label-wrapper overflow-hidden rounded-[18px] border-2 border-[#123568] bg-white shadow-xl print:rounded-none print:border-0 print:shadow-none">
          <div
            id="shipping-label"
            className="mx-auto w-full max-w-[930px] bg-white text-[#17202b]"
          >
            <header className="relative overflow-hidden border-b-[7px] border-[#18b9d8] px-6 pb-5 pt-5 md:px-7">
              <div className="absolute right-0 top-0 h-full w-[43%] -skew-x-[18deg] bg-[#e6f7fb]" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#123568] bg-white p-2">
                    {siteLogo ? (
                      <img
                        src={siteLogo}
                        alt={`${storeName} logo`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-center text-xs font-black leading-tight text-[#123568]">
                        PUSAT
                        <br />
                        IKAN
                        <br />
                        SEGAR
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-extrabold tracking-wide text-[#0870bb] md:text-lg">
                      PUSAT IKAN SEGAR JOGJA
                    </p>
                    <h1 className="mt-1 text-3xl font-black leading-none tracking-tight text-[#123568] md:text-5xl">
                      PENGIRIMAN PISJO
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold md:text-lg">
                      <span>No. Pesanan: {order.orderNumber}</span>
                      <span className="text-slate-500">Paket 1 dari 1</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-[#123568] px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-white md:px-8 md:text-sm">
                  Kirim Hari Ini
                </div>
              </div>
            </header>

            <section className="px-6 pb-5 pt-5 md:px-7">
              <div className="flex flex-col gap-5 border-b-2 border-dashed border-slate-800 pb-5 md:flex-row md:items-start md:gap-7">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-600">
                    Nomor Pengiriman
                  </p>

                  <p className="mt-2 break-all text-2xl font-black tracking-tight text-[#17202b] md:text-3xl">
                    {order.trackingNumber}
                  </p>

                  <div className="mt-4">
                    <ShippingBarcode value={order.trackingNumber} />
                  </div>
                </div>

                <div className="flex w-full shrink-0 flex-col items-center justify-center md:w-[150px]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`}
                    alt="QR code pesanan"
                    className="h-[132px] w-[132px] border border-slate-700 bg-white p-1 md:h-[145px] md:w-[145px]"
                  />
                  <p className="mt-2 text-center text-xs font-black uppercase tracking-wide text-[#123568]">
                    Pindai Pesanan
                  </p>
                </div>
              </div>

              <div className="grid border-b border-slate-300 py-5 md:grid-cols-[1fr_1fr] md:gap-8">
                <div className="border-b border-slate-200 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-wide text-[#0870bb]">
                      Pengirim
                    </p>
                    <span className="text-sm font-black uppercase text-[#0870bb]">
                      Internal
                    </span>
                  </div>

                  <p className="mt-3 text-xl font-black text-[#123568]">
                    Pusat Ikan Segar Jogja
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Pisjo Market
                    <br />
                    Pengiriman menggunakan kurir internal.
                  </p>
                </div>

                <div className="pt-5 md:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-wide text-[#0870bb]">
                      Penerima
                    </p>
                    <span className="text-sm font-black uppercase text-[#0870bb]">
                      Rumah
                    </span>
                  </div>

                  <p className="mt-3 text-2xl font-black text-[#123568]">
                    {order.user?.name ?? "Customer"}
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-base font-bold">
                    <Phone className="h-4 w-4 shrink-0 text-[#0870bb]" />
                    {maskPhone(order.address?.receiverPhone)}
                  </p>

                  <p className="mt-2 flex items-start gap-2 text-base font-bold leading-6">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#0870bb]" />
                    <span>
                      {order.address?.fullAddress}
                      <br />
                      {[
                        order.address?.village,
                        order.address?.district,
                        order.address?.city,
                        order.address?.province,
                        order.address?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>

                  {readOptionalValue(addressRecord, [
                    "notes",
                    "landmark",
                    "patokan",
                  ]) && (
                    <p className="mt-2 text-sm text-slate-600">
                      Patokan:{" "}
                      {String(
                        readOptionalValue(addressRecord, [
                          "notes",
                          "landmark",
                          "patokan",
                        ]),
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid border-b border-slate-300 md:grid-cols-3">
                <div className="border-b border-slate-300 px-0 py-4 md:border-b-0 md:border-r md:px-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Jadwal Kirim
                  </p>
                  <p className="mt-3 text-xl font-black">
                    {formatDate(deliveryDate)}
                  </p>
                  <p className="text-lg font-black">
                    {String(deliveryTime ?? "Menyesuaikan")}
                  </p>
                </div>

                <div className="border-b border-slate-300 px-0 py-4 md:border-b-0 md:border-r md:px-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Jarak & Ongkir
                  </p>
                  <p className="mt-3 text-xl font-black">
                    {distance !== undefined ? `${distance} km` : "-"}
                  </p>
                  <p className="text-lg font-black">
                    {formatCurrency(shippingFee)}
                  </p>
                </div>

                <div className="px-0 py-4 md:px-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Pembayaran
                  </p>
                  <p className="mt-3 text-xl font-black text-[#238653]">
                    {paymentLabel}
                  </p>
                  <p className="text-lg font-black text-[#238653]">
                    {String(
                      readOptionalValue(orderRecord, [
                        "paymentMethod",
                        "paymentChannel",
                      ]) ?? "",
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="grid grid-cols-[54px_1fr_145px_55px] gap-3 bg-[#123568] px-6 py-3 text-xs font-black uppercase tracking-wide text-white md:grid-cols-[54px_1fr_165px_65px] md:px-7">
                <span>No</span>
                <span>Produk & Proses</span>
                <span className="text-right">Berat</span>
                <span className="text-right">Qty</span>
              </div>

              <div className="px-6 md:px-7">
                {order.items?.map((item, index) => {
                  const productName =
                    item.product?.name ?? item.productName ?? "Produk";

                  const variant = item.productVariant;
                  const weight = item.productWeight;
                  const customerNote = item.customerNote;

                  return (
                    <div
                      key={item.id ?? index}
                      className="grid grid-cols-[54px_1fr_145px_55px] gap-3 border-b border-slate-300 py-4 md:grid-cols-[54px_1fr_165px_65px]"
                    >
                      <div>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf7fb] text-sm font-black text-[#123568]">
                          {index + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-base font-black md:text-lg">
                          {productName}
                        </p>

                        {variant && (
                          <p className="text-sm font-semibold text-slate-600">
                            {variant}
                          </p>
                        )}

                        <p className="text-sm font-bold text-slate-500">
                          {customerNote || "Dibersihkan"}
                        </p>
                      </div>

                      <div className="text-right text-sm font-black md:text-base">
                        {weight || "-"}
                      </div>

                      <div className="text-right text-base font-black">
                        {item.quantity}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="px-6 pt-4 md:px-7">
              {order.items?.some((item) => item.customerNote) && (
                <div className="overflow-hidden rounded-lg border-2 border-[#18b9d8] bg-[#eaf7fb]">
                  <div className="grid md:grid-cols-[165px_1fr]">
                    <div className="bg-[#d9f2f8] px-3 py-3 text-xs font-black uppercase text-[#123568]">
                      Catatan Pesanan
                    </div>
                    <div className="px-4 py-3 text-base font-black">
                      {order.items
                        .map((item) => item.customerNote)
                        .filter(Boolean)
                        .join("; ")}
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-4 text-sm font-semibold leading-5 text-slate-600">
                Berat tercantum adalah berat saat produk utuh. Setelah
                dibersihkan, berat bersih produk dapat berkurang.
              </p>

              <div className="mt-5 grid gap-5 border-t border-slate-300 py-5 md:grid-cols-[1fr_1fr]">
                <div>
                  <p className="text-lg font-black uppercase text-[#123568]">
                    Produk Rantai Dingin
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Segera simpan dalam chiller atau freezer setelah pesanan
                    diterima.
                  </p>
                </div>

                <div className="border-t border-slate-300 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <p className="text-xs font-black uppercase text-slate-500">
                    Bantuan Pelanggan
                  </p>
                  <p className="mt-3 text-lg font-black uppercase text-[#123568]">
                    Pisjo Customer Care
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#0870bb]">
                    www.pusatikansegar.com
                  </p>
                </div>
              </div>
            </section>

            <footer className="bg-[#123568] px-6 py-5 text-center text-white md:px-7">
              <div className="flex items-center justify-center gap-2 text-xl font-black uppercase">
                <CheckCircle2 className="h-5 w-5" />
                Pesanan Lengkap • Siap Dikirim
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#d9f2f8]">
                Tanpa Pengawet • Diproses Higienis • Kualitas Terjaga
              </p>
            </footer>
          </div>
        </section>
      </div>

      <style>{`
  @page {
    size: A4 portrait;
    margin: 4mm;
  }

  @media print {
    html,
    body {
      width: 100%;
      height: auto;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    body {
      overflow: visible !important;
    }

    .shipping-label-wrapper {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    #shipping-label {
      /*
       * Compact print layout.
       * Zoom Chrome membantu menjaga seluruh resi
       * tetap berada dalam satu halaman A4.
       */
      width: 128% !important;
      max-width: none !important;
      margin: 0 !important;
      zoom: 0.78;

      page-break-before: avoid !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-before: avoid-page !important;
      break-after: avoid-page !important;
      break-inside: avoid-page !important;
    }

    #shipping-label header {
      padding-top: 12px !important;
      padding-bottom: 12px !important;
    }

    #shipping-label section {
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
    }

    #shipping-label footer {
      page-break-before: avoid !important;
      page-break-inside: avoid !important;
      break-before: avoid-page !important;
      break-inside: avoid-page !important;
    }

    #shipping-label img {
      max-width: 100%;
    }

    #shipping-label .py-5 {
      padding-top: 10px !important;
      padding-bottom: 10px !important;
    }

    #shipping-label .py-4 {
      padding-top: 8px !important;
      padding-bottom: 8px !important;
    }

    #shipping-label .mt-5 {
      margin-top: 10px !important;
    }

    #shipping-label .mt-4 {
      margin-top: 8px !important;
    }

    #shipping-label .mt-3 {
      margin-top: 6px !important;
    }

    #shipping-label .mt-2 {
      margin-top: 4px !important;
    }

    #shipping-label .text-5xl {
      font-size: 34px !important;
      line-height: 1 !important;
    }

    #shipping-label .text-3xl {
      font-size: 24px !important;
      line-height: 1.1 !important;
    }

    #shipping-label .text-2xl {
      font-size: 19px !important;
      line-height: 1.2 !important;
    }

    #shipping-label .text-xl {
      font-size: 16px !important;
      line-height: 1.2 !important;
    }

    #shipping-label .text-lg {
      font-size: 14px !important;
      line-height: 1.25 !important;
    }

    #shipping-label .text-base {
      font-size: 12px !important;
      line-height: 1.3 !important;
    }

    #shipping-label .text-sm {
      font-size: 10px !important;
      line-height: 1.35 !important;
    }

    #shipping-label .text-xs {
      font-size: 9px !important;
      line-height: 1.3 !important;
    }

    #shipping-label .h-\\[104px\\],
    #shipping-label .w-\\[104px\\] {
      width: 72px !important;
      height: 72px !important;
    }

    #shipping-label .h-\\[132px\\],
    #shipping-label .w-\\[132px\\] {
      width: 92px !important;
      height: 92px !important;
    }

    #shipping-label .md\\:h-\\[145px\\],
    #shipping-label .md\\:w-\\[145px\\] {
      width: 92px !important;
      height: 92px !important;
    }

    #shipping-label .grid {
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
    }

    #shipping-label > section {
      page-break-inside: avoid !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`}</style>
    </main>
  );
}
