"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  Check,
  ChevronRight,
  CreditCard,
  Home,
  Landmark,
  Loader2,
  MapPin,
  Package,
  Phone,
  Plus,
  ShoppingCart,
  User,
} from "lucide-react";

import { createCheckoutOrderAction } from "@/actions/order/create-checkout-order";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface CheckoutAddress {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  label: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

interface CheckoutItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;

  product: {
    id: string;
    name: string;
    unit: string;
    stock: number;
    image: string | null;
  };
}

interface CheckoutFormProps {
  addresses: CheckoutAddress[];

  items: CheckoutItem[];

  subtotal: number;

  paymentChannels:
    CheckoutPaymentChannel[];
}

interface CheckoutPaymentChannel {
  id: string;

  name: string;

  type: string;

  bankName: string | null;

  accountNumber: string | null;

  accountHolder: string | null;

  instructions: string | null;

  description: string | null;

  icon: string | null;

  sortOrder: number;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatRupiah(value: number) {
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
 * CHECKOUT FORM
 * ============================================================
 */

export default function CheckoutForm({
  addresses,
  items,
  subtotal,
  paymentChannels,
}: CheckoutFormProps) {
  const router = useRouter();

  /**
   * ==========================================================
   * DEFAULT ADDRESS
   * ==========================================================
   */

  const defaultAddress =
    addresses.find(
      (address) => address.isDefault
    ) ??
    addresses[0] ??
    null;

  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<string | null>(
    defaultAddress?.id ?? null
  );
  
  const [
  selectedPaymentChannelId,
  setSelectedPaymentChannelId,
] = useState<string | null>(
  paymentChannels[0]?.id ?? null
);

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  /**
   * ==========================================================
   * TOTAL ITEMS
   * ==========================================================
   */

  const totalItems =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  /**
   * ==========================================================
   * HANDLE CHECKOUT
   * ==========================================================
   */

  async function handleCheckout() {
    /**
     * Prevent double submit
     */

    if (isSubmitting) {
      return;
    }

    /**
     * Validate address
     */

    if (!selectedAddressId) {
      setErrorMessage(
        "Silakan pilih alamat pengiriman terlebih dahulu."
      );

      return;
    }

    /**
 * Validate payment channel
 */

if (!selectedPaymentChannelId) {
  setErrorMessage(
    "Silakan pilih metode pembayaran terlebih dahulu."
  );

  return;
}

    /**
     * Validate cart
     */

    if (items.length === 0) {
      setErrorMessage(
        "Keranjang belanja Anda kosong."
      );

      return;
    }

    try {
      setIsSubmitting(true);

      setErrorMessage(null);

      /**
 * CREATE ORDER
 */

const result =
  await createCheckoutOrderAction({
    addressId: selectedAddressId,

    paymentChannelId:
      selectedPaymentChannelId,

    notes:
      notes.trim() || null,
  });
      /**
       * HANDLE ERROR
       */

      if (!result.success) {
        setErrorMessage(
          result.message ||
          "Gagal membuat pesanan."
        );

        return;
      }

      /**
       * SUCCESS
       */

      if (!result.orderId) {
        setErrorMessage(
          "Pesanan berhasil dibuat, tetapi ID pesanan tidak ditemukan."
        );

        return;
      }

      /**
       * REDIRECT
       *
       * Untuk sementara diarahkan ke
       * halaman daftar pesanan.
       *
       * Jika halaman detail customer
       * belum dibuat.
       */

      router.push(
        "/customer/orders"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[CHECKOUT_FORM_ERROR]",
        error
      );

      setErrorMessage(
        "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <Link
            href="/customer/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />

            Kembali ke Keranjang
          </Link>

          <div className="mt-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Checkout
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Pilih alamat pengiriman dan periksa pesanan Anda.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ===================================================== */}
      {/* CONTENT */}
      {/* ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">

          {/* ================================================= */}
          {/* LEFT CONTENT */}
          {/* ================================================= */}

          <div className="space-y-6">

            {/* =============================================== */}
            {/* ADDRESS */}
            {/* =============================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Alamat Pengiriman
                    </h2>

                    <p className="text-sm text-slate-500">
                      Pilih alamat tujuan pesanan.
                    </p>
                  </div>

                </div>

                <Link
                  href="/customer/addresses/create"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />

                  Tambah
                </Link>

              </div>

              {!selectedAddressId && (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <MapPin className="h-6 w-6 text-slate-400" />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    Belum ada alamat pengiriman
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Tambahkan alamat terlebih dahulu sebelum melanjutkan checkout.
                  </p>

                  <Link
                    href="/customer/addresses/create"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                  >
                    <Plus className="h-4 w-4" />

                    Tambah Alamat
                  </Link>

                </div>
              )}

              {selectedAddressId && (
                <div className="divide-y divide-slate-100">

                  {addresses.map(
                    (address) => {
                      const isSelected =
                        address.id ===
                        selectedAddressId;

                      return (
                        <div
                          key={address.id}
                          className={
                            isSelected
                              ? "bg-cyan-50/50"
                              : "bg-white transition hover:bg-slate-50"
                          }
                        >

                          <div className="flex gap-4 px-5 py-5">

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAddressId(
                                  address.id
                                );

                                setErrorMessage(null);
                              }}
                              className="flex min-w-0 flex-1 gap-4 text-left"
                            >

                              <div
                                className={
                                  isSelected
                                    ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white"
                                    : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300"
                                }
                              >
                                {isSelected && (
                                  <Check className="h-4 w-4" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h3 className="font-semibold text-slate-950">
                                    {address.label ||
                                      "Alamat"}
                                  </h3>

                                  {address.isDefault && (
                                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700">
                                      Alamat Utama
                                    </span>
                                  )}

                                </div>

                                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">

                                  <div className="flex items-center gap-2">

                                    <User className="h-4 w-4 text-slate-400" />

                                    <span className="font-medium text-slate-800">
                                      {address.receiverName}
                                    </span>

                                  </div>

                                  <div className="flex items-center gap-2">

                                    <Phone className="h-4 w-4 text-slate-400" />

                                    {address.receiverPhone}

                                  </div>

                                  <div className="flex items-start gap-2">

                                    <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                                    <div>
                                      <p>
                                        {address.fullAddress}
                                      </p>

                                      <p>
                                        {address.village},{" "}
                                        {address.district}
                                      </p>

                                      <p>
                                        {address.city},{" "}
                                        {address.province}
                                      </p>

                                      <p>
                                        {address.postalCode}
                                      </p>
                                    </div>

                                  </div>

                                </div>

                                {address.notes && (
                                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">

                                    <span className="font-semibold text-slate-700">
                                      Catatan alamat:
                                    </span>{" "}

                                    {address.notes}

                                  </div>
                                )}

                                {address.latitude !== null &&
                                  address.longitude !== null && (
                                    <div className="mt-4 flex items-center gap-2 text-xs text-cyan-700">

                                      <MapPin className="h-3.5 w-3.5" />

                                      Lokasi pin tersedia

                                    </div>
                                  )}

                              </div>

                            </button>

                            <Link
                              href={`/customer/addresses/${address.id}/edit`}
                              className="shrink-0 text-sm font-medium text-cyan-600 hover:text-cyan-700"
                            >
                              Edit
                            </Link>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

              {/* =============================================== */}
{/* PAYMENT METHOD */}
{/* =============================================== */}

<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
  <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
      <CreditCard className="h-5 w-5" />
    </div>

    <div>
      <h2 className="font-semibold text-slate-950">
        Metode Pembayaran
      </h2>

      <p className="text-sm text-slate-500">
        Pilih metode pembayaran untuk pesanan Anda.
      </p>
    </div>
  </div>

  {paymentChannels.length === 0 ? (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <CreditCard className="h-5 w-5 text-slate-400" />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        Metode pembayaran belum tersedia
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Saat ini belum ada metode pembayaran yang dapat digunakan.
      </p>
    </div>
  ) : (
    <div className="divide-y divide-slate-100">
      {paymentChannels.map(
        (channel) => {
          const isSelected =
            channel.id ===
            selectedPaymentChannelId;

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => {
                setSelectedPaymentChannelId(
                  channel.id
                );

                setErrorMessage(null);
              }}
              disabled={isSubmitting}
              className={`flex w-full items-start gap-4 px-5 py-5 text-left transition ${
                isSelected
                  ? "bg-cyan-50/60"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={
                  isSelected
                    ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white"
                    : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300"
                }
              >
                {isSelected && (
                  <Check className="h-4 w-4" />
                )}
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                {channel.type ===
                "BANK_TRANSFER" ? (
                  <Landmark className="h-5 w-5" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">
                    {channel.name}
                  </h3>

                  {channel.type ===
                    "BANK_TRANSFER" && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      Transfer Bank
                    </span>
                  )}
                </div>

                {channel.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {channel.description}
                  </p>
                )}

                {(channel.bankName ||
                  channel.accountNumber ||
                  channel.accountHolder) && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    {channel.bankName && (
                      <p className="font-semibold text-slate-900">
                        {channel.bankName}
                      </p>
                    )}

                    {channel.accountNumber && (
                      <p className="mt-1 font-mono text-sm text-slate-600">
                        {channel.accountNumber}
                      </p>
                    )}

                    {channel.accountHolder && (
                      <p className="mt-1 text-sm text-slate-500">
                        a.n.{" "}
                        {channel.accountHolder}
                      </p>
                    )}
                  </div>
                )}

                {channel.instructions && (
                  <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                      Petunjuk Pembayaran
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {channel.instructions}
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        }
      )}
    </div>
  )}
</section>

            {/* =============================================== */}
            {/* ORDER NOTES */}
            {/* =============================================== */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Package className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Catatan Pesanan
                  </h2>

                  <p className="text-sm text-slate-500">
                    Opsional, tambahkan informasi untuk pesanan Anda.
                  </p>
                </div>

              </div>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Contoh: Tolong hubungi saya sebelum pengiriman."
                maxLength={500}
                disabled={isSubmitting}
                className="mt-5 min-h-30 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

            </section>

            {/* =============================================== */}
            {/* ORDER ITEMS */}
            {/* =============================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Package className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Pesanan Anda
                  </h2>

                  <p className="text-sm text-slate-500">
                    {totalItems} item dalam pesanan.
                  </p>
                </div>

              </div>

              <div className="divide-y divide-slate-100">

                {items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >

                      <div className="min-w-0">

                        <h3 className="truncate font-medium text-slate-900">
                          {item.product.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.quantity}{" "}
                          {item.product.unit} ×{" "}
                          {formatRupiah(
                            item.price
                          )}
                        </p>

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="font-semibold text-slate-900">
                          {formatRupiah(
                            item.subtotal
                          )}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>

          </div>

          {/* ================================================= */}
          {/* ORDER SUMMARY */}
          {/* ================================================= */}

          <aside className="lg:sticky lg:top-6 lg:self-start">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-lg font-bold text-slate-950">
                Ringkasan Pesanan
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Total Item
                  </span>

                  <span className="font-semibold text-slate-900">
                    {totalItems}
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatRupiah(
                      subtotal
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Ongkos Kirim
                  </span>

                  <span className="font-medium text-slate-400">
                    Akan dihitung
                  </span>

                </div>

              </div>

              <div className="my-6 border-t border-slate-200" />

              <div className="flex items-center justify-between">

                <span className="font-semibold text-slate-900">
                  Total Sementara
                </span>

                <span className="text-xl font-bold text-slate-950">
                  {formatRupiah(
                    subtotal
                  )}
                </span>

              </div>

              {/* ============================================= */}
              {/* ERROR MESSAGE */}
              {/* ============================================= */}

              {errorMessage && (
                <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <p className="text-sm leading-6 text-red-700">
                    {errorMessage}
                  </p>

                </div>
              )}

              {/* ============================================= */}
              {/* CREATE ORDER */}
              {/* ============================================= */}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
  !selectedAddressId ||
  !selectedPaymentChannelId ||
  isSubmitting ||
  items.length === 0
}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Memproses Pesanan...
                  </>
                ) : (
                  <>
                    Buat Pesanan

                    <ChevronRight className="h-4 w-4" />
                  </>
                )}

              </button>

              {!selectedAddressId && (
                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                  Tambahkan atau pilih alamat pengiriman terlebih dahulu.
                </p>
              )}

              <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                Stok akan divalidasi kembali saat pesanan dibuat.
              </p>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}