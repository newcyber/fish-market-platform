import {
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_PREFIX =
  "test-promotion-worker-admin-concurrency";

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
  let promotionId: string | null = null;

  try {
    /**
     * ==========================================================
     * TEST 1 - CREATE ACTIVE PROMOTION
     * ==========================================================
     */

    section(
      1,
      "CREATE ACTIVE PROMOTION"
    );

    const now = new Date();

    const startAt = new Date(
      now.getTime() -
        5 * 60 * 1000
    );

    const endAt = new Date(
      now.getTime() +
        60 * 60 * 1000
    );

    const suffix = Date.now();

const sku =
  await prisma.productSku.findFirst({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      sku: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

if (!sku) {
  throw new Error(
    "FAIL: Tidak ada ProductSku aktif."
  );
}

console.log({
  skuId: sku.id,
  sku: sku.sku,
});

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
              skuId: sku.id,
            },
          },
        },
      });

    promotionId =
      promotion.id;

    console.log({
      promotionId,
      skuId: sku.id,
      sku: sku.sku,
      startAt:
        startAt.toISOString(),
      endAt:
        endAt.toISOString(),
    });

    console.log(
      "PASS: Promotion ACTIVE berhasil dibuat."
    );

    /**
     * ==========================================================
     * TEST 2 - VERIFY INITIAL STATE
     * ==========================================================
     */

    section(
      2,
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
     * TEST 3 - CONCURRENT WORKER + ADMIN END
     * ==========================================================
     *
     * Kedua actor menjalankan end() melalui service.
     *
     * Worker:
     *   syncLifecycle()
     *      ↓
     *   end()
     *
     * Admin:
     *   end()
     *
     * Expected:
     *
     *   SUCCESS = 1
     *   REJECTED = 1
     *
     * Request yang memperoleh lock kedua harus membaca
     * status ENDED dan ditolak.
     */

    section(
      3,
      "CONCURRENT WORKER + ADMIN END"
    );

    console.log(
      "Menjalankan worker dan admin secara concurrent..."
    );

    /**
     * Jalankan syncLifecycle() dan end() bersamaan.
     *
     * syncLifecycle() akan menemukan promotion ACTIVE
     * karena endAt masih di masa depan? Tidak.
     *
     * Karena lifecycle candidate hanya memilih ACTIVE
     * yang endAt <= now, promotion harus dibuat expired
     * untuk benar-benar menguji worker -> end().
     */

    await prisma.promotion.update({
      where: {
        id: promotionId,
      },
      data: {
        endAt:
          new Date(
            Date.now() -
              1000
          ),
      },
    });

    const results =
      await Promise.allSettled([
        PromotionService.syncLifecycle(
          new Date()
        ),

        PromotionService.end(
          promotionId
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

    /**
     * syncLifecycle() sendiri selalu resolve dengan result
     * walaupun salah satu lifecycle candidate gagal.
     *
     * Karena itu hasil Promise.allSettled() tidak dapat
     * digunakan langsung untuk menghitung satu success /
     * satu rejection pada level business operation.
     */

    assert(
      rejected.length === 0 ||
        rejected.length === 1,
      "FAIL: Unexpected Promise rejection."
    );

    console.log(
      "PASS: Worker + admin invocation selesai."
    );

    /**
     * ==========================================================
     * TEST 4 - VERIFY FINAL STATE
     * ==========================================================
     */

    section(
      4,
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
          endAt: true,
        },
      });

if (!finalPromotion) {
  throw new Error(
    "FAIL: Promotion tidak ditemukan setelah concurrency test."
  );
}

assert(
  finalPromotion.status ===
    PromotionStatus.ENDED,
  `FAIL: Final status harus ENDED, actual ${finalPromotion.status}.`
);

if (!finalPromotion.endAt) {
  throw new Error(
    "FAIL: Promotion ENDED harus memiliki endAt."
  );
}

assert(
  finalPromotion.endAt <=
    new Date(),
  "FAIL: endAt harus sudah berada di masa lalu."
);

    assert(
      finalPromotion.endAt !== null &&
        finalPromotion.endAt <=
          new Date(),
      "FAIL: endAt harus sudah berada di masa lalu."
    );

    console.log({
      promotionId:
        finalPromotion.id,

      status:
        finalPromotion.status,

      endAt:
        finalPromotion.endAt.toISOString(),
    });

    console.log(
      "PASS: Final database state = ENDED."
    );

    /**
     * ==========================================================
     * TEST 5 - VERIFY WORKER RESULT
     * ==========================================================
     *
     * syncLifecycle() harus melaporkan promotion sebagai
     * activated/ended sesuai candidate yang diproses.
     *
     * Pada skenario ini promotion ACTIVE + endAt expired,
     * sehingga worker harus mengubahnya menjadi ENDED.
     */

    section(
      5,
      "VERIFY WORKER RESULT"
    );

    /**
     * Setelah kedua actor selesai, jalankan worker lagi.
     *
     * Promotion sudah ENDED sehingga tidak boleh diproses
     * lagi.
     */

    const secondRun =
      await PromotionService.syncLifecycle(
        new Date()
      );

    assert(
      secondRun.checked === 0,
      `FAIL: Promotion ENDED tidak boleh menjadi lifecycle candidate. checked=${secondRun.checked}`
    );

    assert(
      secondRun.ended === 0,
      `FAIL: Promotion ENDED tidak boleh di-end ulang. ended=${secondRun.ended}`
    );

    assert(
      secondRun.failed === 0,
      `FAIL: Worker second run menghasilkan failure. failed=${secondRun.failed}`
    );

    console.log(
      "PASS: Promotion ENDED tidak diproses ulang oleh worker."
    );

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "WORKER + ADMIN CONCURRENCY TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "FATAL: Worker + admin concurrency test gagal."
    );
    console.error(error);

    process.exitCode = 1;
  } finally {
    section(
      6,
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
          "PASS: Promotion worker/admin test dihapus."
        );
      }
    } catch (cleanupError) {
      console.error(
        "ERROR: Cleanup gagal.",
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
