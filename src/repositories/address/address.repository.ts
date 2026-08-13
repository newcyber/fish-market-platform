import { prisma } from "@/lib/prisma";

export class AddressRepository {
  /**
   * ============================================================
   * GET ALL ADDRESSES BY USER
   * ============================================================
   */
  static async findByUserId(userId: string) {
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
  static async findDefaultByUserId(userId: string) {
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
 * FIND ADDRESS BY ID
 * ============================================================
 */
static async findById(
  addressId: string
) {
  return prisma.address.findUnique({
    where: {
      id: addressId,
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

        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,

        province: data.province,
        city: data.city,
        district: data.district,
        village: data.village,

        postalCode: data.postalCode,
        fullAddress: data.fullAddress,

        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,

        label: data.label ?? null,
        notes: data.notes ?? null,

        isDefault: data.isDefault ?? false,
      },
    });
  }

  /**
   * ============================================================
   * UPDATE ADDRESS
   * ============================================================
   */
  static async update(
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
    return prisma.address.update({
      where: {
        id: addressId,
      },

      data: {
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,

        province: data.province,
        city: data.city,
        district: data.district,
        village: data.village,

        postalCode: data.postalCode,
        fullAddress: data.fullAddress,

        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,

        label: data.label ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  /**
   * ============================================================
   * REMOVE DEFAULT ADDRESS
   * ============================================================
   */
  static async clearDefault(userId: string) {
    return prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
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
   */
  static async setDefault(
    userId: string,
    addressId: string
  ) {
    await prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },

      data: {
        isDefault: false,
      },
    });

    return prisma.address.update({
      where: {
        id: addressId,
      },

      data: {
        isDefault: true,
      },
    });
  }

  /**
   * ============================================================
   * SOFT DELETE ADDRESS
   * ============================================================
   */
  static async delete(addressId: string) {
    return prisma.address.update({
      where: {
        id: addressId,
      },

      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    });
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

/**
 * ============================================================
 * SOFT DELETE ADDRESS
 * ============================================================
 */
static async softDelete(
  addressId: string
) {
  return prisma.address.update({
    where: {
      id: addressId,
    },

    data: {
      deletedAt: new Date(),

      /**
       * Address yang dihapus
       * tidak boleh tetap menjadi default.
       */
      isDefault: false,
    },
  });
}

}

export default AddressRepository;