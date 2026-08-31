import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ChevronRight,
  CreditCard,
} from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/admin";

import { PaymentChannelService } from "@/services/payment/payment-channel.service";

import EditPaymentChannelForm from "@/components/admin/payment-channels/EditPaymentChannelForm";

export const dynamic = "force-dynamic";

interface EditPaymentChannelPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * EDIT PAYMENT CHANNEL PAGE
 * ============================================================
 *
 * Authorization:
 *
 * SUPER_ADMIN only.
 *
 * Direct URL access juga wajib melewati
 * authorization.
 *
 * Flow:
 *
 * /admin/payment-channels/[id]/edit
 *              ↓
 * requireSuperAdmin()
 *              ↓
 * PaymentChannelService.getById()
 *              ↓
 * EditPaymentChannelForm
 *
 * ============================================================
 */

export default async function EditPaymentChannelPage({
  params,
}: EditPaymentChannelPageProps) {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   *
   * Harus dilakukan sebelum mengambil data
   * payment channel.
   */

  await requireSuperAdmin();

  /**
   * ==========================================================
   * PARAMS
   * ==========================================================
   */

  const { id } = await params;

  /**
   * ==========================================================
   * VALIDATE ID
   * ==========================================================
   */

  if (!id) {
    notFound();
  }

  /**
   * ==========================================================
   * GET PAYMENT CHANNEL
   * ==========================================================
   */

  const result =
    await PaymentChannelService.getById(id);

  if (
    !result.success ||
    !result.data
  ) {
    notFound();
  }

  const channel =
    result.data;

  /**
   * ==========================================================
   * PAGE
   * ==========================================================
   */

  return (
    <div className="flex flex-col gap-6">
      {/* ======================================================
          BREADCRUMB
      ====================================================== */}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin"
          className="transition hover:text-foreground"
        >
          Dashboard
        </Link>

        <ChevronRight className="h-4 w-4" />

        <Link
          href="/admin/payment-channels"
          className="transition hover:text-foreground"
        >
          Payment Channels
        </Link>

        <ChevronRight className="h-4 w-4" />

        <span className="text-foreground">
          Edit Metode
        </span>
      </div>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CreditCard className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Metode Pembayaran
          </h1>

          <p className="mt-2 text-muted-foreground">
            Perbarui informasi metode pembayaran
            yang tersedia untuk customer.
          </p>
        </div>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <EditPaymentChannelForm
        channel={channel}
      />
    </div>
  );
}
