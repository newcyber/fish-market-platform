import { prisma } from "@/lib/prisma";

export class AddressRepository {
  /**
   * ============================================================
   * GET ALL ADDRESSES BY USER
   * ============================================================
   */
  static async findByUserId(
    userId: string
  ) {
    return prisma.address.findMany({
      where: {
        userId,
        deletedAt: null,
      },

      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  /**
   * ============================================================
   * GET DEFAULT ADDRESS
   * ============================================================
   */
  static async findDefaultByUserId(
    userId: string
  ) {
    return prisma.address.findFirst({
      where: {
        userId,
        isDefault: true,
        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * FIND ACTIVE ADDRESS BY ID
   * ============================================================
   *
   * Hanya address aktif yang boleh dikembalikan.
   *
   * Address dengan deletedAt != null dianggap sudah tidak ada.
   * ============================================================
   */
  static async findById(
    addressId: string
  ) {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        deletedAt: null,
      },

      include: {
        orders: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  /**
   * ============================================================
   * CREATE ADDRESS
   * ============================================================
   */
  static async create(data: {
    userId: string;

    receiverName: string;
    receiverPhone: string;

    province: string;
    city: string;
    district: string;
    village: string;

    postalCode: string;
    fullAddress: string;

    latitude?: number | null;
    longitude?: number | null;

    label?: string | null;
    notes?: string | null;

    isDefault?: boolean;
  }) {
    return prisma.address.create({
      data: {
        userId: data.userId,

        receiverName:
          data.receiverName,

        receiverPhone:
          data.receiverPhone,

        province:
          data.province,

        city:
          data.city,

        district:
          data.district,

        village:
          data.village,

        postalCode:
          data.postalCode,

        fullAddress:
          data.fullAddress,

        latitude:
          data.latitude ?? null,

        longitude:
          data.longitude ?? null,

        label:
          data.label ?? null,

        notes:
          data.notes ?? null,

        isDefault:
          data.isDefault ?? false,
      },
    });
  }

    /**
   * ============================================================
   * CREATE ADDRESS WITH DEFAULT HANDLING
   * ============================================================
   *
   * Seluruh proses dilakukan dalam satu transaction:
   *
   * 1. Hitung address aktif milik user.
   * 2. Address pertama otomatis menjadi default.
   * 3. Jika user meminta address baru menjadi default,
   *    default lama dinonaktifkan.
   * 4. Address baru dibuat.
   *
   * Dengan transaction, clear default dan create address
   * tidak berjalan sebagai dua operasi terpisah.
   * ============================================================
   */
  static async createWithDefaultHandling(
    userId: string,
    data: {
      receiverName: string;
      receiverPhone: string;

      province: string;
      city: string;
      district: string;
      village: string;

      postalCode: string;
      fullAddress: string;

      latitude?: number | null;
      longitude?: number | null;

      label?: string | null;
      notes?: string | null;

      isDefault: boolean;
    }
  ) {
    return prisma.$transaction(
      async (tx) => {
        /**
         * ========================================================
         * COUNT ACTIVE ADDRESSES
         * ========================================================
         */
        const activeAddressCount =
          await tx.address.count({
            where: {
              userId,
              deletedAt: null,
            },
          });

        /**
         * ========================================================
         * DETERMINE DEFAULT STATUS
         * ========================================================
         *
         * Address pertama selalu menjadi default.
         *
         * Untuk address berikutnya:
         * - isDefault = true  → menjadi default
         * - isDefault = false → tidak mengubah default lama
         */
        const shouldBeDefault =
          activeAddressCount === 0 ||
          data.isDefault;

        /**
         * ========================================================
         * CLEAR CURRENT DEFAULT
         * ========================================================
         */
        if (shouldBeDefault) {
          await tx.address.updateMany({
            where: {
              userId,
              isDefault: true,
              deletedAt: null,
            },

            data: {
              isDefault: false,
            },
          });
        }

        /**
         * ========================================================
         * CREATE ADDRESS
         * ========================================================
         */
        return tx.address.create({
          data: {
            userId,

            receiverName:
              data.receiverName,

            receiverPhone:
              data.receiverPhone,

            province:
              data.province,

            city:
              data.city,

            district:
              data.district,

            village:
              data.village,

            postalCode:
              data.postalCode,

            fullAddress:
              data.fullAddress,

            latitude:
              data.latitude ?? null,

            longitude:
              data.longitude ?? null,

            label:
              data.label ?? null,

            notes:
              data.notes ?? null,

            isDefault:
              shouldBeDefault,
          },
        });
      }
    );
  }

  /**
   * ============================================================
   * UPDATE ADDRESS
   * ============================================================
   *
   * userId digunakan sebagai ownership guard tambahan.
   *
   * Address hanya boleh di-update apabila:
   *
   * - id sesuai
   * - userId sesuai
   * - deletedAt masih null
   * ============================================================
   */
  static async update(
    userId: string,
    addressId: string,
    data: {
      receiverName: string;
      receiverPhone: string;

      province: string;
      city: string;
      district: string;
      village: string;

      postalCode: string;
      fullAddress: string;

      latitude?: number | null;
      longitude?: number | null;

      label?: string | null;
      notes?: string | null;
    }
  ) {
    return prisma.address.updateMany({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },

      data: {
        receiverName:
          data.receiverName,

        receiverPhone:
          data.receiverPhone,

        province:
          data.province,

        city:
          data.city,

        district:
          data.district,

        village:
          data.village,

        postalCode:
          data.postalCode,

        fullAddress:
          data.fullAddress,

        latitude:
          data.latitude ?? null,

        longitude:
          data.longitude ?? null,

        label:
          data.label ?? null,

        notes:
          data.notes ?? null,
      },
    });
  }

  /**
   * ============================================================
   * REMOVE DEFAULT ADDRESS
   * ============================================================
   */
  static async clearDefault(
    userId: string
  ) {
    return prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
        deletedAt: null,
      },

      data: {
        isDefault: false,
      },
    });
  }

/**
 * ============================================================
 * SET DEFAULT ADDRESS
 * ============================================================
 *
 * Hanya address milik user yang bersangkutan dan masih aktif
 * yang boleh dijadikan default.
 *
 * Seluruh perubahan dilakukan dalam transaction agar tidak
 * terjadi kondisi di mana semua address menjadi non-default
 * ketika update address target gagal.
 * ============================================================
 */
static async setDefault(
  userId: string,
  addressId: string
) {
  return prisma.$transaction(async (tx) => {
    /**
     * --------------------------------------------------------
     * CLEAR CURRENT DEFAULT
     * --------------------------------------------------------
     */
    await tx.address.updateMany({
      where: {
        userId,
        isDefault: true,
        deletedAt: null,
      },

      data: {
        isDefault: false,
      },
    });

    /**
     * --------------------------------------------------------
     * SET TARGET AS DEFAULT
     * --------------------------------------------------------
     *
     * Ownership dan active-state diverifikasi kembali
     * di level database.
     *
     * Ini penting karena addressId berasal dari client.
     * --------------------------------------------------------
     */
    const result =
      await tx.address.updateMany({
        where: {
          id: addressId,
          userId,
          deletedAt: null,
        },

        data: {
          isDefault: true,
        },
      });

    /**
     * --------------------------------------------------------
     * TARGET NOT FOUND / NOT OWNED / DELETED
     * --------------------------------------------------------
     */
    if (result.count !== 1) {
      throw new Error(
        "ADDRESS_NOT_FOUND"
      );
    }

    /**
     * --------------------------------------------------------
     * RETURN UPDATED ADDRESS
     * --------------------------------------------------------
     */
    return tx.address.findUnique({
      where: {
        id: addressId,
      },
    });
  });
}

  /**
   * ============================================================
   * DELETE ADDRESS + PROMOTE DEFAULT
   * ============================================================
   *
   * Semua operasi berada dalam satu transaction.
   *
   * Jika address yang dihapus adalah default:
   *
   * 1. soft-delete address
   * 2. cari address aktif berikutnya
   * 3. jadikan default
   *
   * Jika address bukan default:
   *
   * hanya soft-delete.
   * ============================================================
   */
  static async deleteAndPromoteDefault(
    userId: string,
    addressId: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        /**
         * --------------------------------------------------------
         * FIND ACTIVE ADDRESS
         * --------------------------------------------------------
         */
        const address =
          await tx.address.findFirst({
            where: {
              id: addressId,
              userId,
              deletedAt: null,
            },

            select: {
              id: true,
              isDefault: true,
            },
          });

        if (!address) {
          throw new Error(
            "ADDRESS_NOT_FOUND"
          );
        }

        /**
         * --------------------------------------------------------
         * SOFT DELETE
         * --------------------------------------------------------
         */
        await tx.address.update({
          where: {
            id: address.id,
          },

          data: {
            deletedAt: new Date(),
            isDefault: false,
          },
        });

        /**
         * --------------------------------------------------------
         * BUKAN DEFAULT
         * --------------------------------------------------------
         *
         * Tidak perlu promote address lain.
         */
        if (!address.isDefault) {
          return null;
        }

        /**
         * --------------------------------------------------------
         * FIND NEXT ACTIVE ADDRESS
         * --------------------------------------------------------
         *
         * Mengambil address aktif yang paling lama dibuat.
         */
        const nextAddress =
          await tx.address.findFirst({
            where: {
              userId,
              deletedAt: null,
            },

            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
            },
          });

        /**
         * --------------------------------------------------------
         * TIDAK ADA ADDRESS LAIN
         * --------------------------------------------------------
         */
        if (!nextAddress) {
          return null;
        }

        /**
         * --------------------------------------------------------
         * PROMOTE
         * --------------------------------------------------------
         */
        return tx.address.update({
          where: {
            id: nextAddress.id,
          },

          data: {
            isDefault: true,
          },
        });
      }
    );
  }

  /**
   * ============================================================
   * COUNT ACTIVE ADDRESSES BY USER
   * ============================================================
   */
  static async countActiveByUserId(
    userId: string
  ) {
    return prisma.address.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }
}

export default AddressRepository;
