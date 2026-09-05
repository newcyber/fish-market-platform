"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  Plus,
  Search,
} from "lucide-react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * ==========================================================
 * ORDER STATUS COUNTS
 * ==========================================================
 */

interface OrderStatusCounts {
  total: number;

  [OrderStatus.PENDING]: number;
  [OrderStatus.WAITING_PAYMENT]: number;
  [OrderStatus.WAITING_VERIFICATION]: number;
  [OrderStatus.PROCESSING]: number;
  [OrderStatus.SHIPPING]: number;
  [OrderStatus.COMPLETED]: number;
  [OrderStatus.CANCELLED]: number;
}

/**
 * ==========================================================
 * PROPS
 * ==========================================================
 */

interface OrderToolbarProps {
  search?: string;
  status?: string;
  paymentStatus?: string;
  statusCounts: OrderStatusCounts;
}

/**
 * ==========================================================
 * STATUS TABS
 * ==========================================================
 */

const STATUS_TABS: Array<{
  value: "all" | OrderStatus;
  label: string;
}> = [
  {
    value: "all",
    label: "Semua",
  },
  {
    value: OrderStatus.PENDING,
    label: "Pending",
  },
  {
    value: OrderStatus.WAITING_PAYMENT,
    label: "Menunggu Pembayaran",
  },
  {
    value: OrderStatus.WAITING_VERIFICATION,
    label: "Menunggu Verifikasi",
  },
  {
    value: OrderStatus.PROCESSING,
    label: "Diproses",
  },
  {
    value: OrderStatus.SHIPPING,
    label: "Dikirim",
  },
  {
    value: OrderStatus.COMPLETED,
    label: "Selesai",
  },
  {
    value: OrderStatus.CANCELLED,
    label: "Dibatalkan",
  },
];

/**
 * ==========================================================
 * STATUS COUNT HELPER
 * ==========================================================
 */

function getStatusCount(
  value: "all" | OrderStatus,
  counts: OrderStatusCounts
) {
  if (value === "all") {
    return counts.total;
  }

  return counts[value];
}

/**
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

export default function OrderToolbar({
  search = "",
  status = "all",
  paymentStatus = "all",
  statusCounts,
}: OrderToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] =
    useState(search);

  /**
   * ==========================================================
   * SEARCH DEBOUNCE
   * ==========================================================
   *
   * Search tidak langsung melakukan navigation
   * pada setiap ketikan.
   *
   * Delay:
   * 400ms
   *
   * Search juga selalu menghapus page agar kembali
   * ke halaman pertama.
   */

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      const normalizedSearch =
        searchValue.trim();

      if (normalizedSearch) {
        params.set(
          "search",
          normalizedSearch
        );
      } else {
        params.delete("search");
      }

      /**
       * Search berubah →
       * kembali ke halaman pertama.
       */
      params.delete("page");

      const queryString = params.toString();

      router.replace(
        queryString
          ? `${pathname}?${queryString}`
          : pathname,
        {
          scroll: false,
        }
      );
    }, 400);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    searchValue,
    pathname,
    router,
    searchParams,
  ]);

  /**
   * ==========================================================
   * STATUS FILTER
   * ==========================================================
   */

  function handleStatusChange(
    nextStatus: string
  ) {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (
      !nextStatus ||
      nextStatus === "all"
    ) {
      params.delete("status");
    } else {
      params.set(
        "status",
        nextStatus
      );
    }

    /**
     * Filter berubah →
     * kembali ke halaman pertama.
     */
    params.delete("page");

    const queryString = params.toString();

    router.push(
      queryString
        ? `${pathname}?${queryString}`
        : pathname,
      {
        scroll: false,
      }
    );
  }

/**
 * ==========================================================
 * PAYMENT STATUS FILTER
 * ==========================================================
 */

function handlePaymentStatusChange(
  nextPaymentStatus: string | null
) {
  const params = new URLSearchParams(
    searchParams.toString()
  );

  if (
    !nextPaymentStatus ||
    nextPaymentStatus === "all"
  ) {
    params.delete("paymentStatus");
  } else {
    params.set(
      "paymentStatus",
      nextPaymentStatus
    );
  }

  /**
   * Filter berubah →
   * kembali ke halaman pertama.
   */
  params.delete("page");

  const queryString = params.toString();

  router.push(
    queryString
      ? `${pathname}?${queryString}`
      : pathname,
    {
      scroll: false,
    }
  );
}

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {/* ================================================== */}
      {/* STATUS TABS                                        */}
      {/* ================================================== */}

      <div className="min-w-0">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[var(--pisjo-navy)]">
            Status Pesanan
          </h2>

          <p className="mt-0.5 text-xs text-[var(--pisjo-text-secondary)]">
            Pantau pesanan berdasarkan status.
          </p>
        </div>

        {/* ================================================== */}
        {/* HORIZONTAL STATUS SCROLL                           */}
        {/* ================================================== */}

        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-2">
            {STATUS_TABS.map((tab) => {
              const isActive =
                status === tab.value;

              const count =
                getStatusCount(
                  tab.value,
                  statusCounts
                );

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    handleStatusChange(
                      tab.value
                    )
                  }
                  className={[
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pisjo-primary)]/30",
                    isActive
                      ? "border-[var(--pisjo-primary)] bg-[var(--pisjo-primary)] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[var(--pisjo-primary)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]",
                  ].join(" ")}
                >
                  <span>
                    {tab.label}
                  </span>

                  <span
                    className={[
                      "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {count.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* SEARCH + FILTER + ACTION                           */}
      {/* ================================================== */}

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          {/* ================================================== */}
          {/* SEARCH                                             */}
          {/* ================================================== */}

          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(
                  event.target.value
                )
              }
              placeholder="Cari nomor order, customer, atau produk..."
              aria-label="Cari pesanan"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[var(--pisjo-primary)] focus:ring-2 focus:ring-[var(--pisjo-primary)]/10"
            />
          </div>

          {/* ================================================== */}
          {/* PAYMENT FILTER                                     */}
          {/* ================================================== */}

          <Select
            value={paymentStatus}
            onValueChange={
              handlePaymentStatusChange
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm lg:w-[210px]">
              <SelectValue placeholder="Pembayaran" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Pembayaran
              </SelectItem>

              <SelectItem
                value={
                  PaymentStatus.PENDING
                }
              >
                Menunggu Pembayaran
              </SelectItem>

              <SelectItem
                value={
                  PaymentStatus.VERIFIED
                }
              >
                Terverifikasi
              </SelectItem>

              <SelectItem
                value={
                  PaymentStatus.REJECTED
                }
              >
                Ditolak
              </SelectItem>
            </SelectContent>
          </Select>

          {/* ================================================== */}
          {/* CREATE ORDER                                       */}
          {/* ================================================== */}

          <Link
            href="/admin/orders/create"
            className="w-full lg:w-auto"
          >
            <Button
              type="button"
              className="h-11 w-full gap-2 rounded-xl bg-[var(--pisjo-primary)] px-5 text-white shadow-sm hover:bg-[var(--pisjo-ocean)] lg:w-auto"
            >
              <Plus className="h-4 w-4" />
              Buat Order
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
