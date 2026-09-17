"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { bulkCategoryAction } from "@/actions/category/bulk-category-actions";
import { deleteCategoryAction } from "@/actions/category/delete-category";
import { moveCategoryAction } from "@/actions/category/move-category";
import { permanentDeleteCategoryAction } from "@/actions/category/permanent-delete-category";
import { restoreCategoryAction } from "@/actions/category/restore-category";
import { updateCategorySortOrderAction } from "@/actions/category/update-category-sort-order";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CategoryTableItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  totalProducts: number;
}

interface CategoryFilters {
  search?: string;
  active?: boolean;
  deleted?: boolean;
}

interface CategoryTableProps {
  categories: CategoryTableItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters?: CategoryFilters;
}

type SelectionMode =
  | "explicit"
  | "all-filtered"
  | "none";

type NormalBulkAction =
  | "activate"
  | "deactivate"
  | "delete"
  | "restore"
  | "permanent-delete";

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function buildPageNumbers(
  page: number,
  totalPages: number,
) {
  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  const pages = new Set<number>([
    1,
    totalPages,
    page,
    page - 1,
    page + 1,
  ]);

  return [...pages]
    .filter(
      (item) =>
        item >= 1 &&
        item <= totalPages,
    )
    .sort((a, b) => a - b);
}

function CategoryThumbnail({
  image,
  name,
}: {
  image?: string | null;
  name: string;
}) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-semibold leading-tight text-slate-400">
          No Image
        </div>
      )}
    </div>
  );
}

function BulkActions({
  selectedCount,
  visibleCount,
  allSelected,
  someSelected,
  canSelectAllFiltered,
  onSelectAll,
  onClear,
  onAction,
  isPending,
  isRecycleBin,
}: {
  selectedCount: number;
  visibleCount: number;
  allSelected: boolean;
  someSelected: boolean;
  canSelectAllFiltered: boolean;
  onSelectAll: (checked: boolean) => void;
  onClear: () => void;
  onAction: (
    action: NormalBulkAction,
  ) => void;
  isPending: boolean;
  isRecycleBin: boolean;
}) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="border-b bg-muted/20 px-4 py-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) =>
              onSelectAll(
                event.target.checked,
              )
            }
            ref={(element) => {
              if (element) {
                element.indeterminate =
                  someSelected &&
                  !allSelected;
              }
            }}
            disabled={isPending}
            className="h-4 w-4 rounded border-input accent-primary"
            aria-label="Pilih semua kategori yang sedang tampil"
          />

          <div className="flex items-baseline gap-2">
            <span className="font-medium">
              {formatNumber(selectedCount)}{" "}
              kategori dipilih
            </span>

            <span className="text-xs text-muted-foreground">
              dari{" "}
              {formatNumber(visibleCount)}{" "}
              kategori yang tampil
            </span>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={isPending}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Batal pilih
          </button>
        </div>

        {canSelectAllFiltered && (
          <div className="rounded-lg border bg-background px-3 py-2 text-sm">
            Semua{" "}
            {formatNumber(visibleCount)}{" "}
            kategori di halaman ini dipilih.

            <button
              type="button"
              onClick={() =>
                onSelectAll(true)
              }
              disabled={isPending}
              className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              Pilih semua hasil filter
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {isRecycleBin ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onAction("restore")}
                disabled={isPending}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Pulihkan
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onAction("permanent-delete")}
                disabled={isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Hapus Permanen
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onAction("activate")}
                disabled={isPending}
              >
                <Power className="mr-1.5 h-4 w-4" />
                Aktifkan
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onAction("deactivate")}
                disabled={isPending}
              >
                <PowerOff className="mr-1.5 h-4 w-4" />
                Nonaktifkan
              </Button>

              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onAction("delete")}
                disabled={isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Hapus
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoryTable({
  categories,
  total,
  page,
  limit,
  totalPages,
  filters = {},
}: CategoryTableProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [movingCategoryId, setMovingCategoryId] =
    useState<string | null>(null);

  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("none");

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [excludedIds, setExcludedIds] =
    useState<Set<string>>(
      () => new Set(),
    );

  const [sortValues, setSortValues] =
    useState<Record<string, string>>(
      () =>
        Object.fromEntries(
          categories.map(
            (category) => [
              category.id,
              String(category.sortOrder),
            ],
          ),
        ),
    );

  const [savingSortId, setSavingSortId] =
    useState<string | null>(null);

  const isRecycleBin =
    filters?.deleted === true;

  /*
   * Selection harus di-reset ketika:
   * - search berubah
   * - active/inactive berubah
   * - masuk/keluar recycle bin
   */
  const selectionKey =
    `${filters?.search ?? ""}|${
      filters?.active === undefined
        ? "all"
        : filters.active
          ? "active"
          : "inactive"
    }|${
      filters?.deleted === true
        ? "deleted"
        : "normal"
    }`;

  useEffect(() => {
    setSelectionMode("none");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, [selectionKey]);

  useEffect(() => {
    setSortValues((current) => {
      const next = {
        ...current,
      };

      categories.forEach(
        (category) => {
          next[category.id] =
            String(category.sortOrder);
        },
      );

      return next;
    });
  }, [categories]);

  const visibleIds = useMemo(
    () =>
      categories.map(
        (category) => category.id,
      ),
    [categories],
  );

  const visibleSelectedCount =
    useMemo(() => {
      if (
        selectionMode ===
        "all-filtered"
      ) {
        return visibleIds.filter(
          (id) =>
            !excludedIds.has(id),
        ).length;
      }

      return visibleIds.filter(
        (id) => selectedIds.has(id),
      ).length;
    }, [
      selectionMode,
      visibleIds,
      selectedIds,
      excludedIds,
    ]);

  const selectedCount =
    selectionMode === "all-filtered"
      ? Math.max(
          0,
          total - excludedIds.size,
        )
      : selectedIds.size;

  const allVisibleSelected =
    categories.length > 0 &&
    visibleSelectedCount ===
      categories.length;

  const someVisibleSelected =
    visibleSelectedCount > 0 &&
    !allVisibleSelected;

  function toggleSelected(
    id: string,
    checked: boolean,
  ) {
    if (
      selectionMode ===
      "all-filtered"
    ) {
      setExcludedIds((current) => {
        const next = new Set(
          current,
        );

        if (checked) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      });

      return;
    }

    setSelectionMode("explicit");

    setSelectedIds((current) => {
      const next = new Set(
        current,
      );

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      if (next.size === 0) {
        setSelectionMode("none");
      }

      return next;
    });
  }

  function selectCurrentPage(
    checked: boolean,
  ) {
    if (
      selectionMode ===
      "all-filtered"
    ) {
      setExcludedIds((current) => {
        const next = new Set(
          current,
        );

        visibleIds.forEach((id) => {
          if (checked) {
            next.delete(id);
          } else {
            next.add(id);
          }
        });

        return next;
      });

      return;
    }

    if (!checked) {
      setSelectedIds((current) => {
        const next = new Set(
          current,
        );

        visibleIds.forEach((id) =>
          next.delete(id),
        );

        if (next.size === 0) {
          setSelectionMode("none");
        }

        return next;
      });

      return;
    }

    setSelectionMode("explicit");

    setSelectedIds((current) => {
      const next = new Set(
        current,
      );

      visibleIds.forEach((id) =>
        next.add(id),
      );

      return next;
    });
  }

  function selectAllFiltered() {
    setSelectionMode(
      "all-filtered",
    );

    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }

  function clearSelection() {
    setSelectionMode("none");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }

  function handleBulkAction(
    action: NormalBulkAction,
  ) {
    if (selectedCount === 0) {
      return;
    }

    const isRecycleAction =
      action === "restore" ||
      action === "permanent-delete";

    if (isRecycleAction !== isRecycleBin) {
      return;
    }

    const actionLabel =
      action === "activate"
        ? "mengaktifkan"
        : action === "deactivate"
          ? "menonaktifkan"
          : action === "delete"
            ? "memindahkan ke Recycle Bin"
            : action === "restore"
              ? "memulihkan"
              : "menghapus permanen";

    const confirmationMessage =
      action === "permanent-delete"
        ? `HAPUS PERMANEN ${formatNumber(
            selectedCount,
          )} kategori yang dipilih?\n\nKategori yang masih memiliki produk akan ditolak.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`
        : `${actionLabel[0].toUpperCase()}${actionLabel.slice(
            1,
          )} ${formatNumber(
            selectedCount,
          )} kategori yang dipilih?`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    if (action === "permanent-delete") {
      const secondConfirmation = window.confirm(
        `Konfirmasi terakhir:\n\n${formatNumber(
          selectedCount,
        )} kategori akan dihapus PERMANEN.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`,
      );

      if (!secondConfirmation) {
        return;
      }
    }

    const ids =
      selectionMode === "explicit"
        ? [...selectedIds]
        : undefined;

    const bulkFilters =
      selectionMode === "all-filtered"
        ? filters
        : undefined;

    const excluded =
      selectionMode === "all-filtered"
        ? [...excludedIds]
        : undefined;

    startTransition(async () => {
      try {
        const result = await bulkCategoryAction({
          action,
          ids,
          filters: bulkFilters,
          excludedIds: excluded,
        });

        if (!result.success) {
          window.alert(
            result.message ??
              "Aksi massal kategori gagal dilakukan.",
          );
          return;
        }

        clearSelection();
        router.refresh();
      } catch (error) {
        console.error(
          "Bulk category action failed:",
          error,
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Aksi massal kategori gagal dilakukan.",
        );
      }
    });
  }

  function handleSortChange(
    id: string,
    value: string,
  ) {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setSortValues((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function handleSaveSortOrder(
    category: CategoryTableItem,
  ) {
    if (isRecycleBin) {
      return;
    }

    const rawValue =
      sortValues[category.id] ??
      String(category.sortOrder);

    const parsedValue =
      Number(rawValue);

    if (
      !Number.isInteger(
        parsedValue,
      ) ||
      parsedValue < 0 ||
      parsedValue > 999999
    ) {
      window.alert(
        "Urutan harus berupa angka bulat antara 0 sampai 999.999.",
      );
      return;
    }

    if (
      parsedValue ===
      category.sortOrder
    ) {
      return;
    }

    setSavingSortId(category.id);

    startTransition(async () => {
      try {
        const result =
          await updateCategorySortOrderAction(
            category.id,
            parsedValue,
          );

        if (!result.success) {
          window.alert(
            result.message ??
              "Urutan kategori gagal diperbarui.",
          );
          return;
        }

        router.refresh();
      } catch (error) {
        console.error(
          "Gagal memperbarui urutan kategori:",
          error,
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Urutan kategori gagal diperbarui.",
        );
      } finally {
        setSavingSortId(null);
      }
    });
  }

  async function handleMove(
    id: string,
    direction: "up" | "down",
  ) {
    if (
      isRecycleBin ||
      movingCategoryId
    ) {
      return;
    }

    setMovingCategoryId(id);

    try {
      const result =
        await moveCategoryAction(
          id,
          direction,
        );

      if (!result.success) {
        window.alert(
          result.message ??
            "Kategori gagal dipindahkan.",
        );
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Gagal memindahkan kategori:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Kategori gagal dipindahkan. Silakan coba lagi.",
      );
    } finally {
      setMovingCategoryId(null);
    }
  }

  function handleDelete(
    category: CategoryTableItem,
  ) {
    if (isRecycleBin) {
      return;
    }

    if (
      category.totalProducts > 0
    ) {
      window.alert(
        `Kategori "${category.name}" masih memiliki ${formatNumber(
          category.totalProducts,
        )} produk. Pindahkan produk terlebih dahulu.`,
      );
      return;
    }

    if (
      !window.confirm(
        `Hapus kategori "${category.name}"?\n\nKategori akan dipindahkan ke Recycle Bin dan masih dapat dipulihkan.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const formData =
          new FormData();

        formData.append(
          "id",
          category.id,
        );

        await deleteCategoryAction(
          formData,
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Gagal menghapus kategori:",
          error,
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menghapus kategori.",
        );
      }
    });
  }

  async function handleRestore(
    category: CategoryTableItem,
  ) {
    if (
      !isRecycleBin ||
      movingCategoryId
    ) {
      return;
    }

    if (
      !window.confirm(
        `Pulihkan kategori "${category.name}"?\n\nKategori akan kembali ke daftar kategori normal.`,
      )
    ) {
      return;
    }

    setMovingCategoryId(category.id);

    try {
      const result =
        await restoreCategoryAction(
          category.id,
        );

      if (!result.success) {
        window.alert(
          result.message ??
            "Kategori gagal dipulihkan.",
        );
        return;
      }

      clearSelection();
      router.refresh();
    } catch (error) {
      console.error(
        "Gagal memulihkan kategori:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Kategori gagal dipulihkan.",
      );
    } finally {
      setMovingCategoryId(null);
    }
  }

  async function handlePermanentDelete(
    category: CategoryTableItem,
  ) {
    if (
      !isRecycleBin ||
      movingCategoryId
    ) {
      return;
    }

    if (
      category.totalProducts > 0
    ) {
      window.alert(
        `Kategori "${category.name}" tidak dapat dihapus permanen karena masih memiliki ${formatNumber(
          category.totalProducts,
        )} produk.\n\nPindahkan produk terlebih dahulu.`,
      );
      return;
    }

    const firstConfirmation =
      window.confirm(
        `HAPUS PERMANEN kategori "${category.name}"?\n\nData kategori akan benar-benar dihapus dari database dan tidak dapat dipulihkan.`,
      );

    if (!firstConfirmation) {
      return;
    }

    const secondConfirmation =
      window.confirm(
        `Konfirmasi terakhir:\n\nKategori "${category.name}" akan dihapus PERMANEN.\n\nTindakan ini TIDAK DAPAT DIBATALKAN.`,
      );

    if (!secondConfirmation) {
      return;
    }

    setMovingCategoryId(category.id);

    try {
      const result =
        await permanentDeleteCategoryAction(
          category.id,
        );

      if (!result.success) {
        window.alert(
          result.message ??
            "Kategori gagal dihapus permanen.",
        );
        return;
      }

      clearSelection();
      router.refresh();
    } catch (error) {
      console.error(
        "Gagal menghapus kategori permanen:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Kategori gagal dihapus permanen.",
      );
    } finally {
      setMovingCategoryId(null);
    }
  }

  function goToPage(
    nextPage: number,
  ) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    params.set(
      "page",
      String(nextPage),
    );

    router.push(
      `${window.location.pathname}?${params.toString()}`,
    );
  }

  const pageNumbers =
    buildPageNumbers(
      page,
      totalPages,
    );

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              {isRecycleBin
                ? "Recycle Bin Kategori"
                : "Daftar Kategori"}
            </h2>

            {isRecycleBin && (
              <Badge
                variant="secondary"
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Terhapus
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {isRecycleBin
              ? "Kategori yang dihapus sementara berada di sini. Pulihkan untuk mengembalikan kategori atau hapus permanen jika sudah tidak diperlukan."
              : "Kelola kategori, status, urutan, gambar, dan jumlah produk. Checkbox memilih kategori yang sedang tampil setelah filter/pencarian diterapkan."}
          </p>
        </div>
      </div>

      {selectedCount > 0 && (
        <BulkActions
          selectedCount={selectedCount}
          visibleCount={categories.length}
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          canSelectAllFiltered={
            allVisibleSelected &&
            total > categories.length &&
            selectionMode !== "all-filtered"
          }
          onSelectAll={(checked) => {
            if (checked) {
              selectCurrentPage(true);
            } else {
              selectCurrentPage(false);
            }
          }}
          onClear={clearSelection}
          onAction={handleBulkAction}
          isPending={
            isPending || movingCategoryId !== null
          }
          isRecycleBin={isRecycleBin}
        />
      )}

      {categories.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto max-w-md">
            {isRecycleBin ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Trash2 className="h-5 w-5 text-muted-foreground" />
                </div>

                <p className="mt-4 font-medium">
                  Recycle Bin kosong.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tidak ada kategori yang
                  sedang berada di Recycle
                  Bin.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={() => {
                    const params =
                      new URLSearchParams(
                        window.location.search,
                      );

                    params.delete(
                      "status",
                    );
                    params.delete(
                      "page",
                    );

                    router.push(
                      `${window.location.pathname}?${params.toString()}`,
                    );
                  }}
                >
                  Kembali ke Kategori
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium">
                  Belum ada kategori.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tidak ada kategori yang
                  cocok dengan filter saat
                  ini.
                </p>

                <Link
                  href="/admin/categories/create"
                  className="mt-5 inline-flex"
                >
                  <Button>
                    Tambah Kategori
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ======================================================
              DESKTOP
          ======================================================= */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        allVisibleSelected
                      }
                      onChange={(event) =>
                        selectCurrentPage(
                          event.target
                            .checked,
                        )
                      }
                      ref={(element) => {
                        if (element) {
                          element.indeterminate =
                            someVisibleSelected;
                        }
                      }}
                      disabled={
                        isPending ||
                        movingCategoryId !==
                          null
                      }
                      className="h-4 w-4 rounded border-input accent-primary"
                      aria-label="Pilih semua kategori yang sedang tampil"
                    />
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Kategori
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Slug
                  </th>

                  <th className="px-4 py-3 text-center font-medium">
                    Produk
                  </th>

                  {!isRecycleBin && (
                    <th className="px-4 py-3 text-center font-medium">
                      Urutan
                    </th>
                  )}

                  <th className="px-4 py-3 text-left font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {categories.map(
                  (category) => {
                    const checked =
                      selectionMode ===
                      "all-filtered"
                        ? !excludedIds.has(
                            category.id,
                          )
                        : selectedIds.has(
                            category.id,
                          );

                    const isMoving =
                      movingCategoryId ===
                      category.id;

                    return (
                      <tr
                        key={
                          category.id
                        }
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={(
                              event,
                            ) =>
                              toggleSelected(
                                category.id,
                                event
                                  .target
                                  .checked,
                              )
                            }
                            disabled={
                              isPending ||
                              movingCategoryId !==
                                null
                            }
                            className="h-4 w-4 rounded border-input accent-primary"
                            aria-label={`Pilih ${category.name}`}
                          />
                        </td>

                        {/* KATEGORI */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <CategoryThumbnail
                              image={
                                category.image
                              }
                              name={
                                category.name
                              }
                            />

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {
                                  category.name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                ID:{" "}
                                {
                                  category.id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* SLUG */}
                        <td className="max-w-[280px] truncate px-4 py-4 text-muted-foreground">
                          {
                            category.slug
                          }
                        </td>

                        {/* PRODUK */}
                        <td className="px-4 py-4 text-center">
                          <span className="font-medium">
                            {formatNumber(
                              category.totalProducts,
                            )}
                          </span>

                          <span className="ml-1 text-xs text-muted-foreground">
                            produk
                          </span>
                        </td>

                        {/* URUTAN */}
                        {!isRecycleBin && (
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleMove(
                                      category.id,
                                      "up",
                                    )
                                  }
                                  disabled={
                                    isPending ||
                                    movingCategoryId !==
                                      null
                                  }
                                  className="h-7 w-7 rounded-lg"
                                  aria-label={`Pindahkan ${category.name} ke atas`}
                                  title="Pindahkan ke atas"
                                >
                                  {isMoving ? (
                                    <span className="text-[10px]">
                                      ...
                                    </span>
                                  ) : (
                                    <ChevronUp className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleMove(
                                      category.id,
                                      "down",
                                    )
                                  }
                                  disabled={
                                    isPending ||
                                    movingCategoryId !==
                                      null
                                  }
                                  className="h-7 w-7 rounded-lg"
                                  aria-label={`Pindahkan ${category.name} ke bawah`}
                                  title="Pindahkan ke bawah"
                                >
                                  {isMoving ? (
                                    <span className="text-[10px]">
                                      ...
                                    </span>
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <input
                                type="number"
                                min={0}
                                max={999999}
                                inputMode="numeric"
                                value={
                                  sortValues[
                                    category.id
                                  ] ??
                                  String(
                                    category.sortOrder,
                                  )
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleSortChange(
                                    category.id,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                onKeyDown={(
                                  event,
                                ) => {
                                  if (
                                    event.key ===
                                    "Enter"
                                  ) {
                                    handleSaveSortOrder(
                                      category,
                                    );
                                  }
                                }}
                                disabled={
                                  isPending ||
                                  savingSortId ===
                                    category.id ||
                                  movingCategoryId !==
                                    null
                                }
                                className="h-9 w-20 rounded-md border bg-background px-2 text-center text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Urutan ${category.name}`}
                              />

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleSaveSortOrder(
                                    category,
                                  )
                                }
                                disabled={
                                  isPending ||
                                  savingSortId ===
                                    category.id ||
                                  movingCategoryId !==
                                    null ||
                                  Number(
                                    sortValues[
                                      category.id
                                    ] ??
                                      category.sortOrder,
                                  ) ===
                                    category.sortOrder
                                }
                                aria-label={`Simpan urutan ${category.name}`}
                                title="Simpan urutan"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}

                        {/* STATUS */}
                        <td className="px-4 py-4">
                          {isRecycleBin ? (
                            <Badge
                              variant="secondary"
                              className="gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Terhapus
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                category.isActive
                                  ? "default"
                                  : "secondary"
                              }
                              className="gap-1.5"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  category.isActive
                                    ? "bg-current"
                                    : "bg-muted-foreground"
                                }`}
                              />

                              {category.isActive
                                ? "Aktif · Tampil"
                                : "Nonaktif · Tersembunyi"}
                            </Badge>
                          )}
                        </td>

                        {/* AKSI */}
                        <td className="px-4 py-4">
                          {isRecycleBin ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRestore(
                                    category,
                                  )
                                }
                                disabled={
                                  isPending ||
                                  movingCategoryId !==
                                    null
                                }
                              >
                                <RotateCcw className="mr-1.5 h-4 w-4" />
                                Pulihkan
                              </Button>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handlePermanentDelete(
                                    category,
                                  )
                                }
                                disabled={
                                  isPending ||
                                  movingCategoryId !==
                                    null ||
                                  category.totalProducts >
                                    0
                                }
                                title={
                                  category.totalProducts >
                                  0
                                    ? "Pindahkan semua produk terlebih dahulu."
                                    : "Hapus permanen"
                                }
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Hapus Permanen
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/categories/${category.id}/edit`}
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  disabled={
                                    isPending ||
                                    movingCategoryId !==
                                      null
                                  }
                                  aria-label={`Edit ${category.name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  disabled={
                                    isPending ||
                                    movingCategoryId !==
                                      null
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                                  aria-label={`Aksi ${category.name}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/admin/categories/${category.id}/edit`,
                                      )
                                    }
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          category.isActive
                                            ? `Nonaktifkan kategori "${category.name}"?`
                                            : `Aktifkan kategori "${category.name}"?`,
                                        )
                                      ) {
                                        return;
                                      }

                                      startTransition(
                                        async () => {
                                          try {
                                            const result =
                                              await bulkCategoryAction(
                                                {
                                                  action:
                                                    category.isActive
                                                      ? "deactivate"
                                                      : "activate",
                                                  ids: [
                                                    category.id,
                                                  ],
                                                },
                                              );

                                            if (
                                              !result.success
                                            ) {
                                              window.alert(
                                                result.message ??
                                                  "Status kategori gagal diperbarui.",
                                              );
                                              return;
                                            }

                                            router.refresh();
                                          } catch (
                                            error
                                          ) {
                                            console.error(
                                              "Gagal mengubah status kategori:",
                                              error,
                                            );

                                            window.alert(
                                              error instanceof
                                                Error
                                                ? error.message
                                                : "Status kategori gagal diperbarui.",
                                            );
                                          }
                                        },
                                      );
                                    }}
                                  >
                                    {category.isActive ? (
                                      <>
                                        <PowerOff className="mr-2 h-4 w-4" />
                                        Nonaktifkan
                                      </>
                                    ) : (
                                      <>
                                        <Power className="mr-2 h-4 w-4" />
                                        Aktifkan
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDelete(
                                        category,
                                      )
                                    }
                                    disabled={
                                      category.totalProducts >
                                      0
                                    }
                                    title={
                                      category.totalProducts >
                                      0
                                        ? "Pindahkan semua produk dari kategori ini terlebih dahulu."
                                        : undefined
                                    }
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {/* ======================================================
              MOBILE
          ======================================================= */}
          <div className="divide-y md:hidden">
            {categories.map(
              (category) => {
                const checked =
                  selectionMode ===
                  "all-filtered"
                    ? !excludedIds.has(
                        category.id,
                      )
                    : selectedIds.has(
                        category.id,
                      );

                const isMoving =
                  movingCategoryId ===
                  category.id;

                return (
                  <article
                    key={category.id}
                    className="space-y-4 p-4 sm:p-5"
                  >
                    {/* HEADER */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={(
                          event,
                        ) =>
                          toggleSelected(
                            category.id,
                            event.target
                              .checked,
                          )
                        }
                        disabled={
                          isPending ||
                          movingCategoryId !==
                            null
                        }
                        className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
                        aria-label={`Pilih ${category.name}`}
                      />

                      <CategoryThumbnail
                        image={
                          category.image
                        }
                        name={
                          category.name
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">
                              {
                                category.name
                              }
                            </h3>

                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {
                                category.slug
                              }
                            </p>

                            <p className="mt-1 truncate text-[11px] text-slate-400">
                              ID:{" "}
                              {
                                category.id
                              }
                            </p>
                          </div>

                          {isRecycleBin ? (
                            <Badge
                              variant="secondary"
                              className="shrink-0 gap-1.5"
                            >
                              <Trash2 className="h-3 w-3" />
                              Terhapus
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                category.isActive
                                  ? "default"
                                  : "secondary"
                              }
                              className="shrink-0 gap-1.5"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  category.isActive
                                    ? "bg-current"
                                    : "bg-muted-foreground"
                                }`}
                              />

                              {category.isActive
                                ? "Aktif"
                                : "Nonaktif"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* INFO */}
                    <div
                      className={`grid gap-3 rounded-lg border bg-muted/30 p-3 ${
                        isRecycleBin
                          ? "grid-cols-1"
                          : "grid-cols-2"
                      }`}
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Produk
                        </p>

                        <p className="mt-0.5 font-semibold">
                          {formatNumber(
                            category.totalProducts,
                          )}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            produk
                          </span>
                        </p>
                      </div>

                      {!isRecycleBin && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Urutan
                          </p>

                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleMove(
                                    category.id,
                                    "up",
                                  )
                                }
                                disabled={
                                  isPending ||
                                  movingCategoryId !==
                                    null
                                }
                                className="h-7 w-7"
                                aria-label={`Pindahkan ${category.name} ke atas`}
                                title="Pindahkan ke atas"
                              >
                                {isMoving ? (
                                  <span className="text-[9px]">
                                    ...
                                  </span>
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleMove(
                                    category.id,
                                    "down",
                                  )
                                }
                                disabled={
                                  isPending ||
                                  movingCategoryId !==
                                    null
                                }
                                className="h-7 w-7"
                                aria-label={`Pindahkan ${category.name} ke bawah`}
                                title="Pindahkan ke bawah"
                              >
                                {isMoving ? (
                                  <span className="text-[9px]">
                                    ...
                                  </span>
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            <input
                              type="number"
                              min={0}
                              max={999999}
                              inputMode="numeric"
                              value={
                                sortValues[
                                  category.id
                                ] ??
                                String(
                                  category.sortOrder,
                                )
                              }
                              onChange={(
                                event,
                              ) =>
                                handleSortChange(
                                  category.id,
                                  event
                                    .target
                                    .value,
                                )
                              }
                              onKeyDown={(
                                event,
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  handleSaveSortOrder(
                                    category,
                                  );
                                }
                              }}
                              disabled={
                                isPending ||
                                savingSortId ===
                                  category.id ||
                                movingCategoryId !==
                                  null
                              }
                              className="h-9 w-20 rounded-md border bg-background px-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Urutan ${category.name}`}
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleSaveSortOrder(
                                  category,
                                )
                              }
                              disabled={
                                isPending ||
                                savingSortId ===
                                  category.id ||
                                movingCategoryId !==
                                  null ||
                                Number(
                                  sortValues[
                                    category.id
                                  ] ??
                                    category.sortOrder,
                                ) ===
                                  category.sortOrder
                              }
                              aria-label={`Simpan urutan ${category.name}`}
                              title="Simpan urutan"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    {isRecycleBin ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            handleRestore(
                              category,
                            )
                          }
                          disabled={
                            isPending ||
                            movingCategoryId !==
                              null
                          }
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Pulihkan
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={() =>
                            handlePermanentDelete(
                              category,
                            )
                          }
                          disabled={
                            isPending ||
                            movingCategoryId !==
                              null ||
                            category.totalProducts >
                              0
                          }
                          title={
                            category.totalProducts >
                            0
                              ? "Pindahkan semua produk terlebih dahulu."
                              : "Hapus permanen"
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Permanen
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="flex-1"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={
                              isPending ||
                              movingCategoryId !==
                                null
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (
                              !window.confirm(
                                category.isActive
                                  ? `Nonaktifkan kategori "${category.name}"?`
                                  : `Aktifkan kategori "${category.name}"?`,
                              )
                            ) {
                              return;
                            }

                            startTransition(
                              async () => {
                                try {
                                  const result =
                                    await bulkCategoryAction(
                                      {
                                        action:
                                          category.isActive
                                            ? "deactivate"
                                            : "activate",
                                        ids: [
                                          category.id,
                                        ],
                                      },
                                    );

                                  if (
                                    !result.success
                                  ) {
                                    window.alert(
                                      result.message ??
                                        "Status kategori gagal diperbarui.",
                                    );
                                    return;
                                  }

                                  router.refresh();
                                } catch (
                                  error
                                ) {
                                  console.error(
                                    "Gagal mengubah status kategori:",
                                    error,
                                  );

                                  window.alert(
                                    error instanceof
                                      Error
                                      ? error.message
                                      : "Status kategori gagal diperbarui.",
                                  );
                                }
                              },
                            );
                          }}
                          disabled={
                            isPending ||
                            movingCategoryId !==
                              null
                          }
                        >
                          {category.isActive ? (
                            <PowerOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Power className="mr-2 h-4 w-4" />
                          )}

                          {category.isActive
                            ? "Nonaktif"
                            : "Aktifkan"}
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            handleDelete(
                              category,
                            )
                          }
                          disabled={
                            isPending ||
                            movingCategoryId !==
                              null ||
                            category.totalProducts >
                              0
                          }
                          title={
                            category.totalProducts >
                            0
                              ? "Pindahkan semua produk dari kategori ini terlebih dahulu."
                              : "Hapus kategori"
                          }
                          aria-label={`Hapus ${category.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>

          {/* ======================================================
              PAGINATION
          ======================================================= */}
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan{" "}
              <span className="font-medium text-foreground">
                {formatNumber(
                  total === 0
                    ? 0
                    : (page - 1) *
                        limit +
                      1,
                )}
              </span>
              {"–"}
              <span className="font-medium text-foreground">
                {formatNumber(
                  Math.min(
                    page * limit,
                    total,
                  ),
                )}
              </span>
              {" dari "}
              <span className="font-medium text-foreground">
                {formatNumber(total)}
              </span>
              {" kategori"}
            </p>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    goToPage(
                      page - 1,
                    )
                  }
                  disabled={
                    page <= 1 ||
                    isPending ||
                    movingCategoryId !==
                      null
                  }
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageNumbers.map(
                  (
                    pageNumber,
                    index,
                  ) => {
                    const previous =
                      pageNumbers[
                        index - 1
                      ];

                    const showEllipsis =
                      previous !==
                        undefined &&
                      pageNumber -
                        previous >
                        1;

                    return (
                      <span
                        key={
                          pageNumber
                        }
                        className="contents"
                      >
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">
                            …
                          </span>
                        )}

                        <Button
                          type="button"
                          variant={
                            pageNumber ===
                            page
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            goToPage(
                              pageNumber,
                            )
                          }
                          disabled={
                            isPending ||
                            movingCategoryId !==
                              null
                          }
                          className="min-w-9"
                        >
                          {
                            pageNumber
                          }
                        </Button>
                      </span>
                    );
                  },
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    goToPage(
                      page + 1,
                    )
                  }
                  disabled={
                    page >=
                      totalPages ||
                    isPending ||
                    movingCategoryId !==
                      null
                  }
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CategoryTable;