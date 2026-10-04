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
const DEFAULT_SIGNUP_BONUS_POINTS = 100;

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
        signupBonusPoints: DEFAULT_SIGNUP_BONUS_POINTS,
      },
    });
  }

  /**
   * ==========================================================
   * GET OR CREATE — TRANSACTION CLIENT
   * ==========================================================
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
        signupBonusPoints: DEFAULT_SIGNUP_BONUS_POINTS,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE POINTS PER KG
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
        signupBonusPoints: DEFAULT_SIGNUP_BONUS_POINTS,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE SIGNUP BONUS
   * ==========================================================
   */

  async updateSignupBonusPoints(
    signupBonusPoints: number,
  ) {
    return prisma.rewardPointSettings.upsert({
      where: {
        key: DEFAULT_KEY,
      },

      update: {
        signupBonusPoints,
      },

      create: {
        key: DEFAULT_KEY,
        pointsPerKg: DEFAULT_POINTS_PER_KG,
        signupBonusPoints,
      },
    });
  }
  async updateSettings(
    pointsPerKg: number,
    signupBonusPoints: number,
  ) {
    return prisma.rewardPointSettings.upsert({
      where: {
        key: DEFAULT_KEY,
      },

      update: {
        pointsPerKg,
        signupBonusPoints,
      },

      create: {
        key: DEFAULT_KEY,
        pointsPerKg,
        signupBonusPoints,
      },
    });
  }


}

const rewardPointSettingsRepository =
  new RewardPointSettingsRepository();

export default rewardPointSettingsRepository;
