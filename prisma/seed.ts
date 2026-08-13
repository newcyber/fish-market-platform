import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeder...");

  const adminPassword = await bcrypt.hash("Admin123!", 10);

  // SUPER ADMIN
  await prisma.user.upsert({
    where: {
      email: "admin@fishmarket.local",
    },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@fishmarket.local",
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // ADMIN
  await prisma.user.upsert({
    where: {
      email: "staff@fishmarket.local",
    },
    update: {},
    create: {
      name: "Admin",
      email: "staff@fishmarket.local",
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Admin users created.");

    // ============================
  // CATEGORY SEEDER
  // ============================

  const categories = [
    {
      name: "Ikan Laut",
      slug: "ikan-laut",
      description: "Berbagai jenis ikan laut segar berkualitas.",
      sortOrder: 1,
    },
    {
      name: "Ikan Air Tawar",
      slug: "ikan-air-tawar",
      description: "Berbagai jenis ikan air tawar segar.",
      sortOrder: 2,
    },
    {
      name: "Udang",
      slug: "udang",
      description: "Udang segar pilihan.",
      sortOrder: 3,
    },
    {
      name: "Kepiting",
      slug: "kepiting",
      description: "Kepiting segar berkualitas.",
      sortOrder: 4,
    },
    {
      name: "Cumi",
      slug: "cumi",
      description: "Cumi segar pilihan.",
      sortOrder: 5,
    },
    {
      name: "Kerang",
      slug: "kerang",
      description: "Kerang segar berbagai jenis.",
      sortOrder: 6,
    },
    {
      name: "Frozen Food",
      slug: "frozen-food",
      description: "Produk seafood beku berkualitas.",
      sortOrder: 7,
    },
    {
      name: "Olahan",
      slug: "olahan",
      description: "Produk olahan hasil laut.",
      sortOrder: 8,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        image: null,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }

  console.log("✅ Categories seeded.");

  // ============================
// LOAD CATEGORY IDS
// ============================

const categoryMap = {
  ikanLaut: await prisma.category.findUnique({
    where: { slug: "ikan-laut" },
  }),

  ikanAirTawar: await prisma.category.findUnique({
    where: { slug: "ikan-air-tawar" },
  }),

  udang: await prisma.category.findUnique({
    where: { slug: "udang" },
  }),

  kepiting: await prisma.category.findUnique({
    where: { slug: "kepiting" },
  }),

  cumi: await prisma.category.findUnique({
    where: { slug: "cumi" },
  }),

  kerang: await prisma.category.findUnique({
    where: { slug: "kerang" },
  }),

  frozen: await prisma.category.findUnique({
    where: { slug: "frozen-food" },
  }),

  olahan: await prisma.category.findUnique({
    where: { slug: "olahan" },
  }),
};

// ============================
// PRODUCT SEEDER
// ============================

const products = [
  {
    categoryId: categoryMap.ikanLaut!.id,
    name: "Ikan Tuna Segar",
    slug: "ikan-tuna-segar",
    sku: "IKN-001",
    unit: "Kg",
    price: 120000,
    stock: 100,
    weight: 1,
    featured: true,
  },

  {
    categoryId: categoryMap.ikanLaut!.id,
    name: "Ikan Salmon Fillet",
    slug: "ikan-salmon-fillet",
    sku: "IKN-002",
    unit: "Kg",
    price: 225000,
    stock: 40,
    weight: 1,
    featured: true,
  },

  {
    categoryId: categoryMap.ikanAirTawar!.id,
    name: "Ikan Lele",
    slug: "ikan-lele",
    sku: "IKN-003",
    unit: "Kg",
    price: 32000,
    stock: 200,
    weight: 1,
    featured: false,
  },

  {
    categoryId: categoryMap.udang!.id,
    name: "Udang Vaname",
    slug: "udang-vaname",
    sku: "UDG-001",
    unit: "Kg",
    price: 85000,
    stock: 80,
    weight: 1,
    featured: true,
  },

  {
    categoryId: categoryMap.kepiting!.id,
    name: "Kepiting Bakau",
    slug: "kepiting-bakau",
    sku: "KPT-001",
    unit: "Kg",
    price: 180000,
    stock: 25,
    weight: 1,
    featured: true,
  },

  {
    categoryId: categoryMap.cumi!.id,
    name: "Cumi Segar",
    slug: "cumi-segar",
    sku: "CMI-001",
    unit: "Kg",
    price: 78000,
    stock: 60,
    weight: 1,
    featured: false,
  },

  {
    categoryId: categoryMap.kerang!.id,
    name: "Kerang Hijau",
    slug: "kerang-hijau",
    sku: "KRG-001",
    unit: "Kg",
    price: 35000,
    stock: 70,
    weight: 1,
    featured: false,
  },

  {
    categoryId: categoryMap.frozen!.id,
    name: "Fish Nugget",
    slug: "fish-nugget",
    sku: "FRZ-001",
    unit: "Pack",
    price: 45000,
    stock: 120,
    weight: 0.5,
    featured: false,
  },

  {
    categoryId: categoryMap.olahan!.id,
    name: "Otak-Otak Ikan",
    slug: "otak-otak-ikan",
    sku: "OLH-001",
    unit: "Pack",
    price: 28000,
    stock: 150,
    weight: 0.5,
    featured: false,
  },
];

for (const product of products) {
  await prisma.product.upsert({
    where: {
      slug: product.slug,
    },

    update: {
      ...product,
      description: product.name,
      isPublished: true,
    },

    create: {
      ...product,
      description: product.name,
      isPublished: true,
    },
  });
}

console.log("✅ Products seeded.");

// ============================
// CUSTOMER SEEDER
// ============================

const customerPassword = await bcrypt.hash("Customer123!", 10);

const customers = [
  {
    name: "Budi Santoso",
    email: "budi@example.com",
    phone: "081234567801",
  },
  {
    name: "Siti Rahma",
    email: "siti@example.com",
    phone: "081234567802",
  },
  {
    name: "Andi Pratama",
    email: "andi@example.com",
    phone: "081234567803",
  },
  {
    name: "Dewi Lestari",
    email: "dewi@example.com",
    phone: "081234567804",
  },
  {
    name: "Rizky Saputra",
    email: "rizky@example.com",
    phone: "081234567805",
  },
];

for (const customer of customers) {
  await prisma.user.upsert({
    where: {
      email: customer.email,
    },

    update: {
      name: customer.name,
      phone: customer.phone,
      role: Role.CUSTOMER,
      isActive: true,
    },

    create: {
      name: customer.name,
      email: customer.email,
      password: customerPassword,
      phone: customer.phone,
      role: Role.CUSTOMER,
      isActive: true,
    },
  });
}

console.log("✅ Customers seeded.");

// ============================
// PAYMENT CHANNEL SEEDER
// ============================

const paymentChannels = [
  {
    name: "Transfer Bank BCA",
    slug: "bank-bca",
    type: "BANK_TRANSFER" as const,

    bankName: "BCA",
    accountNumber: "1234567890",
    accountHolder: "Fish Market Indonesia",

    instructions:
      "Silakan transfer sesuai total pembayaran ke rekening BCA di atas. Setelah transfer, upload bukti pembayaran.",

    description:
      "Pembayaran melalui transfer Bank BCA.",

    icon: null,

    sortOrder: 1,

    isActive: true,
  },

  {
    name: "Transfer Bank BRI",
    slug: "bank-bri",
    type: "BANK_TRANSFER" as const,

    bankName: "BRI",
    accountNumber: "1234567890",
    accountHolder: "Fish Market Indonesia",

    instructions:
      "Silakan transfer sesuai total pembayaran ke rekening BRI di atas. Setelah transfer, upload bukti pembayaran.",

    description:
      "Pembayaran melalui transfer Bank BRI.",

    icon: null,

    sortOrder: 2,

    isActive: true,
  },

  {
    name: "Transfer Bank Mandiri",
    slug: "bank-mandiri",
    type: "BANK_TRANSFER" as const,

    bankName: "Mandiri",
    accountNumber: "1234567890",
    accountHolder: "Fish Market Indonesia",

    instructions:
      "Silakan transfer sesuai total pembayaran ke rekening Mandiri di atas. Setelah transfer, upload bukti pembayaran.",

    description:
      "Pembayaran melalui transfer Bank Mandiri.",

    icon: null,

    sortOrder: 3,

    isActive: true,
  },

  {
    name: "Transfer Bank BNI",
    slug: "bank-bni",
    type: "BANK_TRANSFER" as const,

    bankName: "BNI",
    accountNumber: "1234567890",
    accountHolder: "Fish Market Indonesia",

    instructions:
      "Silakan transfer sesuai total pembayaran ke rekening BNI di atas. Setelah transfer, upload bukti pembayaran.",

    description:
      "Pembayaran melalui transfer Bank BNI.",

    icon: null,

    sortOrder: 4,

    isActive: true,
  },
];

for (const channel of paymentChannels) {
  await prisma.paymentChannel.upsert({
    where: {
      slug: channel.slug,
    },

    update: {
      name: channel.name,
      type: channel.type,

      bankName: channel.bankName,
      accountNumber: channel.accountNumber,
      accountHolder: channel.accountHolder,

      instructions: channel.instructions,
      description: channel.description,
      icon: channel.icon,

      sortOrder: channel.sortOrder,
      isActive: channel.isActive,
    },

    create: {
      name: channel.name,
      slug: channel.slug,
      type: channel.type,

      bankName: channel.bankName,
      accountNumber: channel.accountNumber,
      accountHolder: channel.accountHolder,

      instructions: channel.instructions,
      description: channel.description,
      icon: channel.icon,

      sortOrder: channel.sortOrder,
      isActive: channel.isActive,
    },
  });
}

console.log("✅ Payment channels seeded.");

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });