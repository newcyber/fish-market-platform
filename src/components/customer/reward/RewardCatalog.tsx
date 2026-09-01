"use client";

import {
  useState,
} from "react";

import {
  Gift,
  Layers3,
} from "lucide-react";

import RewardCard from "./RewardCard";

/**
 * ============================================================
 * REWARD CATALOG ITEM
 * ============================================================
 */

export type RewardCatalogItem = {
  id: string;

  name: string;

  description: string | null;

  image: string | null;

  categoryId: string | null;

  category: {
    id: string;

    name: string;

    slug: string;

    isActive: boolean;

    sortOrder: number;
  } | null;

  requiredPoints: number;

  stock: number;

  isActive: boolean;

  sortOrder: number;
};

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

type RewardCatalogProps = {
  rewards: RewardCatalogItem[];

  rewardPoints: number;
};

/**
 * ============================================================
 * CATEGORY TYPE
 * ============================================================
 */

type RewardCategoryFilter = {
  id: string;

  name: string;

  slug: string;

  sortOrder: number;
};

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function RewardCatalog({
  rewards,
  rewardPoints,
}: RewardCatalogProps) {
  /**
   * ==========================================================
   * CATEGORY FILTER
   * ==========================================================
   *
   * Kategori dibuat dari reward yang memang tersedia.
   *
   * Category inactive tidak akan ditampilkan kepada customer.
   *
   * "Semua Hadiah" selalu tersedia.
   */

  const categories =
    rewards.reduce<
      RewardCategoryFilter[]
    >(
      (
        result,
        reward
      ) => {
        const category =
          reward.category;

        if (
          !category ||
          !category.isActive
        ) {
          return result;
        }

        const alreadyExists =
          result.some(
            (
              item
            ) =>
              item.id ===
              category.id
          );

        if (
          alreadyExists
        ) {
          return result;
        }

        result.push({
          id:
            category.id,

          name:
            category.name,

          slug:
            category.slug,

          sortOrder:
            category.sortOrder,
        });

        return result;
      },
      []
    );

  /**
   * ==========================================================
   * EMPTY STATE
   * ==========================================================
   */

  if (
    rewards.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Gift className="h-6 w-6 text-slate-400" />
        </div>

        <h3 className="mt-5 text-base font-bold text-slate-900">
          Belum ada hadiah tersedia
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Saat ini belum ada hadiah yang
          dapat ditukarkan menggunakan
          Reward Point.
        </p>
      </div>
    );
  }

  return (
    <RewardCatalogClient
      rewards={rewards}
      rewardPoints={rewardPoints}
      categories={categories}
    />
  );
}

/**
 * ============================================================
 * CLIENT FILTER + GRID
 * ============================================================
 */

function RewardCatalogClient({
  rewards,
  rewardPoints,
  categories,
}: {
  rewards: RewardCatalogItem[];

  rewardPoints: number;

  categories: RewardCategoryFilter[];
}) {
  /**
   * ----------------------------------------------------------
   * STATE
   * ----------------------------------------------------------
   */

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<string>(
      "all"
    );

  /**
   * ----------------------------------------------------------
   * FILTERED REWARDS
   * ----------------------------------------------------------
   */

  const filteredRewards =
    selectedCategory ===
    "all"
      ? rewards
      : rewards.filter(
          (
            reward
          ) =>
            reward.categoryId ===
            selectedCategory
        );

  /**
   * ----------------------------------------------------------
   * CATEGORY ORDER
   * ----------------------------------------------------------
   */

  const sortedCategories =
    [...categories].sort(
      (
        a,
        b
      ) => {
        if (
          a.sortOrder !==
          b.sortOrder
        ) {
          return (
            a.sortOrder -
            b.sortOrder
          );
        }

        return a.name.localeCompare(
          b.name,
          "id"
        );
      }
    );

  /**
   * ----------------------------------------------------------
   * RESULT COUNT
   * ----------------------------------------------------------
   */

  const resultCount =
    filteredRewards.length;

  return (
    <div className="space-y-5">
      {/* ====================================================
          CATEGORY FILTER
      ==================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50">
            <Layers3 className="h-4 w-4 text-cyan-600" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Kategori Hadiah
            </p>

            <p className="text-sm font-bold text-slate-900">
              Pilih kategori
            </p>
          </div>
        </div>

        {/* ==================================================
            FILTER BUTTONS

            overflow-x-auto sengaja digunakan supaya pada
            mobile kategori tidak pecah ke banyak baris.
        ================================================== */}

        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {/* SEMUA */}

          <button
            type="button"
            onClick={() =>
              setSelectedCategory(
                "all"
              )
            }
            className={
              selectedCategory ===
              "all"
                ? "shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                : "shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
            }
          >
            Semua Hadiah
          </button>

          {/* CATEGORIES */}

          {sortedCategories.map(
            (
              category
            ) => (
              <button
                key={
                  category.id
                }
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    category.id
                  )
                }
                className={
                  selectedCategory ===
                  category.id
                    ? "shrink-0 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                    : "shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                }
              >
                {
                  category.name
                }
              </button>
            )
          )}
        </div>
      </div>

      {/* ====================================================
          RESULT HEADER
      ==================================================== */}

      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">
            Hadiah
          </p>

          <h3 className="mt-0.5 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            {selectedCategory ===
            "all"
              ? "Semua Hadiah"
              : sortedCategories.find(
                  (
                    category
                  ) =>
                    category.id ===
                    selectedCategory
                )?.name ??
                "Hadiah"}
          </h3>
        </div>

        <div className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
          {resultCount.toLocaleString(
            "id-ID"
          )}{" "}
          hadiah
        </div>
      </div>

      {/* ====================================================
          FILTER EMPTY STATE
      ==================================================== */}

      {filteredRewards.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Gift className="h-5 w-5 text-slate-400" />
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-900">
            Belum ada hadiah di kategori ini
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Silakan pilih kategori
            lainnya.
          </p>

          <button
            type="button"
            onClick={() =>
              setSelectedCategory(
                "all"
              )
            }
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Lihat Semua Hadiah
          </button>
        </div>
      ) : (
        /* ==================================================
           REWARD GRID

           Mobile : 3 card
           Tablet : 4 card
           Desktop: 5 card
        ================================================== */

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:gap-5 xl:grid-cols-5">
          {filteredRewards.map(
            (
              reward
            ) => (
              <RewardCard
                key={
                  reward.id
                }
                reward={
                  reward
                }
                rewardPoints={
                  rewardPoints
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
