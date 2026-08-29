/**
 * Public Routes
 */
export const PUBLIC_ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:slug",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

/**
 * Customer Routes
 */
export const CUSTOMER_ROUTES = {
  DASHBOARD: "/customer",
  PROFILE: "/customer/account",
  ORDERS: "/customer/orders",
  CART: "/cart",
  CHECKOUT: "/checkout",
} as const;

/**
 * Admin Routes
 */
export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",

  PRODUCTS: "/admin/products",

  CATEGORIES: "/admin/categories",

  ORDERS: "/admin/orders",

  CUSTOMERS: "/admin/customers",

  SETTINGS: "/admin/settings",
} as const;

/**
 * Authentication Routes
 */
export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

/**
 * Redirect setelah login sesuai role.
 */
export const DEFAULT_REDIRECT = {
  SUPER_ADMIN: ADMIN_ROUTES.DASHBOARD,

  ADMIN: ADMIN_ROUTES.DASHBOARD,

  CUSTOMER: CUSTOMER_ROUTES.DASHBOARD,
} as const;