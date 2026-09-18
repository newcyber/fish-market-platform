"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

import {
  updateImagePopupSettingsAction,
} from "@/actions/admin/settings/update-image-popup-settings";

interface PromoPopupSettings {
  promoPopupEnabled: boolean;
  promoPopupImage: string | null;
  promoPopupAlt: string | null;
  promoPopupHref: string | null;
  promoPopupDelay: number;
  promoPopupVersion: string | null;
  promoPopupRememberClose: boolean;
}

interface PromoPopupSettingsFormProps {
  settings: PromoPopupSettings;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
];

export default function PromoPopupSettingsForm({
  settings,
}: PromoPopupSettingsFormProps) {
  const [promoPopupEnabled, setPromoPopupEnabled] =
    useState(settings.promoPopupEnabled);

  const [promoPopupImage, setPromoPopupImage] =
    useState<string | null>(
      settings.promoPopupImage
    );

  const [promoPopupAlt, setPromoPopupAlt] =
    useState(settings.promoPopupAlt ?? "");

  const [promoPopupHref, setPromoPopupHref] =
    useState(settings.promoPopupHref ?? "");

  const [promoPopupDelay, setPromoPopupDelay] =
    useState(
      settings.promoPopupDelay ?? 1200
    );

  const [promoPopupVersion, setPromoPopupVersion] =
    useState(
      settings.promoPopupVersion ?? ""
    );

  const [
    promoPopupRememberClose,
    setPromoPopupRememberClose,
  ] = useState(
    settings.promoPopupRememberClose ?? true
  );

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState<boolean | null>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isPending, startTransition] =
    useTransition();

  const imageInputRef =
    useRef<HTMLInputElement | null>(null);

  /**
   * ==========================================================
   * UPLOAD IMAGE
   * ==========================================================
   */

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage(null);
    setIsSuccess(null);

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      setMessage(
        "Format gambar harus PNG, WEBP, atau GIF."
      );

      setIsSuccess(false);
      return;
    }

    if (
      file.size <= 0 ||
      file.size > MAX_IMAGE_SIZE
    ) {
      setMessage(
        "Ukuran gambar maksimal 5 MB."
      );

      setIsSuccess(false);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      const response = await fetch(
        "/api/settings/promo-popup-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.imageUrl
      ) {
        throw new Error(
          result.message ||
            "Gagal mengupload gambar popup."
        );
      }

      setPromoPopupImage(
        result.imageUrl
      );

      setMessage(
        "Gambar berhasil diupload. Jangan lupa klik Simpan Pengaturan."
      );

      setIsSuccess(true);
    } catch (error) {
      console.error(
        "Failed to upload promo popup image:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengupload gambar."
      );

      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * ==========================================================
   * REMOVE IMAGE
   * ==========================================================
   */

  function handleRemoveImage() {
    setPromoPopupImage(null);

    setMessage(
      "Gambar popup akan dihapus setelah Anda menyimpan pengaturan."
    );

    setIsSuccess(true);
  }

  /**
   * ==========================================================
   * SAVE
   * ==========================================================
   */

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage(null);
    setIsSuccess(null);

    const safeDelay = Math.min(
      Math.max(
        Number(promoPopupDelay) || 1200,
        0
      ),
      10000
    );

    startTransition(async () => {
      const result =
        await updateImagePopupSettingsAction({
          promoPopupEnabled,
          promoPopupImage,
          promoPopupAlt:
            promoPopupAlt.trim() || null,
          promoPopupHref:
            promoPopupHref.trim() || null,
          promoPopupDelay: safeDelay,
          promoPopupVersion:
            promoPopupVersion.trim() || null,
          promoPopupRememberClose,
        });

      setMessage(
        result.message
      );

      setIsSuccess(
        result.success
      );

      if (result.success) {
        setPromoPopupDelay(
          safeDelay
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ====================================================
          STATUS
          ==================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Status Popup
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Aktifkan atau nonaktifkan popup promosi
            pada homepage.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={promoPopupEnabled}
            onChange={(event) =>
              setPromoPopupEnabled(
                event.target.checked
              )
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Aktifkan Image Popup
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              Popup akan muncul otomatis ketika
              pelanggan membuka homepage.
            </span>
          </span>
        </label>
      </section>

      {/* ====================================================
          IMAGE
          ==================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Gambar Popup
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gunakan PNG, WEBP, atau GIF dengan ukuran
            maksimal 5 MB.
          </p>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept=".png,.webp,.gif,image/png,image/webp,image/gif"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
          {promoPopupImage ? (
            <div className="relative">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={promoPopupImage}
                  alt={
                    promoPopupAlt ||
                    "Promo Popup"
                  }
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-white p-4">
                <button
                  type="button"
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                  disabled={
                    isUploading ||
                    isPending
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Ganti Gambar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={
                    isUploading ||
                    isPending
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                imageInputRef.current?.click()
              }
              disabled={
                isUploading ||
                isPending
              }
              className="flex min-h-56 w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              ) : (
                <ImagePlus className="h-8 w-8 text-slate-400" />
              )}

              <span className="text-sm font-semibold text-slate-700">
                {isUploading
                  ? "Mengupload..."
                  : "Upload Gambar Popup"}
              </span>

              <span className="text-xs text-slate-500">
                PNG, WEBP, atau GIF · maksimal 5 MB
              </span>
            </button>
          )}
        </div>
      </section>

      {/* ====================================================
          CONTENT
          ==================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Konten & Link
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Tentukan informasi aksesibilitas dan tujuan
            ketika gambar popup diklik.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="promoPopupAlt"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Alt Text
            </label>

            <input
              id="promoPopupAlt"
              type="text"
              value={promoPopupAlt}
              onChange={(event) =>
                setPromoPopupAlt(
                  event.target.value
                )
              }
              placeholder="Contoh: Promo seafood segar minggu ini"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="promoPopupHref"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Link Popup
            </label>

            <input
              id="promoPopupHref"
              type="text"
              value={promoPopupHref}
              onChange={(event) =>
                setPromoPopupHref(
                  event.target.value
                )
              }
              placeholder="/promotions atau https://..."
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              Kosongkan jika gambar tidak perlu memiliki
              link.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================
          BEHAVIOR
          ==================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Perilaku Popup
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Atur kapan popup muncul dan bagaimana status
            penutupan disimpan.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="promoPopupDelay"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Delay Popup (ms)
            </label>

            <input
              id="promoPopupDelay"
              type="number"
              min={0}
              max={10000}
              step={100}
              value={promoPopupDelay}
              onChange={(event) =>
                setPromoPopupDelay(
                  Number(event.target.value)
                )
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              0–10.000 ms. Default 1.200 ms.
            </p>
          </div>

          <div>
            <label
              htmlFor="promoPopupVersion"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Campaign Version
            </label>

            <input
              id="promoPopupVersion"
              type="text"
              value={promoPopupVersion}
              onChange={(event) =>
                setPromoPopupVersion(
                  event.target.value
                )
              }
              placeholder="contoh: ramadhan-2026"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              Gunakan versi baru agar popup dapat muncul
              kembali pada campaign baru.
            </p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={promoPopupRememberClose}
            onChange={(event) =>
              setPromoPopupRememberClose(
                event.target.checked
              )
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Ingat Popup yang Ditutup
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              Browser akan menyimpan bahwa customer sudah
              menutup popup untuk campaign version tersebut.
            </span>
          </span>
        </label>
      </section>

      {/* ====================================================
          MESSAGE
          ==================================================== */}

      {message && (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      {/* ====================================================
          SAVE
          ==================================================== */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isPending ||
            isUploading
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Pengaturan
            </>
          )}
        </button>
      </div>
    </form>
  );
}