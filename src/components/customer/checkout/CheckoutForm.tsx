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
  Navigation,
  Package,
  Phone,
  Plus,
  ShoppingCart,
  User,
} from "lucide-react";

import { createCheckoutOrderAction } from "@/actions/order/create-checkout-order";

import ShippingMethodSelector from "@/components/checkout/ShippingMethodSelector";

import type {
  AvailableShippingProvider,
  ShippingProviderCode,
} from "@/services/shipping/shipping.types";

import {
  calculateInternalShipping,
  type InternalShippingCalculationResult,
} from "@/services/shipping/internal-shipping.service";



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

    stock: number;

    image: string | null;
  };
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

interface CheckoutInternalShipping {
  enabled: boolean;

  name: string;

  storeLocation: {
    latitude: number | null;

    longitude: number | null;
  };

  baseFee: number;

  perKmFee: number;

  maxDistanceKm: number;

  freeShippingThreshold: number | null;
}

interface CheckoutFormProps {
  addresses: CheckoutAddress[];

  items: CheckoutItem[];

  subtotal: number;

  paymentChannels:
    CheckoutPaymentChannel[];

  internalShipping:
    CheckoutInternalShipping;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatRupiah(
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
 * CHECKOUT FORM
 * ============================================================
 */

export default function CheckoutForm({
  addresses,
  items,
  subtotal,
  paymentChannels,
  internalShipping,
}: CheckoutFormProps) {
  const router = useRouter();

  /**
   * ==========================================================
   * DEFAULT ADDRESS
   * ==========================================================
   */

  const defaultAddress =
    addresses.find(
      (address) =>
        address.isDefault
    ) ??
    addresses[0] ??
    null;

  /**
   * ==========================================================
   * SHIPPING PROVIDER STATE
   * ==========================================================
   *
   * Saat ini default menggunakan INTERNAL.
   *
   * Nantinya provider seperti:
   *
   * - JNE
   * - JNT
   * - SICEPAT
   * - ANTERAJA
   * - POS
   *
   * dapat ditambahkan tanpa mengubah struktur state checkout.
   * ==========================================================
   */

  const [
    selectedShippingProvider,
    setSelectedShippingProvider,
  ] = useState<ShippingProviderCode>(
    "INTERNAL"
  );

  /**
   * ==========================================================
   * AVAILABLE SHIPPING PROVIDERS
   * ==========================================================
   */

  const availableShippingProviders:
    AvailableShippingProvider[] =
    internalShipping.enabled
      ? [
          {
            code: "INTERNAL",

            name:
              internalShipping.name ||
              "Kurir Internal",

            enabled: true,
          },
        ]
      : [];

  /**
   * ==========================================================
   * ADDRESS STATE
   * ==========================================================
   */

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<string | null>(
    defaultAddress?.id ?? null
  );

  /**
   * ==========================================================
   * SELECTED ADDRESS
   * ==========================================================
   */

  const selectedAddress =
    addresses.find(
      (address) =>
        address.id ===
        selectedAddressId
    ) ?? null;

  /**
   * ==========================================================
   * INTERNAL SHIPPING CALCULATION
   * ==========================================================
   */

  const internalShippingResult:
    InternalShippingCalculationResult =
    calculateInternalShipping({
      storeLocation:
        internalShipping.storeLocation,

      customerLocation: {
        latitude:
          selectedAddress?.latitude ??
          null,

        longitude:
          selectedAddress?.longitude ??
          null,
      },

      config: {
        enabled:
          internalShipping.enabled,

        name:
          internalShipping.name,

        baseFee:
          internalShipping.baseFee,

        perKmFee:
          internalShipping.perKmFee,

        maxDistanceKm:
          internalShipping.maxDistanceKm,

        freeShippingThreshold:
          internalShipping.freeShippingThreshold,
      },

      subtotal,
    });

  /**
   * ==========================================================
   * SHIPPING COST
   * ==========================================================
   */

  const shippingCost =
    selectedShippingProvider ===
      "INTERNAL" &&
    internalShippingResult.available
      ? internalShippingResult.shippingCost ??
        0
      : 0;

  /**
   * ==========================================================
   * ORDER TOTAL
   * ==========================================================
   */

  const orderTotal =
    subtotal +
    shippingCost;

  /**
   * ==========================================================
   * PAYMENT STATE
   * ==========================================================
   */

  const [
    selectedPaymentChannelId,
    setSelectedPaymentChannelId,
  ] = useState<string | null>(
    paymentChannels[0]?.id ??
      null
  );

  /**
   * ==========================================================
   * NOTES
   * ==========================================================
   */

  const [
    notes,
    setNotes,
  ] = useState("");

  /**
   * ==========================================================
   * SUBMIT STATE
   * ==========================================================
   */

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
        total +
        item.quantity,
      0
    );

  /**
   * ==========================================================
   * HANDLE SHIPPING PROVIDER CHANGE
   * ==========================================================
   */

  function handleShippingProviderChange(
    provider:
      ShippingProviderCode
  ) {
    setSelectedShippingProvider(
      provider
    );

    setErrorMessage(null);
  }

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
     * Validate shipping provider
     */

    if (!selectedShippingProvider) {
      setErrorMessage(
        "Silakan pilih metode pengiriman terlebih dahulu."
      );

      return;
    }

    /**
     * Validate shipping
     *
     * Saat ini provider aktif hanya INTERNAL.
     */

    if (
      selectedShippingProvider ===
        "INTERNAL" &&
      !internalShippingResult.available
    ) {
      setErrorMessage(
        internalShippingResult.reason ||
          "Kurir internal tidak tersedia untuk alamat ini."
      );

      return;
    }

    /**
     * Validate payment channel
     */

    if (
      !selectedPaymentChannelId
    ) {
      setErrorMessage(
        "Silakan pilih metode pembayaran terlebih dahulu."
      );

      return;
    }

    /**
     * Validate cart
     */

    if (
      items.length === 0
    ) {
      setErrorMessage(
        "Keranjang belanja Anda kosong."
      );

      return;
    }

    try {
      setIsSubmitting(true);

      setErrorMessage(null);

      /**
       * ========================================================
       * CREATE ORDER
       * ========================================================
       *
       * Shipping cost tetap dihitung ulang
       * dan disimpan dari server.
       */

      const result =
  await createCheckoutOrderAction({
    addressId: selectedAddressId,

    paymentChannelId:
      selectedPaymentChannelId,

    shippingProvider:
      selectedShippingProvider,

    notes:
      notes.trim() || null,
  });

      /**
       * Handle error
       */

      if (
        !result.success
      ) {
        setErrorMessage(
          result.message ||
            "Gagal membuat pesanan."
        );

        return;
      }

      /**
       * Validate order ID
       */

      if (
        !result.orderId
      ) {
        setErrorMessage(
          "Pesanan berhasil dibuat, tetapi ID pesanan tidak ditemukan."
        );

        return;
      }

      /**
 * ==========================================================
 * REDIRECT TO PAYMENT PAGE
 * ==========================================================
 */

router.push(
  `/customer/orders/${result.orderId}/payment`
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
                          key={
                            address.id
                          }
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

                                setErrorMessage(
                                  null
                                );
                              }}
                              disabled={
                                isSubmitting
                              }
                              className="flex min-w-0 flex-1 gap-4 text-left disabled:cursor-not-allowed"
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
                                      {
                                        address.receiverName
                                      }
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400" />

                                    {
                                      address.receiverPhone
                                    }
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                                    <div>
                                      <p>
                                        {
                                          address.fullAddress
                                        }
                                      </p>

                                      <p>
                                        {
                                          address.village
                                        }
                                        ,{" "}
                                        {
                                          address.district
                                        }
                                      </p>

                                      <p>
                                        {
                                          address.city
                                        }
                                        ,{" "}
                                        {
                                          address.province
                                        }
                                      </p>

                                      <p>
                                        {
                                          address.postalCode
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {address.notes && (
                                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                                    <span className="font-semibold text-slate-700">
                                      Catatan alamat:
                                    </span>{" "}
                                    {
                                      address.notes
                                    }
                                  </div>
                                )}

                                {/* GPS */}

                                {address.latitude !==
                                  null &&
                                address.longitude !==
                                  null ? (
                                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <Navigation className="h-4 w-4" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-emerald-800">
                                          Lokasi GPS tersimpan
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-emerald-700">
                                          Titik lokasi tersedia untuk membantu menentukan lokasi pengiriman.
                                        </p>

                                        <p className="mt-1 font-mono text-[10px] text-emerald-600">
                                          {address.latitude.toFixed(
                                            7
                                          )}
                                          ,{" "}
                                          {address.longitude.toFixed(
                                            7
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                        <MapPin className="h-4 w-4" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-amber-800">
                                          Lokasi GPS belum tersedia
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-amber-700">
                                          Tambahkan titik lokasi agar alamat pengiriman lebih akurat.
                                        </p>

                                        <Link
                                          href={`/customer/addresses/${address.id}/edit`}
                                          className="mt-2 inline-flex text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                                          onClick={(
                                            event
                                          ) => {
                                            event.stopPropagation();
                                          }}
                                        >
                                          Perbarui lokasi
                                        </Link>
                                      </div>
                                    </div>
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
            {/* SHIPPING METHOD */}
            {/* =============================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Navigation className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Metode Pengiriman
                  </h2>

                  <p className="text-sm text-slate-500">
                    Pilih layanan pengiriman untuk pesanan Anda.
                  </p>
                </div>
              </div>

              <div className="p-5">
                <ShippingMethodSelector
                  providers={
                    availableShippingProviders
                  }
                  selectedProvider={
                    selectedShippingProvider
                  }
                  onChange={
                    handleShippingProviderChange
                  }
                  disabled={
                    !selectedAddress ||
                    isSubmitting
                  }
                />

                {/* INTERNAL SHIPPING INFORMATION */}

                {selectedShippingProvider ===
                  "INTERNAL" &&
                  selectedAddress && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {internalShippingResult.available ? (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {
                                  internalShippingResult.serviceName
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Ongkos kirim dihitung berdasarkan jarak lokasi toko dan alamat pengiriman.
                              </p>
                            </div>

                            {internalShippingResult.isFreeShipping ? (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                GRATIS
                              </span>
                            ) : (
                              <span className="shrink-0 text-sm font-bold text-slate-900">
                                {formatRupiah(
                                  shippingCost
                                )}
                              </span>
                            )}
                          </div>

                          {internalShippingResult.distanceKm !==
                            null && (
                            <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
                              <Navigation className="h-3.5 w-3.5" />

                              Jarak pengiriman:{" "}
                              <span className="font-semibold text-slate-700">
                                {internalShippingResult.distanceKm.toFixed(
                                  2
                                )}{" "}
                                KM
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                          <div>
                            <p className="text-sm font-semibold text-red-700">
                              Pengiriman belum tersedia
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-600">
                              {
                                internalShippingResult.reason ||
                                "Kurir internal tidak tersedia untuk alamat ini."
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {!selectedAddress && (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Pilih alamat pengiriman terlebih dahulu untuk melihat metode dan biaya pengiriman.
                  </p>
                )}
              </div>
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

              {paymentChannels.length ===
              0 ? (
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
                          key={
                            channel.id
                          }
                          type="button"
                          onClick={() => {
                            setSelectedPaymentChannelId(
                              channel.id
                            );

                            setErrorMessage(
                              null
                            );
                          }}
                          disabled={
                            isSubmitting
                          }
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
                                {
                                  channel.name
                                }
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
                                {
                                  channel.description
                                }
                              </p>
                            )}

                            {(channel.bankName ||
                              channel.accountNumber ||
                              channel.accountHolder) && (
                              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                {channel.bankName && (
                                  <p className="font-semibold text-slate-900">
                                    {
                                      channel.bankName
                                    }
                                  </p>
                                )}

                                {channel.accountNumber && (
                                  <p className="mt-1 font-mono text-sm text-slate-600">
                                    {
                                      channel.accountNumber
                                    }
                                  </p>
                                )}

                                {channel.accountHolder && (
                                  <p className="mt-1 text-sm text-slate-500">
                                    a.n.{" "}
                                    {
                                      channel.accountHolder
                                    }
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
                                  {
                                    channel.instructions
                                  }
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
                      key={
                        item.id
                      }
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-slate-900">
                          {
                            item.product.name
                          }
                        </h3>
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

                {/* SHIPPING */}

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">
                        Ongkos Kirim
                      </p>

                      {selectedShippingProvider ===
                        "INTERNAL" &&
                        internalShippingResult.available && (
                          <p className="mt-1 text-xs text-slate-500">
                            {
                              internalShippingResult.serviceName
                            }

                            {internalShippingResult.distanceKm !==
                              null &&
                              ` • ${internalShippingResult.distanceKm.toFixed(
                                2
                              )} KM`}
                          </p>
                        )}

                      {selectedShippingProvider ===
                        "INTERNAL" &&
                        !internalShippingResult.available && (
                          <p className="mt-1 text-xs text-red-500">
                            {
                              internalShippingResult.reason ||
                              "Belum tersedia"
                            }
                          </p>
                        )}
                    </div>

                    <div className="text-right">
                      {selectedShippingProvider ===
                        "INTERNAL" &&
                      internalShippingResult.available ? (
                        internalShippingResult.isFreeShipping ? (
                          <div>
                            <p className="font-semibold text-emerald-600">
                              GRATIS
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              Gratis ongkir
                            </p>
                          </div>
                        ) : (
                          <p className="font-semibold text-slate-900">
                            {formatRupiah(
                              shippingCost
                            )}
                          </p>
                        )
                      ) : (
                        <span className="font-medium text-slate-400">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="my-6 border-t border-slate-200" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Total Pembayaran
                </span>

                <span className="text-xl font-bold text-slate-950">
                  {formatRupiah(
                    orderTotal
                  )}
                </span>
              </div>

              {/* ERROR */}

              {errorMessage && (
                <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <p className="text-sm leading-6 text-red-700">
                    {
                      errorMessage
                    }
                  </p>
                </div>
              )}

              {/* CREATE ORDER */}

              <button
                type="button"
                onClick={
                  handleCheckout
                }
                disabled={
                  !selectedAddressId ||
                  !selectedShippingProvider ||
                  !selectedPaymentChannelId ||
                  isSubmitting ||
                  items.length === 0 ||
                  (selectedShippingProvider ===
                    "INTERNAL" &&
                    !internalShippingResult.available)
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

              {selectedAddressId &&
                selectedShippingProvider ===
                  "INTERNAL" &&
                !internalShippingResult.available && (
                  <p className="mt-3 text-center text-xs leading-5 text-red-500">
                    Kurir internal belum tersedia untuk alamat yang dipilih.
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