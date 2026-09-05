import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

import OrderStatsCards from "@/components/admin/orders/OrderStatsCards";
import OrderTable from "@/components/admin/orders/OrderTable";
import OrderToolbar from "@/components/admin/orders/OrderToolbar";

/**
 * ==========================================================
 * PAGE CONFIG
 * ==========================================================
 */

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

/**
 * ==========================================================
 * SEARCH PARAMS
 * ==========================================================
 */

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentStatus?: string;
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
  fallback: number
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function parseOrderStatus(
  value: string | undefined
): OrderStatus | undefined {
  if (!value) {
    return undefined;
  }

  return Object.values(OrderStatus).includes(
    value as OrderStatus
  )
    ? (value as OrderStatus)
    : undefined;
}

function parsePaymentStatus(
  value: string | undefined
): PaymentStatus | undefined {
  if (!value) {
    return undefined;
  }

  return Object.values(
    PaymentStatus
  ).includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : undefined;
}

/**
 * ==========================================================
 * URL BUILDER
 * ==========================================================
 *
 * Pagination hanya mengubah parameter "page".
 *
 * Search, status, dan paymentStatus tetap dipertahankan.
 */

function createPageUrl(
  page: number,
  search?: string,
  status?: string,
  paymentStatus?: string
) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (status) {
    params.set("status", status);
  }

  if (paymentStatus) {
    params.set(
      "paymentStatus",
      paymentStatus
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page)
    );
  }

  const queryString = params.toString();

  return queryString
    ? `/admin/orders?${queryString}`
    : "/admin/orders";
}

/**
 * ==========================================================
 * PAGE
 * ==========================================================
 */

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params = await searchParams;

  /**
   * ========================================================
   * NORMALIZE FILTERS
   * ========================================================
   */

  const search =
    params.search?.trim() || "";

  const status =
    parseOrderStatus(params.status);

  const paymentStatus =
    parsePaymentStatus(
      params.paymentStatus
    );

  const requestedPage =
    parsePositiveInteger(
      params.page,
      1
    );

  /**
   * ========================================================
   * LOAD DATA
   * ========================================================
   *
   * Semua query independen dijalankan paralel.
   */

  const [
    stats,
    statusCounts,
    orderResult,
  ] = await Promise.all([
    OrderService.getAdminOrderStats(),

    OrderService.getAdminOrderStatusCounts(),

    OrderService.getAdminOrders({
      page: requestedPage,
      limit: PAGE_SIZE,
      search: search || undefined,
      status,
      paymentStatus,
    }),
  ]);

  /**
   * ========================================================
   * PAGINATION NORMALIZATION
   * ========================================================
   *
   * Service sudah menghitung totalPages.
   *
   * Namun jika user membuka page yang sudah tidak tersedia
   * setelah data berubah, kita arahkan secara aman ke halaman
   * terakhir yang tersedia.
   */

  const totalPages =
    orderResult.pagination.totalPages;

  const currentPage = Math.min(
    orderResult.pagination.page,
    totalPages
  );

  /**
   * ========================================================
   * ORDER DTO
   * ========================================================
   *
   * Decimal Prisma dinormalisasi menjadi number
   * sebelum dikirim ke Client Component.
   */

  const orders = orderResult.orders.map(
    (order) => ({
      id: order.id,

      orderNumber:
        order.orderNumber,

      total: Number(
        order.total
      ),

      status:
        order.status,

      paymentStatus:
        order.paymentStatus,

      createdAt:
        order.createdAt,

      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },

      items: order.items.map(
        (item) => ({
          id: item.id,

          productName:
            item.productName,

          productVariant:
            item.productVariant,

          productWeight:
            item.productWeight,

          quantity:
            item.quantity,

          price: Number(
            item.price
          ),

          subtotal: Number(
            item.subtotal
          ),
        })
      ),
    })
  );

  /**
   * ========================================================
   * PAGINATION RANGE
   * ========================================================
   */

  const totalOrders =
    orderResult.pagination.total;

  const startItem =
    totalOrders === 0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const endItem =
    totalOrders === 0
      ? 0
      : Math.min(
          currentPage * PAGE_SIZE,
          totalOrders
        );

  /**
   * ========================================================
   * PAGE NUMBERS
   * ========================================================
   *
   * Mobile/desktop tidak perlu menampilkan puluhan nomor.
   *
   * Kita tampilkan:
   *
   * - halaman pertama
   * - halaman sekitar halaman aktif
   * - halaman terakhir
   *
   * dengan ellipsis bila diperlukan.
   */

  const pageNumbers: Array<
    number | "ellipsis"
  > = [];

  if (totalPages <= 7) {
    for (
      let page = 1;
      page <= totalPages;
      page += 1
    ) {
      pageNumbers.push(page);
    }
  } else {
    pageNumbers.push(1);

    if (currentPage > 4) {
      pageNumbers.push("ellipsis");
    }

    const startPage = Math.max(
      2,
      currentPage - 1
    );

    const endPage = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      pageNumbers.push(page);
    }

    if (
      currentPage <
      totalPages - 3
    ) {
      pageNumbers.push("ellipsis");
    }

    pageNumbers.push(totalPages);
  }

  /**
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <div className="min-w-0 space-y-6">
      {/* ================================================== */}
      {/* PAGE HEADER                                        */}
      {/* ================================================== */}

      <section className="min-w-0">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-[var(--pisjo-navy)] sm:text-2xl">
                Pesanan
              </h1>

              <p className="mt-0.5 text-sm text-[var(--pisjo-text-secondary)]">
                Kelola dan pantau seluruh pesanan
                customer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* KPI                                                */}
      {/* ================================================== */}

      <OrderStatsCards
        totalOrders={
          stats.totalOrders
        }
        totalSales={
          stats.totalSales
        }
        averageOrder={
          stats.averageOrder
        }
        completedOrders={
          stats.completedOrders
        }
        pendingPayments={
          stats.pendingPayments
        }
      />

      {/* ================================================== */}
      {/* TOOLBAR                                            */}
      {/* ================================================== */}

      <OrderToolbar
        search={search}
        status={
          status ?? "all"
        }
        paymentStatus={
          paymentStatus ?? "all"
        }
        statusCounts={
          statusCounts
        }
      />

      {/* ================================================== */}
      {/* RESULT SUMMARY                                     */}
      {/* ================================================== */}

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--pisjo-navy)]">
              Daftar Pesanan
            </h2>

            <p className="mt-0.5 text-xs text-[var(--pisjo-text-secondary)]">
              {totalOrders > 0
                ? `Menampilkan ${startItem.toLocaleString(
                    "id-ID"
                  )}–${endItem.toLocaleString(
                    "id-ID"
                  )} dari ${totalOrders.toLocaleString(
                    "id-ID"
                  )} pesanan`
                : "Belum ada pesanan yang sesuai dengan filter."}
            </p>
          </div>

          {totalPages > 1 && (
            <p className="shrink-0 text-xs text-slate-500">
              Halaman{" "}
              <span className="font-semibold text-slate-700">
                {currentPage}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-700">
                {totalPages}
              </span>
            </p>
          )}
        </div>

        {/* ================================================== */}
        {/* ORDER TABLE                                       */}
        {/* ================================================== */}

        <div className="min-w-0 p-0">
          <OrderTable data={orders} />
        </div>

        {/* ================================================== */}
        {/* PAGINATION                                        */}
        {/* ================================================== */}

        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* ========================================== */}
              {/* PAGINATION INFO                            */}
              {/* ========================================== */}

              <p className="text-xs text-slate-500">
                Halaman{" "}
                <span className="font-semibold text-slate-700">
                  {currentPage}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>
              </p>

              {/* ========================================== */}
              {/* PAGINATION CONTROLS                        */}
              {/* ========================================== */}

              <nav
                aria-label="Pagination pesanan"
                className="flex min-w-0 items-center gap-1.5 overflow-x-auto"
              >
                {/* ======================================== */}
                {/* PREVIOUS                                 */}
                {/* ======================================== */}

                {currentPage > 1 ? (
                  <Link
                    href={createPageUrl(
                      currentPage - 1,
                      search,
                      status,
                      paymentStatus
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
                    (pageNumber, index) => {
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
                            key={pageNumber}
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
                          key={pageNumber}
                          href={createPageUrl(
                            pageNumber,
                            search,
                            status,
                            paymentStatus
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
                      search,
                      status,
                      paymentStatus
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
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
