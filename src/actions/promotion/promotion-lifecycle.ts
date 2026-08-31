"use server";

import {
  redirect,
} from "next/navigation";

import {
  revalidatePath,
} from "next/cache";

import PromotionService from "@/services/promotion/promotion.service";

/**
 * ============================================================
 * VALIDATE PROMOTION ID
 * ============================================================
 */

function normalizePromotionId(
  id: string
) {
  const normalized =
    String(id).trim();

  if (!normalized) {
    throw new Error(
      "Promotion ID tidak valid."
    );
  }

  return normalized;
}

/**
 * ============================================================
 * GET PROMOTION
 * ============================================================
 */

async function getPromotion(
  id: string
) {
  const promotion =
    await PromotionService.getById(
      id
    );

  if (!promotion) {
    throw new Error(
      "Promotion tidak ditemukan."
    );
  }

  return promotion;
}

/**
 * ============================================================
 * REVALIDATE PROMOTION
 * ============================================================
 */

function revalidatePromotionPaths(
  id: string,
  slug: string
) {
  revalidatePath(
    "/admin/promotions"
  );

  revalidatePath(
    `/admin/promotions/${id}`
  );

  revalidatePath(
    "/promotions"
  );

  revalidatePath(
    `/promotions/${slug}`
  );
}

/**
 * ============================================================
 * SCHEDULE
 * ============================================================
 *
 * DRAFT
 *   ↓
 * SCHEDULED
 *
 * startAt dan endAt diambil dari promotion
 * yang sudah tersimpan di database.
 *
 * Tidak boleh mengambil tanggal dari client
 * untuk lifecycle transition ini.
 */

export async function schedulePromotionAction(
  id: string,
  formData: FormData
) {
  const promotionId =
    normalizePromotionId(id);

  const promotion =
    await getPromotion(
      promotionId
    );

  /**
   * ----------------------------------------------------------
   * GET DATE FROM FORM
   * ----------------------------------------------------------
   *
   * Tanggal schedule berasal dari form admin.
   *
   * Server tetap melakukan seluruh business validation
   * melalui PromotionService.schedule().
   */

  const startAtValue =
    formData.get("startAt");

  const endAtValue =
    formData.get("endAt");

  if (
    typeof startAtValue !== "string" ||
    typeof endAtValue !== "string"
  ) {
    throw new Error(
      "Tanggal mulai dan tanggal berakhir wajib diisi."
    );
  }

  if (
    !startAtValue.trim() ||
    !endAtValue.trim()
  ) {
    throw new Error(
      "Tanggal mulai dan tanggal berakhir wajib diisi."
    );
  }

  /**
   * ----------------------------------------------------------
   * PARSE DATE
   * ----------------------------------------------------------
   */

  const startAt =
    new Date(
      startAtValue
    );

  const endAt =
    new Date(
      endAtValue
    );

  if (
    Number.isNaN(
      startAt.getTime()
    ) ||
    Number.isNaN(
      endAt.getTime()
    )
  ) {
    throw new Error(
      "Format tanggal promotion tidak valid."
    );
  }

  /**
   * ----------------------------------------------------------
   * SCHEDULE
   * ----------------------------------------------------------
   *
   * Semua business validation tetap berada
   * di PromotionService.schedule().
   */

  await PromotionService.schedule(
    promotionId,
    startAt,
    endAt
  );

  /**
   * ----------------------------------------------------------
   * REVALIDATE
   * ----------------------------------------------------------
   */

  revalidatePromotionPaths(
    promotionId,
    promotion.slug
  );

  /**
   * ----------------------------------------------------------
   * REDIRECT
   * ----------------------------------------------------------
   */

  redirect(
    `/admin/promotions/${promotionId}`
  );
}

/**
 * ============================================================
 * ACTIVATE
 * ============================================================
 *
 * SCHEDULED
 *   ↓
 * ACTIVE
 *
 * Business validation tetap dilakukan
 * oleh PromotionService.activate().
 */

export async function activatePromotionAction(
  id: string
) {
  const promotionId =
    normalizePromotionId(id);

  const promotion =
    await getPromotion(
      promotionId
    );

  await PromotionService.activate(
    promotionId
  );

  revalidatePromotionPaths(
    promotionId,
    promotion.slug
  );

  redirect(
    `/admin/promotions/${promotionId}`
  );
}

/**
 * ============================================================
 * END
 * ============================================================
 *
 * ACTIVE
 *   ↓
 * ENDED
 */

export async function endPromotionAction(
  id: string
) {
  const promotionId =
    normalizePromotionId(id);

  const promotion =
    await getPromotion(
      promotionId
    );

  await PromotionService.end(
    promotionId
  );

  revalidatePromotionPaths(
    promotionId,
    promotion.slug
  );

  redirect(
    `/admin/promotions/${promotionId}`
  );
}

/**
 * ============================================================
 * CANCEL
 * ============================================================
 *
 * DRAFT / SCHEDULED / ACTIVE
 *   ↓
 * CANCELLED
 */

export async function cancelPromotionAction(
  id: string
) {
  const promotionId =
    normalizePromotionId(id);

  const promotion =
    await getPromotion(
      promotionId
    );

  await PromotionService.cancel(
    promotionId
  );

  revalidatePromotionPaths(
    promotionId,
    promotion.slug
  );

  redirect(
    `/admin/promotions/${promotionId}`
  );
}

/**
 * ============================================================
 * DELETE
 * ============================================================
 *
 * Soft delete.
 *
 * Lifecycle status tidak diubah.
 */

export async function deletePromotionAction(
  id: string
) {
  const promotionId =
    normalizePromotionId(id);

  const promotion =
    await getPromotion(
      promotionId
    );

  await PromotionService.delete(
    promotionId
  );

  revalidatePromotionPaths(
    promotionId,
    promotion.slug
  );

  redirect(
    "/admin/promotions"
  );
}
