"use client";

import Link from "next/link";

import {
  Edit,
  Power,
} from "lucide-react";

import {
  updatePaymentChannelStatusAction,
} from "@/actions/payment/payment-channel.actions";

import DeletePaymentChannelButton from "./DeletePaymentChannelButton";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface PaymentChannelTableItem {
  id: string;

  name: string;

  type: string;

  bankName: string | null;

  accountNumber: string | null;

  accountHolder: string | null;

  isActive: boolean;

  sortOrder: number;
}

interface PaymentChannelTableProps {
  channels: PaymentChannelTableItem[];
}

/**
 * ============================================================
 * PAYMENT CHANNEL TABLE
 * ============================================================
 */

export function PaymentChannelTable({
  channels,
}: PaymentChannelTableProps) {
  /**
   * ==========================================================
   * TOGGLE ACTIVE STATUS
   * ==========================================================
   */

  async function handleToggleStatus(
    id: string,
    currentStatus: boolean
  ) {
    const result =
      await updatePaymentChannelStatusAction(
        id,
        !currentStatus
      );

    if (!result.success) {
      window.alert(
        result.message ??
          "Gagal memperbarui status metode pembayaran."
      );

      return;
    }

    window.alert(
      result.message ??
        "Status metode pembayaran berhasil diperbarui."
    );
  }

  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (channels.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <h3 className="text-lg font-semibold">
          Metode pembayaran belum tersedia
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Tambahkan metode pembayaran untuk
          digunakan oleh customer saat checkout.
        </p>

        <Link
          href="/admin/payment-channels/create"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Tambah Metode Pembayaran
        </Link>
      </div>
    );
  }

  /**
   * ==========================================================
   * TABLE
   * ==========================================================
   */

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                Metode Pembayaran
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Tipe
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Informasi Rekening
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Urutan
              </th>

              <th className="px-4 py-3 text-center font-medium">
                Status
              </th>

              <th className="px-4 py-3 text-right font-medium">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {channels.map((channel) => (
              <tr
                key={channel.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                {/* ==================================================
                    NAME
                ================================================== */}

                <td className="px-4 py-4">
                  <div className="font-medium">
                    {channel.name}
                  </div>
                </td>

                {/* ==================================================
                    TYPE
                ================================================== */}

                <td className="px-4 py-4">
                  <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {channel.type === "BANK_TRANSFER"
                      ? "Transfer Bank"
                      : channel.type}
                  </span>
                </td>

                {/* ==================================================
                    ACCOUNT
                ================================================== */}

                <td className="px-4 py-4">
                  {channel.bankName ||
                  channel.accountNumber ||
                  channel.accountHolder ? (
                    <div className="space-y-1">
                      {channel.bankName && (
                        <p className="font-medium">
                          {channel.bankName}
                        </p>
                      )}

                      {channel.accountNumber && (
                        <p className="font-mono text-xs text-muted-foreground">
                          {channel.accountNumber}
                        </p>
                      )}

                      {channel.accountHolder && (
                        <p className="text-xs text-muted-foreground">
                          a.n.{" "}
                          {channel.accountHolder}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      -
                    </span>
                  )}
                </td>

                {/* ==================================================
                    SORT ORDER
                ================================================== */}

                <td className="px-4 py-4 text-center">
                  {channel.sortOrder}
                </td>

                {/* ==================================================
                    STATUS
                ================================================== */}

                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleStatus(
                        channel.id,
                        channel.isActive
                      )
                    }
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${
                      channel.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {channel.isActive
                      ? "Aktif"
                      : "Nonaktif"}
                  </button>
                </td>

                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {/* EDIT */}

                    <Link
                      href={`/admin/payment-channels/${channel.id}/edit`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition hover:bg-muted"
                      title="Edit metode pembayaran"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>

                    {/* ACTIVE / INACTIVE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(
                          channel.id,
                          channel.isActive
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition hover:bg-muted"
                      title={
                        channel.isActive
                          ? "Nonaktifkan"
                          : "Aktifkan"
                      }
                    >
                      <Power className="h-4 w-4" />
                    </button>

                    {/* DELETE */}

                    <DeletePaymentChannelButton
                      id={channel.id}
                      name={channel.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}