import {
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_PREFIX = "test-promotion-activation-concurrency";

function assert(
  condition: unknown,
  message: string
) {
  if (!condition) {
    throw new Error(message);
  }
}

function section(
  number: number,
  title: string
) {
  console.log("");
  console.log(
    `============================================================`
  );
  console.log(
    `TEST ${number} - ${title}`
  );
  console.log(
    `============================================================`
  );
}

async function main() {
  let skuId: string | null = null;
  let promotionAId: string | null = null;
  let promotionBId: string | null = null;

  try {
    section(
      1,
      "PREPARE SKU"
    );

const sku =
  await prisma.productSku.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      sku: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

assert(
  sku !== null,
  "FAIL: Tidak ada ProductSku aktif untuk concurrency test."
);

if (!sku) {
  throw new Error(
    "FAIL: Tidak ada ProductSku aktif untuk concurrency test."
  );
}

skuId = sku.id;

console.log({
  skuId: sku.id,
  sku: sku.sku,
  isActive: sku.isActive,
});

console.log(
  "PASS: SKU aktif tersedia."
);

    section(
      2,
      "CREATE OVERLAPPING PROMOTIONS"
    );

    const now =
      new Date();

    const startAt =
      new Date(
        now.getTime() -
          60 * 1000
      );

    const endAt =
      new Date(
        now.getTime() +
          60 * 60 * 1000
      );

    const suffix =
      Date.now();

    const promotionA =
      await prisma.promotion.create({
        data: {
          name:
            `${TEST_PREFIX} A ${suffix}`,

          slug:
            `${TEST_PREFIX}-a-${suffix}`,

          status:
            PromotionStatus.SCHEDULED,

          startAt,
          endAt,

          type:
            PromotionType.PRICE_DISCOUNT,

          discountType:
            PromotionDiscountType.FIXED_AMOUNT,

          discountValue: 1000,

          items: {
            create: {
              skuId,
            },
          },
        },

        include: {
          items: true,
        },
      });

    promotionAId =
      promotionA.id;

    const promotionB =
      await prisma.promotion.create({
        data: {
          name:
            `${TEST_PREFIX} B ${suffix}`,

          slug:
            `${TEST_PREFIX}-b-${suffix}`,

          status:
            PromotionStatus.SCHEDULED,

          startAt,
          endAt,

          type:
            PromotionType.PRICE_DISCOUNT,

          discountType:
            PromotionDiscountType.FIXED_AMOUNT,

          discountValue: 2000,

          items: {
            create: {
              skuId,
            },
          },
        },

        include: {
          items: true,
        },
      });

    promotionBId =
      promotionB.id;

    console.log({
      promotionAId,
      promotionBId,
      skuId,
      startAt:
        startAt.toISOString(),
      endAt:
        endAt.toISOString(),
    });

    console.log(
      "PASS: Dua promotion overlapping berhasil dibuat."
    );

    section(
      3,
      "VERIFY INITIAL STATE"
    );

    const initial =
      await prisma.promotion.findMany({
        where: {
          id: {
            in: [
              promotionAId,
              promotionBId,
            ],
          },
        },
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
        },
        orderBy: {
          id: "asc",
        },
      });

    assert(
      initial.length === 2,
      `FAIL: Expected 2 promotion, ditemukan ${initial.length}.`
    );

    assert(
      initial.every(
        (promotion) =>
          promotion.status ===
          PromotionStatus.SCHEDULED
      ),
      "FAIL: Kedua promotion harus SCHEDULED sebelum concurrency test."
    );

    console.log(
      "PASS: Kedua promotion berada pada state SCHEDULED."
    );

    section(
      4,
      "CONCURRENT ACTIVATE"
    );

    console.log(
      "Menjalankan PromotionService.activate() secara concurrent..."
    );

    const results =
      await Promise.allSettled([
        PromotionService.activate(
          promotionAId
        ),

        PromotionService.activate(
          promotionBId
        ),
      ]);

    const fulfilled =
  results.filter(
    (result) =>
      result.status ===
      "fulfilled"
  );

const rejected =
  results.filter(
    (result) =>
      result.status ===
      "rejected"
  );

console.log({
  fulfilled:
    fulfilled.length,

  rejected:
    rejected.length,
});

for (
  const [index, result]
  of results.entries()
) {
  if (
    result.status ===
    "fulfilled"
  ) {
    console.log(
      `RESULT ${index + 1}: SUCCESS`,
      {
        promotionId:
          index === 0
            ? promotionAId
            : promotionBId,
      }
    );
  } else {
    console.log(
      `RESULT ${index + 1}: REJECTED`,
      {
        promotionId:
          index === 0
            ? promotionAId
            : promotionBId,

        error:
          result.reason instanceof
          Error
            ? result.reason.message
            : result.reason,
      }
    );
  }
}

/**
 * ========================================================
 * CONCURRENCY INVARIANT
 * ========================================================
 *
 * Dua promotion PRICE_DISCOUNT yang:
 *
 * - menggunakan SKU yang sama
 * - memiliki periode overlap
 *
 * tidak boleh menghasilkan dua activation
 * yang sama-sama berhasil.
 *
 * Dengan business rule saat ini, kedua activation
 * boleh ditolak karena masing-masing masih melihat
 * promotion lawannya sebagai conflict.
 */

assert(
  fulfilled.length <= 1,
  `FAIL: Tidak boleh lebih dari 1 activation berhasil. Actual ${fulfilled.length}.`
);

assert(
  rejected.length >= 1,
  `FAIL: Minimal 1 activation harus ditolak karena conflict. Actual rejected ${rejected.length}.`
);

const rejectedResults =
  results.filter(
    (
      result
    ) =>
      result.status ===
      "rejected"
  );

assert(
  rejectedResults.length >= 1,
  "FAIL: Tidak ditemukan activation yang rejected."
);

const hasConflictRejection =
  rejectedResults.some(
    (result) => {
      const message =
        result.reason instanceof
        Error
          ? result.reason.message
          : String(
              result.reason
            );

      return message.includes(
        "sudah digunakan oleh promotion PRICE_DISCOUNT"
      );
    }
  );

assert(
  hasConflictRejection,
  "FAIL: Activation yang rejected tidak disebabkan oleh PRICE_DISCOUNT conflict."
);

console.log(
  "PASS: Concurrent activation tidak menghasilkan lebih dari 1 promotion ACTIVE."
);

    section(
      5,
      "VERIFY FINAL DATABASE STATE"
    );

    const finalPromotions =
      await prisma.promotion.findMany({
        where: {
          id: {
            in: [
              promotionAId,
              promotionBId,
            ],
          },
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
        orderBy: {
          id: "asc",
        },
      });

    const activeCount =
      finalPromotions.filter(
        (promotion) =>
          promotion.status ===
          PromotionStatus.ACTIVE
      ).length;

    const scheduledCount =
      finalPromotions.filter(
        (promotion) =>
          promotion.status ===
          PromotionStatus.SCHEDULED
      ).length;

    console.log(
      finalPromotions
    );

    assert(
  activeCount <= 1,
  `FAIL: Concurrent activation menghasilkan ${activeCount} ACTIVE promotion. Maksimal hanya 1 yang diizinkan.`
);

assert(
  activeCount +
    scheduledCount ===
    2,
  `FAIL: State final promotion tidak valid. ACTIVE=${activeCount}, SCHEDULED=${scheduledCount}.`
);

console.log(
  "PASS: Database tidak memiliki lebih dari 1 ACTIVE promotion."
);

console.log(
  `Final state: ACTIVE=${activeCount}, SCHEDULED=${scheduledCount}.`
);

    section(
      6,
      "VERIFY SKU LOCK SERIALIZATION"
    );

/**
 * ========================================================
 * CONCURRENCY SAFETY INVARIANT
 * ========================================================
 *
 * TEST ini memastikan hasil concurrent activation
 * tidak menghasilkan dua promotion ACTIVE.
 *
 * Catatan:
 *
 * activeCount <= 1 membuktikan business invariant.
 *
 * Test ini sendiri tidak mengklaim bahwa invariant tersebut
 * semata-mata disebabkan oleh SKU lock, karena conflict
 * detection juga merupakan bagian dari protection.
 *
 * Verifikasi bahwa FOR UPDATE benar-benar melakukan
 * serialization dilakukan melalui transaction/logging test
 * tersendiri.
 */

assert(
  activeCount <= 1,
  `FAIL: Concurrency menghasilkan lebih dari satu ACTIVE promotion. Actual ${activeCount}.`
);

console.log(
  "PASS: Concurrent activation menjaga invariant maksimal satu ACTIVE promotion."
);

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "ALL PROMOTION ACTIVATION CONCURRENCY TESTS PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "FATAL: Promotion activation concurrency test gagal."
    );
    console.error(
      error
    );

    process.exitCode = 1;
  } finally {
    section(
      7,
      "CLEANUP"
    );

    try {
      if (promotionBId) {
        await prisma.promotionItem.deleteMany({
          where: {
            promotionId:
              promotionBId,
          },
        });

        await prisma.promotion.delete({
          where: {
            id:
              promotionBId,
          },
        });

        console.log(
          "PASS: Promotion B test dihapus."
        );
      }

      if (promotionAId) {
        await prisma.promotionItem.deleteMany({
          where: {
            promotionId:
              promotionAId,
          },
        });

        await prisma.promotion.delete({
          where: {
            id:
              promotionAId,
          },
        });

        console.log(
          "PASS: Promotion A test dihapus."
        );
      }
    } catch (cleanupError) {
      console.error(
        "ERROR: Cleanup promotion test gagal.",
        cleanupError
      );

      process.exitCode = 1;
    }

    await prisma.$disconnect();
  }
}

main().catch(
  (error) => {
    console.error(
      "UNHANDLED:",
      error
    );

    process.exitCode = 1;
  }
);
