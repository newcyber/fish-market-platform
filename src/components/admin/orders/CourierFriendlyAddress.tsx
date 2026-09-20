
"use client";

import { useState } from "react";

import {
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

interface CourierAddressData {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  label: string | null;
}

interface CourierFriendlyAddressProps {
  address: CourierAddressData;
}

function toCoordinateString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? String(numericValue)
    : null;
}

function buildMapsUrl(
  address: CourierFriendlyAddressProps["address"]
) {
  const latitude = toCoordinateString(address.latitude);
  const longitude = toCoordinateString(address.longitude);

  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${latitude},${longitude}`
    )}`;
  }

  const query = [
    address.fullAddress,
    address.village,
    address.district,
    address.city,
    address.province,
    address.postalCode,
  ]
    .filter(
      (value) =>
        typeof value === "string" &&
        value.trim() !== ""
    )
    .join(", ");

  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query
      )}`
    : null;
}

function buildCopyText(
  address: CourierFriendlyAddressProps["address"]
) {
  return [
    "PENGIRIMAN PISJO MARKET",
    `Penerima: ${address.receiverName}`,
    `Telepon: ${address.receiverPhone}`,
    "",
    "Alamat:",
    address.fullAddress,
    [address.village, address.district]
      .filter(Boolean)
      .join(", "),
    [address.city, address.province]
      .filter(Boolean)
      .join(", "),
    `Kode Pos: ${address.postalCode}`,
    address.notes
      ? `\nCatatan: ${address.notes}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Lanjutkan ke fallback
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  let success = false;

  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return success;
}

export default function CourierFriendlyAddress({
  address,
}: CourierFriendlyAddressProps) {
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const mapsUrl = buildMapsUrl(address);
  const copyText = buildCopyText(address);

  const handleCopyAddress = async () => {
    setCopyStatus("idle");

    const success = await copyTextToClipboard(copyText);

    setCopyStatus(success ? "success" : "error");

    if (success) {
      window.setTimeout(() => {
        setCopyStatus("idle");
      }, 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* PENERIMA */}
      <div className="rounded-2xl border border-[var(--pisjo-primary)]/15 bg-[var(--pisjo-soft-blue)]/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--pisjo-ocean)] shadow-sm">
            <UserRound className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pisjo-text-secondary)]">
              Penerima
            </p>

            <p className="mt-1 break-words text-base font-bold text-[var(--pisjo-navy)]">
              {address.receiverName}
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--pisjo-text-secondary)]">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="break-all">
                {address.receiverPhone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ALAMAT UTAMA */}
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pisjo-text-secondary)]">
            Alamat Utama
          </p>

          <p className="mt-1 whitespace-pre-line break-words text-sm font-semibold leading-6 text-[var(--pisjo-navy)]">
            {address.fullAddress || "-"}
          </p>
        </div>

        {/* WILAYAH */}
        <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2">
          {[
            ["Kelurahan / Desa", address.village],
            ["Kecamatan", address.district],
            ["Kota / Kabupaten", address.city],
            ["Provinsi", address.province],
            ["Kode Pos", address.postalCode],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-xs text-[var(--pisjo-text-secondary)]">
                {label}
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-[var(--pisjo-navy)]">
                {value || "-"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CATATAN */}
      {address.notes?.trim() ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">
            Patokan / Instruksi Pengiriman
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-amber-950">
            {address.notes.trim()}
          </p>
        </div>
      ) : null}

      {/* NAVIGASI DAN SALIN */}
      <div className="grid gap-2 sm:grid-cols-2">
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-ocean)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            <MapPin className="h-4 w-4" />
            Buka Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}

<button
  type="button"
  onClick={() => {
    void handleCopyAddress();
  }}
  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[var(--pisjo-navy)] transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
>
  {copyStatus === "success" ? (
    <Check className="h-4 w-4 text-emerald-600" />
  ) : (
    <Copy className="h-4 w-4" />
  )}

  {copyStatus === "success"
    ? "Alamat Berhasil Disalin"
    : "Salin Alamat"}
</button>

{copyStatus === "error" ? (
  <p className="text-xs font-medium text-red-600 sm:col-span-2">
    Alamat gagal disalin. Silakan coba lagi atau salin alamat secara manual.
  </p>
) : null}
      </div>

      {/* LABEL */}
      {address.label ? (
        <p className="text-xs text-[var(--pisjo-text-secondary)]">
          Label alamat:{" "}
          <span className="font-semibold">
            {address.label}
          </span>
        </p>
      ) : null}
    </div>
  );
}
