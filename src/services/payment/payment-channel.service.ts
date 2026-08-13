import {
  PaymentChannelType,
} from "@prisma/client";

import {
  PaymentChannelRepository,
} from "@/repositories/payment/payment-channel.repository";

/**
 * ============================================================
 *
 * PAYMENT CHANNEL SERVICE
 *
 * Business logic untuk:
 *
 * - Get payment channel
 * - Get active payment channel
 * - Create payment channel
 * - Update payment channel
 * - Activate / deactivate
 * - Delete payment channel
 * - Validate payment channel untuk checkout
 *
 * ============================================================
 */

export interface CreatePaymentChannelInput {
  name: string;
  slug: string;

  type?: PaymentChannelType;

  bankName?: string | null;

  accountNumber?: string | null;

  accountHolder?: string | null;

  instructions?: string | null;

  description?: string | null;

  icon?: string | null;

  sortOrder?: number;

  isActive?: boolean;
}

export interface UpdatePaymentChannelInput {
  name?: string;
  slug?: string;

  type?: PaymentChannelType;

  bankName?: string | null;

  accountNumber?: string | null;

  accountHolder?: string | null;

  instructions?: string | null;

  description?: string | null;

  icon?: string | null;

  sortOrder?: number;

  isActive?: boolean;
}

export class PaymentChannelService {
  /**
   * ============================================================
   * GET ALL
   *
   * Digunakan Admin.
   * ============================================================
   */

  static async getAll() {
    try {
      const channels =
        await PaymentChannelRepository.findAll();

      return {
        success: true,
        data: channels,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_GET_ALL_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil daftar metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * GET ALL ACTIVE
   *
   * Digunakan Customer Checkout.
   * ============================================================
   */

  static async getAllActive() {
    try {
      const channels =
        await PaymentChannelRepository.findAllActive();

      return {
        success: true,
        data: channels,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_GET_ALL_ACTIVE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * GET BY ID
   * ============================================================
   */

  static async getById(
    id: string
  ) {
    try {
      if (!id) {
        return {
          success: false,
          message:
            "ID metode pembayaran tidak valid.",
        };
      }

      const channel =
        await PaymentChannelRepository.findById(
          id
        );

      if (!channel) {
        return {
          success: false,
          message:
            "Metode pembayaran tidak ditemukan.",
        };
      }

      return {
        success: true,
        data: channel,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_GET_BY_ID_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * GET ACTIVE BY ID
   *
   * Digunakan Checkout.
   * ============================================================
   */

  static async getActiveById(
    id: string
  ) {
    try {
      if (!id) {
        return {
          success: false,
          message:
            "Metode pembayaran belum dipilih.",
        };
      }

      const channel =
        await PaymentChannelRepository.findActiveById(
          id
        );

      if (!channel) {
        return {
          success: false,
          message:
            "Metode pembayaran tidak tersedia atau sudah tidak aktif.",
        };
      }

      return {
        success: true,
        data: channel,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_GET_ACTIVE_BY_ID_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal memvalidasi metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * CREATE
   * ============================================================
   */

  static async create(
    input: CreatePaymentChannelInput
  ) {
    try {
      const name =
        input.name?.trim();

      const slug =
        input.slug
          ?.trim()
          .toLowerCase();

      if (!name) {
        return {
          success: false,
          message:
            "Nama metode pembayaran wajib diisi.",
        };
      }

      if (!slug) {
        return {
          success: false,
          message:
            "Slug metode pembayaran wajib diisi.",
        };
      }

      const slugCount =
        await PaymentChannelRepository.countBySlug(
          slug
        );

      if (slugCount > 0) {
        return {
          success: false,
          message:
            "Slug metode pembayaran sudah digunakan.",
        };
      }

      /**
       * BANK TRANSFER VALIDATION
       */

      const type =
        input.type ??
        PaymentChannelType.BANK_TRANSFER;

      if (
        type ===
        PaymentChannelType.BANK_TRANSFER
      ) {
        if (
          !input.bankName?.trim()
        ) {
          return {
            success: false,
            message:
              "Nama bank wajib diisi.",
          };
        }

        if (
          !input.accountNumber?.trim()
        ) {
          return {
            success: false,
            message:
              "Nomor rekening wajib diisi.",
          };
        }

        if (
          !input.accountHolder?.trim()
        ) {
          return {
            success: false,
            message:
              "Nama pemilik rekening wajib diisi.",
          };
        }
      }

      const channel =
        await PaymentChannelRepository.create({
          name,
          slug,

          type,

          bankName:
            input.bankName?.trim() ||
            null,

          accountNumber:
            input.accountNumber?.trim() ||
            null,

          accountHolder:
            input.accountHolder?.trim() ||
            null,

          instructions:
            input.instructions?.trim() ||
            null,

          description:
            input.description?.trim() ||
            null,

          icon:
            input.icon?.trim() ||
            null,

          sortOrder:
            input.sortOrder ?? 0,

          isActive:
            input.isActive ?? true,
        });

      return {
        success: true,
        message:
          "Metode pembayaran berhasil ditambahkan.",
        data: channel,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_CREATE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal menambahkan metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * UPDATE
   * ============================================================
   */

  static async update(
    id: string,
    input: UpdatePaymentChannelInput
  ) {
    try {
      if (!id) {
        return {
          success: false,
          message:
            "ID metode pembayaran tidak valid.",
        };
      }

      const existing =
        await PaymentChannelRepository.findById(
          id
        );

      if (!existing) {
        return {
          success: false,
          message:
            "Metode pembayaran tidak ditemukan.",
        };
      }

      const updateData: UpdatePaymentChannelInput =
        {};

      if (
        input.name !== undefined
      ) {
        const name =
          input.name.trim();

        if (!name) {
          return {
            success: false,
            message:
              "Nama metode pembayaran wajib diisi.",
          };
        }

        updateData.name =
          name;
      }

      if (
        input.slug !== undefined
      ) {
        const slug =
          input.slug
            .trim()
            .toLowerCase();

        if (!slug) {
          return {
            success: false,
            message:
              "Slug metode pembayaran wajib diisi.",
          };
        }

        const slugCount =
          await PaymentChannelRepository.countBySlug(
            slug,
            id
          );

        if (slugCount > 0) {
          return {
            success: false,
            message:
              "Slug metode pembayaran sudah digunakan.",
          };
        }

        updateData.slug =
          slug;
      }

      if (
        input.type !== undefined
      ) {
        updateData.type =
          input.type;
      }

      if (
        input.bankName !== undefined
      ) {
        updateData.bankName =
          input.bankName?.trim() ||
          null;
      }

      if (
        input.accountNumber !== undefined
      ) {
        updateData.accountNumber =
          input.accountNumber?.trim() ||
          null;
      }

      if (
        input.accountHolder !== undefined
      ) {
        updateData.accountHolder =
          input.accountHolder?.trim() ||
          null;
      }

      if (
        input.instructions !== undefined
      ) {
        updateData.instructions =
          input.instructions?.trim() ||
          null;
      }

      if (
        input.description !== undefined
      ) {
        updateData.description =
          input.description?.trim() ||
          null;
      }

      if (
        input.icon !== undefined
      ) {
        updateData.icon =
          input.icon?.trim() ||
          null;
      }

      if (
        input.sortOrder !== undefined
      ) {
        updateData.sortOrder =
          input.sortOrder;
      }

      if (
        input.isActive !== undefined
      ) {
        updateData.isActive =
          input.isActive;
      }

      /**
       * VALIDATE FINAL BANK DATA
       */

      const finalType =
        updateData.type ??
        existing.type;

      const finalBankName =
        updateData.bankName ??
        existing.bankName;

      const finalAccountNumber =
        updateData.accountNumber ??
        existing.accountNumber;

      const finalAccountHolder =
        updateData.accountHolder ??
        existing.accountHolder;

      if (
        finalType ===
        PaymentChannelType.BANK_TRANSFER
      ) {
        if (!finalBankName) {
          return {
            success: false,
            message:
              "Nama bank wajib diisi.",
          };
        }

        if (!finalAccountNumber) {
          return {
            success: false,
            message:
              "Nomor rekening wajib diisi.",
          };
        }

        if (!finalAccountHolder) {
          return {
            success: false,
            message:
              "Nama pemilik rekening wajib diisi.",
          };
        }
      }

      const channel =
        await PaymentChannelRepository.update(
          id,
          updateData
        );

      return {
        success: true,
        message:
          "Metode pembayaran berhasil diperbarui.",
        data: channel,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_UPDATE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal memperbarui metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * UPDATE ACTIVE STATUS
   * ============================================================
   */

  static async updateActiveStatus(
    id: string,
    isActive: boolean
  ) {
    try {
      const existing =
        await PaymentChannelRepository.findById(
          id
        );

      if (!existing) {
        return {
          success: false,
          message:
            "Metode pembayaran tidak ditemukan.",
        };
      }

      const channel =
        await PaymentChannelRepository.updateActiveStatus(
          id,
          isActive
        );

      return {
        success: true,
        message: isActive
          ? "Metode pembayaran berhasil diaktifkan."
          : "Metode pembayaran berhasil dinonaktifkan.",
        data: channel,
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_UPDATE_STATUS_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal memperbarui status metode pembayaran.",
      };
    }
  }

  /**
   * ============================================================
   * DELETE
   * ============================================================
   */

  static async delete(
    id: string
  ) {
    try {
      if (!id) {
        return {
          success: false,
          message:
            "ID metode pembayaran tidak valid.",
        };
      }

      const existing =
        await PaymentChannelRepository.findById(
          id
        );

      if (!existing) {
        return {
          success: false,
          message:
            "Metode pembayaran tidak ditemukan.",
        };
      }

      await PaymentChannelRepository.delete(
        id
      );

      return {
        success: true,
        message:
          "Metode pembayaran berhasil dihapus.",
      };
    } catch (error) {
      console.error(
        "[PAYMENT_CHANNEL_DELETE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal menghapus metode pembayaran.",
      };
    }
  }
}