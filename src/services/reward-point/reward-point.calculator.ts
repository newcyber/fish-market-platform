/**
 * ============================================================
 * REWARD POINT CALCULATOR
 * ============================================================
 *
 * Aturan:
 *
 * 1 kg = 10 poin
 *
 * Contoh:
 * 250g  = 2 poin
 * 500g  = 5 poin
 * 700g  = 7 poin
 * 750g  = 7 poin
 * 800g  = 8 poin
 * 1kg   = 10 poin
 * 1.5kg = 15 poin
 * 2kg   = 20 poin
 *
 * Pembulatan menggunakan Math.floor().
 */

const REWARD_POINT_PER_KG = 10;

export function calculateRewardPointsFromGrams(
  grams: number
): number {
  if (
    !Number.isFinite(grams) ||
    grams <= 0
  ) {
    return 0;
  }

  return Math.floor(
    (grams / 1000) *
      REWARD_POINT_PER_KG
  );
}