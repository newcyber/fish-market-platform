"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CreditCard,
  FileText,
  ImageIcon,
  Loader2,
  QrCode,
  Save,
  ScrollText,
} from "lucide-react";

import {
  createPaymentChannelAction,
} from "@/actions/payment/payment-channel.actions";

type PaymentChannelType =
  | "BANK_TRANSFER"
  | "QRIS";

/**
 * ============================================================
 * CREATE PAYMENT CHANNEL FORM
 * ============================================================
 */

export default function CreatePaymentChannelForm() {
  const router = useRouter();

  /**
   * ==========================================================
   * SUBMIT STATE
   * ==========================================================
   */

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /**
   * ==========================================================
   * PAYMENT CHANNEL STATE
   * ==========================================================
   */

  const [name, setName] =
    useState("");

  const [type, setType] =
    useState<PaymentChannelType>(
      "BANK_TRANSFER"
    );

  /**
   * ==========================================================
   * BANK ACCOUNT STATE
   * ==========================================================
   */

  const [bankName, setBankName] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [accountHolder, setAccountHolder] =
    useState("");

  /**
   * ==========================================================
   * QRIS IMAGE STATE
   * ==========================================================
   */

  const [qrisImage, setQrisImage] =
    useState("");

  /**
   * ==========================================================
   * PAYMENT INFORMATION STATE
   * ==========================================================
   */

  const [description, setDescription] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [icon, setIcon] =
    useState("");

  /**
   * ==========================================================
   * GENERAL STATE
   * ==========================================================
   */

  const [sortOrder, setSortOrder] =
    useState("0");

  const [isActive, setIsActive] =
    useState(true);

  /**
   * ==========================================================
   * HANDLE PAYMENT TYPE CHANGE
   * ==========================================================
   */

  function handleTypeChange(
    value: PaymentChannelType
  ) {
    setType(value);

    /**
     * QRIS tidak menggunakan rekening bank.
     */

    if (value === "QRIS") {
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
    }

    /**
     * BANK TRANSFER tidak menggunakan gambar QRIS.
     */

    if (value === "BANK_TRANSFER") {
      setQrisImage("");
    }
  }

  /**
   * ==========================================================
   * HANDLE SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /**
     * ========================================================
     * VALIDATE NAME
     * ========================================================
     */

    if (!name.trim()) {
      window.alert(
        "Nama metode pembayaran wajib diisi."
      );

      return;
    }

    /**
     * ========================================================
     * VALIDATE BANK TRANSFER
     * ========================================================
     */

    if (type === "BANK_TRANSFER") {
      if (!bankName.trim()) {
        window.alert(
          "Nama bank wajib diisi."
        );

        return;
      }

      if (!accountNumber.trim()) {
        window.alert(
          "Nomor rekening wajib diisi."
        );

        return;
      }

      if (!accountHolder.trim()) {
        window.alert(
          "Nama pemilik rekening wajib diisi."
        );

        return;
      }
    }

    /**
     * ========================================================
     * VALIDATE QRIS
     * ========================================================
     */

    if (type === "QRIS") {
      if (!qrisImage.trim()) {
        window.alert(
          "URL atau path gambar QRIS wajib diisi."
        );

        return;
      }
    }

    setIsSubmitting(true);

    try {
      /**
       * ======================================================
       * NORMALIZE NAME
       * ======================================================
       */

      const normalizedName =
        name.trim();

      /**
       * ======================================================
       * GENERATE SLUG
       * ======================================================
       */

      const slug =
        normalizedName
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9\s-]/g,
            ""
          )
          .replace(
            /\s+/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          );

      /**
       * ======================================================
       * CREATE PAYMENT CHANNEL
       * ======================================================
       */

      const result =
        await createPaymentChannelAction({
          name:
            normalizedName,

          slug,

          type,

          /**
           * BANK ACCOUNT
           */

          bankName:
            type === "BANK_TRANSFER"
              ? bankName.trim() || null
              : null,

          accountNumber:
            type === "BANK_TRANSFER"
              ? accountNumber.trim() || null
              : null,

          accountHolder:
            type === "BANK_TRANSFER"
              ? accountHolder.trim() || null
              : null,

          /**
           * QRIS IMAGE
           */

          qrisImage:
            type === "QRIS"
              ? qrisImage.trim() || null
              : null,

          /**
           * PAYMENT INFORMATION
           */

          description:
            description.trim() || null,

          instructions:
            instructions.trim() || null,

          icon:
            icon.trim() || null,

          /**
           * GENERAL
           */

          sortOrder:
            Number(sortOrder) || 0,

          isActive,
        });

      /**
       * ======================================================
       * HANDLE FAILURE
       * ======================================================
       */

      if (!result.success) {
        window.alert(
          result.message ??
            "Gagal menambahkan metode pembayaran."
        );

        return;
      }

      /**
       * ======================================================
       * SUCCESS
       * ======================================================
       */

      window.alert(
        result.message ??
          "Metode pembayaran berhasil ditambahkan."
      );

      router.push(
        "/admin/payment-channels"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[CREATE_PAYMENT_CHANNEL_ERROR]",
        error
      );

      window.alert(
        "Terjadi kesalahan saat menambahkan metode pembayaran."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tambah Metode Pembayaran
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan metode pembayaran baru untuk customer.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/payment-channels"
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </button>
      </div>

      {/* =====================================================
          PAYMENT TYPE
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Jenis Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pilih jenis metode pembayaran yang ingin ditambahkan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              handleTypeChange(
                "BANK_TRANSFER"
              )
            }
            className={[
              "rounded-2xl border p-5 text-left transition",
              type === "BANK_TRANSFER"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-3">
                <CreditCard className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  Transfer Bank
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pembayaran menggunakan rekening bank.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTypeChange("QRIS")
            }
            className={[
              "rounded-2xl border p-5 text-left transition",
              type === "QRIS"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-3">
                <QrCode className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  QRIS
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pembayaran menggunakan scan QRIS.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================
          BASIC INFORMATION
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informasi utama yang akan digunakan oleh customer.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Nama Metode Pembayaran
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder={
                type === "QRIS"
                  ? "Contoh: QRIS"
                  : "Contoh: BCA Transfer"
              }
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Deskripsi
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Deskripsi singkat metode pembayaran."
              rows={3}
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          BANK INFORMATION
      ====================================================== */}

      {type === "BANK_TRANSFER" && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Informasi Rekening
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Informasi rekening tujuan pembayaran.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="bankName"
                className="mb-2 block text-sm font-medium"
              >
                Nama Bank
              </label>

              <input
                id="bankName"
                type="text"
                value={bankName}
                onChange={(event) =>
                  setBankName(
                    event.target.value
                  )
                }
                placeholder="Contoh: BCA"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="accountNumber"
                className="mb-2 block text-sm font-medium"
              >
                Nomor Rekening
              </label>

              <input
                id="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(event) =>
                  setAccountNumber(
                    event.target.value
                  )
                }
                placeholder="Contoh: 1234567890"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="accountHolder"
                className="mb-2 block text-sm font-medium"
              >
                Nama Pemilik Rekening
              </label>

              <input
                id="accountHolder"
                type="text"
                value={accountHolder}
                onChange={(event) =>
                  setAccountHolder(
                    event.target.value
                  )
                }
                placeholder="Contoh: QRIS"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          QRIS IMAGE
      ====================================================== */}

      {type === "QRIS" && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-muted p-3">
              <QrCode className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Gambar QRIS
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan URL atau path gambar QRIS yang akan
                ditampilkan kepada customer.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="qrisImage"
                className="mb-2 flex items-center gap-2 text-sm font-medium"
              >
                <ImageIcon className="h-4 w-4" />

                URL / Path Gambar QRIS
              </label>

              <input
                id="qrisImage"
                type="text"
                value={qrisImage}
                onChange={(event) =>
                  setQrisImage(
                    event.target.value
                  )
                }
                placeholder="/uploads/payments/qris.png"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Contoh: /uploads/payments/qris.png atau URL
                gambar dari storage Anda.
              </p>
            </div>

            {qrisImage.trim() && (
              <div className="overflow-hidden rounded-2xl border bg-muted/30 p-5">
                <p className="mb-4 text-sm font-medium">
                  Preview QRIS
                </p>

                <div className="flex justify-center">
                  <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl border bg-white">
                    <Image
                      src={qrisImage}
                      alt="Preview QRIS"
                      fill
                      unoptimized
                      className="object-contain p-4"
                      onError={() => {
                        // Browser akan tetap menampilkan container
                        // apabila URL gambar belum valid.
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          PAYMENT INSTRUCTIONS
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <ScrollText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Instruksi Pembayaran
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Instruksi yang akan ditampilkan kepada customer.
            </p>
          </div>
        </div>

        <textarea
          value={instructions}
          onChange={(event) =>
            setInstructions(
              event.target.value
            )
          }
          rows={5}
          placeholder={
            type === "QRIS"
              ? "Scan QRIS menggunakan aplikasi pembayaran Anda, lalu selesaikan pembayaran."
              : "Silakan transfer ke rekening yang tertera."
          }
          className="w-full resize-none rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* =====================================================
          ADDITIONAL SETTINGS
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Pengaturan Tambahan
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Atur urutan dan status metode pembayaran.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="sortOrder"
              className="mb-2 block text-sm font-medium"
            >
              Urutan Tampilan
            </label>

            <input
              id="sortOrder"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="icon"
              className="mb-2 block text-sm font-medium"
            >
              Icon
            </label>

            <input
              id="icon"
              type="text"
              value={icon}
              onChange={(event) =>
                setIcon(
                  event.target.value
                )
              }
              placeholder="Contoh: credit-card"
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-xl border p-4">
          <div>
            <p className="font-medium">
              Aktifkan metode pembayaran
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Metode aktif akan tersedia untuk customer saat
              checkout.
            </p>
          </div>

          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(
                event.target.checked
              )
            }
            className="h-5 w-5"
          />
        </label>
      </div>

      {/* =====================================================
          SUBMIT
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() =>
            router.push(
              "/admin/payment-channels"
            )
          }
          className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />

              Simpan Metode Pembayaran
            </>
          )}
        </button>
      </div>
    </form>
  );
}