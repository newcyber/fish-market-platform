import {
  calculateInternalShipping,
} from "../internal-shipping.service";

import type {
  ShippingProvider,
} from "../shipping-provider";

import type {
  ShippingQuote,
  ShippingQuoteRequest,
} from "../shipping.types";

/**
 * ============================================================
 * INTERNAL SHIPPING PROVIDER
 * ============================================================
 *
 * Adapter antara Shipping Provider Architecture
 * dengan Internal Shipping Engine yang sudah ada.
 *
 * Provider ini tidak mengubah perhitungan ongkir
 * yang sudah stabil.
 *
 * Provider hanya menerjemahkan hasil dari
 * calculateInternalShipping() ke format
 * ShippingQuote standar.
 * ============================================================
 */

export class InternalShippingProvider
  implements ShippingProvider
{
  /**
   * ==========================================================
   * PROVIDER CODE
   * ==========================================================
   */

  readonly code =
    "INTERNAL" as const;

  /**
   * ==========================================================
   * CONFIGURATION
   * ==========================================================
   */

  private readonly config: {
    enabled: boolean;

    name: string;

    baseFee: number;

    perKmFee: number;

    maxDistanceKm: number;

    freeShippingThreshold:
      | number
      | null;
  };

  constructor(config: {
    enabled: boolean;

    name: string;

    baseFee: number;

    perKmFee: number;

    maxDistanceKm: number;

    freeShippingThreshold:
      | number
      | null;
  }) {
    this.config = config;
  }

  /**
   * ==========================================================
   * GET QUOTE
   * ==========================================================
   */

  async getQuote(
    request: ShippingQuoteRequest
  ): Promise<ShippingQuote> {
    const result =
      calculateInternalShipping({
        storeLocation: {
          latitude:
            request.origin.latitude,

          longitude:
            request.origin.longitude,
        },

        customerLocation: {
          latitude:
            request.destination.latitude,

          longitude:
            request.destination.longitude,
        },

        config: this.config,

        subtotal:
          request.subtotal,
      });

    return {
      provider:
        this.code,

      available:
        result.available,

      serviceName:
        result.serviceName ??
        this.config.name,

      shippingCost:
        result.shippingCost ?? 0,

      distanceKm:
        result.distanceKm ?? null,

      isFreeShipping:
        result.isFreeShipping ?? false,

      reason:
        result.reason ?? null,
    };
  }
}