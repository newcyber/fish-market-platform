import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  FileText,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  ShoppingCart,
  Star,
  Ticket,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import CustomerService, {
  type CustomerSegment,
} from "@/services/customer/customer.service";

import DeactivateCustomerButton from "@/components/admin/customers/DeactivateCustomerButton";
import ActivateCustomerButton from "@/components/admin/customers/ActivateCustomerButton";

type CustomerDetailData = NonNullable<
  Awaited<ReturnType<typeof CustomerService.getCustomerById>>
>;

interface CustomerDetailProps {
  customer: CustomerDetailData;
  segment: CustomerSegment;
}

const segmentConfig: Record<
  CustomerSegment,
  {
    label: string;
    className: string;
  }
> = {
  BARU: {
    label: "Baru",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  REPEAT: {
    label: "Repeat",
    className: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  LOYAL: {
    label: "Loyal",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  VIP: {
    label: "VIP",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
  AKTIF: {
    label: "Aktif",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  DORMANT: {
    label: "Dormant",
    className: "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
};

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value);

  return `Rp ${
    Number.isFinite(amount) ? amount.toLocaleString("id-ID") : "0"
  }`;
}

function formatDate(
  value: Date | string | null | undefined,
) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(
  value: Date | string | null | undefined,
) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeDate(
  value: Date | string | null | undefined,
) {
  if (!value) return "-";

  const difference =
    Date.now() - new Date(value).getTime();

  const days = Math.floor(
    difference / (24 * 60 * 60 * 1000),
  );

  if (days <= 0) return "Hari ini";
  if (days === 1) return "1 hari lalu";
  if (days < 30) return `${days} hari lalu`;

  const months = Math.floor(days / 30);

  if (months === 1) return "1 bulan lalu";
  if (months < 12) return `${months} bulan lalu`;

  const years = Math.floor(months / 12);

  return years === 1
    ? "1 tahun lalu"
    : `${years} tahun lalu`;
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Selesai";
    case "PROCESSING":
      return "Diproses";
    case "SHIPPING":
      return "Dikirim";
    case "WAITING_PAYMENT":
      return "Menunggu Pembayaran";
    case "WAITING_VERIFICATION":
      return "Menunggu Verifikasi";
    case "PENDING":
      return "Pending";
    case "CANCELLED":
      return "Dibatalkan";
    default:
      return status;
  }
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";

    case "SHIPPING":
    case "PROCESSING":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "WAITING_PAYMENT":
    case "WAITING_VERIFICATION":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-500/20";
  }
}

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-5 w-5 shrink-0 text-[var(--pisjo-ocean)]" />

        <h2 className="truncate text-sm font-bold text-[var(--pisjo-navy)] sm:text-base">
          {title}
        </h2>
      </div>

      {action}
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
  iconClass,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-[var(--pisjo-text-secondary)]">
            {title}
          </p>

          <p className="mt-0.5 truncate text-lg font-bold text-[var(--pisjo-navy)] sm:text-xl">
            {value}
          </p>

          <p className="mt-0.5 truncate text-xs text-[var(--pisjo-text-secondary)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetail({
  customer,
  segment,
}: CustomerDetailProps) {
  const orders = customer.orders;
  const addresses = customer.addresses;

  const totalOrders = orders.length;

  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );

  const lastOrder = orders[0] ?? null;

  const averageOrder =
    totalOrders > 0
      ? totalSpent / totalOrders
      : 0;

  const initials =
    customer.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "CU";

  const segmentStyle = segmentConfig[segment];

  const favoriteProducts = Array.from(
    orders
      .flatMap((order) => order.items)
      .reduce(
        (map, item) => {
          const existing = map.get(item.productName);

          map.set(item.productName, {
            name: item.productName,
            quantity:
              (existing?.quantity ?? 0) +
              item.quantity,
          });

          return map;
        },
        new Map<
          string,
          {
            name: string;
            quantity: number;
          }
        >(),
      )
      .values(),
  )
    .sort(
      (a, b) =>
        b.quantity - a.quantity,
    )
    .slice(0, 5);

  return (
    <div className="min-w-0 space-y-4 pb-8 sm:space-y-5 lg:space-y-6">
      {/* HEADER */}

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 text-xs text-slate-500 sm:text-sm">
            <Link
              href="/admin/customers"
              className="transition hover:text-[var(--pisjo-ocean)]"
            >
              Customer
            </Link>

            <ChevronRight className="h-3.5 w-3.5" />

            <span className="font-semibold text-[var(--pisjo-navy)]">
              Detail Customer
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--pisjo-navy)] sm:text-3xl">
                Detail Customer
              </h1>

              <p className="mt-1 text-sm text-[var(--pisjo-text-secondary)]">
                Informasi lengkap customer, riwayat transaksi, dan aktivitas.
              </p>
            </div>

<div className="grid gap-2 sm:flex">
  <Link
    href="/admin/customers"
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--pisjo-navy)] transition hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
  >
    <ArrowLeft className="h-4 w-4" />
    Kembali
  </Link>

  <Link
    href={`/admin/customers/${customer.id}/edit`}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--pisjo-primary)]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--pisjo-ocean)] transition hover:bg-[var(--pisjo-soft-blue)]"
  >
    <Pencil className="h-4 w-4" />
    Edit Customer
  </Link>

{customer.isActive ? (
  <DeactivateCustomerButton
    customerId={customer.id}
  />
) : (
  <ActivateCustomerButton
    customerId={customer.id}
  />
)}
</div>
          </div>
        </div>
      </header>

      {/* PROFILE */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <div className="flex min-w-0 items-center gap-4 p-5 sm:gap-5 sm:p-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-2xl font-bold text-[var(--pisjo-ocean)] sm:h-24 sm:w-24 sm:text-3xl">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-xl font-bold text-[var(--pisjo-navy)] sm:text-2xl">
                  {customer.name}
                </h2>

                <span
                  className={[
                    "inline-flex rounded-full px-2.5 py-1",
                    "text-xs font-semibold ring-1 ring-inset",
                    customer.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      : "bg-slate-100 text-slate-600 ring-slate-500/20",
                  ].join(" ")}
                >
                  {customer.isActive
                    ? "Aktif"
                    : "Nonaktif"}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-sm text-[var(--pisjo-text-secondary)]">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--pisjo-ocean)]" />
                  <span>
                    {customer.phone || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--pisjo-ocean)]" />
                  <span className="break-all">
                    {customer.email || "-"}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-ocean)]" />

                  <span>
                    {addresses[0]
                      ? [
                          addresses[0].district,
                          addresses[0].city,
                          addresses[0].province,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs text-[var(--pisjo-text-secondary)]">
                  Tanggal Bergabung
                </p>

                <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
                  {formatDate(customer.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[var(--pisjo-text-secondary)]">
                  Sumber
                </p>

                <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
                  -
                </p>
              </div>

              <div>
                <p className="text-xs text-[var(--pisjo-text-secondary)]">
                  Tipe Customer
                </p>

                <p className="mt-1 text-sm font-semibold text-[var(--pisjo-navy)]">
                  -
                </p>
              </div>

              <div>
                <p className="text-xs text-[var(--pisjo-text-secondary)]">
                  Segmen
                </p>

                <span
                  className={[
                    "mt-1 inline-flex rounded-full px-2.5 py-1",
                    "text-xs font-semibold ring-1 ring-inset",
                    segmentStyle.className,
                  ].join(" ")}
                >
                  {segmentStyle.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          title="Total Order"
          value={String(totalOrders)}
          description="Transaksi berhasil"
          iconClass="bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]"
        />

        <StatCard
          icon={Wallet}
          title="Total Belanja"
          value={formatCurrency(totalSpent)}
          description={
            totalOrders > 0
              ? `Rata-rata ${formatCurrency(averageOrder)}/order`
              : "Belum ada transaksi"
          }
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          icon={Star}
          title="Poin Tersedia"
          value={Number(
            customer.rewardPointsBalance,
          ).toLocaleString("id-ID")}
          description="Saldo poin reward"
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          icon={CalendarDays}
          title="Terakhir Belanja"
          value={formatRelativeDate(
            lastOrder?.createdAt,
          )}
          description={formatDate(
            lastOrder?.createdAt,
          )}
          iconClass="bg-rose-50 text-rose-600"
        />
      </section>

      {/* NAVIGATION */}

      <nav className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-max">
          {[
            ["#orders", "Riwayat Pesanan", ShoppingCart],
            ["#addresses", "Alamat", MapPin],
            ["#rewards", "Poin & Voucher", Ticket],
            ["#favorites", "Produk Favorit", Star],
            ["#notes", "Catatan", FileText],
            ["#activity", "Aktivitas", CalendarDays],
          ].map(([href, label, Icon]) => {
            const ItemIcon = Icon as LucideIcon;

            return (
              <a
                key={href as string}
                href={href as string}
                className={[
                  "inline-flex min-h-14 items-center gap-2",
                  "border-b-2 px-4 text-sm",
                  href === "#orders"
                    ? "border-[var(--pisjo-primary)] font-semibold text-[var(--pisjo-ocean)]"
                    : "border-transparent font-medium text-slate-600 hover:text-[var(--pisjo-ocean)]",
                ].join(" ")}
              >
                <ItemIcon className="h-4 w-4" />
                {label as string}
              </a>
            );
          })}
        </div>
      </nav>

      {/* CONTENT */}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 space-y-4">
          {/* ORDER HISTORY */}

          <section
            id="orders"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SectionHeader
              icon={ShoppingCart}
              title="Riwayat Pesanan"
              action={
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pisjo-primary)]/30 px-3 py-2 text-xs font-semibold text-[var(--pisjo-ocean)] hover:bg-[var(--pisjo-soft-blue)]"
                >
                  Lihat Semua
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            />

            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Belum ada transaksi berhasil.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        No. Pesanan
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        Tanggal
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                        Jumlah Item
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                        Total Belanja
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                        Status
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.slice(0, 5).map((order) => {
                      const itemCount =
                        order.items.reduce(
                          (sum, item) =>
                            sum + item.quantity,
                          0,
                        );

                      return (
                        <tr
                          key={order.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3.5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-semibold text-[var(--pisjo-ocean)] hover:underline"
                            >
                              #{order.orderNumber}
                            </Link>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                            {formatDate(order.createdAt)}
                          </td>

                          <td className="px-4 py-3.5 text-center text-slate-600">
                            {itemCount} item
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-[var(--pisjo-navy)]">
                            {formatCurrency(order.total)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1",
                                "text-xs font-semibold ring-1 ring-inset",
                                getOrderStatusClass(
                                  order.status,
                                ),
                              ].join(" ")}
                            >
                              {getOrderStatusLabel(
                                order.status,
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[var(--pisjo-primary)]/30 hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
                            >
                              Detail
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ADDRESSES */}

          <section
            id="addresses"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SectionHeader
              icon={MapPin}
              title="Alamat Tersimpan"
              action={
                <span className="rounded-lg border border-[var(--pisjo-primary)]/30 px-3 py-2 text-xs font-semibold text-[var(--pisjo-ocean)]">
                  {addresses.length} alamat
                </span>
              }
            />

            {addresses.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Belum ada alamat tersimpan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="flex gap-3 p-4 sm:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--pisjo-navy)]">
                          {address.label || "Alamat"}
                        </h3>

                        {address.isDefault ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Utama
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {address.receiverName}
                        {address.receiverPhone
                          ? ` · ${address.receiverPhone}`
                          : ""}
                      </p>

                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {address.fullAddress}
                      </p>

                      <p className="text-sm leading-5 text-slate-500">
                        {[
                          address.village,
                          address.district,
                          address.city,
                          address.province,
                          address.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* REWARDS */}

          <section
            id="rewards"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SectionHeader
              icon={Ticket}
              title="Poin & Voucher"
            />

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-600" />

                  <div>
                    <p className="text-xs text-amber-700">
                      Poin Tersedia
                    </p>

                    <p className="mt-1 text-xl font-bold text-[var(--pisjo-navy)]">
                      {Number(
                        customer.rewardPointsBalance,
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
  <div className="flex items-start gap-3">
    <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-[var(--pisjo-ocean)]" />

    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            Voucher
          </p>

          <p className="mt-1 text-xl font-bold text-[var(--pisjo-navy)]">
            {customer.userVouchers.length}
          </p>
        </div>

        {customer.userVouchers.length > 0 && (
          <span className="rounded-full bg-[var(--pisjo-ocean)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--pisjo-ocean)]">
            Tersedia
          </span>
        )}
      </div>

      {customer.userVouchers.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Customer belum memiliki voucher.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {customer.userVouchers.slice(0, 3).map((userVoucher) => {
            const voucher = userVoucher.voucher;
            const usage = voucher.usages[0];

            return (
              <div
                key={userVoucher.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--pisjo-navy)]">
                      {voucher.name}
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-[var(--pisjo-ocean)]">
                      {voucher.code}
                    </p>
                  </div>

                  <span
                    className={
                      usage
                        ? "shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500"
                        : "shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                    }
                  >
                    {usage ? "Sudah digunakan" : "Belum digunakan"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span>
                    Diperoleh{" "}
                    {new Date(
                      userVoucher.redeemedAt,
                    ).toLocaleDateString("id-ID")}
                  </span>

                  {usage && (
                    <span>
                      Digunakan{" "}
                      {new Date(
                        usage.usedAt,
                      ).toLocaleDateString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {customer.userVouchers.length > 3 && (
            <p className="pt-1 text-xs text-slate-500">
              +{customer.userVouchers.length - 3} voucher lainnya
            </p>
          )}
        </div>
      )}
    </div>
  </div>
</div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          {/* FAVORITES */}

          <section
            id="favorites"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SectionHeader
              icon={Star}
              title="Produk Favorit"
            />

            {favoriteProducts.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Belum ada produk favorit.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {favoriteProducts.map((product) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
                      <Package className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--pisjo-navy)]">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Dibeli {product.quantity}×
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-[var(--pisjo-navy)]">
                      {product.quantity}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* NOTES */}

          <section
            id="notes"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SectionHeader
              icon={FileText}
              title="Catatan Customer"
            />

            <div className="p-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-500">
                  Belum ada catatan customer.
                </p>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Field catatan customer belum tersedia pada model User saat ini.
              </p>
            </div>
          </section>

          {/* ACTIVITY */}

          <section
            id="activity"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SectionHeader
              icon={CalendarDays}
              title="Aktivitas"
            />

            <div className="space-y-4 p-4">
              <div className="flex gap-3">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--pisjo-primary)]" />

                <div>
                  <p className="text-sm font-semibold text-[var(--pisjo-navy)]">
                    Customer terdaftar
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(customer.createdAt)}
                  </p>
                </div>
              </div>

              {lastOrder ? (
                <div className="flex gap-3">
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

                  <div>
                    <p className="text-sm font-semibold text-[var(--pisjo-navy)]">
                      Transaksi berhasil terakhir
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(lastOrder.createdAt)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
