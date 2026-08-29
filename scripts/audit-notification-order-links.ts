import { prisma } from "@/lib/prisma";

async function main() {
  console.log("==============================================");
  console.log(" NOTIFICATION / ORDER LINK AUDIT");
  console.log("==============================================");

  const notifications =
    await prisma.notification.findMany({
      where: {
        type: "NEW_ORDER",
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

  const orderIds = notifications
    .map((notification) =>
      notification.href
        ? notification.href
            .split("/")
            .pop()
        : null
    )
    .filter(
      (value): value is string =>
        Boolean(value)
    );

  const orders =
    await prisma.order.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },

      select: {
        id: true,
      },
    });

  const existingOrderIds =
    new Set(
      orders.map(
        (order) => order.id
      )
    );

  const invalid =
    notifications.filter(
      (notification) => {
        const orderId =
          notification.href
            ? notification.href
                .split("/")
                .pop()
            : null;

        return (
          !orderId ||
          !existingOrderIds.has(
            orderId
          )
        );
      }
    );

  console.log("");
  console.log(
    "NEW_ORDER notifications:",
    notifications.length
  );

  console.log(
    "Order IDs found:",
    orderIds.length
  );

  console.log(
    "Orders existing:",
    existingOrderIds.size
  );

  console.log(
    "Invalid references:",
    invalid.length
  );

  console.log("");

  if (invalid.length > 0) {
    console.log(
      "INVALID NOTIFICATIONS:"
    );

    console.dir(
      invalid,
      {
        depth: null,
      }
    );
  } else {
    console.log(
      "SUCCESS: Semua NEW_ORDER memiliki Order yang valid."
    );
  }
}

main()
  .catch((error) => {
    console.error(
      "[NOTIFICATION_ORDER_AUDIT_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });