import PromotionService from "@/services/promotion/promotion.service";

/**
 * ============================================================
 * PROMOTION LIFECYCLE WORKER
 * ============================================================
 *
 * Worker ini dijalankan secara periodik oleh system cron.
 *
 * Tanggung jawab:
 *
 * SCHEDULED
 *   startAt <= now < endAt
 *   ↓
 * ACTIVE
 *
 * ACTIVE
 *   endAt <= now
 *   ↓
 * ENDED
 *
 * Worker TIDAK mengubah business rule.
 *
 * Semua transition tetap melalui:
 *
 * PromotionService.activate()
 * PromotionService.end()
 * ============================================================
 */

async function main() {
  const now =
    new Date();

  console.log(
    "[PROMOTION_LIFECYCLE] Worker started.",
    {
      now:
        now.toISOString(),
    }
  );

  try {
    const result =
      await PromotionService.syncLifecycle(
        now
      );

    console.log(
      "[PROMOTION_LIFECYCLE] Worker finished.",
      result
    );
  } catch (error) {
    console.error(
      "[PROMOTION_LIFECYCLE] Worker failed.",
      error
    );

    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "[PROMOTION_LIFECYCLE] Unhandled worker error.",
      error
    );

    process.exitCode = 1;
  });
