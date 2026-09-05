import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Coins,
  Gift,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import {
  getAdminRewardClaim,
} from "@/services/reward/reward-claim.service";

import RewardClaimStatusControl from "@/components/admin/reward-claims/RewardClaimStatusControl";

export const dynamic =
  "force-dynamic";

interface RewardClaimDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(
  value: Date | null | undefined
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "long",
      timeStyle: "short",
    }
  ).format(value);
}

function formatPoints(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(value);
}

export default async function RewardClaimDetailPage({
  params,
}: RewardClaimDetailPageProps) {
  const { id } = await params;

  const claim =
    await getAdminRewardClaim(id);

  if (!claim) {
    notFound();
  }

  const addressParts = [
    claim.fullAddress,
    claim.village,
    claim.district,
    claim.city,
    claim.province,
    claim.postalCode,
  ].filter(Boolean);

  return (
    <div className="min-h-full bg-[var(--pisjo-bg)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div>
          <Link
            href="/admin/reward-claims"
            className="inline-flex items-center text-sm font-medium text-[var(--pisjo-primary)] transition-colors hover:text-[var(--pisjo-ocean)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Reward Claims
          </Link>

          <div className="mt-3">
            <h1 className="text-xl font-bold text-[var(--pisjo-navy)] sm:text-2xl">
              Detail Reward Claim
            </h1>

            <p className="mt-1 break-all text-xs text-[var(--pisjo-text-secondary)]">
              ID: {claim.id}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* MAIN */}
          <div className="min-w-0 space-y-6">
            {/* CUSTOMER */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[var(--pisjo-primary)]" />

                <h2 className="font-bold text-[var(--pisjo-navy)]">
                  Customer
                </h2>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Nama
                  </p>

                  <p className="mt-1 break-words font-semibold text-slate-900">
                    {claim.user?.name ??
                      "-"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Email
                  </p>

                  <p className="mt-1 flex items-start gap-2 break-all text-sm text-slate-700">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-text-secondary)]" />

                    {claim.user?.email ??
                      "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Telepon
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 shrink-0 text-[var(--pisjo-text-secondary)]" />

                    {claim.user?.phone ??
                      "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                    Tanggal Claim
                  </p>

                  <p className="mt-1 flex items-start gap-2 text-sm text-slate-700">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-text-secondary)]" />

                    {formatDate(
                      claim.createdAt
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* REWARD */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-[var(--pisjo-primary)]" />

                <h2 className="font-bold text-[var(--pisjo-navy)]">
                  Reward
                </h2>
              </div>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                {claim.rewardImage ? (
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={claim.rewardImage}
                      alt={claim.rewardName}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-bold text-slate-900">
                    {claim.rewardName}
                  </h3>

                  {claim.rewardDescription ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--pisjo-text-secondary)]">
                      {claim.rewardDescription}
                    </p>
                  ) : null}

                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--pisjo-soft-blue)] px-3 py-2 text-sm font-bold text-[var(--pisjo-ocean)]">
                    <Coins className="h-4 w-4" />

                    {formatPoints(
                      claim.pointsSpent
                    )}{" "}
                    poin
                  </div>
                </div>
              </div>
            </section>

            {/* SHIPPING ADDRESS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[var(--pisjo-primary)]" />

                <h2 className="font-bold text-[var(--pisjo-navy)]">
                  Alamat Pengiriman
                </h2>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-bg)] p-4">
                <p className="font-semibold text-slate-900">
                  {claim.receiverName}
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {claim.receiverPhone}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {addressParts.length > 0
                    ? addressParts.join(", ")
                    : "-"}
                </p>

                {claim.latitude !== null &&
                claim.latitude !== undefined &&
                claim.longitude !== null &&
                claim.longitude !== undefined ? (
                  <p className="mt-3 text-xs text-[var(--pisjo-text-secondary)]">
                    Koordinat tersimpan untuk
                    pengiriman:{" "}
                    {String(
                      claim.latitude
                    )},{" "}
                    {String(
                      claim.longitude
                    )}
                  </p>
                ) : null}
              </div>
            </section>

            {/* REJECTION */}
            {claim.rejectionReason ? (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
                <h2 className="font-bold text-red-800">
                  Alasan Penolakan
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  {claim.rejectionReason}
                </p>
              </section>
            ) : null}
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* STATUS CONTROL */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <h2 className="font-bold text-[var(--pisjo-navy)]">
                Proses Claim
              </h2>

              <p className="mt-1 text-sm leading-5 text-[var(--pisjo-text-secondary)]">
                Perbarui status setelah reward
                diproses.
              </p>

              <div className="mt-5">
                <RewardClaimStatusControl
                  claimId={claim.id}
                  status={claim.status}
                />
              </div>
            </section>

            {/* TIMELINE */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-bold text-[var(--pisjo-navy)]">
                Timeline
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Claim dibuat
                  </p>

                  <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                    {formatDate(
                      claim.createdAt
                    )}
                  </p>
                </div>

                {claim.approvedAt ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Claim disetujui
                    </p>

                    <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                      {formatDate(
                        claim.approvedAt
                      )}
                    </p>
                  </div>
                ) : null}

                {claim.shippedAt ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Reward dikirim
                    </p>

                    <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                      {formatDate(
                        claim.shippedAt
                      )}
                    </p>
                  </div>
                ) : null}

                {claim.completedAt ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Claim selesai
                    </p>

                    <p className="mt-1 text-xs text-[var(--pisjo-text-secondary)]">
                      {formatDate(
                        claim.completedAt
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
