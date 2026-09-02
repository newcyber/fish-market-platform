import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import OrderService from "@/services/order/order.service";

const TEST_USER_A_ID =
  "436d434a-64d9-4abf-80ed-33179ef3e4ab";

const TEST_PRODUCT_ID =
  "c865f20f-8de5-4e0e-a345-87e83dce5ee2";

const TEST_SKU_ID =
  "13c6d46c-92f7-49af-a55d-6a8683053933";

const TEST_SKU_CODE =
  "TEST-TUNA-BERAT-DIBERSIHKAN-2";

const TEST_QUANTITY = 1;

const TEST_ORDER_PREFIX =
  `TEST-24-CANCEL-${Date.now()}-`;

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

function section(title: string) {
  console.log("");
  console.log(
    "============================================================"
  );
  console.log(title);
  console.log(
    "============================================================"
  );
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function createTestOrder(
  userId: string,
  status: OrderStatus = OrderStatus.PENDING,
  paymentStatus: PaymentStatus = PaymentStatus.PENDING
) {
  const address =
    await prisma.address.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  assert(
    address,
    `Address aktif untuk user ${userId} tidak ditemukan.`
  );

  const paymentChannel =
    await prisma.paymentChannel.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

  assert(
    paymentChannel,
    "PaymentChannel aktif tidak ditemukan."
  );

  const sku =
    await prisma.productSku.findUnique({
      where: {
        id: TEST_SKU_ID,
      },
      select: {
        id: true,
        sku: true,
        productId: true,
        price: true,
        stock: true,
        isActive: true,
      },
    });

  assert(
    sku,
    `SKU ${TEST_SKU_ID} tidak ditemukan.`
  );

  assert(
    sku.sku === TEST_SKU_CODE,
    `SKU code mismatch: ${sku.sku}`
  );

  assert(
    sku.productId === TEST_PRODUCT_ID,
    "SKU productId tidak sesuai."
  );

  assert(
    sku.isActive,
    "SKU test harus aktif."
  );

  assert(
    sku.stock >= TEST_QUANTITY,
    `Stock tidak cukup. stock=${sku.stock}`
  );

  const price = sku.price;

  const orderNumber =
    `${TEST_ORDER_PREFIX}${crypto.randomUUID()}`;

const order =
  await prisma.order.create({
    data: {
      orderNumber,
      userId,
      addressId: address.id,
      paymentChannelId: paymentChannel.id,

      status,
      paymentStatus,
      paymentMethod: PaymentMethod.BANK_TRANSFER,

      subtotal: price,
      shippingCost: 0,
      total: price,

      notes:
        `${TEST_ORDER_PREFIX}${status}`,

      items: {
        create: {
          productId: TEST_PRODUCT_ID,
          skuId: TEST_SKU_ID,
          productName: "TEST Tuna",
          quantity: TEST_QUANTITY,
          price,
          subtotal: price,
        },
      },
    },
    include: {
      items: true,
    },
  });

  return order;
}

async function cleanupOrder(
  orderId: string
) {
  await prisma.stockLedger.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.orderItem.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.order.delete({
    where: {
      id: orderId,
    },
  });
}

async function main() {
  section(
    "TEST 24 - CUSTOMER ORDER CANCELLATION"
  );

  const createdOrderIds: string[] = [];

  let originalStock: number | null =
    null;

  try {
    // ==========================================================
    // 1. VALIDATE USER
    // ==========================================================

    const user =
      await prisma.user.findFirst({
        where: {
          id: TEST_USER_A_ID,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

    assert(
      user,
      "Test user tidak ditemukan / tidak aktif."
    );

    assert(
      user.role === "CUSTOMER",
      `User test harus CUSTOMER, aktual=${user.role}`
    );

    console.log(
      "PASS: Test customer valid."
    );

    console.log({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // ==========================================================
    // 2. VALIDATE SKU
    // ==========================================================

    const sku =
      await prisma.productSku.findUnique({
        where: {
          id: TEST_SKU_ID,
        },
        select: {
          id: true,
          sku: true,
          productId: true,
          stock: true,
          isActive: true,
        },
      });

    assert(
      sku,
      "SKU test tidak ditemukan."
    );

    assert(
      sku.productId === TEST_PRODUCT_ID,
      "SKU productId mismatch."
    );

    assert(
      sku.sku === TEST_SKU_CODE,
      "SKU code mismatch."
    );

    assert(
      sku.isActive,
      "SKU test harus aktif."
    );

    originalStock = sku.stock;

    console.log({
      sku: sku.sku,
      skuId: sku.id,
      stock: sku.stock,
    });

    console.log(
      "PASS: SKU fixture valid."
    );

    // ==========================================================
    // 3. TEST 24A
    // CUSTOMER BOLEH CANCEL ORDER MILIK SENDIRI
    // ==========================================================

    section(
      "TEST 24A - CUSTOMER CANCEL OWN PENDING ORDER"
    );

    const ownOrder =
      await createTestOrder(
        TEST_USER_A_ID,
        OrderStatus.PENDING,
        PaymentStatus.PENDING
      );

    createdOrderIds.push(
      ownOrder.id
    );

    const stockBeforeCancel =
      (
        await prisma.productSku.findUnique({
          where: {
            id: TEST_SKU_ID,
          },
          select: {
            stock: true,
          },
        })
      )?.stock;

    assert(
      stockBeforeCancel !== undefined &&
        stockBeforeCancel !== null,
      "Stock sebelum cancellation tidak ditemukan."
    );

    const cancelledOrder =
      await OrderService.cancelOrderForUser(
        ownOrder.id,
        TEST_USER_A_ID
      );

    assert(
      cancelledOrder.status ===
        OrderStatus.CANCELLED,
      `Order harus CANCELLED, aktual=${cancelledOrder.status}`
    );

    const stockAfterCancel =
      (
        await prisma.productSku.findUnique({
          where: {
            id: TEST_SKU_ID,
          },
          select: {
            stock: true,
          },
        })
      )?.stock;

    assert(
      stockAfterCancel ===
        stockBeforeCancel + TEST_QUANTITY,
      `Stock harus kembali +${TEST_QUANTITY}. Before=${stockBeforeCancel}, After=${stockAfterCancel}`
    );

    const cancelLedgers =
      await prisma.stockLedger.count({
        where: {
          orderId: ownOrder.id,
          skuId: TEST_SKU_ID,
          type: "CANCEL",
        },
      });

    assert(
      cancelLedgers === 1,
      `Harus ada tepat 1 CANCEL ledger, aktual=${cancelLedgers}`
    );

    console.log(
      "PASS: Customer berhasil membatalkan order miliknya."
    );

    console.log({
      orderId: ownOrder.id,
      status: cancelledOrder.status,
      stockBefore: stockBeforeCancel,
      stockAfter: stockAfterCancel,
      cancelLedgers,
    });

    // ==========================================================
    // 4. TEST 24B
    // CUSTOMER TIDAK BOLEH CANCEL ORDER MILIK USER LAIN
    // ==========================================================

    section(
      "TEST 24B - CUSTOMER CANNOT CANCEL OTHER USER ORDER"
    );

const otherUser =
  await prisma.user.findFirst({
    where: {
      id: {
        not: TEST_USER_A_ID,
      },
      role: "CUSTOMER",
      deletedAt: null,
      isActive: true,

      addresses: {
        some: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

    assert(
      otherUser,
      "Tidak ditemukan customer kedua untuk authorization test."
    );

    const otherOrder =
      await createTestOrder(
        otherUser.id,
        OrderStatus.PENDING,
        PaymentStatus.PENDING
      );

    createdOrderIds.push(
      otherOrder.id
    );

    let rejected = false;

    try {
      await OrderService.cancelOrderForUser(
        otherOrder.id,
        TEST_USER_A_ID
      );
    } catch (error) {
      rejected = true;

      console.log(
        "Expected rejection:",
        getErrorMessage(error)
      );
    }

    assert(
      rejected,
      "Customer A seharusnya tidak dapat membatalkan order Customer B."
    );

    const unchangedOtherOrder =
      await prisma.order.findUnique({
        where: {
          id: otherOrder.id,
        },
        select: {
          status: true,
          paymentStatus: true,
        },
      });

    assert(
      unchangedOtherOrder?.status ===
        OrderStatus.PENDING,
      `Order milik user lain harus tetap PENDING, aktual=${unchangedOtherOrder?.status}`
    );

    const otherOrderLedgers =
      await prisma.stockLedger.count({
        where: {
          orderId: otherOrder.id,
          type: "CANCEL",
        },
      });

    assert(
      otherOrderLedgers === 0,
      `Order yang ditolak tidak boleh memiliki CANCEL ledger. aktual=${otherOrderLedgers}`
    );

    console.log(
      "PASS: Customer tidak dapat membatalkan order customer lain."
    );

    console.log({
      otherOrderId: otherOrder.id,
      status:
        unchangedOtherOrder?.status,
      cancelLedgers:
        otherOrderLedgers,
    });

    // ==========================================================
// 5. TEST 24C
// CUSTOMER BOLEH CANCEL WAITING_PAYMENT
// ==========================================================

section(
  "TEST 24C - CUSTOMER CANCEL WAITING_PAYMENT ORDER"
);

const waitingPaymentOrder =
  await createTestOrder(
    TEST_USER_A_ID,
    OrderStatus.WAITING_PAYMENT,
    PaymentStatus.PENDING
  );

createdOrderIds.push(
  waitingPaymentOrder.id
);

const stockBeforeWaitingPaymentCancel =
  (
    await prisma.productSku.findUnique({
      where: {
        id: TEST_SKU_ID,
      },
      select: {
        stock: true,
      },
    })
  )?.stock;

assert(
  stockBeforeWaitingPaymentCancel !==
      undefined &&
    stockBeforeWaitingPaymentCancel !== null,
  "Stock sebelum WAITING_PAYMENT cancellation tidak ditemukan."
);

const cancelledWaitingPaymentOrder =
  await OrderService.cancelOrderForUser(
    waitingPaymentOrder.id,
    TEST_USER_A_ID
  );

assert(
  cancelledWaitingPaymentOrder.status ===
    OrderStatus.CANCELLED,
  `WAITING_PAYMENT order harus CANCELLED, aktual=${cancelledWaitingPaymentOrder.status}`
);

const stockAfterWaitingPaymentCancel =
  (
    await prisma.productSku.findUnique({
      where: {
        id: TEST_SKU_ID,
      },
      select: {
        stock: true,
      },
    })
  )?.stock;

assert(
  stockAfterWaitingPaymentCancel ===
    stockBeforeWaitingPaymentCancel +
      TEST_QUANTITY,
  `Stock harus kembali +${TEST_QUANTITY}. Before=${stockBeforeWaitingPaymentCancel}, After=${stockAfterWaitingPaymentCancel}`
);

const waitingPaymentCancelLedgers =
  await prisma.stockLedger.count({
    where: {
      orderId:
        waitingPaymentOrder.id,
      skuId: TEST_SKU_ID,
      type: "CANCEL",
    },
  });

assert(
  waitingPaymentCancelLedgers === 1,
  `WAITING_PAYMENT harus memiliki tepat 1 CANCEL ledger, aktual=${waitingPaymentCancelLedgers}`
);

console.log(
  "PASS: Customer berhasil membatalkan WAITING_PAYMENT order."
);

console.log({
  orderId:
    waitingPaymentOrder.id,
  status:
    cancelledWaitingPaymentOrder.status,
  stockBefore:
    stockBeforeWaitingPaymentCancel,
  stockAfter:
    stockAfterWaitingPaymentCancel,
  cancelLedgers:
    waitingPaymentCancelLedgers,
});

    section(
      "TEST 24 - INITIAL CANCELLATION TESTS PASSED"
    );

console.log(
  "TEST 24A + 24B + 24C + 24D + 24E PASSED"
);
  } catch (error) {
    console.error("");
    console.error(
      "TEST 24 FAILED:"
    );
    console.error(
      getErrorMessage(error)
    );

    process.exitCode = 1;
  } finally {

    // ==========================================================
// 6. TEST 24D
// CUSTOMER TIDAK BOLEH CANCEL FORBIDDEN LIFECYCLE STATUS
// ==========================================================

section(
  "TEST 24D - CUSTOMER CANNOT CANCEL FORBIDDEN STATUS"
);

const forbiddenStatuses = [
  OrderStatus.WAITING_VERIFICATION,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
] as const;

for (const status of forbiddenStatuses) {
  const order = await createTestOrder(
    TEST_USER_A_ID,
    status,
    status === OrderStatus.COMPLETED
      ? PaymentStatus.VERIFIED
      : status === OrderStatus.CANCELLED
        ? PaymentStatus.PENDING
        : PaymentStatus.PENDING
  );

  createdOrderIds.push(order.id);

  const stockBefore =
    (
      await prisma.productSku.findUnique({
        where: { id: TEST_SKU_ID },
        select: { stock: true },
      })
    )?.stock;

  assert(
    stockBefore !== undefined &&
      stockBefore !== null,
    `Stock sebelum status ${status} tidak ditemukan.`
  );

  let rejected = false;

  try {
    await OrderService.cancelOrderForUser(
      order.id,
      TEST_USER_A_ID
    );
  } catch (error) {
    rejected = true;

    console.log(
      `Expected rejection [${status}]:`,
      error instanceof Error
        ? error.message
        : String(error)
    );
  }

  assert(
    rejected,
    `Customer seharusnya TIDAK dapat cancel status ${status}.`
  );

  const afterAttempt =
    await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        status: true,
        paymentStatus: true,
        userId: true,
      },
    });

  assert(
    afterAttempt?.status === status,
    `Status ${status} berubah setelah cancel attempt. Aktual=${afterAttempt?.status}`
  );

  assert(
    afterAttempt?.userId === TEST_USER_A_ID,
    `Ownership order status ${status} berubah/tidak sesuai.`
  );

  const stockAfter =
    (
      await prisma.productSku.findUnique({
        where: { id: TEST_SKU_ID },
        select: { stock: true },
      })
    )?.stock;

  assert(
    stockAfter === stockBefore,
    `Stock berubah untuk status ${status}. Before=${stockBefore}, After=${stockAfter}`
  );

  const cancelLedgers =
    await prisma.stockLedger.count({
      where: {
        orderId: order.id,
        skuId: TEST_SKU_ID,
        type: "CANCEL",
      },
    });

  assert(
    cancelLedgers === 0,
    `Status ${status} tidak boleh memiliki CANCEL ledger. Aktual=${cancelLedgers}`
  );

  console.log(
    `PASS: Customer tidak dapat cancel ${status}.`
  );

  console.log({
    orderId: order.id,
    statusBefore: status,
    statusAfter: afterAttempt?.status,
    paymentStatus: afterAttempt?.paymentStatus,
    stockBefore,
    stockAfter,
    cancelLedgers,
  });
}

// ==========================================================
// 7. TEST 24E
// CUSTOMER TIDAK BOLEH CANCEL ORDER PAYMENT VERIFIED
// ==========================================================

section(
  "TEST 24E - CUSTOMER CANNOT CANCEL VERIFIED PAYMENT ORDER"
);

const verifiedPaymentOrder =
  await createTestOrder(
    TEST_USER_A_ID,
    OrderStatus.PENDING,
    PaymentStatus.VERIFIED
  );

createdOrderIds.push(
  verifiedPaymentOrder.id
);

const stockBeforeVerifiedCancel =
  (
    await prisma.productSku.findUnique({
      where: { id: TEST_SKU_ID },
      select: { stock: true },
    })
  )?.stock;

assert(
  stockBeforeVerifiedCancel !== undefined &&
    stockBeforeVerifiedCancel !== null,
  "Stock sebelum VERIFIED payment cancellation tidak ditemukan."
);

let verifiedCancelRejected = false;

try {
  await OrderService.cancelOrderForUser(
    verifiedPaymentOrder.id,
    TEST_USER_A_ID
  );
} catch (error) {
  verifiedCancelRejected = true;

  console.log(
    "Expected rejection [VERIFIED PAYMENT]:",
    error instanceof Error
      ? error.message
      : String(error)
  );
}

assert(
  verifiedCancelRejected,
  "Customer seharusnya TIDAK dapat cancel order dengan paymentStatus VERIFIED."
);

const verifiedOrderAfterAttempt =
  await prisma.order.findUnique({
    where: {
      id: verifiedPaymentOrder.id,
    },
    select: {
      status: true,
      paymentStatus: true,
      userId: true,
    },
  });

assert(
  verifiedOrderAfterAttempt?.status ===
    OrderStatus.PENDING,
  `Status order VERIFIED berubah. Aktual=${verifiedOrderAfterAttempt?.status}`
);

assert(
  verifiedOrderAfterAttempt?.paymentStatus ===
    PaymentStatus.VERIFIED,
  `paymentStatus VERIFIED berubah. Aktual=${verifiedOrderAfterAttempt?.paymentStatus}`
);

assert(
  verifiedOrderAfterAttempt?.userId ===
    TEST_USER_A_ID,
  "Ownership order VERIFIED tidak sesuai."
);

const stockAfterVerifiedCancel =
  (
    await prisma.productSku.findUnique({
      where: { id: TEST_SKU_ID },
      select: { stock: true },
    })
  )?.stock;

assert(
  stockAfterVerifiedCancel ===
    stockBeforeVerifiedCancel,
  `Stock berubah pada VERIFIED payment cancellation attempt. Before=${stockBeforeVerifiedCancel}, After=${stockAfterVerifiedCancel}`
);

const verifiedCancelLedgers =
  await prisma.stockLedger.count({
    where: {
      orderId: verifiedPaymentOrder.id,
      skuId: TEST_SKU_ID,
      type: "CANCEL",
    },
  });

assert(
  verifiedCancelLedgers === 0,
  `Order VERIFIED tidak boleh memiliki CANCEL ledger. Aktual=${verifiedCancelLedgers}`
);

console.log(
  "PASS: Customer tidak dapat cancel order dengan paymentStatus VERIFIED."
);

console.log({
  orderId: verifiedPaymentOrder.id,
  status: verifiedOrderAfterAttempt?.status,
  paymentStatus:
    verifiedOrderAfterAttempt?.paymentStatus,
  stockBefore: stockBeforeVerifiedCancel,
  stockAfter: stockAfterVerifiedCancel,
  cancelLedgers: verifiedCancelLedgers,
});

// ==========================================================
// TEST 24F - CONCURRENT CUSTOMER CANCELLATION
// ==========================================================

section(
  "TEST 24F - CONCURRENT CUSTOMER CANCELLATION"
);

const concurrentCancelOrder =
  await createTestOrder(
    TEST_USER_A_ID,
    OrderStatus.PENDING,
    PaymentStatus.PENDING
  );

createdOrderIds.push(concurrentCancelOrder.id);

const concurrentQuantity = 1;

// Simulasikan stock sudah di-reserve oleh order.
// Cancellation seharusnya mengembalikan +1.
const concurrentStockBeforeReservation =
  (
    await prisma.productSku.findUnique({
      where: { id: TEST_SKU_ID },
      select: { stock: true },
    })
  )?.stock;

assert(
  concurrentStockBeforeReservation !== undefined &&
    concurrentStockBeforeReservation !== null,
  "Stock awal concurrent cancellation tidak ditemukan."
);

const reservedStock =
  concurrentStockBeforeReservation - concurrentQuantity;

assert(
  reservedStock >= 0,
  `Stock fixture tidak cukup untuk simulasi reservation. Stock=${concurrentStockBeforeReservation}`
);

await prisma.productSku.update({
  where: {
    id: TEST_SKU_ID,
  },
  data: {
    stock: reservedStock,
  },
});

const stockBeforeConcurrentCancel =
  (
    await prisma.productSku.findUnique({
      where: { id: TEST_SKU_ID },
      select: { stock: true },
    })
  )?.stock;

assert(
  stockBeforeConcurrentCancel === reservedStock,
  "Stock reservation fixture gagal."
);

console.log({
  orderId: concurrentCancelOrder.id,
  stockBeforeReservation:
    concurrentStockBeforeReservation,
  stockBeforeConcurrentCancel,
  quantity: concurrentQuantity,
});

// ----------------------------------------------------------
// Run two cancellations at exactly the same time.
// ----------------------------------------------------------

const concurrentResults =
  await Promise.allSettled([
    OrderService.cancelOrderForUser(
      concurrentCancelOrder.id,
      TEST_USER_A_ID
    ),
    OrderService.cancelOrderForUser(
      concurrentCancelOrder.id,
      TEST_USER_A_ID
    ),
  ]);

const successResults =
  concurrentResults.filter(
    (result) => result.status === "fulfilled"
  );

const failedResults =
  concurrentResults.filter(
    (result) => result.status === "rejected"
  );

assert(
  successResults.length === 1,
  `Concurrent cancellation harus menghasilkan tepat 1 success. Aktual=${successResults.length}`
);

assert(
  failedResults.length === 1,
  `Concurrent cancellation harus menghasilkan tepat 1 failure. Aktual=${failedResults.length}`
);

console.log(
  "Concurrent cancellation results:",
  concurrentResults.map((result) =>
    result.status === "fulfilled"
      ? {
          status: "fulfilled",
        }
      : {
          status: "rejected",
          reason:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        }
  )
);

// ----------------------------------------------------------
// Verify final order state.
// ----------------------------------------------------------

const concurrentOrderAfter =
  await prisma.order.findUnique({
    where: {
      id: concurrentCancelOrder.id,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      paymentStatus: true,
    },
  });

assert(
  concurrentOrderAfter?.status ===
    OrderStatus.CANCELLED,
  `Final status concurrent cancellation harus CANCELLED. Aktual=${concurrentOrderAfter?.status}`
);

assert(
  concurrentOrderAfter?.paymentStatus ===
    PaymentStatus.PENDING,
  `paymentStatus berubah tidak semestinya. Aktual=${concurrentOrderAfter?.paymentStatus}`
);

// ----------------------------------------------------------
// Verify stock restored exactly once.
// ----------------------------------------------------------

const stockAfterConcurrentCancel =
  (
    await prisma.productSku.findUnique({
      where: { id: TEST_SKU_ID },
      select: { stock: true },
    })
  )?.stock;

assert(
  stockAfterConcurrentCancel ===
    stockBeforeConcurrentCancel + concurrentQuantity,
  `Stock harus kembali tepat +${concurrentQuantity}. Before=${stockBeforeConcurrentCancel}, After=${stockAfterConcurrentCancel}`
);

// ----------------------------------------------------------
// Verify exactly one CANCEL ledger.
// ----------------------------------------------------------

const concurrentCancelLedgers =
  await prisma.stockLedger.count({
    where: {
      orderId: concurrentCancelOrder.id,
      skuId: TEST_SKU_ID,
      type: "CANCEL",
    },
  });

assert(
  concurrentCancelLedgers === 1,
  `Concurrent cancellation harus menghasilkan tepat 1 CANCEL ledger. Aktual=${concurrentCancelLedgers}`
);

console.log(
  "PASS: Concurrent cancellation aman."
);

console.log({
  orderId: concurrentCancelOrder.id,
  successCount: successResults.length,
  failureCount: failedResults.length,
  finalStatus: concurrentOrderAfter?.status,
  stockBefore: stockBeforeConcurrentCancel,
  stockAfter: stockAfterConcurrentCancel,
  cancelLedgers: concurrentCancelLedgers,
});

// ==========================================================
// TEST 24G - MULTI-SKU CANCELLATION INTEGRITY
// ==========================================================

section(
  "TEST 24G - MULTI-SKU CANCELLATION INTEGRITY"
);

const multiSkuQuantityA = 2;
const multiSkuQuantityB = 3;

// ----------------------------------------------------------
// Get SKU A
// ----------------------------------------------------------

const multiSkuA =
  await prisma.productSku.findUnique({
    where: {
      id: TEST_SKU_ID,
    },
    select: {
      id: true,
      sku: true,
      productId: true,
      price: true,
      stock: true,
      isActive: true,
    },
  });

assert(
  multiSkuA,
  "SKU A TEST 24G tidak ditemukan."
);

assert(
  multiSkuA.isActive,
  `SKU A ${multiSkuA.sku} harus aktif.`
);

assert(
  multiSkuA.stock >= multiSkuQuantityA,
  `Stock SKU A tidak cukup. Stock=${multiSkuA.stock}`
);

// ----------------------------------------------------------
// Get SKU B
// ----------------------------------------------------------

const multiSkuB =
  await prisma.productSku.findFirst({
    where: {
      isActive: true,
      id: {
        not: multiSkuA.id,
      },
      stock: {
        gte: multiSkuQuantityB,
      },
    },
    select: {
      id: true,
      sku: true,
      productId: true,
      price: true,
      stock: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

assert(
  multiSkuB,
  "SKU B aktif dengan stock minimal 3 tidak ditemukan."
);

console.log("SKU A:", {
  id: multiSkuA.id,
  sku: multiSkuA.sku,
  productId: multiSkuA.productId,
  stockBefore: multiSkuA.stock,
  quantity: multiSkuQuantityA,
});

console.log("SKU B:", {
  id: multiSkuB.id,
  sku: multiSkuB.sku,
  productId: multiSkuB.productId,
  stockBefore: multiSkuB.stock,
  quantity: multiSkuQuantityB,
});

// ----------------------------------------------------------
// Create multi-SKU order
// ----------------------------------------------------------

const multiSkuAddress =
  await prisma.address.findFirst({
    where: {
      userId: TEST_USER_A_ID,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

assert(
  multiSkuAddress,
  "Address aktif untuk TEST 24G tidak ditemukan."
);

const multiSkuPaymentChannel =
  await prisma.paymentChannel.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

assert(
  multiSkuPaymentChannel,
  "PaymentChannel aktif untuk TEST 24G tidak ditemukan."
);

const multiSkuSubtotal =
  multiSkuA.price
    .mul(multiSkuQuantityA)
    .add(
      multiSkuB.price.mul(
        multiSkuQuantityB
      )
    );

const multiSkuOrder =
  await prisma.order.create({
    data: {
      orderNumber:
        `${TEST_ORDER_PREFIX}MULTI-${crypto.randomUUID()}`,

      userId: TEST_USER_A_ID,

      addressId:
        multiSkuAddress.id,

      paymentChannelId:
        multiSkuPaymentChannel.id,

      status:
        OrderStatus.PENDING,

      paymentStatus:
        PaymentStatus.PENDING,

      paymentMethod:
        PaymentMethod.BANK_TRANSFER,

      subtotal:
        multiSkuSubtotal,

      shippingCost: 0,

      total:
        multiSkuSubtotal,

      notes:
        `${TEST_ORDER_PREFIX}MULTI-SKU`,

      items: {
        create: [
          {
            productId:
              multiSkuA.productId,

            skuId:
              multiSkuA.id,

            productName:
              `TEST 24G SKU A ${multiSkuA.sku}`,

            quantity:
              multiSkuQuantityA,

            price:
              multiSkuA.price,

            subtotal:
              multiSkuA.price.mul(
                multiSkuQuantityA
              ),
          },
          {
            productId:
              multiSkuB.productId,

            skuId:
              multiSkuB.id,

            productName:
              `TEST 24G SKU B ${multiSkuB.sku}`,

            quantity:
              multiSkuQuantityB,

            price:
              multiSkuB.price,

            subtotal:
              multiSkuB.price.mul(
                multiSkuQuantityB
              ),
          },
        ],
      },
    },

    include: {
      items: true,
    },
  });

createdOrderIds.push(
  multiSkuOrder.id
);

assert(
  multiSkuOrder.items.length === 2,
  `TEST 24G harus memiliki 2 OrderItem. Aktual=${multiSkuOrder.items.length}`
);

// ----------------------------------------------------------
// Simulate stock reservation
//
// SKU A: stock - 2
// SKU B: stock - 3
// ----------------------------------------------------------

const multiSkuStockAReserved =
  multiSkuA.stock -
  multiSkuQuantityA;

const multiSkuStockBReserved =
  multiSkuB.stock -
  multiSkuQuantityB;

await prisma.productSku.update({
  where: {
    id: multiSkuA.id,
  },
  data: {
    stock:
      multiSkuStockAReserved,
  },
});

await prisma.productSku.update({
  where: {
    id: multiSkuB.id,
  },
  data: {
    stock:
      multiSkuStockBReserved,
  },
});

// Verify reservation simulation.

const multiSkuReservedA =
  await prisma.productSku.findUnique({
    where: {
      id: multiSkuA.id,
    },
    select: {
      stock: true,
    },
  });

const multiSkuReservedB =
  await prisma.productSku.findUnique({
    where: {
      id: multiSkuB.id,
    },
    select: {
      stock: true,
    },
  });

assert(
  multiSkuReservedA?.stock ===
    multiSkuStockAReserved,
  `Reservation SKU A gagal. Expected=${multiSkuStockAReserved}, Actual=${multiSkuReservedA?.stock}`
);

assert(
  multiSkuReservedB?.stock ===
    multiSkuStockBReserved,
  `Reservation SKU B gagal. Expected=${multiSkuStockBReserved}, Actual=${multiSkuReservedB?.stock}`
);

console.log("Stock setelah simulasi reservation:", {
  skuA:
    multiSkuReservedA?.stock,
  skuB:
    multiSkuReservedB?.stock,
});

// ----------------------------------------------------------
// Execute customer cancellation
// ----------------------------------------------------------

const multiSkuCancelResult =
  await OrderService.cancelOrderForUser(
    multiSkuOrder.id,
    TEST_USER_A_ID
  );

assert(
  multiSkuCancelResult.status ===
    OrderStatus.CANCELLED,
  `TEST 24G order harus CANCELLED. Aktual=${multiSkuCancelResult.status}`
);

// ----------------------------------------------------------
// Verify stock restored exactly
// ----------------------------------------------------------

const multiSkuStockAAfter =
  await prisma.productSku.findUnique({
    where: {
      id: multiSkuA.id,
    },
    select: {
      stock: true,
    },
  });

const multiSkuStockBAfter =
  await prisma.productSku.findUnique({
    where: {
      id: multiSkuB.id,
    },
    select: {
      stock: true,
    },
  });

assert(
  multiSkuStockAAfter?.stock ===
    multiSkuA.stock,
  `Stock SKU A tidak kembali tepat. Expected=${multiSkuA.stock}, Actual=${multiSkuStockAAfter?.stock}`
);

assert(
  multiSkuStockBAfter?.stock ===
    multiSkuB.stock,
  `Stock SKU B tidak kembali tepat. Expected=${multiSkuB.stock}, Actual=${multiSkuStockBAfter?.stock}`
);

// ----------------------------------------------------------
// Verify CANCEL ledger SKU A
// ----------------------------------------------------------

const multiSkuLedgerA =
  await prisma.stockLedger.findMany({
    where: {
      orderId:
        multiSkuOrder.id,

      skuId:
        multiSkuA.id,

      type:
        "CANCEL",
    },

    select: {
      id: true,
      skuId: true,
      quantity: true,
      stockBefore: true,
      stockAfter: true,
      type: true,
    },
  });

assert(
  multiSkuLedgerA.length === 1,
  `SKU A harus memiliki tepat 1 CANCEL ledger. Aktual=${multiSkuLedgerA.length}`
);

assert(
  multiSkuLedgerA[0].quantity ===
    multiSkuQuantityA,
  `CANCEL ledger SKU A quantity salah. Expected=${multiSkuQuantityA}, Actual=${multiSkuLedgerA[0].quantity}`
);

assert(
  multiSkuLedgerA[0].stockBefore ===
    multiSkuStockAReserved,
  `CANCEL ledger SKU A stockBefore salah. Expected=${multiSkuStockAReserved}, Actual=${multiSkuLedgerA[0].stockBefore}`
);

assert(
  multiSkuLedgerA[0].stockAfter ===
    multiSkuA.stock,
  `CANCEL ledger SKU A stockAfter salah. Expected=${multiSkuA.stock}, Actual=${multiSkuLedgerA[0].stockAfter}`
);

// ----------------------------------------------------------
// Verify CANCEL ledger SKU B
// ----------------------------------------------------------

const multiSkuLedgerB =
  await prisma.stockLedger.findMany({
    where: {
      orderId:
        multiSkuOrder.id,

      skuId:
        multiSkuB.id,

      type:
        "CANCEL",
    },

    select: {
      id: true,
      skuId: true,
      quantity: true,
      stockBefore: true,
      stockAfter: true,
      type: true,
    },
  });

assert(
  multiSkuLedgerB.length === 1,
  `SKU B harus memiliki tepat 1 CANCEL ledger. Aktual=${multiSkuLedgerB.length}`
);

assert(
  multiSkuLedgerB[0].quantity ===
    multiSkuQuantityB,
  `CANCEL ledger SKU B quantity salah. Expected=${multiSkuQuantityB}, Actual=${multiSkuLedgerB[0].quantity}`
);

assert(
  multiSkuLedgerB[0].stockBefore ===
    multiSkuStockBReserved,
  `CANCEL ledger SKU B stockBefore salah. Expected=${multiSkuStockBReserved}, Actual=${multiSkuLedgerB[0].stockBefore}`
);

assert(
  multiSkuLedgerB[0].stockAfter ===
    multiSkuB.stock,
  `CANCEL ledger SKU B stockAfter salah. Expected=${multiSkuB.stock}, Actual=${multiSkuLedgerB[0].stockAfter}`
);

console.log(
  "PASS: Multi-SKU cancellation mengembalikan stock dengan tepat."
);

console.log({
  orderId:
    multiSkuOrder.id,

  finalStatus:
    multiSkuCancelResult.status,

  skuA: {
    sku:
      multiSkuA.sku,
    quantity:
      multiSkuQuantityA,
    stockBefore:
      multiSkuA.stock,
    stockReserved:
      multiSkuStockAReserved,
    stockAfter:
      multiSkuStockAAfter?.stock,
    ledger:
      multiSkuLedgerA[0],
  },

  skuB: {
    sku:
      multiSkuB.sku,
    quantity:
      multiSkuQuantityB,
    stockBefore:
      multiSkuB.stock,
    stockReserved:
      multiSkuStockBReserved,
    stockAfter:
      multiSkuStockBAfter?.stock,
    ledger:
      multiSkuLedgerB[0],
  },
});

    // ==========================================================
    // CLEANUP
    // ==========================================================

    section(
      "TEST 24 CLEANUP"
    );

    for (
      const orderId of createdOrderIds
    ) {
      try {
        await cleanupOrder(
          orderId
        );

        console.log(
          `PASS: Cleanup order ${orderId}`
        );
      } catch (error) {
        console.error(
          `WARN: Cleanup order ${orderId} gagal:`,
          getErrorMessage(error)
        );
      }
    }

    if (
      originalStock !== null
    ) {
      try {
        await prisma.productSku.update({
          where: {
            id: TEST_SKU_ID,
          },
          data: {
            stock: originalStock,
            isActive: true,
          },
        });

        console.log(
          `PASS: Stock dikembalikan ke ${originalStock}.`
        );
      } catch (error) {
        console.error(
          "WARN: Gagal mengembalikan stock:",
          getErrorMessage(error)
        );
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(
    "UNHANDLED TEST ERROR:",
    error
  );

  process.exit(1);
});
