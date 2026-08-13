"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, Loader2, Save } from "lucide-react";

import {
  createPaymentChannelAction,
} from "@/actions/payment/payment-channel.actions";

export default function CreatePaymentChannelForm() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [name, setName] =
    useState("");

  const [bankName, setBankName] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [accountHolder, setAccountHolder] =
    useState("");

  const [sortOrder, setSortOrder] =
    useState("0");

  const [isActive, setIsActive] =
    useState(true);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      window.alert(
        "Nama metode pembayaran wajib diisi."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedName = name.trim();

const slug = normalizedName
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

const result =
  await createPaymentChannelAction({
    name: normalizedName,

    slug,

    type: "BANK_TRANSFER",

    bankName:
      bankName.trim() || null,

    accountNumber:
      accountNumber.trim() || null,

    accountHolder:
      accountHolder.trim() || null,

    sortOrder:
      Number(sortOrder) || 0,

    isActive,
  });

if (!result.success) {
  window.alert(
    result.message ??
      "Gagal menambahkan metode pembayaran."
  );

  return;
}

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
      {/* INFORMASI UTAMA */}

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan informasi metode pembayaran
            yang akan tersedia untuk customer.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* NAME */}

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
                setName(event.target.value)
              }
              placeholder="Contoh: Transfer Bank BCA"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              disabled={isSubmitting}
            />
          </div>

          {/* TYPE */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tipe Pembayaran
            </label>

            <input
              type="text"
              value="Transfer Bank"
              disabled
              className="h-10 w-full rounded-lg border bg-muted px-3 text-sm text-muted-foreground"
            />

            <p className="text-xs text-muted-foreground">
              Saat ini sistem mendukung metode
              Transfer Bank.
            </p>
          </div>
        </div>
      </div>

      {/* INFORMASI REKENING */}

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Rekening
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Data rekening tujuan pembayaran customer.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* BANK NAME */}

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
                setBankName(event.target.value)
              }
              placeholder="Contoh: BCA"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              disabled={isSubmitting}
            />
          </div>

          {/* ACCOUNT NUMBER */}

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
                setAccountNumber(event.target.value)
              }
              placeholder="Contoh: 1234567890"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              disabled={isSubmitting}
            />
          </div>

          {/* ACCOUNT HOLDER */}

          <div className="space-y-2">
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
                setAccountHolder(event.target.value)
              }
              placeholder="Contoh: Fish Market Indonesia"
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              disabled={isSubmitting}
            />
          </div>

          {/* SORT ORDER */}

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
                setSortOrder(event.target.value)
              }
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              disabled={isSubmitting}
            />

            <p className="text-xs text-muted-foreground">
              Angka lebih kecil akan tampil lebih dahulu.
            </p>
          </div>
        </div>
      </div>

      {/* STATUS */}

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(event.target.checked)
            }
            disabled={isSubmitting}
            className="mt-1 h-4 w-4"
          />

          <div>
            <p className="text-sm font-medium">
              Aktifkan metode pembayaran
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Metode pembayaran aktif dapat dipilih
              oleh customer saat melakukan pembayaran.
            </p>
          </div>
        </label>
      </div>

      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/payment-channels"
            )
          }
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />

              Simpan Metode
            </>
          )}
        </button>
      </div>
    </form>
  );
}