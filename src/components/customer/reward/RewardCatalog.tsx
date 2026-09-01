import {
  Gift,
} from "lucide-react";

import RewardCard from "./RewardCard";

export type RewardCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  requiredPoints: number;
  stock: number;
  isActive: boolean;
  sortOrder: number;
};

type RewardCatalogProps = {
  rewards: RewardCatalogItem[];
  rewardPoints: number;
};

export default function RewardCatalog({
  rewards,
  rewardPoints,
}: RewardCatalogProps) {
  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (rewards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Gift className="h-6 w-6 text-slate-400" />
        </div>

        <h3 className="mt-5 text-base font-bold text-slate-900">
          Belum ada hadiah tersedia
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Saat ini belum ada hadiah yang dapat ditukarkan
          menggunakan Reward Point.
        </p>

      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          rewardPoints={rewardPoints}
        />
      ))}

    </div>
  );
}
