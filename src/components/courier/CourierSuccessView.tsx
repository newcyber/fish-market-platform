"use client";

import Link from "next/link";
import { Check, ClipboardList, WalletCards, ArrowRight, MapPin, Package } from "lucide-react";

import type { CourierAssignmentDetail, CourierAssignmentListItem } from "@/services/courier/courier.service";
import { CourierHeader, money, OperationalBadge, PaymentBadge, StatusBadge } from "@/components/courier/CourierUi";

export function CourierSuccessView({
  assignment,
  nextAssignment,
  completedToday,
  earningsToday,
}: {
  assignment: CourierAssignmentDetail;
  nextAssignment: CourierAssignmentListItem | null;
  completedToday: number;
  earningsToday: number;
}) {
  const address = assignment.order.address;

  return (
    <div>
      <CourierHeader title="Pengantaran Selesai" back />

      <div className="space-y-3 px-3 py-4">
        <section className="px-4 py-6 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#EAF8F0]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#16A34A] text-white">
              <Check className="h-12 w-12" strokeWidth={3} />
            </div>
          </div>
          <h2 className="mt-6 text-[30px] font-bold leading-9 text-[#0F2448]">
            Pesanan Berhasil
            <br />
            Diserahkan
          </h2>
          <p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-6 text-[#64748B]">
            Bukti pengantaran tersimpan dan status order sudah selesai.
          </p>
        </section>

        <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-4 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[12px] text-[#64748B]">{assignment.order.orderNumber}</p>
              <p className="mt-1 text-[18px] font-bold text-[#0F2448]">
                {address.receiverName}
              </p>
            </div>
            <StatusBadge status="DELIVERED" />
          </div>

          <div className="mt-2 flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0F2448]" />
            <p className="text-[13px] leading-5 text-[#64748B]">{address.fullAddress}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <OperationalBadge icon={Package}>{assignment.order.itemsCount} paket</OperationalBadge>
            <PaymentBadge paid={assignment.order.paymentStatus === "VERIFIED"} />
            {assignment.courierPayout ? (
              <OperationalBadge icon={WalletCards}>
                Hak Kurir +{money(assignment.courierPayout.courierPayout)}
              </OperationalBadge>
            ) : null}
          </div>
        </section>

        <section className="grid grid-cols-2 overflow-hidden rounded-[18px] border border-[#DCE6F1] bg-white shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="p-4 text-center">
            <p className="text-xs text-[#64748B]">Total selesai hari ini</p>
            <p className="mt-1 text-[26px] font-bold text-[#0F2448]">{completedToday}</p>
            <p className="text-xs text-[#64748B]">tugas</p>
          </div>
          <div className="border-l border-[#DCE6F1] p-4 text-center">
            <p className="text-xs text-[#64748B]">Penghasilan hari ini</p>
            <p className="mt-1 text-[22px] font-bold text-[#0F2448]">{money(earningsToday)}</p>
            <p className="text-xs text-[#64748B]">hak kurir</p>
          </div>
        </section>

        {nextAssignment ? (
          <Link
            href={`/courier/tasks/${nextAssignment.id}`}
            className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0B84F3] text-[16px] font-semibold text-white"
          >
            <ArrowRight className="h-5 w-5" />
            Lanjut ke Tugas Berikutnya
          </Link>
        ) : (
          <Link
            href="/courier"
            className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0B84F3] text-[16px] font-semibold text-white"
          >
            <ArrowRight className="h-5 w-5" />
            Kembali ke Dashboard
          </Link>
        )}

        <Link
          href="/courier/tasks?tab=active"
          className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-[#DCE6F1] bg-white text-[16px] font-semibold text-[#0B84F3]"
        >
          <ClipboardList className="h-5 w-5" />
          Kembali ke Daftar Tugas
        </Link>
      </div>
    </div>
  );
}
