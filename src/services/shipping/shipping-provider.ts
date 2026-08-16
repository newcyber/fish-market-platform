import type {
  ShippingProviderCode,
  ShippingQuote,
  ShippingQuoteRequest,
} from "./shipping.types";

/**
 * ============================================================
 * SHIPPING PROVIDER CONTRACT
 * ============================================================
 *
 * Semua provider pengiriman harus mengikuti contract ini.
 *
 * Contoh provider:
 *
 * - InternalShippingProvider
 * - JneShippingProvider
 * - JntShippingProvider
 * - RajaOngkirShippingProvider
 *
 * Dengan contract ini, Checkout dan OrderService
 * tidak perlu mengetahui implementasi internal
 * dari masing-masing provider.
 * ============================================================
 */

export interface ShippingProvider {
  /**
   * Unique provider code.
   */
  readonly code: ShippingProviderCode;

  /**
   * Mengambil estimasi biaya pengiriman.
   */
  getQuote(
    request: ShippingQuoteRequest
  ): Promise<ShippingQuote>;
}