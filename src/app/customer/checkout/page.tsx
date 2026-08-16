import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";
import AddressRepository from "@/repositories/address.repository";

import settingsService from "@/services/settings/settings.service";

import CheckoutForm from "@/components/customer/checkout/CheckoutForm";

import {
  PaymentChannelService,
} from "@/services/payment/payment-channel.service";

/**
 * ============================================================
 * CUSTOMER CHECKOUT PAGE
 * ============================================================
 *
 * Server Component
 *
 * Responsibilities:
 *
 * - Authentication
 * - Get cart
 * - Get customer addresses
 * - Get store shipping configuration
 * - Get active payment channels
 * - Prepare serializable data
 * - Pass data to CheckoutForm
 *
 * IMPORTANT:
 *
 * Shipping method state TIDAK disimpan di sini karena file ini
 * adalah Server Component.
 *
 * State seperti:
 *
 * - selectedShippingProvider
 * - selectedAddress
 * - selectedPaymentChannel
 *
 * harus dikelola di CheckoutForm karena merupakan
 * Client Component.
 * ============================================================
 */

export default async function CheckoutPage() {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  /**
   * ==========================================================
   * GET CART
   * ==========================================================
   */

  const cart =
    await CartService.getCart(
      userId
    );

  /**
   * ==========================================================
   * GET CUSTOMER ADDRESSES
   * ==========================================================
   */

  const addresses =
    await AddressRepository.findManyByUserId(
      userId
    );

  /**
   * ==========================================================
   * GET STORE SETTINGS
   *
   * Digunakan sebagai:
   *
   * - Shipping origin
   * - Konfigurasi kurir internal
   *
   * Settings diambil dari Server Component,
   * lalu seluruh Decimal dikonversi menjadi number
   * sebelum dikirim ke Client Component.
   * ==========================================================
   */

  const settings =
    await settingsService.getSettings();

  /**
   * ==========================================================
   * GET ACTIVE PAYMENT CHANNELS
   * ==========================================================
   */

  const paymentChannelsResult =
    await PaymentChannelService.getAllActive();

  const paymentChannels =
    paymentChannelsResult.success
      ? paymentChannelsResult.data ?? []
      : [];

  /**
   * ==========================================================
   * EMPTY CART
   * ==========================================================
   */

  if (
    !cart ||
    cart.items.length === 0
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <ShoppingBag className="h-10 w-10 text-slate-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Keranjang masih kosong
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Tambahkan produk terlebih dahulu sebelum
            melanjutkan ke checkout.
          </p>

          <Link
            href="/customer/products"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Produk
          </Link>
        </div>
      </main>
    );
  }

  /**
   * ==========================================================
   * CALCULATE SUBTOTAL
   *
   * Important:
   * Convert Decimal values into plain numbers
   * before sending data to Client Component.
   * ==========================================================
   */

  const subtotal =
    cart.items.reduce(
      (total, item) => {
        return (
          total +
          Number(item.price) *
          item.quantity
        );
      },
      0
    );

  /**
   * ==========================================================
   * SERIALIZE ADDRESSES
   *
   * Prisma Decimal cannot safely be passed directly
   * into Client Component.
   * ==========================================================
   */

  const serializedAddresses =
    addresses.map(
      (address) => ({
        id:
          address.id,

        receiverName:
          address.receiverName,

        receiverPhone:
          address.receiverPhone,

        province:
          address.province,

        city:
          address.city,

        district:
          address.district,

        village:
          address.village,

        postalCode:
          address.postalCode,

        fullAddress:
          address.fullAddress,

        label:
          address.label,

        notes:
          address.notes,

        latitude:
          address.latitude !== null
            ? Number(
              address.latitude
            )
            : null,

        longitude:
          address.longitude !== null
            ? Number(
              address.longitude
            )
            : null,

        isDefault:
          address.isDefault,
      })
    );

  /**
   * ==========================================================
   * SERIALIZE CART ITEMS
   * ==========================================================
   */

  const serializedItems =
    cart.items.map(
      (item) => ({
        id:
          item.id,

        productId:
          item.productId,

        quantity:
          item.quantity,

        price:
          Number(
            item.price
          ),

        subtotal:
          Number(
            item.price
          ) *
          item.quantity,

        product: {
          id:
            item.product.id,

          name:
            item.product.name,

          unit:
            (item.product as unknown as { unit?: string }).unit ?? "",

          stock:
            item.product.stock,

          image:
            item.product.images?.[0]
              ?.image ?? null,
        },
      })
    );

  /**
   * ==========================================================
   * SERIALIZE PAYMENT CHANNELS
   * ==========================================================
   */

  const serializedPaymentChannels =
    paymentChannels.map(
      (channel) => ({
        id:
          channel.id,

        name:
          channel.name,

        type:
          channel.type,

        bankName:
          channel.bankName,

        accountNumber:
          channel.accountNumber,

        accountHolder:
          channel.accountHolder,

        instructions:
          channel.instructions,

        description:
          channel.description,

        icon:
          channel.icon,

        sortOrder:
          channel.sortOrder,
      })
    );

  /**
   * ==========================================================
   * SERIALIZE INTERNAL SHIPPING
   *
   * IMPORTANT:
   * Semua Decimal dari Prisma dikonversi menjadi
   * JavaScript number agar aman dikirim ke Client Component.
   * ==========================================================
   */

  const internalShipping = {
    /**
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     */

    enabled:
      settings.internalShippingEnabled,

    /**
     * --------------------------------------------------------
     * SERVICE NAME
     * --------------------------------------------------------
     */

    name:
      settings.internalShippingName ??
      "Kurir Internal",

    /**
     * --------------------------------------------------------
     * STORE LOCATION / SHIPPING ORIGIN
     * --------------------------------------------------------
     */

    storeLocation: {
      latitude:
        settings.latitude !== null
          ? Number(
            settings.latitude
          )
          : null,

      longitude:
        settings.longitude !== null
          ? Number(
            settings.longitude
          )
          : null,
    },

    /**
     * --------------------------------------------------------
     * SHIPPING CONFIGURATION
     * --------------------------------------------------------
     */

    baseFee:
      Number(
        settings.internalShippingBaseFee
      ),

    perKmFee:
      Number(
        settings.internalShippingPerKmFee
      ),

    maxDistanceKm:
      Number(
        settings.internalShippingMaxDistance
      ),

    freeShippingThreshold:
      settings.internalShippingFreeThreshold !==
        null
        ? Number(
          settings.internalShippingFreeThreshold
        )
        : null,
  };

  /**
   * ==========================================================
   * RENDER CHECKOUT FORM
   * ==========================================================
   */

  return (
    <CheckoutForm
      addresses={
        serializedAddresses
      }
      items={
        serializedItems
      }
      subtotal={
        subtotal
      }
      paymentChannels={
        serializedPaymentChannels
      }
      internalShipping={
        internalShipping
      }
    />
  );
}