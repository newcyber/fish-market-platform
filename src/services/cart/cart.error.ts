export type CartErrorCode =
  | "INVALID_USER"
  | "INVALID_CART_ITEM"
  | "INVALID_QUANTITY"
  | "PRODUCT_NOT_AVAILABLE"
  | "SKU_REQUIRED"
  | "SKU_NOT_AVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "FLASH_SALE_QUOTA_EXHAUSTED"
  | "FLASH_SALE_QUOTA_INSUFFICIENT"
  | "FLASH_SALE_USER_LIMIT";

export class CartError extends Error {
  readonly code: CartErrorCode;

  constructor(
    code: CartErrorCode,
    message: string
  ) {
    super(message);

    this.name = "CartError";
    this.code = code;
  }
}
