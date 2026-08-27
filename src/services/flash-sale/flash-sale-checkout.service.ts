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

  private static async acquireUserPurchaseLock(
    tx: Prisma.TransactionClient,
    flashSaleItemId: string,
    userId: string
  ) {
    const lockKey =
      `${flashSaleItemId}:${userId}`;

    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${lockKey})
      )
    `;
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
     * ACQUIRE ALL USER LOCKS
     * ==========================================================
     *
     * Lock diambil dalam urutan deterministik.
     */

    for (
      const requirement of requirements
    ) {
      await this.acquireUserPurchaseLock(
        tx,
        requirement.flashSaleItemId,
        input.userId
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
       * Karena advisory transaction lock sudah diambil
       * untuk flashSaleItemId + userId, dua checkout paralel
       * dari user yang sama tidak dapat membaca usage yang sama
       * secara bersamaan.
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