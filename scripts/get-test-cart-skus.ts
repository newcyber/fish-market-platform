import { prisma } from "@/lib/prisma";

async function main() {
  const product = await prisma.product.findUnique({
    where: {
      id: "36c28293-cf96-4d36-8f77-82d8cda047f1",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      skus: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          sku: true,
          price: true,
          stock: true,
          isActive: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product test tidak ditemukan.");
  }

  console.log();
  console.log("PRODUCT");
  console.log("-------");
  console.log("id   :", product.id);
  console.log("name :", product.name);
  console.log("slug :", product.slug);

  console.log();
  console.log("ACTIVE SKUS");
  console.log("-----------");

  for (const sku of product.skus) {
    console.log({
      id: sku.id,
      sku: sku.sku,
      price: sku.price.toString(),
      stock: sku.stock,
      isActive: sku.isActive,
    });
  }
}

main()
  .catch((error) => {
    console.error("[GET_TEST_CART_SKUS_ERROR]");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
