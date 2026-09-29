import Link from "next/link";
import { cookies } from "next/headers";

import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import { auth } from "@/auth";

import CartService from "@/services/cart/cart.service";
import { VoucherRepository } from "@/repositories/voucher/voucher.repository";
import { VoucherService } from "@/services/voucher/voucher.service";

import CartSelection from "@/components/customer/cart/CartSelection";
import CartPromoSection from "@/components/customer/cart/CartPromoSection";

import {
  serializePrisma,
} from "@/lib/serialize-prisma";

/**
 * ============================================================
 * CUSTOMER / GUEST CART PAGE
 * ============================================================
 *
 * Cart bersifat PUBLIC.
 *
 * CUSTOMER
 * ------------------------------------------------------------
 * session.user.id
 *
 * GUEST
 * ------------------------------------------------------------
 * guestCartId httpOnly cookie
 *
 * Guest boleh:
 * - membuka cart
 * - melihat item
 * - mengubah quantity
 * - menghapus item
 *
 * Login baru diperlukan ketika checkout.
 *
 * ============================================================
 */

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<{
    selected?: string;
    voucher?: string;
  }>;
}) {
  /**
   * ==========================================================
   * AUTH / CART OWNER
   * ==========================================================
   */

  const session =
    await auth();

  const cookieStore =
    await cookies();

  const guestCartId =
    cookieStore.get(
      "guestCartId"
    )?.value;

  /**
   * ==========================================================
   * GET CART
   * ==========================================================
   *
   * Customer:
   *   ambil cart berdasarkan userId
   *
   * Guest:
   *   ambil cart berdasarkan guestCartId
   *
   * Guest tanpa cookie:
   *   cart = null
   */

  const cart =
    session?.user?.id
      ? await CartService.getCart({
          type: "customer",
          userId:
            session.user.id,
        })
      : guestCartId
        ? await CartService.getCart({
            type: "guest",
            guestCartId,
          })
        : null;

  /**
   * ==========================================================
   * SERIALIZE PRISMA DATA
   * ==========================================================
   *
   * Cart dapat mengandung Prisma.Decimal.
   *
   * Serialize sebelum diteruskan
   * ke Client Component.
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
   * ACTIVE VOUCHER PREVIEW
   * ==========================================================
   *
   * Voucher pada Cart divalidasi ulang di server berdasarkan
   * item yang sedang dipilih. Jadi angka diskon yang ditampilkan
   * di Cart tidak berasal dari query string yang bisa dimanipulasi.
   *
   * Checkout tetap melakukan validasi ulang sebelum membuat order.
   */
  const resolvedSearchParams = searchParams
    ? await searchParams
    : {};

  const selectedIds = resolvedSearchParams.selected
    ? new Set(
        resolvedSearchParams.selected
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      )
    : new Set(items.map((item) => item.id));

  const selectedSubtotal = items.reduce((total, item) => {
    if (!selectedIds.has(item.id)) {
      return total;
    }

    return total + Number(item.price) * Number(item.quantity);
  }, 0);

  let voucherDiscount = 0;
  let appliedVoucher:
    | {
        id: string;
        code: string;
        name: string;
        type: "DISCOUNT" | "FREE_SHIPPING";
        maximumShippingDiscount: number | null;
      }
    | null = null;

  if (
    session?.user?.id &&
    resolvedSearchParams.voucher &&
    selectedSubtotal > 0
  ) {
    try {
      const voucher = await VoucherRepository.findById(
        resolvedSearchParams.voucher,
      );

      if (voucher && voucher.type === "DISCOUNT") {
        const calculation =
          await VoucherService.validateAndCalculate({
            code: voucher.code,
            userId: session.user.id,
            subtotal: selectedSubtotal,
          });

        // Cart hanya mendukung voucher potongan harga.
        // Gratis ongkir menunggu perhitungan ongkir di Checkout.
        if (calculation.voucher.type !== "DISCOUNT") {
          throw new Error("Voucher gratis ongkir hanya dapat digunakan di Checkout.");
        }

        voucherDiscount = calculation.discountAmount.toNumber();

        appliedVoucher = {
          id: calculation.voucher.id,
          code: calculation.voucher.code,
          name: calculation.voucher.name,
          type: calculation.voucher.type,
          maximumShippingDiscount:
            calculation.voucher.maximumShippingDiscount?.toNumber() ?? null,
        };
      }
    } catch {
      // Voucher invalid terhadap selection saat ini.
      // Checkout tidak akan membawa voucher yang tidak tervalidasi.
    }
  }

  /**
   * ==========================================================
   * TOTAL CART ITEMS
   * ==========================================================
   *
   * Ini adalah jumlah seluruh quantity
   * yang berada di cart.
   *
   * BUKAN jumlah item yang dipilih
   * untuk checkout.
   *
   * Selection checkout ditangani oleh
   * CartSelection.
   */

  const totalItems =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity
        ),
      0
    );

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <main
      className="
        min-h-screen
        bg-slate-50
        pb-28
      "
    >

      {/* ==================================================== */}
      {/* HEADER                                               */}
      {/* ==================================================== */}

      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-slate-200
          bg-white
        "
      >
        <div
          className="
            mx-auto
            flex
            h-14
            max-w-6xl
            items-center
            px-4
            sm:h-16
            sm:px-6
          "
        >

          {/* ---------------------------------------------- */}
          {/* BACK BUTTON                                    */}
          {/* ---------------------------------------------- */}

          <Link
            href="/products"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              transition
              hover:bg-slate-100
              active:scale-95
            "
            aria-label="Kembali ke produk"
          >
            <ArrowLeft
              className="
                h-5
                w-5
                text-slate-900
              "
            />
          </Link>

          {/* ---------------------------------------------- */}
          {/* TITLE                                          */}
          {/* ---------------------------------------------- */}

          <div
            className="
              ml-2
              min-w-0
            "
          >
<h1 className="truncate text-lg font-bold text-slate-950">
  Keranjang Saya
</h1>

            <p
              className="
                text-[11px]
                text-slate-500
              "
            >
              {totalItems} produk
            </p>
          </div>

        </div>
      </header>

      {/* ==================================================== */}
      {/* EMPTY CART                                           */}
      {/* ==================================================== */}

      {items.length === 0 ? (

        <section
          className="
            mx-auto
            max-w-2xl
            px-4
            py-16
            sm:px-6
          "
        >

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-6
              py-14
              text-center
            "
          >

            {/* -------------------------------------------- */}
            {/* ICON                                         */}
            {/* -------------------------------------------- */}

            <ShoppingBag
              className="
                mx-auto
                h-12
                w-12
                text-slate-300
              "
            />

            {/* -------------------------------------------- */}
            {/* TITLE                                        */}
            {/* -------------------------------------------- */}

            <h2
              className="
                mt-4
                text-lg
                font-bold
                text-slate-950
              "
            >
              Keranjang masih kosong
            </h2>

            {/* -------------------------------------------- */}
            {/* DESCRIPTION                                  */}
            {/* -------------------------------------------- */}

            <p
              className="
                mx-auto
                mt-2
                max-w-sm
                text-sm
                leading-6
                text-slate-500
              "
            >
              Pilih produk seafood favorit
              Anda dan tambahkan ke
              keranjang untuk melanjutkan
              pembelian.
            </p>

            {/* -------------------------------------------- */}
            {/* PRODUCT BUTTON                               */}
            {/* -------------------------------------------- */}

            <Link
              href="/products"
              className="
                mt-6
                inline-flex
                h-11
                items-center
                gap-2
                rounded-xl
                bg-emerald-600
                px-6
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-emerald-700
                active:scale-[0.98]
              "
            >
              Jelajahi Produk

              <ArrowRight
                className="
                  h-4
                  w-4
                "
              />
            </Link>

          </div>

        </section>

      ) : (

        <>
          {/* ================================================= */}
          {/* CART CONTAINER                                    */}
          {/* ================================================= */}

          <div
            className="
              mx-auto
              max-w-6xl
            "
          >

            {/* =============================================== */}
            {/* CART CONTENT                                    */}
            {/* =============================================== */}

            <div
              className="
                px-0
                sm:px-4
                lg:px-6
              "
            >

              {/* ============================================= */}
              {/* CART ITEMS                                    */}
              {/* ============================================= */}

              <section
                className="
                  overflow-hidden
                  bg-white
                  lg:mt-5
                  lg:rounded-2xl
                  lg:border
                  lg:border-slate-200
                "
              >

                {/* ----------------------------------------- */}
                {/* SELECTION + ITEMS + CHECKOUT              */}
                {/* ----------------------------------------- */}

                <CartSelection
                  items={items}
                  voucherDiscount={voucherDiscount}
                  appliedVoucherId={appliedVoucher?.id ?? null}
                />

                {/* ========================================== */}
                {/* PROMO SECTION                              */}
                {/* ========================================== */}

                <CartPromoSection
                  items={items.map((item) => ({
                    ...item,
                    price: Number(item.price),
                  }))}
                  appliedVoucherId={appliedVoucher?.id ?? null}
                />

              </section>

            </div>

          </div>

        </>
      )}

    </main>
  );
}
