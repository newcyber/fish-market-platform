/**
 * ============================================================
 * REWARD POINT CALCULATOR
 * ============================================================
 *
 * Aturan:
 *
 * Point per KG ditentukan oleh RewardPointSettings.
 *
 * Pembulatan menggunakan Math.floor().
 *
 * Contoh jika pointsPerKg = 10:
 *
 * 250g  = 2 poin
 * 500g  = 5 poin
 * 700g  = 7 poin
 * 750g  = 7 poin
 * 800g  = 8 poin
 * 1kg   = 10 poin
 * 1.5kg = 15 poin
 * 2kg   = 20 poin
 *
 * Contoh jika pointsPerKg = 15:
 *
 * 250g  = 3 poin
 * 500g  = 7 poin
 * 700g  = 10 poin
 * 750g  = 11 poin
 * 1kg   = 15 poin
 * 1.5kg = 22 poin
 * 2kg   = 30 poin
 */

export function calculateRewardPointsFromGrams(
  grams: number,
  pointsPerKg: number,
): number {
  if (
    !Number.isFinite(grams) ||
    grams <= 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(pointsPerKg) ||
    pointsPerKg <= 0
  ) {
    return 0;
  }

  return Math.floor(
    (grams / 1000) *
      pointsPerKg,
  );
}
