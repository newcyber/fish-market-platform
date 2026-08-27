import {
  Prisma,
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import PromotionService from "@/services/promotion/promotion.service";

const TEST_SLUG_PREFIX =
  "test-promotion-lifecycle-";

const TEST_SKU =
  "TEST-TUNA-500GR";

const WAIT_BEFORE_START_MS = 3_000;

function assert(
  condition: unknown,
  message: string
) {
  if (!condition) {
    throw new Error(message);
  }
}

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function sleep(
  ms: number
) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

/**
 * ============================================================
 * CREATE TEST PROMOTION
 * ============================================================
 */
async function createPriceDiscountPromotion(
  name: string,
  status: PromotionStatus = PromotionStatus.DRAFT
) {
  return PromotionService.create({
    name,

    slug:
      `${TEST_SLUG_PREFIX}${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    description:
      "Automated lifecycle integration test.",

    status,

    startAt: null,

    endAt: null,

    type:
      PromotionType.PRICE_DISCOUNT,

    discountType:
      PromotionDiscountType.PERCENTAGE,

    discountValue:
      new Prisma.Decimal(40),

    sortOrder: 0,

    isFeatured: false,
  });
}

/**
 * ============================================================
 * CLEANUP
 * ============================================================
 */
async function cleanup() {
  await prisma.promotion.deleteMany({
    where: {
      slug: {
        startsWith:
          TEST_SLUG_PREFIX,
      },
    },
  });
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */
async function main() {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(
    "PROMOTION LIFECYCLE INTEGRATION TEST"
  );
  console.log(
    "============================================================"
  );

  /**
   * ----------------------------------------------------------
   * CLEANUP TEST DATA LAMA
   * ----------------------------------------------------------
   */
  await cleanup();

  /**
   * ----------------------------------------------------------
   * FIND TEST SKU
   * ----------------------------------------------------------
   */
  const sku =
    await prisma.productSku.findUnique({
      where: {
        sku: TEST_SKU,
      },

      select: {
        id: true,
        sku: true,
        productId: true,
        price: true,
        isActive: true,
      },
    });

  if (!sku) {
    throw new Error(
      `SKU ${TEST_SKU} tidak ditemukan.`
    );
  }

  if (!sku.isActive) {
    throw new Error(
      `SKU ${TEST_SKU} tidak aktif.`
    );
  }

  console.log("");
  console.log(
    "TEST SKU:"
  );

  console.log({
    sku: sku.sku,

    productId:
      sku.productId,

    price:
      sku.price.toString(),
  });

  let promotion:
    Awaited<
      ReturnType<
        typeof createPriceDiscountPromotion
      >
    > | null = null;

  let secondPromotion:
    Awaited<
      ReturnType<
        typeof createPriceDiscountPromotion
      >
    > | null = null;

  try {
    /**
     * ========================================================
     * TEST 1
     * CREATE DRAFT
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 1 - CREATE DRAFT"
    );
    console.log(
      "------------------------------------------------------------"
    );

    promotion =
      await createPriceDiscountPromotion(
        "TEST LIFECYCLE PRIMARY"
      );

    assert(
      promotion.status ===
        PromotionStatus.DRAFT,
      `FAIL: Promotion seharusnya DRAFT, tetapi ${promotion.status}`
    );

    console.log(
      "PASS: Promotion berhasil dibuat sebagai DRAFT."
    );

    /**
     * ========================================================
     * TEST 2
     * ADD SKU
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 2 - ADD SKU"
    );
    console.log(
      "------------------------------------------------------------"
    );

    await PromotionService.addSku(
      promotion.id,
      sku.id
    );

    const afterAddSku =
  await PromotionService.getById(
    promotion.id
  );

if (!afterAddSku) {
  throw new Error(
    "FAIL: Promotion tidak ditemukan setelah addSku()."
  );
}

if (
  !afterAddSku.items.some(
    (item) => item.skuId === sku.id
  )
) {
  throw new Error(
    "FAIL: SKU tidak berhasil ditambahkan ke promotion."
  );
}

    /**
     * ========================================================
     * TEST 3
     * SCHEDULE
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 3 - SCHEDULE"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const startAt =
      new Date(
        Date.now() +
          WAIT_BEFORE_START_MS
      );

    const endAt =
      new Date(
        startAt.getTime() +
          60_000
      );

    const scheduled =
      await PromotionService.schedule(
        promotion.id,
        startAt,
        endAt
      );

    assert(
      scheduled.status ===
        PromotionStatus.SCHEDULED,
      `FAIL: Status seharusnya SCHEDULED, tetapi ${scheduled.status}`
    );

    assert(
      scheduled.startAt !== null,
      "FAIL: startAt tidak tersimpan."
    );

    assert(
      scheduled.endAt !== null,
      "FAIL: endAt tidak tersimpan."
    );

    console.log(
      "PASS: Promotion berhasil menjadi SCHEDULED."
    );

    console.log({
      status:
        scheduled.status,

      startAt:
        scheduled.startAt,

      endAt:
        scheduled.endAt,
    });

    /**
     * ========================================================
     * TEST 4
     * ACTIVATE BEFORE START
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 4 - ACTIVATE BEFORE START"
    );
    console.log(
      "------------------------------------------------------------"
    );

    let activateBeforeStartRejected =
      false;

    try {
      await PromotionService.activate(
        promotion.id
      );

      console.error(
        "FAIL: Activation sebelum startAt seharusnya ditolak."
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      if (
        message.includes(
          "belum memasuki waktu mulai"
        )
      ) {
        activateBeforeStartRejected =
          true;

        console.log(
          "PASS: Activation sebelum startAt ditolak."
        );

        console.log(
          "Message:",
          message
        );
      } else {
        throw error;
      }
    }

    assert(
      activateBeforeStartRejected,
      "TEST 4 gagal."
    );

    /**
     * ========================================================
     * TEST 5
     * DIRECT STATUS UPDATE
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 5 - DIRECT STATUS UPDATE"
    );
    console.log(
      "------------------------------------------------------------"
    );

    let directStatusRejected =
      false;

    const scheduledBeforeUpdate =
      await PromotionService.getById(
        promotion.id
      );

    try {
      await PromotionService.update(
        promotion.id,
        {
          status:
            PromotionStatus.ACTIVE,
        }
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      if (
        message.includes(
          "Status promotion harus diubah"
        )
      ) {
        directStatusRejected =
          true;

        console.log(
          "PASS: update(status) ditolak."
        );

        console.log(
          "Message:",
          message
        );
      } else {
        throw error;
      }
    }

    assert(
      directStatusRejected,
      "TEST 5 gagal."
    );

        const afterDirectStatusAttempt =
      await PromotionService.getById(
        promotion.id
      );

    if (!scheduledBeforeUpdate) {
      throw new Error(
        "FAIL: Promotion SCHEDULED tidak ditemukan sebelum test direct status update."
      );
    }

    if (!afterDirectStatusAttempt) {
      throw new Error(
        "FAIL: Promotion tidak ditemukan setelah percobaan direct status update."
      );
    }

    assert(
      afterDirectStatusAttempt.status ===
        scheduledBeforeUpdate.status,
      `FAIL: Status berubah setelah update(status). Sebelum=${scheduledBeforeUpdate.status}, Sesudah=${afterDirectStatusAttempt.status}`
    );

    assert(
      afterDirectStatusAttempt.status ===
        PromotionStatus.SCHEDULED,
      `FAIL: Status promotion seharusnya tetap SCHEDULED, tetapi ${afterDirectStatusAttempt.status}`
    );

    console.log(
      "PASS: Direct update status ditolak dan status tetap SCHEDULED."
    );

    /**
     * ========================================================
     * TEST 6
     * END SCHEDULED
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 6 - END SCHEDULED"
    );
    console.log(
      "------------------------------------------------------------"
    );

    let endScheduledRejected =
      false;

    try {
      await PromotionService.end(
        promotion.id
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      if (
        message.includes(
          "SCHEDULED ke ENDED"
        )
      ) {
        endScheduledRejected =
          true;

        console.log(
          "PASS: SCHEDULED tidak dapat langsung menjadi ENDED."
        );

        console.log(
          "Message:",
          message
        );
      } else {
        throw error;
      }
    }

    assert(
      endScheduledRejected,
      "TEST 6 gagal."
    );

    /**
     * ========================================================
     * WAIT UNTIL START
     * ========================================================
     */
    console.log("");
    console.log(
      "Menunggu sampai startAt tercapai..."
    );

    const now =
      Date.now();

    const scheduledStart =
      scheduled.startAt!.getTime();

    const remaining =
      scheduledStart -
      now;

    if (remaining > 0) {
      await sleep(
        remaining + 250
      );
    }

    console.log(
      "startAt sudah tercapai."
    );

    /**
     * ========================================================
     * TEST 7
     * ACTIVATE
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 7 - ACTIVATE"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const activated =
      await PromotionService.activate(
        promotion.id
      );

    assert(
      activated.status ===
        PromotionStatus.ACTIVE,
      `FAIL: Status seharusnya ACTIVE, tetapi ${activated.status}`
    );

    console.log(
      "PASS: Promotion berhasil menjadi ACTIVE."
    );

    /**
     * ========================================================
     * TEST 8
     * UPDATE ACTIVE
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 8 - UPDATE ACTIVE DATA"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const updatedActive =
      await PromotionService.update(
        promotion.id,
        {
          description:
            "Updated while ACTIVE.",
        }
      );

    assert(
      updatedActive.status ===
        PromotionStatus.ACTIVE,
      "FAIL: Update data mengubah status ACTIVE."
    );

    assert(
      updatedActive.description ===
        "Updated while ACTIVE.",
      "FAIL: Description ACTIVE tidak berhasil diperbarui."
    );

    console.log(
      "PASS: Data promotion ACTIVE dapat diperbarui tanpa mengubah lifecycle status."
    );

        /**
     * ========================================================
     * TEST 9
     * SECOND PROMOTION - ADD SKU CONFLICT
     *
     * Promotion pertama sudah ACTIVE.
     *
     * Promotion kedua masih DRAFT.
     *
     * SKU yang sama tidak boleh ditambahkan karena
     * promotion pertama masih aktif pada periode tersebut.
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 9 - SECOND PROMOTION SKU CONFLICT"
    );
    console.log(
      "------------------------------------------------------------"
    );

    secondPromotion =
      await createPriceDiscountPromotion(
        "TEST LIFECYCLE SECOND"
      );

    let addSkuConflictRejected =
      false;

    try {
      await PromotionService.addSku(
        secondPromotion.id,
        sku.id
      );

      console.error(
        "FAIL: addSku() seharusnya menolak SKU yang conflict dengan promotion ACTIVE."
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      if (
        message.includes(
          "sudah digunakan oleh promotion PRICE_DISCOUNT"
        )
      ) {
        addSkuConflictRejected =
          true;

        console.log(
          "PASS: addSku() menolak SKU yang conflict dengan promotion ACTIVE."
        );

        console.log(
          "Message:",
          message
        );
      } else {
        throw error;
      }
    }

    assert(
      addSkuConflictRejected,
      "TEST 9 gagal."
    );

    /**
     * Pastikan SKU memang belum masuk
     * ke promotion kedua.
     */
    const secondAfterRejectedAdd =
      await PromotionService.getById(
        secondPromotion.id
      );

    if (!secondAfterRejectedAdd) {
      throw new Error(
        "FAIL: Promotion kedua tidak ditemukan setelah addSku() ditolak."
      );
    }

    assert(
      !secondAfterRejectedAdd.items.some(
        (item) =>
          item.skuId === sku.id
      ),
      "FAIL: SKU tetap tersimpan pada promotion kedua meskipun addSku() ditolak."
    );

    console.log(
      "PASS: SKU tidak tersimpan setelah conflict ditolak."
    );

    /**
 * ========================================================
 * TEST 10
 * SECOND PROMOTION - NON OVERLAP
 *
 * Setelah conflict overlap terbukti ditolak,
 * kita menguji bahwa SKU yang sama boleh digunakan
 * apabila periodenya tidak overlap.
 *
 * Promotion pertama:
 * ACTIVE
 * startAt = scheduled.startAt
 * endAt   = scheduled.endAt
 *
 * Promotion kedua:
 * DRAFT
 *
 * Alur yang benar:
 *
 * CREATE
 *   ↓
 * SCHEDULE
 *   ↓
 * ADD SKU
 *
 * Karena conflict check pada addSku()
 * menggunakan periode promotion yang sudah tersimpan,
 * promotion kedua WAJIB di-schedule terlebih dahulu.
 * ========================================================
 */
console.log("");
console.log(
  "------------------------------------------------------------"
);
console.log(
  "TEST 10 - SECOND PROMOTION NON-OVERLAP"
);
console.log(
  "------------------------------------------------------------"
);

/**
 * --------------------------------------------------------
 * CALCULATE NON-OVERLAPPING PERIOD
 * --------------------------------------------------------
 *
 * Promotion pertama berakhir pada:
 *
 * scheduled.endAt
 *
 * Promotion kedua dimulai setelah promotion pertama selesai.
 *
 * Buffer 2 detik digunakan agar boundary tidak terlalu dekat.
 */
const secondStart =
  new Date(
    scheduled.endAt!.getTime() +
      2_000
  );

const secondEnd =
  new Date(
    secondStart.getTime() +
      60_000
  );

/**
 * --------------------------------------------------------
 * SCHEDULE SECOND PROMOTION
 * --------------------------------------------------------
 *
 * Jangan addSku() terlebih dahulu.
 *
 * Promotion kedua harus memiliki periode terlebih dahulu
 * agar conflict detection dapat membandingkan:
 *
 * existing promotion period
 *          VS
 * proposed promotion period
 */
const secondScheduled =
  await PromotionService.schedule(
    secondPromotion.id,
    secondStart,
    secondEnd
  );

assert(
  secondScheduled.status ===
    PromotionStatus.SCHEDULED,
  `FAIL: Promotion kedua seharusnya SCHEDULED, tetapi ${secondScheduled.status}`
);

assert(
  secondScheduled.startAt !== null,
  "FAIL: startAt promotion kedua tidak tersimpan."
);

assert(
  secondScheduled.endAt !== null,
  "FAIL: endAt promotion kedua tidak tersimpan."
);

console.log(
  "PASS: Promotion kedua berhasil di-schedule pada periode non-overlap."
);

console.log({
  firstPromotion: {
    status:
      activated.status,

    startAt:
      scheduled.startAt,

    endAt:
      scheduled.endAt,
  },

  secondPromotion: {
    status:
      secondScheduled.status,

    startAt:
      secondScheduled.startAt,

    endAt:
      secondScheduled.endAt,
  },
});

/**
 * --------------------------------------------------------
 * ASSERT NON-OVERLAP
 * --------------------------------------------------------
 *
 * Boundary yang sama tidak dianggap overlap.
 *
 * Kita bahkan memberikan buffer 2 detik,
 * sehingga periode kedua benar-benar berada
 * setelah periode pertama.
 */
assert(
  secondScheduled.startAt!.getTime() >=
    scheduled.endAt!.getTime(),
  "FAIL: Periode promotion kedua masih overlap dengan promotion pertama."
);

console.log(
  "PASS: Periode promotion kedua benar-benar tidak overlap."
);

/**
 * --------------------------------------------------------
 * ADD SKU
 * --------------------------------------------------------
 *
 * Sekarang promotion kedua sudah mempunyai:
 *
 * startAt
 * endAt
 *
 * sehingga addSku() dapat melakukan conflict detection
 * berdasarkan periode yang benar.
 *
 * Karena periode tidak overlap dengan promotion ACTIVE
 * pertama, SKU yang sama seharusnya diperbolehkan.
 */
await PromotionService.addSku(
  secondPromotion.id,
  sku.id
);

/**
 * --------------------------------------------------------
 * VERIFY SKU
 * --------------------------------------------------------
 */
const secondAfterAdd =
  await PromotionService.getById(
    secondPromotion.id
  );

if (!secondAfterAdd) {
  throw new Error(
    "FAIL: Promotion kedua tidak ditemukan setelah addSku() non-overlap."
  );
}

assert(
  secondAfterAdd.items.some(
    (item) =>
      item.skuId === sku.id
  ),
  "FAIL: SKU tidak berhasil ditambahkan pada promotion kedua."
);

console.log(
  "PASS: SKU yang sama dapat digunakan pada promotion dengan periode non-overlap."
);

/**
 * --------------------------------------------------------
 * FINAL TEST 10 ASSERTION
 * --------------------------------------------------------
 */
console.log(
  "PASS: Conflict detection membedakan periode overlap dan non-overlap."
);

    /**
     * ========================================================
     * TEST 11
     * END ACTIVE
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 11 - END ACTIVE"
    );
    console.log(
      "------------------------------------------------------------"
    );

    const ended =
      await PromotionService.end(
        promotion.id
      );

    assert(
      ended.status ===
        PromotionStatus.ENDED,
      `FAIL: Status seharusnya ENDED, tetapi ${ended.status}`
    );

    console.log(
      "PASS: ACTIVE promotion berhasil menjadi ENDED."
    );

    /**
     * ========================================================
     * TEST 12
     * UPDATE ENDED
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 12 - UPDATE ENDED"
    );
    console.log(
      "------------------------------------------------------------"
    );

    let updateEndedRejected =
      false;

    try {
      await PromotionService.update(
        promotion.id,
        {
          description:
            "Should not update.",
        }
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      if (
        message.includes(
          "status ENDED tidak dapat diubah"
        )
      ) {
        updateEndedRejected =
          true;

        console.log(
          "PASS: Promotion ENDED tidak dapat di-update."
        );

        console.log(
          "Message:",
          message
        );
      } else {
        throw error;
      }
    }

    assert(
      updateEndedRejected,
      "TEST 12 gagal."
    );

    /**
     * ========================================================
     * TEST 13
     * CANCEL ENDED
     * ========================================================
     */
    console.log("");
    console.log(
      "------------------------------------------------------------"
    );
    console.log(
      "TEST 13 - CANCEL ENDED"
    );
    console.log(
      "------------------------------------------------------------"
    );

    let cancelEndedRejected =
      false;

    try {
      await PromotionService.cancel(
        promotion.id
      );
    } catch (error) {
      const message =
        getErrorMessage(error);

      /**
       * Cancellation terhadap terminal state
       * harus ditolak.
       */
      if (
        message.includes(
          "ENDED"
        )
      ) {
        cancelEndedRejected =
          true;

        console.log(
          "PASS: Promotion ENDED tidak dapat di-CANCEL."
        );

        console.log(
          "Message:",
          message
        );
      } else {
        throw error;
      }
    }

    assert(
      cancelEndedRejected,
      "TEST 13 gagal."
    );

    /**
 * ========================================================
 * TEST 14
 * DELETE ENDED
 *
 * ENDED promotion boleh dihapus secara soft-delete.
 *
 * Rule:
 * - ACTIVE tidak boleh langsung dihapus.
 * - ENDED boleh di-soft-delete.
 * - Record database tetap ada.
 * - deletedAt harus terisi.
 * - getById() harus tidak lagi mengembalikan record
 *   karena repository hanya mengambil deletedAt = null.
 * ========================================================
 */
console.log("");
console.log(
  "------------------------------------------------------------"
);
console.log(
  "TEST 14 - DELETE ENDED"
);
console.log(
  "------------------------------------------------------------"
);

/**
 * --------------------------------------------------------
 * DELETE
 * --------------------------------------------------------
 */
const deletedPromotion =
  await PromotionService.delete(
    promotion.id
  );

/**
 * --------------------------------------------------------
 * ASSERT RESULT
 * --------------------------------------------------------
 *
 * Status tetap ENDED.
 * Delete tidak mengubah lifecycle status.
 */
assert(
  deletedPromotion.status ===
    PromotionStatus.ENDED,
  `FAIL: Status setelah delete seharusnya ENDED, tetapi ${deletedPromotion.status}`
);

assert(
  deletedPromotion.deletedAt !==
    null,
  "FAIL: deletedAt harus terisi setelah soft-delete."
);

console.log(
  "PASS: Promotion ENDED berhasil di-soft-delete."
);

console.log({
  id:
    deletedPromotion.id,

  status:
    deletedPromotion.status,

  deletedAt:
    deletedPromotion.deletedAt,
});

/**
 * --------------------------------------------------------
 * VERIFY DATABASE RECORD
 * --------------------------------------------------------
 *
 * Soft-delete berarti record tidak benar-benar dihapus.
 */
const deletedRecord =
  await prisma.promotion.findUnique({
    where: {
      id: promotion.id,
    },

    select: {
      id: true,
      status: true,
      deletedAt: true,
    },
  });

assert(
  deletedRecord !== null,
  "FAIL: Record promotion seharusnya tetap ada di database setelah soft-delete."
);

if (!deletedRecord) {
  throw new Error(
    "FAIL: Record promotion tidak ditemukan setelah soft-delete."
  );
}

assert(
  deletedRecord.status ===
    PromotionStatus.ENDED,
  `FAIL: Status database seharusnya ENDED, tetapi ${deletedRecord.status}`
);

assert(
  deletedRecord.deletedAt !==
    null,
  "FAIL: deletedAt database seharusnya terisi."
);

/**
 * --------------------------------------------------------
 * VERIFY NORMAL READ PATH
 * --------------------------------------------------------
 *
 * getById() seharusnya tidak menemukan promotion
 * yang sudah soft-deleted.
 */
const hiddenPromotion =
  await PromotionService.getById(
    promotion.id
  );

assert(
  hiddenPromotion === null,
  "FAIL: Promotion yang sudah soft-deleted masih dikembalikan oleh getById()."
);

console.log(
  "PASS: Promotion soft-deleted tidak lagi muncul pada getById()."
);

/**
 * --------------------------------------------------------
 * FINAL TEST 14
 * --------------------------------------------------------
 */
console.log(
  "PASS: Lifecycle ENDED → SOFT DELETE berjalan dengan benar."
);

    /**
     * ========================================================
     * FINAL
     * ========================================================
     */
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "PROMOTION LIFECYCLE TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } finally {
    /**
     * --------------------------------------------------------
     * CLEANUP
     * --------------------------------------------------------
     */
    await cleanup();

    console.log("");
    console.log(
      "Test data dibersihkan."
    );
  }
}

/**
 * ============================================================
 * EXECUTE
 * ============================================================
 */
main()
  .catch(async (error) => {
    console.error("");
    console.error(
      "============================================================"
    );
    console.error(
      "PROMOTION LIFECYCLE TEST FAILED"
    );
    console.error(
      "============================================================"
    );

    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });