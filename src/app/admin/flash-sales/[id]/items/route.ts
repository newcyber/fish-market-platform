import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * POST
 * ADD FLASH SALE ITEM
 * ============================================================
 */

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const body =
      await request.json();

    const {
      productId,
      weightOptionId,
      flashPrice,
      stockLimit,
      perUserLimit,
      sortOrder,
      isActive,
    } = body;

    /**
     * ==========================================================
     * VALIDATION
     * ==========================================================
     */

    if (
      !productId ||
      typeof productId !== "string"
    ) {
      return NextResponse.json(
        {
          message:
            "Produk wajib dipilih.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      flashPrice === undefined ||
      flashPrice === null ||
      Number(flashPrice) < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Harga Flash Sale tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      stockLimit === undefined ||
      stockLimit === null ||
      !Number.isInteger(
        Number(stockLimit)
      ) ||
      Number(stockLimit) < 1
    ) {
      return NextResponse.json(
        {
          message:
            "Stock limit minimal adalah 1.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      perUserLimit === undefined ||
      perUserLimit === null ||
      !Number.isInteger(
        Number(perUserLimit)
      ) ||
      Number(perUserLimit) < 1
    ) {
      return NextResponse.json(
        {
          message:
            "Per user limit minimal adalah 1.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * CHECK FLASH SALE
     * ==========================================================
     */

    const flashSale =
      await prisma.flashSale.findFirst({
        where: {
          id,

          deletedAt: null,
        },

        select: {
          id: true,
        },
      });

    if (!flashSale) {
      return NextResponse.json(
        {
          message:
            "Flash Sale tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * ==========================================================
     * CHECK PRODUCT
     * ==========================================================
     */

    const product =
  await prisma.product.findFirst({
    where: {
      id: productId,

      deletedAt: null,
    },

    select: {
      id: true,

      price: true,
    },
  });

    if (!product) {
      return NextResponse.json(
        {
          message:
            "Produk tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    let originalPrice =
  product.price;

    /**
     * ==========================================================
     * CHECK WEIGHT OPTION
     * ==========================================================
     */

    if (weightOptionId) {
  const weightOption =
    await prisma.productWeightOption.findFirst({
      where: {
        id: weightOptionId,

        productId,

        isActive: true,
      },

      select: {
        id: true,

        price: true,
      },
    });

  if (!weightOption) {
    return NextResponse.json(
      {
        message:
          "Weight option tidak ditemukan atau tidak sesuai dengan produk.",
      },
      {
        status: 400,
      }
    );
  }

  originalPrice =
    weightOption.price;
}

    /**
     * ==========================================================
     * DUPLICATE CHECK
     * ==========================================================
     */

    const existingItem =
      await prisma.flashSaleItem.findFirst({
        where: {
          flashSaleId: id,

          productId,

          weightOptionId:
            weightOptionId || null,
        },

        select: {
          id: true,
        },
      });

    if (existingItem) {
      return NextResponse.json(
        {
          message:
            "Produk atau varian tersebut sudah ada di Flash Sale ini.",
        },
        {
          status: 409,
        }
      );
    }

    /**
     * ==========================================================
     * CREATE ITEM
     * ==========================================================
     */

    const item =
      await prisma.flashSaleItem.create({
        data: {
  flashSaleId: id,

  productId,

  weightOptionId:
    weightOptionId || null,

  originalPrice,

  flashPrice:
    Number(flashPrice),

          stockLimit:
            Number(stockLimit),

          perUserLimit:
            Number(perUserLimit),

          soldQuantity: 0,

          sortOrder:
            Number.isInteger(
              Number(sortOrder)
            )
              ? Number(sortOrder)
              : 0,

          isActive:
            typeof isActive === "boolean"
              ? isActive
              : true,
        },

        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },

          weightOption: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message:
          "Produk berhasil ditambahkan ke Flash Sale.",

        data: item,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[FLASH_SALE_ADD_ITEM_ERROR]",
      error
    );

    return NextResponse.json(
      {
        message:
          "Terjadi kesalahan saat menambahkan produk ke Flash Sale.",
      },
      {
        status: 500,
      }
    );
  }
}