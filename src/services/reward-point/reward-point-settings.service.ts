import rewardPointSettingsRepository from "@/repositories/reward-point/reward-point-settings.repository";

/**
 * ============================================================
 * REWARD POINT SETTINGS SERVICE
 * ============================================================
 *
 * Menangani business logic konfigurasi Reward Point.
 *
 * ============================================================
 */

class RewardPointSettingsService {
  /**
   * ==========================================================
   * GET SETTINGS
   * ==========================================================
   */

  async getSettings() {
    return rewardPointSettingsRepository.getOrCreate();
  }

  /**
   * ==========================================================
   * UPDATE SETTINGS
   * ==========================================================
   */

  async updateSettings(
    pointsPerKg: number,
  ) {
    if (
      !Number.isInteger(pointsPerKg) ||
      pointsPerKg <= 0
    ) {
      throw new Error(
        "Point per kilogram harus berupa bilangan bulat lebih besar dari 0.",
      );
    }

    if (pointsPerKg > 1000) {
      throw new Error(
        "Point per kilogram tidak boleh lebih dari 1000.",
      );
    }

    return rewardPointSettingsRepository.updatePointsPerKg(
      pointsPerKg,
    );
  }
}

const rewardPointSettingsService =
  new RewardPointSettingsService();

export default rewardPointSettingsService;
