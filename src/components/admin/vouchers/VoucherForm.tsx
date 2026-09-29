"use client";

import { FormEvent, ReactNode, useState } from "react";
import { VoucherDiscountType, VoucherType } from "@prisma/client";
import { useRouter } from "next/navigation";

type VoucherFormValues = {
  code: string;
  name: string;
  description: string;
  type: VoucherType;
  claimable: boolean;
  claimLimit: string;
  discountType: VoucherDiscountType;
  discountValue: string;
  minimumPurchase: string;
  maximumDiscount: string;
  maximumShippingDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
};

type VoucherFormProps = {
  initialData?: {
    id?: string;
    code: string;
    name: string;
    description?: string | null;
    type?: VoucherType;
    claimable?: boolean;
    claimLimit?: number | null;
    discountType: VoucherDiscountType;
    discountValue: number | string;
    minimumPurchase?: number | null;
    maximumDiscount?: number | null;
    maximumShippingDiscount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    startAt?: Date | string | null;
    endAt?: Date | string | null;
    isActive: boolean;
  };
  mode?: "create" | "edit";
};

function formatDateTimeLocal(value?: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getInitialValues(initialData?: VoucherFormProps["initialData"]): VoucherFormValues {
  const stringValue = (value?: number | string | null) =>
    value === null || value === undefined ? "" : String(value);

  return {
    code: initialData?.code ?? "",
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    type: initialData?.type ?? VoucherType.DISCOUNT,
    claimable: initialData?.claimable ?? false,
    claimLimit: stringValue(initialData?.claimLimit),
    discountType: initialData?.discountType ?? VoucherDiscountType.FIXED_AMOUNT,
    discountValue: stringValue(initialData?.discountValue),
    minimumPurchase: stringValue(initialData?.minimumPurchase),
    maximumDiscount: stringValue(initialData?.maximumDiscount),
    maximumShippingDiscount: stringValue(initialData?.maximumShippingDiscount),
    usageLimit: stringValue(initialData?.usageLimit),
    perUserLimit: stringValue(initialData?.perUserLimit),
    startAt: formatDateTimeLocal(initialData?.startAt),
    endAt: formatDateTimeLocal(initialData?.endAt),
    isActive: initialData?.isActive ?? true,
  };
}

export function VoucherForm({ initialData, mode = "create" }: VoucherFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<VoucherFormValues>(getInitialValues(initialData));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFreeShipping = form.type === VoucherType.FREE_SHIPPING;
  const isPercentage = form.discountType === VoucherDiscountType.PERCENTAGE;

  function update<K extends keyof VoucherFormValues>(key: K, value: VoucherFormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function validate(): string | null {
    const code = form.code.trim();
    if (!code) return "Kode voucher wajib diisi.";
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      return "Kode voucher hanya boleh menggunakan huruf, angka, underscore, atau tanda minus.";
    }
    if (!form.name.trim()) return "Nama voucher wajib diisi.";

    if (!isFreeShipping) {
      const value = Number(form.discountValue);
      if (!Number.isFinite(value) || value <= 0) return "Nilai diskon harus lebih dari 0.";
      if (isPercentage && value > 100) return "Diskon persentase tidak boleh lebih dari 100%.";
      if (form.maximumDiscount && Number(form.maximumDiscount) <= 0) {
        return "Maximum diskon harus lebih dari 0.";
      }
    }

    if (isFreeShipping && form.maximumShippingDiscount && Number(form.maximumShippingDiscount) <= 0) {
      return "Maximum subsidi ongkir harus lebih dari 0.";
    }

    for (const [label, value] of [
      ["Minimum pembelian", form.minimumPurchase],
      ["Batas penggunaan", form.usageLimit],
      ["Batas penggunaan per user", form.perUserLimit],
      ["Batas klaim", form.claimLimit],
    ] as const) {
      if (!value) continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) return `${label} tidak valid.`;
      if (["Batas penggunaan", "Batas penggunaan per user", "Batas klaim"].includes(label) && !Number.isInteger(n)) {
        return `${label} harus berupa angka bulat.`;
      }
    }

    if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      return "Tanggal berakhir harus setelah tanggal mulai.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        type: form.type,
        claimable: form.claimable,
        claimLimit: form.claimLimit ? Number(form.claimLimit) : null,
        discountType: form.discountType,
        discountValue: isFreeShipping ? 0 : Number(form.discountValue),
        minimumPurchase: form.minimumPurchase ? Number(form.minimumPurchase) : null,
        maximumDiscount:
          !isFreeShipping && isPercentage && form.maximumDiscount
            ? Number(form.maximumDiscount)
            : null,
        maximumShippingDiscount:
          isFreeShipping && form.maximumShippingDiscount
            ? Number(form.maximumShippingDiscount)
            : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        isActive: form.isActive,
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/vouchers"
          : `/api/admin/vouchers/${initialData?.id}`;

      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "Gagal menyimpan voucher.");
      }

      router.push("/admin/vouchers");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan saat menyimpan voucher.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Informasi Voucher</h2>
        <p className="mt-1 text-sm text-gray-500">Atur tipe voucher dan apakah customer harus melakukan claim.</p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Kode Voucher">
            <input value={form.code} onChange={(e) => update("code", e.target.value.toUpperCase())}
              disabled={isSubmitting} placeholder="HEMAT10" className={inputClass} />
          </Field>
          <Field label="Nama Voucher">
            <input value={form.name} onChange={(e) => update("name", e.target.value)}
              disabled={isSubmitting} placeholder="Diskon Belanja" className={inputClass} />
          </Field>
        </div>

        <div className="mt-5">
          <label className={labelClass}>Deskripsi</label>
          <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)}
            disabled={isSubmitting} className={`${inputClass} resize-none`} />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Tipe Voucher">
            <select value={form.type} onChange={(e) => update("type", e.target.value as VoucherType)}
              disabled={isSubmitting} className={inputClass}>
              <option value={VoucherType.DISCOUNT}>Diskon Belanja</option>
              <option value={VoucherType.FREE_SHIPPING}>Gratis Ongkir</option>
            </select>
          </Field>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <input type="checkbox" checked={form.claimable}
                onChange={(e) => update("claimable", e.target.checked)}
                disabled={isSubmitting} className="h-4 w-4 rounded" />
              Bisa diklaim customer
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Jika aktif, voucher harus masuk ke Voucher Saya sebelum checkout.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {isFreeShipping ? "Pengaturan Gratis Ongkir" : "Pengaturan Diskon"}
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {!isFreeShipping && (
            <>
              <Field label="Tipe Diskon">
                <select value={form.discountType} onChange={(e) => update("discountType", e.target.value as VoucherDiscountType)}
                  disabled={isSubmitting} className={inputClass}>
                  <option value={VoucherDiscountType.FIXED_AMOUNT}>Nominal</option>
                  <option value={VoucherDiscountType.PERCENTAGE}>Persentase</option>
                </select>
              </Field>
              <Field label="Nilai Diskon">
                <input type="number" min="1" max={isPercentage ? 100 : undefined}
                  value={form.discountValue} onChange={(e) => update("discountValue", e.target.value)}
                  disabled={isSubmitting} className={inputClass} />
              </Field>
            </>
          )}

          {isFreeShipping && (
            <Field label="Maximum Subsidi Ongkir">
              <input type="number" min="1" value={form.maximumShippingDiscount}
                onChange={(e) => update("maximumShippingDiscount", e.target.value)}
                disabled={isSubmitting} placeholder="Kosongkan = seluruh ongkir" className={inputClass} />
            </Field>
          )}

          <Field label="Minimum Pembelian">
            <input type="number" min="0" value={form.minimumPurchase}
              onChange={(e) => update("minimumPurchase", e.target.value)}
              disabled={isSubmitting} placeholder="Opsional" className={inputClass} />
          </Field>

          {!isFreeShipping && isPercentage && (
            <Field label="Maximum Diskon">
              <input type="number" min="1" value={form.maximumDiscount}
                onChange={(e) => update("maximumDiscount", e.target.value)}
                disabled={isSubmitting} placeholder="Opsional" className={inputClass} />
            </Field>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Kuota & Periode</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Kuota Claim">
            <input type="number" min="1" value={form.claimLimit}
              onChange={(e) => update("claimLimit", e.target.value)}
              disabled={isSubmitting} placeholder="Kosongkan = unlimited" className={inputClass} />
          </Field>
          <Field label="Kuota Penggunaan">
            <input type="number" min="1" value={form.usageLimit}
              onChange={(e) => update("usageLimit", e.target.value)}
              disabled={isSubmitting} placeholder="Kosongkan = unlimited" className={inputClass} />
          </Field>
          <Field label="Batas Penggunaan per User">
            <input type="number" min="1" value={form.perUserLimit}
              onChange={(e) => update("perUserLimit", e.target.value)}
              disabled={isSubmitting} placeholder="Kosongkan = unlimited" className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={form.isActive ? "true" : "false"}
              onChange={(e) => update("isActive", e.target.value === "true")}
              disabled={isSubmitting} className={inputClass}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </Field>
          <Field label="Mulai">
            <input type="datetime-local" value={form.startAt}
              onChange={(e) => update("startAt", e.target.value)}
              disabled={isSubmitting} className={inputClass} />
          </Field>
          <Field label="Berakhir">
            <input type="datetime-local" value={form.endAt}
              onChange={(e) => update("endAt", e.target.value)}
              disabled={isSubmitting} className={inputClass} />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting}
          className="rounded-xl bg-[var(--pisjo-ocean)] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
          {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan Voucher" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-900";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
