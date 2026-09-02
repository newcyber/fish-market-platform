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
    } =
      await findTestProduct();

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
     * TEST 11
     *
     * User isolation.
     */

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

          emailVerified: new Date(),
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
            id: true,
          },
        });

      assert(
        ownItem,
        "CartItem SKU A tidak ditemukan."
      );

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
    } catch (error) {
      await prisma.mobileSession.deleteMany({
        where: {
          userId:
            secondUser.id,
        },
      });

await prisma.cartItem.deleteMany({
  where: {
    cart: {
      userId: secondUser.id,
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
