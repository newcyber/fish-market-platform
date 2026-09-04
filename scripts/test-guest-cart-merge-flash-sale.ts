import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  const testId = randomUUID();

  let userId: string | null = null;
  let guestCartId: string | null = null;
  let flashSaleId: string | null = null;

  console.log("\n==================================================");
  console.log("TEST: GUEST CART MERGE + STALE FLASH SALE");
  console.log("==================================================\n");

  try {
    /**
     * --------------------------------------------------------
     * 1. FIND ACTIVE SKU
     * --------------------------------------------------------
     */
    console.log("[1] Mencari SKU aktif dengan stock cukup...");

const sku = await prisma.productSku.findFirst({
  where: {
    isActive: true,
    stock: {
      gte: 10,
    },
    product: {
      deletedAt: null,
    },
  },
  select: {
    id: true,
    productId: true,
    stock: true,
    price: true,
  },
});

    assert(
      sku,
      "Tidak ditemukan ProductSku aktif dengan stock minimal 10."
    );

    console.log("   SKU       :", sku.id);
    console.log("   Product   :", sku.productId);
    console.log("   Stock     :", sku.stock);
    console.log("   SKU Price :", sku.price.toString());

    /**
     * --------------------------------------------------------
     * 2. CREATE ISOLATED FLASH SALE
     * --------------------------------------------------------
     *
     * Saat ini Flash Sale dibuat ACTIVE.
     * Guest/customer cart akan mendapatkan flashSaleItemId.
     */
    console.log("\n[2] Membuat Flash Sale fixture...");

    const now = new Date();

    const startAt = new Date(now.getTime() - 60 * 60 * 1000);
    const endAt = new Date(now.getTime() + 60 * 60 * 1000);

    const flashPrice = Math.max(
      1,
      Number(sku.price) * 0.7
    );

    const flashSale = await prisma.flashSale.create({
      data: {
        name: `TEST Guest Cart Merge ${testId}`,
        slug: `test-guest-cart-merge-${testId}`,
        description: "Temporary fixture for guest cart merge regression test.",
        status: "ACTIVE",
        startAt,
        endAt,
        sortOrder: 999999,
        items: {
          create: {
            productId: sku.productId,
            skuId: sku.id,
            originalPrice: sku.price,
            flashPrice,
            stockLimit: 10,
            soldQuantity: 0,
            perUserLimit: null,
            isActive: true,
            sortOrder: 0,
          },
        },
      },
      include: {
        items: true,
      },
    });

    flashSaleId = flashSale.id;

    const flashSaleItem = flashSale.items[0];

    assert(
      flashSaleItem,
      "FlashSaleItem fixture gagal dibuat."
    );

    console.log("   FlashSale ID :", flashSale.id);
    console.log("   Item ID      :", flashSaleItem.id);
    console.log("   Flash Price  :", flashPrice);

    /**
     * --------------------------------------------------------
     * 3. CREATE ISOLATED TEST USER
     * --------------------------------------------------------
     */
    console.log("\n[3] Membuat isolated test user...");

    const user = await prisma.user.create({
      data: {
        email: `cart-merge-flash-sale-${testId}@test.local`,
        name: "Cart Merge Flash Sale Test",
        password: `TestPassword-${testId}`,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    userId = user.id;

    console.log("   User:", user.email);

    /**
     * --------------------------------------------------------
     * 4. CREATE GUEST CART
     * --------------------------------------------------------
     */
    guestCartId = `guest-test-${testId}`;

    console.log("\n[4] Menambahkan SKU ke Guest Cart...");

    await CartService.addItem({
      owner: {
        type: "guest",
        guestCartId,
      },
      productId: sku.productId,
      skuId: sku.id,
      quantity: 1,
    });

    const guestBefore = await prisma.cart.findUnique({
      where: {
        guestCartId,
      },
      include: {
        items: true,
      },
    });

    assert(
      guestBefore,
      "Guest Cart tidak terbentuk."
    );

    assert(
      guestBefore.items.length === 1,
      "Guest Cart harus mempunyai 1 item."
    );

    const guestItem = guestBefore.items[0];

    console.log("   Quantity        :", guestItem.quantity);
    console.log("   Price           :", guestItem.price.toString());
    console.log(
      "   FlashSaleItemId :",
      guestItem.flashSaleItemId
    );

    /**
     * --------------------------------------------------------
     * 5. VERIFY FLASH SALE SNAPSHOT
     * --------------------------------------------------------
     */
    console.log("\n[5] Memastikan Guest Cart memakai Flash Sale...");

    assert(
      guestItem.flashSaleItemId === flashSaleItem.id,
      `Guest Cart seharusnya memakai ${flashSaleItem.id}, tetapi mendapat ${guestItem.flashSaleItemId}.`
    );

    console.log("   OK - Flash Sale snapshot tersimpan.");

    /**
     * --------------------------------------------------------
     * 6. CREATE CUSTOMER CART
     * --------------------------------------------------------
     *
     * Kita sengaja membuat customer memiliki SKU yang sama.
     * Ini memaksa merge masuk ke branch existingCustomerItem.
     */
    console.log("\n[6] Menambahkan SKU yang sama ke Customer Cart...");

    await CartService.addItem({
      owner: {
        type: "customer",
        userId: user.id,
      },
      productId: sku.productId,
      skuId: sku.id,
      quantity: 1,
    });

    const customerBefore = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    assert(
      customerBefore,
      "Customer Cart tidak terbentuk."
    );

    assert(
      customerBefore.items.length === 1,
      "Customer Cart harus mempunyai 1 item."
    );

    const customerItem = customerBefore.items[0];

    console.log("   Quantity        :", customerItem.quantity);
    console.log("   Price           :", customerItem.price.toString());
    console.log(
      "   FlashSaleItemId :",
      customerItem.flashSaleItemId
    );

    assert(
      customerItem.flashSaleItemId === flashSaleItem.id,
      "Customer Cart seharusnya juga menyimpan FlashSaleItemId fixture."
    );

    /**
     * --------------------------------------------------------
     * 7. CAPTURE QUOTA BEFORE EXPIRATION
     * --------------------------------------------------------
     */
    const quotaBefore = await prisma.flashSaleItem.findUnique({
      where: {
        id: flashSaleItem.id,
      },
      select: {
        soldQuantity: true,
      },
    });

    assert(
      quotaBefore,
      "FlashSaleItem tidak ditemukan."
    );

    console.log(
      "\n[7] soldQuantity sebelum merge:",
      quotaBefore.soldQuantity
    );

    /**
     * --------------------------------------------------------
     * 8. MAKE FLASH SALE STALE
     * --------------------------------------------------------
     *
     * Inilah inti regression test.
     *
     * Cart masih mempunyai flashSaleItemId lama.
     * Tetapi campaign sekarang sudah expired.
     */
    console.log("\n[8] Membuat Flash Sale menjadi EXPIRED...");

    await prisma.flashSale.update({
      where: {
        id: flashSale.id,
      },
      data: {
        endAt: new Date(now.getTime() - 60 * 1000),
      },
    });

    const expiredFlashSale = await prisma.flashSale.findUnique({
      where: {
        id: flashSale.id,
      },
      select: {
        status: true,
        startAt: true,
        endAt: true,
        deletedAt: true,
      },
    });

    assert(
      expiredFlashSale,
      "Flash Sale fixture hilang."
    );

    console.log("   Status :", expiredFlashSale.status);
    console.log("   EndAt  :", expiredFlashSale.endAt.toISOString());

/**
 * --------------------------------------------------------
 * 9. MERGE
 * --------------------------------------------------------
 *
 * Flash Sale snapshot yang tersimpan di Cart sudah stale.
 *
 * Expected behavior:
 * - merge TETAP berhasil
 * - pricing dihitung ulang
 * - Flash Sale lama tidak dipertahankan
 * - Cart menjadi harga normal / promo aktif saat ini
 */
console.log("\n[9] Menjalankan Guest → Customer Cart merge...");

try {
  await CartService.mergeGuestCartIntoCustomerCart({
    userId: user.id,
    guestCartId,
  });

  console.log("   MERGE BERHASIL.");
} catch (error) {
  throw new Error(
    `Merge seharusnya berhasil walaupun Flash Sale snapshot stale: ${getErrorMessage(error)}`
  );
}

/**
 * --------------------------------------------------------
 * 10. VERIFY MERGED CUSTOMER CART
 * --------------------------------------------------------
 */
console.log("\n[10] Memeriksa hasil merge...");

const customerAfter = await prisma.cart.findUnique({
  where: {
    userId: user.id,
  },
  include: {
    items: true,
  },
});

assert(
  customerAfter,
  "Customer Cart tidak ditemukan setelah merge."
);

assert(
  customerAfter.items.length === 1,
  `Customer Cart harus memiliki 1 item, mendapat ${customerAfter.items.length}.`
);

const mergedItem = customerAfter.items[0];

console.log("   Quantity        :", mergedItem.quantity);
console.log("   Price           :", mergedItem.price.toString());
console.log(
  "   isFlashSale     :",
  mergedItem.isFlashSaleApplied
);
console.log(
  "   FlashSaleId     :",
  mergedItem.flashSaleId
);
console.log(
  "   FlashSaleItemId :",
  mergedItem.flashSaleItemId
);

/**
 * Customer sudah memiliki 1 unit
 * + Guest memiliki 1 unit
 * = total 2 unit.
 */
assert(
  mergedItem.quantity === 2,
  `Quantity hasil merge harus 2, mendapat ${mergedItem.quantity}.`
);

/**
 * Flash Sale fixture sudah expired.
 * Jadi harga Flash Sale 21000 tidak boleh dipertahankan.
 *
 * SKU price saat fixture dibuat = 30000.
 */
assert(
  Number(mergedItem.price) === Number(sku.price),
  `Harga setelah Flash Sale expired harus kembali ke harga SKU ${sku.price}, mendapat ${mergedItem.price}.`
);

/**
 * Snapshot Flash Sale lama tidak boleh dipertahankan.
 */
assert(
  mergedItem.isFlashSaleApplied === false,
  "isFlashSaleApplied harus false setelah Flash Sale expired."
);

assert(
  mergedItem.flashSaleId === null,
  "flashSaleId lama tidak boleh dipertahankan."
);

assert(
  mergedItem.flashSaleItemId === null,
  "flashSaleItemId lama tidak boleh dipertahankan."
);

console.log("   Quantity benar           : OK");
console.log("   Harga dihitung ulang     : OK");
console.log("   Flash Sale lama dihapus  : OK");

/**
 * --------------------------------------------------------
 * 11. VERIFY GUEST CART EMPTY
 * --------------------------------------------------------
 */
console.log("\n[11] Memeriksa Guest Cart...");

const guestAfter = await prisma.cart.findUnique({
  where: {
    guestCartId,
  },
  include: {
    items: true,
  },
});

assert(
  guestAfter,
  "Guest Cart seharusnya tetap ada."
);

assert(
  guestAfter.items.length === 0,
  `Guest Cart harus kosong setelah merge, mendapat ${guestAfter.items.length} item.`
);

console.log("   Guest Cart kosong: OK");

/**
 * --------------------------------------------------------
 * 12. VERIFY FLASH SALE QUOTA
 * --------------------------------------------------------
 */
console.log("\n[12] Memeriksa Flash Sale quota...");

const quotaAfter = await prisma.flashSaleItem.findUnique({
  where: {
    id: flashSaleItem.id,
  },
  select: {
    soldQuantity: true,
  },
});

assert(
  quotaAfter,
  "FlashSaleItem tidak ditemukan."
);

console.log(
  "   soldQuantity sebelum:",
  quotaBefore.soldQuantity
);

console.log(
  "   soldQuantity sesudah:",
  quotaAfter.soldQuantity
);

assert(
  quotaAfter.soldQuantity === quotaBefore.soldQuantity,
  "Cart merge tidak boleh mengonsumsi Flash Sale quota."
);

console.log("   Flash Sale quota tidak berubah: OK");

/**
 * --------------------------------------------------------
 * RESULT
 * --------------------------------------------------------
 */
console.log("\n==================================================");
console.log("REGRESSION TEST BERHASIL");
console.log("==================================================");
console.log("");
console.log("✓ Stale Flash Sale tidak menggagalkan merge");
console.log("✓ Pricing dihitung ulang");
console.log("✓ Harga Flash Sale lama tidak dipertahankan");
console.log("✓ Flash Sale metadata lama dihapus");
console.log("✓ Quantity merge benar");
console.log("✓ Guest Cart dikosongkan");
console.log("✓ Flash Sale quota tidak dikonsumsi");
console.log("");

  } catch (error) {
    console.error("\n==================================================");
    console.error("TEST GAGAL");
    console.error("==================================================");
    console.error(getErrorMessage(error));
    console.error();
    process.exitCode = 1;
  } finally {
    /**
     * --------------------------------------------------------
     * CLEANUP
     * --------------------------------------------------------
     *
     * Urutan:
     * 1. CartItem
     * 2. Cart
     * 3. FlashSale
     * 4. User
     */
    console.log("[CLEANUP] Membersihkan fixture test...");

    try {
      if (guestCartId) {
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

      if (userId) {
        await prisma.cartItem.deleteMany({
          where: {
            cart: {
              userId,
            },
          },
        });

        await prisma.cart.deleteMany({
          where: {
            userId,
          },
        });

        await prisma.user.delete({
          where: {
            id: userId,
          },
        });
      }

      if (flashSaleId) {
        await prisma.flashSale.delete({
          where: {
            id: flashSaleId,
          },
        });
      }

      console.log("[CLEANUP] Selesai.\n");
    } catch (cleanupError) {
      console.error(
        "[CLEANUP ERROR]",
        getErrorMessage(cleanupError)
      );
    }

    await prisma.$disconnect();
  }
}

void main();
