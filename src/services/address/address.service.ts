import AddressRepository from "@/repositories/address/address.repository";

export class AddressService {
  /**
   * ============================================================
   * GET ALL ADDRESSES
   * ============================================================
   */
  static async getAddressesByUserId(
    userId: string
  ) {
    try {
      const addresses =
        await AddressRepository.findByUserId(
          userId
        );

      return {
        success: true,
        data: addresses,
      };
    } catch (error) {
      console.error(
        "[ADDRESS_GET_ALL_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil data alamat.",
        data: [],
      };
    }
  }

  /**
   * ============================================================
   * GET DEFAULT ADDRESS
   * ============================================================
   */
  static async getDefaultAddress(
    userId: string
  ) {
    try {
      const address =
        await AddressRepository.findDefaultByUserId(
          userId
        );

      return {
        success: true,
        data: address,
      };
    } catch (error) {
      console.error(
        "[ADDRESS_GET_DEFAULT_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil alamat utama.",
        data: null,
      };
    }
  }

  /**
   * ============================================================
   * GET ADDRESS BY ID
   * ============================================================
   *
   * Pastikan address benar-benar milik user.
   * ============================================================
   */
  static async getAddressById(
    userId: string,
    addressId: string
  ) {
    try {
      const address =
        await AddressRepository.findById(
          addressId
        );

      if (!address) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
          data: null,
        };
      }

      /**
       * Ownership validation.
       */
      if (
        address.userId !== userId
      ) {
        return {
          success: false,
          message:
            "Anda tidak memiliki akses ke alamat ini.",
          data: null,
        };
      }

      return {
        success: true,
        data: address,
      };
    } catch (error) {
      console.error(
        "[ADDRESS_GET_BY_ID_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengambil alamat.",
        data: null,
      };
    }
  }

  /**
   * ============================================================
   * CREATE ADDRESS
   * ============================================================
   */
  static async createAddress(
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

      isDefault?: boolean;
    }
  ) {
    try {
      /**
       * ==========================================================
       * VALIDASI DATA WAJIB
       * ==========================================================
       */
      if (
        !data.receiverName.trim() ||
        !data.receiverPhone.trim() ||
        !data.province.trim() ||
        !data.city.trim() ||
        !data.district.trim() ||
        !data.village.trim() ||
        !data.postalCode.trim() ||
        !data.fullAddress.trim()
      ) {
        return {
          success: false,
          message:
            "Mohon lengkapi semua data alamat.",
        };
      }

      /**
       * ==========================================================
       * VALIDASI KOORDINAT
       * ==========================================================
       */
      const hasLatitude =
        data.latitude !== undefined &&
        data.latitude !== null;

      const hasLongitude =
        data.longitude !== undefined &&
        data.longitude !== null;

      /**
       * Latitude dan longitude
       * harus diisi bersamaan.
       */
      if (
        hasLatitude !== hasLongitude
      ) {
        return {
          success: false,
          message:
            "Lokasi peta tidak valid.",
        };
      }

      if (
        hasLatitude &&
        hasLongitude
      ) {
        if (
          !Number.isFinite(
            data.latitude
          ) ||
          !Number.isFinite(
            data.longitude
          )
        ) {
          return {
            success: false,
            message:
              "Koordinat lokasi tidak valid.",
          };
        }

        if (
          data.latitude! < -90 ||
          data.latitude! > 90
        ) {
          return {
            success: false,
            message:
              "Latitude lokasi tidak valid.",
          };
        }

        if (
          data.longitude! < -180 ||
          data.longitude! > 180
        ) {
          return {
            success: false,
            message:
              "Longitude lokasi tidak valid.",
          };
        }
      }

      /**
       * ==========================================================
       * CREATE
       * ==========================================================
       */
      const address =
        await AddressRepository.createWithDefaultHandling(
          userId,
          {
            receiverName:
              data.receiverName.trim(),

            receiverPhone:
              data.receiverPhone.trim(),

            province:
              data.province.trim(),

            city:
              data.city.trim(),

            district:
              data.district.trim(),

            village:
              data.village.trim(),

            postalCode:
              data.postalCode.trim(),

            fullAddress:
              data.fullAddress.trim(),

            latitude:
              data.latitude ?? null,

            longitude:
              data.longitude ?? null,

            label:
              data.label?.trim() || null,

            notes:
              data.notes?.trim() || null,

            isDefault:
              data.isDefault === true,
          }
        );

      return {
        success: true,
        message:
          "Alamat berhasil ditambahkan.",
        data: address,
      };
    } catch (error) {
      console.error(
        "[ADDRESS_CREATE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal menambahkan alamat.",
      };
    }
  }

  /**
   * ============================================================
   * UPDATE ADDRESS
   * ============================================================
   */
  static async updateAddress(
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
    try {
      /**
       * ==========================================================
       * CEK ADDRESS
       * ==========================================================
       */
      const address =
        await AddressRepository.findById(
          addressId
        );

      if (!address) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
        };
      }

      /**
       * ==========================================================
       * VALIDASI KEPEMILIKAN
       * ==========================================================
       */
      if (
        address.userId !== userId
      ) {
        return {
          success: false,
          message:
            "Anda tidak memiliki akses ke alamat ini.",
        };
      }

      /**
       * ==========================================================
       * VALIDASI DATA
       * ==========================================================
       */
      if (
        !data.receiverName.trim() ||
        !data.receiverPhone.trim() ||
        !data.province.trim() ||
        !data.city.trim() ||
        !data.district.trim() ||
        !data.village.trim() ||
        !data.postalCode.trim() ||
        !data.fullAddress.trim()
      ) {
        return {
          success: false,
          message:
            "Mohon lengkapi semua data alamat.",
        };
      }

      /**
       * ==========================================================
       * VALIDASI KOORDINAT
       * ==========================================================
       */
      const hasLatitude =
        data.latitude !== undefined &&
        data.latitude !== null;

      const hasLongitude =
        data.longitude !== undefined &&
        data.longitude !== null;

      if (
        hasLatitude !== hasLongitude
      ) {
        return {
          success: false,
          message:
            "Lokasi peta tidak valid.",
        };
      }

      if (
        hasLatitude &&
        hasLongitude
      ) {
        if (
          !Number.isFinite(
            data.latitude
          ) ||
          !Number.isFinite(
            data.longitude
          )
        ) {
          return {
            success: false,
            message:
              "Koordinat lokasi tidak valid.",
          };
        }

        if (
          data.latitude! < -90 ||
          data.latitude! > 90
        ) {
          return {
            success: false,
            message:
              "Latitude lokasi tidak valid.",
          };
        }

        if (
          data.longitude! < -180 ||
          data.longitude! > 180
        ) {
          return {
            success: false,
            message:
              "Longitude lokasi tidak valid.",
          };
        }
      }

      /**
       * ==========================================================
       * UPDATE
       * ==========================================================
       */
      const updateResult =
        await AddressRepository.update(
          userId,
          addressId,
          {
            receiverName:
              data.receiverName.trim(),

            receiverPhone:
              data.receiverPhone.trim(),

            province:
              data.province.trim(),

            city:
              data.city.trim(),

            district:
              data.district.trim(),

            village:
              data.village.trim(),

            postalCode:
              data.postalCode.trim(),

            fullAddress:
              data.fullAddress.trim(),

            latitude:
              data.latitude ?? null,

            longitude:
              data.longitude ?? null,

            label:
              data.label?.trim() || null,

            notes:
              data.notes?.trim() || null,
          }
        );

      /**
       * updateMany tidak melempar error
       * apabila record berubah menjadi tidak cocok.
       *
       * Karena itu cek affected rows.
       */
      if (
        updateResult.count === 0
      ) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
        };
      }

      /**
       * Ambil kembali address setelah update.
       */
      const updatedAddress =
        await AddressRepository.findById(
          addressId
        );

      return {
        success: true,
        message:
          "Alamat berhasil diperbarui.",
        data: updatedAddress,
      };
    } catch (error) {
      console.error(
        "[ADDRESS_UPDATE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal memperbarui alamat.",
      };
    }
  }

  /**
   * ============================================================
   * SET DEFAULT ADDRESS
   * ============================================================
   */
  static async setDefaultAddress(
    userId: string,
    addressId: string
  ) {
    try {
      /**
       * ==========================================================
       * CEK ADDRESS
       * ==========================================================
       */
      const address =
        await AddressRepository.findById(
          addressId
        );

      if (!address) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
        };
      }

      /**
       * ==========================================================
       * VALIDASI KEPEMILIKAN
       * ==========================================================
       */
      if (
        address.userId !== userId
      ) {
        return {
          success: false,
          message:
            "Anda tidak memiliki akses ke alamat ini.",
        };
      }

      /**
       * ==========================================================
       * SET DEFAULT
       * ==========================================================
       */
      await AddressRepository.setDefault(
        userId,
        addressId
      );

      return {
        success: true,
        message:
          "Alamat utama berhasil diperbarui.",
      };
    } catch (error) {
      /**
       * Address mungkin menjadi tidak tersedia
       * karena race condition.
       */
      if (
        error instanceof Error &&
        error.message ===
          "ADDRESS_NOT_FOUND"
      ) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
        };
      }

      console.error(
        "[ADDRESS_SET_DEFAULT_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal mengubah alamat utama.",
      };
    }
  }

  /**
   * ============================================================
   * DELETE ADDRESS
   * ============================================================
   */
  static async deleteAddress(
    userId: string,
    addressId: string
  ) {
    try {
      /**
       * ==========================================================
       * CEK ADDRESS
       * ==========================================================
       */
      const address =
        await AddressRepository.findById(
          addressId
        );

      if (!address) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
        };
      }

      /**
       * ==========================================================
       * VALIDASI KEPEMILIKAN
       * ==========================================================
       */
      if (
        address.userId !== userId
      ) {
        return {
          success: false,
          message:
            "Anda tidak memiliki akses ke alamat ini.",
        };
      }

      /**
       * ==========================================================
       * DELETE + PROMOTE DEFAULT
       * ==========================================================
       *
       * Semua operasi mutation dilakukan dalam
       * satu transaction di repository.
       */
      await AddressRepository.deleteAndPromoteDefault(
        userId,
        addressId
      );

      return {
        success: true,
        message:
          "Alamat berhasil dihapus.",
      };
    } catch (error) {
      /**
       * ==========================================================
       * ADDRESS NOT FOUND
       * ==========================================================
       */
      if (
        error instanceof Error &&
        error.message ===
          "ADDRESS_NOT_FOUND"
      ) {
        return {
          success: false,
          message:
            "Alamat tidak ditemukan.",
        };
      }

      console.error(
        "[ADDRESS_DELETE_ERROR]",
        error
      );

      return {
        success: false,
        message:
          "Gagal menghapus alamat.",
      };
    }
  }
}

export default AddressService;
