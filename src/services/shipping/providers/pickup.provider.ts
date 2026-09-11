import type { ShippingProvider } from "../shipping-provider";
import type {
  ShippingQuote,
  ShippingQuoteRequest,
} from "../shipping.types";

/** Pesanan diambil langsung oleh customer di toko. */
export class PickupShippingProvider implements ShippingProvider {
  readonly code = "PICKUP" as const;

  async getQuote(
    _request: ShippingQuoteRequest
  ): Promise<ShippingQuote> {
    return {
      provider: this.code,
      available: true,
      serviceName: "Ambil di Tempat",
      shippingCost: 0,
      distanceKm: null,
      isFreeShipping: false,
      reason: null,
    };
  }
}
