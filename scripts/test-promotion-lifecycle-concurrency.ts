import {
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_PREFIX =
  "test-promotion-lifecycle-concurrency";

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
  let promotionId: string | null = null;

  try {
    /**
     * ==========================================================
     * TEST 1 - PREPARE SKU
     * ==========================================================
     */

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
      "FAIL: Tidak ada ProductSku aktif untuk lifecycle concurrency test."
    );

    if (!sku) {
      throw new Error(
        "FAIL: Tidak ada ProductSku aktif untuk lifecycle concurrency test."
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

    /**
     * ==========================================================
     * TEST 2 - CREATE ACTIVE PROMOTION
     * ==========================================================
     */

    section(
      2,
      "CREATE ACTIVE PROMOTION"
    );

    const now =
      new Date();

    const startAt =
      new Date(
        now.getTime() -
          5 * 60 * 1000
      );

    const endAt =
      new Date(
        now.getTime() +
          60 * 60 * 1000
      );

    const suffix =
      Date.now();

    const promotion =
      await prisma.promotion.create({
        data: {
          name:
            `${TEST_PREFIX} ${suffix}`,

          slug:
            `${TEST_PREFIX}-${suffix}`,

          status:
            PromotionStatus.ACTIVE,

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

    promotionId =
      promotion.id;

    console.log({
      promotionId,
      skuId,
      startAt:
        startAt.toISOString(),
      endAt:
        endAt.toISOString(),
      status:
        promotion.status,
    });

    assert(
      promotion.status ===
        PromotionStatus.ACTIVE,
      "FAIL: Promotion harus ACTIVE sebelum lifecycle concurrency test."
    );

    console.log(
      "PASS: Promotion ACTIVE berhasil dibuat."
    );

    /**
     * ==========================================================
     * TEST 3 - VERIFY INITIAL STATE
     * ==========================================================
     */

    section(
      3,
      "VERIFY INITIAL STATE"
    );

    const initial =
      await prisma.promotion.findUnique({
        where: {
          id: promotionId,
        },
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
        },
      });

    assert(
      initial !== null,
      "FAIL: Promotion test tidak ditemukan."
    );

    if (!initial) {
      throw new Error(
        "FAIL: Promotion test tidak ditemukan."
      );
    }

    assert(
      initial.status ===
        PromotionStatus.ACTIVE,
      `FAIL: Initial status harus ACTIVE, actual ${initial.status}.`
    );

    console.log(
      "PASS: Initial state = ACTIVE."
    );

    /**
     * ==========================================================
     * TEST 4 - CONCURRENT END
     * ==========================================================
     *
     * Dua end() dipanggil bersamaan terhadap promotion
     * yang sama.
     *
     * Expected:
     *
     * Request A
     *   BEGIN
     *   FOR UPDATE
     *   ACTIVE -> ENDED
     *   COMMIT
     *
     * Request B
     *   BEGIN
     *   menunggu row lock
     *   membaca state terbaru = ENDED
     *   REJECT
     *
     * Hanya satu transition boleh berhasil.
     */

    section(
      4,
      "CONCURRENT END"
    );

    console.log(
      "Menjalankan PromotionService.end() secara concurrent..."
    );

    const results =
      await Promise.allSettled([
        PromotionService.end(
          promotionId
        ),

        PromotionService.end(
          promotionId
        ),
      ]);

    const fulfilled =
      results.filter(
        (
          result
        ) =>
          result.status ===
          "fulfilled"
      );

    const rejected =
      results.filter(
        (
          result
        ) =>
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
          `RESULT ${index + 1}: SUCCESS`
        );
      } else {
        console.log(
          `RESULT ${index + 1}: REJECTED`,
          {
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
      `FAIL: Expected tepat 1 end() berhasil, actual ${fulfilled.length}.`
    );

    assert(
      rejected.length === 1,
      `FAIL: Expected tepat 1 end() ditolak, actual ${rejected.length}.`
    );

    const rejectedResult =
      results.find(
        (
          result
        ) =>
          result.status ===
          "rejected"
      );

    assert(
      rejectedResult !==
        undefined,
      "FAIL: Tidak ditemukan end() yang rejected."
    );

    if (
      !rejectedResult ||
      rejectedResult.status !==
        "rejected"
    ) {
      throw new Error(
        "FAIL: State rejected result tidak valid."
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
    "Promotion harus berstatus ACTIVE untuk dapat diakhiri."
  ),
  `FAIL: Transition kedua ditolak dengan alasan yang tidak sesuai: ${rejectedMessage}`
);

    console.log(
      "PASS: Hanya satu end() berhasil dan request kedua ditolak setelah membaca state ENDED."
    );

    /**
     * ==========================================================
     * TEST 5 - VERIFY FINAL STATE
     * ==========================================================
     */

    section(
      5,
      "VERIFY FINAL STATE"
    );

    const finalPromotion =
      await prisma.promotion.findUnique({
        where: {
          id: promotionId,
        },
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
        },
      });

    assert(
      finalPromotion !== null,
      "FAIL: Promotion tidak ditemukan setelah concurrent end()."
    );

    if (!finalPromotion) {
      throw new Error(
        "FAIL: Promotion tidak ditemukan setelah concurrent end()."
      );
    }

    console.log(
      finalPromotion
    );

    assert(
      finalPromotion.status ===
        PromotionStatus.ENDED,
      `FAIL: Final status harus ENDED, actual ${finalPromotion.status}.`
    );

    console.log(
      "PASS: Final database state = ENDED."
    );

    /**
     * ==========================================================
     * TEST 6 - VERIFY ILLEGAL ACTIVATE
     * ==========================================================
     *
     * Setelah promotion menjadi ENDED, activate() tidak boleh
     * menghidupkannya kembali.
     *
     * Ini menguji lifecycle state machine:
     *
     * ACTIVE
     *   ↓
     * ENDED
     *
     * ENDED
     *   X
     * ACTIVE
     */

    section(
      6,
      "VERIFY ILLEGAL ACTIVATE"
    );

    const activateResult =
      await Promise.allSettled([
        PromotionService.activate(
          promotionId
        ),
      ]);

    assert(
      activateResult.length === 1,
      "FAIL: Unexpected activation result."
    );

    const activation =
      activateResult[0];

    assert(
      activation.status ===
        "rejected",
      "FAIL: Promotion ENDED tidak boleh kembali ACTIVE."
    );

    if (
      activation.status !==
      "rejected"
    ) {
      throw new Error(
        "FAIL: Activation terhadap ENDED tidak ditolak."
      );
    }

    const activationMessage =
      activation.reason instanceof
      Error
        ? activation.reason.message
        : String(
            activation.reason
          );

    console.log(
      "Activation rejected:",
      activationMessage
    );

    assert(
      activationMessage.includes(
        "tidak diperbolehkan"
      ),
      `FAIL: Illegal activation ditolak dengan alasan yang tidak sesuai: ${activationMessage}`
    );

    console.log(
      "PASS: Promotion ENDED tidak dapat kembali ACTIVE."
    );

    /**
     * ==========================================================
     * TEST 7 - CLEANUP SUCCESS
     * ==========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "ALL PROMOTION LIFECYCLE CONCURRENCY TESTS PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "FATAL: Promotion lifecycle concurrency test gagal."
    );

    console.error(
      error
    );

    process.exitCode = 1;
  } finally {
    section(
      8,
      "CLEANUP"
    );

    try {
      if (promotionId) {
        await prisma.promotionItem.deleteMany({
          where: {
            promotionId,
          },
        });

        await prisma.promotion.delete({
          where: {
            id: promotionId,
          },
        });

        console.log(
          "PASS: Promotion lifecycle test dihapus."
        );
      }
    } catch (cleanupError) {
      console.error(
        "ERROR: Cleanup promotion lifecycle test gagal.",
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
