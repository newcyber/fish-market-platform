"use client";

import {
  useState,
} from "react";

import {
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  createChangelogEntryAction,
} from "@/actions/admin/changelog/create-changelog-entry";
import {
  updateChangelogEntryAction,
} from "@/actions/admin/changelog/update-changelog-entry";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  ChangelogSettingsEntry,
} from "./ChangelogSettings";

type ChangelogEntryType =
  | "FEATURE"
  | "IMPROVEMENT"
  | "FIX"
  | "PERFORMANCE";

interface ChangelogEntryFormProps {
  mode: "create" | "edit";
  releaseId?: string;
  entry?: ChangelogSettingsEntry;
  defaultSortOrder?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ChangelogEntryForm({
  mode,
  releaseId,
  entry,
  defaultSortOrder = 0,
  onCancel,
  onSuccess,
}: ChangelogEntryFormProps) {
  const [
    type,
    setType,
  ] = useState<ChangelogEntryType>(
    entry?.type ?? "FEATURE",
  );

  const [
    title,
    setTitle,
  ] = useState(
    entry?.title ?? "",
  );

  const [
    description,
    setDescription,
  ] = useState(
    entry?.description ?? "",
  );

  const [
    highlights,
    setHighlights,
  ] = useState<string[]>(
    getInitialHighlights(
      entry?.highlights,
    ),
  );

  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    String(
      entry?.sortOrder ??
        defaultSortOrder,
    ),
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  function addHighlight() {
    setHighlights(
      (current) => [
        ...current,
        "",
      ],
    );
  }

  function updateHighlight(
    index: number,
    value: string,
  ) {
    setHighlights(
      (current) =>
        current.map(
          (item, itemIndex) =>
            itemIndex === index
              ? value
              : item,
        ),
    );
  }

  function removeHighlight(
    index: number,
  ) {
    setHighlights(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index,
        ),
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      window.alert(
        "Judul entry wajib diisi.",
      );
      return;
    }

    if (!description.trim()) {
      window.alert(
        "Deskripsi entry wajib diisi.",
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

    const normalizedHighlights =
      highlights
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean);

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        if (!releaseId) {
          window.alert(
            "Release changelog tidak ditemukan.",
          );
          return;
        }

        const result =
          await createChangelogEntryAction({
            releaseId,
            type,
            title,
            description,
            highlights:
              normalizedHighlights,
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

      if (!entry) {
        window.alert(
          "Data entry tidak ditemukan.",
        );
        return;
      }

      const result =
        await updateChangelogEntryAction({
          id: entry.id,
          type,
          title,
          description,
          highlights:
            normalizedHighlights,
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
      className="rounded-lg border bg-background p-5"
    >
      <div className="mb-5">
        <h4 className="text-base font-semibold">
          {mode === "create"
            ? "Tambah Entry"
            : "Edit Entry"}
        </h4>

        <p className="mt-1 text-sm text-muted-foreground">
          Detail perubahan yang akan ditampilkan
          pada release changelog.
        </p>
      </div>

      <div className="space-y-5">
        {/* ================================================ */}
        {/* TYPE */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-entry-type">
            Tipe
          </Label>

          <select
            id="changelog-entry-type"
            value={type}
            onChange={(event) =>
              setType(
                event.target
                  .value as ChangelogEntryType,
              )
            }
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="FEATURE">
              Feature
            </option>

            <option value="IMPROVEMENT">
              Improvement
            </option>

            <option value="FIX">
              Fix
            </option>

            <option value="PERFORMANCE">
              Performance
            </option>
          </select>
        </div>

        {/* ================================================ */}
        {/* TITLE */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-entry-title">
            Judul
          </Label>

          <Input
            id="changelog-entry-title"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
            placeholder="Contoh: Pengalaman kategori lebih baik"
            disabled={isSubmitting}
          />
        </div>

        {/* ================================================ */}
        {/* DESCRIPTION */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-entry-description">
            Deskripsi
          </Label>

          <Textarea
            id="changelog-entry-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            placeholder="Jelaskan perubahan yang dilakukan."
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        {/* ================================================ */}
        {/* HIGHLIGHTS */}
        {/* ================================================ */}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>
                Highlights
              </Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Poin-poin penting yang ingin ditampilkan
                sebagai daftar bullet.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHighlight}
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Poin
            </Button>
          </div>

          {highlights.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada highlight.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {highlights.map(
                (highlight, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={highlight}
                      onChange={(event) =>
                        updateHighlight(
                          index,
                          event.target
                            .value,
                        )
                      }
                      placeholder={`Highlight ${index + 1}`}
                      disabled={
                        isSubmitting
                      }
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={
                        isSubmitting
                      }
                      onClick={() =>
                        removeHighlight(
                          index,
                        )
                      }
                      aria-label={`Hapus highlight ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* ================================================ */}
        {/* SORT ORDER */}
        {/* ================================================ */}

        <div className="space-y-2">
          <Label htmlFor="changelog-entry-sort-order">
            Urutan
          </Label>

          <Input
            id="changelog-entry-sort-order"
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
            Angka lebih kecil akan ditampilkan lebih
            dahulu jika berada dalam release yang sama.
          </p>
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
              ? "Simpan Entry"
              : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

function getInitialHighlights(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}
