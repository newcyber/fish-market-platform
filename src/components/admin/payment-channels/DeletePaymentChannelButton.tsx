"use client";

import { useState, useTransition } from "react";

import { Trash2, X } from "lucide-react";

import { deletePaymentChannelAction } from "@/actions/payment/payment-channel.actions";

interface DeletePaymentChannelButtonProps {
  id: string;
  name: string;
}

export default function DeletePaymentChannelButton({
  id,
  name,
}: DeletePaymentChannelButtonProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [isPending, startTransition] =
    useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result =
        await deletePaymentChannelAction(
          id
        );

      if (!result.success) {
        window.alert(
          result.message ??
            "Gagal menghapus metode pembayaran."
        );

        return;
      }

      setIsOpen(false);

      window.alert(
        "Metode pembayaran berhasil dihapus."
      );
    });
  }

  return (
    <>
      {/* DELETE BUTTON */}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="
          inline-flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-red-200
          bg-white
          text-red-500
          transition
          hover:bg-red-50
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
        title="Hapus metode pembayaran"
        aria-label="Hapus metode pembayaran"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* CONFIRMATION MODAL */}

      {isOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >
          <div
            className="
              relative
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
          >
            {/* CLOSE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setIsOpen(false)
              }
              disabled={isPending}
              className="
                absolute
                right-4
                top-4
                rounded-lg
                p-2
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
                disabled:opacity-50
              "
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* CONTENT */}

            <div className="pr-10">
              <div
                className="
                  mb-4
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-red-100
                  text-red-600
                "
              >
                <Trash2 className="h-6 w-6" />
              </div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-slate-900
                "
              >
                Hapus Metode Pembayaran?
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Anda akan menghapus metode pembayaran
                <span className="font-semibold text-slate-700">
                  {" "}
                  {name}
                </span>
                .
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  text-red-500
                "
              >
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {/* ACTIONS */}

            <div
              className="
                mt-6
                flex
                justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                disabled={isPending}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Trash2 className="h-4 w-4" />

                {isPending
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}