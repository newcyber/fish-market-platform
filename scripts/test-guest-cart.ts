import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

import CartService, {
  CartOwner,
} from "@/services/cart/cart.service";

/**
 * ============================================================
 * GUEST CART REGRESSION TEST
 * ============================================================
 *
 * Test ini menguji:
 *
 * 1. Guest owner baru
 * 2. Add SKU A
 * 3. Add SKU A lagi → quantity merge
 * 4. Add SKU B
 * 5. Guest isolation
 * 6. Update item
 * 7. Remove item
 * 8. Clear cart
 * 9. Concurrent guest add
 *
 * Catatan:
 * - guestCartId adalah opaque identifier.
 * - Test TIDAK menyentuh cookie/browser.
 * - Test langsung menguji business logic CartService.
 * - Add to cart tidak melakukan stock reservation.
 * ============================================================
 */

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      `ASSERTION FAILED: ${message}`
    );
  }
}

function assertEqual(
  actual: unknown,
  expected: unknown,
  message: string
) {
  if (actual !== expected) {
    throw new Error(
      `ASSERTION FAILED: ${message}\n` +
        `Expected: ${String(expected)}\n` +
        `Actual:   ${String(actual)}`
    );
  }
}

async function main() {
  /**
   * ============================================================
   * UNIQUE TEST GUEST IDENTITIES
   * ============================================================
   *
   * UUID baru memastikan test tidak mengganggu guest cart lain.
   */

  const guestCartIdA =
    randomUUID();

  const guestCartIdB =
    randomUUID();

  const guestOwnerA: CartOwner = {
    type: "guest",
    guestCartId: guestCartIdA,
  };

  const guestOwnerB: CartOwner = {
    type: "guest",
    guestCartId: guestCartIdB,
  };

let skuAId!: string;
let skuBId!: string;

let productAId!: string;
let productBId!: string;

  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "=== GUEST CART REGRESSION TEST ==="
    );
    console.log(
      "============================================================"
    );

    console.log("");
    console.log(
      "Guest A:",
      guestCartIdA
    );

    console.log(
      "Guest B:",
      guestCartIdB
    );

    /**
     * ==========================================================
     * PREPARE FIXTURE
     * ==========================================================
     *
     * Cari dua SKU aktif dengan stock > 20.
     *
     * Kita sengaja tidak menggunakan hard-coded fixture ID agar
     * test lebih tahan terhadap perubahan data development.
     */

    const skuCandidates =
      await prisma.productSku.findMany({
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
          price: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 20,
      });

    assert(
      skuCandidates.length >= 2,
      "Minimal membutuhkan 2 SKU aktif dengan stock > 20."
    );

    /**
     * Cari SKU dari product berbeda jika memungkinkan.
     *
     * Ini membuat test SKU A dan SKU B lebih jelas sebagai
     * dua item berbeda.
     */

    const firstSku =
      skuCandidates[0];

    const secondSku =
      skuCandidates.find(
        (sku) =>
          sku.productId !==
          firstSku.productId
      ) ?? skuCandidates[1];

    assert(
      secondSku,
      "SKU kedua tidak ditemukan."
    );

    skuAId = firstSku.id;
    skuBId = secondSku.id;

    productAId =
      firstSku.productId;

    productBId =
      secondSku.productId;

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FIXTURE"
    );
    console.log(
      "============================================================"
    );

    console.log({
      skuA: {
        id: firstSku.id,
        code: firstSku.sku,
        productId: firstSku.productId,
        stock: firstSku.stock,
        price: firstSku.price,
      },
      skuB: {
        id: secondSku.id,
        code: secondSku.sku,
        productId: secondSku.productId,
        stock: secondSku.stock,
        price: secondSku.price,
      },
    });

    /**
     * ==========================================================
     * TEST 1
     * GUEST OWNER BARU
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #1 - Guest owner baru"
    );

    const initialCart =
      await CartService.getCart(
        guestOwnerA
      );

    assertEqual(
      initialCart,
      null,
      "Guest A seharusnya belum mempunyai Cart."
    );

    console.log(
      "PASS: Guest A belum memiliki Cart."
    );

    /**
     * ==========================================================
     * TEST 2
     * ADD SKU A x1
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #2 - Add SKU A x1"
    );

    await CartService.addItem({
      owner: guestOwnerA,
      productId: productAId,
      skuId: skuAId,
      quantity: 1,
    });

    const cartAfterFirstAdd =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      cartAfterFirstAdd,
      "Cart Guest A seharusnya dibuat setelah addItem."
    );

    assertEqual(
      cartAfterFirstAdd.items.length,
      1,
      "Guest A seharusnya memiliki 1 CartItem."
    );

    assertEqual(
      cartAfterFirstAdd.items[0].skuId,
      skuAId,
      "CartItem harus menggunakan SKU A."
    );

    assertEqual(
      cartAfterFirstAdd.items[0].quantity,
      1,
      "Quantity SKU A harus 1."
    );

    console.log(
      "PASS: Guest A → SKU A x1."
    );

    /**
     * ==========================================================
     * TEST 3
     * ADD SKU A x2
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #3 - Add SKU A x2 → quantity 3"
    );

    await CartService.addItem({
      owner: guestOwnerA,
      productId: productAId,
      skuId: skuAId,
      quantity: 2,
    });

    const cartAfterSecondAdd =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      cartAfterSecondAdd,
      "Cart Guest A harus tetap tersedia."
    );

    assertEqual(
      cartAfterSecondAdd.items.length,
      1,
      "SKU yang sama tidak boleh membuat CartItem duplicate."
    );

    assertEqual(
      cartAfterSecondAdd.items[0].quantity,
      3,
      "Quantity SKU A harus menjadi 3."
    );

    console.log(
      "PASS: SKU A x1 + x2 = quantity 3."
    );

    /**
     * ==========================================================
     * TEST 4
     * ADD SKU B x1
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #4 - Add SKU B x1"
    );

    await CartService.addItem({
      owner: guestOwnerA,
      productId: productBId,
      skuId: skuBId,
      quantity: 1,
    });

    const cartAfterSkuB =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      cartAfterSkuB,
      "Cart Guest A harus tersedia."
    );

    assertEqual(
      cartAfterSkuB.items.length,
      2,
      "Guest A seharusnya memiliki 2 CartItem."
    );

    const itemA =
      cartAfterSkuB.items.find(
        (item) =>
          item.skuId === skuAId
      );

    const itemB =
      cartAfterSkuB.items.find(
        (item) =>
          item.skuId === skuBId
      );

    assert(
      itemA,
      "SKU A harus berada di Cart Guest A."
    );

    assert(
      itemB,
      "SKU B harus berada di Cart Guest A."
    );

    assertEqual(
      itemA.quantity,
      3,
      "Quantity SKU A harus tetap 3."
    );

    assertEqual(
      itemB.quantity,
      1,
      "Quantity SKU B harus 1."
    );

    console.log(
      "PASS: Guest A memiliki SKU A x3 dan SKU B x1."
    );

    /**
     * ==========================================================
     * TEST 5
     * GUEST ISOLATION
     * ==========================================================
     *
     * Guest B tidak boleh melihat Cart Guest A.
     */

    console.log("");
    console.log(
      "TEST #5 - Guest isolation"
    );

    const guestBCart =
      await CartService.getCart(
        guestOwnerB
      );

    assertEqual(
      guestBCart,
      null,
      "Guest B tidak boleh melihat Cart Guest A."
    );

    console.log(
      "PASS: Guest B terisolasi dari Guest A."
    );

    /**
     * ==========================================================
     * TEST 6
     * GUEST B ADD SKU A
     * ==========================================================
     *
     * Membuktikan dua guest bisa mempunyai SKU yang sama
     * tetapi berada di Cart berbeda.
     */

    console.log("");
    console.log(
      "TEST #6 - Guest B add SKU A"
    );

    await CartService.addItem({
      owner: guestOwnerB,
      productId: productAId,
      skuId: skuAId,
      quantity: 1,
    });

    const guestBCartAfterAdd =
      await CartService.getCart(
        guestOwnerB
      );

    assert(
      guestBCartAfterAdd,
      "Guest B harus mempunyai Cart setelah addItem."
    );

    assertEqual(
      guestBCartAfterAdd.items.length,
      1,
      "Guest B harus mempunyai 1 CartItem."
    );

    assertEqual(
      guestBCartAfterAdd.items[0].skuId,
      skuAId,
      "Guest B harus memiliki SKU A."
    );

    assertEqual(
      guestBCartAfterAdd.items[0].quantity,
      1,
      "Guest B quantity SKU A harus 1."
    );

    const guestACartStill =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      guestACartStill,
      "Cart Guest A harus tetap ada."
    );

    assertEqual(
      guestACartStill.items.length,
      2,
      "Guest A harus tetap memiliki 2 CartItem."
    );

    const guestAItemA =
      guestACartStill.items.find(
        (item) =>
          item.skuId === skuAId
      );

    assert(
      guestAItemA,
      "Guest A SKU A harus tetap ada."
    );

    assertEqual(
      guestAItemA.quantity,
      3,
      "Guest A SKU A harus tetap quantity 3."
    );

    console.log(
      "PASS: Guest A dan Guest B memiliki cart terpisah."
    );

    /**
     * ==========================================================
     * TEST 7
     * UPDATE GUEST ITEM
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #7 - Update Guest A SKU B"
    );

    const guestAItemB =
      guestACartStill.items.find(
        (item) =>
          item.skuId === skuBId
      );

    assert(
      guestAItemB,
      "Guest A SKU B harus ditemukan."
    );

    await CartService.updateItem({
      owner: guestOwnerA,
      cartItemId: guestAItemB.id,
      quantity: 4,
    });

    const cartAfterUpdate =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      cartAfterUpdate,
      "Cart Guest A harus tetap tersedia."
    );

    const updatedItemB =
      cartAfterUpdate.items.find(
        (item) =>
          item.skuId === skuBId
      );

    assert(
      updatedItemB,
      "SKU B harus tetap ada setelah update."
    );

    assertEqual(
      updatedItemB.quantity,
      4,
      "Quantity SKU B harus menjadi 4."
    );

    console.log(
      "PASS: Guest A SKU B quantity → 4."
    );

    /**
     * ==========================================================
     * TEST 8
     * REMOVE GUEST ITEM
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #8 - Remove Guest A SKU B"
    );

    await CartService.removeItem({
      owner: guestOwnerA,
      cartItemId: updatedItemB.id,
    });

    const cartAfterRemove =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      cartAfterRemove,
      "Cart Guest A harus tetap ada setelah remove."
    );

    assertEqual(
      cartAfterRemove.items.length,
      1,
      "Guest A harus tersisa 1 CartItem."
    );

    assertEqual(
      cartAfterRemove.items[0].skuId,
      skuAId,
      "Item yang tersisa harus SKU A."
    );

    assertEqual(
      cartAfterRemove.items[0].quantity,
      3,
      "SKU A harus tetap quantity 3."
    );

    console.log(
      "PASS: Guest A SKU B berhasil dihapus."
    );

    /**
     * ==========================================================
     * TEST 9
     * WRONG OWNER CANNOT MODIFY
     * ==========================================================
     *
     * Guest B mencoba menghapus item milik Guest A.
     *
     * Harus ditolak oleh ownership validation di CartService.
     */

    console.log("");
    console.log(
      "TEST #9 - Guest B tidak boleh mengubah Cart Guest A"
    );

    let wrongOwnerRejected =
      false;

    try {
      await CartService.removeItem({
        owner: guestOwnerB,
        cartItemId:
          cartAfterRemove.items[0].id,
      });
    } catch (error) {
      wrongOwnerRejected = true;

      console.log(
        "Expected rejection:",
        error instanceof Error
          ? error.message
          : error
      );
    }

    assert(
      wrongOwnerRejected,
      "Guest B seharusnya ditolak ketika mencoba menghapus item Guest A."
    );

    const guestAAfterAttack =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      guestAAfterAttack,
      "Cart Guest A harus tetap ada."
    );

    assertEqual(
      guestAAfterAttack.items.length,
      1,
      "Cart Guest A tidak boleh berubah."
    );

    assertEqual(
      guestAAfterAttack.items[0].quantity,
      3,
      "Quantity Guest A harus tetap 3."
    );

    console.log(
      "PASS: Ownership isolation Guest A/B."
    );

    /**
     * ==========================================================
     * TEST 10
     * CLEAR GUEST CART
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST #10 - Clear Guest A cart"
    );

    await CartService.clearCart(
      guestOwnerA
    );

    const cartAfterClear =
      await CartService.getCart(
        guestOwnerA
      );

    assert(
      cartAfterClear,
      "Cart row Guest A seharusnya tetap ada setelah clearCart."
    );

    assertEqual(
      cartAfterClear.items.length,
      0,
      "ClearCart harus menghapus semua CartItem."
    );

    console.log(
      "PASS: Guest A cart berhasil dikosongkan."
    );

    /**
     * ==========================================================
     * TEST 11
     * CONCURRENT GUEST ADD
     * ==========================================================
     *
     * Buat guest baru agar test benar-benar bersih.
     *
     * 10 request concurrent:
     *
     *   add SKU A x1
     *
     * Expected:
     *
     *   1 CartItem
     *   quantity = 10
     *
     * Tidak boleh:
     *
     *   2+ CartItem dengan SKU yang sama.
     */

    console.log("");
    console.log(
      "TEST #11 - Concurrent Guest add SKU A x10"
    );

    const concurrentGuestId =
      randomUUID();

    const concurrentGuestOwner:
      CartOwner = {
      type: "guest",
      guestCartId:
        concurrentGuestId,
    };

    const concurrentOperations =
      Array.from(
        {
          length: 10,
        },
        () =>
          CartService.addItem({
            owner:
              concurrentGuestOwner,
            productId:
              productAId,
            skuId:
              skuAId,
            quantity: 1,
          })
      );

    const concurrentResults =
      await Promise.allSettled(
        concurrentOperations
      );

    const rejected =
      concurrentResults.filter(
        (result) =>
          result.status ===
          "rejected"
      );

    assertEqual(
      rejected.length,
      0,
      "Semua concurrent guest add seharusnya berhasil."
    );

    const concurrentCart =
      await CartService.getCart(
        concurrentGuestOwner
      );

    assert(
      concurrentCart,
      "Concurrent guest cart harus tersedia."
    );

    assertEqual(
      concurrentCart.items.length,
      1,
      "Concurrent guest add tidak boleh menghasilkan duplicate CartItem."
    );

    assertEqual(
      concurrentCart.items[0].skuId,
      skuAId,
      "Concurrent CartItem harus menggunakan SKU A."
    );

    assertEqual(
      concurrentCart.items[0].quantity,
      10,
      "10 concurrent add x1 harus menghasilkan quantity 10."
    );

    console.log(
      "PASS: 10 concurrent guest add → 1 CartItem quantity 10."
    );

    /**
     * ==========================================================
     * TEST 12
     * CONCURRENT GUEST ADD DIFFERENT SKUs
     * ==========================================================
     *
     * Ini memastikan concurrency tidak merusak item berbeda.
     */

    console.log("");
    console.log(
      "TEST #12 - Concurrent Guest add SKU A + SKU B"
    );

    const concurrentMixedGuestId =
      randomUUID();

    const concurrentMixedOwner:
      CartOwner = {
      type: "guest",
      guestCartId:
        concurrentMixedGuestId,
    };

    const mixedOperations =
      [
        ...Array.from(
          {
            length: 5,
          },
          () =>
            CartService.addItem({
              owner:
                concurrentMixedOwner,
              productId:
                productAId,
              skuId:
                skuAId,
              quantity: 1,
            })
        ),
        ...Array.from(
          {
            length: 5,
          },
          () =>
            CartService.addItem({
              owner:
                concurrentMixedOwner,
              productId:
                productBId,
              skuId:
                skuBId,
              quantity: 1,
            })
        ),
      ];

    const mixedResults =
      await Promise.allSettled(
        mixedOperations
      );

    const mixedRejected =
      mixedResults.filter(
        (result) =>
          result.status ===
          "rejected"
      );

    assertEqual(
      mixedRejected.length,
      0,
      "Semua concurrent mixed guest add seharusnya berhasil."
    );

    const mixedCart =
      await CartService.getCart(
        concurrentMixedOwner
      );

    assert(
      mixedCart,
      "Mixed concurrent guest cart harus tersedia."
    );

    assertEqual(
      mixedCart.items.length,
      2,
      "Mixed concurrent add harus menghasilkan 2 CartItem."
    );

    const mixedItemA =
      mixedCart.items.find(
        (item) =>
          item.skuId === skuAId
      );

    const mixedItemB =
      mixedCart.items.find(
        (item) =>
          item.skuId === skuBId
      );

    assert(
      mixedItemA,
      "Mixed cart harus memiliki SKU A."
    );

    assert(
      mixedItemB,
      "Mixed cart harus memiliki SKU B."
    );

    assertEqual(
      mixedItemA.quantity,
      5,
      "SKU A harus quantity 5."
    );

    assertEqual(
      mixedItemB.quantity,
      5,
      "SKU B harus quantity 5."
    );

    console.log(
      "PASS: Concurrent mixed add → SKU A x5 + SKU B x5."
    );

    /**
     * ==========================================================
     * CLEANUP TEST CARTS
     * ==========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "CLEANUP"
    );
    console.log(
      "============================================================"
    );

    await CartService.clearCart(
      guestOwnerA
    );

    await CartService.clearCart(
      guestOwnerB
    );

    await CartService.clearCart({
      type: "guest",
      guestCartId:
        concurrentGuestId,
    });

    await CartService.clearCart(
      concurrentMixedOwner
    );

    /**
     * ==========================================================
     * FINAL VERIFICATION
     * ==========================================================
     */

    const finalGuestA =
      await CartService.getCart(
        guestOwnerA
      );

    const finalGuestB =
      await CartService.getCart(
        guestOwnerB
      );

    const finalConcurrent =
      await CartService.getCart({
        type: "guest",
        guestCartId:
          concurrentGuestId,
      });

    const finalMixed =
      await CartService.getCart(
        concurrentMixedOwner
      );

    assert(
      !finalGuestA ||
        finalGuestA.items.length === 0,
      "Cleanup Guest A gagal."
    );

    assert(
      !finalGuestB ||
        finalGuestB.items.length === 0,
      "Cleanup Guest B gagal."
    );

    assert(
      !finalConcurrent ||
        finalConcurrent.items.length === 0,
      "Cleanup concurrent guest gagal."
    );

    assert(
      !finalMixed ||
        finalMixed.items.length === 0,
      "Cleanup mixed guest gagal."
    );

    console.log(
      "PASS: Semua test cart berhasil dibersihkan."
    );

    /**
     * ==========================================================
     * SUCCESS
     * ==========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "=== RESULT ==="
    );
    console.log(
      "============================================================"
    );

    console.log(
      "ALL GUEST CART REGRESSION TESTS PASSED"
    );

    console.log("");
    console.log(
      "Guest Cart yang berhasil diuji:"
    );

    console.log(
      "✓ Guest owner isolation"
    );

    console.log(
      "✓ Add SKU"
    );

    console.log(
      "✓ Same SKU quantity merge"
    );

    console.log(
      "✓ Multiple SKU"
    );

    console.log(
      "✓ Guest-to-guest isolation"
    );

    console.log(
      "✓ Update item"
    );

    console.log(
      "✓ Remove item"
    );

    console.log(
      "✓ Wrong-owner protection"
    );

    console.log(
      "✓ Clear cart"
    );

    console.log(
      "✓ Concurrent same-SKU add"
    );

    console.log(
      "✓ Concurrent mixed-SKU add"
    );

    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "============================================================"
    );
    console.error(
      "=== GUEST CART REGRESSION TEST FAILED ==="
    );
    console.error(
      "============================================================"
    );

    console.error(error);

    /**
     * Best-effort cleanup.
     *
     * Jangan biarkan CartItem test tertinggal jika salah satu
     * assertion gagal.
     */

    try {
      await CartService.clearCart(
        guestOwnerA
      );
    } catch {}

    try {
      await CartService.clearCart(
        guestOwnerB
      );
    } catch {}

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  process.exit(1);
});
