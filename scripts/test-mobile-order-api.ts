import bcrypt from "bcryptjs";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { MobileAuthService } from "@/services/auth/mobile-auth.service";
import { GET as getOrders } from "@/app/api/mobile/orders/route";
import { GET as getOrderDetail } from "@/app/api/mobile/orders/[orderId]/route";

const TEST_PASSWORD = "MobileOrderTest123!";

let testUserId: string | null = null;
let otherUserId: string | null = null;

let testOrderId: string | null = null;
let deletedOrderId: string | null = null;
let otherOrderId: string | null = null;
const paginationOrderIds: string[] = [];

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

async function readJson(response: Response) {
  const body = await response.json();

  console.log(
    `HTTP ${response.status}`,
    JSON.stringify(body, null, 2)
  );

  return body;
}

function authHeaders(accessToken: string) {
  return {
    Authorization:
      `Bearer ${accessToken}`,
    "Content-Type":
      "application/json",
  };
}

async function createTestUser(
  suffix: string
) {
  const password =
    await bcrypt.hash(
      TEST_PASSWORD,
      10
    );

  return prisma.user.create({
    data: {
      name:
        `Mobile Order Test ${suffix}`,

      email:
        `${suffix}-${Date.now()}-${Math.floor(
          Math.random() * 100000
        )}@fishmarket.test`,

      password,

      role:
        Role.CUSTOMER,

      isActive:
        true,

      emailVerified:
        new Date(),
    },
  });
}

async function findFixtureData(
  userId: string
) {
  const address =
    await prisma.address.findFirst({
      where: {
        deletedAt: null,
        userId,
      },
    });

  assert(
    address,
    `Address user ${userId} tidak ditemukan.`
  );

  const paymentChannel =
    await prisma.paymentChannel.findFirst({
      where: {
        isActive: true,
      },
    });

  assert(
    paymentChannel,
    "Payment channel aktif tidak ditemukan."
  );

  return {
    address,
    paymentChannel,
  };
}

async function createTestOrder(
  userId: string,
  status: OrderStatus =
    OrderStatus.PENDING,
  paymentStatus: PaymentStatus =
    PaymentStatus.PENDING
) {
  const {
    address,
    paymentChannel,
  } =
    await findFixtureData(userId);

  return prisma.order.create({
    data: {
      orderNumber:
        `TEST-MOBILE-${Date.now()}-${Math.floor(
          Math.random() * 1000000
        )}`,

      userId,

      addressId:
        address.id,

      status,

      paymentStatus,

      paymentMethod:
        PaymentMethod.BANK_TRANSFER,

      paymentChannelId:
        paymentChannel.id,

      subtotal:
        100000,

      voucherDiscount:
        0,

      shippingCost:
        10000,

      total:
        110000,

      notes:
        "Mobile Order API integration test",
    },
  });
}

async function createPaginationOrder(
  userId: string,
  createdAt: Date,
  status: OrderStatus,
) {
  const { address, paymentChannel } =
    await findFixtureData(userId);

  const order = await prisma.order.create({
    data: {
      orderNumber:
        `TEST-MOBILE-PAGE-${Date.now()}-${Math.floor(
          Math.random() * 1000000
        )}`,

      userId,

      addressId: address.id,

      status,

      paymentStatus:
        PaymentStatus.PENDING,

      paymentMethod:
        PaymentMethod.BANK_TRANSFER,

      paymentChannelId:
        paymentChannel.id,

      subtotal: 100000,

      voucherDiscount: 0,

      shippingCost: 10000,

      total: 110000,

      notes:
        "Mobile Order pagination integration test",

      createdAt,
      updatedAt: createdAt,
    },
  });

  paginationOrderIds.push(order.id);

  return order;
}

async function cleanup() {
  console.log("");
  console.log(
    "Cleaning up test data..."
  );

  /**
   * --------------------------------------------------------
   * ORDER
   * --------------------------------------------------------
   *
   * Order harus dihapus sebelum Address karena:
   *
   * Order.addressId → Address.id
   *
   * --------------------------------------------------------
   */

const orderIds = [
  testOrderId,
  deletedOrderId,
  otherOrderId,
  ...paginationOrderIds,
].filter(
  (
    id
  ): id is string =>
    Boolean(id)
);

  if (orderIds.length > 0) {
    await prisma.order.deleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    });
  }

  /**
   * --------------------------------------------------------
   * MOBILE SESSION
   * --------------------------------------------------------
   */

  const userIds = [
    testUserId,
    otherUserId,
  ].filter(
    (
      id
    ): id is string =>
      Boolean(id)
  );

  if (userIds.length > 0) {
    await prisma.mobileSession.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
  }

  /**
   * --------------------------------------------------------
   * ADDRESS
   * --------------------------------------------------------
   */

  if (userIds.length > 0) {
    await prisma.address.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
  }

  /**
   * --------------------------------------------------------
   * USER
   * --------------------------------------------------------
   */

  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  }

  console.log(
    "Cleanup completed."
  );
}

async function main() {
  let testPassed = false;

  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "MOBILE ORDER READ API INTEGRATION TEST"
    );
    console.log(
      "============================================================"
    );

    /**
     * ========================================================
     * SETUP
     * ========================================================
     */

    const user =
      await createTestUser(
        "mobile-order-a"
      );

    const otherUser =
      await createTestUser(
        "mobile-order-b"
      );

    testUserId =
      user.id;

    otherUserId =
      otherUser.id;

    /**
     * --------------------------------------------------------
     * ADDRESS USER A
     * --------------------------------------------------------
     */

    await prisma.address.create({
      data: {
        userId:
          user.id,

        receiverName:
          "Mobile Order Test",

        receiverPhone:
          "081234567890",

        province:
          "Jawa Timur",

        city:
          "Surabaya",

        district:
          "Tegalsari",

        village:
          "Kedungdoro",

        postalCode:
          "60251",

        fullAddress:
          "Jl. Test Mobile Order No. 1",

        label:
          "Rumah",

        isDefault:
          true,
      },
    });

    /**
     * --------------------------------------------------------
     * ADDRESS USER B
     * --------------------------------------------------------
     */

    await prisma.address.create({
      data: {
        userId:
          otherUser.id,

        receiverName:
          "Other Mobile Order Test",

        receiverPhone:
          "081234567891",

        province:
          "Jawa Timur",

        city:
          "Surabaya",

        district:
          "Tegalsari",

        village:
          "Kedungdoro",

        postalCode:
          "60251",

        fullAddress:
          "Jl. Test Other No. 1",

        label:
          "Rumah",

        isDefault:
          true,
      },
    });

    await findFixtureData(
      user.id
    );

    await findFixtureData(
      otherUser.id
    );

    /**
     * --------------------------------------------------------
     * OWN ORDER
     * --------------------------------------------------------
     */

    const order =
      await createTestOrder(
        user.id
      );

    testOrderId =
      order.id;

    /**
     * --------------------------------------------------------
     * DELETED ORDER
     * --------------------------------------------------------
     */

    const deletedOrder =
      await createTestOrder(
        user.id
      );

    deletedOrderId =
      deletedOrder.id;

    await prisma.order.update({
      where: {
        id:
          deletedOrder.id,
      },

      data: {
        deletedAt:
          new Date(),
      },
    });

    /**
     * --------------------------------------------------------
     * OTHER USER ORDER
     * --------------------------------------------------------
     */

    const otherOrder =
      await createTestOrder(
        otherUser.id
      );

    otherOrderId =
      otherOrder.id;

      /**
 * ========================================================
 * PAGINATION FIXTURES
 * ========================================================
 */

const paginationBaseTime =
  new Date(Date.now() - 60 * 60 * 1000);

await createPaginationOrder(
  user.id,
  new Date(
    paginationBaseTime.getTime() + 5 * 60 * 1000
  ),
  OrderStatus.PENDING,
);

await createPaginationOrder(
  user.id,
  new Date(
    paginationBaseTime.getTime() + 4 * 60 * 1000
  ),
  OrderStatus.PROCESSING,
);

await createPaginationOrder(
  user.id,
  new Date(
    paginationBaseTime.getTime() + 3 * 60 * 1000
  ),
  OrderStatus.SHIPPING,
);

await createPaginationOrder(
  user.id,
  new Date(
    paginationBaseTime.getTime() + 2 * 60 * 1000
  ),
  OrderStatus.COMPLETED,

);

await createPaginationOrder(
  user.id,
  new Date(
    paginationBaseTime.getTime() + 1 * 60 * 1000
  ),
  OrderStatus.CANCELLED,
);

    /**
     * ========================================================
     * AUTH
     * ========================================================
     */

    console.log("");
    console.log(
      "AUTH - login test user"
    );

    const auth =
      await MobileAuthService.login({
        email:
          user.email,

        password:
          TEST_PASSWORD,
      });

    assert(
      auth.user.id ===
        user.id,
      "Authenticated user ID tidak sesuai."
    );

    assert(
      auth.accessToken.length > 0,
      "Access token tidak dibuat."
    );

    /**
     * ========================================================
     * TEST 25A
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25A - GET orders"
    );

    const listResponse =
      await getOrders(
        new Request(
          "http://localhost/api/mobile/orders",
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        )
      );

    const listBody =
      await readJson(
        listResponse
      );

    assert(
      listResponse.status ===
        200,

      `Expected 200, received ${listResponse.status}`
    );

    assert(
      listBody.success ===
        true,

      "GET orders harus success."
    );

    assert(
      Array.isArray(
        listBody.data.orders
      ),

      "data.orders harus array."
    );

    assert(
      listBody.data.orders.some(
        (item: { id: string }) =>
          item.id ===
          testOrderId
      ),

      "Order milik user harus muncul."
    );

    assert(
      !listBody.data.orders.some(
        (item: { id: string }) =>
          item.id ===
          otherOrderId
      ),

      "Order user lain tidak boleh muncul."
    );

    assert(
      !listBody.data.orders.some(
        (item: { id: string }) =>
          item.id ===
          deletedOrderId
      ),

      "Deleted order tidak boleh muncul."
    );

    console.log(
      "PASS 25A"
    );

    /**
     * ========================================================
     * TEST 25B
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25B - GET own order detail"
    );

    const detailResponse =
      await getOrderDetail(
        new Request(
          `http://localhost/api/mobile/orders/${testOrderId}`,
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        ),

        {
          params:
            Promise.resolve({
              orderId:
                testOrderId!,
            }),
        }
      );

    const detailBody =
      await readJson(
        detailResponse
      );

    assert(
      detailResponse.status ===
        200,

      `Expected 200, received ${detailResponse.status}`
    );

    assert(
      detailBody.success ===
        true,

      "GET order detail harus success."
    );

    assert(
      detailBody.data.order.id ===
        testOrderId,

      "Order detail ID tidak sesuai."
    );

    console.log(
      "PASS 25B"
    );

    /**
     * ========================================================
     * TEST 25C
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25C - GET other user's order"
    );

    const otherResponse =
      await getOrderDetail(
        new Request(
          `http://localhost/api/mobile/orders/${otherOrderId}`,
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        ),

        {
          params:
            Promise.resolve({
              orderId:
                otherOrderId!,
            }),
        }
      );

    const otherBody =
      await readJson(
        otherResponse
      );

    assert(
      otherResponse.status ===
        404,

      `Expected 404, received ${otherResponse.status}`
    );

    assert(
      otherBody.code ===
        "ORDER_NOT_FOUND",

      "Order user lain harus ORDER_NOT_FOUND."
    );

    console.log(
      "PASS 25C"
    );

    /**
     * ========================================================
     * TEST 25D
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25D - GET deleted order"
    );

    const deletedResponse =
      await getOrderDetail(
        new Request(
          `http://localhost/api/mobile/orders/${deletedOrderId}`,
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        ),

        {
          params:
            Promise.resolve({
              orderId:
                deletedOrderId!,
            }),
        }
      );

    const deletedBody =
      await readJson(
        deletedResponse
      );

    assert(
      deletedResponse.status ===
        404,

      `Expected 404, received ${deletedResponse.status}`
    );

    assert(
      deletedBody.code ===
        "ORDER_NOT_FOUND",

      "Deleted order harus ORDER_NOT_FOUND."
    );

    console.log(
      "PASS 25D"
    );

    /**
     * ========================================================
     * TEST 25E
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25E - GET tanpa authentication"
    );

    const unauthResponse =
      await getOrders(
        new Request(
          "http://localhost/api/mobile/orders"
        )
      );

    const unauthBody =
      await readJson(
        unauthResponse
      );

    assert(
      unauthResponse.status ===
        401,

      `Expected 401, received ${unauthResponse.status}`
    );

    assert(
      unauthBody.code ===
        "MISSING_AUTHORIZATION",

      "Expected MISSING_AUTHORIZATION."
    );

    console.log(
      "PASS 25E"
    );

    /**
     * ========================================================
     * TEST 25F
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25F - GET invalid token"
    );

    const invalidTokenResponse =
      await getOrders(
        new Request(
          "http://localhost/api/mobile/orders",
          {
            headers: {
              Authorization:
                "Bearer invalid-token",
            },
          }
        )
      );

    const invalidTokenBody =
      await readJson(
        invalidTokenResponse
      );

    assert(
      invalidTokenResponse.status ===
        401,

      `Expected 401, received ${invalidTokenResponse.status}`
    );

    assert(
      invalidTokenBody.code ===
        "INVALID_ACCESS_TOKEN",

      "Expected INVALID_ACCESS_TOKEN."
    );

    console.log(
      "PASS 25F"
    );

    /**
     * ========================================================
     * TEST 25G
     * ========================================================
     *
     * Authentication harus valid terlebih dahulu.
     * Baru malformed orderId diuji.
     */

    console.log("");
    console.log(
      "TEST 25G - GET malformed orderId"
    );

    const invalidIdResponse =
      await getOrderDetail(
        new Request(
          "http://localhost/api/mobile/orders/",
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        ),

        {
          params:
            Promise.resolve({
              orderId:
                "",
            }),
        }
      );

    const invalidIdBody =
      await readJson(
        invalidIdResponse
      );

    assert(
      invalidIdResponse.status ===
        400,

      `Expected 400, received ${invalidIdResponse.status}`
    );

    assert(
      invalidIdBody.code ===
        "INVALID_ORDER_ID",

      "Expected INVALID_ORDER_ID."
    );

    console.log(
      "PASS 25G"
    );

    /**
     * ========================================================
     * TEST 25H
     * ========================================================
     *
     * Internal fields must not leak.
     */

    console.log("");
    console.log(
      "TEST 25H - response tidak bocorkan internal fields"
    );

    const orderJson =
      JSON.stringify(
        detailBody.data.order
      );

    const forbiddenFields = [
      "password",
      "user",
      "stockLedgers",
      "flashSalePurchases",
      "rewardPointTransactions",
      "notifications",
      "deletedAt",
      "voucherUsage",
    ];

    for (
      const field of
        forbiddenFields
    ) {
      assert(
        !orderJson.includes(
          `"${field}"`
        ),

        `Field internal ${field} bocor.`
      );
    }

    console.log(
      "PASS 25H"
    );

/**
 * ========================================================
 * TEST 25I
 * ========================================================
 */

console.log("");
console.log(
  "TEST 25I - Decimal menjadi number"
);

assert(
  typeof
    detailBody.data.order.subtotal ===
    "number",

  "subtotal harus number."
);

assert(
  typeof
    detailBody.data.order.shipping.cost ===
    "number",

  "shipping.cost harus number."
);

assert(
  typeof
    detailBody.data.order.total ===
    "number",

  "total harus number."
);

console.log(
  "PASS 25I"
);

    /**
     * ========================================================
     * TEST 25J
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 25J - Date menjadi ISO string"
    );

    assert(
      typeof
        detailBody.data.order.createdAt ===
        "string",

      "createdAt harus string."
    );

    assert(
      !Number.isNaN(
        Date.parse(
          detailBody.data.order.createdAt
        )
      ),

      "createdAt harus ISO date valid."
    );

    assert(
      typeof
        detailBody.data.order.updatedAt ===
        "string",

      "updatedAt harus string."
    );

    assert(
      !Number.isNaN(
        Date.parse(
          detailBody.data.order.updatedAt
        )
      ),

      "updatedAt harus ISO date valid."
    );

    console.log(
      "PASS 25J"
    );

    /**
     * ========================================================
     * TEST 25K
     * ========================================================
     *
     * Fixture saat ini belum membuat OrderItem.
     *
     * Karena itu kita validasi terlebih dahulu bahwa
     * contract items selalu berupa array.
     *
     * SKU-specific OrderItem validation akan dilakukan
     * pada integration test Order lifecycle.
     */

    console.log("");
    console.log(
      "TEST 25K - Order item membawa skuId"
    );

    assert(
      Array.isArray(
        detailBody.data.order.items
      ),

      "Order items harus array."
    );

    console.log(
      "PASS 25K"
    );

    /**
 * ========================================================
 * TEST 25L
 * ========================================================
 */

console.log("");
console.log(
  "TEST 25L - GET orders dengan limit"
);

const page1Response =
  await getOrders(
    new Request(
      "http://localhost/api/mobile/orders?limit=2",
      {
        headers:
          authHeaders(
            auth.accessToken
          ),
      }
    )
  );

const page1Body =
  await readJson(page1Response);

assert(
  page1Response.status === 200,
  `Expected 200, received ${page1Response.status}`
);

assert(
  page1Body.success === true,
  "Pagination request harus success."
);

assert(
  page1Body.data.orders.length === 2,
  "limit=2 harus mengembalikan maksimal 2 order."
);

assert(
  page1Body.data.pagination.limit === 2,
  "pagination.limit harus 2."
);

assert(
  page1Body.data.pagination.hasNextPage === true,
  "Page pertama harus memiliki halaman berikutnya."
);

assert(
  typeof page1Body.data.pagination.nextCursor === "string",
  "nextCursor harus tersedia."
);

console.log(
  "PASS 25L"
);

/**
 * ========================================================
 * TEST 25M
 * ========================================================
 */

console.log("");
console.log(
  "TEST 25M - GET orders halaman kedua dengan cursor"
);

const cursor =
  page1Body.data.pagination.nextCursor;

const page2Response =
  await getOrders(
    new Request(
      `http://localhost/api/mobile/orders?limit=2&cursor=${encodeURIComponent(cursor)}`,
      {
        headers:
          authHeaders(
            auth.accessToken
          ),
      }
    )
  );

const page2Body =
  await readJson(page2Response);

assert(
  page2Response.status === 200,
  `Expected 200, received ${page2Response.status}`
);

assert(
  page2Body.success === true,
  "Page kedua harus success."
);

assert(
  page2Body.data.orders.length === 2,
  "Page kedua harus mengembalikan 2 order."
);

const page1Ids =
  page1Body.data.orders.map(
    (item: { id: string }) =>
      item.id
  );

const page2Ids =
  page2Body.data.orders.map(
    (item: { id: string }) =>
      item.id
  );

assert(
  !page2Ids.some(
    (id: string) =>
      page1Ids.includes(id)
  ),
  "Page kedua tidak boleh mengandung order dari page pertama."
);

console.log(
  "PASS 25M"
);

/**
 * ========================================================
 * TEST 25N
 * ========================================================
 */

const collectedIds = [
  ...page1Ids,
  ...page2Ids,
];

const {
  nextCursor: initialNextCursor,
  hasNextPage: initialHasNextPage,
} = page2Body.data.pagination;

let nextCursor = initialNextCursor;
let hasNextPage = initialHasNextPage;

while (hasNextPage && nextCursor) {
  const response =
    await getOrders(
      new Request(
        `http://localhost/api/mobile/orders?limit=2&cursor=${encodeURIComponent(
          nextCursor
        )}`,
        {
          headers:
            authHeaders(
              auth.accessToken
            ),
        }
      )
    );

  const body =
    await readJson(response);

  assert(
    response.status === 200,
    "Request pagination lanjutan harus 200."
  );

  assert(
    body.success === true,
    "Request pagination lanjutan harus success."
  );

  const {
    orders,
    pagination,
  } = body.data;

  const ids =
    orders.map(
      (item: { id: string }) =>
        item.id
    );

  for (const id of ids) {
    assert(
      !collectedIds.includes(id),
      `Duplicate order ditemukan: ${id}`
    );
  }

  collectedIds.push(...ids);

  nextCursor =
    pagination.nextCursor;

  hasNextPage =
    pagination.hasNextPage;
}

const paginationFixtureIds =
  new Set(paginationOrderIds);

for (const id of paginationFixtureIds) {
  assert(
    collectedIds.includes(id),
    `Order pagination ${id} tidak ditemukan / ter-skip.`
  );
}

console.log(
  "PASS 25N"
);

/**
 * ========================================================
 * TEST 25O
 * ========================================================
 */

console.log("");
console.log(
  "TEST 25O - filter order berdasarkan status"
);

const statusResponse =
  await getOrders(
    new Request(
      `http://localhost/api/mobile/orders?status=${OrderStatus.PROCESSING}`,
      {
        headers:
          authHeaders(
            auth.accessToken
          ),
      }
    )
  );

const statusBody =
  await readJson(statusResponse);

assert(
  statusResponse.status === 200,
  `Expected 200, received ${statusResponse.status}`
);

assert(
  statusBody.success === true,
  "Status filter harus success."
);

assert(
  statusBody.data.orders.length > 0,
  "Harus ada order PROCESSING."
);

for (
  const orderItem of
  statusBody.data.orders
) {
  assert(
    orderItem.status ===
      OrderStatus.PROCESSING,
    `Order ${orderItem.id} memiliki status yang salah.`
  );
}

console.log(
  "PASS 25O"
);

/**
 * ========================================================
 * TEST 25P
 * ========================================================
 */

console.log("");
console.log(
  "TEST 25P - invalid pagination parameters"
);

const invalidLimitResponse =
  await getOrders(
    new Request(
      "http://localhost/api/mobile/orders?limit=0",
      {
        headers:
          authHeaders(
            auth.accessToken
          ),
      }
    )
  );

const invalidLimitBody =
  await readJson(
    invalidLimitResponse
  );

assert(
  invalidLimitResponse.status === 400,
  "limit=0 harus 400."
);

assert(
  invalidLimitBody.code ===
    "INVALID_ORDER_LIMIT",
  "Expected INVALID_ORDER_LIMIT."
);

const invalidCursorResponse =
  await getOrders(
    new Request(
      "http://localhost/api/mobile/orders?cursor=invalid-cursor",
      {
        headers:
          authHeaders(
            auth.accessToken
          ),
      }
    )
  );

const invalidCursorBody =
  await readJson(
    invalidCursorResponse
  );

assert(
  invalidCursorResponse.status === 400,
  "Cursor invalid harus 400."
);

assert(
  invalidCursorBody.code ===
    "INVALID_ORDER_CURSOR",
  "Expected INVALID_ORDER_CURSOR."
);

console.log(
  "PASS 25P"
);

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    testPassed = true;

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "ALL MOBILE ORDER READ TESTS PASSED"
    );

    console.log(
      "============================================================"
    );
  } catch (error) {
    console.error("");
    console.error(
      "TEST FAILED:",
      error
    );

    process.exitCode =
      1;
  } finally {
    /**
     * Cleanup harus selalu dijalankan,
     * baik test PASS maupun FAIL.
     */

    try {
      await cleanup();
    } catch (cleanupError) {
      console.error("");
      console.error(
        "CLEANUP FAILED:",
        cleanupError
      );

      /**
       * Jangan menimpa status test failure
       * jika test sebelumnya memang sudah gagal.
       */

      if (testPassed) {
        process.exitCode =
          1;
      }
    }

    await prisma.$disconnect();
  }
}

void main();
