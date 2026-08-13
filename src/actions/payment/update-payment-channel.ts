"use server";

import { revalidatePath } from "next/cache";

import { PaymentChannelService } from "@/services/payment/payment-channel.service";

interface UpdatePaymentChannelInput {
  id: string;

  name: string;

  type: "BANK_TRANSFER";

  bankName?: string | null;

  accountNumber?: string | null;

  accountHolder?: string | null;

  sortOrder: number;

  isActive: boolean;
}

export async function updatePaymentChannelAction(
  input: UpdatePaymentChannelInput
) {
  try {
    if (!input.id) {
      return {
        success: false,
        message: "ID metode pembayaran tidak valid.",
      };
    }

    if (!input.name.trim()) {
      return {
        success: false,
        message: "Nama metode pembayaran wajib diisi.",
      };
    }

    await PaymentChannelService.update(
      input.id,
      {
        name: input.name.trim(),

        type: input.type,

        bankName:
          input.bankName?.trim() || null,

        accountNumber:
          input.accountNumber?.trim() || null,

        accountHolder:
          input.accountHolder?.trim() || null,

        sortOrder: input.sortOrder,

        isActive: input.isActive,
      }
    );

    revalidatePath("/admin/payment-channels");

    return {
      success: true,
      message:
        "Metode pembayaran berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_PAYMENT_CHANNEL_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        "Gagal memperbarui metode pembayaran.",
    };
  }
}