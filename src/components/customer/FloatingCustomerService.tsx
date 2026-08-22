"use client";

import { useState } from "react";

import {
  Headphones,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

interface FloatingCustomerServiceProps {
  whatsapp?: string | null;
}

function normalizeWhatsAppNumber(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  let number = value.replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = `62${number.slice(1)}`;
  }

  if (!number.startsWith("62")) {
    number = `62${number}`;
  }

  return number;
}

export default function FloatingCustomerService({
  whatsapp,
}: FloatingCustomerServiceProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const phoneNumber =
    normalizeWhatsAppNumber(
      whatsapp
    );

  const handleWhatsApp = () => {
    if (!phoneNumber) {
      return;
    }

    const message =
      encodeURIComponent(
        "Halo, saya ingin bertanya mengenai produk."
      );

    window.open(
      `https://wa.me/${phoneNumber}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] hidden lg:block">
      {isOpen && (
        <div
          className="
            absolute
            bottom-16
            right-0
            w-80
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-2xl
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
              bg-[var(--ocean-900)]
              px-5
              py-4
              text-white
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                "
              >
                <Headphones className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Customer Service
                </p>

                <p className="text-xs text-white/70">
                  Kami siap membantu Anda
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsOpen(false)
              }
              className="
                rounded-lg
                p-1.5
                transition
                hover:bg-white/10
              "
              aria-label="Tutup chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* CONTENT */}

          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600">
              Halo 👋
              <br />
              Ada yang bisa kami bantu?
              Silakan hubungi Customer Service kami.
            </p>

            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={!phoneNumber}
              className="
                mt-5
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-emerald-500
                px-4
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-emerald-600
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Send className="h-4 w-4" />

              Chat via WhatsApp
            </button>

            {!phoneNumber && (
              <p className="mt-3 text-center text-xs text-slate-400">
                Nomor WhatsApp Customer Service
                belum tersedia.
              </p>
            )}
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}

      <button
        type="button"
        onClick={() =>
          setIsOpen(
            (previous) =>
              !previous
          )
        }
        className="
          group
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[var(--ocean-900)]
          text-white
          shadow-lg
          transition
          hover:scale-105
          hover:bg-[var(--ocean-800)]
          focus:outline-none
          focus:ring-4
          focus:ring-[var(--ocean-900)]/20
        "
        aria-label={
          isOpen
            ? "Tutup Customer Service"
            : "Buka Customer Service"
        }
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}