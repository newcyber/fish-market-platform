import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
} from "lucide-react";

import { auth } from "@/auth";
import AddressService from "@/services/address/address.service";

import EditAddressForm from "@/components/customer/address/EditAddressForm";

interface EditAddressPageProps {
  params: Promise<{
    addressId: string;
  }>;
}

export default async function EditAddressPage(
  props: EditAddressPageProps
) {
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
   * PARAMS
   * ============================================================
   */
  const { addressId } =
    await props.params;

  /**
   * ============================================================
   * GET ADDRESS
   * ============================================================
   */
  const result =
    await AddressService.getAddressById(
      session.user.id,
      addressId
    );

  /**
   * ============================================================
   * ADDRESS NOT FOUND
   * ============================================================
   */
  if (
    !result.success ||
    !result.data
  ) {
    redirect("/customer/addresses");
  }

  const address = result.data;

  /**
   * ============================================================
   * SERIALIZE DECIMAL
   *
   * Decimal tidak boleh langsung dikirim
   * dari Server Component ke Client Component.
   * ============================================================
   */
  const initialAddress = {
    id: address.id,

    receiverName:
      address.receiverName,

    receiverPhone:
      address.receiverPhone,

    province:
      address.province,

    city:
      address.city,

    district:
      address.district,

    village:
      address.village,

    postalCode:
      address.postalCode,

    fullAddress:
      address.fullAddress,

    latitude:
      address.latitude
        ? Number(
            address.latitude.toString()
          )
        : null,

    longitude:
      address.longitude
        ? Number(
            address.longitude.toString()
          )
        : null,

    label:
      address.label ?? "",

    notes:
      address.notes ?? "",

    isDefault:
      address.isDefault,
  };

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

      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MapPin className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            Edit Alamat
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui informasi alamat pengiriman Anda.
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FORM */}
      {/* ====================================================== */}

      <EditAddressForm
        initialAddress={
          initialAddress
        }
      />
    </div>
  );
}