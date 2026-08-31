import {
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_PREFIX =
  "test-promotion-schedule-concurrency";

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
    "============================================================"
  );
  console.log(
    `TEST ${number} - ${title}`
  );
  console.log(
    "============================================================"
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

if (!sku) {
  throw new Error(
    "FAIL: Tidak ada ProductSku aktif untuk schedule concurrency test."
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
  "CREATE DRAFT PROMOTIONS"
);

    const promotionA =
      await prisma.promotion.create({
        data: {
          name:
            `${TEST_PREFIX} A ${Date.now()}`,

          slug:
            `${TEST_PREFIX}-a-${Date.now()}`,

          status:
            PromotionStatus.DRAFT,

          type:
            PromotionType.PRICE_DISCOUNT,

          discountType:
            PromotionDiscountType.FIXED_AMOUNT,

          discountValue: 1000,

          items: {
            create: {
              skuId: sku.id,
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
            `${TEST_PREFIX} B ${Date.now()}`,

          slug:
            `${TEST_PREFIX}-b-${Date.now()}`,

          status:
            PromotionStatus.DRAFT,

          type:
            PromotionType.PRICE_DISCOUNT,

          discountType:
            PromotionDiscountType.FIXED_AMOUNT,

          discountValue: 2000,

          items: {
            create: {
              skuId: sku.id,
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
    });

    console.log(
      "PASS: Dua promotion DRAFT berhasil dibuat."
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
          type: true,
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
          PromotionStatus.DRAFT
      ),
      "FAIL: Kedua promotion harus DRAFT sebelum schedule concurrency test."
    );

    console.log(
      "PASS: Kedua promotion berada pada state DRAFT."
    );

    section(
      4,
      "CONCURRENT SCHEDULE"
    );

    const now =
      new Date();

    const startAt =
      new Date(
        now.getTime() +
          5 * 60 * 1000
      );

    const endAt =
      new Date(
        now.getTime() +
          60 * 60 * 1000
      );

    console.log({
      startAt:
        startAt.toISOString(),

      endAt:
        endAt.toISOString(),
    });

    console.log(
      "Menjalankan PromotionService.schedule() secara concurrent..."
    );

    const results =
      await Promise.allSettled([
        PromotionService.schedule(
          promotionAId,
          startAt,
          endAt
        ),

        PromotionService.schedule(
          promotionBId,
          startAt,
          endAt
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
      const promotionId =
        index === 0
          ? promotionAId
          : promotionBId;

      if (
        result.status ===
        "fulfilled"
      ) {
        console.log(
          `RESULT ${index + 1}: SUCCESS`,
          {
            promotionId,
          }
        );
      } else {
        console.log(
          `RESULT ${index + 1}: REJECTED`,
          {
            promotionId,

            error:
              result.reason instanceof
              Error
                ? result.reason.message
                : String(
                    result.reason
                  ),
          }
        );
      }
    }

    assert(
      fulfilled.length === 1,
      `FAIL: Expected tepat 1 schedule berhasil, actual ${fulfilled.length}.`
    );

    assert(
      rejected.length === 1,
      `FAIL: Expected tepat 1 schedule ditolak, actual ${rejected.length}.`
    );

const rejectedResult =
  results.find(
    (result) =>
      result.status ===
      "rejected"
  );

if (!rejectedResult) {
  throw new Error(
    "FAIL: Tidak ditemukan schedule yang rejected."
  );
}

const rejectedMessage =
  rejectedResult.reason instanceof
  Error
    ? rejectedResult.reason.message
    : String(
        rejectedResult.reason
      );

    assert(
      rejectedMessage.includes(
        "sudah digunakan oleh promotion PRICE_DISCOUNT"
      ),
      `FAIL: Schedule yang kalah ditolak bukan karena conflict. Error: ${rejectedMessage}`
    );

    console.log(
      "PASS: Tepat 1 schedule berhasil dan 1 ditolak karena conflict."
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
          startAt: true,
          endAt: true,
        },

        orderBy: {
          id: "asc",
        },
      });

    const scheduledCount =
      finalPromotions.filter(
        (promotion) =>
          promotion.status ===
          PromotionStatus.SCHEDULED
      ).length;

    const draftCount =
      finalPromotions.filter(
        (promotion) =>
          promotion.status ===
          PromotionStatus.DRAFT
      ).length;

    console.log(
      finalPromotions
    );

    assert(
      scheduledCount === 1,
      `FAIL: Expected 1 SCHEDULED promotion, actual ${scheduledCount}.`
    );

    assert(
      draftCount === 1,
      `FAIL: Expected 1 DRAFT promotion, actual ${draftCount}.`
    );

    console.log(
      "PASS: Database hanya memiliki 1 SCHEDULED dan 1 DRAFT."
    );

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "PROMOTION SCHEDULE CONCURRENCY TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "FATAL: Promotion schedule concurrency test gagal."
    );
    console.error(
      error
    );

    process.exitCode = 1;
  } finally {
    section(
      6,
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
        "ERROR: Cleanup promotion schedule test gagal.",
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
