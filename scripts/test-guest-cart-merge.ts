import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

function assert(
  condition: unknown,
  message: string
) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }

  console.log(`PASS: ${message}`);
}

async function main() {
  console.log(`
============================================================
=== GUEST → CUSTOMER CART MERGE TEST ===
============================================================
`);

  /**
   * ----------------------------------------------------------
   * FIXTURE
   * ----------------------------------------------------------
   */

  const skuFixtures =
    await prisma.productSku.findMany({
      where: {
        isActive: true,
        stock: {
          gt: 0,
        },
        product: {
          deletedAt: null,
          isPublished: true,
        },
      },

      select: {
        id: true,
        sku: true,
        productId: true,
        stock: true,
      },

      orderBy: {
        createdAt: "asc",
      },

      take: 2,
    });

  if (skuFixtures.length < 2) {
    throw new Error(
      "Test membutuhkan minimal 2 active SKU dengan stock > 0."
    );
  }

  const skuA = skuFixtures[0];
  const skuB = skuFixtures[1];

  /**
   * Cari customer test yang aktif.
   *
   * Kita tidak membuat User baru agar tidak mengganggu
   * data customer production.
   */
  const customer =
    await prisma.user.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
      },

      select: {
        id: true,
        email: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  if (!customer) {
    throw new Error(
      "Tidak ditemukan active customer untuk fixture."
    );
  }

  const guestCartId = randomUUID();

  console.log("FIXTURE:");
  console.log({
    customerId: customer.id,
    customerEmail: customer.email,
    guestCartId,
    skuA,
    skuB,
  });

  /**
   * ----------------------------------------------------------
   * CLEANUP PREVIOUS TEST DATA
   * ----------------------------------------------------------
   */

  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        guestCartId,
      },
    },
  });

  await prisma.cart.deleteMany({
    where: {
      guestCartId,
    },
  });

  /**
   * ----------------------------------------------------------
   * SNAPSHOT CUSTOMER CART
   * ----------------------------------------------------------
   *
   * Kita simpan kondisi customer sebelum test supaya
   * setelah test bisa dikembalikan ke kondisi awal.
   */
  const customerCartBefore =
    await prisma.cart.findUnique({
      where: {
        userId: customer.id,
      },

      select: {
        id: true,

        items: {
          select: {
            id: true,
            productId: true,
            skuId: true,
            quantity: true,
            price: true,
            customerNote: true,
            isFlashSaleApplied: true,
            flashSaleId: true,
            flashSaleItemId: true,
            productVariant: true,
            productWeight: true,
            weightSku: true,
          },
        },
      },
    });

  /**
   * ==========================================================
   * TEST #1
   * Guest add SKU A x2
   * ==========================================================
   */

  console.log("\nTEST #1 - Guest add SKU A x2");

  await CartService.addItem({
    owner: {
      type: "guest",
      guestCartId,
    },

    productId: skuA.productId,
    skuId: skuA.id,
    quantity: 2,
  });

  /**
   * ==========================================================
   * TEST #2
   * Guest add SKU B x1
   * ==========================================================
   */

  console.log("\nTEST #2 - Guest add SKU B x1");

  await CartService.addItem({
    owner: {
      type: "guest",
      guestCartId,
    },

    productId: skuB.productId,
    skuId: skuB.id,
    quantity: 1,
  });

  const guestBefore =
    await CartService.getCart({
      type: "guest",
      guestCartId,
    });

  assert(
    guestBefore?.items.length === 2,
    "Guest cart memiliki 2 SKU."
  );

  /**
   * ==========================================================
   * TEST #3
   * Customer add SKU A x3
   * ==========================================================
   */

  console.log("\nTEST #3 - Customer add SKU A x3");

  await CartService.addItem({
    owner: {
      type: "customer",
      userId: customer.id,
    },

    productId: skuA.productId,
    skuId: skuA.id,
    quantity: 3,
  });

  const customerBeforeMerge =
    await CartService.getCart({
      type: "customer",
      userId: customer.id,
    });

  const customerItemBeforeMerge =
    customerBeforeMerge?.items.find(
      (item) => item.skuId === skuA.id
    );

  assert(
    !!customerItemBeforeMerge,
    "Customer memiliki SKU A sebelum merge."
  );

  /**
   * ==========================================================
   * TEST #4
   * MERGE
   * ==========================================================
   */

  console.log("\nTEST #4 - Guest → Customer merge");

  await CartService.mergeGuestCartIntoCustomerCart({
    userId: customer.id,
    guestCartId,
  });

  /**
   * ==========================================================
   * TEST #5
   * Customer SKU A = 5
   * ==========================================================
   */

  console.log("\nTEST #5 - Verify merged quantity");

  const customerAfterMerge =
    await CartService.getCart({
      type: "customer",
      userId: customer.id,
    });

  const mergedSkuA =
    customerAfterMerge?.items.find(
      (item) => item.skuId === skuA.id
    );

  const mergedSkuB =
    customerAfterMerge?.items.find(
      (item) => item.skuId === skuB.id
    );

  assert(
    mergedSkuA?.quantity === 5,
    "SKU A berhasil digabung menjadi quantity 5."
  );

  assert(
    mergedSkuB?.quantity === 1,
    "SKU B berhasil dipindahkan menjadi quantity 1."
  );

  /**
   * ==========================================================
   * TEST #6
   * Guest cart kosong
   * ==========================================================
   */

  console.log("\nTEST #6 - Verify guest cart emptied");

  const guestAfterMerge =
    await CartService.getCart({
      type: "guest",
      guestCartId,
    });

  assert(
    guestAfterMerge?.items.length === 0,
    "Guest cart kosong setelah merge."
  );

  /**
   * ==========================================================
   * TEST #7
   * SECOND MERGE
   * ==========================================================
   *
   * Merge ulang tidak boleh menggandakan quantity.
   */

  console.log("\nTEST #7 - Merge ulang");

  await CartService.mergeGuestCartIntoCustomerCart({
    userId: customer.id,
    guestCartId,
  });

  const customerAfterSecondMerge =
    await CartService.getCart({
      type: "customer",
      userId: customer.id,
    });

  const skuAAfterSecondMerge =
    customerAfterSecondMerge?.items.find(
      (item) => item.skuId === skuA.id
    );

  assert(
    skuAAfterSecondMerge?.quantity === 5,
    "Merge kedua tidak menggandakan quantity."
  );

  /**
   * ==========================================================
   * CLEANUP SUCCESS CASE
   * ==========================================================
   */

  console.log("\nCLEANUP - Restore customer cart");

  /**
   * Hapus item yang dibuat test berdasarkan SKU.
   *
   * Karena customer bisa memiliki data asli dengan SKU yang sama,
   * kita restore menggunakan snapshot jika cart memang sudah ada.
   */
  if (customerCartBefore) {
    await prisma.$transaction(
      async (tx) => {
        /**
         * Hapus seluruh test mutation untuk SKU yang digunakan.
         */
        await tx.cartItem.deleteMany({
          where: {
            cartId: customerCartBefore.id,
            skuId: {
              in: [
                skuA.id,
                skuB.id,
              ],
            },
          },
        });

        /**
         * Restore snapshot.
         */
        for (
          const item of
            customerCartBefore.items
        ) {
          await tx.cartItem.create({
            data: {
              id: item.id,
              cartId: customerCartBefore.id,
              productId: item.productId,
              skuId: item.skuId,

              productVariant:
                item.productVariant,

              productWeight:
                item.productWeight,

              weightSku:
                item.weightSku,

              customerNote:
                item.customerNote,

              quantity:
                item.quantity,

              price:
                item.price,

              isFlashSaleApplied:
                item.isFlashSaleApplied,

              flashSaleId:
                item.flashSaleId,

              flashSaleItemId:
                item.flashSaleItemId,
            },
          });
        }
      }
    );
  } else {
    /**
     * Customer sebelumnya tidak mempunyai Cart.
     *
     * Hapus Cart yang dibuat test.
     */
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: customer.id,
        },

        skuId: {
          in: [
            skuA.id,
            skuB.id,
          ],
        },
      },
    });

    const remainingCustomerItems =
      await prisma.cartItem.count({
        where: {
          cart: {
            userId: customer.id,
          },
        },
      });

    if (remainingCustomerItems === 0) {
      await prisma.cart.deleteMany({
        where: {
          userId: customer.id,
        },
      });
    }
  }

  /**
   * Guest cart cleanup.
   */
  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        guestCartId,
      },
    },
  });

  await prisma.cart.deleteMany({
    where: {
      guestCartId,
    },
  });

  console.log(`
============================================================
=== RESULT ===
============================================================

ALL BASIC GUEST → CUSTOMER MERGE TESTS PASSED
`);
}

main()
  .catch((error) => {
    console.error(`
============================================================
=== GUEST → CUSTOMER MERGE TEST FAILED ===
============================================================
`);

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
