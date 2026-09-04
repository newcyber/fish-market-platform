import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

async function main() {
  console.log();
  console.log("============================================================");
  console.log("=== GUEST → CUSTOMER CONCURRENT MERGE TEST ===");
  console.log("============================================================");

  let testUserId: string | null = null;

  const testEmail =
    `cart-merge-concurrency-${randomUUID()}@test.local`;

  const guestCartId = randomUUID();

  try {
    /**
     * ============================================================
     * 1. PREPARE PRODUCT / SKU
     * ============================================================
     */

    const skus = await prisma.productSku.findMany({
      where: {
        isActive: true,
        stock: {
          gt: 20,
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
        "Minimal membutuhkan 2 SKU aktif dengan stock > 20."
      );
    }

    const skuA = skus[0];
    const skuB = skus[1];

    console.log("FIXTURE:");
    console.log({
      testEmail,
      guestCartId,
      skuA,
      skuB,
    });

    /**
     * ============================================================
     * 2. CREATE ISOLATED TEST USER
     * ============================================================
     */

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Cart Merge Concurrency Test",
        password: "TEST_ONLY_CART_MERGE_CONCURRENCY_PASSWORD",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    testUserId = testUser.id;

    console.log();
    console.log("TEST USER:");
    console.log({
      testUserId,
    });

    /**
     * ============================================================
     * 3. PREPARE GUEST CART
     * ============================================================
     */

    console.log();
    console.log("TEST #1 - Guest SKU A x2");

    await CartService.addItem({
      owner: {
        type: "guest",
        guestCartId,
      },
      productId: skuA.productId,
      skuId: skuA.id,
      quantity: 2,
    });

    console.log("PASS");

    console.log();
    console.log("TEST #2 - Guest SKU B x1");

    await CartService.addItem({
      owner: {
        type: "guest",
        guestCartId,
      },
      productId: skuB.productId,
      skuId: skuB.id,
      quantity: 1,
    });

    console.log("PASS");

    /**
     * ============================================================
     * 4. PREPARE CUSTOMER CART
     * ============================================================
     */

    console.log();
    console.log("TEST #3 - Customer SKU A x3");

    await CartService.addItem({
      owner: {
        type: "customer",
        userId: testUserId,
      },
      productId: skuA.productId,
      skuId: skuA.id,
      quantity: 3,
    });

    console.log("PASS");

    /**
     * Verify baseline.
     */

    const beforeCustomerCart =
      await CartService.getCart({
        type: "customer",
        userId: testUserId,
      });

    const beforeGuestCart =
      await CartService.getCart({
        type: "guest",
        guestCartId,
      });

    if (!beforeCustomerCart) {
      throw new Error(
        "Customer cart tidak ditemukan sebelum concurrency test."
      );
    }

    if (!beforeGuestCart) {
      throw new Error(
        "Guest cart tidak ditemukan sebelum concurrency test."
      );
    }

    const beforeCustomerA =
      beforeCustomerCart.items.find(
        (item) => item.skuId === skuA.id
      );

    const beforeGuestA =
      beforeGuestCart.items.find(
        (item) => item.skuId === skuA.id
      );

    const beforeGuestB =
      beforeGuestCart.items.find(
        (item) => item.skuId === skuB.id
      );

    if (
      !beforeCustomerA ||
      beforeCustomerA.quantity !== 3
    ) {
      throw new Error(
        "Baseline customer SKU A harus x3."
      );
    }

    if (
      !beforeGuestA ||
      beforeGuestA.quantity !== 2
    ) {
      throw new Error(
        "Baseline guest SKU A harus x2."
      );
    }

    if (
      !beforeGuestB ||
      beforeGuestB.quantity !== 1
    ) {
      throw new Error(
        "Baseline guest SKU B harus x1."
      );
    }

    console.log();
    console.log(
      "Baseline customer: SKU A x3"
    );

    console.log(
      "Baseline guest    : SKU A x2, SKU B x1"
    );

    /**
     * ============================================================
     * 5. CONCURRENT MERGE
     * ============================================================
     *
     * Jalankan 10 merge secara bersamaan terhadap:
     *
     *   userId     = customer yang sama
     *   guestCartId = guest cart yang sama
     *
     * Promise.all() hanya menciptakan contention.
     *
     * Serialisasi sebenarnya harus dilakukan oleh:
     *
     *   Cart customer
     *   +
     *   Cart guest
     *   +
     *   FOR UPDATE
     *
     * di dalam transaction CartService.
     * ============================================================
     */

    console.log();
    console.log(
      "TEST #4 - 10 concurrent merge requests"
    );

    const requestNumbers = Array.from(
      { length: 10 },
      (_, index) => index + 1
    );

    const mergeResults =
      await Promise.all(
        requestNumbers.map(
          async (requestNumber) => {
            try {
              await CartService.mergeGuestCartIntoCustomerCart(
                {
                  userId: testUserId!,
                  guestCartId,
                }
              );

              return {
                requestNumber,
                success: true,
                error: null,
              };
            } catch (error: unknown) {
              return {
                requestNumber,
                success: false,
                error,
              };
            }
          }
        )
      );

    /**
     * Semua request seharusnya berhasil.
     *
     * Merge kedua dan seterusnya boleh menjadi no-op
     * setelah request pertama mengosongkan guest cart.
     *
     * Yang penting:
     *
     * - tidak ada Prisma error
     * - tidak ada deadlock
     * - tidak ada duplicate merge
     */

    const failedRequests =
      mergeResults.filter(
        (result) => !result.success
      );

    if (failedRequests.length > 0) {
      console.error();
      console.error(
        "Concurrent merge failures:"
      );

      for (const result of failedRequests) {
        console.error({
          requestNumber:
            result.requestNumber,
          error:
            result.error instanceof Error
              ? result.error.message
              : String(result.error),
        });
      }

      throw new Error(
        `${failedRequests.length} concurrent merge request gagal.`
      );
    }

    console.log(
      `Concurrent requests : ${mergeResults.length}`
    );

    console.log(
      `Successful merges   : ${
        mergeResults.filter(
          (result) => result.success
        ).length
      }`
    );

    console.log("PASS");

    /**
     * ============================================================
     * 6. VERIFY CUSTOMER RESULT
     * ============================================================
     */

    console.log();
    console.log(
      "TEST #5 - Verify customer final state"
    );

    const afterCustomerCart =
      await CartService.getCart({
        type: "customer",
        userId: testUserId,
      });

    if (!afterCustomerCart) {
      throw new Error(
        "Customer cart tidak ditemukan setelah concurrent merge."
      );
    }

    const finalCustomerA =
      afterCustomerCart.items.find(
        (item) => item.skuId === skuA.id
      );

    const finalCustomerB =
      afterCustomerCart.items.find(
        (item) => item.skuId === skuB.id
      );

    if (!finalCustomerA) {
      throw new Error(
        "Customer SKU A tidak ditemukan setelah merge."
      );
    }

    if (finalCustomerA.quantity !== 5) {
      throw new Error(
        `Customer SKU A expected x5, got x${finalCustomerA.quantity}.`
      );
    }

    if (!finalCustomerB) {
      throw new Error(
        "Customer SKU B tidak ditemukan setelah merge."
      );
    }

    if (finalCustomerB.quantity !== 1) {
      throw new Error(
        `Customer SKU B expected x1, got x${finalCustomerB.quantity}.`
      );
    }

    if (afterCustomerCart.items.length !== 2) {
      throw new Error(
        `Customer expected exactly 2 CartItems, got ${afterCustomerCart.items.length}.`
      );
    }

    console.log(
      "PASS: Customer SKU A = x5."
    );

    console.log(
      "PASS: Customer SKU B = x1."
    );

    console.log(
      "PASS: Tidak ada duplicate CartItem."
    );

    /**
     * ============================================================
     * 7. VERIFY GUEST CART EMPTY
     * ============================================================
     */

    console.log();
    console.log(
      "TEST #6 - Verify guest cart final state"
    );

    const afterGuestCart =
      await CartService.getCart({
        type: "guest",
        guestCartId,
      });

    if (!afterGuestCart) {
      throw new Error(
        "Guest cart hilang sebelum verifikasi."
      );
    }

    if (afterGuestCart.items.length !== 0) {
      throw new Error(
        `Guest cart expected empty, got ${afterGuestCart.items.length} items.`
      );
    }

    console.log(
      "PASS: Guest cart kosong."
    );

    /**
     * ============================================================
     * RESULT
     * ============================================================
     */

    console.log();
    console.log("============================================================");
    console.log("=== RESULT ===");
    console.log("============================================================");

    console.log(
      "ALL CONCURRENT MERGE TESTS PASSED"
    );
  } finally {
    /**
     * ============================================================
     * CLEANUP
     * ============================================================
     */

    console.log();
    console.log("CLEANUP");

    try {
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
    } catch (error) {
      console.error(
        "Guest cart cleanup failed:",
        error
      );
    }

    if (testUserId) {
      try {
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
      } catch (error) {
        console.error(
          "Test user cleanup failed:",
          error
        );
      }
    }

    console.log("Cleanup selesai.");
  }
}

main()
  .catch((error: unknown) => {
    console.error();
    console.error("TEST FAILED:");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(String(error));
    }

    process.exit(1);
  });
