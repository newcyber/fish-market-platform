"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { CourierAssignmentDetail } from "@/services/courier/courier.service";
import {
  ActionButton,
  CourierHeader,
  money,
  OperationalBadge,
  PaymentBadge,
  StatusBadge,
  Timeline,
} from "@/components/courier/CourierUi";
import { CourierDetailMap } from "@/components/courier/CourierDetailMap";

function nextAction(status: string) {
  switch (status) {
    case "ASSIGNED":
      return { status: "PICKED_UP", label: "Ambil Pesanan", icon: Package };
    case "PICKED_UP":
      return { status: "ON_ROUTE", label: "Mulai Antar", icon: Navigation };
    case "ON_ROUTE":
      return { status: "ARRIVED", label: "Tiba di Lokasi", icon: Navigation };
    default:
      return null;
  }
}

export function CourierAssignmentDetailView({
  initial,
}: {
  initial: CourierAssignmentDetail;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transition(status: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/courier/assignments/${initial.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Gagal memperbarui status.");

      if (status === "ARRIVED") {
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memperbarui status.");
    } finally {
      setLoading(false);
    }
  }

  const action = nextAction(initial.status);
  const ActionIcon = action?.icon;
  const address = initial.order.address;
  const phone = address.receiverPhone || initial.order.customer.phone;
  const timestamps: Record<string, string | null> = {
    ASSIGNED: initial.assignedAt,
    PICKED_UP: initial.pickedUpAt,
    ON_ROUTE: initial.startedAt,
    ARRIVED: initial.arrivedAt,
    DELIVERED: initial.deliveredAt,
  };

  return (
    <div>
      <CourierHeader title="Detail Pengantaran" back />

      <div className="space-y-3 px-3 py-3">
        <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-4 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-[#64748B]">
              {initial.order.orderNumber}
            </p>
            <StatusBadge status={initial.status} />
          </div>

          <h2 className="mt-2 text-[22px] font-bold text-[#0F2448]">
            {address.receiverName}
          </h2>

          <div className="mt-3 flex items-center gap-2">
            <Phone className="h-6 w-6 text-[#0B84F3]" />
            {phone ? (
              <a href={`tel:${phone}`} className="text-[18px] font-bold text-[#0B84F3]">
                {phone}
              </a>
            ) : (
              <span className="text-sm text-[#64748B]">Nomor tidak tersedia</span>
            )}
          </div>

          <div className="mt-3 flex items-start gap-2">
            <span className="mt-0.5">
              <Navigation className="h-6 w-6 text-[#0F2448]" />
            </span>
            <p className="text-[14px] leading-5 text-[#64748B]">
              {address.fullAddress}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <OperationalBadge icon={Package}>
              {initial.order.itemsCount} paket
            </OperationalBadge>
            <PaymentBadge paid={initial.order.paymentStatus === "VERIFIED"} />
            <OperationalBadge icon={Package}>
              Hak Kurir {money(initial.courierPayout?.courierPayout ?? initial.order.courierPayoutEstimate)}
            </OperationalBadge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {phone ? (
              <>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCE6F1] text-[15px] font-semibold text-[#0F2448]"
                >
                  <Phone className="h-5 w-5 text-[#0B84F3]" />
                  Hubungi
                </a>
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#EAF8F0] text-[15px] font-semibold text-[#16A34A]"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              </>
            ) : null}
          </div>
        </section>

        <CourierDetailMap
          latitude={address.latitude}
          longitude={address.longitude}
        />

        <Timeline status={initial.status} timestamps={timestamps} />

        {error ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF0F0] px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        ) : null}

        {initial.status === "ARRIVED" ? (
          <ActionButton href={`/courier/tasks/${initial.id}/proof`}>
            <CheckCircle2 className="h-5 w-5" />
            Selesaikan Pengantaran
          </ActionButton>
        ) : action ? (
          <ActionButton
            onClick={() => void transition(action.status)}
            disabled={loading}
          >
            {ActionIcon ? <ActionIcon className="h-5 w-5" /> : null}
            {loading ? "Memproses..." : action.label}
          </ActionButton>
        ) : null}

        {["PICKED_UP", "ON_ROUTE", "ARRIVED"].includes(initial.status) ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#DCE6F1] bg-white text-[15px] font-semibold text-[#0F2448]"
          >
            <Navigation className="h-5 w-5 text-[#0B84F3]" />
            Navigasi
          </a>
        ) : null}

        {initial.status === "DELIVERED" && initial.deliveryProof ? (
          <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-4">
            <p className="text-[16px] font-bold text-[#0F2448]">Bukti Pengantaran</p>
            {initial.deliveryProof.photoUrl ? (
              <img
                src={initial.deliveryProof.photoUrl}
                alt="Bukti pengantaran"
                className="mt-3 aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#64748B]">
              <span>GPS: {initial.deliveryProof.latitude?.toFixed(6)}, {initial.deliveryProof.longitude?.toFixed(6)}</span>
              <span className="text-right">{initial.deliveryProof.capturedAt}</span>
            </div>
          </section>
        ) : null}

        {initial.status === "DELIVERED" ? (
          <div className="rounded-2xl bg-[#EAF8F0] px-4 py-3 text-sm font-semibold text-[#16A34A]">
            Pengantaran selesai dan hak kurir sudah tercatat.
          </div>
        ) : null}

        <Link
          href="/courier/tasks"
          className="flex h-12 items-center justify-center gap-2 text-sm font-semibold text-[#0B84F3]"
        >
          Kembali ke Tugas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
