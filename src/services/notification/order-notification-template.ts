/**
 * ============================================================
 * ORDER NOTIFICATION TEMPLATE
 * ============================================================
 *
 * Template notifikasi WhatsApp untuk pesanan baru Pisjo Market.
 *
 * Supported placeholders:
 * {{order_number}}
 * {{customer_name}}
 * {{order_total}}
 * {{order_items}}
 * {{payment_method}}
 * {{order_subtotal}}
 * {{voucher_discount}}
 * {{shipping_method}}
 * {{shipping_cost}}
 * {{order_note}}
 *
 * Contoh:
 * {{order_number}} -> ORD-20260922-042705-1042
 * {{customer_name}} -> KARUNIA PRIMA ADITYA
 * {{order_total}} -> Rp369.580
 *
 * ============================================================
 */

export const DEFAULT_ORDER_NOTIFICATION_TEMPLATE = `🛒 *PESANAN BARU - PISJO MARKET*

📦 Nomor Pesanan: {{order_number}}
👤 Customer: {{customer_name}}

🧊 *Detail Produk*
{{order_items}}

💳 Pembayaran: {{payment_method}}

🧾 Subtotal: {{order_subtotal}}
🎟️ Diskon Voucher: {{voucher_discount}}
🚚 Pengiriman: {{shipping_method}}
📦 Biaya Pengiriman: {{shipping_cost}}
💰 *Total: {{order_total}}*

📝 Catatan: {{order_note}}

📲 Mohon segera periksa pesanan melalui dashboard admin.`;

export const ORDER_NOTIFICATION_TEMPLATE_MAX_LENGTH = 4000;

export const ORDER_NOTIFICATION_TEMPLATE_PLACEHOLDERS = [
  "order_number",
  "customer_name",
  "order_total",
  "order_items",
  "payment_method",
  "order_subtotal",
  "voucher_discount",
  "shipping_method",
  "shipping_cost",
  "order_note",
] as const;

export type OrderNotificationTemplatePlaceholder =
  (typeof ORDER_NOTIFICATION_TEMPLATE_PLACEHOLDERS)[number];

export type OrderNotificationTemplateData = {
  /**
   * Nomor pesanan.
   *
   * Contoh:
   * ORD-20260922-042705-1042
   */
  orderNumber: string;

  /**
   * Nama customer.
   *
   * Contoh:
   * KARUNIA PRIMA ADITYA
   */
  customerName: string;

  /**
   * Total pesanan yang sudah diformat.
   *
   * Contoh:
   * Rp369.580
   */
  orderTotal: string;

  /**
   * Daftar produk dalam bentuk teks.
   *
   * Contoh:
   * Ikan Kakap Merah | 1 Kg Dibersihkan x2
   * Ikan Tuna | 500 gram | Dibersihkan x2
   */
  orderItems?: string | null;

  /**
   * Metode pembayaran.
   *
   * Contoh:
   * Transfer Bank
   * QRIS
   */
  paymentMethod?: string | null;

  /**
   * Subtotal pesanan.
   *
   * Contoh:
   * Rp350.000
   */
  orderSubtotal?: string | null;

  /**
   * Diskon voucher.
   *
   * Contoh:
   * Rp10.000
   */
  voucherDiscount?: string | null;

  /**
   * Biaya pengiriman.
   *
   * Contoh:
   * Rp15.000
   */
  shippingCost?: string | null;

  /**
   * Metode pengiriman.
   *
   * Contoh:
   * Kurir Internal
   */
  shippingMethod?: string | null;

  /**
   * Catatan pesanan.
   *
   * Contoh:
   * Potong menjadi 4 bagian
   */
  orderNote?: string | null;
};

/**
 * Mengambil template yang akan digunakan.
 *
 * Jika template kosong atau hanya berisi spasi,
 * sistem akan menggunakan template default.
 */
export function getOrderNotificationTemplate(template?: string | null): string {
  const normalizedTemplate = template?.trim();

  return normalizedTemplate || DEFAULT_ORDER_NOTIFICATION_TEMPLATE;
}

/**
 * Mengambil placeholder yang tidak didukung oleh sistem.
 *
 * Format yang didukung:
 * {{order_number}}
 * {{customer_name}}
 * {{order_total}}
 *
 * Spasi di dalam placeholder juga didukung:
 * {{ order_number }}
 */
export function getUnknownOrderNotificationPlaceholders(
  template: string,
): string[] {
  const placeholders = new Set<string>();

  const placeholderPattern = /{{\s*([a-z_]+)\s*}}/g;

  for (const match of template.matchAll(placeholderPattern)) {
    const placeholder = match[1];

    if (
      !ORDER_NOTIFICATION_TEMPLATE_PLACEHOLDERS.includes(
        placeholder as OrderNotificationTemplatePlaceholder,
      )
    ) {
      placeholders.add(placeholder);
    }
  }

  return Array.from(placeholders);
}

/**
 * Membersihkan nilai yang akan digunakan pada template.
 *
 * Nilai kosong akan diganti dengan fallback yang sesuai.
 */
function normalizeTemplateValue(
  value: string | null | undefined,
  fallback: string,
): string {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

/**
 * Merender template notifikasi WhatsApp.
 *
 * Placeholder yang didukung:
 *
 * {{order_number}}
 * {{customer_name}}
 * {{order_total}}
 * {{order_items}}
 * {{payment_method}}
 * {{order_subtotal}}
 * {{voucher_discount}}
 * {{shipping_method}}
 * {{shipping_cost}}
 * {{order_note}}
 */
export function renderOrderNotificationTemplate(
  template: string | null | undefined,
  data: OrderNotificationTemplateData,
): string {
  const selectedTemplate = getOrderNotificationTemplate(template);

  const values: Record<string, string> = {
    order_number: normalizeTemplateValue(data.orderNumber, "-"),

    customer_name: normalizeTemplateValue(data.customerName, "-"),

    order_total: normalizeTemplateValue(data.orderTotal, "Rp0"),

    order_items: normalizeTemplateValue(
      data.orderItems,
      "Tidak ada detail produk",
    ),

    payment_method: normalizeTemplateValue(
      data.paymentMethod,
      "Belum ditentukan",
    ),

    order_subtotal: normalizeTemplateValue(data.orderSubtotal, "Rp0"),

    voucher_discount: normalizeTemplateValue(data.voucherDiscount, "Rp0"),

    shipping_method: normalizeTemplateValue(
      data.shippingMethod,
      "Metode pengiriman belum ditentukan",
    ),

    shipping_cost: normalizeTemplateValue(data.shippingCost, "Rp0"),

    order_note: normalizeTemplateValue(data.orderNote, "-"),
  };

  return selectedTemplate.replace(
    /{{\s*([a-z_]+)\s*}}/g,
    (placeholder: string, key: string): string => {
      return values[key] ?? placeholder;
    },
  );
}
