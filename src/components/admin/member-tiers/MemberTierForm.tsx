"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type MemberTierFormData = {
  id?: string;
  name: string;
  slug: string;
  minSpend: number;
  bonusPointsPercent: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  exclusivePricing: boolean;
  isActive: boolean;
  sortOrder: number;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MemberTierForm({
  mode = "create",
  initialData,
}: {
  mode?: "create" | "edit";
  initialData?: MemberTierFormData;
}) {
  const router = useRouter();

  const [form, setForm] = useState<MemberTierFormData>(
    initialData ?? {
      name: "",
      slug: "",
      minSpend: 0,
      bonusPointsPercent: 0,
      freeShipping: false,
      prioritySupport: false,
      exclusivePricing: false,
      isActive: true,
      sortOrder: 0,
    },
  );

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialData?.slug),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof MemberTierFormData>(
    key: K,
    value: MemberTierFormData[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: slugManuallyEdited ? previous.slug : slugify(value),
    }));
  }

  function validate() {
    if (!form.name.trim()) {
      return "Nama tier wajib diisi.";
    }

    if (!form.slug.trim()) {
      return "Slug tier wajib diisi.";
    }

    if (!Number.isFinite(form.minSpend) || form.minSpend < 0) {
      return "Minimum spend harus 0 atau lebih.";
    }

    if (
      !Number.isFinite(form.bonusPointsPercent) ||
      form.bonusPointsPercent < 0 ||
      form.bonusPointsPercent > 1000
    ) {
      return "Bonus point harus berada di antara 0% dan 1000%.";
    }

    if (!Number.isInteger(form.sortOrder) || form.sortOrder < 0) {
      return "Urutan harus berupa bilangan bulat 0 atau lebih.";
    }

    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const url =
        mode === "create"
          ? "/api/admin/member-tiers"
          : `/api/admin/member-tiers/${form.id}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? "Gagal menyimpan member tier.");
      }

      router.push("/admin/member-tiers");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan member tier.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Informasi Tier</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tentukan nama dan ambang transaksi untuk membership PISJO.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nama Tier
            </label>
            <input
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              disabled={saving}
              placeholder="Contoh: PISJO Gold"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Slug
            </label>
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugManuallyEdited(true);
                update("slug", slugify(event.target.value));
              }}
              disabled={saving}
              placeholder="gold"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Minimum Spend
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.minSpend}
              onChange={(event) =>
                update("minSpend", Number(event.target.value))
              }
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-2 text-xs text-gray-500">
              Contoh: {rupiah(form.minSpend || 0)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bonus Point (%)
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              step="1"
              value={form.bonusPointsPercent}
              onChange={(event) =>
                update("bonusPointsPercent", Number(event.target.value))
              }
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
            <p className="mt-2 text-xs text-gray-500">
              Contoh 25 berarti bonus +25% point pada transaksi berikutnya.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Urutan
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.sortOrder}
              onChange={(event) =>
                update("sortOrder", Number(event.target.value))
              }
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Benefit Member</h2>
        <p className="mt-1 text-sm text-gray-500">
          Benefit ini menjadi konfigurasi membership customer.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            ["freeShipping", "Benefit gratis ongkir"],
            ["prioritySupport", "Priority support"],
            ["exclusivePricing", "Harga khusus member"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4"
            >
              <input
                type="checkbox"
                checked={form[key as keyof MemberTierFormData] as boolean}
                onChange={(event) =>
                  update(
                    key as
                      "freeShipping" | "prioritySupport" | "exclusivePricing",
                    event.target.checked,
                  )
                }
                disabled={saving}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-800">{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Status</h2>

        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-800">Tier aktif</span>
        </label>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/member-tiers")}
          disabled={saving}
          className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Menyimpan..."
            : mode === "create"
              ? "Simpan Tier"
              : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
