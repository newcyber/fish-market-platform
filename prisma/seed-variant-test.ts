import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding variant test products...");

  const category = await prisma.category.findUnique({
    where: { slug: "ikan-laut" },
  });

  if (!category) {
    throw new Error('Category "ikan-laut" tidak ditemukan.');
  }

  // ============================================================
  // TEST PRODUCT #1
  // ONE VARIANT GROUP
  // ============================================================

  const oneVariantProduct = await prisma.product.upsert({
    where: {
      slug: "test-tuna-berat",
    },
    update: {
      categoryId: category.id,
      name: "TEST Tuna Berdasarkan Berat",
      sku: "TEST-TUNA-BERAT",
      price: 20000,
      stock: 0,
      featured: false,
      description: "TEST - produk dengan satu variant group: Berat.",
      isPublished: true,
    },
    create: {
      categoryId: category.id,
      name: "TEST Tuna Berdasarkan Berat",
      slug: "test-tuna-berat",
      sku: "TEST-TUNA-BERAT",
      price: 20000,
      stock: 0,
      featured: false,
      description: "TEST - produk dengan satu variant group: Berat.",
      isPublished: true,
    },
  });

  const weightGroup = await prisma.productVariantGroup.upsert({
    where: {
      productId_name: {
        productId: oneVariantProduct.id,
        name: "Berat",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      productId: oneVariantProduct.id,
      name: "Berat",
      sortOrder: 1,
      isActive: true,
    },
  });

  const weight500 = await prisma.productVariantOption.upsert({
    where: {
      groupId_label: {
        groupId: weightGroup.id,
        label: "500 gr",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      groupId: weightGroup.id,
      label: "500 gr",
      sortOrder: 1,
      isActive: true,
    },
  });

  const weight1kg = await prisma.productVariantOption.upsert({
    where: {
      groupId_label: {
        groupId: weightGroup.id,
        label: "1 Kg",
      },
    },
    update: {
      sortOrder: 2,
      isActive: true,
    },
    create: {
      groupId: weightGroup.id,
      label: "1 Kg",
      sortOrder: 2,
      isActive: true,
    },
  });

  const sku500 = await prisma.productSku.upsert({
    where: { sku: "TEST-TUNA-500GR" },
    update: {
      productId: oneVariantProduct.id,
      price: 20000,
      stock: 15,
      isActive: true,
    },
    create: {
      productId: oneVariantProduct.id,
      sku: "TEST-TUNA-500GR",
      price: 20000,
      stock: 15,
      isActive: true,
    },
  });

  const sku1kg = await prisma.productSku.upsert({
    where: { sku: "TEST-TUNA-1KG" },
    update: {
      productId: oneVariantProduct.id,
      price: 40000,
      stock: 8,
      isActive: true,
    },
    create: {
      productId: oneVariantProduct.id,
      sku: "TEST-TUNA-1KG",
      price: 40000,
      stock: 8,
      isActive: true,
    },
  });

  await prisma.productSkuOption.upsert({
    where: {
      skuId_variantOptionId: {
        skuId: sku500.id,
        variantOptionId: weight500.id,
      },
    },
    update: {},
    create: {
      skuId: sku500.id,
      variantOptionId: weight500.id,
    },
  });

  await prisma.productSkuOption.upsert({
    where: {
      skuId_variantOptionId: {
        skuId: sku1kg.id,
        variantOptionId: weight1kg.id,
      },
    },
    update: {},
    create: {
      skuId: sku1kg.id,
      variantOptionId: weight1kg.id,
    },
  });

  // ============================================================
  // TEST PRODUCT #2
  // TWO VARIANT GROUPS
  // Kondisi + Berat
  // ============================================================

  const twoVariantProduct = await prisma.product.upsert({
    where: {
      slug: "test-tuna-kondisi-berat",
    },
    update: {
      categoryId: category.id,
      name: "TEST Tuna Kondisi & Berat",
      sku: "TEST-TUNA-KONDISI",
      price: 0,
      stock: 0,
      featured: false,
      description:
        "TEST - produk dengan dua variant group: Kondisi dan Berat.",
      isPublished: true,
    },
    create: {
      categoryId: category.id,
      name: "TEST Tuna Kondisi & Berat",
      slug: "test-tuna-kondisi-berat",
      sku: "TEST-TUNA-KONDISI",
      price: 0,
      stock: 0,
      featured: false,
      description:
        "TEST - produk dengan dua variant group: Kondisi dan Berat.",
      isPublished: true,
    },
  });

  const conditionGroup = await prisma.productVariantGroup.upsert({
    where: {
      productId_name: {
        productId: twoVariantProduct.id,
        name: "Kondisi",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      productId: twoVariantProduct.id,
      name: "Kondisi",
      sortOrder: 1,
      isActive: true,
    },
  });

  const conditionUtuh = await prisma.productVariantOption.upsert({
    where: {
      groupId_label: {
        groupId: conditionGroup.id,
        label: "Utuh",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      groupId: conditionGroup.id,
      label: "Utuh",
      sortOrder: 1,
      isActive: true,
    },
  });

  const conditionClean = await prisma.productVariantOption.upsert({
    where: {
      groupId_label: {
        groupId: conditionGroup.id,
        label: "Dibersihkan",
      },
    },
    update: {
      sortOrder: 2,
      isActive: true,
    },
    create: {
      groupId: conditionGroup.id,
      label: "Dibersihkan",
      sortOrder: 2,
      isActive: true,
    },
  });

  const conditionWeightGroup = await prisma.productVariantGroup.upsert({
    where: {
      productId_name: {
        productId: twoVariantProduct.id,
        name: "Berat",
      },
    },
    update: {
      sortOrder: 2,
      isActive: true,
    },
    create: {
      productId: twoVariantProduct.id,
      name: "Berat",
      sortOrder: 2,
      isActive: true,
    },
  });

  const conditionWeight500 = await prisma.productVariantOption.upsert({
    where: {
      groupId_label: {
        groupId: conditionWeightGroup.id,
        label: "500 gr",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      groupId: conditionWeightGroup.id,
      label: "500 gr",
      sortOrder: 1,
      isActive: true,
    },
  });

  const conditionWeight1kg = await prisma.productVariantOption.upsert({
    where: {
      groupId_label: {
        groupId: conditionWeightGroup.id,
        label: "1 Kg",
      },
    },
    update: {
      sortOrder: 2,
      isActive: true,
    },
    create: {
      groupId: conditionWeightGroup.id,
      label: "1 Kg",
      sortOrder: 2,
      isActive: true,
    },
  });

  const combinations = [
    {
      sku: "TEST-TUNA-UTUH-500GR",
      price: 20000,
      stock: 10,
      options: [conditionUtuh.id, conditionWeight500.id],
    },
    {
      sku: "TEST-TUNA-UTUH-1KG",
      price: 40000,
      stock: 6,
      options: [conditionUtuh.id, conditionWeight1kg.id],
    },
    {
      sku: "TEST-TUNA-BERSIH-500GR",
      price: 18000,
      stock: 4,
      options: [conditionClean.id, conditionWeight500.id],
    },
    {
      sku: "TEST-TUNA-BERSIH-1KG",
      price: 39000,
      stock: 7,
      options: [conditionClean.id, conditionWeight1kg.id],
    },
  ];

  for (const combination of combinations) {
    const sku = await prisma.productSku.upsert({
      where: {
        sku: combination.sku,
      },
      update: {
        productId: twoVariantProduct.id,
        price: combination.price,
        stock: combination.stock,
        isActive: true,
      },
      create: {
        productId: twoVariantProduct.id,
        sku: combination.sku,
        price: combination.price,
        stock: combination.stock,
        isActive: true,
      },
    });

    for (const variantOptionId of combination.options) {
      await prisma.productSkuOption.upsert({
        where: {
          skuId_variantOptionId: {
            skuId: sku.id,
            variantOptionId,
          },
        },
        update: {},
        create: {
          skuId: sku.id,
          variantOptionId,
        },
      });
    }
  }

  console.log("✅ Variant test products seeded.");
  console.log("");
  console.log("TEST 1:");
  console.log("  TEST-TUNA-500GR       stock=15 price=20000");
  console.log("  TEST-TUNA-1KG         stock=8  price=40000");
  console.log("");
  console.log("TEST 2:");
  console.log("  TEST-TUNA-UTUH-500GR      stock=10 price=20000");
  console.log("  TEST-TUNA-UTUH-1KG        stock=6  price=40000");
  console.log("  TEST-TUNA-BERSIH-500GR    stock=4  price=18000");
  console.log("  TEST-TUNA-BERSIH-1KG      stock=7  price=39000");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
