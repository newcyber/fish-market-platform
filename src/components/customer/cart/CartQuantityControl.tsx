"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Minus,
  Plus,
  Loader2,
} from "lucide-react";

import { updateCartItemAction } from "@/actions/cart/update-cart-item";

interface CartQuantityControlProps {
  cartItemId: string;
  initialQuantity: number;
  maxQuantity: number;
}

export default function CartQuantityControl({
  cartItemId,
  initialQuantity,
  maxQuantity,
}: CartQuantityControlProps) {
  const [
    quantity,
    setQuantity,
  ] = useState(
    initialQuantity
  );

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  function updateQuantity(
    newQuantity: number
  ) {
    /**
     * Jangan kurang dari 1.
     */
    if (
      newQuantity < 1
    ) {
      return;
    }

    /**
     * Jangan melebihi stock.
     */
    if (
      newQuantity > maxQuantity
    ) {
      setMessage(
        `Stok maksimal tersedia ${maxQuantity}.`
      );

      return;
    }

    const previousQuantity =
      quantity;

    /**
     * Optimistic UI.
     *
     * Quantity langsung berubah
     * sebelum database selesai update.
     */
    setQuantity(
      newQuantity
    );

    setMessage(null);

    startTransition(
      async () => {
        const result =
          await updateCartItemAction(
            cartItemId,
            newQuantity
          );

        if (!result.success) {
          /**
           * Kembalikan quantity lama
           * jika update gagal.
           */
          setQuantity(
            previousQuantity
          );

          setMessage(
            result.message ??
              "Gagal memperbarui jumlah."
          );

          return;
        }

        setMessage(
          result.message ??
            null
        );
      }
    );
  }

  const isDecreaseDisabled =
    isPending ||
    quantity <= 1;

  const isIncreaseDisabled =
    isPending ||
    quantity >= maxQuantity;

  return (
    <div
      className="
        flex
        flex-col
        items-end
        gap-2
      "
    >
      <div
        className="
          group/quantity

          relative

          flex
          h-11
          items-center

          overflow-hidden

          rounded-2xl

          border
          border-white/80

          bg-white/90

          p-1

          shadow-[0_3px_12px_rgba(23,50,77,0.06)]

          ring-1
          ring-slate-100/80

          backdrop-blur-sm

          transition-all
          duration-300
          ease-out

          sm:hover:border-(--fresh-100)
          sm:hover:bg-white
          sm:hover:shadow-[0_8px_20px_rgba(23,50,77,0.10)]
        "
      >
        {/* ================================================
            DECREASE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            updateQuantity(
              quantity - 1
            )
          }
          disabled={
            isDecreaseDisabled
          }
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center

            rounded-xl

            border
            border-transparent

            text-slate-500

            transition-all
            duration-200
            ease-out

            active:scale-90

            sm:hover:border-slate-100
            sm:hover:bg-slate-50
            sm:hover:text-slate-900

            disabled:cursor-not-allowed
            disabled:opacity-35
            disabled:active:scale-100
            disabled:sm:hover:border-transparent
            disabled:sm:hover:bg-transparent
            disabled:sm:hover:text-slate-500
          "
          aria-label="Kurangi jumlah"
        >
          <Minus
            className="
              h-4
              w-4

              transition-transform
              duration-200

              sm:group-hover/quantity:scale-110
            "
          />
        </button>

        {/* ================================================
            QUANTITY DISPLAY
        ================================================= */}

        <div
          className="
            relative

            flex
            h-9
            min-w-11
            items-center
            justify-center

            overflow-hidden

            rounded-xl

            bg-slate-50/80

            px-2

            ring-1
            ring-slate-100
          "
          aria-live="polite"
          aria-atomic="true"
        >
          {isPending ? (
            <Loader2
              className="
                h-4
                w-4

                animate-spin

                text-(--fresh-500)
              "
            />
          ) : (
            <span
              key={quantity}
              className="
                quantity-value-pop

                text-sm
                font-bold
                tabular-nums

                text-slate-900
              "
            >
              {quantity}
            </span>
          )}
        </div>

        {/* ================================================
            INCREASE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={() =>
            updateQuantity(
              quantity + 1
            )
          }
          disabled={
            isIncreaseDisabled
          }
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center

            rounded-xl

            bg-(--fresh-500)

            text-white

            shadow-[0_3px_8px_rgba(34,139,74,0.20)]

            transition-all
            duration-200
            ease-out

            active:scale-90

            sm:hover:-translate-y-px
            sm:hover:bg-(--fresh-600)
            sm:hover:shadow-[0_5px_12px_rgba(34,139,74,0.28)]

            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-400
            disabled:shadow-none
            disabled:active:scale-100
            disabled:sm:hover:translate-y-0
          "
          aria-label="Tambah jumlah"
        >
          <Plus
            className="
              h-4
              w-4

              transition-transform
              duration-200

              sm:group-hover/quantity:scale-110
            "
          />
        </button>
      </div>

      {/* ================================================
          STATUS MESSAGE
      ================================================= */}

      {message && (
        <p
          className="
            max-w-[220px]

            rounded-lg

            bg-slate-50/80

            px-2
            py-1

            text-right
            text-xs

            text-slate-500
          "
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}