import {
  RewardCatalogRepository,
} from "@/repositories/reward/reward-catalog.repository";

/**
 * ============================================================
 * REWARD CATALOG SERVICE
 * ============================================================
 *
 * Service untuk customer yang membutuhkan data katalog reward.
 *
 * Tanggung jawab:
 *
 * - mengambil reward yang tersedia untuk customer
 * - memastikan customer hanya menerima reward yang:
 *
 *   isActive = true
 *   stock > 0
 *
 * Business logic administrasi reward TIDAK berada di service ini.
 *
 * Admin menggunakan:
 *
 * AdminRewardCatalogService
 *
 * Claim menggunakan:
 *
 * claimReward()
 * dari RewardClaimService.
 *
 * ============================================================
 */

/**
 * ============================================================
 * REWARD CATALOG SERVICE
 * ============================================================
 */

export class RewardCatalogService {
  /**
   * ==========================================================
   * GET AVAILABLE REWARDS FOR CUSTOMER
   * ==========================================================
   *
   * Mengambil reward yang saat ini dapat diklaim customer.
   *
   * Filter dilakukan di repository:
   *
   * - isActive = true
   * - stock > 0
   *
   * Sorting juga dilakukan oleh repository:
   *
   * 1. sortOrder ASC
   * 2. requiredPoints ASC
   * 3. createdAt ASC
   *
   * Customer TIDAK mendapatkan:
   *
   * - reward inactive
   * - reward dengan stock 0
   *
   * ==========================================================
   */

  static async getAvailableRewards() {
    return RewardCatalogRepository.findActive();
  }

  /**
   * ==========================================================
   * GET AVAILABLE REWARD BY ID
   * ==========================================================
   *
   * Mengambil satu reward yang masih tersedia
   * untuk customer.
   *
   * Reward harus:
   *
   * - ditemukan
   * - isActive = true
   * - stock > 0
   *
   * Reward inactive atau stock 0 tidak boleh
   * ditampilkan pada halaman customer.
   *
   * ==========================================================
   */

  static async getAvailableRewardById(
    id: string
  ) {
    const normalizedId =
      String(id ?? "").trim();

    if (!normalizedId) {
      return null;
    }

    const reward =
      await RewardCatalogRepository.findById(
        normalizedId
      );

    if (
      !reward ||
      !reward.isActive ||
      reward.stock <= 0
    ) {
      return null;
    }

    return reward;
  }
}
