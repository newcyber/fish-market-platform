import { Prisma, Role, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export class UserRepository {
  /**
   * User lengkap untuk Authentication.
   * Sudah include Account dan Session.
   */
  static async findForAuth(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        deletedAt: null,
      },
      include: {
        accounts: true,
        sessions: true,
      },
    });
  }

  /**
   * Cari user aktif berdasarkan email.
   */
  static async findActiveByEmail(
    email: string
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Cari user aktif berdasarkan ID.
   */
  static async findActiveById(
    id: string
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Cari user berdasarkan ID.
   */
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Cari user berdasarkan email.
   */
  static async findByEmail(
    email: string
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  /**
   * Cari user berdasarkan nomor HP.
   */
  static async findByPhone(
    phone: string
  ): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
    });
  }

  /**
   * Apakah email sudah digunakan?
   */
  static async existsByEmail(
    email: string
  ): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        email,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  /**
   * Apakah nomor HP sudah digunakan?
   */
  static async existsByPhone(
    phone: string
  ): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        phone,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  /**
   * Membuat user baru.
   */
  static async create(
    data: Prisma.UserCreateInput
  ): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update user.
   */
  static async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Update password.
   */
  static async updatePassword(
    id: string,
    password: string
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });
  }

  /**
   * Aktif / Nonaktif akun.
   */
  static async updateActiveStatus(
    id: string,
    isActive: boolean
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive,
      },
    });
  }

  /**
   * Soft delete user.
   */
  static async softDelete(
    id: string
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore user.
   */
  static async restore(
    id: string
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Daftar user.
   */
  static async findMany() {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Daftar user berdasarkan role.
   */
  static async findByRole(role: Role) {
    return prisma.user.findMany({
      where: {
        role,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Total user aktif.
   */
  static async count(): Promise<number> {
    return prisma.user.count({
      where: {
        deletedAt: null,
      },
    });
  }
}