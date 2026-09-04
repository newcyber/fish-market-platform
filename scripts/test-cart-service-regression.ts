import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";
import { CartError } from "@/services/cart/cart.error";

function assertCartError(
  error: unknown,
  expectedCode: string,
  testName: string
) {
  if (!(error instanceof CartError)) {
    throw new Error(
      `${testName}: Expected CartError, got ${
        error instanceof Error ? error.constructor.name : typeof error
      }.`
    );
  }

  if (error.code !== expectedCode) {
    throw new Error(
      `${testName}: Expected error code ${expectedCode}, got ${error.code}.`
    );
  }

  console.log(`PASS (${error.code})`);
}

async function expectCartError(
  action: () => Promise<unknown>,
  expectedCode: string,
  testName: string
) {
  try {
    await action();

    throw new Error(
      `${testName}: Expected CartError ${expectedCode}, but operation succeeded.`
    );
  } catch (error) {
    assertCartError(error, expectedCode, testName);
  }
}

async function main() {
  console.log("============================================================");
  console.log("=== CART SERVICE REGRESSION TEST ===");
  console.log("============================================================");

  /**
   * ------------------------------------------------------------
   * 1. Find two safe CUSTOMER users.
   * ------------------------------------------------------------
   *
   * We intentionally choose customers with the oldest creation
   * order so the test is deterministic.
   *
   * Existing carts are also safe because we clear them before
   * testing and again during cleanup.
   */
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 2,
  });

  if (users.length < 2) {
    throw new Error(
      "Dibutuhkan minimal 2 CUSTOMER aktif untuk ownership regression test."
    );
  }

  const [userA, userB] = users;

  console.log();
  console.log("TEST USER A");
  console.log(`id    : ${userA.id}`);
  console.log(`email : ${userA.email}`);

  console.log();
  console.log("TEST USER B");
  console.log(`id    : ${userB.id}`);
  console.log(`email : ${userB.email}`);

  /**
   * ------------------------------------------------------------
   * 2. Find product with at least two active SKUs with stock.
   * ------------------------------------------------------------
   */
  const productCandidates = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      skus: {
        some: {
          isActive: true,
          stock: {
            gt: 0,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      skus: {
        where: {
          isActive: true,
          stock: {
            gt: 0,
          },
        },
        select: {
          id: true,
          sku: true,
          price: true,
          stock: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 2,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 20,
  });

  const product = productCandidates.find(
    (candidate) => candidate.skus.length >= 2
  );

  if (!product) {
    throw new Error(
      "Tidak ditemukan product published dengan minimal 2 active SKU dan stock > 0."
    );
  }

  const [skuA, skuB] = product.skus;

  console.log();
  console.log("TEST PRODUCT");
  console.log(`product : ${product.name}`);
  console.log(`id      : ${product.id}`);

  console.log();
  console.log("SKU A");
  console.log(`id    : ${skuA.id}`);
  console.log(`sku   : ${skuA.sku}`);
  console.log(`price : ${skuA.price}`);
  console.log(`stock : ${skuA.stock}`);

  console.log();
  console.log("SKU B");
  console.log(`id    : ${skuB.id}`);
  console.log(`sku   : ${skuB.sku}`);
  console.log(`price : ${skuB.price}`);
  console.log(`stock : ${skuB.stock}`);

  /**
   * ------------------------------------------------------------
   * 3. Find another product/SKU for wrong-SKU test.
   * ------------------------------------------------------------
   */
  const wrongSku = await prisma.productSku.findFirst({
    where: {
      productId: {
        not: product.id,
      },
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
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!wrongSku) {
    throw new Error(
      "Tidak ditemukan active SKU dari product lain untuk test SKU_NOT_AVAILABLE."
    );
  }

  console.log();
  console.log("WRONG SKU");
  console.log(`id        : ${wrongSku.id}`);
  console.log(`sku       : ${wrongSku.sku}`);
  console.log(`productId : ${wrongSku.productId}`);

  /**
   * ------------------------------------------------------------
   * 4. Prepare clean carts.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("PREPARE - Clear test carts");

  await CartService.getOrCreateCart({
    type: "customer",
    userId: userA.id,
  });

  await CartService.getOrCreateCart({
    type: "customer",
    userId: userB.id,
  });

  await CartService.clearCart({
    type: "customer",
    userId: userA.id,
  });

  await CartService.clearCart({
    type: "customer",
    userId: userB.id,
  });

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 5. TEST #1
   *
   * Add SKU A x 1
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #1 - Add SKU A x 1");

  await CartService.addItem({
    owner: {
      type: "customer",
      userId: userA.id,
    },
    productId: product.id,
    skuId: skuA.id,
    quantity: 1,
  });

  let cart = await CartService.getCart({
    type: "customer",
    userId: userA.id,
  });

  if (!cart) {
    throw new Error("Cart tidak ditemukan setelah addItem.");
  }

  if (cart.items.length !== 1) {
    throw new Error(
      `Expected 1 CartItem, got ${cart.items.length}.`
    );
  }

  if (cart.items[0].skuId !== skuA.id) {
    throw new Error("CartItem SKU A tidak sesuai.");
  }

  if (cart.items[0].quantity !== 1) {
    throw new Error(
      `Expected quantity 1, got ${cart.items[0].quantity}.`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 6. TEST #2
   *
   * Same SKU must merge.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #2 - Add same SKU A x 2");

  await CartService.addItem({
    owner: {
      type: "customer",
      userId: userA.id,
    },
    productId: product.id,
    skuId: skuA.id,
    quantity: 2,
  });

  cart = await CartService.getCart({
    type: "customer",
    userId: userA.id,
  });

  if (!cart) {
    throw new Error("Cart tidak ditemukan.");
  }

  if (cart.items.length !== 1) {
    throw new Error(
      `Expected 1 CartItem after same-SKU add, got ${cart.items.length}.`
    );
  }

  if (cart.items[0].quantity !== 3) {
    throw new Error(
      `Expected quantity 3, got ${cart.items[0].quantity}.`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 7. TEST #3
   *
   * Different SKU must create another CartItem.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #3 - Add different SKU B x 1");

  await CartService.addItem({
    owner: {
      type: "customer",
      userId: userA.id,
    },
    productId: product.id,
    skuId: skuB.id,
    quantity: 1,
  });

  cart = await CartService.getCart({
    type: "customer",
    userId: userA.id,
  });

  if (!cart) {
    throw new Error("Cart tidak ditemukan.");
  }

  if (cart.items.length !== 2) {
    throw new Error(
      `Expected 2 CartItems, got ${cart.items.length}.`
    );
  }

  const itemA = cart.items.find(
    (item) => item.skuId === skuA.id
  );

  const itemB = cart.items.find(
    (item) => item.skuId === skuB.id
  );

  if (!itemA || !itemB) {
    throw new Error(
      "SKU A dan SKU B tidak ditemukan sebagai dua CartItem terpisah."
    );
  }

  if (itemA.quantity !== 3) {
    throw new Error(
      `SKU A expected quantity 3, got ${itemA.quantity}.`
    );
  }

  if (itemB.quantity !== 1) {
    throw new Error(
      `SKU B expected quantity 1, got ${itemB.quantity}.`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 8. TEST #4
   *
   * Active SKU product without skuId.
   *
   * Expected:
   * SKU_REQUIRED
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #4 - Active SKU product without skuId");

  await expectCartError(
    () =>
      CartService.addItem({
        owner: {
          type: "customer",
          userId: userA.id,
        },
        productId: product.id,
        skuId: null,
        quantity: 1,
      }),
    "SKU_REQUIRED",
    "TEST #4"
  );

  /**
   * ------------------------------------------------------------
   * 9. TEST #5
   *
   * SKU belongs to another product.
   *
   * Expected:
   * SKU_NOT_AVAILABLE
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #5 - SKU from another product");

  await expectCartError(
    () =>
      CartService.addItem({
        owner: {
          type: "customer",
          userId: userA.id,
        },
        productId: product.id,
        skuId: wrongSku.id,
        quantity: 1,
      }),
    "SKU_NOT_AVAILABLE",
    "TEST #5"
  );

  /**
   * ------------------------------------------------------------
   * 10. TEST #6
   *
   * Invalid quantity.
   *
   * Expected:
   * INVALID_QUANTITY
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #6 - Invalid quantity 0");

  await expectCartError(
    () =>
      CartService.addItem({
        owner: {
          type: "customer",
          userId: userA.id,
        },
        productId: product.id,
        skuId: skuA.id,
        quantity: 0,
      }),
    "INVALID_QUANTITY",
    "TEST #6"
  );

  /**
   * ------------------------------------------------------------
   * 11. TEST #7
   *
   * Quantity greater than stock.
   *
   * Expected:
   * INSUFFICIENT_STOCK
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #7 - Quantity greater than stock");

  await expectCartError(
    () =>
      CartService.addItem({
        owner: {
          type: "customer",
          userId: userA.id,
        },
        productId: product.id,
        skuId: skuA.id,
        quantity: skuA.stock + 1,
      }),
    "INSUFFICIENT_STOCK",
    "TEST #7"
  );

  /**
   * ------------------------------------------------------------
   * 12. TEST #8
   *
   * User B must not update User A's CartItem.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #8 - User B cannot update User A item");

  if (!itemA) {
    throw new Error(
      "CartItem A tidak tersedia untuk ownership test."
    );
  }

  await expectCartError(
    () =>
      CartService.updateItem({
        owner: {
          type: "customer",
          userId: userB.id,
        },
        cartItemId: itemA.id,
        quantity: 1,
      }),
    "INVALID_CART_ITEM",
    "TEST #8"
  );

  /**
   * ------------------------------------------------------------
   * 13. TEST #9
   *
   * User B must not delete User A's CartItem.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #9 - User B cannot delete User A item");

  await expectCartError(
    () =>
      CartService.removeItem({
        owner: {
          type: "customer",
          userId: userB.id,
        },
        cartItemId: itemA.id,
      }),
    "INVALID_CART_ITEM",
    "TEST #9"
  );

  /**
   * ------------------------------------------------------------
   * 14. Verify ownership attacks did not modify User A cart.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #10 - Verify User A cart remains intact");

  cart = await CartService.getCart({
    type: "customer",
    userId: userA.id,
  });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan setelah ownership test."
    );
  }

  if (cart.items.length !== 2) {
    throw new Error(
      `Expected 2 CartItems after ownership tests, got ${cart.items.length}.`
    );
  }

  const finalItemA = cart.items.find(
    (item) => item.skuId === skuA.id
  );

  const finalItemB = cart.items.find(
    (item) => item.skuId === skuB.id
  );

  if (!finalItemA || !finalItemB) {
    throw new Error(
      "Cart User A berubah secara tidak semestinya setelah ownership test."
    );
  }

  if (finalItemA.quantity !== 3) {
    throw new Error(
      `SKU A quantity changed unexpectedly: ${finalItemA.quantity}.`
    );
  }

  if (finalItemB.quantity !== 1) {
    throw new Error(
      `SKU B quantity changed unexpectedly: ${finalItemB.quantity}.`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 15. TEST #11
   *
   * Concurrent updateItem() terhadap CartItem yang sama.
   * ------------------------------------------------------------
   */
  console.log();
  console.log(
    "TEST #11 - Concurrent updateItem()"
  );

  if (!itemA) {
    throw new Error(
      "CartItem A tidak tersedia untuk concurrency update test."
    );
  }

  await CartService.updateItem({
    owner: {
      type: "customer",
      userId: userA.id,
    },
    cartItemId: itemA.id,
    quantity: 1,
  });

  const concurrentQuantities = [
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
  ];

  const concurrentResults =
    await Promise.all(
      concurrentQuantities.map(
        async (quantity) => {
          try {
            await CartService.updateItem({
              owner: {
                type: "customer",
                userId: userA.id,
              },
              cartItemId: itemA.id,
              quantity,
            });

            return {
              quantity,
              success: true,
              error: null,
            };
          } catch (error) {
            return {
              quantity,
              success: false,
              error,
            };
          }
        }
      )
    );

  const failedResults =
    concurrentResults.filter(
      (result) => !result.success
    );

  if (failedResults.length > 0) {
    console.error(
      "Concurrent update failures:"
    );

    for (
      const result of failedResults
    ) {
      console.error(
        `quantity=${result.quantity}`,
        result.error
      );
    }

    throw new Error(
      `Concurrent updateItem test failed: ${failedResults.length} request(s) failed.`
    );
  }

  cart =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan setelah concurrent update test."
    );
  }

  const concurrentItemA =
    cart.items.filter(
      (item) =>
        item.skuId === skuA.id
    );

  if (
    concurrentItemA.length !== 1
  ) {
    throw new Error(
      `Concurrent update corrupted cart identity. Expected 1 SKU A CartItem, got ${concurrentItemA.length}.`
    );
  }

  const finalConcurrentQuantity =
    concurrentItemA[0].quantity;

  if (
    !concurrentQuantities.includes(
      finalConcurrentQuantity
    )
  ) {
    throw new Error(
      `Unexpected final quantity after concurrent updates: ${finalConcurrentQuantity}.`
    );
  }

  console.log(
    `Concurrent requests : ${concurrentQuantities.length}`
  );

  console.log(
    `Successful updates  : ${concurrentResults.filter((result) => result.success).length}`
  );

  console.log(
    `Final quantity       : ${finalConcurrentQuantity}`
  );

  console.log(
    `CartItems for SKU A  : ${concurrentItemA.length}`
  );

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 16. TEST #12
   *
   * Concurrent removeItem() terhadap CartItem yang sama.
   * ------------------------------------------------------------
   */
  console.log();
  console.log(
    "TEST #12 - Concurrent removeItem()"
  );

  cart =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan sebelum concurrent remove test."
    );
  }

  const removeTarget =
    cart.items.find(
      (item) =>
        item.skuId === skuA.id
    );

  if (!removeTarget) {
    throw new Error(
      "CartItem A tidak tersedia untuk concurrent remove test."
    );
  }

  const concurrentRemoves =
    Array.from(
      { length: 10 },
      (_, index) => index + 1
    );

  const removeResults =
    await Promise.all(
      concurrentRemoves.map(
        async (requestNumber) => {
          try {
            await CartService.removeItem({
              owner: {
                type: "customer",
                userId: userA.id,
              },
              cartItemId: removeTarget.id,
            });

            return {
              requestNumber,
              success: true,
              error: null,
            };
          } catch (error) {
            return {
              requestNumber,
              success: false,
              error,
            };
          }
        }
      )
    );

  const successfulRemoves =
    removeResults.filter(
      (result) => result.success
    );

  if (
    successfulRemoves.length !== 1
  ) {
    throw new Error(
      `Concurrent remove expected exactly 1 successful request, got ${successfulRemoves.length}.`
    );
  }

  const failedRemoves =
    removeResults.filter(
      (result) => !result.success
    );

  for (
    const result of failedRemoves
  ) {
    if (
      !(
        result.error instanceof CartError
      ) ||
      result.error.code !==
        "INVALID_CART_ITEM"
    ) {
      console.error(
        `Unexpected concurrent remove failure on request ${result.requestNumber}:`,
        result.error
      );

      throw new Error(
        "Concurrent remove returned an unexpected error."
      );
    }
  }

  cart =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan setelah concurrent remove test."
    );
  }

  const remainingRemovedItem =
    cart.items.filter(
      (item) =>
        item.id === removeTarget.id
    );

  if (
    remainingRemovedItem.length !== 0
  ) {
    throw new Error(
      "CartItem masih tersisa setelah concurrent remove test."
    );
  }

  console.log(
    `Concurrent requests : ${concurrentRemoves.length}`
  );

  console.log(
    `Successful removes   : ${successfulRemoves.length}`
  );

  console.log(
    `Expected failures    : ${failedRemoves.length}`
  );

  console.log(
    `Remaining target     : ${remainingRemovedItem.length}`
  );

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 17. TEST #13
   *
   * Race antara updateItem() dan removeItem() terhadap CartItem
   * yang sama.
   * ------------------------------------------------------------
   */
  console.log();
  console.log(
    "TEST #13 - Concurrent updateItem() vs removeItem()"
  );

  await CartService.addItem({
    owner: {
      type: "customer",
      userId: userA.id,
    },
    productId: product.id,
    skuId: skuA.id,
    quantity: 1,
  });

  cart =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan sebelum update/remove race test."
    );
  }

  const raceTarget =
    cart.items.find(
      (item) =>
        item.skuId === skuA.id
    );

  if (!raceTarget) {
    throw new Error(
      "CartItem A tidak tersedia untuk update/remove race test."
    );
  }

  const [
    updateResult,
    removeResult,
  ] = await Promise.all([
    (async () => {
      try {
        await CartService.updateItem({
          owner: {
            type: "customer",
            userId: userA.id,
          },
          cartItemId:
            raceTarget.id,
          quantity: 2,
        });

        return {
          operation: "update",
          success: true,
          error: null,
        };
      } catch (error) {
        return {
          operation: "update",
          success: false,
          error,
        };
      }
    })(),

    (async () => {
      try {
        await CartService.removeItem({
          owner: {
            type: "customer",
            userId: userA.id,
          },
          cartItemId:
            raceTarget.id,
        });

        return {
          operation: "remove",
          success: true,
          error: null,
        };
      } catch (error) {
        return {
          operation: "remove",
          success: false,
          error,
        };
      }
    })(),
  ]);

  const successfulRaceOperations =
    [
      updateResult,
      removeResult,
    ].filter(
      (result) =>
        result.success
    );

  if (
    successfulRaceOperations.length < 1
  ) {
    console.error(
      "Update/remove race results:",
      {
        updateResult,
        removeResult,
      }
    );

    throw new Error(
      "Both updateItem() and removeItem() failed."
    );
  }

  if (
    !updateResult.success
  ) {
    if (
      !(
        updateResult.error instanceof CartError
      ) ||
      updateResult.error.code !==
        "INVALID_CART_ITEM"
    ) {
      console.error(
        "Unexpected update failure:",
        updateResult.error
      );

      throw new Error(
        "Concurrent update returned an unexpected error."
      );
    }
  }

  if (
    !removeResult.success
  ) {
    if (
      !(
        removeResult.error instanceof CartError
      ) ||
      removeResult.error.code !==
        "INVALID_CART_ITEM"
    ) {
      console.error(
        "Unexpected remove failure:",
        removeResult.error
      );

      throw new Error(
        "Concurrent remove returned an unexpected error."
      );
    }
  }

  cart =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan setelah update/remove race test."
    );
  }

  const finalRaceItems =
    cart.items.filter(
      (item) =>
        item.skuId === skuA.id
    );

  if (
    removeResult.success
  ) {
    if (
      finalRaceItems.length !== 0
    ) {
      throw new Error(
        "Remove succeeded but CartItem masih tersisa."
      );
    }
  } else {
    if (
      finalRaceItems.length !== 1
    ) {
      throw new Error(
        `Update succeeded but expected 1 CartItem, got ${finalRaceItems.length}.`
      );
    }

    if (
      finalRaceItems[0].quantity !== 2
    ) {
      throw new Error(
        `Update succeeded but final quantity is ${finalRaceItems[0].quantity}, expected 2.`
      );
    }
  }

  console.log(
    `Update success       : ${updateResult.success}`
  );

  console.log(
    `Remove success       : ${removeResult.success}`
  );

  console.log(
    `Final SKU A items    : ${finalRaceItems.length}`
  );

  if (
    finalRaceItems.length === 1
  ) {
    console.log(
      `Final quantity       : ${finalRaceItems[0].quantity}`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 18. TEST #14
   *
   * Race antara clearCart() dan addItem() terhadap Cart yang sama.
   * ------------------------------------------------------------
   */
  console.log();
  console.log(
    "TEST #14 - Concurrent clearCart() vs addItem()"
  );

  await CartService.addItem({
    owner: {
      type: "customer",
      userId: userA.id,
    },
    productId: product.id,
    skuId: skuA.id,
    quantity: 1,
  });

  const concurrentClearAddResults =
    await Promise.all([
      (async () => {
        try {
          await CartService.clearCart({
            type: "customer",
            userId: userA.id,
          });

          return {
            operation: "clear",
            success: true,
            error: null,
          };
        } catch (error) {
          return {
            operation: "clear",
            success: false,
            error,
          };
        }
      })(),

      ...Array.from(
        { length: 10 },
        async () => {
          try {
            await CartService.addItem({
              owner: {
                type: "customer",
                userId: userA.id,
              },
              productId: product.id,
              skuId: skuA.id,
              quantity: 1,
            });

            return {
              operation: "add",
              success: true,
              error: null,
            };
          } catch (error) {
            return {
              operation: "add",
              success: false,
              error,
            };
          }
        }
      ),
    ]);

  const failedClearAddOperations =
    concurrentClearAddResults.filter(
      (result) =>
        !result.success
    );

  if (
    failedClearAddOperations.length !== 0
  ) {
    console.error(
      "Concurrent clear/add failures:",
      failedClearAddOperations
    );

    throw new Error(
      "Concurrent clearCart()/addItem() menghasilkan operation failure."
    );
  }

  cart =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  if (!cart) {
    throw new Error(
      "Cart User A tidak ditemukan setelah clear/add race test."
    );
  }

  const finalClearAddItems =
    cart.items.filter(
      (item) =>
        item.productId === product.id &&
        item.skuId === skuA.id
    );

  if (
    finalClearAddItems.length > 1
  ) {
    throw new Error(
      `Duplicate canonical CartItem terdeteksi setelah clear/add race: ${finalClearAddItems.length}.`
    );
  }

  const successfulAddOperations =
    concurrentClearAddResults.filter(
      (result) =>
        result.operation === "add" &&
        result.success
    );

  if (
    finalClearAddItems.length === 1
  ) {
    const finalQuantity =
      finalClearAddItems[0].quantity;

    if (
      finalQuantity < 1 ||
      finalQuantity >
        successfulAddOperations.length
    ) {
      throw new Error(
        `Final quantity tidak valid setelah clear/add race: ${finalQuantity}.`
      );
    }
  }

  for (
    const item of finalClearAddItems
  ) {
    if (
      item.productId !== product.id ||
      item.skuId !== skuA.id
    ) {
      throw new Error(
        "Canonical CartItem identity rusak setelah clear/add race."
      );
    }
  }

  console.log(
    `Concurrent operations : ${concurrentClearAddResults.length}`
  );

  console.log(
    `Successful operations  : ${
      concurrentClearAddResults.length -
      failedClearAddOperations.length
    }`
  );

  console.log(
    `Successful adds        : ${successfulAddOperations.length}`
  );

  console.log(
    `Final SKU A items      : ${finalClearAddItems.length}`
  );

  if (
    finalClearAddItems.length === 1
  ) {
    console.log(
      `Final quantity         : ${finalClearAddItems[0].quantity}`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 19. Cleanup
   * ------------------------------------------------------------
   */
  console.log();
  console.log("CLEANUP - Clear test carts");

  await CartService.clearCart({
    type: "customer",
    userId: userA.id,
  });

  await CartService.clearCart({
    type: "customer",
    userId: userB.id,
  });

  const finalCartA =
    await CartService.getCart({
      type: "customer",
      userId: userA.id,
    });

  const finalCartB =
    await CartService.getCart({
      type: "customer",
      userId: userB.id,
    });

  if (!finalCartA || !finalCartB) {
    throw new Error(
      "Cart tidak ditemukan setelah cleanup."
    );
  }

  if (
    finalCartA.items.length !== 0 ||
    finalCartB.items.length !== 0
  ) {
    throw new Error(
      `Cleanup gagal. User A: ${finalCartA.items.length}, User B: ${finalCartB.items.length}.`
    );
  }

  console.log("PASS");

  console.log();
  console.log("============================================================");
  console.log("=== RESULT ===");
  console.log("============================================================");
  console.log("ALL CART SERVICE REGRESSION TESTS PASSED");
}

main()
  .catch((error) => {
    console.error();
    console.error("[CART_SERVICE_REGRESSION_ERROR]");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
