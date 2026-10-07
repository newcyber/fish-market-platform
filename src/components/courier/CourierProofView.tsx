"use client";

import { useEffect, useState } from "react";
import { Camera, Check, CheckCircle2, MapPin, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import type { CourierAssignmentDetail } from "@/services/courier/courier.service";
import {
  CourierHeader,
  money,
  OperationalBadge,
  PaymentBadge,
  StatusBadge,
} from "@/components/courier/CourierUi";

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1280;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal memproses foto.");

  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.78;
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  while (blob && blob.size > 500 * 1024 && quality > 0.5) {
    quality -= 0.06;
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  }

  if (!blob) throw new Error("Foto tidak dapat diproses.");

  return new File([blob], `proof-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

export function CourierProofView({
  assignment,
}: {
  assignment: CourierAssignmentDetail;
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLoading(false);
      setError("GPS tidak didukung oleh perangkat ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError("GPS wajib aktif. Izinkan akses lokasi lalu coba lagi.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handlePhoto(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImage(file);
      if (preview) URL.revokeObjectURL(preview);
      setPhoto(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Foto tidak dapat diproses.");
    }
  }

  async function refreshGps() {
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setError("Lokasi GPS belum tersedia.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function confirm() {
    if (!photo || !gps) {
      setError("Foto dan GPS wajib tersedia sebelum konfirmasi.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("photo", photo);
      form.set("latitude", String(gps.latitude));
      form.set("longitude", String(gps.longitude));

      const proofResponse = await fetch(
        `/api/courier/assignments/${assignment.id}/proof`,
        { method: "POST", body: form },
      );
      const proof = await proofResponse.json();
      if (!proofResponse.ok || !proof.data?.id) {
        throw new Error(proof.message ?? "Gagal menyimpan bukti pengantaran.");
      }

      const statusResponse = await fetch(
        `/api/courier/assignments/${assignment.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "DELIVERED",
            proofId: proof.data.id,
          }),
        },
      );
      const status = await statusResponse.json();
      if (!statusResponse.ok) {
        throw new Error(status.message ?? "Gagal menyelesaikan pengantaran.");
      }

      router.replace(`/courier/tasks/${assignment.id}/success`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyelesaikan pengantaran.");
    } finally {
      setSubmitting(false);
    }
  }

  const ready = Boolean(photo && gps && !gpsLoading);

  return (
    <div>
      <CourierHeader title="Bukti Pengantaran" back />

      <div className="space-y-3 px-3 py-3">
        <section className="flex items-center gap-3 rounded-[18px] border border-[#DCE6F1] bg-[#EAF5FF] p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#0B84F3]">
            <Camera className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-bold leading-5 text-[#0F2448]">
            Ambil foto sebagai bukti pesanan sudah diterima customer.
          </p>
        </section>

        <section className="rounded-[18px] border border-[#DCE6F1] bg-white p-3 shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-start justify-between gap-2 px-1 py-1">
            <div>
              <p className="text-[12px] text-[#64748B]">{assignment.order.orderNumber}</p>
              <p className="mt-1 text-[18px] font-bold text-[#0F2448]">
                {assignment.order.address.receiverName}
              </p>
            </div>
            <StatusBadge status={assignment.status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 px-1">
            <OperationalBadge icon={Camera}>{assignment.order.itemsCount} paket</OperationalBadge>
            <PaymentBadge paid={assignment.order.paymentStatus === "VERIFIED"} />
            <OperationalBadge icon={CheckCircle2}>
              Hak Kurir {money(assignment.courierPayout?.courierPayout ?? assignment.order.courierPayoutEstimate)}
            </OperationalBadge>
          </div>

          <div className="mt-3 overflow-hidden rounded-[18px] bg-slate-100">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview bukti pengantaran" className="aspect-[4/5] w-full object-cover" />
                <label className="absolute bottom-4 left-1/2 flex h-14 w-14 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-white text-[#0F2448] shadow-xl">
                  <Camera className="h-6 w-6" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            ) : (
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-3 text-[#0B84F3]">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF5FF]">
                  <Camera className="h-9 w-9" />
                </span>
                <span className="text-[16px] font-bold">Ambil Foto</span>
                <span className="text-xs text-[#64748B]">JPEG/WebP, otomatis dikompresi</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 overflow-hidden rounded-[18px] border border-[#DCE6F1] bg-white shadow-[0_2px_8px_rgba(15,46,94,0.08)]">
          <div className="flex items-center gap-2 p-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${gps ? "bg-[#EAF8F0] text-[#16A34A]" : "bg-[#FFF4E5] text-[#F59E0B]"}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">GPS</p>
              <p className="text-sm font-bold text-[#0F2448]">{gps ? "Aktif" : "Menunggu"}</p>
            </div>
          </div>
          <div className="flex items-center justify-end border-l border-[#DCE6F1] p-3">
            <button
              type="button"
              onClick={() => void refreshGps()}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B84F3]"
            >
              <RefreshCw className={`h-4 w-4 ${gpsLoading ? "animate-spin" : ""}`} />
              Perbarui
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF0F0] px-4 py-3 text-sm font-medium text-[#EF4444]">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#DCE6F1] bg-white text-[15px] font-semibold text-[#0F2448]">
            <RefreshCw className="h-5 w-5 text-[#0B84F3]" />
            Ambil Ulang
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={!ready || submitting}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#16A34A] text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            Konfirmasi Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
