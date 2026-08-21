"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  FormEvent,
  useState,
} from "react";

import {
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FlashSaleToolbarProps {
  search?: string;
  status?: string;
}

/**
 * ============================================================
 * FLASH SALE TOOLBAR
 * ============================================================
 *
 * Features:
 *
 * - Search campaign
 * - Filter status
 * - Reset filter
 * - Create Flash Sale
 *
 * Filter menggunakan URL search params agar:
 *
 * - Server page dapat membaca filter
 * - URL dapat dibagikan
 * - Browser back/forward tetap bekerja
 * - Data otomatis di-render ulang
 */

export function FlashSaleToolbar({
  search,
  status,
}: FlashSaleToolbarProps) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    searchValue,
    setSearchValue,
  ] = useState(
    search ?? ""
  );

  const [
    statusValue,
    setStatusValue,
  ] = useState(
    status ?? "all"
  );

  // Props are used as the initial state. Subsequent updates to filters
  // are applied via URL params. Avoid setting state synchronously in
  // effects to prevent cascading renders.

  /**
   * ==========================================================
   * BUILD URL
   * ==========================================================
   */

  function updateFilters(
    nextSearch:
      | string
      | undefined,
    nextStatus:
      | string
      | undefined
  ) {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    /**
     * Search
     */

    if (
      nextSearch &&
      nextSearch.trim()
    ) {
      params.set(
        "search",
        nextSearch.trim()
      );
    } else {
      params.delete(
        "search"
      );
    }

    /**
     * Status
     */

    if (
      nextStatus &&
      nextStatus !== "all"
    ) {
      params.set(
        "status",
        nextStatus
      );
    } else {
      params.delete(
        "status"
      );
    }

    /**
     * Reset pagination
     */

    params.delete(
      "page"
    );

    const query =
      params.toString();

    router.push(
      query
        ? `/admin/flash-sales?${query}`
        : "/admin/flash-sales"
    );
  }

  /**
   * ==========================================================
   * SEARCH SUBMIT
   * ==========================================================
   */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    updateFilters(
      searchValue,
      statusValue
    );
  }

  /**
   * ==========================================================
   * STATUS CHANGE
   * ==========================================================
   */

  function handleStatusChange(
    value: string
  ) {
    setStatusValue(
      value
    );

    updateFilters(
      searchValue,
      value
    );
  }

  /**
   * ==========================================================
   * RESET
   * ==========================================================
   */

  function handleReset() {
    setSearchValue("");
    setStatusValue("all");

    router.push(
      "/admin/flash-sales"
    );
  }

  /**
   * ==========================================================
   * CREATE FLASH SALE
   * ==========================================================
   */

  function handleCreate() {
    router.push(
      "/admin/flash-sales/create"
    );
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* ==================================================== */}
      {/* FILTERS */}
      {/* ==================================================== */}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* SEARCH */}

        <div className="relative w-full sm:w-70">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            value={
              searchValue
            }
            onChange={(
              event
            ) =>
              setSearchValue(
                event.target.value
              )
            }
            placeholder="Cari Flash Sale..."
            className="pl-9"
          />
        </div>

        {/* STATUS */}

        <select
          value={
            statusValue
          }
          onChange={(
            event
          ) =>
            handleStatusChange(
              event.target.value
            )
          }
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring sm:w-45"
        >
          <option value="all">
            Semua Status
          </option>

          <option value="DRAFT">
            Draft
          </option>

          <option value="ACTIVE">
            Aktif
          </option>

          <option value="ENDED">
            Berakhir
          </option>

          <option value="INACTIVE">
            Tidak Aktif
          </option>
        </select>

        {/* SEARCH BUTTON */}

        <Button
          type="submit"
          variant="secondary"
        >
          <Search className="mr-2 h-4 w-4" />

          Cari
        </Button>

        {/* RESET BUTTON */}

        <Button
          type="button"
          variant="outline"
          onClick={
            handleReset
          }
        >
          <RotateCcw className="mr-2 h-4 w-4" />

          Reset
        </Button>
      </form>

      {/* ==================================================== */}
      {/* CREATE */}
      {/* ==================================================== */}

      <Button
        type="button"
        onClick={
          handleCreate
        }
      >
        <Plus className="mr-2 h-4 w-4" />

        Buat Flash Sale
      </Button>
    </div>
  );
}