import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  StickyNote,
} from "lucide-react";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";

import CartQuantityControl from "@/components/customer/cart/CartQuantityControl";

import DeleteCartItemButton from "@/components/customer/cart/DeleteCartItemButton";

import {
  serializePrisma,
} from "@/lib/serialize-prisma";

/**
 * ============================================================
 * FORMAT RUPIAH
 * ============================================================
 */

function formatRupiah(value: unknown) {
  const amount = Number(value);

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  );
}

/**
 * ============================================================
 * CUSTOMER CART PAGE
 * ============================================================
 */

export default async function CartPage() {
  /**
   * ==========================================================
   * AUTH
   * ==========================================================
   */

  const session =
    await auth();

  /**
   * ==========================================================
   * USER BELUM LOGIN
   * ==========================================================
   */

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-slate-400" />

          <h1 className="text-2xl font-bold text-slate-900">
            Silakan Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Anda harus login untuk melihat keranjang.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  /**
   * ==========================================================
   * GET CART
   * ==========================================================
   */

  const cart =
    await CartService.getCart(
      session.user.id
    );

  /**
   * ==========================================================
   * SERIALIZE PRISMA DATA
   * ==========================================================
   */

  const serializedCart =
    serializePrisma(cart);

  /**
   * ==========================================================
   * CART ITEMS
   * ==========================================================
   */

  const items =
    serializedCart?.items ?? [];

  /**
   * ==========================================================
   * SUBTOTAL
   * ==========================================================
   */

  const subtotal =
    items.reduce(
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
   * PAGE
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />

            Kembali ke Produk
          </Link>

          <div className="mt-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  Keranjang Saya
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {totalItems > 0
                    ? `${totalItems} item siap untuk checkout.`
                    : "Keranjang Anda masih kosong."}
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* CONTENT */}
      {/* ================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {items.length === 0 ? (

          /* ============================================== */
          /* EMPTY CART */
          /* ============================================== */

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">

            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Keranjang masih kosong
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Pilih produk seafood favorit Anda
              dan tambahkan ke keranjang untuk
              melanjutkan pembelian.
            </p>

            <Link
              href="/customer/products"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-cyan-600 px-6 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Jelajahi Produk

              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

        ) : (

          /* ============================================== */
          /* CART CONTENT */
          /* ============================================== */

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* ============================================ */}
            {/* CART ITEMS */}
            {/* ============================================ */}

            <div className="space-y-4">

              {items.map((item) => {

                /**
                 * ==========================================
                 * PRODUCT IMAGE
                 * ==========================================
                 */

                const image =
                  item.product.images?.[0]
                    ?.image;

                /**
                 * ==========================================
                 * ITEM SUBTOTAL
                 * ==========================================
                 */

                const itemSubtotal =
                  Number(item.price) *
                  item.quantity;

                /**
                 * ==========================================
                 * NORMALIZE CUSTOMER NOTE
                 * ==========================================
                 */

                const customerNote =
                  typeof item.customerNote ===
                  "string"
                    ? item.customerNote.trim()
                    : "";

                return (
                  <div
  key={item.id}
  className="
    group
    relative

    rounded-3xl

    border
    border-white/80

    bg-white/90

    p-5

    shadow-[0_4px_18px_rgba(23,50,77,0.06)]

    backdrop-blur-sm

    transition-all
    duration-300
    ease-out

    active:scale-[0.99]

    sm:hover:-translate-y-0.5
    sm:hover:border-(--fresh-200)
    sm:hover:bg-white
    sm:hover:shadow-[0_14px_34px_rgba(23,50,77,0.10)]
  "
>

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                      {/* ================================== */}
                      {/* PRODUCT IMAGE */}
                      {/* ================================== */}

                      <div
  className="
    relative

    flex
    h-28
    w-28
    shrink-0
    items-center
    justify-center

    overflow-hidden

    rounded-2xl

    bg-linear-to-br
    from-(--ice-100)
    via-white
    to-(--fresh-100)

    ring-1
    ring-white/80

    transition-all
    duration-300

    sm:group-hover:shadow-[0_8px_20px_rgba(23,50,77,0.10)]
  "
>

                        {image ? (

                          <img
  src={image}
  alt={
    item.product.name
  }
  className="
    h-full
    w-full

    object-cover

    transition-transform
    duration-500
    ease-out

    sm:group-hover:scale-[1.035]
  "
/>

                        ) : (

                          <ShoppingBag className="h-8 w-8 text-slate-300" />

                        )}

                      </div>

                      {/* ================================== */}
                      {/* PRODUCT INFORMATION */}
                      {/* ================================== */}

                      <div className="min-w-0 flex-1">

                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                          {item.product.category?.name ??
                            "Seafood"}
                        </p>

                        <h2 className="mt-1 truncate text-lg font-bold text-slate-950">
                          {item.product.name}
                        </h2>

                        {/* ================================ */}
                        {/* VARIANT + WEIGHT */}
                        {/* ================================ */}

                        {(item.productVariant ||
                          item.productWeight) && (

                          <div className="mt-3 flex flex-wrap gap-2">

                            {item.productVariant && (

                              <span className="
  rounded-full

  border
  border-slate-100

  bg-slate-50/80

  px-3
  py-1

  text-xs
  font-medium
  text-slate-600

  transition-colors
  duration-200

  sm:group-hover:bg-white
">
                                Varian:{" "}
                                {item.productVariant}
                              </span>

                            )}

                            {item.productWeight && (

                              <span className="
  rounded-full

  border
  border-slate-100

  bg-slate-50/80

  px-3
  py-1

  text-xs
  font-medium
  text-slate-600

  transition-colors
  duration-200

  sm:group-hover:bg-white
">
                                Berat:{" "}
                                {item.productWeight}
                              </span>

                            )}

                          </div>

                        )}

                        {/* ================================ */}
                        {/* CUSTOMER NOTE */}
                        {/* ================================ */}

                        {customerNote && (

                          <div
  className="
    mt-4

    rounded-2xl

    border
    border-cyan-100/80

    bg-linear-to-br
    from-cyan-50/80
    to-white

    p-3

    shadow-[0_2px_8px_rgba(8,145,178,0.05)]
  "
>

                            <div className="flex items-start gap-2">

                              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />

                              <div className="min-w-0">

                                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                                  Pesan untuk Penjual
                                </p>

                                <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
                                  {customerNote}
                                </p>

                              </div>

                            </div>

                          </div>

                        )}

                        {/* ================================ */}
                        {/* DELETE BUTTON */}
                        {/* ================================ */}

                        <div className="mt-4 flex items-center gap-3">

                          <DeleteCartItemButton
                            cartItemId={item.id}
                          />

                        </div>

                      </div>

                      {/* ================================== */}
                      {/* QUANTITY + SUBTOTAL */}
                      {/* ================================== */}

                      <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end">

                        <CartQuantityControl
                          cartItemId={item.id}
                          initialQuantity={
                            item.quantity
                          }
                          maxQuantity={
                            item.product.stock
                          }
                        />

                        <p
  className="
    whitespace-nowrap

    rounded-xl

    bg-slate-50/80

    px-3
    py-2

    text-lg
    font-bold
    text-slate-950

    ring-1
    ring-slate-100
  "
>
                          {formatRupiah(
                            itemSubtotal
                          )}
                        </p>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* ============================================ */}
            {/* ORDER SUMMARY */}
            {/* ============================================ */}

            <aside className="lg:sticky lg:top-24 lg:self-start">

              <div
  className="
    overflow-hidden

    rounded-3xl

    border
    border-white/80

    bg-white/90

    p-6

    shadow-[0_8px_28px_rgba(23,50,77,0.08)]

    backdrop-blur-md
  "
>

                <h2 className="text-lg font-bold text-slate-950">
                  Ringkasan Pesanan
                </h2>

                <div className="mt-6 space-y-4 text-sm">

                  <div className="flex items-center justify-between">

                    <span className="text-slate-500">
                      Total item
                    </span>

                    <span className="font-semibold text-slate-900">
                      {totalItems}
                    </span>

                  </div>

                  <div
  className="
    flex
    items-center
    justify-between
    gap-4

    rounded-2xl

    border
    border-(--fresh-100)

    bg-linear-to-r
    from-(--fresh-50)
    via-white
    to-(--ice-50)

    px-4
    py-4
  "
>
  <div>
    <span className="text-sm font-medium text-slate-600">
      Total Pesanan
    </span>

    <p className="mt-1 text-xs text-slate-400">
      Belum termasuk ongkos kirim
    </p>
  </div>

  <span
    className="
      whitespace-nowrap

      text-xl
      font-bold

      text-slate-950
    "
  >
    {formatRupiah(
      subtotal
    )}
  </span>
</div>

                </div>

                <div className="my-6 border-t border-slate-100" />

                <div className="flex items-center justify-between">

                  <span className="font-semibold text-slate-900">
                    Total
                  </span>

                  <span className="text-xl font-bold text-slate-950">
                    {formatRupiah(
                      subtotal
                    )}
                  </span>

                </div>

                <Link
  href="/customer/checkout"
  className="
    group

    mt-6

    flex
    h-13
    items-center
    justify-center
    gap-2

    rounded-2xl

    bg-linear-to-r
    from-cyan-600
    via-sky-600
    to-cyan-600

    bg-size-[200%_100%]
    bg-position-left

    px-6

    text-sm
    font-semibold
    text-white

    shadow-[0_8px_20px_rgba(8,145,178,0.24)]

    transition-all
    duration-300
    ease-out

    active:scale-[0.98]

    sm:hover:-translate-y-0.5
    sm:hover:bg-position-right
    sm:hover:shadow-[0_12px_28px_rgba(8,145,178,0.30)]
  "
>
                  Lanjut Checkout

                  <ArrowRight
  className="
    h-4
    w-4

    transition-transform
    duration-300

    sm:group-hover:translate-x-1
  "
/>
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  Alamat dan lokasi pengiriman
                  akan dipilih pada tahap checkout.
                </p>

              </div>

            </aside>

          </div>

        )}

      </section>

    </main>
  );
}