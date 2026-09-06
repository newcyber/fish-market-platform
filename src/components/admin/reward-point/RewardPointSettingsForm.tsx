"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Calculator,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";

type RewardPointSettingsFormProps = {
  initialPointsPerKg: number;
};

export default function RewardPointSettingsForm({
  initialPointsPerKg,
}: RewardPointSettingsFormProps) {
  const [pointsPerKg, setPointsPerKg] =
    useState(String(initialPointsPerKg));

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const preview = useMemo(() => {
    const points = Number(pointsPerKg);

    if (
      !Number.isInteger(points) ||
      points <= 0
    ) {
      return null;
    }

    return [
      { grams: 250, points: Math.floor((250 / 1000) * points) },
      { grams: 500, points: Math.floor((500 / 1000) * points) },
      { grams: 700, points: Math.floor((700 / 1000) * points) },
      { grams: 750, points: Math.floor((750 / 1000) * points) },
      { grams: 1000, points },
      { grams: 1500, points: Math.floor((1500 / 1000) * points) },
      { grams: 2000, points: Math.floor((2000 / 1000) * points) },
    ];
  }, [pointsPerKg]);

  function validateForm(): string | null {
    const value = Number(pointsPerKg);

    if (!Number.isInteger(value)) {
      return "Point per kilogram harus berupa bilangan bulat.";
    }

    if (value <= 0) {
      return "Point per kilogram harus lebih besar dari 0.";
    }

    if (value > 1000) {
      return "Point per kilogram tidak boleh lebih dari 1000.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/admin/reward-points",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pointsPerKg: Number(pointsPerKg),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ??
            "Gagal menyimpan pengaturan reward point.",
        );
      }

      setPointsPerKg(
        String(result.data.pointsPerKg),
      );

      setSuccess(
        "Pengaturan reward point berhasil disimpan.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan saat menyimpan pengaturan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calculator className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Pengaturan Reward Point
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tentukan jumlah poin yang diperoleh customer
              untuk setiap 1 kilogram pembelian.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="pointsPerKg"
              className="block text-sm font-medium text-slate-700"
            >
              Point per Kilogram
            </label>

            <div className="mt-2 flex items-center gap-3">
              <input
                id="pointsPerKg"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={pointsPerKg}
                onChange={(event) =>
                  setPointsPerKg(event.target.value)
                }
                disabled={isSubmitting}
                className="h-11 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              <span className="text-sm text-slate-500">
                poin / kg
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Contoh: jika diisi 10, maka 1 kg = 10 poin.
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSubmitting
                ? "Menyimpan..."
                : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Contoh Perhitungan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preview berdasarkan nilai Point per Kilogram saat ini.
          </p>
        </div>

        {preview ? (
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Berat</span>
              <span className="text-right">
                Reward Point
              </span>
            </div>

            {preview.map((item) => (
              <div
                key={item.grams}
                className="grid grid-cols-2 border-t border-slate-200 px-4 py-3 text-sm"
              >
                <span className="text-slate-700">
                  {item.grams >= 1000
                    ? `${item.grams / 1000} kg`
                    : `${item.grams} gram`}
                </span>

                <span className="text-right font-semibold text-slate-900">
                  {item.points} poin
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Masukkan Point per Kilogram yang valid untuk
            melihat preview.
          </div>
        )}

        <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          <strong>Catatan:</strong> pecahan kilogram menggunakan
          pembulatan ke bawah. Contoh 750 gram dengan 10 poin/kg
          menghasilkan 7 poin.
        </div>
      </section>
    </div>
  );
}
