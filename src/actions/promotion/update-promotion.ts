"use server";

import {
  redirect,
} from "next/navigation";

import {
  revalidatePath,
} from "next/cache";

import {
  PromotionDiscountType,
  PromotionType,
} from "@prisma/client";

import PromotionService from "@/services/promotion/promotion.service";

import type {
  ActionResult,
} from "@/types/action-result";

/**
 * ============================================================
 * NORMALIZE OPTIONAL DATE
 * ============================================================
 */

function normalizeOptionalDate(
  value: FormDataEntryValue | null
): Date | null {
  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const date =
    new Date(String(value));

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Format tanggal promotion tidak valid."
    );
  }

  return date;
}

/**
 * ============================================================
 * NORMALIZE NUMBER
 * ============================================================
 */

function normalizeNumber(
  value: FormDataEntryValue | null
): number | null {
  if (
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const numberValue =
    Number(
      String(value).trim()
    );

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return null;
  }

  return numberValue;
}

/**
 * ============================================================
 * UPDATE PROMOTION ACTION
 * ============================================================
 *
 * Lifecycle/status tidak disentuh oleh action ini.
 *
 * Update hanya mengubah:
 * - name
 * - slug
 * - description
 * - banner
 * - type
 * - discountType
 * - discountValue
 * - startAt
 * - endAt
 * - sortOrder
 * - isFeatured
 */

export async function updatePromotionAction(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const promotionId =
      String(id).trim();

    if (!promotionId) {
      return {
        success: false,
        message:
          "Promotion ID tidak valid.",
      };
    }

    const name =
      String(
        formData.get("name") ?? ""
      ).trim();

    const slug =
      String(
        formData.get("slug") ?? ""
      ).trim();

    const descriptionRaw =
      String(
        formData.get("description") ?? ""
      ).trim();

    const bannerRaw =
      String(
        formData.get("banner") ?? ""
      ).trim();

    const typeRaw =
      String(
        formData.get("type") ?? ""
      ).trim();

    const discountTypeRaw =
      String(
        formData.get("discountType") ?? ""
      ).trim();

    const discountValue =
      normalizeNumber(
        formData.get(
          "discountValue"
        )
      );

    const startAt =
      normalizeOptionalDate(
        formData.get("startAt")
      );

    const endAt =
      normalizeOptionalDate(
        formData.get("endAt")
      );

    const sortOrder =
      normalizeNumber(
        formData.get("sortOrder")
      ) ?? 0;

    const isFeaturedRaw =
      String(
        formData.get("isFeatured") ?? ""
      ).trim();

    if (!name) {
      return {
        success: false,
        message:
          "Nama promotion wajib diisi.",
      };
    }

    if (!slug) {
      return {
        success: false,
        message:
          "Slug promotion wajib diisi.",
      };
    }

    if (
      !Object.values(
        PromotionType
      ).includes(
        typeRaw as PromotionType
      )
    ) {
      return {
        success: false,
        message:
          "Tipe promotion tidak valid.",
      };
    }

    const type =
      typeRaw as PromotionType;

    let discountType:
      | PromotionDiscountType
      | null = null;

    if (
      discountTypeRaw
    ) {
      if (
        !Object.values(
          PromotionDiscountType
        ).includes(
          discountTypeRaw as PromotionDiscountType
        )
      ) {
        return {
          success: false,
          message:
            "Jenis discount tidak valid.",
        };
      }

      discountType =
        discountTypeRaw as PromotionDiscountType;
    }

    const normalizedDiscountType =
      type === PromotionType.MARKETING
        ? null
        : discountType;

    const normalizedDiscountValue =
      type === PromotionType.MARKETING
        ? null
        : discountValue;

    if (
      !Number.isInteger(
        sortOrder
      ) ||
      sortOrder < 0
    ) {
      return {
        success: false,
        message:
          "Sort order harus berupa angka bulat 0 atau lebih.",
      };
    }

    const updated =
      await PromotionService.update(
        promotionId,
        {
          name,
          slug,
          description:
            descriptionRaw || null,
          banner:
            bannerRaw || null,
          type,
          discountType:
            normalizedDiscountType,
          discountValue:
            normalizedDiscountValue,
          startAt,
          endAt,
          sortOrder,
          isFeatured:
            isFeaturedRaw === "true" ||
            isFeaturedRaw === "on" ||
            isFeaturedRaw === "1",
        }
      );

    revalidatePath(
      "/admin/promotions"
    );

    revalidatePath(
      `/admin/promotions/${promotionId}`
    );

    revalidatePath(
      "/promotions"
    );

    revalidatePath(
      `/promotions/${updated.slug}`
    );

    redirect(
      `/admin/promotions/${promotionId}`
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (
        error as {
          digest?: unknown;
        }
      ).digest === "string" &&
      (
        error as {
          digest: string;
        }
      ).digest.startsWith(
        "NEXT_REDIRECT"
      )
    ) {
      throw error;
    }

    console.error(
      "[UPDATE_PROMOTION_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui promotion.",
    };
  }
}
