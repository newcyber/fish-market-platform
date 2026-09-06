import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import CustomerStats from "@/components/admin/customers/CustomerStats";
import CustomerToolbar from "@/components/admin/customers/CustomerToolbar";
import CustomerTable from "@/components/admin/customers/CustomerTable";
import { requireAdmin } from "@/lib/auth/admin";

import CustomerService, {
  type CustomerSegment,
} from "@/services/customer/customer.service";

const PAGE_SIZE = 10;

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    segment?: string;
    area?: string;
    page?: string;
  }>;
}

/**
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function parsePositiveInteger(
  value: string | undefined,
  fallback = 1
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function parseCustomerSegment(
  value: string | undefined
): CustomerSegment | undefined {
  if (!value) {
    return undefined;
  }

  const segments: CustomerSegment[] = [
    "BARU",
    "REPEAT",
    "LOYAL",
    "VIP",
    "AKTIF",
    "DORMANT",
  ];

  return segments.includes(
    value as CustomerSegment
  )
    ? (value as CustomerSegment)
    : undefined;
}

/**
 * ==========================================================
 * URL BUILDER
 * ==========================================================
 *
 * Pagination hanya mengubah parameter "page".
 *
 * Search, status, segment, dan area tetap dipertahankan.
 */
function createPageUrl(
  page: number,
  search?: string,
  status?: string,
  segment?: string,
  area?: string
) {
  const params =
    new URLSearchParams();

  if (search) {
    params.set(
      "search",
      search
    );
  }

  if (status) {
    params.set(
      "status",
      status
    );
  }

  if (segment) {
    params.set(
      "segment",
      segment
    );
  }

  if (area) {
    params.set(
      "area",
      area
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page)
    );
  }

  const queryString =
    params.toString();

  return queryString
    ? `/admin/customers?${queryString}`
    : "/admin/customers";
}

/**
 * ==========================================================
 * PAGE NUMBER BUILDER
 * ==========================================================
 *
 * Menampilkan maksimal pola:
 *
 * 1 2 3 ... 10
 *
 * atau:
 *
 * 1 ... 4 5 6 ... 10
 */
function buildPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

/**
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  await requireAdmin();

  const params =
    await searchParams;

  /**
   * ========================================================
   * NORMALIZE FILTERS
   * ========================================================
   */

  const search =
    params.search?.trim() || "";

  const status =
    params.status === "active" ||
    params.status === "inactive"
      ? params.status
      : undefined;

  const segment =
    parseCustomerSegment(
      params.segment
    );

  const area =
    params.area?.trim() || "";

  const requestedPage =
    parsePositiveInteger(
      params.page,
      1
    );

  /**
   * ========================================================
   * LOAD DATA
   * ========================================================
   */

  const [
    stats,
    customerResult,
    areas,
  ] = await Promise.all([
    CustomerService.getCustomerStats(),

    CustomerService.getCustomerList({
      search:
        search || undefined,

      isActive:
        status === "active"
          ? true
          : status === "inactive"
            ? false
            : undefined,

      segment,

      area:
        area || undefined,

      page: requestedPage,

      limit: PAGE_SIZE,
    }),

    CustomerService.getCustomerAreas(),
  ]);

  /**
   * ========================================================
   * PAGINATION NORMALIZATION
   * ========================================================
   */

  const totalCustomers =
    customerResult.pagination.total;

  const totalPages =
    customerResult.pagination.totalPages;

  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(
          customerResult.pagination.page,
          totalPages
        );

  /**
   * ========================================================
   * DISPLAY RANGE
   * ========================================================
   */

  const startItem =
    totalCustomers === 0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const endItem =
    totalCustomers === 0
      ? 0
      : Math.min(
          currentPage * PAGE_SIZE,
          totalCustomers
        );

  /**
   * ========================================================
   * PAGE NUMBERS
   * ========================================================
   */

  const pageNumbers =
    buildPageNumbers(
      currentPage,
      totalPages
    );

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}

      <div>
        <h1 className="text-3xl font-bold">
          Daftar Customer
        </h1>

        <p className="text-muted-foreground">
          Kelola seluruh customer yang
          terdaftar pada sistem.
        </p>
      </div>

      {/* ================================================== */}
      {/* STATS                                              */}
      {/* ================================================== */}

      <CustomerStats
        stats={stats}
      />

      {/* ================================================== */}
      {/* TOOLBAR                                            */}
      {/* ================================================== */}

      <CustomerToolbar
        search={search}
        status={status}
        segment={segment}
        area={area}
        areas={areas}
      />

      {/* ================================================== */}
      {/* TABLE                                              */}
      {/* ================================================== */}

      <CustomerTable
  customers={customerResult.customers}
  startIndex={startItem - 1}
/>

      {/* ================================================== */}
      {/* PAGINATION                                         */}
      {/* ================================================== */}

      {totalPages > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* ============================================ */}
            {/* PAGINATION INFO                              */}
            {/* ============================================ */}

            <p className="text-xs text-slate-500">
              Menampilkan{" "}
              <span className="font-semibold text-slate-700">
                {startItem}–{endItem}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-700">
                {totalCustomers}
              </span>{" "}
              customer
            </p>

            {/* ============================================ */}
            {/* PAGINATION CONTROLS                          */}
            {/* ============================================ */}

            {totalPages > 1 && (
              <nav
                aria-label="Pagination customer"
                className="flex min-w-0 items-center gap-1.5 overflow-x-auto"
              >
                {/* ======================================== */}
                {/* PREVIOUS                                 */}
                {/* ======================================== */}

                {currentPage > 1 ? (
                  <Link
                    href={createPageUrl(
                      currentPage - 1,
                      search ||
                        undefined,
                      status,
                      segment,
                      area ||
                        undefined
                    )}
                    scroll={false}
                    className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-[var(--pisjo-primary)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    <span className="ml-1 hidden sm:inline">
                      Sebelumnya
                    </span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    <span className="ml-1 hidden sm:inline">
                      Sebelumnya
                    </span>
                  </span>
                )}

                {/* ======================================== */}
                {/* PAGE NUMBERS                              */}
                {/* ======================================== */}

                <div className="flex min-w-max items-center gap-1.5">
                  {pageNumbers.map(
                    (
                      pageNumber,
                      index
                    ) => {
                      if (
                        pageNumber ===
                        "ellipsis"
                      ) {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="inline-flex h-10 w-8 shrink-0 items-center justify-center text-sm text-slate-400"
                          >
                            …
                          </span>
                        );
                      }

                      const isActive =
                        pageNumber ===
                        currentPage;

                      if (isActive) {
                        return (
                          <span
                            key={
                              pageNumber
                            }
                            aria-current="page"
                            className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-primary)] px-3 text-sm font-semibold text-white shadow-sm"
                          >
                            {
                              pageNumber
                            }
                          </span>
                        );
                      }

                      return (
                        <Link
                          key={
                            pageNumber
                          }
                          href={createPageUrl(
                            pageNumber,
                            search ||
                              undefined,
                            status,
                            segment,
                            area ||
                              undefined
                          )}
                          scroll={false}
                          className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-[var(--pisjo-primary)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
                        >
                          {
                            pageNumber
                          }
                        </Link>
                      );
                    }
                  )}
                </div>

                {/* ======================================== */}
                {/* NEXT                                     */}
                {/* ======================================== */}

                {currentPage <
                totalPages ? (
                  <Link
                    href={createPageUrl(
                      currentPage + 1,
                      search ||
                        undefined,
                      status,
                      segment,
                      area ||
                        undefined
                    )}
                    scroll={false}
                    className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-[var(--pisjo-primary)] hover:bg-[var(--pisjo-soft-blue)] hover:text-[var(--pisjo-ocean)]"
                    aria-label="Halaman berikutnya"
                  >
                    <span className="mr-1 hidden sm:inline">
                      Berikutnya
                    </span>

                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-300"
                  >
                    <span className="mr-1 hidden sm:inline">
                      Berikutnya
                    </span>

                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
