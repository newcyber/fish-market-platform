"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DeleteProductButton from "@/components/admin/products/DeleteProductButton";
import ProductPriceDialog, {
  type ProductPriceItem,
} from "@/components/admin/products/ProductPriceDialog";
import ProductStockDialog, {
  type ProductStockItem,
} from "@/components/admin/products/ProductStockDialog";
import TogglePublishButton from "@/components/admin/products/TogglePublishButton";
import { bulkProductAction } from "@/actions/product/bulk-product-actions";

import {
  Boxes,
  MoreHorizontal,
  Pencil,
  Tag,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ProductTableItem {
  id: string;

  name: string;

  image: string | null;

  category: string;

  sku: string | null;

  price: number;

  stock: number;

  stockItems: ProductStockItem[];

  priceItems: ProductPriceItem[];

  featured: boolean;

  published: boolean;
}

interface ProductTableFilters {
  readonly search?: string;
  readonly categoryId?: string;
  readonly published?: boolean;
  readonly featured?: true;
  readonly stock?: "available" | "low" | "out";
}

interface ProductTableProps {
  products: ProductTableItem[];
  totalProducts?: number;
  filterKey?: string;
  filters?: ProductTableFilters;
}

function ProductThumbnail({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="56px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
          No Image
        </div>
      )}
    </div>
  );
}

function ProductStockStatus({
  stock,
}: {
  stock: number;
}) {
  if (stock <= 0) {
    return (
      <Badge variant="destructive" className="whitespace-nowrap">
        Habis
      </Badge>
    );
  }

  if (stock <= 5) {
    return (
      <Badge
        variant="outline"
        className="whitespace-nowrap border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-300"
      >
        Menipis · {stock}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
    >
      Tersedia · {stock}
    </Badge>
  );
}

function ProductStatus({
  product,
}: {
  product: ProductTableItem;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        variant={product.published ? "default" : "secondary"}
        className="whitespace-nowrap"
      >
        {product.published ? "Published" : "Draft"}
      </Badge>

      {product.featured && (
        <Badge variant="outline" className="whitespace-nowrap">
          Featured
        </Badge>
      )}
    </div>
  );
}


function BulkActions({
  selectedCount,
  visibleCount,
  allSelected,
  someSelected,
  onSelectAll,
  onClear,
  onAction,
  isPending,
}: {
  selectedCount: number;
  visibleCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onClear: () => void;
  onAction: (action: "publish" | "unpublish" | "delete") => void;
  isPending: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(element) => {
              if (element) {
                element.indeterminate = someSelected && !allSelected;
              }
            }}
            onChange={(event) => onSelectAll(event.target.checked)}
            disabled={isPending || visibleCount === 0}
            className="h-4 w-4 rounded border-input accent-primary"
            aria-label="Pilih semua produk yang sedang tampil"
          />
          <span>{selectedCount} produk dipilih</span>
        </label>

        <span className="text-xs text-muted-foreground">
          dari {visibleCount} produk yang tampil
        </span>

        <button
          type="button"
          onClick={onClear}
          disabled={isPending}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          Batal pilih
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onAction("publish")}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Publish
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onAction("unpublish")}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          Unpublish
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => onAction("delete")}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Hapus
        </Button>
      </div>
    </div>
  );
}

function ProductActions({
  product,
  compact = false,
}: {
  product: ProductTableItem;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex w-full flex-wrap items-center gap-2 [&>a]:flex-1 [&>a]:min-w-[90px] [&>button]:min-h-9"
          : "flex items-center justify-end gap-1.5"
      }
    >
      <ProductStockDialog
        productId={product.id}
        productName={product.name}
        items={product.stockItems}
        trigger={
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "icon"}
            className={compact ? "gap-1.5" : ""}
            title="Atur stok"
            aria-label={`Atur stok ${product.name}`}
          >
            <Boxes className="h-4 w-4" />
            {compact && <span>Stok</span>}
          </Button>
        }
      />

      <ProductPriceDialog
        productId={product.id}
        productName={product.name}
        items={product.priceItems}
        trigger={
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "icon"}
            className={compact ? "gap-1.5" : ""}
            title="Atur harga"
            aria-label={`Atur harga ${product.name}`}
          >
            <Tag className="h-4 w-4" />
            {compact && <span>Harga</span>}
          </Button>
        }
      />

      <Link href={`/admin/products/${product.id}/edit`}>
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "icon"}
          className={compact ? "w-full gap-1.5" : ""}
          title="Edit produk"
          aria-label={`Edit ${product.name}`}
        >
          <Pencil className="h-4 w-4" />
          {compact && <span>Edit</span>}
        </Button>
      </Link>

      {!compact && (
        <>
          <TogglePublishButton
            id={product.id}
            published={product.published}
          />

          <DeleteProductButton
            id={product.id}
            name={product.name}
          />
        </>
      )}

      {compact && (
        <DropdownMenu>
  <DropdownMenuTrigger
    type="button"
    aria-label={`Aksi lainnya untuk ${product.name}`}
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
  >
    <MoreHorizontal className="h-4 w-4" />
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="flex w-full items-center"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit Produk
      </Link>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem>
      <div className="w-full">
        <TogglePublishButton
          id={product.id}
          published={product.published}
        />
      </div>
    </DropdownMenuItem>

    <DropdownMenuItem>
      <div className="w-full">
        <DeleteProductButton
          id={product.id}
          name={product.name}
        />
      </div>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
      )}
    </div>
  );
}

export function ProductTable({
  products,
  totalProducts = products.length,
  filterKey = "",
  filters,
}: ProductTableProps) {
  const router = useRouter();
  void filters;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isPending, startTransition] = useTransition();

  const visibleProductIds = useMemo(
    () => products.map((product) => product.id),
    [products]
  );

  const visibleSelectedCount = useMemo(
    () =>
      visibleProductIds.reduce(
        (count, id) => count + (selectedIds.has(id) ? 1 : 0),
        0
      ),
    [selectedIds, visibleProductIds]
  );

  const allVisibleSelected =
    products.length > 0 && visibleSelectedCount === products.length;

  const someVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected;

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterKey]);

  useEffect(() => {
    const visibleIds = new Set(visibleProductIds);

    setSelectedIds((current) => {
      const next = new Set(
        [...current].filter((id) => visibleIds.has(id))
      );

      if (next.size === current.size) {
        return current;
      }

      return next;
    });
  }, [visibleProductIds]);

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  function selectAllVisible(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        visibleProductIds.forEach((id) => next.add(id));
      } else {
        visibleProductIds.forEach((id) => next.delete(id));
      }

      return next;
    });
  }

  function handleBulkAction(
    action: "publish" | "unpublish" | "delete"
  ) {
    const ids = [...selectedIds];

    if (ids.length === 0) return;

    if (
      action === "delete" &&
      !window.confirm(
        `Hapus ${ids.length} produk yang dipilih? Produk akan di-soft delete.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await bulkProductAction({
          ids,
          action,
        });

        if (!result.success) {
          window.alert(
            result.message ?? "Aksi massal gagal dilakukan."
          );
          return;
        }

        setSelectedIds(new Set());
        router.refresh();
      } catch (error) {
        console.error("Bulk product action failed:", error);
        window.alert(
          "Aksi massal gagal dilakukan. Silakan coba lagi."
        );
      }
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Daftar Produk</CardTitle>

        <CardDescription>
          Kelola produk, harga, stok, dan status marketplace. Menampilkan{" "}
          {products.length.toLocaleString("id-ID")} dari{" "}
          {totalProducts.toLocaleString("id-ID")} produk. Checkbox memilih
          semua produk yang sedang tampil setelah filter/pencarian diterapkan.
        </CardDescription>
      </CardHeader>

      <BulkActions
        selectedCount={selectedIds.size}
        visibleCount={products.length}
        allSelected={allVisibleSelected}
        someSelected={someVisibleSelected}
        onSelectAll={selectAllVisible}
        onClear={() => setSelectedIds(new Set())}
        onAction={handleBulkAction}
        isPending={isPending}
      />

      <CardContent className="p-0">
        {/* Desktop / tablet: compact table with primary information and actions kept visible. */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      selectAllVisible(event.target.checked)
                    }
                    disabled={products.length === 0 || isPending}
                    className="h-4 w-4 rounded border-input accent-primary"
                    aria-label="Pilih semua produk yang sedang tampil"
                  />
                </TableHead>

                <TableHead className="min-w-[300px]">
                  Produk
                </TableHead>

                <TableHead>Kategori</TableHead>

                <TableHead className="text-right">
                  Harga
                </TableHead>

                <TableHead className="text-center">
                  Stok
                </TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="w-[110px] text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Belum ada produk.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="align-middle">
                    <TableCell className="w-12 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={(event) =>
                          toggleSelected(
                            product.id,
                            event.target.checked
                          )
                        }
                        disabled={isPending}
                        className="h-4 w-4 rounded border-input accent-primary"
                        aria-label={`Pilih ${product.name}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductThumbnail
                          src={product.image}
                          name={product.name}
                        />

                        <div className="min-w-0">
                          <p
                            className="truncate font-medium"
                            title={product.name}
                          >
                            {product.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span>
                              SKU: {product.sku ?? "-"}
                            </span>

                            {product.stockItems.length > 1 && (
                              <span>
                                {product.stockItems.length} SKU aktif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="line-clamp-2 max-w-[180px] text-sm">
                        {product.category}
                      </span>
                    </TableCell>

                    <TableCell className="text-right font-medium whitespace-nowrap">
                      Rp{" "}
                      {product.price.toLocaleString("id-ID")}
                    </TableCell>

                    <TableCell className="text-center">
                      <ProductStockStatus stock={product.stock} />
                    </TableCell>

                    <TableCell>
                      <ProductStatus product={product} />
                    </TableCell>

                    <TableCell>
                      <ProductActions product={product} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: card layout prevents horizontal scrolling and keeps actions close to the product. */}
        <div className="divide-y md:hidden">
          {products.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Belum ada produk.
            </div>
          ) : (
            products.map((product) => (
              <article
                key={product.id}
                className="space-y-3.5 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={(event) =>
                      toggleSelected(
                        product.id,
                        event.target.checked
                      )
                    }
                    disabled={isPending}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
                    aria-label={`Pilih ${product.name}`}
                  />

                  <ProductThumbnail
                    src={product.image}
                    name={product.name}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          className="line-clamp-2 font-semibold leading-tight"
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          SKU: {product.sku ?? "-"}
                        </p>
                      </div>

                      <ProductStatus product={product} />
                    </div>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {product.category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Harga
                    </p>
                    <p className="mt-0.5 font-semibold">
                      Rp{" "}
                      {product.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Stok
                    </p>

                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                      <ProductStockStatus stock={product.stock} />

                      {product.stockItems.length > 1 && (
                        <span className="text-[11px] text-muted-foreground">
                          {product.stockItems.length} SKU
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ProductActions
                  product={product}
                  compact
                />
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductTable;
