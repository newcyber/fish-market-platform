import {
  Fish,
  Package,
  ShieldCheck,
  Snowflake,
  Thermometer,
} from "lucide-react";

type ProductCondition = "FRESH" | "CHILLED" | "FROZEN";

interface ProductTrustCardProps {
  condition: ProductCondition;
  storageInstructions?: string | null;
  weightGrams?: number | null;
  isPreOrder?: boolean;
}

const conditionMeta: Record<
  ProductCondition,
  {
    label: string;
    description: string;
    icon: typeof Fish;
  }
> = {
  FRESH: {
    label: "Segar",
    description: "Kondisi utama produk: segar.",
    icon: Fish,
  },
  CHILLED: {
    label: "Chilled",
    description: "Produk disimpan dalam kondisi dingin.",
    icon: Thermometer,
  },
  FROZEN: {
    label: "Frozen",
    description: "Produk disimpan dalam kondisi beku.",
    icon: Snowflake,
  },
};

export default function ProductTrustCard({
  condition,
  storageInstructions,
  weightGrams,
  isPreOrder = false,
}: ProductTrustCardProps) {
  const meta = conditionMeta[condition];
  const ConditionIcon = meta.icon;

  const storage = storageInstructions?.trim();

  return (
    <section
      aria-label="Informasi kesegaran produk"
      className="mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/80 via-white to-cyan-50/60"
    >
      <div className="flex gap-3 px-4 py-4 sm:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
          <ConditionIcon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Informasi Kesegaran
            </h2>

            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {meta.label}
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="grid border-t border-emerald-100/80 sm:grid-cols-2">
        {weightGrams && weightGrams > 0 ? (
          <div className="flex gap-3 px-4 py-3.5 sm:px-5">
            <Package
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs text-slate-500">Berat produk</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {weightGrams >= 1000
                  ? `${Number((weightGrams / 1000).toFixed(2))} kg`
                  : `${weightGrams} gram`}
              </p>
            </div>
          </div>
        ) : null}

        {isPreOrder ? (
          <div className="flex gap-3 border-t border-emerald-100/80 px-4 py-3.5 sm:border-l sm:border-t-0 sm:px-5">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs text-slate-500">Ketersediaan</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                Pre-Order
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {storage ? (
        <div className="border-t border-emerald-100/80 px-4 py-3.5 sm:px-5">
          <p className="text-xs font-medium text-slate-500">
            Cara penyimpanan
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {storage}
          </p>
        </div>
      ) : null}
    </section>
  );
}
