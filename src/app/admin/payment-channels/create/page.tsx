import Link from "next/link";

import {
  ChevronRight,
  CreditCard,
} from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/admin";

import CreatePaymentChannelForm from "@/components/admin/payment-channels/CreatePaymentChannelForm";

export const dynamic = "force-dynamic";

/**
 * ============================================================
 * CREATE PAYMENT CHANNEL PAGE
 * ============================================================
 *
 * Authorization:
 *
 * SUPER_ADMIN only.
 *
 * Direct URL access harus tetap
 * melewati authorization.
 *
 * ============================================================
 */

export default async function CreatePaymentChannelPage() {
  /**
   * ==========================================================
   * AUTHORIZATION
   * ==========================================================
   */

  await requireSuperAdmin();

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
          Tambah Metode
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
            Tambah Metode Pembayaran
          </h1>

          <p className="mt-2 text-muted-foreground">
            Tambahkan metode pembayaran baru yang
            dapat digunakan oleh customer.
          </p>
        </div>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <CreatePaymentChannelForm />
    </div>
  );
}
