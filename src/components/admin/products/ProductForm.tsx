"use client";

import { useState } from "react";

import Link from "next/link";

import { Save } from "lucide-react";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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

  unit: string;

  price: number;

  stock: number;

  weight: number;

  isPublished: boolean;

  featured: boolean;
}

interface ProductFormProps {
  categories: CategoryOption[];

  defaultValues?: Partial<ProductFormValues>;

  submitLabel?: string;

  action: (formData: FormData) => void | Promise<void>;
}

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      <Save className="mr-2 h-4 w-4" />

      {pending ? "Menyimpan..." : label}
    </Button>
  );
}

export function ProductForm({
  categories,
  defaultValues,
  submitLabel = "Simpan Produk",
  action,
}: ProductFormProps) {
  const [form, setForm] =
    useState<ProductFormValues>({
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

      unit:
        defaultValues?.unit ?? "Kg",

      price:
        defaultValues?.price ?? 0,

      stock:
        defaultValues?.stock ?? 0,

      weight:
        defaultValues?.weight ?? 0,

      isPublished:
        defaultValues?.isPublished ??
        true,

      featured:
        defaultValues?.featured ??
        false,
    });

  return (
    <form
      action={action}
      className="space-y-6"
    >
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Informasi Produk
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categoryId">
              Kategori
            </Label>

            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={form.categoryId}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryId:
                    e.target.value,
                })
              }
            >
              <option value="">
                Pilih Kategori
              </option>

              {categories.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                >
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Produk
            </Label>

            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug
            </Label>

            <Input
              id="slug"
              name="slug"
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU
            </Label>

            <Input
              id="sku"
              name="sku"
              value={form.sku}
              onChange={(e) =>
                setForm({
                  ...form,
                  sku:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              Harga
            </Label>

            <Input
              id="price"
              name="price"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price:
                    Number(
                      e.target.value
                    ),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">
              Stock
            </Label>

            <Input
              id="stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock:
                    Number(
                      e.target.value
                    ),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">
              Unit
            </Label>

            <Input
              id="unit"
              name="unit"
              value={form.unit}
              onChange={(e) =>
                setForm({
                  ...form,
                  unit:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">
              Berat (Kg)
            </Label>

            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              value={form.weight}
              onChange={(e) =>
                setForm({
                  ...form,
                  weight:
                    Number(
                      e.target.value
                    ),
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Deskripsi
          </Label>

          <Textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
              })
            }
          />
        </div>

        <input
          type="hidden"
          name="isPublished"
          value={String(
            form.isPublished
          )}
        />

        <input
          type="hidden"
          name="featured"
          value={String(
            form.featured
          )}
        />

        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <Switch
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

            <Label>
              Published
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
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

            <Label>
              Featured
            </Label>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
  <Link href="/admin/products">
    <Button
      type="button"
      variant="outline"
    >
      Batal
    </Button>
  </Link>

  <SubmitButton
    label={submitLabel}
  />
</div>
    </form>
  );
}

export default ProductForm;