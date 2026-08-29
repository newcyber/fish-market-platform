import {
  OrderStatus,
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  calculateRewardPointsFromGrams,
} from "./reward-point.calculator";

/**
 * ============================================================
 * REWARD POINT SERVICE
 * ============================================================
 *
 * Tanggung jawab:
 *
 * 1. Resolve berat dari canonical ProductSku.
 * 2. Mengubah label berat menjadi gram.
 * 3. Menghitung reward point berdasarkan berat.
 *
 * SERVICE INI TIDAK MEMBERIKAN POINT KE CUSTOMER.
 *
 * Pemberian EARN transaction akan dibuat pada tahap berikutnya
 * setelah aturan lifecycle order ditentukan.
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface SkuOption {
  variantOption: {
    label: string;
    group: {
      name: string;
    };
  };
}

/**
 * ============================================================
 * PARSE WEIGHT LABEL
 * ============================================================
 *
 * Contoh:
 *
 * "500g"      -> 500
 * "500 gr"    -> 500
 * "1Kg"       -> 1000
 * "1 Kg"      -> 1000
 * "1.5Kg"     -> 1500
 * "1,5 Kg"    -> 1500
 * "700-800g"  -> 700
 * "700–800g"  -> 700
 *
 * Untuk range berat, digunakan berat MINIMUM.
 *
 * Contoh:
 *
 * 700-800g -> 700g
 *
 * Alasannya:
 * reward tidak boleh dihitung berdasarkan berat maksimum
 * yang belum tentu diterima customer.
 */

export function parseWeightLabelToGrams(
  label: string
): number | null {
  const normalized =
    label
      .trim()
      .toLowerCase()
      .replace(
        /,/g,
        "."
      )
      .replace(
        /\s+/g,
        ""
      );

  if (!normalized) {
    return null;
  }

  /**
   * ==========================================================
   * RANGE
   * ==========================================================
   *
   * Contoh:
   *
   * 700-800g
   * 700–800g
   * 700~800g
   */

  const rangeMatch =
    normalized.match(
      /^(\d+(?:\.\d+)?)[\-–~](\d+(?:\.\d+)?)(kg|g|gram|gr)$/
    );

  if (rangeMatch) {
    const minimum =
      Number(
        rangeMatch[1]
      );

    const unit =
      rangeMatch[3];

    if (
      !Number.isFinite(
        minimum
      ) ||
      minimum <= 0
    ) {
      return null;
    }

    if (unit === "kg") {
      return Math.round(
        minimum * 1000
      );
    }

    return Math.round(
      minimum
    );
  }

  /**
   * ==========================================================
   * SINGLE VALUE
   * ==========================================================
   */

  const singleMatch =
    normalized.match(
      /^(\d+(?:\.\d+)?)(kg|g|gram|gr)$/
    );

  if (!singleMatch) {
    return null;
  }

  const value =
    Number(
      singleMatch[1]
    );

  const unit =
    singleMatch[2];

  if (
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    return null;
  }

  if (unit === "kg") {
    return Math.round(
      value * 1000
    );
  }

  return Math.round(
    value
  );
}

/**
 * ============================================================
 * GET WEIGHT FROM SKU
 * ============================================================
 *
 * Berat hanya dicari dari:
 *
 * ProductSku
 *   ↓
 * ProductSkuOption
 *   ↓
 * ProductVariantOption
 *   ↓
 * ProductVariantGroup
 *
 * Dan group HARUS bernama "Berat".
 *
 * Dengan demikian:
 *
 * Kondisi -> "Utuh"
 *
 * tidak pernah dianggap sebagai berat.
 */

export async function getSkuWeightInGrams(
  skuId: string
): Promise<number | null> {
  const sku =
    await prisma.productSku.findUnique({
      where: {
        id: skuId,
      },

      select: {
        skuOptions: {
          select: {
            variantOption: {
              select: {
                label: true,

                group: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!sku) {
    return null;
  }

  const weightOption =
    (
      sku.skuOptions as SkuOption[]
    ).find(
      (option) =>
        option.variantOption.group.name
          .trim()
          .toLowerCase() ===
        "berat"
    );

  if (!weightOption) {
    return null;
  }

  return parseWeightLabelToGrams(
    weightOption.variantOption.label
  );
}

export interface SkuOptionSnapshot {
  productVariant: string | null;
  productWeight: string | null;
  weightSku: string | null;
}

export function getSkuOptionSnapshotFromSku(
  skuOptions: SkuOption[]
): SkuOptionSnapshot {
  let productVariant: string | null = null;
  let productWeight: string | null = null;

  for (const option of skuOptions) {
    const groupName =
      option.variantOption.group.name
        .trim()
        .toLowerCase();

    const label =
      option.variantOption.label.trim();

    if (!label) {
      continue;
    }

    if (groupName === "berat") {
      productWeight = label;
      continue;
    }

    productVariant =
      productVariant === null
        ? label
        : `${productVariant}, ${label}`;
  }

  return {
    productVariant,
    productWeight,
    weightSku: productWeight,
  };
}

export async function getSkuOptionSnapshot(
  skuId: string
): Promise<SkuOptionSnapshot> {
  const sku =
    await prisma.productSku.findUnique({
      where: {
        id: skuId,
      },
      select: {
        skuOptions: {
          select: {
            variantOption: {
              select: {
                label: true,
                group: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!sku) {
    return {
      productVariant: null,
      productWeight: null,
      weightSku: null,
    };
  }

  let productVariant: string | null = null;
  let productWeight: string | null = null;

  for (const option of sku.skuOptions) {
    const groupName =
      option.variantOption.group.name
        .trim()
        .toLowerCase();

    const label =
      option.variantOption.label.trim();

    if (!label) {
      continue;
    }

    if (groupName === "berat") {
      productWeight = label;
    } else {
      productVariant =
        productVariant === null
          ? label
          : `${productVariant}, ${label}`;
    }
  }

  return {
    productVariant,
    productWeight,
    weightSku: productWeight,
  };
}

/**
 * ============================================================
 * GET SKU REWARD POINT
 * ============================================================
 *
 * Menghitung reward point untuk SATU unit SKU.
 */

export async function getSkuRewardPoints(
  skuId: string
): Promise<number> {
  const grams =
    await getSkuWeightInGrams(
      skuId
    );

  if (
    grams === null
  ) {
    return 0;
  }

  return calculateRewardPointsFromGrams(
    grams
  );
}

/**
 * ============================================================
 * GET ORDER ITEM REWARD POINT
 * ============================================================
 *
 * quantity diperhitungkan di sini.
 *
 * Contoh:
 *
 * 500g × 1 = 5
 * 500g × 2 = 10
 * 1kg × 3 = 30
 */

export async function getOrderItemRewardPoints(
  skuId: string,
  quantity: number
): Promise<number> {
  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <= 0
  ) {
    return 0;
  }

  const pointsPerUnit =
    await getSkuRewardPoints(
      skuId
    );

  return (
    pointsPerUnit *
    quantity
  );
}

/**
 * ============================================================
 * GET ORDER REWARD SUMMARY
 * ============================================================
 *
 * Menghitung estimasi reward point dari seluruh OrderItem.
 *
 * Reward menggunakan weightSku yang sudah disimpan
 * sebagai snapshot pada OrderItem saat checkout.
 *
 * Tidak membaca kembali berat dari ProductSku.
 *
 * Dengan demikian:
 *
 * OrderItem
 *   └── weightSku
 *          ↓
 *      parse gram
 *          ↓
 *      reward point
 *
 * Perubahan ProductSku setelah order dibuat
 * tidak memengaruhi perhitungan reward order tersebut.
 */

export async function getOrderRewardSummary(
  orderId: string
): Promise<{
  weightGrams: number;
  points: number;
}> {
  const normalizedOrderId =
    String(orderId).trim();

  if (!normalizedOrderId) {
    return {
      weightGrams: 0,
      points: 0,
    };
  }

  const order =
    await prisma.order.findUnique({
      where: {
        id: normalizedOrderId,
      },

      select: {
        items: {
          select: {
            quantity: true,
            weightSku: true,
          },
        },
      },
    });

  if (!order) {
    return {
      weightGrams: 0,
      points: 0,
    };
  }

  let totalWeightGrams = 0;
  let totalPoints = 0;

  for (
    const item of order.items
  ) {
    if (
      !Number.isInteger(
        item.quantity
      ) ||
      item.quantity <= 0
    ) {
      continue;
    }

    const weightSku =
      item.weightSku?.trim();

    if (!weightSku) {
      continue;
    }

    const grams =
      parseWeightLabelToGrams(
        weightSku
      );

    if (
      grams === null ||
      grams <= 0
    ) {
      continue;
    }

    totalWeightGrams +=
      grams *
      item.quantity;

    totalPoints +=
      calculateRewardPointsFromGrams(
        grams
      ) *
      item.quantity;
  }

  return {
    weightGrams:
      totalWeightGrams,

    points:
      totalPoints,
  };
}

/**
 * ============================================================
 * GET ORDER REWARD POINT
 * ============================================================
 *
 * Menghitung total reward point dari seluruh OrderItem.
 *
 * Reward menggunakan weightSku yang sudah disimpan
 * sebagai snapshot pada OrderItem.
 *
 * Tidak membaca kembali berat dari ProductSku.
 */
export async function getOrderRewardPoints(
  orderId: string
): Promise<number> {
  const normalizedOrderId =
    String(orderId).trim();

  if (!normalizedOrderId) {
    return 0;
  }

  const order =
    await prisma.order.findUnique({
      where: {
        id: normalizedOrderId,
      },

      select: {
        items: {
          select: {
            quantity: true,
            weightSku: true,
          },
        },
      },
    });

  if (!order) {
    return 0;
  }

  let totalPoints = 0;

  for (
    const item of order.items
  ) {
    if (
      !Number.isInteger(
        item.quantity
      ) ||
      item.quantity <= 0
    ) {
      continue;
    }

    const weightSku =
      item.weightSku?.trim();

    if (!weightSku) {
      continue;
    }

    const grams =
      parseWeightLabelToGrams(
        weightSku
      );

    if (
      grams === null ||
      grams <= 0
    ) {
      continue;
    }

    totalPoints +=
      calculateRewardPointsFromGrams(
        grams
      ) *
      item.quantity;
  }

  return totalPoints;
}

/**
 * ============================================================
 * AWARD ORDER REWARD POINTS — TRANSACTION CLIENT
 * ============================================================
 *
 * Memberikan EARN reward point menggunakan transaction client
 * yang berasal dari transaction caller.
 *
 * Fungsi ini TIDAK membuat transaction baru.
 *
 * Order COMPLETED
 *      ↓
 * RewardPointTransaction
 *      ↓
 * User.rewardPointsBalance
 *
 * Seluruhnya berada dalam transaction yang sama.
 */
export async function awardOrderRewardPointsTx(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    deletedAt: Date | null;

    items: Array<{
      quantity: number;
      weightSku: string | null;
    }>;
  }
) {
  /**
   * ==========================================================
   * 1. VALIDATE ORDER
   * ==========================================================
   */

  if (
    order.status !==
    OrderStatus.COMPLETED
  ) {
    throw new Error(
      `Reward point hanya dapat diberikan untuk order COMPLETED. Status saat ini: ${order.status}`
    );
  }

  if (
    order.deletedAt !== null
  ) {
    throw new Error(
      "Order sudah dihapus."
    );
  }

  /**
   * ==========================================================
   * 2. CALCULATE POINT + TOTAL WEIGHT
   * ==========================================================
   *
   * PENTING:
   *
   * Reward menggunakan weightSku dari OrderItem.
   *
   * weightSku adalah snapshot yang dibuat ketika checkout.
   *
   * Jadi perubahan ProductSku setelah order dibuat
   * tidak akan mengubah reward order tersebut.
   */

  let totalPoints = 0;
  let totalWeightGrams = 0;

  for (
    const item of order.items
  ) {
    if (
      !Number.isInteger(
        item.quantity
      ) ||
      item.quantity <= 0
    ) {
      continue;
    }

    const weightSku =
      item.weightSku?.trim();

    if (!weightSku) {
      continue;
    }

    const grams =
      parseWeightLabelToGrams(
        weightSku
      );

    if (
      grams === null ||
      grams <= 0
    ) {
      continue;
    }

    totalWeightGrams +=
      grams *
      item.quantity;

    totalPoints +=
      calculateRewardPointsFromGrams(
        grams
      ) *
      item.quantity;
  }

  /**
   * ==========================================================
   * 3. IDEMPOTENCY CHECK
   * ==========================================================
   *
   * PENTING:
   *
   * Idempotency harus diperiksa SEBELUM validasi NO REWARD.
   *
   * Alasannya:
   *
   * Order lama mungkin tidak memiliki weightSku snapshot,
   * tetapi sudah pernah mendapatkan reward.
   *
   * Jika pengecekan NO REWARD dilakukan terlebih dahulu,
   * order tersebut akan langsung return dengan:
   *
   *     awarded: false
   *     alreadyAwarded: false
   *     points: 0
   *
   * padahal sebenarnya reward sudah pernah diberikan.
   *
   * Dengan melakukan idempotency check terlebih dahulu,
   * transaksi EARN yang sudah ada akan selalu dianggap
   * sebagai sumber kebenaran untuk reward yang telah diberikan.
   *
   * Unique constraint:
   *
   *     [orderId, type]
   *
   * tetap menjadi protection terakhir terhadap concurrent request.
   */

  const existing =
    await tx.rewardPointTransaction.findUnique({
      where: {
        orderId_type: {
          orderId: order.id,
          type: "EARN",
        },
      },
    });

  if (existing) {
    return {
      awarded: false,

      alreadyAwarded: true,

      points:
        existing.points,

      weightGrams:
        existing.weightGrams ??
        0,

      orderId:
        order.id,

      orderNumber:
        order.orderNumber,

      transactionId:
        existing.id,
    };
  }

  /**
   * ==========================================================
   * 4. NO REWARD
   * ==========================================================
   *
   * Sampai titik ini dipastikan bahwa order BELUM memiliki
   * transaksi EARN.
   *
   * Jika totalPoints <= 0, jangan membuat ledger dan jangan
   * mengubah rewardPointsBalance customer.
   */

  if (
    totalPoints <= 0
  ) {
    return {
      awarded: false,

      alreadyAwarded: false,

      points: 0,

      weightGrams:
        totalWeightGrams,

      orderId:
        order.id,

      orderNumber:
        order.orderNumber,
    };
  }

  /**
   * ==========================================================
   * 5. CREATE IMMUTABLE LEDGER
   * ==========================================================
   *
   * Membuat satu transaksi EARN untuk order.
   *
   * Transaksi ini berada di transaction yang sama dengan
   * update balance customer.
   */

  const transaction =
    await tx.rewardPointTransaction.create({
      data: {
        userId:
          order.userId,

        orderId:
          order.id,

        type: "EARN",

        points:
          totalPoints,

        weightGrams:
          totalWeightGrams,

        description:
          `Reward pembelian order ${order.orderNumber}`,
      },
    });

  /**
   * ==========================================================
   * 6. UPDATE CACHED BALANCE
   * ==========================================================
   *
   * Balance customer diperbarui dalam transaction yang sama
   * dengan pembuatan ledger.
   *
   * Jika salah satu operasi gagal, seluruh transaction
   * akan di-rollback.
   */

  await tx.user.update({
    where: {
      id: order.userId,
    },

    data: {
      rewardPointsBalance: {
        increment:
          totalPoints,
      },
    },
  });

  /**
   * ==========================================================
   * 7. RESULT
   * ==========================================================
   */

  return {
    awarded: true,

    alreadyAwarded: false,

    points:
      totalPoints,

    weightGrams:
      totalWeightGrams,

    orderId:
      order.id,

    orderNumber:
      order.orderNumber,

    transactionId:
      transaction.id,
  };
}

/**
 * ============================================================
 * AWARD ORDER REWARD POINTS
 * ============================================================
 *
 * Memberikan reward point kepada customer ketika order
 * sudah COMPLETED.
 *
 * Fungsi ini merupakan public wrapper untuk proses reward.
 *
 * Seluruh business logic reward dipusatkan pada:
 *
 * awardOrderRewardPointsTx()
 *
 * Dengan demikian tidak ada duplicate logic perhitungan
 * reward antara wrapper dan transaction service.
 *
 * REWARD MENGGUNAKAN:
 *
 * OrderItem.weightSku
 *
 * sebagai snapshot berat ketika checkout.
 *
 * Tidak membaca kembali berat dari ProductSku.
 */
export async function awardOrderRewardPoints(
  orderId: string
) {
  const normalizedOrderId =
    String(orderId).trim();

  if (!normalizedOrderId) {
    throw new Error(
      "Order ID tidak valid."
    );
  }

  /**
   * ==========================================================
   * 1. LOAD ORDER + ORDER ITEM SNAPSHOT
   * ==========================================================
   *
   * weightSku diambil langsung dari OrderItem.
   *
   * Jangan mengambil berat dari ProductSku karena ProductSku
   * dapat berubah setelah order dibuat.
   */

  const order =
    await prisma.order.findUnique({
      where: {
        id: normalizedOrderId,
      },

      select: {
        id: true,

        orderNumber: true,

        userId: true,

        status: true,

        deletedAt: true,

        items: {
          select: {
            quantity: true,

            weightSku: true,
          },
        },
      },
    });

  if (!order) {
    throw new Error(
      "Order tidak ditemukan."
    );
  }

  /**
   * ==========================================================
   * 2. EXECUTE REWARD ENGINE
   * ==========================================================
   *
   * Seluruh logic reward berada di satu tempat:
   *
   * awardOrderRewardPointsTx()
   *
   * Termasuk:
   *
   * - validasi COMPLETED
   * - validasi deletedAt
   * - membaca weightSku snapshot
   * - menghitung berat
   * - menghitung reward point
   * - idempotency
   * - membuat ledger EARN
   * - update rewardPointsBalance
   *
   * Semuanya berjalan dalam transaction yang sama.
   */

  return prisma.$transaction(
    async (tx) => {
      return awardOrderRewardPointsTx(
        tx,
        order
      );
    }
  );
}

/**
 * ============================================================
 * GET UNSEEN REWARD
 * ============================================================
 *
 * Mengambil reward EARN yang belum pernah dilihat customer.
 *
 * Digunakan untuk menentukan apakah popup reward perlu
 * ditampilkan pada halaman customer account.
 *
 * PENTING:
 *
 * - Hanya EARN
 * - Hanya milik user yang bersangkutan
 * - rewardViewedAt masih null
 * - points harus > 0
 *
 * Tidak mengubah database.
 */
export async function getUnseenReward(
  userId: string
) {
  const normalizedUserId =
    String(userId).trim();

  if (!normalizedUserId) {
    return null;
  }

  const reward =
    await prisma.rewardPointTransaction.findFirst({
      where: {
        userId:
          normalizedUserId,

        type:
          "EARN",

        points: {
          gt: 0,
        },

        rewardViewedAt:
          null,
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        id: true,

        orderId: true,

        points: true,

        weightGrams: true,

        description: true,

        createdAt: true,
      },
    });

  return reward;
}

/**
 * ============================================================
 * MARK REWARD AS VIEWED
 * ============================================================
 *
 * Menandai reward EARN sebagai sudah dilihat customer.
 *
 * Hanya transaksi milik user tersebut yang boleh diubah.
 *
 * Fungsi dibuat idempotent:
 *
 * Jika reward sudah dilihat,
 * fungsi tetap aman dipanggil kembali.
 */
export async function markRewardAsViewed(
  rewardId: string,
  userId: string
) {
  const normalizedRewardId =
    String(rewardId).trim();

  const normalizedUserId =
    String(userId).trim();

  if (
    !normalizedRewardId ||
    !normalizedUserId
  ) {
    throw new Error(
      "Reward ID atau User ID tidak valid."
    );
  }

  const result =
    await prisma.rewardPointTransaction.updateMany({
      where: {
        id:
          normalizedRewardId,

        userId:
          normalizedUserId,

        type:
          "EARN",

        rewardViewedAt:
          null,
      },

      data: {
        rewardViewedAt:
          new Date(),
      },
    });

  return {
    success:
      result.count > 0,

    alreadyViewed:
      result.count === 0,
  };
}