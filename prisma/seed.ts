import {
  PrismaClient,
  Role,
} from "@prisma/client";

import bcrypt from "bcryptjs";

const prisma =
  new PrismaClient();

async function main() {
  console.log(
    "🌱 Starting database seeder..."
  );

  /**
   * ============================================================
   * ADMIN USER SEEDER
   * ============================================================
   */

  const adminPassword =
    await bcrypt.hash(
      "Admin123!",
      10
    );

  /**
   * SUPER ADMIN
   */

  await prisma.user.upsert({
    where: {
      email:
        "admin@fishmarket.local",
    },

    update: {},

    create: {
      name:
        "Super Admin",

      email:
        "admin@fishmarket.local",

      password:
        adminPassword,

      role:
        Role.SUPER_ADMIN,

      isActive:
        true,
    },
  });

  /**
   * ADMIN
   */

  await prisma.user.upsert({
    where: {
      email:
        "staff@fishmarket.local",
    },

    update: {},

    create: {
      name:
        "Admin",

      email:
        "staff@fishmarket.local",

      password:
        adminPassword,

      role:
        Role.ADMIN,

      isActive:
        true,
    },
  });

  console.log(
    "✅ Admin users created."
  );

  /**
   * ============================================================
   * REWARD CATEGORY SEEDER
   * ============================================================
   *
   * Master kategori hadiah yang dapat ditukar menggunakan
   * reward point.
   *
   * Kategori reward BERBEDA dengan Category produk.
   *
   * Urutan:
   *
   * 1. Cepat Diraih
   * 2. Kebutuhan Rumah
   * 3. Koleksi Emas
   * 4. Gaya Hidup
   * 5. Hadiah Impian
   *
   * Seeder menggunakan upsert berdasarkan slug.
   *
   * Artinya:
   *
   * - aman dijalankan berulang kali
   * - tidak membuat kategori duplikat
   * - ID existing tetap dipertahankan
   * - nama dapat diperbarui
   * - status dapat diperbarui
   * - urutan dapat diperbarui
   *
   * ============================================================
   */

  const rewardCategories = [
    {
      name:
        "Cepat Diraih",

      slug:
        "cepat-diraih",

      sortOrder:
        1,

      isActive:
        true,
    },

    {
      name:
        "Kebutuhan Rumah",

      slug:
        "kebutuhan-rumah",

      sortOrder:
        2,

      isActive:
        true,
    },

    {
      name:
        "Koleksi Emas",

      slug:
        "koleksi-emas",

      sortOrder:
        3,

      isActive:
        true,
    },

    {
      name:
        "Gaya Hidup",

      slug:
        "gaya-hidup",

      sortOrder:
        4,

      isActive:
        true,
    },

    {
      name:
        "Hadiah Impian",

      slug:
        "hadiah-impian",

      sortOrder:
        5,

      isActive:
        true,
    },
  ];

  for (
    const rewardCategory of rewardCategories
  ) {
    await prisma.rewardCategory.upsert({
      where: {
        slug:
          rewardCategory.slug,
      },

      update: {
        name:
          rewardCategory.name,

        sortOrder:
          rewardCategory.sortOrder,

        isActive:
          rewardCategory.isActive,
      },

      create: {
        name:
          rewardCategory.name,

        slug:
          rewardCategory.slug,

        sortOrder:
          rewardCategory.sortOrder,

        isActive:
          rewardCategory.isActive,
      },
    });
  }

  console.log(
    "✅ Reward categories seeded."
  );

  /**
   * ============================================================
   * PRODUCT CATEGORY SEEDER
   * ============================================================
   *
   * Ini adalah kategori PRODUK seafood.
   *
   * Jangan dicampur dengan RewardCategory.
   * ============================================================
   */

  const categories = [
    {
      name:
        "Ikan Laut",

      slug:
        "ikan-laut",

      description:
        "Berbagai jenis ikan laut segar berkualitas.",

      sortOrder:
        1,
    },

    {
      name:
        "Ikan Air Tawar",

      slug:
        "ikan-air-tawar",

      description:
        "Berbagai jenis ikan air tawar segar.",

      sortOrder:
        2,
    },

    {
      name:
        "Udang",

      slug:
        "udang",

      description:
        "Udang segar pilihan.",

      sortOrder:
        3,
    },

    {
      name:
        "Kepiting",

      slug:
        "kepiting",

      description:
        "Kepiting segar berkualitas.",

      sortOrder:
        4,
    },

    {
      name:
        "Cumi",

      slug:
        "cumi",

      description:
        "Cumi segar pilihan.",

      sortOrder:
        5,
    },

    {
      name:
        "Kerang",

      slug:
        "kerang",

      description:
        "Kerang segar berbagai jenis.",

      sortOrder:
        6,
    },

    {
      name:
        "Frozen Food",

      slug:
        "frozen-food",

      description:
        "Produk seafood beku berkualitas.",

      sortOrder:
        7,
    },

    {
      name:
        "Olahan",

      slug:
        "olahan",

      description:
        "Produk olahan hasil laut.",

      sortOrder:
        8,
    },
  ];

  for (
    const category of categories
  ) {
    await prisma.category.upsert({
      where: {
        slug:
          category.slug,
      },

      update: {
        name:
          category.name,

        description:
          category.description,
      },

      create: {
        name:
          category.name,

        slug:
          category.slug,

        description:
          category.description,
      },
    });
  }

  console.log(
    "✅ Categories seeded."
  );

  /**
   * ============================================================
   * LOAD CATEGORY IDS
   * ============================================================
   */

  const categoryMap = {
    ikanLaut:
      await prisma.category.findUnique({
        where: {
          slug:
            "ikan-laut",
        },
      }),

    ikanAirTawar:
      await prisma.category.findUnique({
        where: {
          slug:
            "ikan-air-tawar",
        },
      }),

    udang:
      await prisma.category.findUnique({
        where: {
          slug:
            "udang",
        },
      }),

    kepiting:
      await prisma.category.findUnique({
        where: {
          slug:
            "kepiting",
        },
      }),

    cumi:
      await prisma.category.findUnique({
        where: {
          slug:
            "cumi",
        },
      }),

    kerang:
      await prisma.category.findUnique({
        where: {
          slug:
            "kerang",
        },
      }),

    frozen:
      await prisma.category.findUnique({
        where: {
          slug:
            "frozen-food",
        },
      }),

    olahan:
      await prisma.category.findUnique({
        where: {
          slug:
            "olahan",
        },
      }),
  };

  /**
   * ============================================================
   * PRODUCT SEEDER
   * ============================================================
   *
   * Seed ini menggunakan produk sederhana tanpa variant group.
   *
   * Setiap produk dibuatkan satu ProductSku default.
   *
   * Untuk produk dengan varian:
   *
   * ProductVariantGroup
   *   -> ProductVariantOption
   *   -> ProductSku
   *   -> ProductSkuOption
   *
   * Jangan membuat VariantGroup "Berat" hanya karena data
   * lama mempunyai unit / weight.
   *
   * Berat menjadi varian hanya jika produk memang dikonfigurasi
   * memiliki varian berat.
   *
   * ============================================================
   */

  const products = [
    {
      categoryId:
        categoryMap.ikanLaut!.id,

      name:
        "Ikan Tuna Segar",

      slug:
        "ikan-tuna-segar",

      sku:
        "IKN-001",

      price:
        120000,

      stock:
        100,

      featured:
        true,
    },

    {
      categoryId:
        categoryMap.ikanLaut!.id,

      name:
        "Ikan Salmon Fillet",

      slug:
        "ikan-salmon-fillet",

      sku:
        "IKN-002",

      price:
        225000,

      stock:
        40,

      featured:
        true,
    },

    {
      categoryId:
        categoryMap.ikanAirTawar!.id,

      name:
        "Ikan Lele",

      slug:
        "ikan-lele",

      sku:
        "IKN-003",

      price:
        32000,

      stock:
        200,

      featured:
        false,
    },

    {
      categoryId:
        categoryMap.udang!.id,

      name:
        "Udang Vaname",

      slug:
        "udang-vaname",

      sku:
        "UDG-001",

      price:
        85000,

      stock:
        80,

      featured:
        true,
    },

    {
      categoryId:
        categoryMap.kepiting!.id,

      name:
        "Kepiting Bakau",

      slug:
        "kepiting-bakau",

      sku:
        "KPT-001",

      price:
        180000,

      stock:
        25,

      featured:
        true,
    },

    {
      categoryId:
        categoryMap.cumi!.id,

      name:
        "Cumi Segar",

      slug:
        "cumi-segar",

      sku:
        "CMI-001",

      price:
        78000,

      stock:
        60,

      featured:
        false,
    },

    {
      categoryId:
        categoryMap.kerang!.id,

      name:
        "Kerang Hijau",

      slug:
        "kerang-hijau",

      sku:
        "KRG-001",

      price:
        35000,

      stock:
        70,

      featured:
        false,
    },

    {
      categoryId:
        categoryMap.frozen!.id,

      name:
        "Fish Nugget",

      slug:
        "fish-nugget",

      sku:
        "FRZ-001",

      price:
        45000,

      stock:
        120,

      featured:
        false,
    },

    {
      categoryId:
        categoryMap.olahan!.id,

      name:
        "Otak-Otak Ikan",

      slug:
        "otak-otak-ikan",

      sku:
        "OLH-001",

      price:
        28000,

      stock:
        150,

      featured:
        false,
    },
  ];

  for (
    const product of products
  ) {
    const savedProduct =
      await prisma.product.upsert({
        where: {
          slug:
            product.slug,
        },

        update: {
          categoryId:
            product.categoryId,

          name:
            product.name,

          sku:
            product.sku,

          price:
            product.price,

          stock:
            product.stock,

          featured:
            product.featured,

          description:
            product.name,

          isPublished:
            true,
        },

        create: {
          categoryId:
            product.categoryId,

          name:
            product.name,

          slug:
            product.slug,

          sku:
            product.sku,

          price:
            product.price,

          stock:
            product.stock,

          featured:
            product.featured,

          description:
            product.name,

          isPublished:
            true,
        },
      });

    /**
     * ==========================================================
     * DEFAULT SKU
     * ==========================================================
     */

    await prisma.productSku.upsert({
      where: {
        sku:
          product.sku,
      },

      update: {
        productId:
          savedProduct.id,

        price:
          product.price,

        stock:
          product.stock,

        isActive:
          true,
      },

      create: {
        productId:
          savedProduct.id,

        sku:
          product.sku,

        price:
          product.price,

        stock:
          product.stock,

        isActive:
          true,
      },
    });
  }

  console.log(
    "✅ Products and default SKUs seeded."
  );

  /**
   * ============================================================
   * CUSTOMER SEEDER
   * ============================================================
   */

  const customerPassword =
    await bcrypt.hash(
      "Customer123!",
      10
    );

  const customers = [
    {
      name:
        "Budi Santoso",

      email:
        "budi@example.com",

      phone:
        "081234567801",
    },

    {
      name:
        "Siti Rahma",

      email:
        "siti@example.com",

      phone:
        "081234567802",
    },

    {
      name:
        "Andi Pratama",

      email:
        "andi@example.com",

      phone:
        "081234567803",
    },

    {
      name:
        "Dewi Lestari",

      email:
        "dewi@example.com",

      phone:
        "081234567804",
    },

    {
      name:
        "Rizky Saputra",

      email:
        "rizky@example.com",

      phone:
        "081234567805",
    },
  ];

  for (
    const customer of customers
  ) {
    await prisma.user.upsert({
      where: {
        email:
          customer.email,
      },

      update: {
        name:
          customer.name,

        phone:
          customer.phone,

        role:
          Role.CUSTOMER,

        isActive:
          true,
      },

      create: {
        name:
          customer.name,

        email:
          customer.email,

        password:
          customerPassword,

        phone:
          customer.phone,

        role:
          Role.CUSTOMER,

        isActive:
          true,
      },
    });
  }

  console.log(
    "✅ Customers seeded."
  );

  /**
   * ============================================================
   * PAYMENT CHANNEL SEEDER
   * ============================================================
   */

  const paymentChannels = [
    {
      name:
        "Transfer Bank BCA",

      slug:
        "bank-bca",

      type:
        "BANK_TRANSFER" as const,

      bankName:
        "BCA",

      accountNumber:
        "1234567890",

      accountHolder:
        "Fish Market Indonesia",

      instructions:
        "Silakan transfer sesuai total pembayaran ke rekening BCA di atas. Setelah transfer, upload bukti pembayaran.",

      description:
        "Pembayaran melalui transfer Bank BCA.",

      icon:
        null,

      sortOrder:
        1,

      isActive:
        true,
    },

    {
      name:
        "Transfer Bank BRI",

      slug:
        "bank-bri",

      type:
        "BANK_TRANSFER" as const,

      bankName:
        "BRI",

      accountNumber:
        "1234567890",

      accountHolder:
        "Fish Market Indonesia",

      instructions:
        "Silakan transfer sesuai total pembayaran ke rekening BRI di atas. Setelah transfer, upload bukti pembayaran.",

      description:
        "Pembayaran melalui transfer Bank BRI.",

      icon:
        null,

      sortOrder:
        2,

      isActive:
        true,
    },

    {
      name:
        "Transfer Bank Mandiri",

      slug:
        "bank-mandiri",

      type:
        "BANK_TRANSFER" as const,

      bankName:
        "Mandiri",

      accountNumber:
        "1234567890",

      accountHolder:
        "Fish Market Indonesia",

      instructions:
        "Silakan transfer sesuai total pembayaran ke rekening Mandiri di atas. Setelah transfer, upload bukti pembayaran.",

      description:
        "Pembayaran melalui transfer Bank Mandiri.",

      icon:
        null,

      sortOrder:
        3,

      isActive:
        true,
    },

    {
      name:
        "Transfer Bank BNI",

      slug:
        "bank-bni",

      type:
        "BANK_TRANSFER" as const,

      bankName:
        "BNI",

      accountNumber:
        "1234567890",

      accountHolder:
        "Fish Market Indonesia",

      instructions:
        "Silakan transfer sesuai total pembayaran ke rekening BNI di atas. Setelah transfer, upload bukti pembayaran.",

      description:
        "Pembayaran melalui transfer Bank BNI.",

      icon:
        null,

      sortOrder:
        4,

      isActive:
        true,
    },
  ];

  for (
    const channel of paymentChannels
  ) {
    await prisma.paymentChannel.upsert({
      where: {
        slug:
          channel.slug,
      },

      update: {
        name:
          channel.name,

        type:
          channel.type,

        bankName:
          channel.bankName,

        accountNumber:
          channel.accountNumber,

        accountHolder:
          channel.accountHolder,

        instructions:
          channel.instructions,

        description:
          channel.description,

        icon:
          channel.icon,

        sortOrder:
          channel.sortOrder,

        isActive:
          channel.isActive,
      },

      create: {
        name:
          channel.name,

        slug:
          channel.slug,

        type:
          channel.type,

        bankName:
          channel.bankName,

        accountNumber:
          channel.accountNumber,

        accountHolder:
          channel.accountHolder,

        instructions:
          channel.instructions,

        description:
          channel.description,

        icon:
          channel.icon,

        sortOrder:
          channel.sortOrder,

        isActive:
          channel.isActive,
      },
    });
  }

  console.log(
    "✅ Payment channels seeded."
  );
}

/**
 * ============================================================
 * EXECUTE SEED
 * ============================================================
 */

main()
  .then(
    async () => {
      await prisma.$disconnect();
    }
  )
  .catch(
    async (error) => {
      console.error(
        error
      );

      await prisma.$disconnect();

      process.exit(1);
    }
  );
