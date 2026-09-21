/**
 * ============================================================
 * CART EVENTS
 * ============================================================
 *
 * Event browser untuk menyinkronkan cart badge
 * tanpa perlu refresh halaman.
 */

export const CART_UPDATED_EVENT = "cart-updated";

export function emitCartUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}
