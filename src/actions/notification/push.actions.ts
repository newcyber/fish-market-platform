"use server";

import { auth } from "@/auth";

import pushSubscriptionRepository from "@/repositories/notification/push-subscription.repository";

/**
 * ============================================================
 * PUSH NOTIFICATION ACTIONS
 * ============================================================
 *
 * Server Actions untuk mengelola Web Push subscription.
 *
 * SECURITY:
 *
 * userId TIDAK pernah diterima dari browser.
 *
 * userId selalu berasal dari:
 *
 *   auth()
 *      ↓
 *   session.user.id
 *
 * ============================================================
 */

export interface RegisterPushSubscriptionInput {
  endpoint: string;

  keys: {
    p256dh: string;

    auth: string;
  };

  userAgent?: string | null;
}

export interface PushSubscriptionActionResult {
  success: boolean;

  message: string;
}

/**
 * ============================================================
 * REGISTER PUSH SUBSCRIPTION
 * ============================================================
 */

export async function registerPushSubscriptionAction(
  input: RegisterPushSubscriptionInput
): Promise<PushSubscriptionActionResult> {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    const session = await auth();

    const userId =
      session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    /**
     * --------------------------------------------------------
     * VALIDATION
     * --------------------------------------------------------
     */

    const endpoint =
      input?.endpoint?.trim();

    const p256dh =
      input?.keys?.p256dh?.trim();

    const authKey =
      input?.keys?.auth?.trim();

    if (
      !endpoint ||
      !p256dh ||
      !authKey
    ) {
      return {
        success: false,
        message:
          "Data push subscription tidak valid.",
      };
    }

    /**
     * --------------------------------------------------------
     * UPSERT
     * --------------------------------------------------------
     *
     * userId berasal dari session.
     *
     * Browser tidak dapat menentukan pemilik subscription.
     */

    await pushSubscriptionRepository.upsert({
      userId,

      endpoint,

      p256dh,

      auth: authKey,

      userAgent:
        input.userAgent?.trim() ||
        null,
    });

    return {
      success: true,
      message:
        "Push notification berhasil diaktifkan.",
    };
  } catch (error) {
    console.error(
      "[REGISTER_PUSH_SUBSCRIPTION_ACTION]",
      error
    );

    return {
      success: false,
      message:
        "Gagal mengaktifkan push notification.",
    };
  }
}

/**
 * ============================================================
 * REMOVE PUSH SUBSCRIPTION
 * ============================================================
 */

export async function removePushSubscriptionAction(
  endpoint: string
): Promise<PushSubscriptionActionResult> {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    const session = await auth();

    const userId =
      session?.user?.id;

    if (!userId) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    /**
     * --------------------------------------------------------
     * VALIDATION
     * --------------------------------------------------------
     */

    const normalizedEndpoint =
      endpoint?.trim();

    if (!normalizedEndpoint) {
      return {
        success: false,
        message:
          "Endpoint push subscription tidak valid.",
      };
    }

    /**
     * --------------------------------------------------------
     * DELETE
     * --------------------------------------------------------
     *
     * userId + endpoint digunakan sebagai authorization
     * scope.
     */

    await pushSubscriptionRepository.deleteByEndpoint(
      userId,
      normalizedEndpoint
    );

    return {
      success: true,
      message:
        "Push notification berhasil dinonaktifkan.",
    };
  } catch (error) {
    console.error(
      "[REMOVE_PUSH_SUBSCRIPTION_ACTION]",
      error
    );

    return {
      success: false,
      message:
        "Gagal menonaktifkan push notification.",
    };
  }
}

/**
 * ============================================================
 * GET PUSH SUBSCRIPTION STATUS
 * ============================================================
 */

export async function getPushSubscriptionStatusAction() {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    const session = await auth();

    const userId =
      session?.user?.id;

    if (!userId) {
      return {
        success: false,
        subscribed: false,
        count: 0,
      };
    }

    /**
     * --------------------------------------------------------
     * COUNT USER SUBSCRIPTIONS
     * --------------------------------------------------------
     */

    const count =
      await pushSubscriptionRepository.countByUserId(
        userId
      );

    return {
      success: true,

      subscribed:
        count > 0,

      count,
    };
  } catch (error) {
    console.error(
      "[GET_PUSH_SUBSCRIPTION_STATUS_ACTION]",
      error
    );

    return {
      success: false,
      subscribed: false,
      count: 0,
    };
  }
}
