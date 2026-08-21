"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FlashSaleFormData {
  id?: string;

  name: string;

  slug: string;

  description?: string | null;

  status: string;

  startAt: Date | string;

  endAt: Date | string;
}

interface FlashSaleFormProps {
  mode: "create" | "edit";

  initialData?: FlashSaleFormData;
}

/**
 * ============================================================
 * FLASH SALE FORM
 * ============================================================
 *
 * Digunakan untuk:
 *
 * - Create Flash Sale
 * - Edit Flash Sale
 *
 * Tidak menggunakan asChild.
 */

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toDateTimeLocal(
  value: Date | string
) {
  const date =
    new Date(value);

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function getDefaultStartAt() {
  const date =
    new Date();

  date.setSeconds(0);
  date.setMilliseconds(0);

  return toDateTimeLocal(date);
}

function getDefaultEndAt() {
  const date =
    new Date();

  date.setDate(
    date.getDate() + 1
  );

  date.setSeconds(0);
  date.setMilliseconds(0);

  return toDateTimeLocal(date);
}

export function FlashSaleForm({
  mode,
  initialData,
}: FlashSaleFormProps) {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] = useState(
    initialData?.name ?? ""
  );

  const [
    slug,
    setSlug,
  ] = useState(
    initialData?.slug ?? ""
  );

  const [
  isSlugManuallyEdited,
  setIsSlugManuallyEdited,
] = useState(
  mode === "edit"
);

  const [
    description,
    setDescription,
  ] = useState(
    initialData?.description ?? ""
  );

  const [
    status,
    setStatus,
  ] = useState(
    initialData?.status ?? "DRAFT"
  );

  const [
    startAt,
    setStartAt,
  ] = useState(
    initialData
      ? toDateTimeLocal(
          initialData.startAt
        )
      : getDefaultStartAt()
  );

  const [
    endAt,
    setEndAt,
  ] = useState(
    initialData
      ? toDateTimeLocal(
          initialData.endAt
        )
      : getDefaultEndAt()
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError(
        "Nama Flash Sale wajib diisi."
      );

      return;
    }

    if (!slug.trim()) {
      setError(
        "Slug Flash Sale wajib diisi."
      );

      return;
    }

    const parsedStartAt =
      new Date(startAt);

    const parsedEndAt =
      new Date(endAt);

    if (
      Number.isNaN(
        parsedStartAt.getTime()
      )
    ) {
      setError(
        "Tanggal mulai tidak valid."
      );

      return;
    }

    if (
      Number.isNaN(
        parsedEndAt.getTime()
      )
    ) {
      setError(
        "Tanggal berakhir tidak valid."
      );

      return;
    }

    if (
      parsedEndAt <=
      parsedStartAt
    ) {
      setError(
        "Tanggal berakhir harus setelah tanggal mulai."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/flash-sales"
          : `/api/admin/flash-sales/${initialData?.id}`;

      const method =
        mode === "create"
          ? "POST"
          : "PATCH";

      const response =
        await fetch(
          endpoint,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                slug:
                  slug.trim(),

                description:
                  description.trim() ||
                  null,

                status,

                startAt:
                  parsedStartAt.toISOString(),

                endAt:
                  parsedEndAt.toISOString(),
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Gagal menyimpan Flash Sale."
        );
      }

      /**
       * Jika API membungkus data
       * dalam property `data`.
       */

      const flashSale =
        result.data ?? result;

      if (
        mode === "create" &&
        flashSale?.id
      ) {
        router.push(
          `/admin/flash-sales/${flashSale.id}`
        );

        return;
      }

      router.push(
        "/admin/flash-sales"
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan Flash Sale."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ERROR */}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* INFORMASI CAMPAIGN */}

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Flash Sale
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Atur informasi dasar campaign
            Flash Sale.
          </p>
        </div>

        <div className="grid gap-5">
          {/* NAME */}

          <div className="grid gap-2">
            <label
              htmlFor="name"
              className="text-sm font-medium"
            >
              Nama Flash Sale
            </label>

            <Input
  id="name"
  value={name}
  onChange={(event) => {
    const { value } = event.target as HTMLInputElement;

    setName(value);

    if (
      mode === "create" &&
      !isSlugManuallyEdited
    ) {
      setSlug(
        createSlug(value)
      );
    }
  }}
  placeholder="Contoh: Flash Sale Akhir Pekan"
  disabled={isSubmitting}
/>
          </div>

          {/* SLUG */}

          <div className="grid gap-2">
            <label
              htmlFor="slug"
              className="text-sm font-medium"
            >
              Slug
            </label>

            <Input
  id="slug"
  value={slug}
  onChange={(event) => {
    setIsSlugManuallyEdited(
      true
    );

    setSlug(
      createSlug(
        event.target.value
      )
    );
  }}
  placeholder="flash-sale-akhir-pekan"
  disabled={isSubmitting}
/>

            <p className="text-xs text-muted-foreground">
              Digunakan sebagai identifier
              campaign.
            </p>
          </div>

          {/* DESCRIPTION */}

          <div className="grid gap-2">
            <label
              htmlFor="description"
              className="text-sm font-medium"
            >
              Deskripsi
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Deskripsi singkat Flash Sale..."
              disabled={isSubmitting}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* STATUS */}

          <div className="grid gap-2">
            <label
              htmlFor="status"
              className="text-sm font-medium"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              disabled={isSubmitting}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="DRAFT">
                Draft
              </option>

              <option value="ACTIVE">
                Aktif
              </option>

              <option value="INACTIVE">
                Tidak Aktif
              </option>

              <option value="ENDED">
                Berakhir
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* SCHEDULE */}

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Jadwal Flash Sale
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Tentukan kapan campaign mulai
            dan berakhir.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* START */}

          <div className="grid gap-2">
            <label
              htmlFor="startAt"
              className="text-sm font-medium"
            >
              Mulai
            </label>

            <Input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(event) =>
                setStartAt(
                  event.target.value
                )
              }
              disabled={isSubmitting}
            />
          </div>

          {/* END */}

          <div className="grid gap-2">
            <label
              htmlFor="endAt"
              className="text-sm font-medium"
            >
              Berakhir
            </label>

            <Input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(event) =>
                setEndAt(
                  event.target.value
                )
              }
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() =>
            router.push(
              "/admin/flash-sales"
            )
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />

          Batal
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}

          {mode === "create"
            ? "Buat Flash Sale"
            : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

// useEffect is provided by React; accidental local declaration removed.
