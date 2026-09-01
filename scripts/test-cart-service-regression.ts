import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

async function main() {
  console.log("============================================================");
  console.log("=== CART SERVICE REGRESSION TEST ===");
  console.log("============================================================");

  /**
   * ------------------------------------------------------------
   * 1. Find a safe CUSTOMER without an existing cart.
   * ------------------------------------------------------------
   */
  const user = await prisma.user.findFirst({
    where: {
      role: "CUSTOMER",
      isActive: true,
      deletedAt: null,
      cart: null,
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
      "Tidak ditemukan CUSTOMER aktif tanpa Cart untuk regression test."
    );
  }

  console.log();
  console.log("TEST USER");
  console.log(`id    : ${user.id}`);
  console.log(`email : ${user.email}`);

  /**
   * ------------------------------------------------------------
   * 2. Find two active SKUs from the same published product.
   * ------------------------------------------------------------
   *
   * This lets us verify:
   *
   * SKU A + SKU B
   *      ↓
   * two separate CartItems
   */
  const productCandidates =
    await prisma.product.findMany({
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

  const product =
    productCandidates.find(
      (candidate) =>
        candidate.skus.length >= 2
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
   * 3. Ensure Cart exists.
   * ------------------------------------------------------------
   */
  await CartService.getOrCreateCart(user.id);

  /**
   * ------------------------------------------------------------
   * 4. TEST #1
   *
   * Add SKU A x 1
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #1 - Add SKU A x 1");

  await CartService.addItem({
    userId: user.id,
    productId: product.id,
    skuId: skuA.id,
    quantity: 1,
  });

  let cart = await CartService.getCart(user.id);

  if (!cart) {
    throw new Error("Cart tidak ditemukan setelah addItem.");
  }

  if (cart.items.length !== 1) {
    throw new Error(
      `Expected 1 CartItem, got ${cart.items.length}.`
    );
  }

  if (cart.items[0].skuId !== skuA.id) {
    throw new Error(
      "CartItem SKU A tidak sesuai."
    );
  }

  if (cart.items[0].quantity !== 1) {
    throw new Error(
      `Expected quantity 1, got ${cart.items[0].quantity}.`
    );
  }

  console.log("PASS");

  /**
   * ------------------------------------------------------------
   * 5. TEST #2
   *
   * Add SKU A x 2 again.
   *
   * Expected:
   * same CartItem
   * quantity = 3
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #2 - Add same SKU A x 2");

  await CartService.addItem({
    userId: user.id,
    productId: product.id,
    skuId: skuA.id,
    quantity: 2,
  });

  cart = await CartService.getCart(user.id);

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
   * 6. TEST #3
   *
   * Add different SKU B x 1.
   *
   * Expected:
   * two CartItems
   * ------------------------------------------------------------
   */
  console.log();
  console.log("TEST #3 - Add different SKU B x 1");

  await CartService.addItem({
    userId: user.id,
    productId: product.id,
    skuId: skuB.id,
    quantity: 1,
  });

  cart = await CartService.getCart(user.id);

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
   * 7. Cleanup
   * ------------------------------------------------------------
   */
  console.log();
  console.log("CLEANUP - Clear test cart");

  await CartService.clearCart(user.id);

  cart = await CartService.getCart(user.id);

  if (!cart) {
    throw new Error(
      "Cart tidak ditemukan setelah cleanup."
    );
  }

  if (cart.items.length !== 0) {
    throw new Error(
      `Cleanup gagal. Masih ada ${cart.items.length} CartItem.`
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
    console.error(
      "[CART_SERVICE_REGRESSION_ERROR]"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
