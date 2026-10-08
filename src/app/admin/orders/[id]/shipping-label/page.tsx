import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import PrintShippingLabelButton from "@/components/admin/orders/PrintShippingLabelButton";
import ShippingBarcode from "@/components/admin/orders/ShippingBarcode";
import OrderService from "@/services/order/order.service";
import settingsService from "@/services/settings/settings.service";

interface ShippingLabelPageProps {
  params: Promise<{
    id: string;
  }>;
}

function readOptionalValue(source: unknown, keys: string[]) {
  if (!source || typeof source !== "object") return undefined;

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return undefined;
}

function formatDate(value: unknown) {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function dateKey(value: unknown) {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function humanize(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  return raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizePaymentMethod(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (!normalized) return "";
  if (normalized.includes("QRIS")) return "QRIS";
  if (normalized.includes("TRANSFER")) return "TRANSFER BANK";
  if (normalized.includes("CASH")) return "TUNAI";
  if (normalized.includes("COD")) return "COD";

  return humanize(normalized).toUpperCase();
}

function formatPhone(value: unknown) {
  const phone = String(value ?? "").trim();
  return phone || "-";
}

function getAddressLabel(value: unknown) {
  const label = humanize(value);
  return label || "Rumah";
}

function buildAddressExtraLine(addressRecord: Record<string, unknown>) {
  const fullAddress = String(
    readOptionalValue(addressRecord, ["fullAddress", "address"]) ?? "",
  )
    .trim()
    .toLowerCase();

  const candidates = [
    readOptionalValue(addressRecord, ["village", "kelurahan"]),
    readOptionalValue(addressRecord, ["district", "kecamatan"]),
    readOptionalValue(addressRecord, ["city", "regency", "kabupaten"]),
    readOptionalValue(addressRecord, ["province", "provinsi"]),
    readOptionalValue(addressRecord, ["postalCode", "zipCode", "kodePos"]),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const unique = candidates.filter((value, index, array) => {
    const normalized = value.toLowerCase();

    if (fullAddress.includes(normalized)) return false;

    return (
      array.findIndex(
        (candidate) => candidate.toLowerCase() === normalized,
      ) === index
    );
  });

  return unique.join(", ");
}

function getItemDisplay(item: unknown) {
  const record = (item ?? {}) as Record<string, unknown>;

  const rawVariant = String(
    readOptionalValue(record, [
      "productVariant",
      "variant",
      "selectedVariant",
    ]) ?? "",
  ).trim();

  let weight = String(
    readOptionalValue(record, [
      "productWeight",
      "weight",
      "selectedWeight",
    ]) ?? "",
  ).trim();

  let condition = String(
    readOptionalValue(record, [
      "productCondition",
      "condition",
      "selectedCondition",
      "processing",
      "process",
      "cleaningOption",
    ]) ?? "",
  ).trim();

  const variantParts = rawVariant
    .split(/[|,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const conditionWords = [
    "utuh",
    "dibersihkan",
    "bersihkan",
    "cleaned",
    "whole",
  ];

  const weightPattern =
    /^\s*\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:g|gr|gram|kg)\s*$/i;

  const remainingParts: string[] = [];

  for (const part of variantParts) {
    const lowered = part.toLowerCase();

    if (
      !condition &&
      conditionWords.some(
        (word) => lowered === word || lowered.includes(word),
      )
    ) {
      condition =
        lowered.includes("dibersih") ||
        lowered.includes("bersih") ||
        lowered.includes("cleaned")
          ? "Dibersihkan"
          : "Utuh";
      continue;
    }

    if (!weight && weightPattern.test(part)) {
      weight = part;
      continue;
    }

    remainingParts.push(part);
  }

  if (condition) {
    const lowered = condition.toLowerCase();

    if (
      lowered.includes("dibersih") ||
      lowered.includes("bersih") ||
      lowered.includes("cleaned")
    ) {
      condition = "Dibersihkan";
    } else if (lowered.includes("utuh") || lowered.includes("whole")) {
      condition = "Utuh";
    } else {
      condition = humanize(condition);
    }
  }

  return {
    variant: remainingParts.join(" | "),
    weight,
    condition,
  };
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
  const storeName = settings.storeName?.trim() || "PISJO Market";

  const orderRecord = order as unknown as Record<string, unknown>;
  const addressRecord =
    (order.address as unknown as Record<string, unknown> | null) ?? {};

  // Provider adalah sumber kebenaran utama.
  // Jangan mengambil shippingService lebih dulu karena order PICKUP lama
  // dapat masih memiliki shippingService internal.
  const providerRaw = String(
    readOptionalValue(orderRecord, ["shippingProvider"]) ?? "",
  )
    .trim()
    .toUpperCase();

  const methodFallbackRaw = String(
    readOptionalValue(orderRecord, [
      "shippingMethod",
      "deliveryMethod",
      "fulfillmentMethod",
      "shippingService",
    ]) ?? "",
  )
    .trim()
    .toUpperCase();

  const isPickup =
    providerRaw === "PICKUP" ||
    methodFallbackRaw.includes("PICKUP") ||
    methodFallbackRaw.includes("PICK UP") ||
    methodFallbackRaw.includes("AMBIL") ||
    methodFallbackRaw.includes("SELF_PICKUP") ||
    methodFallbackRaw.includes("SELF PICKUP");

  const trackingNumber = String(order.trackingNumber ?? "").trim();

  // Kurir internal membutuhkan nomor resi.
  // Ambil di tempat tetap boleh mencetak label walaupun tanpa nomor resi.
  if (!isPickup && !trackingNumber) {
    redirect(`/admin/orders/${id}`);
  }

  const deliveryDate = readOptionalValue(orderRecord, [
    "deliveryDate",
    "scheduledDeliveryDate",
    "shippingDate",
    "shippedAt",
  ]);

  const showShipToday =
    Boolean(deliveryDate) && dateKey(deliveryDate) === todayKey();

  const paymentStatus = String(order.paymentStatus ?? "").toUpperCase();

  const paymentLabel =
    paymentStatus === "VERIFIED" || paymentStatus === "PAID"
      ? "LUNAS"
      : paymentStatus === "PENDING"
        ? "MENUNGGU"
        : paymentStatus || "BELUM DITENTUKAN";

  const paymentMethod = normalizePaymentMethod(
    readOptionalValue(orderRecord, [
      "paymentMethod",
      "paymentChannel",
      "paymentType",
    ]),
  );

  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(
    /\/$/,
    "",
  );

  // QR internal: langsung menuju detail order admin.
  // Jika nanti tersedia public secure tracking token, URL ini bisa diganti
  // tanpa mengubah layout label.
  const qrValue = `${appUrl}/admin/orders/${order.id}`;

  const receiverName = String(
    readOptionalValue(addressRecord, [
      "receiverName",
      "recipientName",
      "name",
    ]) ??
      order.user?.name ??
      "Pelanggan",
  );

  const receiverPhone = formatPhone(
    readOptionalValue(addressRecord, [
      "receiverPhone",
      "phone",
      "whatsapp",
    ]) ?? order.user?.phone,
  );

  const fullAddress = String(
    readOptionalValue(addressRecord, [
      "fullAddress",
      "address",
      "streetAddress",
    ]) ?? "",
  ).trim();

  const extraAddressLine = buildAddressExtraLine(addressRecord);

  const landmark = String(
    readOptionalValue(addressRecord, [
      "notes",
      "landmark",
      "patokan",
    ]) ?? "",
  ).trim();

  const addressLabel = getAddressLabel(
    readOptionalValue(addressRecord, ["label", "addressLabel"]),
  );

  const packageCountRaw = Number(
    readOptionalValue(orderRecord, [
      "totalPackages",
      "packageCount",
      "shipmentPackageCount",
    ]) ?? 1,
  );

  const packageCount =
    Number.isFinite(packageCountRaw) && packageCountRaw > 1
      ? Math.floor(packageCountRaw)
      : 1;

  const allNotes = [
    ...((order.items ?? [])
      .map((item) => String(item.customerNote ?? "").trim())
      .filter(Boolean)),
    String(readOptionalValue(orderRecord, ["notes", "orderNotes"]) ?? "").trim(),
  ].filter(Boolean);

  const uniqueNotes = Array.from(new Set(allNotes));

  const itemCount = order.items?.length ?? 0;
  const densityClass =
    itemCount >= 7
      ? "label-ultra-dense"
      : itemCount >= 4
        ? "label-dense"
        : "";

  const shippingLabel = isPickup ? "AMBIL DI TEMPAT" : "KURIR INTERNAL";
  // Pickup tidak menggunakan nomor resi, termasuk jika data lama masih
  // memiliki trackingNumber internal.
  const referenceNumber = isPickup
    ? String(order.orderNumber ?? order.id)
    : trackingNumber || String(order.orderNumber ?? order.id);

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <div className="mb-5 flex w-full max-w-[100mm] items-center justify-between gap-3 print:hidden">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          <PrintShippingLabelButton />
        </div>

        <section className="shipping-label-wrapper overflow-hidden rounded-[4mm] border border-[#123568] bg-white shadow-xl print:rounded-none print:border-0 print:shadow-none">
          <div
            id="shipping-label"
            className={`relative h-[150mm] w-[100mm] overflow-hidden bg-white text-[#17202b] ${densityClass}`}
          >
            {/* HEADER */}
            <header className="label-header relative border-b-[1.2mm] border-[#18b9d8] px-[4mm] pb-[2.8mm] pt-[3.3mm]">
              <div className="absolute right-0 top-0 h-full w-[38%] -skew-x-[18deg] bg-[#e6f7fb]" />

              <div className="relative z-10 flex items-start justify-between gap-[2.5mm]">
                <div className="flex min-w-0 items-center gap-[2.6mm]">
                  <div className="flex h-[15mm] w-[15mm] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#123568] bg-white p-[1mm]">
                    {siteLogo ? (
                      <img
                        src={siteLogo}
                        alt={`${storeName} logo`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-[6pt] font-black leading-tight text-[#123568]">
                        PUSAT
                        <br />
                        IKAN
                        <br />
                        SEGAR
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[6.5pt] font-extrabold tracking-[0.08em] text-[#0870bb]">
                      PUSAT IKAN SEGAR JOGJA
                    </p>

                    <h1 className="mt-[0.5mm] whitespace-nowrap text-[17pt] font-black leading-none tracking-tight text-[#123568]">
                      RESI <span className="text-[#0870bb]">PISJO</span>
                    </h1>

                    <p className="mt-[1.3mm] truncate text-[6.7pt] font-bold text-slate-700">
                      No. Pesanan: {order.orderNumber}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-[1.3mm]">
                  <span className="rounded-[2mm] bg-[#123568] px-[2.4mm] py-[1.4mm] text-center text-[6pt] font-black uppercase tracking-wide text-white">
                    {shippingLabel}
                  </span>

                  {showShipToday ? (
                    <span className="rounded-[2mm] bg-[#e32636] px-[2.4mm] py-[1.1mm] text-center text-[5.7pt] font-black uppercase tracking-wide text-white">
                      KIRIM HARI INI
                    </span>
                  ) : null}
                </div>
              </div>
            </header>

            {/* RESI + BARCODE + QR */}
            <section className="label-tracking px-[4mm] py-[2.5mm]">
              <div className="grid grid-cols-[1fr_22mm] gap-[2.6mm] border-b border-dashed border-slate-500 pb-[2.4mm]">
                <div className="min-w-0">
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[5.8pt] font-black uppercase tracking-wide text-slate-500">
                        {isPickup ? "Kode Pesanan" : "No. Resi"}
                      </p>
                      <p className="mt-[0.6mm] truncate text-[10.5pt] font-black leading-tight text-[#17202b]">
                        {referenceNumber}
                      </p>
                    </div>
                  </div>

                  {!isPickup && trackingNumber ? (
                    <div className="barcode-wrap mt-[1.5mm] h-[12mm] overflow-hidden">
                      <ShippingBarcode value={trackingNumber} />
                    </div>
                  ) : (
                    <div className="mt-[2mm] rounded border border-dashed border-slate-300 bg-slate-50 px-[2mm] py-[2mm] text-[6pt] font-bold text-slate-500">
                      Ambil pesanan menggunakan No. Pesanan di atas.
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-start">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`}
                    alt="QR detail pesanan"
                    className="h-[20mm] w-[20mm] border border-slate-600 bg-white p-[0.7mm]"
                  />
                  <p className="mt-[0.7mm] text-center text-[5pt] font-black uppercase tracking-wide text-[#123568]">
                    Detail Pesanan
                  </p>
                </div>
              </div>
            </section>

            {/* PENERIMA */}
            <section className="label-recipient px-[4mm] pb-[2.5mm]">
              <div className="rounded-[2.4mm] bg-[#f4f9fc] px-[3mm] py-[2.3mm]">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-[1.5mm] text-[6pt] font-black uppercase tracking-wide text-[#0870bb]">
                    <MapPin className="h-[3.5mm] w-[3.5mm]" />
                    Penerima
                  </p>

                  {!isPickup ? (
                    <span className="rounded bg-[#dceffc] px-[1.7mm] py-[0.8mm] text-[5.5pt] font-black uppercase text-[#123568]">
                      {addressLabel}
                    </span>
                  ) : null}
                </div>

                <p className="mt-[1mm] truncate text-[12pt] font-black leading-none text-[#123568]">
                  {receiverName}
                </p>

                <p className="mt-[1mm] flex items-center gap-[1.5mm] text-[7pt] font-bold">
                  <Phone className="h-[3.2mm] w-[3.2mm] shrink-0 text-[#0870bb]" />
                  {receiverPhone}
                </p>

                {!isPickup ? (
                  <>
                    <div className="mt-[1.2mm] flex items-start gap-[1.5mm]">
                      <MapPin className="mt-[0.3mm] h-[3.2mm] w-[3.2mm] shrink-0 text-[#0870bb]" />
                      <div className="min-w-0 text-[6.7pt] font-bold leading-[1.25]">
                        {fullAddress ? <p>{fullAddress}</p> : null}
                        {extraAddressLine ? <p>{extraAddressLine}</p> : null}
                      </div>
                    </div>

                    {landmark ? (
                      <p className="mt-[1mm] pl-[4.7mm] text-[5.8pt] leading-tight text-slate-600">
                        <span className="font-black">Patokan:</span> {landmark}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-[1mm] text-[6pt] font-bold text-slate-600">
                    Pesanan diambil langsung di PISJO.
                  </p>
                )}
              </div>
            </section>

{/* PENGIRIM / METODE / BAYAR + CATATAN */}
<section className="label-summary px-[4mm] pb-[2.2mm]">
  <div className="overflow-hidden rounded-[2mm] border border-slate-300">
    <div className="grid grid-cols-3">
      <div className="min-w-0 border-r border-slate-300 px-[2mm] py-[1.6mm]">
        <p className="flex items-center gap-[1mm] text-[5pt] font-black uppercase text-[#0870bb]">
          <Store className="h-[2.8mm] w-[2.8mm]" />
          Pengirim
        </p>

        <p className="mt-[0.6mm] truncate text-[6pt] font-black text-[#123568]">
          Pusat Ikan Segar Jogja
        </p>
      </div>

      <div className="min-w-0 border-r border-slate-300 px-[2mm] py-[1.6mm]">
        <p className="flex items-center gap-[1mm] text-[5pt] font-black uppercase text-[#0870bb]">
          <Truck className="h-[2.8mm] w-[2.8mm]" />
          Metode
        </p>

        <p className="mt-[0.6mm] truncate text-[6pt] font-black text-[#123568]">
          {shippingLabel}
        </p>
      </div>

      <div className="min-w-0 px-[2mm] py-[1.6mm]">
        <p className="flex items-center gap-[1mm] text-[5pt] font-black uppercase text-[#0870bb]">
          <CreditCard className="h-[2.8mm] w-[2.8mm]" />
          Pembayaran
        </p>

        <p
          className={`mt-[0.6mm] truncate text-[6pt] font-black ${
            paymentLabel === "LUNAS"
              ? "text-[#238653]"
              : "text-amber-700"
          }`}
        >
          {paymentLabel}
          {paymentMethod ? ` | ${paymentMethod}` : ""}
        </p>
      </div>
    </div>

    {/* CATATAN PEMBELIAN - SELALU DI ATAS PRODUK */}
    {uniqueNotes.length > 0 ? (
      <div className="label-notes border-t border-[#18b9d8] bg-[#eaf7fb] px-[2.5mm] py-[1.5mm]">
        <p className="text-[5pt] font-black uppercase text-[#123568]">
          Catatan Pembelian
        </p>

        <p className="mt-[0.5mm] break-words text-[5.8pt] font-bold leading-[1.2] text-[#17202b]">
          {uniqueNotes.join(" • ")}
        </p>
      </div>
    ) : null}
  </div>
</section>

{/* PRODUK */}
<section className="label-products flex min-h-0 flex-1 flex-col overflow-hidden px-[4mm]">
  <div className="shrink-0 grid grid-cols-[31%_21%_15%_22%_11%] bg-[#123568] px-[1.5mm] py-[1.2mm] text-[5pt] font-black uppercase tracking-wide text-white">
    <span>Produk</span>
    <span>Varian / Size</span>
    <span>Berat</span>
    <span>Kondisi</span>
    <span className="text-center">Qty</span>
  </div>

  <div className="min-h-0 overflow-hidden border-x border-b border-slate-300">
    {(order.items ?? []).map((item, index) => {
      const itemRecord =
        item as unknown as Record<string, unknown>;

      const productName = String(
        readOptionalValue(itemRecord, [
          "productName",
          "name",
        ]) ??
          item.product?.name ??
          "Produk",
      );

      const { variant, weight, condition } =
        getItemDisplay(itemRecord);

      return (
        <div
          key={item.id ?? index}
          className="product-row grid grid-cols-[31%_21%_15%_22%_11%] border-b border-slate-200 px-[1.5mm] py-[1.1mm] last:border-b-0"
        >
          <p className="product-name min-w-0 pr-[1mm] text-[5.8pt] font-black leading-tight text-[#17202b]">
            {productName}
          </p>

          <p className="cell-text min-w-0 pr-[1mm] text-[5.4pt] font-semibold leading-tight text-slate-700">
            {variant}
          </p>

          <p className="cell-text min-w-0 pr-[1mm] text-[5.4pt] font-bold leading-tight text-slate-700">
            {weight}
          </p>

          <p className="cell-text min-w-0 pr-[1mm] text-[5.4pt] font-bold leading-tight text-slate-700">
            {condition}
          </p>

          <p className="text-center text-[6pt] font-black leading-tight text-[#123568]">
            {item.quantity}
          </p>
        </div>
      );
    })}
  </div>
</section>

            {/* FOOTER */}
            <footer className="label-footer absolute bottom-0 left-0 right-0 border-t border-slate-300 bg-white px-[4mm] py-[2mm]">
              <div
                className={`grid items-center gap-[2mm] ${
                  packageCount > 1 ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                <div className="flex items-center gap-[1.5mm]">
                  <CalendarDays className="h-[3.4mm] w-[3.4mm] text-[#123568]" />
                  <div>
                    <p className="text-[4.8pt] font-black uppercase text-slate-500">
                      Tanggal Kirim
                    </p>
                    <p className="text-[6.2pt] font-black text-[#123568]">
                      {formatDate(deliveryDate) || "Menyesuaikan"}
                    </p>
                  </div>
                </div>

                {packageCount > 1 ? (
                  <div className="flex items-center justify-end gap-[1.5mm]">
                    <Package className="h-[3.4mm] w-[3.4mm] text-[#123568]" />
                    <div>
                      <p className="text-[4.8pt] font-black uppercase text-slate-500">
                        Jumlah Paket
                      </p>
                      <p className="text-[6.2pt] font-black text-[#123568]">
                        1 dari {packageCount}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </footer>
          </div>
        </section>
      </div>

      <style>{`
        @page {
          size: 100mm 150mm;
          margin: 0;
        }

        #shipping-label .product-name,
        #shipping-label .cell-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        #shipping-label.label-dense .label-header {
          padding-top: 2.6mm;
          padding-bottom: 2.2mm;
        }

        #shipping-label.label-dense .label-tracking {
          padding-top: 2mm;
          padding-bottom: 2mm;
        }

        #shipping-label.label-dense .label-recipient,
        #shipping-label.label-dense .label-summary {
          padding-bottom: 2mm;
        }

        #shipping-label.label-dense .product-row {
          padding-top: 0.95mm;
          padding-bottom: 0.95mm;
        }

        #shipping-label.label-dense .label-notes {
          padding-top: 1.5mm;
        }

        #shipping-label.label-ultra-dense .label-header {
          padding-top: 2.2mm;
          padding-bottom: 1.8mm;
        }

        #shipping-label.label-ultra-dense .label-tracking {
          padding-top: 1.5mm;
          padding-bottom: 1.5mm;
        }

        #shipping-label.label-ultra-dense .label-recipient,
        #shipping-label.label-ultra-dense .label-summary {
          padding-bottom: 1.5mm;
        }

        #shipping-label.label-ultra-dense .product-row {
          padding-top: 0.65mm;
          padding-bottom: 0.65mm;
        }

        #shipping-label.label-ultra-dense .product-row p {
          font-size: 5pt !important;
        }

        #shipping-label.label-ultra-dense .label-notes {
          padding-top: 1mm;
        }

        @media print {
          html,
          body {
            width: 100mm !important;
            height: 150mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          .shipping-label-wrapper {
            width: 100mm !important;
            height: 150mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }

          #shipping-label {
            width: 100mm !important;
            height: 150mm !important;
            max-width: 100mm !important;
            max-height: 150mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-before: avoid-page !important;
            break-after: avoid-page !important;
            break-inside: avoid-page !important;
          }

          #shipping-label section,
          #shipping-label header,
          #shipping-label footer,
          #shipping-label .grid {
            page-break-inside: avoid !important;
            break-inside: avoid-page !important;
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
