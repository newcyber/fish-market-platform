"use client";

import {
  useState,
} from "react";

import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  deleteChangelogEntryAction,
} from "@/actions/admin/changelog/delete-changelog-entry";
import {
  deleteChangelogReleaseAction,
} from "@/actions/admin/changelog/delete-changelog-release";
import {
  updateChangelogReleaseAction,
} from "@/actions/admin/changelog/update-changelog-release";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import ChangelogEntryForm from "./ChangelogEntryForm";
import ChangelogReleaseForm from "./ChangelogReleaseForm";

export interface ChangelogSettingsEntry {
  id: string;
  releaseId: string;
  type:
    | "FEATURE"
    | "IMPROVEMENT"
    | "FIX"
    | "PERFORMANCE";
  title: string;
  description: string;
  highlights: unknown;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogSettingsRelease {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  entries: ChangelogSettingsEntry[];
}

interface ChangelogSettingsProps {
  releases: ChangelogSettingsRelease[];
}

export default function ChangelogSettings({
  releases,
}: ChangelogSettingsProps) {
  const [
    isCreateReleaseFormOpen,
    setIsCreateReleaseFormOpen,
  ] = useState(false);

  const [
    editingRelease,
    setEditingRelease,
  ] = useState<ChangelogSettingsRelease | null>(
    null,
  );

  const [
    creatingEntryForReleaseId,
    setCreatingEntryForReleaseId,
  ] = useState<string | null>(null);

  const [
    editingEntry,
    setEditingEntry,
  ] = useState<ChangelogSettingsEntry | null>(
    null,
  );

  const [
    expandedReleaseIds,
    setExpandedReleaseIds,
  ] = useState<string[]>(
    [],
  );

  const [
    processingId,
    setProcessingId,
  ] = useState<string | null>(null);

  function toggleRelease(
    releaseId: string,
  ) {
    setExpandedReleaseIds(
      (current) =>
        current.includes(releaseId)
          ? current.filter(
              (id) => id !== releaseId,
            )
          : [...current, releaseId],
    );
  }

  function isReleaseExpanded(
    releaseId: string,
  ) {
    return expandedReleaseIds.includes(
      releaseId,
    );
  }

  async function handleDeleteRelease(
    release: ChangelogSettingsRelease,
  ) {
    const confirmed = window.confirm(
      `Hapus release "${release.version}"?\n\nSemua entry di dalam release ini juga akan dihapus.`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(release.id);

    try {
      const result =
        await deleteChangelogReleaseAction(
          release.id,
        );

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.alert(result.message);
      window.location.reload();
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeleteEntry(
    entry: ChangelogSettingsEntry,
  ) {
    const confirmed = window.confirm(
      `Hapus entry "${entry.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(entry.id);

    try {
      const result =
        await deleteChangelogEntryAction(
          entry.id,
        );

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.alert(result.message);
      window.location.reload();
    } finally {
      setProcessingId(null);
    }
  }

  async function handlePublishedChange(
    release: ChangelogSettingsRelease,
    checked: boolean,
  ) {
    setProcessingId(release.id);

    try {
      const result =
        await updateChangelogReleaseAction({
          id: release.id,
          isPublished: checked,
        });

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      window.location.reload();
    } finally {
      setProcessingId(null);
    }
  }

  function handleReleaseFormSuccess() {
    setIsCreateReleaseFormOpen(false);
    setEditingRelease(null);
    window.location.reload();
  }

  function handleEntryFormSuccess() {
    setCreatingEntryForReleaseId(null);
    setEditingEntry(null);
    window.location.reload();
  }

  function handleCreateEntry(
    releaseId: string,
  ) {
    setIsCreateReleaseFormOpen(false);
    setEditingRelease(null);
    setEditingEntry(null);
    setCreatingEntryForReleaseId(
      releaseId,
    );

    if (
      !expandedReleaseIds.includes(
        releaseId,
      )
    ) {
      setExpandedReleaseIds(
        (current) => [
          ...current,
          releaseId,
        ],
      );
    }
  }

  function handleEditEntry(
    entry: ChangelogSettingsEntry,
  ) {
    setIsCreateReleaseFormOpen(false);
    setEditingRelease(null);
    setCreatingEntryForReleaseId(null);
    setEditingEntry(entry);

    if (
      !expandedReleaseIds.includes(
        entry.releaseId,
      )
    ) {
      setExpandedReleaseIds(
        (current) => [
          ...current,
          entry.releaseId,
        ],
      );
    }
  }

  return (
    <Card className="rounded-xl p-6 shadow-sm">
      <div className="space-y-6">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Changelog
            </h2>

            <p className="text-sm text-muted-foreground">
              Kelola riwayat perubahan, fitur,
              perbaikan, dan peningkatan Pisjo Market
              yang ditampilkan pada halaman publik.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setEditingRelease(null);
              setCreatingEntryForReleaseId(
                null,
              );
              setEditingEntry(null);
              setIsCreateReleaseFormOpen(
                true,
              );
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Release
          </Button>
        </div>

        {/* ================================================== */}
        {/* CREATE RELEASE */}
        {/* ================================================== */}

        {isCreateReleaseFormOpen && (
          <ChangelogReleaseForm
            mode="create"
            onCancel={() =>
              setIsCreateReleaseFormOpen(
                false,
              )
            }
            onSuccess={
              handleReleaseFormSuccess
            }
          />
        )}

        {/* ================================================== */}
        {/* EDIT RELEASE */}
        {/* ================================================== */}

        {editingRelease && (
          <ChangelogReleaseForm
            mode="edit"
            release={editingRelease}
            onCancel={() =>
              setEditingRelease(null)
            }
            onSuccess={
              handleReleaseFormSuccess
            }
          />
        )}

        {/* ================================================== */}
        {/* EMPTY STATE */}
        {/* ================================================== */}

        {releases.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada release changelog.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingRelease(null);
                setIsCreateReleaseFormOpen(
                  true,
                );
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Release Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {releases.map((release) => {
              const expanded =
                isReleaseExpanded(
                  release.id,
                );

              const isProcessing =
                processingId ===
                release.id;

              const isCreatingEntry =
                creatingEntryForReleaseId ===
                release.id;

              return (
                <div
                  key={release.id}
                  className="overflow-hidden rounded-lg border"
                >
                  {/* ======================================== */}
                  {/* RELEASE HEADER */}
                  {/* ======================================== */}

                  <div className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          toggleRelease(
                            release.id,
                          )
                        }
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {release.version}
                          </span>

                          <span className="text-sm text-muted-foreground">
                            {formatReleaseDate(
                              release.date,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 font-medium">
                          {release.title}
                        </p>

                        {release.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {
                              release.description
                            }
                          </p>
                        )}

                        <p className="mt-2 text-xs text-muted-foreground">
                          {release.entries.length}{" "}
                          {release.entries.length ===
                          1
                            ? "entry"
                            : "entries"}
                        </p>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={
                              release.isPublished
                            }
                            disabled={
                              isProcessing
                            }
                            onCheckedChange={(
                              checked,
                            ) =>
                              handlePublishedChange(
                                release,
                                checked,
                              )
                            }
                          />

                          <span>
                            {release.isPublished
                              ? "Published"
                              : "Draft"}
                          </span>
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            isProcessing
                          }
                          onClick={() => {
                            setIsCreateReleaseFormOpen(
                              false,
                            );
                            setCreatingEntryForReleaseId(
                              null,
                            );
                            setEditingEntry(null);
                            setEditingRelease(
                              release,
                            );
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleDeleteRelease(
                              release,
                            )
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleRelease(
                              release.id,
                            )
                          }
                          aria-label={
                            expanded
                              ? "Tutup release"
                              : "Buka release"
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ======================================== */}
                  {/* ENTRIES */}
                  {/* ======================================== */}

                  {expanded && (
                    <div className="border-t bg-muted/20 p-4">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold">
                              Entries
                            </h3>

                            <p className="text-xs text-muted-foreground">
                              Detail perubahan yang
                              termasuk dalam release ini.
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              handleCreateEntry(
                                release.id,
                              )
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Entry
                          </Button>
                        </div>

                        {/* ================================== */}
                        {/* CREATE ENTRY FORM */}
                        {/* ================================== */}

                        {isCreatingEntry && (
                          <ChangelogEntryForm
                            mode="create"
                            releaseId={
                              release.id
                            }
                            defaultSortOrder={
                              release.entries
                                .length
                            }
                            onCancel={() =>
                              setCreatingEntryForReleaseId(
                                null,
                              )
                            }
                            onSuccess={
                              handleEntryFormSuccess
                            }
                          />
                        )}

                        {/* ================================== */}
                        {/* EDIT ENTRY FORM */}
                        {/* ================================== */}

                        {editingEntry &&
                          editingEntry.releaseId ===
                            release.id && (
                            <ChangelogEntryForm
                              mode="edit"
                              entry={
                                editingEntry
                              }
                              onCancel={() =>
                                setEditingEntry(
                                  null,
                                )
                              }
                              onSuccess={
                                handleEntryFormSuccess
                              }
                            />
                          )}

                        {/* ================================== */}
                        {/* ENTRY EMPTY STATE */}
                        {/* ================================== */}

                        {release.entries.length ===
                        0 ? (
                          <div className="rounded-lg border border-dashed bg-background p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                              Belum ada entry pada
                              release ini.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {release.entries.map(
                              (entry) => {
                                const entryProcessing =
                                  processingId ===
                                  entry.id;

                                return (
                                  <div
                                    key={
                                      entry.id
                                    }
                                    className="rounded-lg border bg-background p-4"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <EntryTypeBadge
                                            type={
                                              entry.type
                                            }
                                          />

                                          <span className="text-xs text-muted-foreground">
                                            Urutan{" "}
                                            {
                                              entry.sortOrder
                                            }
                                          </span>
                                        </div>

                                        <h4 className="font-medium">
                                          {
                                            entry.title
                                          }
                                        </h4>

                                        <p className="text-sm text-muted-foreground">
                                          {
                                            entry.description
                                          }
                                        </p>

                                        <EntryHighlights
                                          highlights={
                                            entry.highlights
                                          }
                                        />
                                      </div>

                                      <div className="flex shrink-0 flex-wrap gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={
                                            entryProcessing
                                          }
                                          onClick={() =>
                                            handleEditEntry(
                                              entry,
                                            )
                                          }
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </Button>

                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          disabled={
                                            entryProcessing
                                          }
                                          onClick={() =>
                                            handleDeleteEntry(
                                              entry,
                                            )
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Hapus
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

function EntryTypeBadge({
  type,
}: {
  type: ChangelogSettingsEntry["type"];
}) {
  const labels: Record<
    ChangelogSettingsEntry["type"],
    string
  > = {
    FEATURE: "Feature",
    IMPROVEMENT: "Improvement",
    FIX: "Fix",
    PERFORMANCE: "Performance",
  };

  return (
    <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
      {labels[type]}
    </span>
  );
}

function EntryHighlights({
  highlights,
}: {
  highlights: unknown;
}) {
  if (
    !Array.isArray(highlights) ||
    highlights.length === 0
  ) {
    return null;
  }

  const items = highlights.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function formatReleaseDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}
