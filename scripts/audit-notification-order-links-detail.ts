import { prisma } from "@/lib/prisma";

async function main() {
  console.log("==============================================");
  console.log(" NOTIFICATION / ORDER DETAIL AUDIT");
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
        title: true,
        message: true,
        href: true,
        isRead: true,
        createdAt: true,
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
        orderNumber: true,
        userId: true,
        status: true,
        createdAt: true,
      },
    });

  const orderMap =
    new Map(
      orders.map((order) => [
        order.id,
        order,
      ])
    );

  console.log("");

  for (
    const notification of notifications
  ) {
    const orderId =
      notification.href
        ? notification.href
            .split("/")
            .pop()
        : null;

    const order =
      orderId
        ? orderMap.get(orderId)
        : undefined;

    console.log("----------------------------------------------");

    console.log(
      "Notification:",
      notification.id
    );

    console.log(
      "Notification user:",
      notification.userId
    );

    console.log(
      "Current orderId:",
      notification.orderId
    );

    console.log(
      "Order ID from href:",
      orderId
    );

    if (order) {
      console.log(
        "ORDER:",
        order.orderNumber
      );

      console.log(
        "Order user:",
        order.userId
      );

      console.log(
        "Order status:",
        order.status
      );

      console.log(
        "Order created:",
        order.createdAt
      );

      console.log(
        "REFERENCE: VALID"
      );
    } else {
      console.log(
        "ORDER: NOT FOUND"
      );

      console.log(
        "REFERENCE: INVALID"
      );
    }
  }

  console.log("");
  console.log("==============================================");
  console.log(" SUMMARY");
  console.log("==============================================");

  console.log(
    "Notifications:",
    notifications.length
  );

  console.log(
    "Existing orders:",
    orders.length
  );

  console.log(
    "Missing orders:",
    notifications.length -
      orders.length
  );
}

main()
  .catch((error) => {
    console.error(
      "[NOTIFICATION_ORDER_DETAIL_AUDIT_ERROR]",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });