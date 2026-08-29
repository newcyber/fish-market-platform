import { prisma } from "@/lib/prisma";

const skuCode = "TEST-TUNA-500GR";

async function main() {
  const sku =
    await prisma.productSku.findFirst({
      where: {
        sku: skuCode,
      },
      select: {
        id: true,
        productId: true,
        sku: true,
      },
    });

  if (!sku) {
    throw new Error(
      "SKU tidak ditemukan."
    );
  }

  const items =
    await prisma.flashSaleItem.findMany({
      where: {
        productId:
          sku.productId,

        skuId:
          sku.id,

        isActive:
          true,

        flashSale: {
          status:
            "ACTIVE",

          deletedAt:
            null,
        },
      },

      select: {
        id: true,

        flashSaleId:
          true,

        flashPrice:
          true,

        stockLimit:
          true,

        soldQuantity:
          true,

        sortOrder:
          true,

        flashSale: {
          select: {
            name:
              true,

            sortOrder:
              true,

            startAt:
              true,

            endAt:
              true,
          },
        },
      },

      orderBy: [
        {
          flashSale: {
            sortOrder:
              "asc",
          },
        },

        {
          sortOrder:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],
    });

  console.log(
    "SKU:",
    sku
  );

  console.log(
    "\nACTIVE FLASH SALE ITEMS:"
  );

  console.dir(
    items,
    {
      depth: null,
    }
  );
}

main()
  .catch((error) => {
    console.error(
      error
    );

    process.exit(1);
  })
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );
