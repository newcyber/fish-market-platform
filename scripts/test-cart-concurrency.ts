import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

async function main() {
  console.log("============================================================");
  console.log("=== CART CONCURRENCY TEST ===");
  console.log("============================================================");

  /**
   * ------------------------------------------------------------
   * 1. Find a CUSTOMER
   * ------------------------------------------------------------
   */
  const user = await prisma.user.findFirst({
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
  });

  if (!user) {
    throw new Error(
      "Tidak ditemukan CUSTOMER aktif."
    );
  }

  /**
   * ------------------------------------------------------------
   * 2. Find one published product with one active SKU
   *    and enough stock for concurrent +1 requests.
   * ------------------------------------------------------------
   */
  const product = await prisma.product.findFirst({
    where: {
      deletedAt: null,
      isPublished: true,
      skus: {
        some: {
          isActive: true,
          stock: {
            gte: 2,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      skus: {
        where: {
          isActive: true,
          stock: {
            gte: 2,
          },
        },
        select: {
          id: true,
          sku: true,
          stock: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!product || product.skus.length === 0) {
    throw new Error(
      "Tidak ditemukan product dengan active SKU dan stock >= 2."
    );
  }

  const sku = product.skus[0];

  console.log();
  console.log("TEST USER");
  console.log(`email : ${user.email}`);
  console.log(`id    : ${user.id}`);

  console.log();
  console.log("TEST PRODUCT");
  console.log(`name  : ${product.name}`);
  console.log(`sku   : ${sku.sku}`);
  console.log(`stock : ${sku.stock}`);

  /**
   * ------------------------------------------------------------
   * 3. Ensure cart exists and remove previous test data.
   * ------------------------------------------------------------
   */
  await CartService.getOrCreateCart(user.id);
  await CartService.clearCart(user.id);

  /**
   * ------------------------------------------------------------
   * 4. Run TWO addItem requests concurrently.
   * ------------------------------------------------------------
   */
  console.log();
  console.log("============================================================");
  console.log("=== RUNNING CONCURRENT REQUESTS ===");
  console.log("============================================================");

  const results =
    await Promise.allSettled([
      CartService.addItem({
        userId: user.id,
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
      }),

      CartService.addItem({
        userId: user.id,
        productId: product.id,
        skuId: sku.id,
        quantity: 1,
      }),
    ]);

  console.log();
  console.log("REQUEST RESULTS");

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(
        `Request ${index + 1}: SUCCESS`
      );
    } else {
      console.log(
        `Request ${index + 1}: FAILED`
      );

      console.error(
        result.reason
      );
    }
  });

  /**
   * ------------------------------------------------------------
   * 5. Inspect final cart state.
   * ------------------------------------------------------------
   */
  const cart =
    await CartService.getCart(user.id);

  if (!cart) {
    throw new Error(
      "Cart tidak ditemukan setelah concurrent test."
    );
  }

  const items =
    cart.items.filter(
      (item) =>
        item.productId === product.id &&
        item.skuId === sku.id
    );

  const finalQuantity =
    items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  console.log();
  console.log("FINAL CART STATE");
  console.log(`matching items : ${items.length}`);
  console.log(`final quantity : ${finalQuantity}`);

  /**
   * ------------------------------------------------------------
   * 6. Business expectation
   * ------------------------------------------------------------
   */
  if (
    results.every(
      (result) =>
        result.status === "fulfilled"
    ) &&
    items.length === 1 &&
    finalQuantity === 2
  ) {
    console.log();
    console.log("============================================================");
    console.log("=== RESULT ===");
    console.log("============================================================");
    console.log(
      "CONCURRENCY TEST PASSED"
    );
  } else {
    console.log();
    console.log("============================================================");
    console.log("=== RESULT ===");
    console.log("============================================================");
    console.log(
      "CONCURRENCY TEST FAILED"
    );

    throw new Error(
      `Expected 1 CartItem with quantity 2, got ${items.length} item(s) and quantity ${finalQuantity}.`
    );
  }

  /**
   * ------------------------------------------------------------
   * 7. Cleanup
   * ------------------------------------------------------------
   */
  console.log();
  console.log("CLEANUP");

  await CartService.clearCart(user.id);

  console.log("Cleanup completed.");
}

main()
  .catch((error) => {
    console.error();
    console.error(
      "[CART_CONCURRENCY_TEST_ERROR]"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
