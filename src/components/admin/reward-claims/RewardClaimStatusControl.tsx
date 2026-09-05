"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CheckCircle2,
  Loader2,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import {
  RewardClaimStatus,
} from "@prisma/client";

import {
  Button,
} from "@/components/ui/button";

import {
  updateRewardClaimStatusAction,
} from "@/actions/reward/update-reward-claim-status";

interface RewardClaimStatusControlProps {
  claimId: string;
  status: RewardClaimStatus;
}

function getStatusLabel(
  status: RewardClaimStatus
) {
  switch (status) {
    case RewardClaimStatus.PENDING:
      return "Menunggu Persetujuan";

    case RewardClaimStatus.APPROVED:
      return "Disetujui";

    case RewardClaimStatus.PROCESSING:
      return "Sedang Diproses";

    case RewardClaimStatus.SHIPPED:
      return "Dikirim";

    case RewardClaimStatus.COMPLETED:
      return "Selesai";

    case RewardClaimStatus.REJECTED:
      return "Ditolak";

    case RewardClaimStatus.CANCELLED:
      return "Dibatalkan";

    default:
      return status;
  }
}

export default function RewardClaimStatusControl({
  claimId,
  status,
}: RewardClaimStatusControlProps) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    showReject,
    setShowReject,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  let nextStatus:
    | RewardClaimStatus
    | null = null;

  let actionLabel = "Lanjutkan";

  let ActionIcon = CheckCircle2;

  if (
    status ===
    RewardClaimStatus.PENDING
  ) {
    nextStatus =
      RewardClaimStatus.APPROVED;

    actionLabel = "Setujui Claim";
    ActionIcon = CheckCircle2;
  }

  if (
    status ===
    RewardClaimStatus.APPROVED
  ) {
    nextStatus =
      RewardClaimStatus.PROCESSING;

    actionLabel = "Mulai Proses";
    ActionIcon = PackageCheck;
  }

  if (
    status ===
    RewardClaimStatus.PROCESSING
  ) {
    nextStatus =
      RewardClaimStatus.SHIPPED;

    actionLabel = "Tandai Dikirim";
    ActionIcon = Truck;
  }

  if (
    status ===
    RewardClaimStatus.SHIPPED
  ) {
    nextStatus =
      RewardClaimStatus.COMPLETED;

    actionLabel = "Selesaikan";
    ActionIcon = CheckCircle2;
  }

  const isTerminal =
    status ===
      RewardClaimStatus.COMPLETED ||
    status ===
      RewardClaimStatus.REJECTED ||
    status ===
      RewardClaimStatus.CANCELLED;

  function updateStatus(
    targetStatus: RewardClaimStatus,
    reason?: string
  ) {
    setError("");
    setSuccess("");

    startTransition(
      async () => {
        const result =
          await updateRewardClaimStatusAction(
            claimId,
            targetStatus,
            reason
          );

        if (!result.success) {
          setError(
            result.message ??
              "Gagal memperbarui status."
          );
          return;
        }

        setShowReject(false);
        setRejectionReason("");

        if (
          targetStatus ===
          RewardClaimStatus.REJECTED
        ) {
          const refundPoints =
            result.refund?.points;

          if (
            typeof refundPoints ===
            "number"
          ) {
            setSuccess(
              `Claim ditolak. ${new Intl.NumberFormat(
                "id-ID"
              ).format(
                refundPoints
              )} poin customer telah dikembalikan.`
            );
          } else {
            setSuccess(
              "Claim berhasil ditolak dan proses refund telah dijalankan."
            );
          }
        } else {
          setSuccess(
            result.message ??
              "Status berhasil diperbarui."
          );
        }

        router.refresh();
      }
    );
  }

  function handleApproveOrNext() {
    if (!nextStatus) {
      return;
    }

    updateStatus(nextStatus);
  }

  function handleReject() {
    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        "Alasan penolakan wajib diisi."
      );
      return;
    }

    updateStatus(
      RewardClaimStatus.REJECTED,
      reason
    );
  }

  return (
    <div className="space-y-4">
      {/* CURRENT STATUS */}
      <div className="rounded-xl border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-bg)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
          Status Saat Ini
        </p>

        <p className="mt-1 text-base font-bold text-[var(--pisjo-navy)]">
          {getStatusLabel(status)}
        </p>
      </div>

      {/* ACTIONS */}
      {!isTerminal ? (
        <div className="space-y-3">
          {nextStatus ? (
            <Button
              type="button"
              onClick={
                handleApproveOrNext
              }
              disabled={isPending}
              className="min-h-11 w-full bg-[var(--pisjo-primary)] text-white hover:bg-[var(--pisjo-ocean)]"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ActionIcon className="mr-2 h-4 w-4" />
              )}

              {actionLabel}
            </Button>
          ) : null}

          {/* REJECT */}
          {status ===
          RewardClaimStatus.PENDING ? (
            <>
              {!showReject ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setShowReject(
                      true
                    );
                  }}
                  className="min-h-11 w-full border-red-200 text-[var(--pisjo-red)] hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak Claim
                </Button>
              ) : (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Alasan Penolakan
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      Claim yang ditolak akan
                      mengembalikan poin customer
                      dan stok reward melalui
                      proses refund sistem.
                    </p>
                  </div>

                  <textarea
                    value={
                      rejectionReason
                    }
                    onChange={(
                      event
                    ) =>
                      setRejectionReason(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Contoh: Stok reward sudah habis."
                    disabled={isPending}
                    className="w-full resize-y rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setShowReject(
                          false
                        );
                        setRejectionReason(
                          ""
                        );
                        setError("");
                      }}
                      className="min-h-11 w-full sm:flex-1"
                    >
                      Batal
                    </Button>

                    <Button
                      type="button"
                      disabled={
                        isPending ||
                        !rejectionReason.trim()
                      }
                      onClick={
                        handleReject
                      }
                      className="min-h-11 w-full bg-[var(--pisjo-red)] text-white hover:bg-red-700 sm:flex-1"
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}

                      Konfirmasi Penolakan
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      {/* ERROR */}
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {/* SUCCESS */}
      {success ? (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {success}
        </div>
      ) : null}
    </div>
  );
}
