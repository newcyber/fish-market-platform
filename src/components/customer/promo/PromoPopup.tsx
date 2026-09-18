"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface PromoPopupProps {
  enabled: boolean;
  image: string | null;
  alt?: string | null;
  href?: string | null;
  delay?: number;
  version?: string | null;
  rememberClose?: boolean;
}

/**
 * ============================================================
 * PROMO POPUP
 * ============================================================
 *
 * Popup promosi customer homepage.
 *
 * Mendukung:
 * - PNG transparan
 * - WEBP transparan
 * - JPG/JPEG
 * - delay tampil
 * - campaign version
 * - remember close
 * - optional link
 *
 * Catatan:
 * Container popup sengaja menggunakan background TRANSPARENT
 * agar alpha channel pada PNG/WEBP tetap terlihat.
 * ============================================================
 */

export default function PromoPopup({
  enabled,
  image,
  alt,
  href,
  delay = 1200,
  version = null,
  rememberClose = true,
}: PromoPopupProps) {
  const [open, setOpen] = useState(false);

  /**
   * ==========================================================
   * NORMALIZE CAMPAIGN VERSION
   * ==========================================================
   */

  const campaignVersion =
    version?.trim() || "default";

  /**
   * ==========================================================
   * LOCAL STORAGE KEY
   * ==========================================================
   */

  const storageKey =
    `pisjo-promo-popup:${campaignVersion}`;

  /**
   * ==========================================================
   * SHOW POPUP
   * ==========================================================
   */

  useEffect(() => {
    if (!enabled || !image) {
      return;
    }

    /**
     * Hindari akses localStorage saat server rendering.
     */
    if (typeof window === "undefined") {
      return;
    }

    /**
     * Jika rememberClose aktif dan campaign sudah pernah
     * ditutup, popup tidak perlu ditampilkan kembali.
     */
    if (rememberClose) {
      try {
        const alreadyClosed =
          window.localStorage.getItem(storageKey);

        if (alreadyClosed === "1") {
          return;
        }
      } catch {
        /**
         * Jika localStorage gagal diakses, popup tetap
         * boleh ditampilkan.
         */
      }
    }

    /**
     * Batasi delay agar tidak terlalu ekstrem.
     */
    const safeDelay = Math.min(
      Math.max(Number(delay) || 0, 0),
      10000
    );

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, safeDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    enabled,
    image,
    delay,
    rememberClose,
    storageKey,
  ]);

  /**
   * ==========================================================
   * CLOSE POPUP
   * ==========================================================
   */

  const handleClose = () => {
    setOpen(false);

    if (
      rememberClose &&
      typeof window !== "undefined"
    ) {
      try {
        window.localStorage.setItem(
          storageKey,
          "1"
        );
      } catch {
        /**
         * Abaikan jika localStorage tidak tersedia.
         */
      }
    }
  };

  /**
   * ==========================================================
   * ESC KEY
   * ==========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  /**
   * ==========================================================
   * BODY SCROLL LOCK
   * ==========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /**
   * ==========================================================
   * GUARD
   * ==========================================================
   */

  if (!enabled || !image || !open) {
    return null;
  }

  /**
   * ==========================================================
   * POPUP CONTENT
   * ==========================================================
   */

  const imageContent = (
    <div
      className="
        relative
        flex
        max-h-[88vh]
        max-w-[94vw]
        items-center
        justify-center
        sm:max-h-[90vh]
        sm:max-w-[720px]
      "
    >
      <Image
        src={image}
        alt={
          alt?.trim() ||
          "Promo Pisjo Market"
        }
        width={900}
        height={1200}
        priority
        unoptimized
        className="
          block
          h-auto
          max-h-[88vh]
          w-auto
          max-w-[94vw]
          object-contain
          sm:max-h-[90vh]
          sm:max-w-[720px]
        "
        sizes="
          (max-width: 640px) 94vw,
          (max-width: 1024px) 80vw,
          720px
        "
      />
    </div>
  );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        p-3
        sm:p-6
      "
      role="dialog"
      aria-modal="true"
      aria-label={
        alt?.trim() ||
        "Promo Pisjo Market"
      }
    >
      {/* ======================================================
          BACKDROP
          ====================================================== */}

      <button
        type="button"
        aria-label="Tutup promo"
        onClick={handleClose}
        className="
          absolute
          inset-0
          cursor-default
          bg-black/65
          backdrop-blur-[2px]
        "
      />

      {/* ======================================================
          POPUP WRAPPER

          PENTING:
          Tidak menggunakan bg-white.
          Tidak menggunakan background apa pun.

          Ini memungkinkan transparansi PNG/WEBP tetap terlihat.
          ====================================================== */}

      <div
        className="
          relative
          z-10
          flex
          max-h-[92vh]
          max-w-[96vw]
          items-center
          justify-center
          bg-transparent
        "
      >
        {/* ====================================================
            IMAGE / LINK
            ==================================================== */}

        {href?.trim() ? (
          <a
            href={href.trim()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              alt?.trim() ||
              "Lihat promo Pisjo Market"
            }
            className="
              block
              bg-transparent
              outline-none
              focus-visible:ring-2
              focus-visible:ring-white
              focus-visible:ring-offset-2
              focus-visible:ring-offset-transparent
            "
          >
            {imageContent}
          </a>
        ) : (
          imageContent
        )}

        {/* ====================================================
            CLOSE BUTTON

            Tombol berada di luar gambar sehingga tetap terlihat
            meskipun gambar memiliki background transparan.
            ==================================================== */}

        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup popup"
          className="
            absolute
            right-1
            top-1
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-white/80
            bg-black/65
            text-2xl
            font-semibold
            leading-none
            text-white
            shadow-[0_4px_20px_rgba(0,0,0,0.35)]
            backdrop-blur-sm
            transition
            hover:scale-105
            hover:bg-black/80
            active:scale-95
            sm:-right-3
            sm:-top-3
          "
        >
          <span
            aria-hidden="true"
            className="
              -mt-0.5
              block
            "
          >
            ×
          </span>
        </button>
      </div>
    </div>
  );
}