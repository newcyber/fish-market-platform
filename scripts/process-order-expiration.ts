import OrderExpirationService from "@/services/order/order-expiration.service";

/**
 * ============================================================
 * ORDER EXPIRATION WORKER
 * ============================================================
 *
 * Worker ini dijalankan secara periodik oleh system cron.
 *
 * Tanggung jawab:
 *
 * ORDER WAITING_PAYMENT
 *      ↓
 * payment timeout tercapai
 *      ↓
 * OrderExpirationService.expirePendingOrders()
 *      ↓
 * OrderService.cancelOrder()
 *
 * Worker TIDAK menentukan payment timeout.
 *
 * Payment timeout berasal dari:
 *
 * StoreSettings.paymentTimeoutHours
 *
 * melalui:
 *
 * OrderExpirationService.getPaymentTimeoutHours()
 *
 * Semua business rule cancellation tetap berada di:
 *
 * OrderExpirationService
 * OrderService
 *
 * ============================================================
 */

async function main() {
  const now =
    new Date();

  console.log(
    "[ORDER_EXPIRATION] Worker started.",
    {
      now:
        now.toISOString(),
    }
  );

  try {
    const result =
      await OrderExpirationService.expirePendingOrders();

    console.log(
      "[ORDER_EXPIRATION] Worker finished.",
      result
    );
  } catch (error) {
    console.error(
      "[ORDER_EXPIRATION] Worker failed.",
      error
    );

    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(
      "[ORDER_EXPIRATION] Unhandled worker error.",
      error
    );

    process.exitCode = 1;
  });
