import { prisma } from "@/lib/prisma";
import PromotionRepository from "@/repositories/promotion/promotion.repository";

function assert(
  condition: unknown,
  message: string
) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}

async function main() {
  let skuId: string | null = null;

  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "PROMOTION SKU LOCK SERIALIZATION TEST"
    );
    console.log(
      "============================================================"
    );

    /**
     * ========================================================
     * 1. PREPARE SKU
     * ========================================================
     */

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

    assert(
      sku !== null,
      "FAIL: Tidak ada ProductSku aktif untuk lock test."
    );

    if (!sku) {
      throw new Error(
        "FAIL: Tidak ada ProductSku aktif untuk lock test."
      );
    }

    skuId = sku.id;

    console.log(
      "PASS: SKU test ditemukan.",
      {
        skuId: sku.id,
        sku: sku.sku,
      }
    );

    /**
     * ========================================================
     * 2. START TRANSACTION A
     * ========================================================
     */

    console.log("");
    console.log(
      "[A] Memulai transaction A..."
    );

    let transactionARelease:
      (() => void) | null =
      null;

    const transactionA =
      prisma.$transaction(
        async (tx) => {
          const acquiredAt =
            Date.now();

          await PromotionRepository.lockProductSkus(
            [skuId!],
            tx
          );

          console.log(
            "[A] SKU lock acquired.",
            {
              elapsedMs: 0,
            }
          );

          /**
           * Tahan lock selama 2 detik.
           *
           * Transaction B akan mencoba lock
           * SKU yang sama selama periode ini.
           */

          await new Promise<void>(
            (resolve) => {
              transactionARelease =
                resolve;
            }
          );

          console.log(
            "[A] Lock release requested.",
            {
              acquiredAt,
            }
          );
        }
      );

    /**
     * Beri transaction A waktu untuk
     * mendapatkan lock.
     */

    await sleep(300);

    /**
     * ========================================================
     * 3. START TRANSACTION B
     * ========================================================
     */

    console.log("");
    console.log(
      "[B] Memulai transaction B..."
    );

    const transactionBStartedAt =
      Date.now();

    let transactionBAcquiredAt:
      number | null =
      null;

    const transactionB =
      prisma.$transaction(
        async (tx) => {
          await PromotionRepository.lockProductSkus(
            [skuId!],
            tx
          );

          transactionBAcquiredAt =
            Date.now();

          console.log(
            "[B] SKU lock acquired."
          );
        }
      );

    /**
     * Pastikan B belum mendapatkan lock
     * selama A masih menahannya.
     */

    await sleep(500);

    assert(
      transactionBAcquiredAt ===
        null,
      "FAIL: Transaction B memperoleh SKU lock sebelum Transaction A melepaskan lock."
    );

    console.log(
      "PASS: Transaction B masih menunggu lock Transaction A."
    );

    /**
     * ========================================================
     * 4. RELEASE TRANSACTION A
     * ========================================================
     */

    console.log("");
    console.log(
      "[A] Melepaskan lock..."
    );

    assert(
      transactionARelease !== null,
      "FAIL: Release handler Transaction A tidak tersedia."
    );

    transactionARelease!();

    await transactionA;

    console.log(
      "[A] Transaction A selesai."
    );

    /**
     * ========================================================
     * 5. WAIT FOR TRANSACTION B
     * ========================================================
     */

    await transactionB;

    assert(
      transactionBAcquiredAt !==
        null,
      "FAIL: Transaction B tidak pernah memperoleh SKU lock."
    );

    const waitDuration =
      transactionBAcquiredAt! -
      transactionBStartedAt;

    console.log({
      transactionBWaitMs:
        waitDuration,
    });

    /**
     * B dimulai setelah A sudah memperoleh
     * lock, lalu B baru dapat memperoleh lock
     * setelah A selesai.
     *
     * Karena kita menunggu 500ms sebelum
     * release A, B seharusnya mengalami
     * blocking yang terukur.
     */

    assert(
      waitDuration >= 400,
      `FAIL: Transaction B tidak menunjukkan blocking yang diharapkan. Wait=${waitDuration}ms.`
    );

    console.log(
      "PASS: Transaction B menunggu row lock Transaction A."
    );

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "SKU LOCK SERIALIZATION TEST PASSED"
    );
    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "FATAL: SKU lock serialization test gagal."
    );
    console.error(error);

    process.exitCode = 1;
  } finally {
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
