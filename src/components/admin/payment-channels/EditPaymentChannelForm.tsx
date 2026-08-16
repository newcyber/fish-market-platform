"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CreditCard,
  ImageIcon,
  Loader2,
  QrCode,
  Save,
} from "lucide-react";

import { PaymentChannelType } from "@prisma/client";

import {
  updatePaymentChannelAction,
} from "@/actions/payment/payment-channel.actions";

/**
 * ============================================================
 * EDIT PAYMENT CHANNEL FORM
 * ============================================================
 */

interface EditPaymentChannelFormProps {
  channel: {
    id: string;

    name: string;

    slug: string;

    type: PaymentChannelType;

    bankName: string | null;

    accountNumber: string | null;

    accountHolder: string | null;

    qrisImage: string | null;

    sortOrder: number;

    isActive: boolean;
  };
}

export default function EditPaymentChannelForm({
  channel,
}: EditPaymentChannelFormProps) {
  const router = useRouter();

  /**
   * ==========================================================
   * BASIC STATE
   * ==========================================================
   */

  const [name, setName] =
    useState(channel.name);

  /**
   * ==========================================================
   * BANK STATE
   * ==========================================================
   */

  const [bankName, setBankName] =
    useState(channel.bankName ?? "");

  const [accountNumber, setAccountNumber] =
    useState(channel.accountNumber ?? "");

  const [accountHolder, setAccountHolder] =
    useState(channel.accountHolder ?? "");

  /**
   * ==========================================================
   * QRIS STATE
   * ==========================================================
   */

  const [qrisImage, setQrisImage] =
    useState(channel.qrisImage ?? "");

  /**
   * ==========================================================
   * GENERAL STATE
   * ==========================================================
   */

  const [sortOrder, setSortOrder] =
    useState(
      String(channel.sortOrder)
    );

  const [isActive, setIsActive] =
    useState(channel.isActive);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

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

    if (channel.type === "BANK_TRANSFER") {
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

    if (channel.type === "QRIS") {
      if (!qrisImage.trim()) {
        window.alert(
          "Gambar QRIS wajib diisi."
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
       * UPDATE PAYMENT CHANNEL
       * ======================================================
       */

      const result =
        await updatePaymentChannelAction(
          channel.id,
          {
            name:
              normalizedName,

            slug,

            /**
             * PAYMENT TYPE
             *
             * Type tidak diubah dari form edit.
             */

            type:
              channel.type,

            /**
             * BANK INFORMATION
             */

            bankName:
              channel.type ===
              "BANK_TRANSFER"
                ? bankName.trim() ||
                  null
                : null,

            accountNumber:
              channel.type ===
              "BANK_TRANSFER"
                ? accountNumber.trim() ||
                  null
                : null,

            accountHolder:
              channel.type ===
              "BANK_TRANSFER"
                ? accountHolder.trim() ||
                  null
                : null,

            /**
             * QRIS IMAGE
             */

            qrisImage:
              channel.type === "QRIS"
                ? qrisImage.trim() ||
                  null
                : null,

            /**
             * GENERAL
             */

            sortOrder:
              Number(sortOrder) || 0,

            isActive,
          }
        );

      /**
       * ======================================================
       * HANDLE FAILURE
       * ======================================================
       */

      if (!result.success) {
        window.alert(
          result.message ??
            "Gagal memperbarui metode pembayaran."
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
          "Metode pembayaran berhasil diperbarui."
      );

      router.push(
        "/admin/payment-channels"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[UPDATE_PAYMENT_CHANNEL_ERROR]",
        error
      );

      window.alert(
        "Terjadi kesalahan saat memperbarui metode pembayaran."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * PAYMENT TYPE LABEL
   * ==========================================================
   */

  const paymentTypeLabel =
    channel.type === "QRIS"
      ? "QRIS"
      : "Transfer Bank";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* =====================================================
          INFORMASI METODE
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui informasi metode pembayaran.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* NAMA */}

          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium"
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
                channel.type === "QRIS"
                  ? "Contoh: QRIS"
                  : "Contoh: Transfer Bank BCA"
              }
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* TIPE */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tipe Pembayaran
            </label>

            <div className="relative">
              <input
                type="text"
                value={paymentTypeLabel}
                disabled
                className="h-11 w-full cursor-not-allowed rounded-lg border bg-muted px-3 pr-10 text-sm text-muted-foreground"
              />

              <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                {channel.type === "QRIS" ? (
                  <QrCode className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          INFORMASI REKENING
      ====================================================== */}

      {channel.type === "BANK_TRANSFER" && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Informasi Rekening
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Informasi rekening tujuan pembayaran.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* BANK */}

            <div className="space-y-2">
              <label
                htmlFor="bankName"
                className="text-sm font-medium"
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
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* NOMOR REKENING */}

            <div className="space-y-2">
              <label
                htmlFor="accountNumber"
                className="text-sm font-medium"
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
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* PEMILIK REKENING */}

            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="accountHolder"
                className="text-sm font-medium"
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
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          QRIS IMAGE
      ====================================================== */}

      {channel.type === "QRIS" && (
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
                Perbarui gambar QRIS yang akan ditampilkan
                kepada customer.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="qrisImage"
                className="flex items-center gap-2 text-sm font-medium"
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
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <p className="text-xs text-muted-foreground">
                Masukkan URL atau path gambar QRIS yang valid.
              </p>
            </div>

            {qrisImage.trim() && (
              <div className="rounded-2xl border bg-muted/30 p-5">
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
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          PENGATURAN
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Pengaturan Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Atur urutan tampilan dan status metode pembayaran.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="sortOrder"
            className="text-sm font-medium"
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
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* =====================================================
          STATUS
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Status Metode Pembayaran
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Metode pembayaran aktif dapat dipilih oleh
              customer saat checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsActive(
                (current) => !current
              )
            }
            className={`relative h-7 w-12 rounded-full transition ${
              isActive
                ? "bg-primary"
                : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                isActive
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/payment-channels"
            )
          }
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />

          Batal
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />

              Simpan Perubahan
            </>
          )}
        </button>
      </div>
    </form>
  );
}