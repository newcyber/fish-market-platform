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
=== GUEST → CUSTOMER ATOMIC ROLLBACK TEST ===
============================================================
`);

  /**
   * ----------------------------------------------------------
   * FIXTURE
   * ----------------------------------------------------------
   *
   * Gunakan dua SKU aktif.
   */
  const skus =
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

  if (skus.length < 2) {
    throw new Error(
      "Test membutuhkan minimal 2 active SKU dengan stock > 0."
    );
  }

  const skuA = skus[0];
  const skuB = skus[1];

  /**
   * ----------------------------------------------------------
   * CREATE ISOLATED TEST USER
   * ----------------------------------------------------------
   *
   * Kita tidak menyentuh customer production.
   *
   * Sesuaikan field jika model User Anda mempunyai field
   * wajib tambahan.
   */
const testEmail =
  `cart-merge-atomic-${randomUUID()}@test.local`;

let testUserId: string | null = null;
const guestCartId = randomUUID();

try {
  const testUser =
    await prisma.user.create({
      data: {
        email: testEmail,
        name: "Cart Merge Atomic Test",
        password: "TEST_ONLY_CART_MERGE_PASSWORD",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

  testUserId = testUser.id;

    console.log("FIXTURE:");
    console.log({
      testUserId,
      testEmail,
      guestCartId,
      skuA,
      skuB,
    });

    /**
     * ========================================================
     * TEST #1
     * Guest A ×2
     * ========================================================
     */
    console.log("\nTEST #1 - Guest SKU A x2");

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
     * ========================================================
     * TEST #2
     * Guest B ×1
     * ========================================================
     */
    console.log("\nTEST #2 - Guest SKU B x1");

    await CartService.addItem({
      owner: {
        type: "guest",
        guestCartId,
      },

      productId: skuB.productId,
      skuId: skuB.id,
      quantity: 1,
    });

    /**
     * ========================================================
     * TEST #3
     * Create customer cart with SKU A ×3
     * ========================================================
     */
    console.log("\nTEST #3 - Customer SKU A x3");

    await CartService.addItem({
      owner: {
        type: "customer",
        userId: testUserId,
      },

      productId: skuA.productId,
      skuId: skuA.id,
      quantity: 3,
    });

    /**
     * --------------------------------------------------------
     * SNAPSHOT BEFORE FAILURE
     * --------------------------------------------------------
     */
    const customerBefore =
      await prisma.cart.findUnique({
        where: {
          userId: testUserId,
        },

        select: {
          id: true,

          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              productId: true,
              skuId: true,
              quantity: true,
              price: true,
              customerNote: true,
              isFlashSaleApplied: true,
              flashSaleId: true,
              flashSaleItemId: true,
            },
          },
        },
      });

    const guestBefore =
      await prisma.cart.findUnique({
        where: {
          guestCartId,
        },

        select: {
          id: true,

          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              productId: true,
              skuId: true,
              quantity: true,
              price: true,
              customerNote: true,
              isFlashSaleApplied: true,
              flashSaleId: true,
              flashSaleItemId: true,
            },
          },
        },
      });

    assert(
      customerBefore?.items.length === 1,
      "Customer memiliki 1 item sebelum merge."
    );

    assert(
      guestBefore?.items.length === 2,
      "Guest memiliki 2 item sebelum merge."
    );

    /**
     * ========================================================
     * TEST #4
     * Paksa SKU B menjadi inactive
     * ========================================================
     *
     * Tujuan:
     * item pertama (SKU A) akan diproses terlebih dahulu,
     * kemudian SKU B harus gagal.
     *
     * Karena seluruh merge atomic, perubahan SKU A harus
     * ikut rollback.
     */
    console.log(
      "\nTEST #4 - Disable SKU B untuk memicu rollback"
    );

    await prisma.productSku.update({
      where: {
        id: skuB.id,
      },

      data: {
        isActive: false,
      },
    });

    /**
     * ========================================================
     * TEST #5
     * MERGE HARUS GAGAL
     * ========================================================
     */
    console.log("\nTEST #5 - Merge harus gagal");

    let mergeFailed = false;

    try {
      await CartService.mergeGuestCartIntoCustomerCart({
        userId: testUserId,
        guestCartId,
      });
} catch (error: unknown) {
  mergeFailed = true;

  console.log(
    "Expected merge error:",
    error instanceof Error
      ? error.message
      : String(error)
  );
}

    assert(
      mergeFailed,
      "Merge gagal ketika guest memiliki SKU inactive."
    );

    /**
     * ========================================================
     * RESTORE SKU B BEFORE VERIFICATION
     * ========================================================
     */
    await prisma.productSku.update({
      where: {
        id: skuB.id,
      },

      data: {
        isActive: true,
      },
    });

    /**
     * ========================================================
     * TEST #6
     * CUSTOMER MUST BE UNCHANGED
     * ========================================================
     */
    console.log(
      "\nTEST #6 - Verify customer rollback"
    );

    const customerAfter =
      await prisma.cart.findUnique({
        where: {
          userId: testUserId,
        },

        select: {
          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              productId: true,
              skuId: true,
              quantity: true,
              price: true,
              customerNote: true,
              isFlashSaleApplied: true,
              flashSaleId: true,
              flashSaleItemId: true,
            },
          },
        },
      });

    assert(
      JSON.stringify(customerAfter?.items) ===
        JSON.stringify(customerBefore?.items),
      "Customer cart kembali persis seperti sebelum merge."
    );

    /**
     * ========================================================
     * TEST #7
     * GUEST MUST BE UNCHANGED
     * ========================================================
     */
    console.log(
      "\nTEST #7 - Verify guest rollback"
    );

    const guestAfter =
      await prisma.cart.findUnique({
        where: {
          guestCartId,
        },

        select: {
          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              productId: true,
              skuId: true,
              quantity: true,
              price: true,
              customerNote: true,
              isFlashSaleApplied: true,
              flashSaleId: true,
              flashSaleItemId: true,
            },
          },
        },
      });

    assert(
      JSON.stringify(guestAfter?.items) ===
        JSON.stringify(guestBefore?.items),
      "Guest cart tetap persis seperti sebelum merge."
    );

    /**
     * ========================================================
     * TEST #8
     * RETRY AFTER RESTORE
     * ========================================================
     *
     * Setelah SKU B aktif kembali, merge harus bisa berhasil.
     */
    console.log(
      "\nTEST #8 - Retry merge setelah SKU B aktif"
    );

    await CartService.mergeGuestCartIntoCustomerCart({
      userId: testUserId,
      guestCartId,
    });

    const customerMerged =
      await prisma.cart.findUnique({
        where: {
          userId: testUserId,
        },

        select: {
          items: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              skuId: true,
              quantity: true,
            },
          },
        },
      });

    const mergedA =
      customerMerged?.items.find(
        (item) => item.skuId === skuA.id
      );

    const mergedB =
      customerMerged?.items.find(
        (item) => item.skuId === skuB.id
      );

    assert(
      mergedA?.quantity === 5,
      "Retry merge menghasilkan SKU A x5."
    );

    assert(
      mergedB?.quantity === 1,
      "Retry merge menghasilkan SKU B x1."
    );

    const guestFinal =
      await prisma.cart.findUnique({
        where: {
          guestCartId,
        },

        select: {
          items: {
            select: {
              id: true,
            },
          },
        },
      });

    assert(
      guestFinal?.items.length === 0,
      "Guest cart kosong setelah retry berhasil."
    );

    console.log(`
============================================================
=== RESULT ===
============================================================

ALL ATOMIC ROLLBACK TESTS PASSED
`);
  } finally {
    /**
     * --------------------------------------------------------
     * CLEANUP
     * --------------------------------------------------------
     */

    /**
     * Pastikan SKU B aktif kembali.
     */
    await prisma.productSku.update({
      where: {
        id: skuB.id,
      },

      data: {
        isActive: true,
      },
    });

    if (testUserId) {
      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId: testUserId,
          },
        },
      });

      await prisma.cart.deleteMany({
        where: {
          userId: testUserId,
        },
      });

      await prisma.user.delete({
        where: {
          id: testUserId,
        },
      });
    }

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
  }
}

main()
  .catch((error) => {
    console.error(`
============================================================
=== ATOMIC ROLLBACK TEST FAILED ===
============================================================
`);

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
