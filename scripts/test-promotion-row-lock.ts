import { prisma } from "@/lib/prisma";

const TEST_PREFIX =
  "test-promotion-row-lock";

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
     * ========================================================
     * TEST 1 - CREATE PROMOTION
     * ========================================================
     */

    section(
      1,
      "CREATE TEST PROMOTION"
    );

    const now = new Date();

    const promotion =
      await prisma.promotion.create({
        data: {
          name:
            `${TEST_PREFIX} ${Date.now()}`,

          slug:
            `${TEST_PREFIX}-${Date.now()}`,

          status: "ACTIVE",

          startAt:
            new Date(
              now.getTime() -
                60 * 1000
            ),

          endAt:
            new Date(
              now.getTime() +
                60 * 60 * 1000
            ),

          type:
            "MARKETING",
        },
      });

    promotionId =
      promotion.id;

    console.log({
      promotionId:
        promotion.id,

      status:
        promotion.status,
    });

    console.log(
      "PASS: Test promotion berhasil dibuat."
    );

    /**
     * ========================================================
     * TEST 2 - TRANSACTION A ACQUIRE LOCK
     * ========================================================
     */

    section(
      2,
      "TRANSACTION A ACQUIRE ROW LOCK"
    );

    let releaseTransactionA:
  (() => void) | undefined;

const transactionA =
  prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw<
        Array<{
          id: string;
        }>
      >`
        SELECT "id"
        FROM "Promotion"
        WHERE "id" = ${promotionId}
          AND "deletedAt" IS NULL
        FOR UPDATE
      `;

      console.log(
        "[A] Promotion row lock acquired."
      );

      await new Promise<void>(
        (resolve) => {
          releaseTransactionA =
            resolve;
        }
      );

      console.log(
        "[A] Releasing lock..."
      );
    }
  );

    /**
     * Beri transaction A waktu
     * untuk benar-benar memperoleh lock.
     */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          200
        )
    );

    assert(
      releaseTransactionA !==
        null,
      "FAIL: Transaction A belum memperoleh lock."
    );

    /**
     * ========================================================
     * TEST 3 - TRANSACTION B MUST WAIT
     * ========================================================
     */

    section(
      3,
      "TRANSACTION B WAITS FOR LOCK"
    );

    const startedAt =
      Date.now();

    let transactionBResolvedAt:
      number | null =
      null;

    const transactionB =
      prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw<
            Array<{
              id: string;
            }>
          >`
            SELECT "id"
            FROM "Promotion"
            WHERE "id" = ${promotionId}
              AND "deletedAt" IS NULL
            FOR UPDATE
          `;

          transactionBResolvedAt =
            Date.now();

          console.log(
            "[B] Promotion row lock acquired."
          );
        }
      );

    /**
     * Pastikan B belum selesai
     * ketika A masih memegang lock.
     */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          300
        )
    );

    assert(
      transactionBResolvedAt ===
        null,
      "FAIL: Transaction B memperoleh lock sebelum Transaction A melepaskannya."
    );

    const waitingMs =
      Date.now() -
      startedAt;

    console.log({
      transactionBWaitingMs:
        waitingMs,
    });

    console.log(
      "PASS: Transaction B masih menunggu row lock Transaction A."
    );

    /**
     * ========================================================
     * TEST 4 - RELEASE A
     * ========================================================
     */

    section(
      4,
      "RELEASE TRANSACTION A"
    );

if (!releaseTransactionA) {
  throw new Error(
    "FAIL: Release handler Transaction A tidak tersedia."
  );
}

releaseTransactionA();

    await transactionA;

    console.log(
      "PASS: Transaction A selesai dan lock dilepaskan."
    );

    /**
     * ========================================================
     * TEST 5 - VERIFY B ACQUIRES LOCK
     * ========================================================
     */

    section(
      5,
      "VERIFY TRANSACTION B ACQUIRES LOCK"
    );

    await transactionB;

    if (transactionBResolvedAt === null) {
  throw new Error(
    "FAIL: Transaction B tidak pernah memperoleh lock."
  );
}

const totalWaitMs =
  transactionBResolvedAt -
  startedAt;

    console.log({
      transactionBTotalWaitMs:
        totalWaitMs,
    });

    assert(
      totalWaitMs >= 250,
      `FAIL: Transaction B tidak terlihat menunggu lock secara nyata. Wait: ${totalWaitMs}ms.`
    );

    console.log(
      "PASS: Transaction B memperoleh lock setelah Transaction A commit."
    );

    /**
     * ========================================================
     * TEST 6 - FINAL VERIFICATION
     * ========================================================
     */

    section(
      6,
      "FINAL VERIFICATION"
    );

    const finalPromotion =
      await prisma.promotion.findUnique({
        where: {
          id:
            promotionId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (!finalPromotion) {
  throw new Error(
    "FAIL: Test promotion tidak ditemukan."
  );
}

assert(
  finalPromotion.status ===
    "ACTIVE",
  `FAIL: Status promotion berubah secara tidak semestinya: ${finalPromotion.status}`
);

    console.log(
      finalPromotion
    );

    console.log(
      "PASS: Row lock tidak mengubah business state."
    );

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "PROMOTION ROW LOCK TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "FATAL: Promotion row-lock test gagal."
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
      if (promotionId) {
        await prisma.promotionItem.deleteMany({
          where: {
            promotionId,
          },
        });

        await prisma.promotion.delete({
          where: {
            id:
              promotionId,
          },
        });

        console.log(
          "PASS: Test promotion dihapus."
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
