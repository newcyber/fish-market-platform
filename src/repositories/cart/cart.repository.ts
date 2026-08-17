import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * CART REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk seluruh akses database Cart dan CartItem.
 *
 * PENTING:
 *
 * Harga pada CartItem adalah SNAPSHOT harga final saat produk
 * dimasukkan ke keranjang.
 *
 * Contoh:
 *
 * Product.price              = 40.000
 * ProductWeightOption.price  = 45.000
 * Variant adjustment         = +5.000
 *
 * Maka CartItem.price dapat menjadi:
 *
 * 50.000
 *
 * Harga tersebut tidak boleh otomatis berubah ketika admin
 * mengubah harga produk setelah item masuk ke keranjang.
 *
 * Perhitungan harga dilakukan di CartService.
 * Repository hanya bertugas membaca dan menyimpan data.
 *
 * ============================================================
 */

export class CartRepository {
  /**
   * ============================================================
   * GET CART BY USER
   * ============================================================
   */

  static async findByUserId(
    userId: string
  ) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },

      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },

          include: {
            product: {
              include: {
                category: true,

                images: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * GET CART ITEM COUNT
   * ============================================================
   *
   * Menghitung jumlah baris item dalam cart.
   *
   * Contoh:
   *
   * Ikan A
   * Ikan B
   * Ikan C
   *
   * Hasil = 3
   *
   * ============================================================
   */

  static async countItems(
    userId: string
  ) {
    const cart =
      await prisma.cart.findUnique({
        where: {
          userId,
        },

        select: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

    return cart?._count.items ?? 0;
  }

  /**
   * ============================================================
   * CREATE CART
   * ============================================================
   */

  static async create(
    userId: string
  ) {
    return prisma.cart.create({
      data: {
        userId,
      },
    });
  }

  /**
   * ============================================================
   * FIND OR CREATE CART
   * ============================================================
   *
   * Memastikan user selalu memiliki cart.
   *
   * ============================================================
   */

  static async findOrCreate(
    userId: string
  ) {
    const existingCart =
      await this.findByUserId(
        userId
      );

    if (existingCart) {
      return existingCart;
    }

    return this.create(
      userId
    );
  }

  /**
   * ============================================================
   * FIND CART ITEM
   * ============================================================
   *
   * Satu produk dapat memiliki beberapa CartItem berbeda
   * berdasarkan kombinasi:
   *
   * productId
   * productVariant
   * productWeight
   *
   * Contoh:
   *
   * Ikan Bandeng:
   *
   * 1. Utuh / 500gr
   * 2. Dibersihkan / 500gr
   * 3. Dibersihkan / 1kg
   *
   * Ketiganya dianggap item berbeda.
   *
   * ============================================================
   */

  static async findItem(
    cartId: string,
    productId: string,
    productVariant?: string | null,
    productWeight?: string | null
  ) {
    return prisma.cartItem.findFirst({
      where: {
        cartId,

        productId,

        productVariant:
          productVariant ?? null,

        productWeight:
          productWeight ?? null,
      },

      include: {
        product: {
          include: {
            category: true,

            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * FIND CART ITEM BY ID
   * ============================================================
   *
   * PENTING:
   *
   * Method ini hanya mencari CartItem.
   *
   * Validasi bahwa CartItem benar-benar milik user harus
   * dilakukan di CartService melalui:
   *
   * cartItem.cart.userId === userId
   *
   * ============================================================
   */

  static async findItemById(
    itemId: string
  ) {
    return prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },

      include: {
        cart: true,

        product: {
          include: {
            category: true,

            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * CREATE CART ITEM
   * ============================================================
   *
   * price adalah HARGA FINAL.
   *
   * Contoh:
   *
   * Berat 1kg      = 45.000
   * Dibersihkan    = +5.000
   *
   * CartItem.price = 50.000
   *
   * Repository tidak menghitung harga.
   * Harga final harus dikirim oleh CartService.
   *
   * ============================================================
   */

  static async createItem(
    data: {
      cartId: string;

      productId: string;

      productVariant?: string | null;

      productWeight?: string | null;

      customerNote?: string | null;

      quantity: number;

      price: number;
    }
  ) {
    return prisma.cartItem.create({
      data: {
        cartId:
          data.cartId,

        productId:
          data.productId,

        productVariant:
          data.productVariant ?? null,

        productWeight:
          data.productWeight ?? null,

        customerNote:
          data.customerNote ?? null,

        quantity:
          data.quantity,

        /**
         * SNAPSHOT HARGA FINAL
         */

        price:
          data.price,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE CART ITEM
   * ============================================================
   *
   * price bersifat optional.
   *
   * Jika hanya quantity yang berubah,
   * harga tidak disentuh.
   *
   * ============================================================
   */

  static async updateItem(
    itemId: string,
    data: {
      quantity: number;

      price?: number;

      productVariant?: string | null;

      productWeight?: string | null;

      customerNote?: string | null;
    }
  ) {
    return prisma.cartItem.update({
      where: {
        id: itemId,
      },

      data: {
        quantity:
          data.quantity,

        ...(data.price !== undefined
          ? {
              price:
                data.price,
            }
          : {}),

        ...(data.productVariant !==
        undefined
          ? {
              productVariant:
                data.productVariant,
            }
          : {}),

        ...(data.productWeight !==
        undefined
          ? {
              productWeight:
                data.productWeight,
            }
          : {}),

        ...(data.customerNote !==
        undefined
          ? {
              customerNote:
                data.customerNote,
            }
          : {}),
      },
    });
  }

  /**
   * ============================================================
   * UPDATE CART ITEM QUANTITY
   * ============================================================
   *
   * PENTING:
   *
   * Method ini HANYA mengubah quantity.
   *
   * Harga snapshot CartItem.price tidak boleh berubah.
   *
   * ============================================================
   */

  static async updateItemQuantity(
    cartItemId: string,
    quantity: number
  ) {
    return prisma.cartItem.update({
      where: {
        id: cartItemId,
      },

      data: {
        quantity,
      },
    });
  }

  /**
   * ============================================================
   * DELETE CART ITEM
   * ============================================================
   */

  static async deleteItem(
    itemId: string
  ) {
    return prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });
  }

  /**
   * ============================================================
   * CLEAR CART
   * ============================================================
   */

  static async clear(
    cartId: string
  ) {
    return prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  }
}

export default CartRepository;