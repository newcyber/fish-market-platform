"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

import { PaymentChannelType } from "@prisma/client";

import {
  updatePaymentChannelAction,
} from "@/actions/payment/payment-channel.actions";

interface EditPaymentChannelFormProps {
  channel: {
    id: string;

    name: string;

    slug: string;

    type: PaymentChannelType;

    bankName: string | null;

    accountNumber: string | null;

    accountHolder: string | null;

    sortOrder: number;

    isActive: boolean;
  };
}

export default function EditPaymentChannelForm({
  channel,
}: EditPaymentChannelFormProps) {
  const router = useRouter();

  const [name, setName] =
    useState(channel.name);

  const [bankName, setBankName] =
    useState(channel.bankName ?? "");

  const [accountNumber, setAccountNumber] =
    useState(channel.accountNumber ?? "");

  const [accountHolder, setAccountHolder] =
    useState(channel.accountHolder ?? "");

  const [sortOrder, setSortOrder] =
    useState(
      String(channel.sortOrder)
    );

  const [isActive, setIsActive] =
    useState(channel.isActive);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

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
      const normalizedName =
        name.trim();

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

      const result =
        await updatePaymentChannelAction(
          channel.id,
          {
            name: normalizedName,

            slug,

            type:
              channel.type,

            bankName:
              bankName.trim() ||
              null,

            accountNumber:
              accountNumber.trim() ||
              null,

            accountHolder:
              accountHolder.trim() ||
              null,

            sortOrder:
              Number(sortOrder) || 0,

            isActive,
          }
        );

      if (!result.success) {
        window.alert(
          result.message ??
            "Gagal memperbarui metode pembayaran."
        );

        return;
      }

      window.alert(
        result.message ??
          "Metode pembayaran berhasil diperbarui."
      );

      router.push(
        "/admin/payment-channels"
      );

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ================================================
          INFORMASI METODE
      ================================================= */}

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
              placeholder="Contoh: Transfer Bank BCA"
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* TIPE */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tipe Pembayaran
            </label>

            <input
              type="text"
              value="Transfer Bank"
              disabled
              className="h-11 w-full cursor-not-allowed rounded-lg border bg-muted px-3 text-sm text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* ================================================
          INFORMASI REKENING
      ================================================= */}

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
                setAccountHolder(
                  event.target.value
                )
              }
              placeholder="Contoh: Fish Market Indonesia"
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* URUTAN */}

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
      </div>

      {/* ================================================
          STATUS
      ================================================= */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Status Metode Pembayaran
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Metode pembayaran aktif dapat dipilih
              oleh customer saat checkout.
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

      {/* ================================================
          ACTIONS
      ================================================= */}

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