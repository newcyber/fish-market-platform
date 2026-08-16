import shippingProviderRegistry from "./shipping-provider.registry";

import {
  InternalShippingProvider,
} from "./providers/internal.provider";

import type {
  AvailableShippingProvider,
  ShippingProviderCode,
  ShippingQuote,
  ShippingQuoteRequest,
} from "./shipping.types";

/**
 * ============================================================
 * SHIPPING SERVICE
 * ============================================================
 *
 * ShippingService adalah pintu utama untuk:
 *
 * - Register provider
 * - Mengambil daftar provider yang tersedia
 * - Mengambil shipping quote
 *
 * Provider saat ini:
 *
 * - INTERNAL
 *
 * Provider masa depan:
 *
 * - JNE
 * - JNT
 * - SICEPAT
 * - ANTERAJA
 * - POS
 * - Aggregator API
 * ============================================================
 */

/**
 * ============================================================
 * INTERNAL SHIPPING CONFIG
 * ============================================================
 */

export interface InternalShippingConfig {
  /**
   * Apakah kurir internal aktif.
   */
  enabled: boolean;

  /**
   * Nama layanan kurir internal.
   *
   * Disiapkan untuk konfigurasi dan pengembangan
   * provider di masa depan.
   */
  name: string;

  /**
   * Biaya dasar pengiriman.
   */
  baseFee: number;

  /**
   * Biaya tambahan per kilometer.
   */
  perKmFee: number;

  /**
   * Jarak maksimal pengiriman.
   */
  maxDistanceKm: number;

  /**
   * Minimum subtotal untuk gratis ongkir.
   */
  freeShippingThreshold:
    | number
    | null;
}

/**
 * ============================================================
 * SHIPPING SERVICE
 * ============================================================
 */

class ShippingService {
  /**
   * ==========================================================
   * REGISTER INTERNAL PROVIDER
   * ==========================================================
   *
   * Provider internal dibuat berdasarkan konfigurasi
   * shipping yang tersedia.
   */

  registerInternalProvider(
    config: InternalShippingConfig
  ): void {
    /**
     * Jangan register provider apabila
     * kurir internal sedang dinonaktifkan.
     */
    if (!config.enabled) {
      return;
    }

    const provider =
      new InternalShippingProvider(
        config
      );

    shippingProviderRegistry.register(
      provider
    );
  }

  /**
   * ==========================================================
   * GET AVAILABLE PROVIDERS
   * ==========================================================
   *
   * Mengambil daftar provider yang benar-benar
   * sudah terdaftar dan siap digunakan.
   *
   * Saat ini:
   *
   * - INTERNAL
   *
   * Provider eksternal belum akan ditampilkan
   * sebelum implementasinya tersedia.
   * ==========================================================
   */

  getAvailableProviders(): AvailableShippingProvider[] {
    const providers: AvailableShippingProvider[] =
      [];

    /**
     * ========================================================
     * INTERNAL PROVIDER
     * ========================================================
     */

    try {
      /**
       * Pastikan provider INTERNAL memang
       * sudah terdaftar di registry.
       *
       * Hasil get() sengaja tidak digunakan langsung
       * karena contract ShippingProvider tidak memiliki
       * property "name".
       */
      shippingProviderRegistry.get(
        "INTERNAL"
      );

      providers.push({
        code: "INTERNAL",

        /**
         * Nama provider ditentukan oleh
         * Shipping Method layer.
         *
         * Tidak mengambil provider.name karena
         * property tersebut bukan bagian dari
         * contract ShippingProvider.
         */
        name: "Kurir Internal",

        enabled: true,
      });
    } catch {
      /**
       * INTERNAL belum terdaftar.
       *
       * Tidak perlu melempar error karena provider
       * dapat saja belum diregistrasikan ketika
       * aplikasi sedang melakukan inisialisasi.
       */
    }

    return providers;
  }

  /**
   * ==========================================================
   * GET QUOTE
   * ==========================================================
   *
   * Provider dipilih berdasarkan provider code.
   *
   * Seluruh provider harus mengembalikan hasil
   * dalam format ShippingQuote.
   * ==========================================================
   */

  async getQuote(
    request: ShippingQuoteRequest
  ): Promise<ShippingQuote> {
    const provider =
      shippingProviderRegistry.get(
        request.provider
      );

    return provider.getQuote(
      request
    );
  }

  /**
   * ==========================================================
   * CHECK PROVIDER AVAILABILITY
   * ==========================================================
   *
   * Mengembalikan true apabila provider sudah
   * terdaftar di ShippingProviderRegistry.
   */

  hasProvider(
    providerCode: ShippingProviderCode
  ): boolean {
    try {
      shippingProviderRegistry.get(
        providerCode
      );

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * ============================================================
 * SINGLETON INSTANCE
 * ============================================================
 */

const shippingService =
  new ShippingService();

export default shippingService;