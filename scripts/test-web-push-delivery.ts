import { prisma } from "@/lib/prisma";

import pushDeliveryService from "@/services/notification/push/push-delivery.service";

async function main() {
  console.log("==============================================");
  console.log(" WEB PUSH DELIVERY TEST");
  console.log("==============================================");

  const subscription =
    await prisma.pushSubscription.findFirst({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        userId: true,
        endpoint: true,
      },
    });

  if (!subscription) {
    throw new Error(
      "Tidak ada PushSubscription di database."
    );
  }

  console.log("");
  console.log("User ID:");
  console.log(subscription.userId);

  console.log("");
  console.log("Endpoint:");
  console.log(
    `${subscription.endpoint.slice(0, 80)}...`
  );

  console.log("");
  console.log("Mengirim test notification...");

  const notificationId =
    `test-web-push-${Date.now()}`;

  const result =
    await pushDeliveryService.deliver({
      notifications: [
        {
          userId:
            subscription.userId,

          notificationId,

          title:
            "Test Web Push",

          message:
            "Web Push Pisjo Market berhasil dikirim dari server.",

          href:
            "/admin",

          type:
            "SYSTEM",

          createdAt:
            new Date(),
        },
      ],
    });

  console.log("");
  console.log("==============================================");
  console.log(" RESULT");
  console.log("==============================================");

  console.dir(
    result,
    {
      depth: null,
    }
  );

  console.log("");

  if (result.sent > 0) {
    console.log(
      "SUCCESS: Web Push berhasil dikirim."
    );
  } else if (result.removed > 0) {
    console.log(
      "WARNING: Subscription sudah tidak valid dan telah dihapus."
    );
  } else if (result.failed > 0) {
    console.log(
      "ERROR: Web Push gagal dikirim."
    );
  } else {
    console.log(
      "WARNING: Tidak ada subscription yang berhasil dikirimi."
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      "[TEST_WEB_PUSH_DELIVERY_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
