/**
 * ============================================================
 * FLASH SALE LIFECYCLE
 * ============================================================
 *
 * Status operasional Flash Sale ditentukan oleh:
 * - lifecycle terminal (DRAFT/CANCELLED)
 * - startAt
 * - endAt
 *
 * SCHEDULED dan ACTIVE tidak lagi bergantung pada perubahan
 * manual status untuk menentukan apakah campaign sedang
 * memasuki periode penjualan.
 *
 * Database status tetap dipertahankan untuk compatibility dan
 * audit trail. Helper ini menentukan effective status pada
 * saat runtime.
 * ============================================================
 */

import { FlashSaleStatus } from "@prisma/client";

export function getEffectiveFlashSaleStatus(
  status: FlashSaleStatus,
  startAt: Date,
  endAt: Date,
  now = new Date()
): FlashSaleStatus {
  if (
    status === FlashSaleStatus.DRAFT ||
    status === FlashSaleStatus.CANCELLED
  ) {
    return status;
  }

  if (now.getTime() < startAt.getTime()) {
    return FlashSaleStatus.SCHEDULED;
  }

  if (now.getTime() >= endAt.getTime()) {
    return FlashSaleStatus.ENDED;
  }

  return FlashSaleStatus.ACTIVE;
}

export function isFlashSaleRuntimeActive(
  status: FlashSaleStatus,
  startAt: Date,
  endAt: Date,
  now = new Date()
) {
  const effectiveStatus =
    getEffectiveFlashSaleStatus(
      status,
      startAt,
      endAt,
      now
    );

  return (
    effectiveStatus ===
    FlashSaleStatus.ACTIVE
  );
}
