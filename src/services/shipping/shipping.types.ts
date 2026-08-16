/**
 * ============================================================
 * SHIPPING TYPES
 * ============================================================
 *
 * Contract bersama untuk seluruh provider pengiriman.
 *
 * Provider saat ini:
 * - INTERNAL
 *
 * Provider masa depan:
 * - JNE
 * - JNT
 * - SICEPAT
 * - ANTERAJA
 * - POS
 * - PROVIDER API LAIN
 * ============================================================
 */

/**
 * ============================================================
 * SHIPPING PROVIDER CODE
 * ============================================================
 */

export type ShippingProviderCode =
  | "INTERNAL"
  | "JNE"
  | "JNT"
  | "SICEPAT"
  | "ANTERAJA"
  | "POS";

/**
 * ============================================================
 * AVAILABLE SHIPPING PROVIDER
 * ============================================================
 *
 * Representasi provider pengiriman yang tersedia
 * untuk digunakan oleh Checkout atau consumer lainnya.
 *
 * Provider eksternal belum akan aktif sampai
 * implementasi provider-nya tersedia.
 * ============================================================
 */

export interface AvailableShippingProvider {
  /**
   * Kode unik provider.
   */
  code: ShippingProviderCode;

  /**
   * Nama provider yang ditampilkan.
   *
   * Contoh:
   * - Kurir Internal
   * - JNE
   * - J&T Express
   */
  name: string;

  /**
   * Status provider.
   */
  enabled: boolean;
}

/**
 * ============================================================
 * GEO LOCATION
 * ============================================================
 */

export interface ShippingLocation {
  latitude: number | null;

  longitude: number | null;
}

/**
 * ============================================================
 * SHIPPING QUOTE REQUEST
 * ============================================================
 *
 * Request standar yang akan digunakan
 * oleh seluruh provider pengiriman.
 * ============================================================
 */

export interface ShippingQuoteRequest {
  /**
   * Provider yang diminta.
   */
  provider: ShippingProviderCode;

  /**
   * Lokasi asal pengiriman.
   */
  origin: ShippingLocation;

  /**
   * Lokasi tujuan customer.
   */
  destination: ShippingLocation;

  /**
   * Nilai subtotal pesanan.
   */
  subtotal: number;
}

/**
 * ============================================================
 * SHIPPING QUOTE
 * ============================================================
 *
 * Hasil standar dari seluruh provider.
 *
 * Provider Internal maupun API eksternal
 * harus dikonversi ke format ini.
 * ============================================================
 */

export interface ShippingQuote {
  /**
   * Provider yang menghasilkan quote.
   */
  provider: ShippingProviderCode;

  /**
   * Apakah pengiriman tersedia.
   */
  available: boolean;

  /**
   * Nama layanan.
   *
   * Contoh:
   * - Kurir Internal
   * - JNE REG
   * - J&T EZ
   */
  serviceName: string;

  /**
   * Biaya pengiriman final.
   */
  shippingCost: number;

  /**
   * Jarak dalam kilometer.
   *
   * Untuk API eksternal bisa null
   * apabila provider tidak memberikan jarak.
   */
  distanceKm: number | null;

  /**
   * Apakah mendapatkan gratis ongkir.
   */
  isFreeShipping: boolean;

  /**
   * Pesan apabila layanan tidak tersedia.
   */
  reason: string | null;
}