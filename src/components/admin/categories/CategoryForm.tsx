"use client";

import { useState } from "react";

import SubmitButton from "@/components/admin/form/SubmitButton";

import FormSection from "@/components/admin/form/FormSection";

import FormGrid from "@/components/admin/form/FormGrid";

import FormActions from "@/components/admin/form/FormActions";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";

export interface CategoryFormValues {
  name: string;

  slug: string;

  description: string;

  sortOrder: number;

  isActive: boolean;
}

interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormValues>;

  submitLabel?: string;

  action: (
    formData: FormData
  ) => void | Promise<void>;
}

export function CategoryForm({
  defaultValues,
  submitLabel = "Simpan Kategori",
  action,
}: CategoryFormProps) {
  const [form, setForm] =
    useState<CategoryFormValues>({
      name:
        defaultValues?.name ?? "",

      slug:
        defaultValues?.slug ?? "",

      description:
        defaultValues?.description ??
        "",

      sortOrder:
        defaultValues?.sortOrder ??
        0,

      isActive:
        defaultValues?.isActive ??
        true,
    });

  function slugify(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  const [slugEdited, setSlugEdited] =
    useState(false);

  return (
    <form
      action={action}
      className="space-y-6"
    >
      <FormSection
  title="Informasi Kategori"
  description="Lengkapi informasi kategori produk."
>
        <FormGrid>
  <div className="space-y-2">
    <Label htmlFor="name">
      Nama Kategori
    </Label>

    <input
  id="name"
  name="name"
  value={form.name}
  onChange={(e) => {
    

    const name = e.target.value;

    setForm((prev) => ({
      ...prev,
      name,
      slug: slugEdited
        ? prev.slug
        : slugify(name),
    }));
  }}
  className="h-10 w-full rounded-md border px-3"
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
      onChange={(e) => {
        setSlugEdited(true);

        setForm((prev) => ({
          ...prev,
          slug: e.target.value,
        }));
      }}
    />

    <p className="text-xs text-muted-foreground">
      Digunakan pada URL kategori.
    </p>
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
        setForm((prev) => ({
          ...prev,
          description:
            e.target.value,
        }))
      }
    />
    <div className="space-y-2">
  <Label htmlFor="sortOrder">
    Urutan
  </Label>

  <Input
    id="sortOrder"
    name="sortOrder"
    type="number"
    value={form.sortOrder}
    onChange={(e) =>
      setForm((prev) => ({
        ...prev,
        sortOrder: Number(
          e.target.value
        ),
      }))
    }
  />

  <p className="text-xs text-muted-foreground">
    Semakin kecil nilainya,
    semakin atas urutan kategori.
  </p>
</div>
  </div>
</FormGrid>

      <div className="flex items-center justify-between rounded-lg border p-4">
  <div>
    <Label>Status</Label>

    <p className="text-sm text-muted-foreground">
      Aktifkan kategori agar
      dapat digunakan pada produk.
    </p>
  </div>

  <input
    type="hidden"
    name="isActive"
    value={form.isActive ? "true" : "false"}
  />

  <Switch
    checked={form.isActive}
    onCheckedChange={(checked) =>
      setForm((prev) => ({
        ...prev,
        isActive: checked,
      }))
    }
  />
</div>
      </FormSection>

      <FormActions
  cancelHref="/admin/categories"
>
  <SubmitButton
    label={submitLabel}
  />
</FormActions>
    </form>
  );
}

export default CategoryForm;