"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  PromotionStatus,
} from "@prisma/client";

import {
  CalendarClock,
  CheckCircle2,
  CircleStop,
  Ban,
  Trash2,
  X,
} from "lucide-react";

import {
  schedulePromotionAction,
  activatePromotionAction,
  endPromotionAction,
  cancelPromotionAction,
  deletePromotionAction,
} from "@/actions/promotion/promotion-lifecycle";

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface PromotionLifecycleActionsProps {
  id: string;
  status: PromotionStatus;
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function PromotionLifecycleActions({
  id,
  status,
}: PromotionLifecycleActionsProps) {
  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    scheduling,
    setScheduling,
  ] = useState(false);

  const [
    scheduleError,
    setScheduleError,
  ] = useState<string | null>(
    null
  );

  const [
    startAt,
    setStartAt,
  ] = useState("");

  const [
    endAt,
    setEndAt,
  ] = useState("");

  /**
   * ==========================================================
   * DELETE CONFIRMATION
   * ==========================================================
   */

  function handleDeleteSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    const confirmed =
      window.confirm(
        "Yakin ingin menghapus promotion ini? Promotion akan dipindahkan ke Trash."
      );

    if (!confirmed) {
      event.preventDefault();

      return;
    }

    setDeleting(true);
  }

  /**
   * ==========================================================
   * OPEN SCHEDULE FORM
   * ==========================================================
   */

  function handleOpenSchedule() {
    setScheduleError(null);

    setScheduling(true);
  }

  /**
   * ==========================================================
   * CLOSE SCHEDULE FORM
   * ==========================================================
   */

  function handleCloseSchedule() {
    if (scheduling) {
      setScheduleError(null);
      setScheduling(false);
    }
  }

  /**
   * ==========================================================
   * VALIDATE SCHEDULE
   * ==========================================================
   */

  function validateSchedule(
    event: FormEvent<HTMLFormElement>
  ) {
    setScheduleError(null);

    if (!startAt) {
      event.preventDefault();

      setScheduleError(
        "Tanggal dan waktu mulai wajib diisi."
      );

      return;
    }

    if (!endAt) {
      event.preventDefault();

      setScheduleError(
        "Tanggal dan waktu berakhir wajib diisi."
      );

      return;
    }

    const start =
      new Date(startAt);

    const end =
      new Date(endAt);

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      event.preventDefault();

      setScheduleError(
        "Format tanggal promotion tidak valid."
      );

      return;
    }

    if (start >= end) {
      event.preventDefault();

      setScheduleError(
        "Tanggal dan waktu mulai harus lebih kecil dari tanggal dan waktu berakhir."
      );

      return;
    }

    /**
     * --------------------------------------------------------
     * IMPORTANT
     * --------------------------------------------------------
     *
     * datetime-local menghasilkan waktu lokal browser.
     *
     * Kita kirim ISO string ke Server Action agar
     * interpretasi timezone tidak bergantung pada timezone
     * server.
     */

    const form =
      event.currentTarget;

    const startAtInput =
      form.elements.namedItem(
        "startAt"
      ) as HTMLInputElement | null;

    const endAtInput =
      form.elements.namedItem(
        "endAt"
      ) as HTMLInputElement | null;

    if (
      !startAtInput ||
      !endAtInput
    ) {
      event.preventDefault();

      setScheduleError(
        "Field tanggal promotion tidak ditemukan."
      );

      return;
    }

    startAtInput.value =
      start.toISOString();

    endAtInput.value =
      end.toISOString();
  }

  /**
   * ==========================================================
   * DRAFT
   * ==========================================================
   *
   * DRAFT hanya boleh:
   *
   * - Schedule
   * - Cancel
   * - Delete
   *
   * Activate tidak ditampilkan.
   */

  if (
    status ===
    PromotionStatus.DRAFT
  ) {
    return (
      <div className="space-y-4">

        {/* ================================================== */}
        {/* ACTION BUTTONS */}
        {/* ================================================== */}

        <div className="flex flex-wrap gap-3">

          {/* ================================================= */}
          {/* SCHEDULE */}
          {/* ================================================= */}

          {!scheduling && (
            <button
              type="button"
              onClick={
                handleOpenSchedule
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
            >
              <CalendarClock className="h-4 w-4" />

              Schedule
            </button>
          )}

          {/* ================================================= */}
          {/* CANCEL */}
          {/* ================================================= */}

          <form
            action={cancelPromotionAction.bind(
              null,
              id
            )}
          >
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50"
            >
              <Ban className="h-4 w-4" />

              Cancel
            </button>
          </form>

          {/* ================================================= */}
          {/* DELETE */}
          {/* ================================================= */}

          <form
            action={deletePromotionAction.bind(
              null,
              id
            )}
            onSubmit={
              handleDeleteSubmit
            }
          >
            <button
              type="submit"
              disabled={deleting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />

              {deleting
                ? "Menghapus..."
                : "Delete"}
            </button>
          </form>
        </div>

        {/* ================================================== */}
        {/* SCHEDULE FORM */}
        {/* ================================================== */}

        {scheduling && (
          <div className="rounded-xl border bg-card p-5 shadow-xs">

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>
                <h3 className="text-base font-semibold">
                  Schedule Promotion
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tentukan tanggal dan waktu mulai serta
                  berakhirnya promotion.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseSchedule
                }
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup Schedule"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              action={schedulePromotionAction.bind(
                null,
                id
              )}
              onSubmit={
                validateSchedule
              }
              className="space-y-5"
            >

              {/* ================================================= */}
              {/* START AT */}
              {/* ================================================= */}

              <div className="space-y-2">

                <label
                  htmlFor="promotion-start-at"
                  className="text-sm font-medium"
                >
                  Mulai
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="promotion-start-at"
                  type="datetime-local"
                  value={startAt}
                  onChange={(
                    event
                  ) =>
                    setStartAt(
                      event.target.value
                    )
                  }
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                {/*
                  Hidden input ini yang dikirim ke Server Action.
                  Nilainya akan diubah menjadi ISO string di
                  validateSchedule().
                */}
                <input
                  type="hidden"
                  name="startAt"
                  value={
                    startAt
                      ? new Date(
                          startAt
                        ).toISOString()
                      : ""
                  }
                  readOnly
                />

                <p className="text-xs text-muted-foreground">
                  Tentukan kapan promotion mulai berlaku.
                </p>
              </div>

              {/* ================================================= */}
              {/* END AT */}
              {/* ================================================= */}

              <div className="space-y-2">

                <label
                  htmlFor="promotion-end-at"
                  className="text-sm font-medium"
                >
                  Berakhir
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="promotion-end-at"
                  type="datetime-local"
                  value={endAt}
                  onChange={(
                    event
                  ) =>
                    setEndAt(
                      event.target.value
                    )
                  }
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <input
                  type="hidden"
                  name="endAt"
                  value={
                    endAt
                      ? new Date(
                          endAt
                        ).toISOString()
                      : ""
                  }
                  readOnly
                />

                <p className="text-xs text-muted-foreground">
                  Tentukan kapan promotion berakhir.
                </p>
              </div>

              {/* ================================================= */}
              {/* ERROR */}
              {/* ================================================= */}

              {scheduleError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {scheduleError}
                </div>
              )}

              {/* ================================================= */}
              {/* FORM ACTION */}
              {/* ================================================= */}

              <div className="flex flex-wrap gap-3">

                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                >
                  <CalendarClock className="h-4 w-4" />

                  Schedule Promotion
                </button>

                <button
                  type="button"
                  onClick={
                    handleCloseSchedule
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
                >
                  <X className="h-4 w-4" />

                  Batal
                </button>

              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  /**
   * ==========================================================
   * SCHEDULED
   * ==========================================================
   *
   * SCHEDULED boleh:
   *
   * - Activate
   * - Cancel
   * - Delete
   */

  if (
    status ===
    PromotionStatus.SCHEDULED
  ) {
    return (
      <div className="flex flex-wrap gap-3">

        {/* ================================================== */}
        {/* ACTIVATE */}
        {/* ================================================== */}

        <form
          action={activatePromotionAction.bind(
            null,
            id
          )}
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4" />

            Activate
          </button>
        </form>

        {/* ================================================== */}
        {/* CANCEL */}
        {/* ================================================== */}

        <form
          action={cancelPromotionAction.bind(
            null,
            id
          )}
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50"
          >
            <Ban className="h-4 w-4" />

            Cancel
          </button>
        </form>

        {/* ================================================== */}
        {/* DELETE */}
        {/* ================================================== */}

        <form
          action={deletePromotionAction.bind(
            null,
            id
          )}
          onSubmit={
            handleDeleteSubmit
          }
        >
          <button
            type="submit"
            disabled={deleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />

            {deleting
              ? "Menghapus..."
              : "Delete"}
          </button>
        </form>

      </div>
    );
  }

  /**
   * ==========================================================
   * ACTIVE
   * ==========================================================
   *
   * ACTIVE boleh:
   *
   * - End
   * - Cancel
   */

  if (
    status ===
    PromotionStatus.ACTIVE
  ) {
    return (
      <div className="flex flex-wrap gap-3">

        {/* ================================================== */}
        {/* END */}
        {/* ================================================== */}

        <form
          action={endPromotionAction.bind(
            null,
            id
          )}
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-orange-200 bg-background px-4 py-2 text-sm font-medium text-orange-600 shadow-xs transition-colors hover:bg-orange-50"
          >
            <CircleStop className="h-4 w-4" />

            End Promotion
          </button>
        </form>

        {/* ================================================== */}
        {/* CANCEL */}
        {/* ================================================== */}

        <form
          action={cancelPromotionAction.bind(
            null,
            id
          )}
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-background px-4 py-2 text-sm font-medium text-red-600 shadow-xs transition-colors hover:bg-red-50"
          >
            <Ban className="h-4 w-4" />

            Cancel
          </button>
        </form>

      </div>
    );
  }

  /**
   * ==========================================================
   * TERMINAL STATUS
   * ==========================================================
   *
   * ENDED
   * CANCELLED
   *
   * Tidak ada lifecycle action.
   */

  return null;
}
