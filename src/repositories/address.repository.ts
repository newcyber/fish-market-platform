import { prisma } from "@/lib/prisma";

export interface CreateAddressRepositoryInput {
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
}

export interface UpdateAddressRepositoryInput {
  receiverName?: string;
  receiverPhone?: string;

  province?: string;
  city?: string;
  district?: string;
  village?: string;

  postalCode?: string;
  fullAddress?: string;

  latitude?: number | null;
  longitude?: number | null;

  label?: string | null;
  notes?: string | null;

  isDefault?: boolean;
}

export class AddressRepository {
  /**
   * ============================================================
   * FIND MANY BY USER
   * ============================================================
   */
  static async findManyByUserId(userId: string) {
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
   * FIND BY ID
   * ============================================================
   */
  static async findById(id: string) {
    return prisma.address.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * FIND BY ID + USER
   *
   * Security boundary:
   * address harus benar-benar milik user.
   * ============================================================
   */
  static async findByIdAndUserId(
    id: string,
    userId: string
  ) {
    return prisma.address.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  /**
   * ============================================================
   * FIND DEFAULT ADDRESS
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
   * COUNT ACTIVE ADDRESS
   * ============================================================
   */
  static async countByUserId(
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
   * CREATE
   * ============================================================
   */
  static async create(
    data: CreateAddressRepositoryInput
  ) {
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
   * UPDATE
   * ============================================================
   */
  static async update(
    id: string,
    data: UpdateAddressRepositoryInput
  ) {
    return prisma.address.update({
      where: {
        id,
      },

      data,
    });
  }

  /**
   * ============================================================
   * SOFT DELETE
   * ============================================================
   */
  static async softDelete(
    id: string
  ) {
    return prisma.address.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    });
  }

  /**
   * ============================================================
   * CLEAR DEFAULT
   *
   * Hanya address aktif milik user.
   * ============================================================
   */
  static async clearDefaultByUserId(
    userId: string
  ) {
    return prisma.address.updateMany({
      where: {
        userId,
        deletedAt: null,
        isDefault: true,
      },

      data: {
        isDefault: false,
      },
    });
  }

  /**
   * ============================================================
   * SET DEFAULT
   *
   * Dilakukan dalam transaction.
   * ============================================================
   */
  static async setDefault(
    id: string,
    userId: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const address =
          await tx.address.findFirst({
            where: {
              id,
              userId,
              deletedAt: null,
            },
          });

        if (!address) {
          throw new Error(
            "Alamat tidak ditemukan atau bukan milik customer."
          );
        }

        await tx.address.updateMany({
          where: {
            userId,
            deletedAt: null,
          },

          data: {
            isDefault: false,
          },
        });

        return tx.address.update({
          where: {
            id,
          },

          data: {
            isDefault: true,
          },
        });
      }
    );
  }
}

export default AddressRepository;