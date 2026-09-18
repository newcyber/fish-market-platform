"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export default function AdminProductsPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
}: AdminProductsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safeTotalPages = Math.max(
    1,
    totalPages
  );

  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    safeTotalPages
  );

  const startItem =
    total === 0
      ? 0
      : (safeCurrentPage - 1) * pageSize + 1;

  const endItem =
    total === 0
      ? 0
      : Math.min(
          safeCurrentPage * pageSize,
          total
        );

  function buildUrl(
    page: number,
    limit = pageSize
  ) {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("page", String(page));
    params.set("limit", String(limit));

    return `${pathname}?${params.toString()}`;
  }

  function handlePageChange(page: number) {
    const nextPage = Math.min(
      Math.max(1, page),
      safeTotalPages
    );

    router.push(
      buildUrl(nextPage),
      {
        scroll: false,
      }
    );
  }

  function handlePageSizeChange(
  value: string | null
) {
  if (value === null) {
    return;
  }

  const nextLimit = Number(value);

  if (
    !PAGE_SIZE_OPTIONS.includes(
      nextLimit as (typeof PAGE_SIZE_OPTIONS)[number]
    )
  ) {
    return;
  }

  router.push(
    buildUrl(1, nextLimit),
    {
      scroll: false,
    }
  );
}

  const canGoPrevious =
    safeCurrentPage > 1;

  const canGoNext =
    safeCurrentPage < safeTotalPages;

  return (
    <div
      className="
        flex flex-col gap-4
        rounded-xl border bg-card
        px-4 py-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      {/* ======================================================
          INFORMATION
          ====================================================== */}

      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          {total === 0 ? (
            "Belum ada produk"
          ) : (
            <>
              Menampilkan{" "}
              <span className="font-medium text-foreground">
                {startItem.toLocaleString("id-ID")}
              </span>
              {" - "}
              <span className="font-medium text-foreground">
                {endItem.toLocaleString("id-ID")}
              </span>
              {" dari "}
              <span className="font-medium text-foreground">
                {total.toLocaleString("id-ID")}
              </span>
              {" produk"}
            </>
          )}
        </p>
      </div>

      {/* ======================================================
          PAGINATION CONTROL
          ====================================================== */}

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {/* Previous */}
        <button
          type="button"
          onClick={() =>
            handlePageChange(
              safeCurrentPage - 1
            )
          }
          disabled={!canGoPrevious}
          aria-label="Halaman sebelumnya"
          className="
            inline-flex h-9 w-9
            shrink-0
            items-center justify-center
            rounded-md
            border border-input
            bg-background
            text-muted-foreground
            shadow-xs
            transition-colors
            hover:bg-accent
            hover:text-accent-foreground
            disabled:pointer-events-none
            disabled:opacity-40
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            focus-visible:ring-offset-2
          "
        >
          <ChevronLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>

        {/* Page indicator */}
        <div
          className="
            flex min-w-[74px]
            items-center justify-center
            gap-2
            text-sm
            font-medium
            text-foreground
          "
          aria-live="polite"
        >
          <span>
            {safeCurrentPage}
          </span>

          <span className="text-muted-foreground">
            /
          </span>

          <span>
            {safeTotalPages}
          </span>
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() =>
            handlePageChange(
              safeCurrentPage + 1
            )
          }
          disabled={!canGoNext}
          aria-label="Halaman berikutnya"
          className="
            inline-flex h-9 w-9
            shrink-0
            items-center justify-center
            rounded-md
            border border-input
            bg-background
            text-muted-foreground
            shadow-xs
            transition-colors
            hover:bg-accent
            hover:text-accent-foreground
            disabled:pointer-events-none
            disabled:opacity-40
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            focus-visible:ring-offset-2
          "
        >
          <ChevronRight
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>

        {/* ==================================================
            PAGE SIZE
            ================================================== */}

        <Select
          value={String(pageSize)}
          onValueChange={
            handlePageSizeChange
          }
        >
          <SelectTrigger
            className="
              h-9
              w-[126px]
              shrink-0
              gap-1
              rounded-md
              border-input
              bg-background
              text-sm
            "
            aria-label="Jumlah produk per halaman"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent
            align="end"
            className="min-w-[126px]"
          >
            {PAGE_SIZE_OPTIONS.map(
              (option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                >
                  {option} / halaman
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}