import bcrypt from "bcryptjs";
import {
  PaymentStatus,
  Role,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { MobileAuthService } from "@/services/auth/mobile-auth.service";

import {
  POST as checkout,
} from "@/app/api/mobile/checkout/route";

import {
  UserRepository,
} from "@/repositories/user.repository";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  "http://localhost:3000";

const TEST_PASSWORD =
  "MobileCheckoutTest123!";

const TEST_EMAIL =
  `mobile-checkout-test-${Date.now()}@fishmarket.test`;

const TEST_ORDER_NOTE_PREFIX =
  "Mobile Checkout API TEST 26";

const TEST_SKU_CODE =
  "TEST-TUNA-BERAT-DIBERSIHKAN-2";

let testUserId: string | null = null;
let otherUserId: string | null = null;

let testAddressId: string | null = null;
let otherAddressId: string | null = null;

let paymentChannelId: string | null = null;
let skuId: string | null = null;
let productId: string | null = null;

const createdOrderIds =
  new Set<string>();

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

async function readJson(
  response: Response
) {
  const body =
    await response.json();

  console.log(
    `HTTP ${response.status}`,
    JSON.stringify(
      body,
      null,
      2
    )
  );

  return body;
}

function authHeaders(
  accessToken: string
) {
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
        `Mobile Checkout Test ${suffix}`,
      email:
  `mobile-checkout-${suffix.toLowerCase()}-${Date.now()}@fishmarket.test`,
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

async function createTestAddress(
  userId: string,
  suffix: string
) {
  return prisma.address.create({
    data: {
      userId,

      receiverName:
        `Checkout Test ${suffix}`,

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
        `Jl. Test Mobile Checkout ${suffix}`,

      latitude:
        -7.257472,

      longitude:
        112.752090,

      label:
        "Rumah",

      isDefault:
        true,
    },
  });
}

async function findFixtureData() {
  const paymentChannel =
    await prisma.paymentChannel.findFirst({
      where: {
        isActive:
          true,
      },
      orderBy: {
        sortOrder:
          "asc",
      },
    });

  assert(
    paymentChannel,
    "Payment channel aktif tidak ditemukan."
  );

  const sku =
    await prisma.productSku.findUnique({
      where: {
        sku:
          TEST_SKU_CODE,
      },
      include: {
        product: true,
      },
    });

  assert(
    sku,
    `SKU fixture ${TEST_SKU_CODE} tidak ditemukan.`
  );

  assert(
    sku.isActive,
    `SKU fixture ${TEST_SKU_CODE} tidak aktif.`
  );

  assert(
    sku.product.isPublished,
    "Product fixture tidak published."
  );

  assert(
    sku.product.deletedAt === null,
    "Product fixture sudah dihapus."
  );

  assert(
    sku.stock >= 1,
    `Stock SKU fixture harus >= 1, received ${sku.stock}.`
  );

  paymentChannelId =
    paymentChannel.id;

  skuId =
    sku.id;

  productId =
    sku.productId;

  console.log("");
  console.log(
    "Payment channel:",
    {
      id:
        paymentChannel.id,
      name:
        paymentChannel.name,
      type:
        paymentChannel.type,
    }
  );

  console.log(
    "Checkout SKU:",
    {
      id:
        sku.id,
      sku:
        sku.sku,
      productId:
        sku.productId,
      price:
        Number(sku.price),
      stock:
        sku.stock,
    }
  );

  return {
    paymentChannel,
    sku,
  };
}

async function ensureCart(
  userId: string,
  quantity: number
) {
  assert(
    skuId,
    "skuId belum tersedia."
  );

  assert(
    productId,
    "productId belum tersedia."
  );

  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        userId,
      },
    },
  });

  const cart =
    await prisma.cart.upsert({
      where: {
        userId,
      },
      update: {},
      create: {
        userId,
      },
    });

  const sku =
    await prisma.productSku.findUnique({
      where: {
        id:
          skuId,
      },
      select: {
        price:
          true,
      },
    });

  assert(
    sku,
    "SKU untuk CartItem tidak ditemukan."
  );

  await prisma.cartItem.create({
    data: {
      cartId:
        cart.id,

      productId:
        productId,

      skuId:
        skuId,

      quantity,

      price:
        sku.price,
    },
  });
}

async function clearCart(
  userId: string
) {
  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        userId,
      },
    },
  });
}

async function getCartItem(
  userId: string
) {
  return prisma.cartItem.findFirst({
    where: {
      cart: {
        userId,
      },
    },
    include: {
      cart: true,
    },
  });
}

async function restoreOrderStock(
  orderId: string
) {
  const items =
    await prisma.orderItem.findMany({
      where: {
        orderId,
      },
      select: {
        skuId:
          true,
        quantity:
          true,
      },
    });

  for (
    const item of items
  ) {
    if (!item.skuId) {
      continue;
    }

    await prisma.productSku.update({
      where: {
        id:
          item.skuId,
      },
      data: {
        stock: {
          increment:
            item.quantity,
        },
      },
    });
  }
}

async function deleteTestOrder(
  orderId: string
) {
  await restoreOrderStock(
    orderId
  );

  await prisma.stockLedger.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.flashSalePurchase.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.voucherUsage.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.rewardPointTransaction.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.orderItem.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.paymentProof.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.notification.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.order.deleteMany({
    where: {
      id:
        orderId,
    },
  });
}

async function cleanup() {
  console.log("");
  console.log(
    "Cleaning up TEST 26 data..."
  );

  for (
    const orderId of createdOrderIds
  ) {
    try {
      await deleteTestOrder(
        orderId
      );
    } catch (error) {
      console.error(
        `Cleanup order ${orderId} gagal:`,
        error
      );
    }
  }

  createdOrderIds.clear();

  if (testUserId) {
    await clearCart(
      testUserId
    );

    await prisma.mobileSession.deleteMany({
      where: {
        userId:
          testUserId,
      },
    });

    await prisma.address.deleteMany({
      where: {
        userId:
          testUserId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id:
          testUserId,
      },
    });
  }

  if (otherUserId) {
    await prisma.mobileSession.deleteMany({
      where: {
        userId:
          otherUserId,
      },
    });

    await prisma.address.deleteMany({
      where: {
        userId:
          otherUserId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id:
          otherUserId,
      },
    });
  }

  console.log(
    "Cleanup completed."
  );
}

async function postCheckout(
  body: unknown,
  accessToken?: string
) {
  const headers =
    accessToken
      ? authHeaders(
          accessToken
        )
      : {
          "Content-Type":
            "application/json",
        };

  return checkout(
    new Request(
      `${API_BASE_URL}/api/mobile/checkout`,
      {
        method:
          "POST",

        headers,

        body:
          JSON.stringify(body),
      }
    )
  );
}

async function main() {
  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "MOBILE CHECKOUT API REGRESSION TEST - TEST 26"
    );
    console.log(
      "============================================================"
    );

    /**
     * ==========================================================
     * SETUP
     * ==========================================================
     */

    const testUser =
      await createTestUser(
        "A"
      );

    const otherUser =
      await createTestUser(
        "B"
      );

    testUserId =
      testUser.id;

    otherUserId =
      otherUser.id;

    const testAddress =
      await createTestAddress(
        testUser.id,
        "A"
      );

    const otherAddress =
      await createTestAddress(
        otherUser.id,
        "B"
      );

    testAddressId =
      testAddress.id;

    otherAddressId =
      otherAddress.id;

    const {
      paymentChannel,
      sku,
    } =
      await findFixtureData();

          /**
     * ==========================================================
     * AUTH
     * ==========================================================
     */

    console.log("");
    console.log(
      "AUTH - MobileAuthService.login()"
    );

    const auth =
      await MobileAuthService.login({
        email:
          testUser.email,

        password:
          TEST_PASSWORD,
      });

    assert(
      auth.user.id ===
        testUser.id,
      "Authenticated user ID tidak sesuai."
    );

    assert(
      auth.user.role ===
        Role.CUSTOMER,
      "Authenticated role bukan CUSTOMER."
    );

    assert(
      auth.accessToken.length >
        0,
      "Access token tidak dibuat."
    );

    console.log(
      "Login berhasil."
    );

    /**
     * ==========================================================
     * 26A
     *
     * Checkout normal.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26A - Checkout normal"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const stockBefore26A =
      (
        await prisma.productSku.findUnique({
          where: {
            id:
              sku.id,
          },
          select: {
            stock:
              true,
          },
        })
      )?.stock;

    assert(
      stockBefore26A !==
        undefined,
      "Stock sebelum 26A tidak ditemukan."
    );

    const response26A =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",

          notes:
            `${TEST_ORDER_NOTE_PREFIX} 26A`,
        },
        auth.accessToken
      );

    const body26A =
      await readJson(
        response26A
      );

    assert(
      response26A.status ===
        201,
      `26A expected 201, received ${response26A.status}`
    );

    assert(
      body26A.success ===
        true,
      "26A checkout harus success."
    );

    assert(
      body26A.data?.order?.id,
      "26A order ID tidak tersedia."
    );

    const order26AId =
      body26A.data.order.id;

    createdOrderIds.add(
      order26AId
    );

    assert(
      body26A.data.order.items?.length ===
        1,
      "26A harus menghasilkan 1 OrderItem."
    );

    assert(
      body26A.data.order.items[0].skuId ===
        sku.id,
      "26A OrderItem skuId tidak sesuai."
    );

    assert(
      typeof body26A.data.order.subtotal ===
        "number",
      "26A subtotal harus number."
    );

    assert(
      typeof body26A.data.order.shipping.cost ===
        "number",
      "26A shippingCost harus number."
    );

    assert(
      typeof body26A.data.order.total ===
        "number",
      "26A total harus number."
    );

    assert(
      typeof body26A.data.order.createdAt ===
        "string",
      "26A createdAt harus string."
    );

    const stockAfter26A =
      (
        await prisma.productSku.findUnique({
          where: {
            id:
              sku.id,
          },
          select: {
            stock:
              true,
          },
        })
      )?.stock;

    assert(
      stockAfter26A ===
        stockBefore26A - 1,
      `26A stock harus berkurang 1. Before=${stockBefore26A}, After=${stockAfter26A}`
    );

    const cartAfter26A =
      await getCartItem(
        testUser.id
      );

    assert(
      cartAfter26A ===
        null,
      "26A cart harus kosong setelah checkout."
    );

    console.log(
      "PASS 26A"
    );

    /**
     * ==========================================================
     * 26B
     *
     * Tanpa authentication.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26B - Tanpa authentication"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const response26B =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",
        }
      );

    const body26B =
      await readJson(
        response26B
      );

    assert(
      response26B.status ===
        401,
      `26B expected 401, received ${response26B.status}`
    );

    assert(
      body26B.code ===
        "MISSING_AUTHORIZATION",
      `26B expected MISSING_AUTHORIZATION, received ${body26B.code}`
    );

    await clearCart(
      testUser.id
    );

    console.log(
      "PASS 26B"
    );

    /**
     * ==========================================================
     * 26C
     *
     * Invalid access token.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26C - Invalid access token"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const response26C =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",
        },
        "invalid-access-token"
      );

    const body26C =
      await readJson(
        response26C
      );

    assert(
      response26C.status ===
        401,
      `26C expected 401, received ${response26C.status}`
    );

    assert(
      body26C.code ===
        "INVALID_ACCESS_TOKEN",
      `26C expected INVALID_ACCESS_TOKEN, received ${body26C.code}`
    );

    await clearCart(
      testUser.id
    );

    console.log(
      "PASS 26C"
    );

    /**
     * ==========================================================
     * 26D
     *
     * Address milik user lain.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26D - Address milik user lain"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const response26D =
      await postCheckout(
        {
          addressId:
            otherAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",
        },
        auth.accessToken
      );

    const body26D =
      await readJson(
        response26D
      );

    assert(
      response26D.status ===
        404,
      `26D expected 404, received ${response26D.status}`
    );

    assert(
      body26D.code ===
        "ADDRESS_NOT_FOUND",
      `26D expected ADDRESS_NOT_FOUND, received ${body26D.code}`
    );

    await clearCart(
      testUser.id
    );

    console.log(
      "PASS 26D"
    );

    /**
     * ==========================================================
     * 26E
     *
     * Payment channel invalid.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26E - Payment channel invalid"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const response26E =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            "00000000-0000-0000-0000-000000000000",

          shippingProvider:
            "INTERNAL",
        },
        auth.accessToken
      );

    const body26E =
      await readJson(
        response26E
      );

    assert(
      response26E.status ===
        400,
      `26E expected 400, received ${response26E.status}`
    );

    assert(
      body26E.code ===
        "PAYMENT_CHANNEL_UNAVAILABLE",
      `26E expected PAYMENT_CHANNEL_UNAVAILABLE, received ${body26E.code}`
    );

    await clearCart(
      testUser.id
    );

    console.log(
      "PASS 26E"
    );

    /**
     * ==========================================================
     * 26F
     *
     * Cart kosong.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26F - Cart kosong"
    );

    await clearCart(
      testUser.id
    );

    const response26F =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",
        },
        auth.accessToken
      );

    const body26F =
      await readJson(
        response26F
      );

    assert(
      response26F.status ===
        400,
      `26F expected 400, received ${response26F.status}`
    );

    assert(
      body26F.code ===
        "CART_EMPTY",
      `26F expected CART_EMPTY, received ${body26F.code}`
    );

    console.log(
      "PASS 26F"
    );

    /**
     * ==========================================================
     * 26G
     *
     * Manipulasi stock:
     * CartItem quantity dibuat lebih besar
     * dari stock melalui DB.
     *
     * Checkout harus gagal dan Order
     * tidak boleh tersisa.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26G - Insufficient stock"
    );

    const stockBefore26G =
      (
        await prisma.productSku.findUnique({
          where: {
            id:
              sku.id,
          },
          select: {
            stock:
              true,
          },
        })
      )?.stock;

    assert(
      stockBefore26G !==
        undefined,
      "26G stock tidak ditemukan."
    );

    await ensureCart(
      testUser.id,
      stockBefore26G + 1
    );

    const ordersBefore26G =
      await prisma.order.count({
        where: {
          userId:
            testUser.id,
          notes: {
            startsWith:
              TEST_ORDER_NOTE_PREFIX,
          },
        },
      });

    const response26G =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",

          notes:
            `${TEST_ORDER_NOTE_PREFIX} 26G`,
        },
        auth.accessToken
      );

    const body26G =
      await readJson(
        response26G
      );

    assert(
      response26G.status ===
        400,
      `26G expected 400, received ${response26G.status}`
    );

    assert(
      body26G.code ===
        "INSUFFICIENT_STOCK",
      `26G expected INSUFFICIENT_STOCK, received ${body26G.code}`
    );

    const ordersAfter26G =
      await prisma.order.count({
        where: {
          userId:
            testUser.id,
          notes: {
            startsWith:
              TEST_ORDER_NOTE_PREFIX,
          },
        },
      });

    assert(
      ordersAfter26G ===
        ordersBefore26G,
      "26G tidak boleh membuat Order."
    );

    const stockAfter26G =
      (
        await prisma.productSku.findUnique({
          where: {
            id:
              sku.id,
          },
          select: {
            stock:
              true,
          },
        })
      )?.stock;

assert(
  stockAfter26G ===
    stockBefore26G,
  `26G stock berubah padahal checkout gagal. Before=${stockBefore26G}, After=${stockAfter26G}`
);

await clearCart(
  testUser.id
);

await prisma.productSku.update({
  where: {
    id: sku.id,
  },
  data: {
    stock:
      stockBefore26G + 1,
  },
});

console.log(
  "PASS 26G"
);

    /**
     * ==========================================================
     * 26H
     *
     * Client mencoba memanipulasi:
     * - userId
     * - items
     * - price
     * - subtotal
     * - shippingCost
     * - total
     *
     * Route harus tetap menggunakan
     * data server-side.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26H - Client financial payload manipulation"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const response26H =
      await postCheckout(
        {
          userId:
            otherUser.id,

          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "INTERNAL",

          items: [
            {
              productId:
                "attacker-product",
              skuId:
                "attacker-sku",
              quantity:
                999999,
              price:
                1,
            },
          ],

          price:
            1,

          subtotal:
            1,

          shippingCost:
            0,

          total:
            1,

          notes:
            `${TEST_ORDER_NOTE_PREFIX} 26H`,
        },
        auth.accessToken
      );

    const body26H =
      await readJson(
        response26H
      );

    assert(
      response26H.status ===
        201,
      `26H expected 201, received ${response26H.status}`
    );

    assert(
      body26H.success ===
        true,
      "26H checkout harus tetap success."
    );

    const order26H =
      body26H.data.order;

    assert(
      order26H.id,
      "26H order ID tidak tersedia."
    );

    createdOrderIds.add(
      order26H.id
    );

    assert(
      order26H.items.length ===
        1,
      "26H jumlah OrderItem harus berasal dari Cart."
    );

    assert(
      order26H.items[0].skuId ===
        sku.id,
      "26H SKU attacker tidak boleh masuk ke Order."
    );

    assert(
      order26H.items[0].productId ===
        sku.productId,
      "26H productId harus berasal dari Cart."
    );

    assert(
      order26H.items[0].quantity ===
        1,
      "26H quantity harus berasal dari Cart."
    );

    assert(
      order26H.items[0].price ===
        Number(sku.price),
      "26H price harus dihitung dari server."
    );

    assert(
      order26H.subtotal ===
        Number(sku.price),
      "26H subtotal harus dihitung dari server."
    );

    assert(
      order26H.total !==
        1,
      "26H total tidak boleh mengikuti nilai client."
    );

    assert(
      order26H.userId ===
        undefined,
      "userId tidak boleh diekspos oleh serializer."
    );

    console.log(
      "PASS 26H"
    );

    /**
     * ==========================================================
     * 26I
     *
     * Invalid shipping provider.
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26I - Invalid shipping provider"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const response26I =
      await postCheckout(
        {
          addressId:
            testAddress.id,

          paymentChannelId:
            paymentChannel.id,

          shippingProvider:
            "DHL",

          notes:
            `${TEST_ORDER_NOTE_PREFIX} 26I`,
        },
        auth.accessToken
      );

    const body26I =
      await readJson(
        response26I
      );

    assert(
      response26I.status ===
        400,
      `26I expected 400, received ${response26I.status}`
    );

    assert(
      body26I.code ===
        "INVALID_REQUEST_BODY",
      `26I expected INVALID_REQUEST_BODY, received ${body26I.code}`
    );

    await clearCart(
      testUser.id
    );

    console.log(
      "PASS 26I"
    );

    /**
     * ==========================================================
     * 26J
     *
     * Lowercase shipping provider.
     *
     * Parser harus menormalisasi
     * internal -> INTERNAL.
     * ==========================================================
     */

console.log("");
console.log(
  "TEST 26J - Shipping provider normalization"
);

await prisma.productSku.update({
  where: {
    id: sku.id,
  },
  data: {
    stock: stockBefore26A,
  },
});

await ensureCart(
  testUser.id,
  1
);

const response26J =
  await postCheckout(
    {
      addressId:
        testAddress.id,

      paymentChannelId:
        paymentChannel.id,

      shippingProvider:
        " internal ",

      notes:
        `${TEST_ORDER_NOTE_PREFIX} 26J`,
    },
    auth.accessToken
  );

    const body26J =
      await readJson(
        response26J
      );

    assert(
      response26J.status ===
        201,
      `26J expected 201, received ${response26J.status}`
    );

    assert(
      body26J.success ===
        true,
      "26J checkout harus success."
    );

    assert(
      body26J.data.order.shipping.provider ===
        "INTERNAL",
      `26J provider harus INTERNAL, received ${body26J.data.order.shipping.provider}`
    );

    createdOrderIds.add(
      body26J.data.order.id
    );

    console.log(
      "PASS 26J"
    );

    /**
     * ==========================================================
     * 26K
     *
     * Concurrent checkout.
     *
     * Cart hanya berisi 1 item.
     *
     * Expected:
     * - 1 sukses
     * - 1 gagal
     * - 1 Order
     * - stock berkurang 1
     * - cart kosong
     * ==========================================================
     */

    console.log("");
    console.log(
      "TEST 26K - Concurrent checkout"
    );

    await ensureCart(
      testUser.id,
      1
    );

    const stockBefore26K =
      (
        await prisma.productSku.findUnique({
          where: {
            id:
              sku.id,
          },
          select: {
            stock:
              true,
          },
        })
      )?.stock;

    assert(
      stockBefore26K !==
        undefined,
      "26K stock tidak ditemukan."
    );

    const concurrentBody = {
      addressId:
        testAddress.id,

      paymentChannelId:
        paymentChannel.id,

      shippingProvider:
        "INTERNAL",

      notes:
        `${TEST_ORDER_NOTE_PREFIX} 26K`,
    };

    const [
      response26KA,
      response26KB,
    ] =
      await Promise.all([
        postCheckout(
          concurrentBody,
          auth.accessToken
        ),

        postCheckout(
          concurrentBody,
          auth.accessToken
        ),
      ]);

    const [
      body26KA,
      body26KB,
    ] =
      await Promise.all([
        readJson(
          response26KA
        ),

        readJson(
          response26KB
        ),
      ]);

    const concurrentResults = [
      {
        response:
          response26KA,
        body:
          body26KA,
      },
      {
        response:
          response26KB,
        body:
          body26KB,
      },
    ];

    const successResults =
      concurrentResults.filter(
        (item) =>
          item.response.status ===
            201 &&
          item.body.success ===
            true
      );

    const failedResults =
      concurrentResults.filter(
        (item) =>
          item.response.status !==
            201
      );

    assert(
      successResults.length ===
        1,
      `26K harus tepat 1 checkout sukses, received ${successResults.length}.`
    );

    assert(
      failedResults.length ===
        1,
      `26K harus tepat 1 checkout gagal, received ${failedResults.length}.`
    );

    assert(
      failedResults[0].body.code ===
        "CART_EMPTY",
      `26K checkout kedua harus CART_EMPTY, received ${failedResults[0].body.code}`
    );

    const successfulOrderId =
      successResults[0].body.data.order.id;

    assert(
      successfulOrderId,
      "26K successful order ID tidak tersedia."
    );

    createdOrderIds.add(
      successfulOrderId
    );

    const concurrentOrders =
      await prisma.order.findMany({
        where: {
          userId:
            testUser.id,

          notes:
            `${TEST_ORDER_NOTE_PREFIX} 26K`,
        },

        select: {
          id:
            true,
        },
      });

    assert(
      concurrentOrders.length ===
        1,
      `26K harus menghasilkan tepat 1 Order, received ${concurrentOrders.length}`
    );

    const stockAfter26K =
      (
        await prisma.productSku.findUnique({
          where: {
            id:
              sku.id,
          },
          select: {
            stock:
              true,
          },
        })
      )?.stock;

    assert(
      stockAfter26K ===
        stockBefore26K - 1,
      `26K stock harus berkurang tepat 1. Before=${stockBefore26K}, After=${stockAfter26K}`
    );

    const cartAfter26K =
      await getCartItem(
        testUser.id
      );

    assert(
      cartAfter26K ===
        null,
      "26K cart harus kosong."
    );

    console.log(
      "PASS 26K"
    );

    /**
     * ==========================================================
     * FINAL
     * ==========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "ALL MOBILE CHECKOUT API TESTS PASSED"
    );

    console.log(
      "============================================================"
    );

    await cleanup();
  } catch (error) {
    console.error("");
    console.error(
      "TEST FAILED:",
      error
    );

    try {
      await cleanup();
    } catch (cleanupError) {
      console.error(
        "Cleanup TEST 26 gagal:",
        cleanupError
      );
    }

    process.exitCode =
      1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
