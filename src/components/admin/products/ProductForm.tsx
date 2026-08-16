"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useFormStatus,
} from "react-dom";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  Switch,
} from "@/components/ui/switch";

interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFormValues {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  variantOptions: string[];
  weightOptions: string[];
  isPublished: boolean;
  featured: boolean;
}

interface ProductFormProps {
  categories: CategoryOption[];

  defaultValues?: Partial<ProductFormValues>;

  submitLabel?: string;

  action: (
    formData: FormData
  ) => void | Promise<void>;
}

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const {
    pending,
  } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      <Save className="mr-2 h-4 w-4" />

      {pending
        ? "Menyimpan..."
        : label}
    </Button>
  );
}

export function ProductForm({
  categories,
  defaultValues,
  submitLabel = "Simpan Produk",
  action,
}: ProductFormProps) {
  const [
    form,
    setForm,
  ] = useState<ProductFormValues>({
    categoryId:
      defaultValues?.categoryId ?? "",

    name:
      defaultValues?.name ?? "",

    slug:
      defaultValues?.slug ?? "",

    description:
      defaultValues?.description ?? "",

    sku:
      defaultValues?.sku ?? "",

    price:
      defaultValues?.price ?? 0,

    stock:
      defaultValues?.stock ?? 0,

    variantOptions:
      defaultValues?.variantOptions ?? [
        "Utuh",
        "Dibersihkan",
      ],

    weightOptions:
      defaultValues?.weightOptions ?? [
        "250gr",
        "500gr",
        "1kg",
      ],

    isPublished:
      defaultValues?.isPublished ??
      true,

    featured:
      defaultValues?.featured ??
      false,
  });

  /**
   * ============================================================
   * VARIANT HANDLERS
   * ============================================================
   */

  const updateVariant = (
    index: number,
    value: string
  ) => {
    setForm({
      ...form,

      variantOptions:
        form.variantOptions.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? value
              : item
        ),
    });
  };

  const removeVariant = (
    index: number
  ) => {
    setForm({
      ...form,

      variantOptions:
        form.variantOptions.filter(
          (
            _item,
            itemIndex
          ) =>
            itemIndex !== index
        ),
    });
  };

  const addVariant = () => {
    setForm({
      ...form,

      variantOptions: [
        ...form.variantOptions,
        "",
      ],
    });
  };

  /**
   * ============================================================
   * WEIGHT HANDLERS
   * ============================================================
   */

  const updateWeight = (
    index: number,
    value: string
  ) => {
    setForm({
      ...form,

      weightOptions:
        form.weightOptions.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex === index
              ? value
              : item
        ),
    });
  };

  const removeWeight = (
    index: number
  ) => {
    setForm({
      ...form,

      weightOptions:
        form.weightOptions.filter(
          (
            _item,
            itemIndex
          ) =>
            itemIndex !== index
        ),
    });
  };

  const addWeight = () => {
    setForm({
      ...form,

      weightOptions: [
        ...form.weightOptions,
        "",
      ],
    });
  };

  return (
    <form
      action={action}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* INFORMASI PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Informasi Produk
          </h2>

          <p className="text-sm text-muted-foreground">
            Masukkan informasi dasar produk.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* CATEGORY */}

          <div className="space-y-2">
            <Label htmlFor="categoryId">
              Kategori
            </Label>

            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={form.categoryId}
              onChange={(event) =>
                setForm({
                  ...form,
                  categoryId:
                    event.target.value,
                })
              }
            >
              <option value="">
                Pilih Kategori
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* NAME */}

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Produk
            </Label>

            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name:
                    event.target.value,
                })
              }
              required
            />
          </div>

          {/* SLUG */}

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug
            </Label>

            <Input
              id="slug"
              name="slug"
              value={form.slug}
              onChange={(event) =>
                setForm({
                  ...form,
                  slug:
                    event.target.value,
                })
              }
              required
            />
          </div>

          {/* SKU */}

          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU
            </Label>

            <Input
              id="sku"
              name="sku"
              value={form.sku}
              onChange={(event) =>
                setForm({
                  ...form,
                  sku:
                    event.target.value,
                })
              }
            />
          </div>

        </div>

        {/* DESCRIPTION */}

        <div className="space-y-2">
          <Label htmlFor="description">
            Deskripsi Produk
          </Label>

          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.target.value,
              })
            }
            rows={5}
          />
        </div>
      </Card>

      {/* ====================================================== */}
      {/* HARGA DAN STOK */}
      {/* ====================================================== */}

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Harga & Stok
          </h2>

          <p className="text-sm text-muted-foreground">
            Atur harga dan jumlah stok produk.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* PRICE */}

          <div className="space-y-2">
            <Label htmlFor="price">
              Harga Produk
            </Label>

            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) =>
                setForm({
                  ...form,
                  price:
                    Number(
                      event.target.value
                    ),
                })
              }
              required
            />
          </div>

          {/* STOCK */}

          <div className="space-y-2">
            <Label htmlFor="stock">
              Stok Produk
            </Label>

            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) =>
                setForm({
                  ...form,
                  stock:
                    Number(
                      event.target.value
                    ),
                })
              }
              required
            />

            <p className="text-xs text-muted-foreground">
              Masukkan jumlah stok
              produk yang tersedia.
            </p>
          </div>

        </div>
      </Card>

      {/* ====================================================== */}
      {/* VARIAN PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Varian Produk
            </h2>

            <p className="text-sm text-muted-foreground">
              Tambahkan pilihan varian
              produk yang dapat dipilih
              oleh customer.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addVariant}
          >
            <Plus className="mr-2 h-4 w-4" />

            Tambah Varian
          </Button>
        </div>

        <div className="space-y-3">

          {form.variantOptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada varian.
              Klik Tambah Varian untuk
              menambahkan pilihan.
            </div>
          ) : (
            form.variantOptions.map(
              (
                variant,
                index
              ) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <Input
                    name="variantOptions"
                    value={variant}
                    placeholder="Contoh: Utuh"
                    onChange={(event) =>
                      updateVariant(
                        index,
                        event.target.value
                      )
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      removeVariant(
                        index
                      )
                    }
                    aria-label="Hapus varian"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )
          )}

        </div>
      </Card>

      {/* ====================================================== */}
      {/* PILIHAN BERAT */}
      {/* ====================================================== */}

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Pilihan Berat Produk
            </h2>

            <p className="text-sm text-muted-foreground">
              Tambahkan pilihan berat
              yang dapat dipilih oleh
              customer.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addWeight}
          >
            <Plus className="mr-2 h-4 w-4" />

            Tambah Berat
          </Button>
        </div>

        <div className="space-y-3">

          {form.weightOptions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada pilihan berat.
              Klik Tambah Berat untuk
              menambahkan pilihan.
            </div>
          ) : (
            form.weightOptions.map(
              (
                weight,
                index
              ) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <Input
                    name="weightOptions"
                    value={weight}
                    placeholder="Contoh: 500gr"
                    onChange={(event) =>
                      updateWeight(
                        index,
                        event.target.value
                      )
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      removeWeight(
                        index
                      )
                    }
                    aria-label="Hapus berat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )
          )}

        </div>
      </Card>

      {/* ====================================================== */}
      {/* STATUS PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Status Produk
          </h2>

          <p className="text-sm text-muted-foreground">
            Atur status publikasi produk.
          </p>
        </div>

        <div className="space-y-5">

          {/* PUBLISHED */}

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="isPublished">
                Publikasikan Produk
              </Label>

              <p className="mt-1 text-sm text-muted-foreground">
                Produk akan tampil
                di halaman customer.
              </p>
            </div>

            <Switch
              id="isPublished"
              checked={form.isPublished}
              onCheckedChange={(
                checked
              ) =>
                setForm({
                  ...form,
                  isPublished:
                    checked,
                })
              }
            />
          </div>

          <input
            type="hidden"
            name="isPublished"
            value={
              form.isPublished
                ? "true"
                : "false"
            }
          />

          {/* FEATURED */}

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="featured">
                Produk Unggulan
              </Label>

              <p className="mt-1 text-sm text-muted-foreground">
                Tampilkan produk sebagai
                produk unggulan.
              </p>
            </div>

            <Switch
              id="featured"
              checked={form.featured}
              onCheckedChange={(
                checked
              ) =>
                setForm({
                  ...form,
                  featured:
                    checked,
                })
              }
            />
          </div>

          <input
            type="hidden"
            name="featured"
            value={
              form.featured
                ? "true"
                : "false"
            }
          />

        </div>
      </Card>

      {/* ====================================================== */}
      {/* ACTION */}
      {/* ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
  <Link
    href="/admin/products"
    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
  >
    Batal
  </Link>

  <SubmitButton
    label={submitLabel}
  />
</div>
    </form>
  );
}

export default ProductForm;