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
  async getSettings() {
    return rewardPointSettingsRepository.getOrCreate();
  }

  async updateSettings(
    pointsPerKg: number,
    signupBonusPoints?: number,
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

    if (
      signupBonusPoints !== undefined &&
      (
        !Number.isInteger(signupBonusPoints) ||
        signupBonusPoints < 0
      )
    ) {
      throw new Error(
        "Bonus pendaftaran harus berupa bilangan bulat 0 atau lebih.",
      );
    }

    if (
      signupBonusPoints !== undefined &&
      signupBonusPoints > 10_000
    ) {
      throw new Error(
        "Bonus pendaftaran tidak boleh lebih dari 10000 poin.",
      );
    }

    if (signupBonusPoints === undefined) {
      return rewardPointSettingsRepository.updatePointsPerKg(
        pointsPerKg,
      );
    }

    return rewardPointSettingsRepository.updateSettings(
      pointsPerKg,
      signupBonusPoints,
    );
  }
}

const rewardPointSettingsService =
  new RewardPointSettingsService();

export default rewardPointSettingsService;
