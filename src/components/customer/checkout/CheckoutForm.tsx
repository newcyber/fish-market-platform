"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

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
  Tag,
  User,
  Star,
  X,
} from "lucide-react";

import { createCheckoutOrderAction } from "@/actions/order/create-checkout-order";

import { validateVoucherAction } from "@/actions/voucher/validate-voucher";

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
    unit?: string;
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
 * APPLIED VOUCHER
 * ============================================================
 */

interface AppliedVoucher {
  id: string;

  code: string;

  name: string;

  discountAmount: number;

  finalSubtotal: number;
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
  const searchParams = useSearchParams();

  /**
   * ==========================================================
   * SELECTED CART ITEMS
   * ==========================================================
   *
   * Selection berasal dari query:
   *
   * /customer/checkout?selected=id1,id2
   *
   * Jika query tidak ada, null berarti seluruh item checkout.
   * ==========================================================
   */
  const selectedItemIds = searchParams.get("selected")
    ? searchParams
        .get("selected")!
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : null;

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
   * VOUCHER STATE
   * ==========================================================
   */

  const [
    voucherCode,
    setVoucherCode,
  ] = useState("");

  const [
    appliedVoucher,
    setAppliedVoucher,
  ] = useState<AppliedVoucher | null>(
    null
  );

  const [
    voucherMessage,
    setVoucherMessage,
  ] = useState<string | null>(
    null
  );

  const [
    isApplyingVoucher,
    setIsApplyingVoucher,
  ] = useState(false);

  /**
   * ==========================================================
   * VOUCHER DISCOUNT
   * ==========================================================
   */

  const voucherDiscount =
    appliedVoucher?.discountAmount ??
    0;

  const discountedSubtotal =
    appliedVoucher?.finalSubtotal ??
    subtotal;

  /**
   * ==========================================================
   * ORDER TOTAL
   * ==========================================================
   */

  const orderTotal =
    discountedSubtotal +
    shippingCost;

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
   * CHECKOUT CONFIRMATION
   * ==========================================================
   */

  const [
    checkoutConfirmed,
    setCheckoutConfirmed,
  ] = useState(false);

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
   * HANDLE APPLY VOUCHER
   * ==========================================================
   */

  async function handleApplyVoucher() {
    if (
      isApplyingVoucher ||
      isSubmitting
    ) {
      return;
    }

    const normalizedCode =
      voucherCode
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      setAppliedVoucher(null);

      setVoucherMessage(
        "Masukkan kode voucher terlebih dahulu."
      );

      return;
    }

    try {
      setIsApplyingVoucher(true);

      setVoucherMessage(null);

      const result =
        await validateVoucherAction({
          code:
            normalizedCode,

          subtotal,
        });

      if (!result.success) {
        setAppliedVoucher(null);

        setVoucherMessage(
          result.message
        );

        return;
      }

      if (
        !result.voucher ||
        result.discountAmount ===
        undefined ||
        result.finalSubtotal ===
        undefined
      ) {
        setAppliedVoucher(null);

        setVoucherMessage(
          "Data voucher tidak lengkap."
        );

        return;
      }

      setVoucherCode(
        result.voucher.code
      );

      setAppliedVoucher({
        id:
          result.voucher.id,

        code:
          result.voucher.code,

        name:
          result.voucher.name,

        discountAmount:
          result.discountAmount,

        finalSubtotal:
          result.finalSubtotal,
      });

      setVoucherMessage(
        result.message ||
        "Voucher berhasil diterapkan."
      );
    } catch (error) {
      console.error(
        "[APPLY_VOUCHER_ERROR]",
        error
      );

      setAppliedVoucher(null);

      setVoucherMessage(
        "Terjadi kesalahan saat menerapkan voucher."
      );
    } finally {
      setIsApplyingVoucher(false);
    }
  }

  /**
   * ==========================================================
   * HANDLE REMOVE VOUCHER
   * ==========================================================
   */

  function handleRemoveVoucher() {
    setVoucherCode("");

    setAppliedVoucher(null);

    setVoucherMessage(null);
  }

  /**
   * ==========================================================
   * HANDLE VOUCHER CODE CHANGE
   * ==========================================================
   *
   * Jika kode voucher yang sudah diterapkan diubah,
   * preview lama langsung dibatalkan.
   */

  function handleVoucherCodeChange(
    value: string
  ) {
    const normalizedValue =
      value.toUpperCase();

    setVoucherCode(
      normalizedValue
    );

    if (appliedVoucher) {
      setAppliedVoucher(null);
    }

    setVoucherMessage(null);

    setErrorMessage(null);
  }

  /**
   * ==========================================================
   * HANDLE CHECKOUT
   * ==========================================================
   */

  async function handleCheckout() {
    if (isSubmitting) {
      return;
    }

    if (!selectedAddressId) {
      setErrorMessage(
        "Silakan pilih alamat pengiriman terlebih dahulu."
      );

      return;
    }

    if (!selectedShippingProvider) {
      setErrorMessage(
        "Silakan pilih metode pengiriman terlebih dahulu."
      );

      return;
    }

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

    if (
      !selectedPaymentChannelId
    ) {
      setErrorMessage(
        "Silakan pilih metode pembayaran terlebih dahulu."
      );

      return;
    }

    if (
      items.length === 0
    ) {
      setErrorMessage(
        "Keranjang belanja Anda kosong."
      );

      return;
    }

    if (!checkoutConfirmed) {
      setErrorMessage(
        "Silakan centang konfirmasi pesanan sebelum melanjutkan."
      );

      return;
    }

    try {
      setIsSubmitting(true);

      setErrorMessage(null);

      const result =
        await createCheckoutOrderAction({
          addressId:
            selectedAddressId,

          paymentChannelId:
            selectedPaymentChannelId,

          shippingProvider:
            selectedShippingProvider,

          notes:
            notes.trim() || null,

voucherCode:
  appliedVoucher?.code ??
  null,

checkoutConfirmed:
  checkoutConfirmed,

selectedItemIds:
  selectedItemIds,
        });

      if (
        !result.success
      ) {
        setErrorMessage(
          result.message ||
          "Gagal membuat pesanan."
        );

        return;
      }

      if (
        !result.orderId
      ) {
        setErrorMessage(
          "Pesanan berhasil dibuat, tetapi ID pesanan tidak ditemukan."
        );

        return;
      }

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
    <main className="min-h-screen bg-[#f5fbff] pb-28 text-slate-900 lg:pb-10">
      {/* ========================================================= */}
      {/* CHECKOUT HEADER                                           */}
      {/* ========================================================= */}

      <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link
            href="/customer/cart"
            className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
            aria-label="Kembali ke keranjang"
          >
            <ChevronRight className="h-6 w-6 rotate-180" />
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-[var(--ocean-950)] sm:text-lg">
                Keranjang & Checkout
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Periksa pesanan sebelum melanjutkan pembayaran
              </p>
            </div>
          </div>

          <div className="ml-auto hidden text-right sm:block">
            <p className="text-xs font-medium text-cyan-700">
              Pesanan Aman
            </p>

            <p className="text-[11px] text-slate-400">
              Harga & stok divalidasi kembali
            </p>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN                                                       */}
      {/* ========================================================= */}

      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:gap-6">
          {/* ===================================================== */}
          {/* LEFT COLUMN                                            */}
          {/* ===================================================== */}

          <div className="min-w-0 space-y-4">
            {/* =================================================== */}
            {/* SHIPPING METHOD                                      */}
            {/* =================================================== */}

            <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_18px_rgba(23,50,77,0.05)]">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-base font-bold text-[var(--ocean-950)]">
                    Metode Pengiriman
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Pilih cara pesanan Anda diterima
                  </p>
                </div>

                <Navigation className="h-5 w-5 shrink-0 text-cyan-600" />
              </div>

              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <ShippingMethodSelector
                  providers={availableShippingProviders}
                  selectedProvider={selectedShippingProvider}
                  onChange={handleShippingProviderChange}
                  disabled={!selectedAddress || isSubmitting}
                />

                {selectedShippingProvider === "INTERNAL" &&
                  selectedAddress && (
                    <div className="mt-3 rounded-xl bg-sky-50/70 px-3.5 py-3">
                      {internalShippingResult.available ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-sky-900">
                              {internalShippingResult.serviceName}
                            </p>

                            {internalShippingResult.distanceKm !== null && (
                              <p className="mt-0.5 text-[11px] text-sky-700">
                                Jarak{" "}
                                {internalShippingResult.distanceKm.toFixed(2)}{" "}
                                KM
                              </p>
                            )}
                          </div>

                          {internalShippingResult.isFreeShipping ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              GRATIS
                            </span>
                          ) : (
                            <span className="shrink-0 text-sm font-bold text-sky-900">
                              {formatRupiah(shippingCost)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                          <p className="text-xs leading-5 text-red-600">
                            {internalShippingResult.reason ||
                              "Kurir internal tidak tersedia untuk alamat ini."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {!selectedAddress && (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Pilih alamat pengiriman terlebih dahulu untuk melihat biaya
                    pengiriman.
                  </p>
                )}
              </div>
            </section>

            {/* =================================================== */}
            {/* ADDRESS                                               */}
            {/* =================================================== */}

            <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_18px_rgba(23,50,77,0.05)]">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-base font-bold text-[var(--ocean-950)]">
                    Alamat Pengiriman
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Alamat tujuan pesanan
                  </p>
                </div>

                <Link
                  href="/customer/addresses/create"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-50"
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </Link>
              </div>

              {!selectedAddress && (
                <div className="border-t border-slate-100 px-4 py-8 text-center sm:px-5">
                  <MapPin className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    Belum ada alamat pengiriman
                  </p>

                  <Link
                    href="/customer/addresses/create"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Alamat
                  </Link>
                </div>
              )}

              {selectedAddress && (
                <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-cyan-600">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[var(--ocean-950)] sm:text-base">
                          {selectedAddress.receiverName}
                        </h3>

                        {selectedAddress.isDefault && (
                          <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cyan-700">
                            Utama
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedAddress.receiverPhone}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                        {selectedAddress.fullAddress},{" "}
                        {selectedAddress.village},{" "}
                        {selectedAddress.district},{" "}
                        {selectedAddress.city},{" "}
                        {selectedAddress.province}{" "}
                        {selectedAddress.postalCode}
                      </p>
                    </div>

                    <Link
                      href={`/customer/addresses/${selectedAddress.id}/edit`}
                      className="shrink-0 self-start rounded-lg px-2 py-1 text-xs font-semibold text-cyan-600 hover:bg-cyan-50"
                    >
                      Ubah
                    </Link>
                  </div>

                  {selectedAddress.latitude === null ||
                  selectedAddress.longitude === null ? (
                    <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5">
                      <p className="text-[11px] leading-5 text-amber-700">
                        Tambahkan titik lokasi GPS agar perhitungan ongkir
                        lebih akurat.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {addresses.length > 1 && (
                <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
                  <p className="text-xs text-slate-400">
                    {addresses.length} alamat tersimpan
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {addresses
                      .filter((address) => address.id !== selectedAddressId)
                      .map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(address.id);
                            setErrorMessage(null);
                          }}
                          disabled={isSubmitting}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed"
                        >
                          {address.label || address.receiverName}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* =================================================== */}
            {/* PRODUCTS                                              */}
            {/* =================================================== */}

            <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_18px_rgba(23,50,77,0.05)]">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-base font-bold text-[var(--ocean-950)]">
                    Daftar Produk ({items.length})
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {totalItems} produk dalam pesanan
                  </p>
                </div>

                <Link
                  href="/customer/cart"
                  className="shrink-0 text-xs font-semibold text-cyan-600 hover:text-cyan-700"
                >
                  Ubah
                </Link>
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-w-0 gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-7 w-7 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[var(--ocean-950)] sm:text-base">
                        {item.product.name}
                      </h3>

                      {item.product.unit && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.product.unit}
                        </p>
                      )}

                      <p className="mt-1 text-sm font-bold text-red-600">
                        {formatRupiah(item.price)}
                      </p>

                      <div className="mt-2 inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1">
                        <span className="text-[11px] font-semibold text-sky-700">
                          Jumlah {item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-slate-400 sm:text-xs">
                        Subtotal
                      </p>

                      <p className="mt-1 text-sm font-bold text-[var(--ocean-950)] sm:text-base">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* =================================================== */}
            {/* PAYMENT METHOD                                       */}
            {/* =================================================== */}

            <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_4px_18px_rgba(23,50,77,0.05)]">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <h2 className="text-base font-bold text-[var(--ocean-950)]">
                    Metode Pembayaran
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Pilih metode pembayaran pesanan
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>

              {paymentChannels.length === 0 ? (
                <div className="border-t border-slate-100 px-5 py-8 text-center">
                  <CreditCard className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Metode pembayaran belum tersedia
                  </p>
                </div>
              ) : (
                <div className="border-t border-slate-100">
                  {paymentChannels.map((channel) => {
                    const isSelected =
                      channel.id === selectedPaymentChannelId;

                    const isBankTransfer =
                      channel.type === "BANK_TRANSFER";

                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => {
                          setSelectedPaymentChannelId(channel.id);
                          setErrorMessage(null);
                        }}
                        disabled={isSubmitting}
                        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition sm:px-5 ${
                          isSelected
                            ? "bg-sky-50/80"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isBankTransfer ? (
                            <Landmark className="h-5 w-5" />
                          ) : (
                            <CreditCard className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[var(--ocean-950)]">
                            {channel.name}
                          </p>

                          {channel.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {channel.description}
                            </p>
                          )}
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            isSelected
                              ? "bg-cyan-600 text-white"
                              : "border-2 border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =================================================== */}
            {/* ORDER NOTES                                          */}
            {/* =================================================== */}

            <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-[0_4px_18px_rgba(23,50,77,0.05)] sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Package className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[var(--ocean-950)]">
                    Catatan Pesanan
                  </h2>

                  <p className="text-xs text-slate-500">
                    Opsional
                  </p>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contoh: Tolong hubungi saya sebelum pengiriman."
                maxLength={500}
                disabled={isSubmitting}
                className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50"
              />
            </section>
          </div>

          {/* ===================================================== */}
          {/* RIGHT SUMMARY                                          */}
          {/* ===================================================== */}

          <aside className="min-w-0 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_8px_28px_rgba(23,50,77,0.08)]">
              {/* ================================================= */}
              {/* PAYMENT SUMMARY                                    */}
              {/* ================================================= */}

              <div className="px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-[var(--ocean-950)]">
                  Ringkasan Pembayaran
                </h2>

                <div className="mt-4 space-y-3">
                  {/* SUBTOTAL */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">
                      Subtotal Produk ({items.length} item)
                    </span>

                    <span className="font-medium text-slate-700">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  {/* VOUCHER DISCOUNT */}
                  {appliedVoucher && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-red-500">
                        Diskon Voucher
                      </span>

                      <span className="font-semibold text-red-600">
                        -{formatRupiah(voucherDiscount)}
                      </span>
                    </div>
                  )}

                  {/* SHIPPING */}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">
                      Ongkir
                    </span>

                    <span className="font-medium text-slate-700">
                      {internalShippingResult.available
                        ? internalShippingResult.isFreeShipping
                          ? "GRATIS"
                          : formatRupiah(shippingCost)
                        : "-"}
                    </span>
                  </div>

                  {/* SHIPPING SUBSIDY */}
                  {internalShippingResult.isFreeShipping && (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-emerald-600">
                        Subsidi Ongkir
                      </span>

                      <span className="font-semibold text-emerald-600">
                        GRATIS
                      </span>
                    </div>
                  )}
                </div>

                <div className="my-4 border-t border-slate-200" />

                {/* TOTAL */}
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--ocean-950)]">
                      Total Bayar
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Total akhir pesanan
                    </p>
                  </div>

                  <p className="whitespace-nowrap text-xl font-extrabold text-cyan-700">
                    {formatRupiah(orderTotal)}
                  </p>
                </div>
              </div>

              {/* ================================================= */}
              {/* VOUCHER & POIN                                     */}
              {/* ================================================= */}

              <div className="border-t border-slate-100">
                {/* HEADER */}
                <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Tag className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--ocean-950)]">
                        Voucher & Poin
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Gunakan voucher atau poin untuk lebih hemat
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* VOUCHER */}
                  <div className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                        <Tag className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--ocean-950)]">
                          Voucher Saya
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {appliedVoucher
                            ? `${appliedVoucher.name} • ${appliedVoucher.code}`
                            : "Masukkan kode voucher Anda"}
                        </p>
                      </div>

                      {appliedVoucher && (
                        <button
                          type="button"
                          onClick={handleRemoveVoucher}
                          disabled={isSubmitting}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    {/* VOUCHER INPUT */}
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(event) =>
                          handleVoucherCodeChange(event.target.value)
                        }
                        placeholder="Masukkan kode voucher"
                        disabled={isSubmitting}
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
                      />

                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={
                          !voucherCode.trim() ||
                          isSubmitting ||
                          isApplyingVoucher
                        }
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 px-4 text-xs font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {isApplyingVoucher ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Terapkan"
                        )}
                      </button>
                    </div>

                    {/* VOUCHER MESSAGE */}
                    {voucherMessage && (
                      <div
                        className={
                          appliedVoucher
                            ? "mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700"
                            : "mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-600"
                        }
                      >
                        {appliedVoucher && (
                          <span className="font-semibold">
                            {appliedVoucher.name}
                            {" — "}
                          </span>
                        )}

                        {voucherMessage}
                      </div>
                    )}

                    {/* APPLIED VOUCHER */}
                    {appliedVoucher && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-emerald-800">
                            Voucher berhasil digunakan
                          </p>

                          <p className="mt-0.5 text-[11px] text-emerald-700">
                            Hemat {formatRupiah(voucherDiscount)}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-bold text-emerald-700">
                          -{formatRupiah(voucherDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* POINTS */}
                  <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--ocean-950)]">
                        Poin Saya
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Gunakan poin untuk mendapatkan potongan harga
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* CONFIRMATION                                       */}
              {/* ================================================= */}

              <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                {errorMessage && (
                  <div className="mb-3 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                    <p className="text-xs leading-5 text-red-700">
                      {errorMessage}
                    </p>
                  </div>
                )}

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={checkoutConfirmed}
                    onChange={(event) => {
                      setCheckoutConfirmed(event.target.checked);

                      if (event.target.checked) {
                        setErrorMessage(null);
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-600"
                  />

                  <span className="text-[11px] leading-5 text-slate-600">
                    Saya sudah memeriksa produk, alamat pengiriman, metode
                    pengiriman, dan metode pembayaran.
                  </span>
                </label>

                {/* DESKTOP BUTTON */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={
                    !selectedAddressId ||
                    !selectedShippingProvider ||
                    !selectedPaymentChannelId ||
                    isSubmitting ||
                    isApplyingVoucher ||
                    items.length === 0 ||
                    (selectedShippingProvider === "INTERNAL" &&
                      !internalShippingResult.available)
                  }
                  className="mt-4 hidden h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-600 via-sky-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,145,178,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(8,145,178,0.30)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none lg:flex"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses Pesanan...
                    </>
                  ) : (
                    <>
                      Lanjut Bayar
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-3 hidden text-center text-[10px] leading-4 text-slate-400 lg:block">
                  Harga, stok, voucher, dan ongkir akan divalidasi kembali saat
                  pesanan dibuat.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MOBILE FIXED CHECKOUT BAR                                 */}
      {/* ========================================================= */}

      <div className="fixed inset-x-0 bottom-16 z-50 border-t border-sky-100 bg-white/95 px-3 py-2.5 shadow-[0_-8px_25px_rgba(23,50,77,0.10)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-500">
              Total Bayar
            </p>

            <p className="truncate text-lg font-extrabold leading-6 text-cyan-700">
              {formatRupiah(orderTotal)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={
              !selectedAddressId ||
              !selectedShippingProvider ||
              !selectedPaymentChannelId ||
              isSubmitting ||
              isApplyingVoucher ||
              items.length === 0 ||
              (selectedShippingProvider === "INTERNAL" &&
                !internalShippingResult.available)
            }
            className="inline-flex h-12 min-w-0 flex-[1.35] items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-600 to-sky-600 px-4 text-sm font-bold text-white shadow-[0_7px_20px_rgba(8,145,178,0.25)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Lanjut Bayar
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
