import { prisma } from "@/lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("=== USERS WITHOUT CART ===");
  console.log("============================================================");

  const usersWithoutCart =
    await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        cart: null,
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 5,
    });

  if (usersWithoutCart.length === 0) {
    console.log("NONE");
  } else {
    console.table(usersWithoutCart);
  }

  console.log();
  console.log("============================================================");
  console.log("=== DUPLICATE CANONICAL CART ITEMS ===");
  console.log("============================================================");

  const duplicateItems =
    await prisma.cartItem.groupBy({
      by: [
        "cartId",
        "productId",
        "skuId",
      ],
      where: {
        skuId: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      having: {
        skuId: {
          _count: {
            gt: 1,
          },
        },
      },
      orderBy: {
        _count: {
          skuId: "desc",
        },
      },
    });

  if (duplicateItems.length === 0) {
    console.log("NONE");
  } else {
    console.table(
      duplicateItems.map((item) => ({
        cartId: item.cartId,
        productId: item.productId,
        skuId: item.skuId,
        count: item._count._all,
      }))
    );
  }

  console.log();
  console.log("============================================================");
  console.log("=== CART ITEM SKU / PRODUCT MISMATCH ===");
  console.log("============================================================");

  const mismatches =
    await prisma.cartItem.findMany({
      where: {
        skuId: {
          not: null,
        },

        sku: {
          is: {
            productId: {
              not: undefined,
            },
          },
        },
      },
      select: {
        id: true,
        cartId: true,
        productId: true,
        skuId: true,
        sku: {
          select: {
            productId: true,
          },
        },
      },
    });

  const actualMismatches =
    mismatches.filter(
      (item) =>
        item.sku !== null &&
        item.sku.productId !==
          item.productId
    );

  if (actualMismatches.length === 0) {
    console.log("NONE");
  } else {
    console.table(
      actualMismatches.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        skuId: item.skuId,
        skuProductId:
          item.sku?.productId ?? null,
      }))
    );
  }

  console.log();
  console.log("============================================================");
  console.log("=== AUDIT SUMMARY ===");
  console.log("============================================================");

  console.log(
    `Users without cart : ${usersWithoutCart.length}`
  );

  console.log(
    `Duplicate SKU items: ${duplicateItems.length}`
  );

  console.log(
    `SKU/product mismatch: ${actualMismatches.length}`
  );
}

main()
  .catch((error) => {
    console.error(
      "[AUDIT_CART_INTEGRITY_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
