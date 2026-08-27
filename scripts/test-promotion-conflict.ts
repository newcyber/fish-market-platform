import {
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_PREFIX = "TEST ISOLATED CONFLICT";

type TestSku = {
  id: string;
  sku: string;
  productId: string;
  price: string;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const assert = (
  condition: boolean,
  message: string
): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const getTestSkus = async (): Promise<{
  skuA: TestSku;
  skuB: TestSku;
}> => {
  const skus =
    await prisma.productSku.findMany({
      where: {
        sku: {
          in: [
            "TEST-TUNA-500GR",
            "TEST-TUNA-1KG",
          ],
        },
      },
      select: {
        id: true,
        sku: true,
        productId: true,
        price: true,
      },
      orderBy: {
        sku: "asc",
      },
    });

  if (skus.length !== 2) {
    throw new Error(
      "Test membutuhkan TEST-TUNA-500GR dan TEST-TUNA-1KG."
    );
  }

  const skuA = skus.find(
    (sku) =>
      sku.sku ===
      "TEST-TUNA-500GR"
  );

  const skuB = skus.find(
    (sku) =>
      sku.sku ===
      "TEST-TUNA-1KG"
  );

  if (!skuA || !skuB) {
    throw new Error(
      "SKU test tidak lengkap."
    );
  }

  return {
    skuA: {
      ...skuA,
      price: skuA.price.toString(),
    },
    skuB: {
      ...skuB,
      price: skuB.price.toString(),
    },
  };
};

const createPromotion = async ({
  name,
  slug,
  status,
  startAt,
  endAt,
}: {
  name: string;
  slug: string;
  status: PromotionStatus;
  startAt: Date;
  endAt: Date;
}) => {
  return PromotionService.create({
    name,
    slug,
    description:
      "Automated isolated promotion conflict test.",
    banner: null,
    status,
    startAt,
    endAt,
    type:
      PromotionType.PRICE_DISCOUNT,
    discountType:
      PromotionDiscountType.PERCENTAGE,
    discountValue: 10,
    sortOrder: 0,
    isFeatured: false,
  });
};

const deletePromotion = async (
  id: string
) => {
  await prisma.promotion.delete({
    where: {
      id,
    },
  });
};

const runIsolatedTest = async ({
  name,
  existingSkuId,
  candidateSkuId,
  existingStart,
  existingEnd,
  candidateStart,
  candidateEnd,
  shouldConflict,
}: {
  name: string;
  existingSkuId: string;
  candidateSkuId: string;
  existingStart: Date;
  existingEnd: Date;
  candidateStart: Date;
  candidateEnd: Date;
  shouldConflict: boolean;
}) => {
  let existingPromotionId:
    | string
    | null = null;

  let candidatePromotionId:
    | string
    | null = null;

  console.log("");
  console.log(
    "------------------------------------------------------------"
  );
  console.log(name);

  try {
    /**
     * ----------------------------------------------------------
     * EXISTING PROMOTION
     * ----------------------------------------------------------
     */
    const existingPromotion =
      await createPromotion({
        name: `${TEST_PREFIX} EXISTING`,
        slug: `${TEST_PREFIX
          .toLowerCase()
          .replace(/\s+/g, "-")}-${Date.now()}-existing`,
        status:
          PromotionStatus.SCHEDULED,
        startAt:
          existingStart,
        endAt:
          existingEnd,
      });

    existingPromotionId =
      existingPromotion.id;

    await PromotionService.addSku(
      existingPromotion.id,
      existingSkuId
    );

    console.log(
      "Existing promotion + SKU berhasil dibuat."
    );

    /**
     * ----------------------------------------------------------
     * CANDIDATE PROMOTION
     * ----------------------------------------------------------
     */
    const candidatePromotion =
      await createPromotion({
        name: `${TEST_PREFIX} CANDIDATE`,
        slug: `${TEST_PREFIX
          .toLowerCase()
          .replace(/\s+/g, "-")}-${Date.now()}-candidate`,
        status:
          PromotionStatus.SCHEDULED,
        startAt:
          candidateStart,
        endAt:
          candidateEnd,
      });

    candidatePromotionId =
      candidatePromotion.id;

    /**
     * ----------------------------------------------------------
     * ASSERT
     * ----------------------------------------------------------
     */
    let conflictThrown =
      false;

    try {
      await PromotionService.addSku(
        candidatePromotion.id,
        candidateSkuId
      );
    } catch (error) {
      conflictThrown = true;

      console.log(
        "Error:",
        getErrorMessage(error)
      );
    }

    if (shouldConflict) {
      assert(
        conflictThrown,
        "Expected conflict tetapi PromotionService tidak menolaknya."
      );

      console.log(
        "PASS: Conflict berhasil ditolak."
      );
    } else {
      assert(
        !conflictThrown,
        "Tidak seharusnya conflict, tetapi PromotionService menolaknya."
      );

      console.log(
        "PASS: Tidak ada conflict."
      );
    }
  } finally {
    /**
     * ----------------------------------------------------------
     * ISOLATED CLEANUP
     * ----------------------------------------------------------
     */
    if (candidatePromotionId) {
      await deletePromotion(
        candidatePromotionId
      );
    }

    if (existingPromotionId) {
      await deletePromotion(
        existingPromotionId
      );
    }

    console.log(
      "Cleanup test selesai."
    );
  }
};

const main = async () => {
  console.log(
    "============================================================"
  );
  console.log(
    "PROMOTION CONFLICT ISOLATED TEST"
  );
  console.log(
    "============================================================"
  );

  const {
    skuA,
    skuB,
  } = await getTestSkus();

  console.log("");
  console.log("TEST SKU:");
  console.log({
    skuA,
    skuB,
  });

  /**
   * ==========================================================
   * TEST 1
   * ==========================================================
   *
   * SKU sama + periode overlap
   *
   * Expected:
   * CONFLICT
   */
  {
    const base =
      Date.now();

    const existingStart =
      new Date(
        base + 60 * 60 * 1000
      );

    const existingEnd =
      new Date(
        base + 4 * 60 * 60 * 1000
      );

    const candidateStart =
      new Date(
        base + 2 * 60 * 60 * 1000
      );

    const candidateEnd =
      new Date(
        base + 5 * 60 * 60 * 1000
      );

    await runIsolatedTest({
      name:
        "TEST 1: SKU sama + periode overlap",
      existingSkuId:
        skuA.id,
      candidateSkuId:
        skuA.id,
      existingStart,
      existingEnd,
      candidateStart,
      candidateEnd,
      shouldConflict:
        true,
    });
  }

  /**
   * ==========================================================
   * TEST 2
   * ==========================================================
   *
   * SKU sama + boundary tepat.
   *
   * Existing:
   * 01:00 - 02:00
   *
   * Candidate:
   * 02:00 - 03:00
   *
   * Expected:
   * TIDAK CONFLICT
   */
  {
    const base =
      Date.now();

    const existingStart =
      new Date(
        base + 60 * 60 * 1000
      );

    const existingEnd =
      new Date(
        base + 2 * 60 * 60 * 1000
      );

    const candidateStart =
      new Date(
        base + 2 * 60 * 60 * 1000
      );

    const candidateEnd =
      new Date(
        base + 3 * 60 * 60 * 1000
      );

    await runIsolatedTest({
      name:
        "TEST 2: SKU sama + boundary tepat",
      existingSkuId:
        skuA.id,
      candidateSkuId:
        skuA.id,
      existingStart,
      existingEnd,
      candidateStart,
      candidateEnd,
      shouldConflict:
        false,
    });
  }

  /**
   * ==========================================================
   * TEST 3
   * ==========================================================
   *
   * SKU berbeda + periode overlap.
   *
   * Expected:
   * TIDAK CONFLICT
   *
   * Ini test yang sebelumnya gagal karena
   * test antar-state tidak isolated.
   */
  {
    const base =
      Date.now();

    const existingStart =
      new Date(
        base + 60 * 60 * 1000
      );

    const existingEnd =
      new Date(
        base + 4 * 60 * 60 * 1000
      );

    const candidateStart =
      new Date(
        base + 2 * 60 * 60 * 1000
      );

    const candidateEnd =
      new Date(
        base + 5 * 60 * 60 * 1000
      );

    await runIsolatedTest({
      name:
        "TEST 3: SKU berbeda + periode overlap",
      existingSkuId:
        skuA.id,
      candidateSkuId:
        skuB.id,
      existingStart,
      existingEnd,
      candidateStart,
      candidateEnd,
      shouldConflict:
        false,
    });
  }

  /**
   * ==========================================================
   * TEST 4
   * ==========================================================
   *
   * SKU sama + periode tidak overlap.
   *
   * Existing:
   * 01:00 - 02:00
   *
   * Candidate:
   * 03:00 - 04:00
   *
   * Expected:
   * TIDAK CONFLICT
   */
  {
    const base =
      Date.now();

    const existingStart =
      new Date(
        base + 60 * 60 * 1000
      );

    const existingEnd =
      new Date(
        base + 2 * 60 * 60 * 1000
      );

    const candidateStart =
      new Date(
        base + 3 * 60 * 60 * 1000
      );

    const candidateEnd =
      new Date(
        base + 4 * 60 * 60 * 1000
      );

    await runIsolatedTest({
      name:
        "TEST 4: SKU sama + periode tidak overlap",
      existingSkuId:
        skuA.id,
      candidateSkuId:
        skuA.id,
      existingStart,
      existingEnd,
      candidateStart,
      candidateEnd,
      shouldConflict:
        false,
    });
  }

  /**
   * ==========================================================
   * TEST 5
   * ==========================================================
   *
   * SKU sama + existing ACTIVE + overlap.
   *
   * Expected:
   * CONFLICT
   *
   * Catatan:
   * Kita tidak bisa membuat ACTIVE melalui
   * PromotionService.create() jika startAt masih
   * berada di masa depan. Karena itu periode dibuat
   * sedang aktif.
   */
  {
    const now =
      Date.now();

    const existingStart =
      new Date(
        now - 60 * 60 * 1000
      );

    const existingEnd =
      new Date(
        now + 2 * 60 * 60 * 1000
      );

    const candidateStart =
      new Date(
        now + 30 * 60 * 1000
      );

    const candidateEnd =
      new Date(
        now + 3 * 60 * 60 * 1000
      );

    let existingPromotionId:
      | string
      | null = null;

    let candidatePromotionId:
      | string
      | null = null;

    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 5: Existing ACTIVE + SKU sama + overlap"
    );

    try {
      const existingPromotion =
        await createPromotion({
          name:
            `${TEST_PREFIX} ACTIVE EXISTING`,
          slug: `${TEST_PREFIX
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}-active-existing`,
          status:
            PromotionStatus.ACTIVE,
          startAt:
            existingStart,
          endAt:
            existingEnd,
        });

      existingPromotionId =
        existingPromotion.id;

      await PromotionService.addSku(
        existingPromotion.id,
        skuA.id
      );

      const candidatePromotion =
        await createPromotion({
          name:
            `${TEST_PREFIX} ACTIVE CANDIDATE`,
          slug: `${TEST_PREFIX
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}-active-candidate`,
          status:
            PromotionStatus.SCHEDULED,
          startAt:
            candidateStart,
          endAt:
            candidateEnd,
        });

      candidatePromotionId =
        candidatePromotion.id;

      let conflictThrown =
        false;

      try {
        await PromotionService.addSku(
          candidatePromotion.id,
          skuA.id
        );
      } catch (error) {
        conflictThrown = true;

        console.log(
          "Error:",
          getErrorMessage(error)
        );
      }

      assert(
        conflictThrown,
        "Expected conflict dengan ACTIVE promotion."
      );

      console.log(
        "PASS: ACTIVE promotion dengan SKU sama + overlap ditolak."
      );
    } finally {
      if (candidatePromotionId) {
        await deletePromotion(
          candidatePromotionId
        );
      }

      if (existingPromotionId) {
        await deletePromotion(
          existingPromotionId
        );
      }

      console.log(
        "Cleanup test selesai."
      );
    }
  }

  /**
   * ==========================================================
   * FINAL
   * ==========================================================
   */
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "PROMOTION CONFLICT ISOLATED TEST PASSED"
  );
  console.log(
    "============================================================"
  );
};

main()
  .catch(async (error) => {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "PROMOTION CONFLICT ISOLATED TEST FAILED"
    );
    console.log(
      "============================================================"
    );

    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });