import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { auth } from "@/auth";
import CreateAddressForm from "@/components/customer/address/CreateAddressForm";

export default async function CreateAddressPage() {
  /**
   * ============================================================
   * AUTHENTICATION
   * ============================================================
   */
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ====================================================== */}
      {/* BACK */}
      {/* ====================================================== */}

      <Link
        href="/customer/addresses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />

        Kembali ke Alamat Saya
      </Link>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Tambah Alamat
            </h1>

            <p className="text-sm text-muted-foreground">
              Tambahkan alamat baru untuk pengiriman pesanan.
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FORM */}
      {/* ====================================================== */}

      <CreateAddressForm />
    </div>
  );
}