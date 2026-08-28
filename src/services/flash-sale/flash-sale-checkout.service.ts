import {
  Prisma,
  FlashSaleStatus,
} from "@prisma/client";

/**
 * ============================================================
 * FLASH SALE CHECKOUT SERVICE
 * ============================================================
 *
 * Menangani consume Flash Sale pada checkout.
 *
 * HARUS dipanggil dari Prisma transaction yang sama dengan:
 *
 * - Create Order
 * - Voucher consumption
 * - Stock decrement
 * - Stock ledger
 *
 * Responsibilities:
 *
 * - Validasi campaign terbaru
 * - Validasi Flash Sale item
 * - Serialisasi per-user purchase limit
 * - Validasi quota
 * - Validasi per-user limit
 * - Atomic increment soldQuantity
 * - Create FlashSalePurchase
 * ============================================================
 */

export interface FlashSaleCheckoutRequirement {
  flashSaleItemId: string;

  quantity: number;

  /**
   * Harga Flash Sale per unit saat checkout.
   */
  price: Prisma.Decimal;
}

export interface ConsumeFlashSaleInput {
  userId: string;

  orderId: string;

  requirements:
    FlashSaleCheckoutRequirement[];
}

interface AggregatedFlashSaleRequirement {
  flashSaleItemId: string;

  quantity: number;

  price: Prisma.Decimal;
}

export default class FlashSaleCheckoutService {
  /**
   * ============================================================
   * ACQUIRE USER PURCHASE LOCK
   * ============================================================
   *
   * PostgreSQL transaction advisory lock.
   *
   * Lock dibuat berdasarkan kombinasi:
   *
   * flashSaleItemId + userId
   *
   * pg_advisory_xact_lock akan otomatis dilepas
   * ketika transaction commit atau rollback.
   */

  /**
 * ============================================================
 * ACQUIRE FLASH SALE ITEM LOCK
 * ============================================================
 *
 * PostgreSQL transaction advisory lock.
 *
 * Lock dibuat berdasarkan:
 *
 * flashSaleItemId
 *
 * BUKAN:
 *
 * flashSaleItemId + userId
 *
 * Alasannya:
 *
 * quota Flash Sale adalah GLOBAL per FlashSaleItem.
 *
 * Contoh:
 *
 * stockLimit = 1
 *
 * User A -> FlashSaleItem X
 * User B -> FlashSaleItem X
 *
 * Keduanya HARUS menggunakan lock yang sama.
 *
 * Dengan demikian:
 *
 * Transaction A
 *   -> acquire lock X
 *   -> cek quota
 *   -> consume
 *   -> commit
 *
 * Transaction B
 *   -> menunggu lock X
 *   -> acquire lock setelah A selesai
 *   -> membaca soldQuantity terbaru
 *   -> reject jika quota habis
 *
 * pg_advisory_xact_lock akan otomatis dilepas
 * ketika transaction commit atau rollback.
 */
private static async acquireFlashSaleItemLock(
  tx: Prisma.TransactionClient,
  flashSaleItemId: string
) {
  const lockStart =
    Date.now();

  const backend =
    await tx.$queryRaw<
      Array<{
        pid: number;
      }>
    >`
      SELECT pg_backend_pid() AS pid
    `;

  const pid =
    backend[0]?.pid ??
    0;

  console.log(
    "[FLASH-SALE-LOCK-WAIT]",
    {
      flashSaleItemId,
      pid,
      timestamp:
        new Date().toISOString(),
    }
  );

  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${flashSaleItemId})
    )
  `;

  console.log(
    "[FLASH-SALE-LOCK-ACQUIRED]",
    {
      flashSaleItemId,
      pid,
      waitedMs:
        Date.now() -
        lockStart,
      timestamp:
        new Date().toISOString(),
    }
  );
}

  /**
   * ============================================================
   * CONSUME
   * ============================================================
   */

  static async consume(
    input: ConsumeFlashSaleInput,
    tx: Prisma.TransactionClient
  ) {
    if (!input.userId) {
      throw new Error(
        "User ID wajib diisi untuk pembelian Flash Sale."
      );
    }

    if (!input.orderId) {
      throw new Error(
        "Order ID wajib diisi untuk pembelian Flash Sale."
      );
    }

    if (!input.requirements.length) {
      return;
    }

    /**
     * ==========================================================
     * AGGREGATE REQUIREMENTS
     * ==========================================================
     */

    const requirementsMap =
      new Map<
        string,
        AggregatedFlashSaleRequirement
      >();

    for (
      const requirement of input.requirements
    ) {
      if (
        !requirement.flashSaleItemId
      ) {
        throw new Error(
          "Flash Sale Item ID tidak valid."
        );
      }

      if (
        !Number.isInteger(
          requirement.quantity
        ) ||
        requirement.quantity <= 0
      ) {
        throw new Error(
          "Quantity Flash Sale tidak valid."
        );
      }

      const existing =
        requirementsMap.get(
          requirement.flashSaleItemId
        );

      if (existing) {
        existing.quantity +=
          requirement.quantity;
      } else {
        requirementsMap.set(
          requirement.flashSaleItemId,
          {
            flashSaleItemId:
              requirement.flashSaleItemId,

            quantity:
              requirement.quantity,

            price:
              new Prisma.Decimal(
                requirement.price
              ),
          }
        );
      }
    }

    /**
     * ==========================================================
     * SORT REQUIREMENTS
     * ==========================================================
     *
     * Urutan deterministik membantu mengurangi risiko deadlock
     * ketika satu order memiliki beberapa Flash Sale item.
     */

    const requirements =
      Array.from(
        requirementsMap.values()
      ).sort(
        (a, b) =>
          a.flashSaleItemId.localeCompare(
            b.flashSaleItemId
          )
      );

/**
 * ==========================================================
 * ACQUIRE ALL FLASH SALE ITEM LOCKS
 * ==========================================================
 *
 * FlashSaleItem adalah serialization boundary global
 * untuk quota Flash Sale.
 *
 * Semua requirement sudah diurutkan berdasarkan
 * flashSaleItemId sehingga setiap transaction memperoleh
 * advisory lock dalam urutan deterministik.
 *
 * Tidak digunakan user-level advisory lock di sini.
 *
 * Alasannya:
 *
 * - quota Flash Sale bersifat global per FlashSaleItem
 * - checkout customer berbeda harus tetap bersaing
 *   pada lock FlashSaleItem yang sama
 * - satu lock global lebih sederhana
 * - mengurangi jumlah resource yang dikunci
 * - mengurangi risiko deadlock lintas resource
 */

for (
  const requirement of requirements
) {
  await this.acquireFlashSaleItemLock(
    tx,
    requirement.flashSaleItemId
  );
}

    /**
     * ==========================================================
     * CONSUME EACH FLASH SALE ITEM
     * ==========================================================
     */

    for (
      const requirement of requirements
    ) {
      /**
       * ========================================================
       * GET CURRENT FLASH SALE ITEM
       * ========================================================
       */

      const flashSaleItem =
        await tx.flashSaleItem.findUnique({
          where: {
            id:
              requirement.flashSaleItemId,
          },

          include: {
            flashSale: {
              select: {
                id: true,

                status: true,

                startAt: true,

                endAt: true,

                deletedAt: true,
              },
            },
          },
        });

      if (!flashSaleItem) {
        throw new Error(
          "Item Flash Sale sudah tidak tersedia."
        );
      }

      const backend =
  await tx.$queryRaw<
    Array<{
      pid: number;
    }>
  >`
    SELECT pg_backend_pid() AS pid
  `;

console.log(
  "[FLASH-SALE-STATE]",
  {
    flashSaleItemId:
      flashSaleItem.id,

    orderId:
      input.orderId,

    userId:
      input.userId,

    pid:
      backend[0]?.pid ?? 0,

    stockLimit:
      flashSaleItem.stockLimit,

    soldQuantity:
      flashSaleItem.soldQuantity,

    requestedQuantity:
      requirement.quantity,

    remainingQuantity:
      flashSaleItem.stockLimit -
      flashSaleItem.soldQuantity,

    timestamp:
      new Date().toISOString(),
  }
);

      /**
       * ========================================================
       * VALIDATE ITEM
       * ========================================================
       */

      if (!flashSaleItem.isActive) {
        throw new Error(
          "Item Flash Sale sudah tidak aktif."
        );
      }

      /**
       * ========================================================
       * VALIDATE CAMPAIGN
       * ========================================================
       */

      const now =
        new Date();

      if (
        flashSaleItem.flashSale.deletedAt ||
        flashSaleItem.flashSale.status !==
          FlashSaleStatus.ACTIVE ||
        flashSaleItem.flashSale.startAt >
          now ||
        flashSaleItem.flashSale.endAt <=
          now
      ) {
        throw new Error(
          "Flash Sale sudah tidak aktif atau telah berakhir."
        );
      }

      /**
       * ========================================================
       * VALIDATE QUOTA
       * ========================================================
       */

const remainingQuantity =
  flashSaleItem.stockLimit -
  flashSaleItem.soldQuantity;

      if (
        remainingQuantity <
        requirement.quantity
      ) {
        throw new Error(
          `Kuota Flash Sale tidak mencukupi. Sisa kuota: ${Math.max(
            0,
            remainingQuantity
          )}.`
        );
      }

      /**
       * ========================================================
       * VALIDATE PER USER LIMIT
       * ========================================================
       *
       /**
 /**
 * Karena advisory transaction lock sudah diambil
 * berdasarkan flashSaleItemId, seluruh checkout
 * terhadap FlashSaleItem yang sama akan diproses
 * secara serial dalam transaction.
 *
 * Ini mencakup:
 *
 * - checkout dari user yang sama
 * - checkout dari user berbeda
 *
 * Dengan demikian pembacaan usage per-user dan
 * perubahan quota terjadi setelah transaction memperoleh
 * lock FlashSaleItem terbaru.
 */

      if (
        flashSaleItem.perUserLimit !==
        null
      ) {
        const usage =
          await tx.flashSalePurchase.aggregate({
            where: {
              flashSaleItemId:
                flashSaleItem.id,

              userId:
                input.userId,
            },

            _sum: {
              quantity: true,
            },
          });

        const userPurchasedQuantity =
          usage._sum.quantity ?? 0;

        const nextQuantity =
          userPurchasedQuantity +
          requirement.quantity;

        if (
          nextQuantity >
          flashSaleItem.perUserLimit
        ) {
          throw new Error(
            `Batas pembelian Flash Sale adalah ${flashSaleItem.perUserLimit} item per customer.`
          );
        }
      }

      /**
 * ========================================================
 * VALIDATE CHECKOUT PRICE
 * ========================================================
 *
 * Harga yang digunakan checkout harus sama
 * dengan harga Flash Sale terbaru.
 */
const checkoutPrice =
  new Prisma.Decimal(
    requirement.price
  );

if (
  !checkoutPrice.equals(
    flashSaleItem.flashPrice
  )
) {
  throw new Error(
    "Harga Flash Sale berubah. Silakan refresh keranjang dan coba checkout kembali."
  );
}

      /**
       * ========================================================
       * GUARDED QUOTA CONSUMPTION
       * ========================================================
       */

      const updated =
        await tx.flashSaleItem.updateMany({
          where: {
            id:
              flashSaleItem.id,

            isActive:
              true,

            soldQuantity: {
              lte:
                flashSaleItem.stockLimit -
                requirement.quantity,
            },
          },

          data: {
            soldQuantity: {
              increment:
                requirement.quantity,
            },
          },
        });

        console.log(
  "[FLASH-SALE-QUOTA-UPDATE]",
  {
    flashSaleItemId:
      flashSaleItem.id,

    orderId:
      input.orderId,

    userId:
      input.userId,

    requestedQuantity:
      requirement.quantity,

    updatedCount:
      updated.count,

    expectedSoldQuantity:
      flashSaleItem.soldQuantity +
      requirement.quantity,

    timestamp:
      new Date().toISOString(),
  }
);

      if (
        updated.count !== 1
      ) {
        throw new Error(
          "Kuota Flash Sale baru saja habis. Silakan coba lagi."
        );
      }

      /**
       * ========================================================
       * CREATE FLASH SALE PURCHASE
       * ========================================================
       */

      await tx.flashSalePurchase.create({
        data: {
          flashSaleItemId:
            flashSaleItem.id,

          userId:
            input.userId,

          orderId:
            input.orderId,

          quantity:
            requirement.quantity,

          price:
            flashSaleItem.flashPrice,
        },
      });
    }
  }
}