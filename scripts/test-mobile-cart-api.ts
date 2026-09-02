import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { MobileAuthService } from "@/services/auth/mobile-auth.service";

import { GET as getCart } from "@/app/api/mobile/cart/route";

import { POST as addCartItem } from "@/app/api/mobile/cart/items/route";

import {
  PATCH as updateCartItem,
  DELETE as deleteCartItem,
} from "@/app/api/mobile/cart/items/[cartItemId]/route";

const TEST_EMAIL =
  `mobile-cart-test-${Date.now()}@fishmarket.test`;

const TEST_PASSWORD =
  "MobileCartTest123!";

let testUserId: string | null = null;

let originalSkuBStock: number | null = null;

let boundarySkuBId: string | null = null;

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
  const body = await response.json();

  console.log(
    `HTTP ${response.status}`,
    JSON.stringify(body, null, 2)
  );

  return body;
}

async function createTestUser() {
  const password =
    await bcrypt.hash(
      TEST_PASSWORD,
      10
    );

  const user =
    await prisma.user.create({
      data: {
        name:
          "Mobile Cart Integration Test",

        email:
          TEST_EMAIL,

        password,

        role:
          Role.CUSTOMER,

        isActive:
          true,

        emailVerified: new Date(),
      },
    });

  testUserId =
    user.id;

  console.log(
    `Test user created: ${user.email}`
  );
}

async function findTestProduct() {
  const products =
    await prisma.product.findMany({
      where: {
        deletedAt: null,

        isPublished: true,

        skus: {
          some: {
            isActive: true,

            stock: {
              gte: 3,
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
              gte: 3,
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

      take: 20,
    });

  const product =
    products.find(
      (item) =>
        item.skus.length >= 2
    );

  assert(
    product,
    "Tidak ditemukan product dengan minimal 2 active SKU dan stock >= 3."
  );

  console.log("");
  console.log(
    `Test product: ${product.name}`
  );

  console.log(
    "SKU A:",
    product.skus[0]
  );

  console.log(
    "SKU B:",
    product.skus[1]
  );

  return {
    product,
    skuA:
      product.skus[0],
    skuB:
      product.skus[1],
  };
}

async function findNegativeSkuFixtures(
  testProductId: string
) {
  const otherProductSku =
    await prisma.productSku.findFirst({
      where: {
        productId: {
          not: testProductId,
        },
        isActive: true,
      },
      select: {
        id: true,
        productId: true,
        sku: true,
      },
    });

  assert(
    otherProductSku,
    "Tidak ditemukan active SKU dari product lain untuk test SKU mismatch."
  );

  const inactiveSku =
    await prisma.productSku.findFirst({
      where: {
        productId: testProductId,
        isActive: false,
      },
      select: {
        id: true,
        productId: true,
        sku: true,
      },
    });

  return {
    otherProductSku,
    inactiveSku,
  };
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

async function cleanup() {
  console.log("");
  console.log(
    "Cleaning up test data..."
  );

  if (!testUserId) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: {
      cart: {
        userId:
          testUserId,
      },
    },
  });

  await prisma.mobileSession.deleteMany({
    where: {
      userId:
        testUserId,
    },
  });

  await prisma.cart.deleteMany({
    where: {
      userId:
        testUserId,
    },
  });

  await prisma.user.delete({
    where: {
      id:
        testUserId,
    },
  });

  console.log(
    "Cleanup completed."
  );
}

async function main() {
  try {
    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "MOBILE CART API INTEGRATION TEST"
    );

    console.log(
      "============================================================"
    );

    /**
     * SETUP
     */

    await createTestUser();

const {
  product,
  skuA,
  skuB,
} = await findTestProduct();

originalSkuBStock = skuB.stock;
boundarySkuBId = skuB.id;

const {
  otherProductSku,
  inactiveSku,
} = await findNegativeSkuFixtures(product.id);

console.log("");
console.log(
  "SKU product lain:",
  otherProductSku
);

if (inactiveSku) {
  console.log(
    "Inactive SKU:",
    inactiveSku
  );
} else {
  console.log(
    "Inactive SKU: tidak ditemukan pada product test."
  );
}

    /**
     * TEST 0
     *
     * Login menggunakan production
     * MobileAuthService.
     */

    console.log("");
    console.log(
      "TEST 0 - MobileAuthService.login()"
    );

    const auth =
      await MobileAuthService.login({
        email:
          TEST_EMAIL,

        password:
          TEST_PASSWORD,
      });

    assert(
      auth.user.id === testUserId,
      "Authenticated user ID tidak sesuai."
    );

    assert(
      auth.user.role === Role.CUSTOMER,
      "Authenticated role bukan CUSTOMER."
    );

    assert(
      auth.accessToken.length > 0,
      "Access token tidak dibuat."
    );

    console.log(
      "Login berhasil."
    );

    /**
     * TEST 1
     *
     * GET tanpa authentication.
     */

    console.log("");
    console.log(
      "TEST 1 - GET tanpa authentication"
    );

    const unauthenticatedResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart"
        )
      );

    const unauthenticatedBody =
      await readJson(
        unauthenticatedResponse
      );

    assert(
      unauthenticatedResponse.status ===
        401,

      `Expected 401, received ${unauthenticatedResponse.status}`
    );

    assert(
      unauthenticatedBody.code ===
        "MISSING_AUTHORIZATION",

      `Expected MISSING_AUTHORIZATION, received ${unauthenticatedBody.code}`
    );

    /**
     * TEST 2
     *
     * GET empty cart.
     */

    console.log("");
    console.log(
      "TEST 2 - GET empty cart"
    );

    const getEmptyResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart",
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        )
      );

    const getEmptyBody =
      await readJson(
        getEmptyResponse
      );

assert(
  getEmptyResponse.status === 200,
  `Expected 200, received ${getEmptyResponse.status}`
);

assert(
  getEmptyBody.success === true,
  "GET empty cart harus success."
);

assert(
  getEmptyBody.data.cart === null,
  "GET empty cart harus mengembalikan cart null."
);

    /**
     * TEST 3
     *
     * POST SKU A quantity 1.
     */

    console.log("");
    console.log(
      "TEST 3 - POST SKU A x1"
    );

    const addAResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method: "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  1,
              }),
          }
        )
      );

    const addABody =
      await readJson(
        addAResponse
      );

    assert(
      addAResponse.status === 201,
      `Expected 201, received ${addAResponse.status}`
    );

    assert(
      addABody.success === true,
      "POST SKU A harus success."
    );

    assert(
      addABody.data.cart.totalItems ===
        1,

      `Expected totalItems 1, received ${addABody.data.cart.totalItems}`
    );

    /**
     * TEST 4
     *
     * POST SKU A x2.
     * Harus merge menjadi quantity 3.
     */

    console.log("");
    console.log(
      "TEST 4 - POST SKU A x2"
    );

    const addAAgainResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method: "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  2,
              }),
          }
        )
      );

    const addAAgainBody =
      await readJson(
        addAAgainResponse
      );

    assert(
      addAAgainResponse.status ===
        201,

      `Expected 201, received ${addAAgainResponse.status}`
    );

    assert(
      addAAgainBody.data.cart.totalItems ===
        3,

      `SKU A harus menjadi quantity 3, received ${addAAgainBody.data.cart.totalItems}`
    );

    /**
     * TEST 5
     *
     * POST SKU B x1.
     * Harus menjadi CartItem berbeda.
     */

    console.log("");
    console.log(
      "TEST 5 - POST SKU B x1"
    );

    const addBResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method: "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuB.id,

                quantity:
                  1,
              }),
          }
        )
      );

    const addBBody =
      await readJson(
        addBResponse
      );

    assert(
      addBResponse.status === 201,
      `Expected 201, received ${addBResponse.status}`
    );

    assert(
      addBBody.data.cart.totalItems ===
        4,

      `Expected totalItems 4, received ${addBBody.data.cart.totalItems}`
    );

    assert(
      addBBody.data.cart.items.length ===
        2,

      `Expected 2 CartItems, received ${addBBody.data.cart.items.length}`
    );

    const itemB =
      addBBody.data.cart.items.find(
        (item: {
          id: string;
          sku: {
            id: string;
          } | null;
        }) =>
          item.sku?.id === skuB.id
      );

    assert(
      itemB,
      "CartItem SKU B tidak ditemukan."
    );

    /**
     * ------------------------------------------------------------
     * TEST 5A
     *
     * POST tanpa authentication.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5A - POST tanpa authentication"
    );

    const unauthenticatedPostResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: product.id,
              skuId: skuA.id,
              quantity: 1,
            }),
          }
        )
      );

    const unauthenticatedPostBody =
      await readJson(
        unauthenticatedPostResponse
      );

    assert(
      unauthenticatedPostResponse.status === 401,
      `Expected 401, received ${unauthenticatedPostResponse.status}`
    );

    assert(
      unauthenticatedPostBody.code ===
        "MISSING_AUTHORIZATION",
      `Expected MISSING_AUTHORIZATION, received ${unauthenticatedPostBody.code}`
    );

    /**
     * ------------------------------------------------------------
     * TEST 5B
     *
     * PATCH tanpa authentication.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5B - PATCH tanpa authentication"
    );

    const unauthenticatedPatchResponse =
      await updateCartItem(
        new Request(
          `http://localhost/api/mobile/cart/items/${itemB.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quantity: 2,
            }),
          }
        ),
        {
          params: Promise.resolve({
            cartItemId: itemB.id,
          }),
        }
      );

    const unauthenticatedPatchBody =
      await readJson(
        unauthenticatedPatchResponse
      );

    assert(
      unauthenticatedPatchResponse.status === 401,
      `Expected 401, received ${unauthenticatedPatchResponse.status}`
    );

    assert(
      unauthenticatedPatchBody.code ===
        "MISSING_AUTHORIZATION",
      `Expected MISSING_AUTHORIZATION, received ${unauthenticatedPatchBody.code}`
    );

    /**
     * ------------------------------------------------------------
     * TEST 5C
     *
     * DELETE tanpa authentication.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5C - DELETE tanpa authentication"
    );

    const unauthenticatedDeleteResponse =
      await deleteCartItem(
        new Request(
          `http://localhost/api/mobile/cart/items/${itemB.id}`,
          {
            method: "DELETE",
          }
        ),
        {
          params: Promise.resolve({
            cartItemId: itemB.id,
          }),
        }
      );

    const unauthenticatedDeleteBody =
      await readJson(
        unauthenticatedDeleteResponse
      );

    assert(
      unauthenticatedDeleteResponse.status === 401,
      `Expected 401, received ${unauthenticatedDeleteResponse.status}`
    );

    assert(
      unauthenticatedDeleteBody.code ===
        "MISSING_AUTHORIZATION",
      `Expected MISSING_AUTHORIZATION, received ${unauthenticatedDeleteBody.code}`
    );

        /**
     * ------------------------------------------------------------
     * TEST 5D
     *
     * Authorization header kosong.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5D - Authorization header kosong"
    );

    const emptyAuthorizationResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart",
          {
            method: "GET",
            headers: {
              Authorization: "",
            },
          }
        )
      );

    const emptyAuthorizationBody =
      await readJson(
        emptyAuthorizationResponse
      );

    assert(
      emptyAuthorizationResponse.status === 401,
      `Expected 401, received ${emptyAuthorizationResponse.status}`
    );

    assert(
      emptyAuthorizationBody.code ===
        "MISSING_AUTHORIZATION",
      `Expected MISSING_AUTHORIZATION, received ${emptyAuthorizationBody.code}`
    );

    /**
     * ------------------------------------------------------------
     * TEST 5E
     *
     * Authorization menggunakan scheme selain Bearer.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5E - Authorization bukan Bearer"
    );

    const nonBearerResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart",
          {
            method: "GET",
            headers: {
              Authorization: "Basic abc123",
            },
          }
        )
      );

    const nonBearerBody =
      await readJson(
        nonBearerResponse
      );

    assert(
      nonBearerResponse.status === 401,
      `Expected 401, received ${nonBearerResponse.status}`
    );

    assert(
      nonBearerBody.code ===
        "INVALID_AUTHORIZATION",
      `Expected INVALID_AUTHORIZATION, received ${nonBearerBody.code}`
    );

    /**
     * ------------------------------------------------------------
     * TEST 5F
     *
     * Bearer tanpa token.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5F - Bearer token kosong"
    );

    const emptyBearerResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart",
          {
            method: "GET",
            headers: {
              Authorization: "Bearer",
            },
          }
        )
      );

    const emptyBearerBody =
      await readJson(
        emptyBearerResponse
      );

    assert(
      emptyBearerResponse.status === 401,
      `Expected 401, received ${emptyBearerResponse.status}`
    );

    assert(
      emptyBearerBody.code ===
        "INVALID_AUTHORIZATION",
      `Expected INVALID_AUTHORIZATION, received ${emptyBearerBody.code}`
    );

    /**
 * ------------------------------------------------------------
 * TEST 5H
 *
 * Malformed JSON.
 *
 * Body bukan JSON yang valid.
 * API harus mengembalikan 400, bukan 500.
 * ------------------------------------------------------------
 */

console.log("");
console.log("TEST 5H - Malformed JSON");

const malformedJsonResponse =
  await addCartItem(
    new Request(
      "http://localhost/api/mobile/cart/items",
      {
        method: "POST",
        headers: {
          ...authHeaders(auth.accessToken),
          "Content-Type": "application/json",
        },
        body: '{"productId":',
      }
    )
  );

const malformedJsonBody =
  await readJson(malformedJsonResponse);

assert(
  malformedJsonResponse.status === 400,
  `Expected 400, received ${malformedJsonResponse.status}`
);

assert(
  malformedJsonBody.success === false,
  "Malformed JSON harus menghasilkan success=false."
);

/**
 * ------------------------------------------------------------
 * TEST 5I
 *
 * productId bukan string.
 * ------------------------------------------------------------
 */

console.log("");
console.log("TEST 5I - productId bukan string");

const invalidProductTypeResponse =
  await addCartItem(
    new Request(
      "http://localhost/api/mobile/cart/items",
      {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({
          productId: 123,
          skuId: skuA.id,
          quantity: 1,
        }),
      }
    )
  );

const invalidProductTypeBody =
  await readJson(invalidProductTypeResponse);

assert(
  invalidProductTypeResponse.status === 400,
  `Expected 400, received ${invalidProductTypeResponse.status}`
);

assert(
  invalidProductTypeBody.success === false,
  "productId dengan tipe salah harus menghasilkan success=false."
);

/**
 * ------------------------------------------------------------
 * TEST 5J
 *
 * skuId bukan string/null.
 * ------------------------------------------------------------
 */

console.log("");
console.log("TEST 5J - skuId bukan string");

const invalidSkuTypeResponse =
  await addCartItem(
    new Request(
      "http://localhost/api/mobile/cart/items",
      {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({
          productId: product.id,
          skuId: 123,
          quantity: 1,
        }),
      }
    )
  );

const invalidSkuTypeBody =
  await readJson(invalidSkuTypeResponse);

assert(
  invalidSkuTypeResponse.status === 400,
  `Expected 400, received ${invalidSkuTypeResponse.status}`
);

assert(
  invalidSkuTypeBody.success === false,
  "skuId dengan tipe salah harus menghasilkan success=false."
);

/**
 * ------------------------------------------------------------
 * TEST 5K
 *
 * quantity bukan number.
 * ------------------------------------------------------------
 */

console.log("");
console.log("TEST 5K - quantity bukan number");

const invalidQuantityTypeResponse =
  await addCartItem(
    new Request(
      "http://localhost/api/mobile/cart/items",
      {
        method: "POST",
        headers: authHeaders(auth.accessToken),
        body: JSON.stringify({
          productId: product.id,
          skuId: skuA.id,
          quantity: "1",
        }),
      }
    )
  );

const invalidQuantityTypeBody =
  await readJson(invalidQuantityTypeResponse);

assert(
  invalidQuantityTypeResponse.status === 400,
  `Expected 400, received ${invalidQuantityTypeResponse.status}`
);

assert(
  invalidQuantityTypeBody.success === false,
  "quantity dengan tipe salah harus menghasilkan success=false."
);

    /**
     * ------------------------------------------------------------
     * TEST 5G
     *
     * Bearer token random / tidak valid.
     * ------------------------------------------------------------
     */

    console.log("");
    console.log(
      "TEST 5G - Bearer token tidak valid"
    );

    const invalidTokenResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart",
          {
            method: "GET",
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
      invalidTokenResponse.status === 401,
      `Expected 401, received ${invalidTokenResponse.status}`
    );

    assert(
      invalidTokenBody.code ===
        "INVALID_ACCESS_TOKEN",
      `Expected INVALID_ACCESS_TOKEN, received ${invalidTokenBody.code}`
    );


    // TEST 5L - product tidak ditemukan
console.log("");
console.log("TEST 5L - productId tidak ditemukan");

const nonexistentProductResponse = await addCartItem(
  new Request("http://localhost/api/mobile/cart/items", {
    method: "POST",
    headers: authHeaders(auth.accessToken),
    body: JSON.stringify({
      productId: "00000000-0000-0000-0000-000000000001",
      skuId: skuA.id,
      quantity: 1,
    }),
  })
);

const nonexistentProductBody =
  await readJson(nonexistentProductResponse);

console.log(
  `HTTP ${nonexistentProductResponse.status}`,
  JSON.stringify(nonexistentProductBody, null, 2)
);

assert(
  nonexistentProductResponse.status === 400,
  "Product yang tidak ditemukan harus menghasilkan HTTP 400."
);

assert(
  nonexistentProductBody.success === false,
  "Response product tidak ditemukan harus success=false."
);

assert(
  nonexistentProductBody.code === "PRODUCT_NOT_AVAILABLE",
  `Expected PRODUCT_NOT_AVAILABLE, got ${nonexistentProductBody.code}.`
);

// TEST 5M - SKU tidak ditemukan
console.log("");
console.log("TEST 5M - skuId tidak ditemukan");

const nonexistentSkuResponse = await addCartItem(
  new Request("http://localhost/api/mobile/cart/items", {
    method: "POST",
    headers: authHeaders(auth.accessToken),
    body: JSON.stringify({
      productId: product.id,
      skuId: "00000000-0000-0000-0000-000000000002",
      quantity: 1,
    }),
  })
);

const nonexistentSkuBody =
  await readJson(nonexistentSkuResponse);

console.log(
  `HTTP ${nonexistentSkuResponse.status}`,
  JSON.stringify(nonexistentSkuBody, null, 2)
);

assert(
  nonexistentSkuResponse.status === 400,
  "SKU yang tidak ditemukan harus menghasilkan HTTP 400."
);

assert(
  nonexistentSkuBody.success === false,
  "Response SKU tidak ditemukan harus success=false."
);

assert(
  nonexistentSkuBody.code === "SKU_NOT_AVAILABLE",
  `Expected SKU_NOT_AVAILABLE, got ${nonexistentSkuBody.code}.`
);

// TEST 5N - SKU milik product lain
console.log("");
console.log(
  "TEST 5N - skuId milik product lain"
);

const mismatchedSkuResponse =
  await addCartItem(
    new Request(
      "http://localhost/api/mobile/cart/items",
      {
        method: "POST",
        headers:
          authHeaders(
            auth.accessToken
          ),
        body: JSON.stringify({
          productId:
            product.id,
          skuId:
            otherProductSku.id,
          quantity: 1,
        }),
      }
    )
  );

const mismatchedSkuBody =
  await readJson(
    mismatchedSkuResponse
  );

console.log(
  `HTTP ${mismatchedSkuResponse.status}`,
  JSON.stringify(
    mismatchedSkuBody,
    null,
    2
  )
);

assert(
  mismatchedSkuResponse.status === 400,
  "SKU milik product lain harus menghasilkan HTTP 400."
);

assert(
  mismatchedSkuBody.success === false,
  "Response SKU mismatch harus success=false."
);

assert(
  mismatchedSkuBody.code ===
    "SKU_NOT_AVAILABLE",
  `Expected SKU_NOT_AVAILABLE, got ${mismatchedSkuBody.code}.`
);

// TEST 5O - inactive SKU
console.log("");
console.log(
  "TEST 5O - inactive SKU"
);

if (!inactiveSku) {
  console.log(
    "SKIP - Tidak ditemukan inactive SKU yang aman untuk fixture test."
  );
} else {
  const inactiveSkuResponse =
    await addCartItem(
      new Request(
        "http://localhost/api/mobile/cart/items",
        {
          method: "POST",
          headers:
            authHeaders(
              auth.accessToken
            ),
          body: JSON.stringify({
            productId:
              product.id,
            skuId:
              inactiveSku.id,
            quantity: 1,
          }),
        }
      )
    );

  const inactiveSkuBody =
    await readJson(
      inactiveSkuResponse
    );

  console.log(
    `HTTP ${inactiveSkuResponse.status}`,
    JSON.stringify(
      inactiveSkuBody,
      null,
      2
    )
  );

  assert(
    inactiveSkuResponse.status === 400,
    "Inactive SKU harus menghasilkan HTTP 400."
  );

  assert(
    inactiveSkuBody.success === false,
    "Response inactive SKU harus success=false."
  );

  assert(
    inactiveSkuBody.code ===
      "SKU_NOT_AVAILABLE",
    `Expected SKU_NOT_AVAILABLE, got ${inactiveSkuBody.code}.`
  );
}

    /**
     * TEST 6
     *
     * GET setelah POST.
     */

    console.log("");
    console.log(
      "TEST 6 - GET setelah POST"
    );

    const getResponse =
      await getCart(
        new Request(
          "http://localhost/api/mobile/cart",
          {
            headers:
              authHeaders(
                auth.accessToken
              ),
          }
        )
      );

    const getBody =
      await readJson(
        getResponse
      );

    assert(
      getResponse.status === 200,
      `Expected 200, received ${getResponse.status}`
    );

    assert(
      getBody.data.cart.totalItems ===
        4,

      "GET totalItems tidak sesuai."
    );

    assert(
      getBody.data.cart.items.length ===
        2,

      "GET harus mengembalikan 2 CartItem."
    );

    /**
     * TEST 7
     *
     * PATCH SKU B x2.
     */

    console.log("");
    console.log(
      "TEST 7 - PATCH SKU B x2"
    );

    const patchResponse =
      await updateCartItem(
        new Request(
          `http://localhost/api/mobile/cart/items/${itemB.id}`,
          {
            method:
              "PATCH",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                quantity:
                  2,
              }),
          }
        ),

        {
          params:
            Promise.resolve({
              cartItemId:
                itemB.id,
            }),
        }
      );

    const patchBody =
      await readJson(
        patchResponse
      );

    assert(
      patchResponse.status === 200,
      `Expected 200, received ${patchResponse.status}`
    );

    assert(
      patchBody.success === true,
      "PATCH harus success."
    );

    assert(
      patchBody.data.cart.totalItems ===
        5,

      `Expected totalItems 5, received ${patchBody.data.cart.totalItems}`
    );

    /**
     * TEST 8
     *
     * DELETE SKU B.
     */

    console.log("");
    console.log(
      "TEST 8 - DELETE SKU B"
    );

    const deleteResponse =
      await deleteCartItem(
        new Request(
          `http://localhost/api/mobile/cart/items/${itemB.id}`,
          {
            method:
              "DELETE",

            headers:
              {
                Authorization:
                  `Bearer ${auth.accessToken}`,
              },
          }
        ),

        {
          params:
            Promise.resolve({
              cartItemId:
                itemB.id,
            }),
        }
      );

    const deleteBody =
      await readJson(
        deleteResponse
      );

    assert(
      deleteResponse.status === 200,
      `Expected 200, received ${deleteResponse.status}`
    );

    assert(
      deleteBody.success === true,
      "DELETE harus success."
    );

    assert(
      deleteBody.data.cart.totalItems ===
        3,

      `Expected totalItems 3, received ${deleteBody.data.cart.totalItems}`
    );

    assert(
      deleteBody.data.cart.items.length ===
        1,

      "Setelah DELETE harus tersisa 1 item."
    );

assert(
  deleteBody.data.cart.items[0].sku?.id ===
    skuA.id,

  "Item yang tersisa harus SKU A."
);

    /**
     * TEST 9
     *
     * Invalid SKU.
     */

    console.log("");
    console.log(
      "TEST 9 - Foreign SKU"
    );

    const foreignSku =
      await prisma.productSku.findFirst({
        where: {
          productId: {
            not:
              product.id,
          },

          isActive:
            true,
        },

        select: {
          id: true,
        },
      });

    if (foreignSku) {
      const invalidSkuResponse =
        await addCartItem(
          new Request(
            "http://localhost/api/mobile/cart/items",
            {
              method:
                "POST",

              headers:
                authHeaders(
                  auth.accessToken
                ),

              body:
                JSON.stringify({
                  productId:
                    product.id,

                  skuId:
                    foreignSku.id,

                  quantity:
                    1,
                }),
            }
          )
        );

      const invalidSkuBody =
        await readJson(
          invalidSkuResponse
        );

      assert(
        invalidSkuResponse.status ===
          400,

        `Expected 400, received ${invalidSkuResponse.status}`
      );

      assert(
        invalidSkuBody.code ===
          "SKU_NOT_AVAILABLE",

        `Expected SKU_NOT_AVAILABLE, received ${invalidSkuBody.code}`
      );
    } else {
      console.log(
        "SKIP - foreign SKU tidak tersedia."
      );
    }

    /**
     * TEST 10
     *
     * Invalid quantity.
     */

    console.log("");
    console.log(
      "TEST 10 - Invalid quantity"
    );

    const invalidQuantityResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  0,
              }),
          }
        )
      );

    const invalidQuantityBody =
      await readJson(
        invalidQuantityResponse
      );

    assert(
      invalidQuantityResponse.status ===
        400,

      `Expected 400, received ${invalidQuantityResponse.status}`
    );

    assert(
      invalidQuantityBody.code ===
        "INVALID_QUANTITY",

      `Expected INVALID_QUANTITY, received ${invalidQuantityBody.code}`
    );

        /**
     * TEST 10A
     *
     * Active-SKU product tanpa skuId.
     *
     * Rule:
     * Product memiliki active SKU -> skuId wajib.
     */

    console.log("");
    console.log(
      "TEST 10A - Active-SKU product tanpa skuId"
    );

    const missingSkuResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                quantity:
                  1,
              }),
          }
        )
      );

    const missingSkuBody =
      await readJson(
        missingSkuResponse
      );

    assert(
      missingSkuResponse.status ===
        400,

      `Expected 400, received ${missingSkuResponse.status}`
    );

    assert(
      missingSkuBody.code ===
        "SKU_REQUIRED",

      `Expected SKU_REQUIRED, received ${missingSkuBody.code}`
    );

        /**
     * TEST 10B
     *
     * skuId berupa string kosong.
     */

    console.log("");
    console.log(
      "TEST 10B - skuId kosong"
    );

    const emptySkuResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  "",

                quantity:
                  1,
              }),
          }
        )
      );

    const emptySkuBody =
      await readJson(
        emptySkuResponse
      );

    assert(
      emptySkuResponse.status ===
        400,

      `Expected 400, received ${emptySkuResponse.status}`
    );

    assert(
      emptySkuBody.code ===
        "SKU_REQUIRED",

      `Expected SKU_REQUIRED, received ${emptySkuBody.code}`
    );

        /**
     * TEST 10C
     *
     * Negative quantity.
     */

    console.log("");
    console.log(
      "TEST 10C - Negative quantity"
    );

    const negativeQuantityResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  -1,
              }),
          }
        )
      );

    const negativeQuantityBody =
      await readJson(
        negativeQuantityResponse
      );

    assert(
      negativeQuantityResponse.status ===
        400,

      `Expected 400, received ${negativeQuantityResponse.status}`
    );

    assert(
      negativeQuantityBody.code ===
        "INVALID_QUANTITY",

      `Expected INVALID_QUANTITY, received ${negativeQuantityBody.code}`
    );


    /**
     * TEST 10D
     *
     * Fractional quantity.
     */

    console.log("");
    console.log(
      "TEST 10D - Fractional quantity"
    );

    const fractionalQuantityResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  1.5,
              }),
          }
        )
      );

    const fractionalQuantityBody =
      await readJson(
        fractionalQuantityResponse
      );

    assert(
      fractionalQuantityResponse.status ===
        400,

      `Expected 400, received ${fractionalQuantityResponse.status}`
    );

    assert(
      fractionalQuantityBody.code ===
        "INVALID_QUANTITY",

      `Expected INVALID_QUANTITY, received ${fractionalQuantityBody.code}`
    );

        /**
     * TEST 10F
     *
     * Exact stock boundary.
     *
     * Stock SKU B sementara diubah menjadi 3.
     * Quantity tepat 3 harus berhasil.
     */

    console.log("");
    console.log(
      "TEST 10F - Exact stock boundary"
    );

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId:
            testUserId!,
        },
      },
    });

    await prisma.productSku.update({
      where: {
        id:
          skuB.id,
      },

      data: {
        stock:
          3,
      },
    });

    const exactStockResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuB.id,

                quantity:
                  3,
              }),
          }
        )
      );

    const exactStockBody =
      await readJson(
        exactStockResponse
      );

    assert(
      exactStockResponse.status ===
        201,

      `Expected 201, received ${exactStockResponse.status}`
    );

    assert(
      exactStockBody.success ===
        true,

      "Exact stock add harus success."
    );


    /**
     * TEST 10G
     *
     * Quantity melebihi stock.
     *
     * Cart sudah memiliki quantity 3.
     * Penambahan 1 membuat total quantity 4,
     * sedangkan stock hanya 3.
     */

    console.log("");
    console.log(
      "TEST 10G - Exceed stock boundary"
    );

    const exceedStockResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuB.id,

                quantity:
                  1,
              }),
          }
        )
      );

    const exceedStockBody =
      await readJson(
        exceedStockResponse
      );

    assert(
      exceedStockResponse.status ===
        400,

      `Expected 400, received ${exceedStockResponse.status}`
    );

    assert(
      exceedStockBody.code ===
        "INSUFFICIENT_STOCK",

      `Expected INSUFFICIENT_STOCK, received ${exceedStockBody.code}`
    );

    /**
     * TEST 10H
     *
     * Stock = 0.
     *
     * Cart dikosongkan terlebih dahulu agar
     * error murni berasal dari stock 0.
     */

    console.log("");
    console.log(
      "TEST 10H - Zero stock boundary"
    );

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId:
            testUserId!,
        },
      },
    });

    await prisma.productSku.update({
      where: {
        id:
          skuB.id,
      },

      data: {
        stock:
          0,
      },
    });

    const zeroStockResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuB.id,

                quantity:
                  1,
              }),
          }
        )
      );

    const zeroStockBody =
      await readJson(
        zeroStockResponse
      );

    assert(
      zeroStockResponse.status ===
        400,

      `Expected 400, received ${zeroStockResponse.status}`
    );

    assert(
      zeroStockBody.code ===
        "OUT_OF_STOCK",

      `Expected OUT_OF_STOCK, received ${zeroStockBody.code}`
    );

    /**
     * TEST 10E
     *
     * Quantity terlalu besar.
     *
     * Catatan:
     * Ini berbeda dengan stock boundary.
     * Kita sengaja menggunakan angka integer yang sangat besar
     * untuk memastikan API/service tidak menerima quantity
     * yang berpotensi overflow atau tidak realistis.
     */

    console.log("");
    console.log(
      "TEST 10E - Extremely large quantity"
    );

    const hugeQuantityResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  999999999,
              }),
          }
        )
      );

    const hugeQuantityBody =
      await readJson(
        hugeQuantityResponse
      );

    assert(
      hugeQuantityResponse.status ===
        400,

      `Expected 400, received ${hugeQuantityResponse.status}`
    );

    assert(
      hugeQuantityBody.code ===
        "INSUFFICIENT_STOCK",

      `Expected INSUFFICIENT_STOCK, received ${hugeQuantityBody.code}`
    );

    /**
     * TEST 11
     *
     * User isolation.
     *
     * TEST 10F / 10H sebelumnya melakukan clearCart(),
     * sehingga TEST 11 harus membuat kembali CartItem
     * SKU A milik test user utama.
     *
     * Gunakan endpoint API yang sama seperti production flow,
     * bukan membuat CartItem secara langsung melalui Prisma.
     */

    console.log("");
    console.log(
      "Preparing TEST 11 - Re-seeding SKU A..."
    );

    const reseedSkuAResponse =
      await addCartItem(
        new Request(
          "http://localhost/api/mobile/cart/items",
          {
            method:
              "POST",

            headers:
              authHeaders(
                auth.accessToken
              ),

            body:
              JSON.stringify({
                productId:
                  product.id,

                skuId:
                  skuA.id,

                quantity:
                  1,
              }),
          }
        )
      );

    const reseedSkuABody =
      await readJson(
        reseedSkuAResponse
      );

    assert(
      reseedSkuAResponse.status ===
        201,

      `Expected 201 when re-seeding SKU A, received ${reseedSkuAResponse.status}`
    );

    assert(
      reseedSkuABody.success ===
        true,

      "Re-seed SKU A untuk TEST 11 harus success."
    );

    console.log(
      "SKU A re-seeded successfully."
    );

    console.log("");
    console.log(
      "TEST 11 - User isolation"
    );

    const secondEmail =
      `mobile-cart-test-b-${Date.now()}@fishmarket.test`;

    const secondPassword =
      "MobileCartTestB123!";

    const secondHash =
      await bcrypt.hash(
        secondPassword,
        10
      );

    const secondUser =
      await prisma.user.create({
        data: {
          name:
            "Mobile Cart Integration Test B",

          email:
            secondEmail,

          password:
            secondHash,

          role:
            Role.CUSTOMER,

          isActive:
            true,

          emailVerified:
            new Date(),
        },
      });

    try {
      const secondAuth =
        await MobileAuthService.login({
          email:
            secondEmail,

          password:
            secondPassword,
        });

      /**
       * Pastikan CartItem SKU A benar-benar milik
       * test user utama sebelum mencoba mengaksesnya
       * menggunakan user kedua.
       */

      const ownItem =
        await prisma.cartItem.findFirst({
          where: {
            cart: {
              userId:
                testUserId!,
            },

            productId:
              product.id,

            skuId:
              skuA.id,
          },

          select: {
            id:
              true,
          },
        });

      assert(
        ownItem,
        "CartItem SKU A milik test user utama tidak ditemukan."
      );

      /**
       * User kedua mencoba mengubah CartItem
       * milik user pertama.
       *
       * Harus ditolak oleh CartService/API.
       */

      const foreignPatchResponse =
        await updateCartItem(
          new Request(
            `http://localhost/api/mobile/cart/items/${ownItem.id}`,
            {
              method:
                "PATCH",

              headers:
                authHeaders(
                  secondAuth.accessToken
                ),

              body:
                JSON.stringify({
                  quantity:
                    2,
                }),
            }
          ),

          {
            params:
              Promise.resolve({
                cartItemId:
                  ownItem.id,
              }),
          }
        );

      const foreignPatchBody =
        await readJson(
          foreignPatchResponse
        );

      assert(
        foreignPatchResponse.status ===
          400,

        `Expected 400, received ${foreignPatchResponse.status}`
      );

      assert(
        foreignPatchBody.code ===
          "INVALID_CART_ITEM",

        `Expected INVALID_CART_ITEM, received ${foreignPatchBody.code}`
      );

      /**
       * Pastikan CartItem milik user utama
       * tetap tidak berubah setelah percobaan
       * akses oleh user kedua.
       */

      const ownItemAfter =
        await prisma.cartItem.findUnique({
          where: {
            id:
              ownItem.id,
          },

          select: {
            id:
              true,

            quantity:
              true,

            cart: {
              select: {
                userId:
                  true,
              },
            },
          },
        });

      assert(
        ownItemAfter,
        "CartItem user utama hilang setelah foreign update."
      );

      assert(
        ownItemAfter.cart.userId ===
          testUserId,

        "CartItem user utama berpindah ownership."
      );

      assert(
        ownItemAfter.quantity ===
          1,

        `Quantity CartItem user utama berubah secara ilegal menjadi ${ownItemAfter.quantity}.`
      );

      /**
       * Cleanup user kedua.
       */

      await prisma.mobileSession.deleteMany({
        where: {
          userId:
            secondUser.id,
        },
      });

      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId:
              secondUser.id,
          },
        },
      });

      await prisma.cart.deleteMany({
        where: {
          userId:
            secondUser.id,
        },
      });

      await prisma.user.delete({
        where: {
          id:
            secondUser.id,
        },
      });

      console.log(
        "TEST 11 PASSED - User isolation."
      );
    } catch (error) {
      /**
       * Cleanup user kedua walaupun TEST 11 gagal.
       */

      await prisma.mobileSession.deleteMany({
        where: {
          userId:
            secondUser.id,
        },
      });

      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId:
              secondUser.id,
          },
        },
      });

      await prisma.cart.deleteMany({
        where: {
          userId:
            secondUser.id,
        },
      });

      await prisma.user.delete({
        where: {
          id:
            secondUser.id,
        },
      });

      throw error;
    }

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "ALL MOBILE CART API TESTS PASSED"
    );

    console.log(
      "============================================================"
    );
} finally {
    if (
      boundarySkuBId &&
      originalSkuBStock !== null
    ) {
      await prisma.productSku.update({
        where: {
          id:
            boundarySkuBId,
        },

        data: {
          stock:
            originalSkuBStock,
        },
      });

      console.log(
        `SKU B stock restored to ${originalSkuBStock}.`
      );
    }

    await cleanup();

    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("");
  console.error(
    "============================================================"
  );

  console.error(
    "MOBILE CART API TEST FAILED"
  );

  console.error(
    "============================================================"
  );

  console.error(error);

  process.exit(1);
});
