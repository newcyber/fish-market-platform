import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * REWARD POINT SETTINGS REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk konfigurasi Reward Point.
 *
 * Konfigurasi bersifat singleton:
 *
 * key = "default"
 *
 * ============================================================
 */

const DEFAULT_KEY = "default";

const DEFAULT_POINTS_PER_KG = 10;

/**
 * ============================================================
 * REPOSITORY
 * ============================================================
 */

class RewardPointSettingsRepository {
  /**
   * ==========================================================
   * GET OR CREATE
   * ==========================================================
   *
   * Digunakan di luar database transaction.
   */

  async getOrCreate() {
    return prisma.rewardPointSettings.upsert({
      where: {
        key: DEFAULT_KEY,
      },

      update: {},

      create: {
        key: DEFAULT_KEY,
        pointsPerKg: DEFAULT_POINTS_PER_KG,
      },
    });
  }

  /**
   * ==========================================================
   * GET OR CREATE — TRANSACTION CLIENT
   * ==========================================================
   *
   * Digunakan ketika reward calculation berjalan
   * di dalam transaction yang sama dengan order.
   */

  async getOrCreateTx(
    tx: Prisma.TransactionClient,
  ) {
    return tx.rewardPointSettings.upsert({
      where: {
        key: DEFAULT_KEY,
      },

      update: {},

      create: {
        key: DEFAULT_KEY,
        pointsPerKg: DEFAULT_POINTS_PER_KG,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   */

  async updatePointsPerKg(
    pointsPerKg: number,
  ) {
    return prisma.rewardPointSettings.upsert({
      where: {
        key: DEFAULT_KEY,
      },

      update: {
        pointsPerKg,
      },

      create: {
        key: DEFAULT_KEY,
        pointsPerKg,
      },
    });
  }
}

const rewardPointSettingsRepository =
  new RewardPointSettingsRepository();

export default rewardPointSettingsRepository;
