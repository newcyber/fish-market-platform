import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Package,
  Search,
  Star,
  Ticket,
} from "lucide-react";

interface CustomerHomeAddress {
  id: string;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  isDefault: boolean;
}

interface CustomerHomeHeaderProps {
  customerName: string;
  rewardPoints: number;
  address: CustomerHomeAddress | null;
  activeOrderCount: number;
}

function formatPoints(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getArea(address: CustomerHomeAddress | null) {
  if (!address) {
    return null;
  }

  return [
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join(", ");
}

function getAddressTitle(address: CustomerHomeAddress | null) {
  if (!address) {
    return "Tambahkan alamat pengiriman";
  }

  return (
    address.label?.trim() ||
    getArea(address) ||
    address.fullAddress
  );
}

function getAddressSubtitle(address: CustomerHomeAddress | null) {
  if (!address) {
    return "Pilih alamat untuk pengantaran pesanan";
  }

  const area = getArea(address);

  if (area && address.label?.trim()) {
    return area;
  }

  return [
    address.village,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(" • ");
}

export default function CustomerHomeHeader({
  customerName,
  rewardPoints,
  address,
  activeOrderCount,
}: CustomerHomeHeaderProps) {
  return (
    <section
      className="
        relative
        overflow-hidden
        bg-(--pisjo-primary)
        text-white
        md:bg-white
        md:text-slate-900
      "
    >
      {/* Decorative background - mobile only */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          -top-28
          hidden
          h-64
          w-64
          rounded-full
          bg-white/10
          md:hidden
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-28
          bottom-[-8rem]
          hidden
          h-64
          w-64
          rounded-full
          bg-white/5
          md:hidden
        "
      />

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-7xl
          px-4
          pb-4
          pt-3.5
          sm:px-6
          md:px-8
          md:pb-4
          md:pt-4
        "
      >
        {/* Greeting */}
        <div
          className="
            mb-3
            md:mb-4
          "
        >
          <p
            className="
              text-xs
              font-medium
              text-white/75
              md:text-slate-500
            "
          >
            Selamat datang kembali 👋
          </p>

          <h1
            className="
              mt-0.5
              text-xl
              font-bold
              tracking-tight
              sm:text-2xl
              md:text-2xl
            "
          >
            Halo, {customerName}
          </h1>
        </div>

        {/* Search is provided by DynamicSiteHeader.
            Keep a single search surface on Customer Home. */}

        {/* Delivery address */}
        <Link
          href="/customer/account"
          className="
            mb-3
            flex
            min-w-0
            items-center
            gap-3
            rounded-2xl
            bg-white/10
            px-3
            py-2.5
            backdrop-blur-sm
            transition
            hover:bg-white/15
            md:mb-4
            md:border
            md:border-slate-100
            md:bg-slate-50
            md:px-4
            md:py-3
            md:shadow-sm
            md:hover:bg-slate-100
          "
        >
          <span
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/15
              md:bg-white
              md:text-(--pisjo-primary)
            "
          >
            <MapPin
              aria-hidden="true"
              className="h-4.5 w-4.5"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className="
                block
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-white/65
                md:text-slate-400
              "
            >
              Antar ke
            </span>

            <span
              className="
                mt-0.5
                block
                truncate
                text-sm
                font-semibold
                text-white
                md:text-slate-800
              "
            >
              {getAddressTitle(address)}
            </span>

            <span
              className="
                block
                truncate
                text-[11px]
                text-white/65
                md:text-slate-500
              "
            >
              {getAddressSubtitle(address)}
            </span>
          </span>

          <ChevronRight
            aria-hidden="true"
            className="
              h-5
              w-5
              shrink-0
              text-white/65
              md:text-slate-400
            "
          />
        </Link>

        {/* Customer shortcuts */}
        <div
          className="
            grid
            grid-cols-3
            overflow-hidden
            rounded-2xl
            bg-white
            text-slate-900
            shadow-lg
            md:rounded-xl
            md:border
            md:border-slate-100
            md:shadow-sm
          "
        >
          {/* Points */}
          <Link
            href="/customer/rewards"
            className="
              flex
              min-h-20
              flex-col
              items-center
              justify-center
              gap-1
              border-r
              border-slate-100
              px-2
              py-2.5
              text-center
              transition
              hover:bg-slate-50
              md:min-h-20
            "
          >
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-amber-50
                text-amber-500
              "
            >
              <Star
                aria-hidden="true"
                className="h-4.5 w-4.5 fill-current"
              />
            </span>

            <span className="text-sm font-bold leading-none">
              {formatPoints(rewardPoints)}
            </span>

            <span className="text-[10px] text-slate-500">
              Poin
            </span>
          </Link>

          {/* Voucher */}
          <Link
            href="/customer/rewards"
            className="
              flex
              min-h-20
              flex-col
              items-center
              justify-center
              gap-1
              border-r
              border-slate-100
              px-2
              py-2.5
              text-center
              transition
              hover:bg-slate-50
              md:min-h-20
            "
          >
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-sky-50
                text-sky-600
              "
            >
              <Ticket
                aria-hidden="true"
                className="h-4.5 w-4.5"
              />
            </span>

            <span className="text-sm font-bold leading-none">
              Voucher
            </span>

            <span className="text-[10px] text-slate-500">
              Tukar
            </span>
          </Link>

          {/* Active orders */}
          <Link
            href="/customer/orders"
            className="
              flex
              min-h-20
              flex-col
              items-center
              justify-center
              gap-1
              px-2
              py-2.5
              text-center
              transition
              hover:bg-slate-50
              md:min-h-20
            "
          >
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-blue-50
                text-blue-600
              "
            >
              <Package
                aria-hidden="true"
                className="h-4.5 w-4.5"
              />
            </span>

            <span className="text-sm font-bold leading-none">
              {activeOrderCount}
            </span>

            <span className="text-[10px] text-slate-500">
              Pesanan aktif
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
