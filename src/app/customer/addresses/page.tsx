import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  Plus,
  Home,
  Phone,
  User,
  Pencil,
} from "lucide-react";

import { auth } from "@/auth";
import AddressService from "@/services/address/address.service";
import SetDefaultAddressButton from "@/components/customer/address/SetDefaultAddressButton";
import DeleteAddressButton from "@/components/customer/address/DeleteAddressButton";

export default async function CustomerAddressesPage() {
  /**
   * ============================================================
   * AUTHENTICATION
   * ============================================================
   */
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ============================================================
   * GET ADDRESSES
   * ============================================================
   */
  const result =
    await AddressService.getAddressesByUserId(
      session.user.id
    );

  const addresses =
    result.success && result.data
      ? result.data
      : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-6 w-6" />

            <h1 className="text-2xl font-bold">
              Alamat Saya
            </h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Kelola alamat pengiriman Anda.
          </p>
        </div>

        <Link
          href="/customer/addresses/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />

          Tambah Alamat
        </Link>
      </div>

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {addresses.length === 0 && (
        <div className="flex min-h-87.5 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>

          <h2 className="mb-2 text-lg font-semibold">
            Belum ada alamat
          </h2>

          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Tambahkan alamat pengiriman agar Anda dapat
            melakukan checkout dengan lebih mudah.
          </p>

          <Link
            href="/customer/addresses/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />

            Tambah Alamat Pertama
          </Link>
        </div>
      )}

      {/* ====================================================== */}
      {/* ADDRESS LIST */}
      {/* ====================================================== */}

      {addresses.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="relative rounded-xl border bg-background p-5 shadow-sm transition hover:shadow-md"
            >
              {/* ================================================== */}
              {/* DEFAULT BADGE */}
              {/* ================================================== */}

              {address.isDefault && (
                <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  ALAMAT UTAMA
                </div>
              )}

              {/* ================================================== */}
              {/* LABEL */}
              {/* ================================================== */}

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Home className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    {address.label || "Alamat"}
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Alamat Pengiriman
                  </p>
                </div>
              </div>

              {/* ================================================== */}
              {/* RECEIVER */}
              {/* ================================================== */}

              <div className="mb-3 flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">
                    {address.receiverName}
                  </p>
                </div>
              </div>

              {/* ================================================== */}
              {/* PHONE */}
              {/* ================================================== */}

              <div className="mb-3 flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  {address.receiverPhone}
                </p>
              </div>

              {/* ================================================== */}
              {/* ADDRESS */}
              {/* ================================================== */}

              <div className="mb-3 flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div className="text-sm text-muted-foreground">
                  <p>{address.fullAddress}</p>

                  <p>
                    {address.village},{" "}
                    {address.district}
                  </p>

                  <p>
                    {address.city},{" "}
                    {address.province}
                  </p>

                  <p>
                    {address.postalCode}
                  </p>
                </div>
              </div>

              {/* ================================================== */}
              {/* COORDINATE */}
              {/* ================================================== */}

              {address.latitude &&
                address.longitude && (
                  <div className="mb-5 rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Lokasi tersimpan
                    </p>

                    <p className="mt-1 text-xs font-medium">
                      {address.latitude.toString()}
                      {", "}
                      {address.longitude.toString()}
                    </p>
                  </div>
                )}

              {/* ================================================== */}
              {/* NOTES */}
              {/* ================================================== */}

              {address.notes && (
                <div className="mb-5 rounded-lg border p-3">
                  <p className="mb-1 text-xs font-medium">
                    Catatan
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {address.notes}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
  {/* LEFT ACTIONS */}

  <div className="flex items-center gap-4">
    {/* EDIT */}

    <Link
      href={`/customer/addresses/${address.id}/edit`}
      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
    >
      <Pencil className="h-4 w-4" />

      Edit
    </Link>

    {/* DELETE */}

    <DeleteAddressButton
      addressId={address.id}
    />
  </div>

  {/* RIGHT ACTION */}

  <SetDefaultAddressButton
    addressId={address.id}
    isDefault={address.isDefault}
  />
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}