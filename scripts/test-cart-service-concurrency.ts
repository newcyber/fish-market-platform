import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

async function main() {
  console.log("============================================================");
  console.log("=== CART SERVICE CONCURRENCY TEST ===");
  console.log("============================================================");

  /**
   * ------------------------------------------------------------
   * 1. Find test customer
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
      "Tidak ditemukan CUSTOMER aktif untuk concurrency test."
    );
  }

  console.log();
  console.log("TEST USER");
  console.log(`id    : ${user.id}`);
  console.log(`email : ${user.email}`);

  /**
   * ------------------------------------------------------------
   * 2. Find product with active SKU and enough stock
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
            gt: 20,
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
            gt: 20,
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
    take: 20,
  });

  const product = productCandidates.find(
    (candidate) => candidate.skus.length === 1
  );

  if (!product) {
    throw new Error(
      "Tidak ditemukan product dengan active SKU dan stock > 20."
    );
  }

  const sku = product.skus[0];

  console.log();
  console.log("TEST PRODUCT");
  console.log(`product : ${product.name}`);
  console.log(`id      : ${product.id}`);

  console.log();
  console.log("TEST SKU");
  console.log(`id    : ${sku.id}`);
  console.log(`sku   : ${sku.sku}`);
  console.log(`stock : ${sku.stock}`);

  /**
   * ------------------------------------------------------------
   * 3. Prepare clean cart
   * ------------------------------------------------------------
   */
  console.log();
  console.log("PREPARE - Clear test cart");

  await CartService.getOrCreateCart(user.id);
  await CartService.clearCart(user.id);

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 4. Concurrent requests
   * ------------------------------------------------------------
   *
   * We intentionally send multiple addItem() calls without
   * awaiting each call individually.
   *
   * Expected:
   *
   * 10 requests x quantity 1
   *          ↓
   * exactly ONE CartItem
   *          ↓
   * quantity = 10
   */
  const requestCount = 10;
  const requestQuantity = 1;
  const expectedQuantity =
    requestCount * requestQuantity;

  console.log();
  console.log(
    `TEST - ${requestCount} concurrent addItem() requests`
  );
  console.log(
    `Expected final quantity: ${expectedQuantity}`
  );

  const results = await Promise.allSettled(
    Array.from(
      { length: requestCount },
      () =>
        CartService.addItem({
          userId: user.id,
          productId: product.id,
          skuId: sku.id,
          quantity: requestQuantity,
        })
    )
  );

  const fulfilled = results.filter(
    (result) => result.status === "fulfilled"
  );

  const rejected = results.filter(
    (result) => result.status === "rejected"
  );

  console.log();
  console.log(`fulfilled : ${fulfilled.length}`);
  console.log(`rejected  : ${rejected.length}`);

  if (rejected.length > 0) {
    console.log();
    console.log("REJECTED REQUESTS");

    for (const result of rejected) {
      if (result.status === "rejected") {
        console.error(result.reason);
      }
    }
  }

  /**
   * ------------------------------------------------------------
   * 5. Read final cart
   * ------------------------------------------------------------
   */
  console.log();
  console.log("VERIFY - Final cart");

  const cart = await CartService.getCart(user.id);

  if (!cart) {
    throw new Error(
      "Cart tidak ditemukan setelah concurrency test."
    );
  }

const finalTotalItems = cart.items.reduce(
  (total, item) => total + item.quantity,
  0
);

console.log(`CartItems : ${cart.items.length}`);
console.log(`TotalItems: ${finalTotalItems}`);

  if (cart.items.length !== 1) {
    throw new Error(
      `CONCURRENCY FAILURE: Expected exactly 1 CartItem, got ${cart.items.length}.`
    );
  }

  const item = cart.items[0];

  if (item.productId !== product.id) {
    throw new Error(
      "CartItem productId tidak sesuai."
    );
  }

  if (item.skuId !== sku.id) {
    throw new Error(
      "CartItem skuId tidak sesuai."
    );
  }

  console.log(`Final quantity: ${item.quantity}`);

  /**
   * ------------------------------------------------------------
   * 6. Verify quantity
   * ------------------------------------------------------------
   */
  if (item.quantity !== expectedQuantity) {
    throw new Error(
      `CONCURRENCY FAILURE: Expected quantity ${expectedQuantity}, got ${item.quantity}.`
    );
  }

if (finalTotalItems !== expectedQuantity) {
  throw new Error(
    `CONCURRENCY FAILURE: Expected totalItems ${expectedQuantity}, got ${finalTotalItems}.`
  );
}

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 7. Inspect database directly
   * ------------------------------------------------------------
   *
   * This confirms whether duplicate canonical CartItems
   * actually exist at database level.
   */
  console.log();
  console.log("VERIFY - Database canonical identity");

  const cartRecord = await prisma.cart.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!cartRecord) {
    throw new Error(
      "Cart database tidak ditemukan."
    );
  }

  const canonicalItems =
    await prisma.cartItem.findMany({
      where: {
        cartId: cartRecord.id,
        productId: product.id,
        skuId: sku.id,
      },
      select: {
        id: true,
        quantity: true,
      },
    });

  console.log(
    `Canonical CartItems: ${canonicalItems.length}`
  );

  if (canonicalItems.length !== 1) {
    throw new Error(
      `DATABASE INTEGRITY FAILURE: Expected 1 canonical CartItem, got ${canonicalItems.length}.`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 8. Cleanup
   * ------------------------------------------------------------
   */
  console.log();
  console.log("CLEANUP - Clear test cart");

  await CartService.clearCart(user.id);

  const cleanedCart =
    await CartService.getCart(user.id);

  if (!cleanedCart) {
    throw new Error(
      "Cart tidak ditemukan setelah cleanup."
    );
  }

  if (cleanedCart.items.length !== 0) {
    throw new Error(
      `Cleanup gagal. Masih ada ${cleanedCart.items.length} CartItem.`
    );
  }

  console.log("PASS");

  console.log();
  console.log("============================================================");
  console.log("=== RESULT ===");
  console.log("============================================================");
  console.log(
    "CART SERVICE CONCURRENCY TEST PASSED"
  );
}

main()
  .catch((error) => {
    console.error();
    console.error(
      "[CART_SERVICE_CONCURRENCY_ERROR]"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
