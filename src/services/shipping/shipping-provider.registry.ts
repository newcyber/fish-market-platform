import type {
  ShippingProvider,
} from "./shipping-provider";

import type {
  ShippingProviderCode,
} from "./shipping.types";

/**
 * ============================================================
 * SHIPPING PROVIDER REGISTRY
 * ============================================================
 *
 * Registry bertugas menyimpan provider
 * yang tersedia dalam aplikasi.
 *
 * Contoh:
 *
 * registry.register(
 *   new InternalShippingProvider(...)
 * );
 *
 * Nantinya:
 *
 * registry.register(
 *   new JneShippingProvider(...)
 * );
 *
 * registry.register(
 *   new JntShippingProvider(...)
 * );
 * ============================================================
 */

class ShippingProviderRegistry {
  /**
   * ==========================================================
   * PROVIDER STORAGE
   * ==========================================================
   */

  private readonly providers =
    new Map<
      ShippingProviderCode,
      ShippingProvider
    >();

  /**
   * ==========================================================
   * REGISTER PROVIDER
   * ==========================================================
   */

  register(
    provider: ShippingProvider
  ): void {
    this.providers.set(
      provider.code,
      provider
    );
  }

  /**
   * ==========================================================
   * GET PROVIDER
   * ==========================================================
   */

  get(
    code: ShippingProviderCode
  ): ShippingProvider {
    const provider =
      this.providers.get(
        code
      );

    if (!provider) {
      throw new Error(
        `Shipping provider "${code}" tidak tersedia.`
      );
    }

    return provider;
  }

  /**
   * ==========================================================
   * HAS PROVIDER
   * ==========================================================
   */

  has(
    code: ShippingProviderCode
  ): boolean {
    return this.providers.has(
      code
    );
  }

  /**
   * ==========================================================
   * GET ALL PROVIDERS
   * ==========================================================
   */

  getAll():
    ShippingProvider[] {
    return Array.from(
      this.providers.values()
    );
  }
}

/**
 * ============================================================
 * SINGLETON
 * ============================================================
 */

const shippingProviderRegistry =
  new ShippingProviderRegistry();

export default
  shippingProviderRegistry;