import {
  redirect,
} from "next/navigation";

import {
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  auth,
} from "@/auth";

import CustomerService from "@/services/customer/customer.service";

import CustomerProfileForm from "@/components/customer/profile/CustomerProfileForm";

/**
 * ============================================================
 * CUSTOMER PROFILE PAGE
 * ============================================================
 */

export default async function CustomerProfilePage() {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session =
    await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * GET CUSTOMER
   * ==========================================================
   */

  const customer =
    await CustomerService.getCustomerById(
      session.user.id
    );

  if (!customer) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * FORMAT DATE
   * ==========================================================
   */

  const joinedAt =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(
      customer.createdAt
    );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50">
              <User className="h-6 w-6 text-cyan-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Profil Saya
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Kelola informasi akun Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">

          {/* ================================================== */}
          {/* PROFILE FORM */}
          {/* ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Informasi Pribadi
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Perbarui informasi dasar akun Anda.
              </p>
            </div>

            <CustomerProfileForm
              name={
                customer.name ??
                ""
              }
              email={
                customer.email
              }
              phone={
                customer.phone ??
                null
              }
            />
          </section>

          {/* ================================================== */}
          {/* ACCOUNT INFORMATION */}
          {/* ================================================== */}

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-base font-semibold text-slate-900">
              Informasi Akun
            </h2>

            <div className="mt-5 space-y-5">

              {/* STATUS */}

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Status Akun
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {customer.isActive
                      ? "Aktif"
                      : "Tidak Aktif"}
                  </p>
                </div>
              </div>

              {/* ROLE */}

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <ShieldCheck className="h-4 w-4 text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    Customer
                  </p>
                </div>
              </div>

              {/* JOINED DATE */}

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <CalendarDays className="h-4 w-4 text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Bergabung Sejak
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {joinedAt}
                  </p>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}