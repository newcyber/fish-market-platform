import { prisma } from "@/lib/prisma";

async function main() {
  console.log("==============================================");
  console.log(" BACKFILL NOTIFICATION ORDER ID");
  console.log("==============================================");

  const notifications =
    await prisma.notification.findMany({
      where: {
        type: "NEW_ORDER",
        orderId: null,
      },

      select: {
        id: true,
        userId: true,
        orderId: true,
        href: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  console.log("");
  console.log(
    "Candidates:",
    notifications.length
  );

  const updates: Array<{
    notificationId: string;
    orderId: string;
  }> = [];

  const skipped: Array<{
    notificationId: string;
    href: string | null;
    reason: string;
  }> = [];

  for (
    const notification of notifications
  ) {
    const orderId =
      notification.href
        ? notification.href
            .split("/")
            .pop()
        : null;

    if (!orderId) {
      skipped.push({
        notificationId:
          notification.id,

        href:
          notification.href,

        reason:
          "Order ID tidak ditemukan dari href.",
      });

      continue;
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        select: {
          id: true,
        },
      });

    if (!order) {
      skipped.push({
        notificationId:
          notification.id,

        href:
          notification.href,

        reason:
          "Order tidak ditemukan.",
      });

      continue;
    }

    updates.push({
      notificationId:
        notification.id,

      orderId:
        order.id,
    });
  }

  console.log(
    "Will update:",
    updates.length
  );

  console.log(
    "Will skip:",
    skipped.length
  );

  if (skipped.length > 0) {
    console.log("");
    console.log("SKIPPED:");

    console.dir(
      skipped,
      {
        depth: null,
      }
    );
  }

  if (updates.length === 0) {
    console.log("");
    console.log(
      "Tidak ada notification yang perlu di-update."
    );

    return;
  }

  console.log("");
  console.log("UPDATES:");

  console.dir(
    updates,
    {
      depth: null,
    }
  );

  await prisma.$transaction(
    async (tx) => {
      for (const update of updates) {
        await tx.notification.update({
          where: {
            id:
              update.notificationId,
          },

          data: {
            orderId:
              update.orderId,
          },
        });
      }
    }
  );

  console.log("");
  console.log(
    "SUCCESS:",
    updates.length,
    "notification berhasil di-backfill."
  );
}

main()
  .catch((error) => {
    console.error(
      "[BACKFILL_NOTIFICATION_ORDER_ID_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });