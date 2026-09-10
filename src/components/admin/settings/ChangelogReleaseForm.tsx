"use client";

import {
  useState,
} from "react";

import {
  Save,
  X,
} from "lucide-react";

import {
  createChangelogReleaseAction,
} from "@/actions/admin/changelog/create-changelog-release";
import {
  updateChangelogReleaseAction,
} from "@/actions/admin/changelog/update-changelog-release";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  ChangelogSettingsRelease,
} from "./ChangelogSettings";

interface ChangelogReleaseFormProps {
  mode: "create" | "edit";
  release?: ChangelogSettingsRelease;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ChangelogReleaseForm({
  mode,
  release,
  onCancel,
  onSuccess,
}: ChangelogReleaseFormProps) {
  const [
    version,
    setVersion,
  ] = useState(
    release?.version ?? "",
  );

  const [
    date,
    setDate,
  ] = useState(
    release
      ? toDateInputValue(release.date)
      : toDateInputValue(
          new Date().toISOString(),
        ),
  );

  const [
    title,
    setTitle,
  ] = useState(
    release?.title ?? "",
  );

  const [
    description,
    setDescription,
  ] = useState(
    release?.description ?? "",
  );

  const [
    isPublished,
    setIsPublished,
  ] = useState(
    release?.isPublished ?? true,
  );

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    String(release?.sortOrder ?? 0),
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!version.trim()) {
      window.alert(
        "Versi changelog wajib diisi.",
      );
      return;
    }

    if (!date) {
      window.alert(
        "Tanggal changelog wajib diisi.",
      );
      return;
    }

    if (!title.trim()) {
      window.alert(
        "Judul changelog wajib diisi.",
      );
      return;
    }

    const parsedSortOrder =
      Number(sortOrder);

    if (
      !Number.isInteger(
        parsedSortOrder,
      )
    ) {
      window.alert(
        "Urutan harus berupa angka bulat.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const result =
          await createChangelogReleaseAction({
            version,
            date,
            title,
            description:
              description.trim() || null,
            isPublished,
            sortOrder:
              parsedSortOrder,
          });

        if (!result.success) {
          window.alert(result.message);
          return;
        }

        window.alert(result.message);
        onSuccess();
        return;
      }

      if (!release) {
        window.alert(
          "Data release tidak ditemukan.",
        );
        return;
      }

      const result =
        await updateChangelogReleaseAction({
          id: release.id,
          version,
          date,
          title,
          description:
            description.trim() || null,
          isPublished,
          sortOrder:
            parsedSortOrder,
        });

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.alert(result.message);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-muted/20 p-5"
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold">
          {mode === "create"
            ? "Tambah Release Changelog"
            : "Edit Release Changelog"}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          Informasi release akan digunakan sebagai
          kelompok utama pada halaman changelog publik.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* ================================================ */}
        {/* VERSION */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-version">
            Versi
          </Label>

          <Input
            id="changelog-version"
            value={version}
            onChange={(event) =>
              setVersion(
                event.target.value,
              )
            }
            placeholder="Contoh: September 2026"
            disabled={isSubmitting}
          />
        </div>

        {/* ================================================ */}
        {/* DATE */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-date">
            Tanggal
          </Label>

          <Input
            id="changelog-date"
            type="date"
            value={date}
            onChange={(event) =>
              setDate(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />
        </div>

        {/* ================================================ */}
        {/* TITLE */}
        {/* ================================================ */}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="changelog-title">
            Judul
          </Label>

          <Input
            id="changelog-title"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            placeholder="Contoh: Peningkatan pengalaman Pisjo Market"
            disabled={isSubmitting}
          />
        </div>

        {/* ================================================ */}
        {/* DESCRIPTION */}
        {/* ================================================ */}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="changelog-description">
            Deskripsi
          </Label>

          <Textarea
            id="changelog-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            placeholder="Deskripsi singkat mengenai release ini."
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        {/* ================================================ */}
        {/* SORT ORDER */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-sort-order">
            Urutan
          </Label>

          <Input
            id="changelog-sort-order"
            type="number"
            step="1"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target.value,
              )
            }
            disabled={isSubmitting}
          />

          <p className="text-xs text-muted-foreground">
            Angka lebih kecil ditampilkan lebih dahulu
            jika tanggal sama.
          </p>
        </div>

        {/* ================================================ */}
        {/* PUBLISHED */}
        {/* ================================================ */}

        <div className="flex items-center gap-3 self-end">
          <input
            id="changelog-published"
            type="checkbox"
            checked={isPublished}
            onChange={(event) =>
              setIsPublished(
                event.target.checked,
              )
            }
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-input"
          />

          <div>
            <Label
              htmlFor="changelog-published"
              className="cursor-pointer"
            >
              Publish release
            </Label>

            <p className="text-xs text-muted-foreground">
              Release yang tidak dipublish tidak akan
              tampil di halaman publik.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* ACTIONS */}
      {/* ================================================== */}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />

          {isSubmitting
            ? "Menyimpan..."
            : mode === "create"
              ? "Simpan Release"
              : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

function toDateInputValue(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
