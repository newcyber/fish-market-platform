import {
  CourierAssignmentEventType,
  CourierAssignmentStatus,
  CourierFailureCode,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import StorageService from "@/services/storage/storage.service";

export type CourierDashboardStats = {
  assigned: number;
  onRoute: number;
  pickedUp: number;
  deliveredToday: number;
  failedToday: number;
  totalToday: number;
  completionRate: number;
};

export type CourierAssignmentListItem = {
  id: string;
  status: CourierAssignmentStatus;
  assignedAt: string;
  startedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureCode: CourierFailureCode | null;
  failureReason: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
    createdAt: string;
    customer: {
      name: string;
      phone: string | null;
    };
    address: {
      receiverName: string;
      receiverPhone: string;
      fullAddress: string;
      district: string;
      city: string;
      postalCode: string;
      latitude: number | null;
      longitude: number | null;
      notes: string | null;
    };
    itemsCount: number;
  };
};

export type CourierAssignmentEventItem = {
  id: string;
  type: CourierAssignmentEventType;
  fromStatus: CourierAssignmentStatus | null;
  toStatus: CourierAssignmentStatus | null;
  note: string | null;
  createdAt: string;
};

export type CourierDeliveryProofItem = {
  id: string;
  recipientName: string;
  recipientNote: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string;
  usedAt: string | null;
};

export type CourierAssignmentDetail = CourierAssignmentListItem & {
  events: CourierAssignmentEventItem[];
  deliveryProof: CourierDeliveryProofItem | null;
  order: CourierAssignmentListItem["order"] & {
    subtotal: number;
    shippingCost: number;
    notes: string | null;
    items: Array<{
      id: string;
      productName: string;
      productVariant: string | null;
      productWeight: string | null;
      quantity: number;
      price: number;
      subtotal: number;
      customerNote: string | null;
    }>;
  };
};

const ACTIVE_STATUSES: CourierAssignmentStatus[] = [
  CourierAssignmentStatus.ASSIGNED,
  CourierAssignmentStatus.ON_ROUTE,
  CourierAssignmentStatus.PICKED_UP,
];

const DEFAULT_COURIER_SLA = {
  assignmentToStartMinutes: 15,
  startToPickupMinutes: 30,
  pickupToDeliveryMinutes: 60,
  totalDeliveryMinutes: 105,
};

async function getCourierSlaSnapshot(
  tx: Prisma.TransactionClient,
) {
  const settings = await tx.courierSlaSettings.findFirst({
    where: {
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      assignmentToStartMinutes: true,
      startToPickupMinutes: true,
      pickupToDeliveryMinutes: true,
      totalDeliveryMinutes: true,
    },
  });

  const sla = settings ?? DEFAULT_COURIER_SLA;

  const values = [
    sla.assignmentToStartMinutes,
    sla.startToPickupMinutes,
    sla.pickupToDeliveryMinutes,
    sla.totalDeliveryMinutes,
  ];

  const hasInvalidValue = values.some(
    (value) => !Number.isInteger(value) || value <= 0,
  );

  if (hasInvalidValue) {
    throw new Error("INVALID_COURIER_SLA_SETTINGS");
  }

  const minimumTotal =
    sla.assignmentToStartMinutes +
    sla.startToPickupMinutes +
    sla.pickupToDeliveryMinutes;

  if (sla.totalDeliveryMinutes < minimumTotal) {
    throw new Error("INVALID_COURIER_SLA_SETTINGS");
  }

  return sla;
}

function isActiveAssignmentUniqueConflict(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  const target = Array.isArray(error.meta?.target)
    ? error.meta.target
    : [];

  return target.includes("activeAssignmentKey");
}

function getAssignmentEventType(
  status: CourierAssignmentStatus,
): CourierAssignmentEventType {
  switch (status) {
    case CourierAssignmentStatus.ASSIGNED:
      return CourierAssignmentEventType.ASSIGNED;

    case CourierAssignmentStatus.ON_ROUTE:
      return CourierAssignmentEventType.ON_ROUTE;

    case CourierAssignmentStatus.PICKED_UP:
      return CourierAssignmentEventType.PICKED_UP;

    case CourierAssignmentStatus.DELIVERED:
      return CourierAssignmentEventType.DELIVERED;

    case CourierAssignmentStatus.FAILED:
      return CourierAssignmentEventType.FAILED;

    case CourierAssignmentStatus.CANCELLED:
      return CourierAssignmentEventType.CANCELLED;

    default:
      return CourierAssignmentEventType.CANCELLED;
  }
}

function getJakartaDayRange(date = new Date()) {
  const jakartaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  return {
    start: new Date(`${jakartaDate}T00:00:00+07:00`),
    end: new Date(`${jakartaDate}T23:59:59.999+07:00`),
  };
}

/**
 * Prisma payload yang digunakan oleh serializeAssignment().
 *
 * Payload ini mengikuti query getDashboard() dan juga kompatibel
 * dengan query getAssignment() karena payload detail memiliki
 * field tambahan pada order/items.
 */
type CourierAssignmentWithListOrder =
  Prisma.CourierAssignmentGetPayload<{
    include: {
      order: {
        include: {
          user: {
            select: {
              name: true;
              phone: true;
            };
          };
          address: {
            select: {
              receiverName: true;
              receiverPhone: true;
              fullAddress: true;
              district: true;
              city: true;
              postalCode: true;
              latitude: true;
              longitude: true;
              notes: true;
            };
          };
          items: {
            select: {
              quantity: true;
            };
          };
        };
      };
    };
  }>;

function serializeAssignment(
  assignment: CourierAssignmentWithListOrder,
): CourierAssignmentListItem {
  const order = assignment.order;

  return {
    id: assignment.id,
    status: assignment.status,
    assignedAt: assignment.assignedAt.toISOString(),
    startedAt: assignment.startedAt?.toISOString() ?? null,
    pickedUpAt: assignment.pickedUpAt?.toISOString() ?? null,
    deliveredAt: assignment.deliveredAt?.toISOString() ?? null,
    failedAt: assignment.failedAt?.toISOString() ?? null,
    failureCode: assignment.failureCode ?? null,
    failureReason: assignment.failureReason ?? null,

    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),

      customer: {
        name: order.user.name,
        phone: order.user.phone ?? null,
      },

      address: {
        receiverName: order.address.receiverName,
        receiverPhone: order.address.receiverPhone,
        fullAddress: order.address.fullAddress,
        district: order.address.district,
        city: order.address.city,
        postalCode: order.address.postalCode,
        latitude:
          order.address.latitude === null
            ? null
            : Number(order.address.latitude),
        longitude:
          order.address.longitude === null
            ? null
            : Number(order.address.longitude),
        notes: order.address.notes ?? null,
      },

      itemsCount: order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
    },
  };
}

export class CourierService {
  static async getDashboard(courierId: string) {
    const { start, end } = getJakartaDayRange();

    const [
      activeAssignments,
      deliveredToday,
      failedToday,
      totalToday,
    ] = await Promise.all([
      prisma.courierAssignment.findMany({
        where: {
          courierId,
          isActive: true,
          status: {
            in: ACTIVE_STATUSES,
          },
          order: {
            deletedAt: null,
          },
        },

        orderBy: [
          {
            status: "asc",
          },
          {
            assignedAt: "asc",
          },
        ],

        include: {
          order: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },

              address: {
                select: {
                  receiverName: true,
                  receiverPhone: true,
                  fullAddress: true,
                  district: true,
                  city: true,
                  postalCode: true,
                  latitude: true,
                  longitude: true,
                  notes: true,
                },
              },

              items: {
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      }),

      prisma.courierAssignment.count({
        where: {
          courierId,
          status: CourierAssignmentStatus.DELIVERED,
          deliveredAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.courierAssignment.count({
        where: {
          courierId,
          status: CourierAssignmentStatus.FAILED,
          failedAt: {
            gte: start,
            lte: end,
          },
        },
      }),

      prisma.courierAssignment.count({
        where: {
          courierId,
          assignedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    const assigned = activeAssignments.filter(
      (item) =>
        item.status === CourierAssignmentStatus.ASSIGNED,
    ).length;

    const onRoute = activeAssignments.filter(
      (item) =>
        item.status === CourierAssignmentStatus.ON_ROUTE,
    ).length;

    const pickedUp = activeAssignments.filter(
      (item) =>
        item.status === CourierAssignmentStatus.PICKED_UP,
    ).length;

    const completionRate =
      totalToday > 0
        ? Math.round((deliveredToday / totalToday) * 100)
        : 0;

    return {
      stats: {
        assigned,
        onRoute,
        pickedUp,
        deliveredToday,
        failedToday,
        totalToday,
        completionRate,
      } satisfies CourierDashboardStats,

      assignments: activeAssignments.map(serializeAssignment),
    };
  }

  static async getHistory(
    courierId: string,
    limit = 20,
    cursor?: string,
  ) {
    const safeLimit = Math.min(
      Math.max(limit, 1),
      50,
    );

    const assignments =
      await prisma.courierAssignment.findMany({
        where: {
          courierId,
          isActive: false,
          status: {
            in: [
              CourierAssignmentStatus.DELIVERED,
              CourierAssignmentStatus.FAILED,
              CourierAssignmentStatus.CANCELLED,
            ],
          },
          order: {
            deletedAt: null,
          },
        },

        take: safeLimit + 1,

        ...(cursor
          ? {
              skip: 1,
              cursor: {
                id: cursor,
              },
            }
          : {}),

        orderBy: {
          updatedAt: "desc",
        },

        include: {
          order: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },

              address: {
                select: {
                  receiverName: true,
                  receiverPhone: true,
                  fullAddress: true,
                  district: true,
                  city: true,
                  postalCode: true,
                  latitude: true,
                  longitude: true,
                  notes: true,
                },
              },

              items: {
                select: {
                  quantity: true,
                },
              },
            },
          },
        },
      });

    const hasMore = assignments.length > safeLimit;

    const rows = hasMore
      ? assignments.slice(0, safeLimit)
      : assignments;

    return {
      items: rows.map(serializeAssignment),

      nextCursor: hasMore
        ? rows[rows.length - 1]?.id ?? null
        : null,
    };
  }

  static async getAssignment(
    courierId: string,
    assignmentId: string,
  ): Promise<CourierAssignmentDetail | null> {
    const assignment =
      await prisma.courierAssignment.findFirst({
        where: {
          id: assignmentId,
          courierId,
          order: {
            deletedAt: null,
          },
        },

        include: {
          order: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },

              address: {
                select: {
                  receiverName: true,
                  receiverPhone: true,
                  fullAddress: true,
                  district: true,
                  city: true,
                  postalCode: true,
                  latitude: true,
                  longitude: true,
                  notes: true,
                },
              },

              items: {
                select: {
                  id: true,
                  productName: true,
                  productVariant: true,
                  productWeight: true,
                  quantity: true,
                  price: true,
                  subtotal: true,
                  customerNote: true,
                },
              },
            },
          },

          events: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
              type: true,
              fromStatus: true,
              toStatus: true,
              note: true,
              createdAt: true,
            },
          },

          deliveryProof: {
            select: {
              id: true,
              recipientName: true,
              recipientNote: true,
              photoUrl: true,
              latitude: true,
              longitude: true,
              capturedAt: true,
              usedAt: true,
            },
          },
        },
      });

    if (!assignment) {
      return null;
    }

    const base = serializeAssignment(assignment);

    return {
      ...base,

      events: assignment.events.map((event) => ({
        id: event.id,
        type: event.type,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note ?? null,
        createdAt: event.createdAt.toISOString(),
      })),

      deliveryProof: assignment.deliveryProof
        ? {
            id: assignment.deliveryProof.id,
            recipientName:
              assignment.deliveryProof.recipientName,
            recipientNote:
              assignment.deliveryProof.recipientNote ?? null,
            photoUrl:
              assignment.deliveryProof.photoUrl ?? null,
            latitude:
              assignment.deliveryProof.latitude === null
                ? null
                : Number(assignment.deliveryProof.latitude),
            longitude:
              assignment.deliveryProof.longitude === null
                ? null
                : Number(assignment.deliveryProof.longitude),
            capturedAt:
              assignment.deliveryProof.capturedAt.toISOString(),
            usedAt:
              assignment.deliveryProof.usedAt?.toISOString() ??
              null,
          }
        : null,

      order: {
        ...base.order,
        subtotal: Number(assignment.order.subtotal),
        shippingCost: Number(assignment.order.shippingCost),
        notes: assignment.order.notes ?? null,

        items: assignment.order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          productVariant: item.productVariant ?? null,
          productWeight: item.productWeight ?? null,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          customerNote: item.customerNote ?? null,
        })),
      },
    };
  }

  static async transition(
    courierId: string,
    assignmentId: string,
    nextStatus: CourierAssignmentStatus,
    failureReason?: string | null,
    failureCode?: CourierFailureCode | null,
    proofId?: string | null,
  ) {
    const transitionMap: Record<
      CourierAssignmentStatus,
      CourierAssignmentStatus[]
    > = {
      ASSIGNED: [
        CourierAssignmentStatus.ON_ROUTE,
      ],

      ON_ROUTE: [
        CourierAssignmentStatus.PICKED_UP,
        CourierAssignmentStatus.FAILED,
      ],

      PICKED_UP: [
        CourierAssignmentStatus.DELIVERED,
        CourierAssignmentStatus.FAILED,
      ],

      DELIVERED: [],
      FAILED: [],
      CANCELLED: [],
    };

    return prisma.$transaction(async (tx) => {
      const current =
        await tx.courierAssignment.findFirst({
          where: {
            id: assignmentId,
            courierId,
          },
        });

      if (!current) {
        throw new Error(
          "COURIER_ASSIGNMENT_NOT_FOUND",
        );
      }

      const allowed =
        transitionMap[current.status];

      if (!allowed.includes(nextStatus)) {
        throw new Error(
          "INVALID_COURIER_STATUS_TRANSITION",
        );
      }

      if (
        nextStatus ===
          CourierAssignmentStatus.FAILED &&
        !failureReason?.trim()
      ) {
        throw new Error(
          "FAILURE_REASON_REQUIRED",
        );
      }

      if (
        nextStatus ===
          CourierAssignmentStatus.FAILED &&
        failureCode &&
        !Object.values(
          CourierFailureCode,
        ).includes(failureCode)
      ) {
        throw new Error(
          "INVALID_FAILURE_CODE",
        );
      }

      if (
        nextStatus ===
        CourierAssignmentStatus.DELIVERED
      ) {
        if (!proofId?.trim()) {
          throw new Error(
            "DELIVERY_PROOF_REQUIRED",
          );
        }

        const proof =
          await tx.courierDeliveryProof.findFirst(
            {
              where: {
                id: proofId,
                assignmentId: current.id,
                usedAt: null,
              },

              select: {
                id: true,
              },
            },
          );

        if (!proof) {
          throw new Error(
            "DELIVERY_PROOF_NOT_FOUND",
          );
        }
      }

      const now = new Date();

      const data: Prisma.CourierAssignmentUpdateManyMutationInput =
        {};

      if (
        nextStatus ===
        CourierAssignmentStatus.ON_ROUTE
      ) {
        data.startedAt = now;
      }

      if (
        nextStatus ===
        CourierAssignmentStatus.PICKED_UP
      ) {
        data.pickedUpAt = now;
      }

      if (
        nextStatus ===
        CourierAssignmentStatus.DELIVERED
      ) {
        data.deliveredAt = now;
        data.isActive = false;
      }

      if (
        nextStatus ===
        CourierAssignmentStatus.FAILED
      ) {
        data.failedAt = now;
        data.failureCode =
          failureCode ??
          CourierFailureCode.OTHER;
        data.failureReason =
          failureReason?.trim();
        data.isActive = false;
      }

      /**
       * Optimistic concurrency guard:
       *
       * Update hanya boleh terjadi apabila:
       * - assignment masih dimiliki courier yang sama
       * - status masih sama dengan status yang kita baca
       * - active state masih sama
       *
       * Ini mencegah double-click / duplicate request
       * mengubah lifecycle dua kali.
       */
      const result =
        await tx.courierAssignment.updateMany({
          where: {
            id: assignmentId,
            courierId,
            status: current.status,
            isActive: current.isActive,
          },

          data: {
            status: nextStatus,
            ...data,

            ...(nextStatus ===
              CourierAssignmentStatus.DELIVERED ||
            nextStatus ===
              CourierAssignmentStatus.FAILED
              ? {
                  activeAssignmentKey: null,
                }
              : {}),
          },
        });

      if (result.count !== 1) {
        throw new Error(
          "COURIER_ASSIGNMENT_CONFLICT",
        );
      }

      if (
        nextStatus ===
          CourierAssignmentStatus.DELIVERED &&
        proofId
      ) {
        const proofUsed =
          await tx.courierDeliveryProof.updateMany(
            {
              where: {
                id: proofId,
                assignmentId: current.id,
                usedAt: null,
              },

              data: {
                usedAt: now,
              },
            },
          );

        if (proofUsed.count !== 1) {
          throw new Error(
            "DELIVERY_PROOF_CONFLICT",
          );
        }
      }

      await tx.courierAssignmentEvent.create({
        data: {
          assignmentId: current.id,
          actorId: courierId,
          type: getAssignmentEventType(
            nextStatus,
          ),
          fromStatus: current.status,
          toStatus: nextStatus,

          note:
            nextStatus ===
            CourierAssignmentStatus.FAILED
              ? `${failureCode ?? CourierFailureCode.OTHER}: ${failureReason?.trim()}`
              : null,
        },
      });

      if (
        nextStatus ===
        CourierAssignmentStatus.DELIVERED
      ) {
        await tx.order.update({
          where: {
            id: current.orderId,
          },

          data: {
            status: OrderStatus.COMPLETED,
            completedAt: now,
          },
        });
      } else if (
        nextStatus ===
        CourierAssignmentStatus.ON_ROUTE
      ) {
        await tx.order.updateMany({
          where: {
            id: current.orderId,
            status: {
              in: [
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPING,
              ],
            },
          },

          data: {
            status: OrderStatus.SHIPPING,
            shippedAt: now,
          },
        });
      } else if (
        nextStatus ===
        CourierAssignmentStatus.PICKED_UP
      ) {
        await tx.order.updateMany({
          where: {
            id: current.orderId,
            status: {
              in: [
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPING,
              ],
            },
          },

          data: {
            status: OrderStatus.SHIPPING,
          },
        });
      }

      return tx.courierAssignment.findUnique({
        where: {
          id: assignmentId,
        },

        select: {
          id: true,
          status: true,
          isActive: true,
          deliveredAt: true,
          failedAt: true,
        },
      });
    });
  }

  static async assignOrder(
    adminId: string,
    orderId: string,
    courierId: string,
  ) {
    if (!orderId || !courierId) {
      throw new Error(
        "INVALID_ASSIGNMENT_INPUT",
      );
    }

    return prisma.$transaction(async (tx) => {
      const [order, courier] =
        await Promise.all([
          tx.order.findFirst({
            where: {
              id: orderId,
              deletedAt: null,
            },

            select: {
              id: true,
              status: true,
              paymentStatus: true,
            },
          }),

          tx.user.findFirst({
            where: {
              id: courierId,
              role: "COURIER",
              isActive: true,
              deletedAt: null,
            },

            select: {
              id: true,
              name: true,
            },
          }),
        ]);

      if (!order) {
        throw new Error(
          "ORDER_NOT_FOUND",
        );
      }

      if (!courier) {
        throw new Error(
          "COURIER_NOT_FOUND",
        );
      }

      if (
        order.paymentStatus !==
        PaymentStatus.VERIFIED
      ) {
        throw new Error(
          "ORDER_PAYMENT_NOT_VERIFIED",
        );
      }

      const isReadyForCourier =
        order.status ===
          OrderStatus.PROCESSING ||
        order.status ===
          OrderStatus.SHIPPING;

      if (!isReadyForCourier) {
        throw new Error(
          "ORDER_NOT_READY_FOR_COURIER",
        );
      }

      const active =
        await tx.courierAssignment.findFirst({
          where: {
            orderId,
            isActive: true,
          },

          select: {
            id: true,
          },
        });

      if (active) {
        throw new Error(
          "ORDER_ALREADY_ASSIGNED",
        );
      }

      const sla =
        await getCourierSlaSnapshot(tx);

      let assignment;

      try {
        assignment =
          await tx.courierAssignment.create({
            data: {
              orderId,
              courierId,
              assignedById: adminId,
              status:
                CourierAssignmentStatus.ASSIGNED,

              slaAssignmentToStartMinutes:
                sla.assignmentToStartMinutes,

              slaStartToPickupMinutes:
                sla.startToPickupMinutes,

              slaPickupToDeliveryMinutes:
                sla.pickupToDeliveryMinutes,

              slaTotalDeliveryMinutes:
                sla.totalDeliveryMinutes,

              isActive: true,
              activeAssignmentKey: orderId,
            },
          });
      } catch (error) {
        if (
          isActiveAssignmentUniqueConflict(
            error,
          )
        ) {
          throw new Error(
            "ORDER_ALREADY_ASSIGNED",
          );
        }

        throw error;
      }

      await tx.courierAssignmentEvent.create({
        data: {
          assignmentId: assignment.id,
          actorId: adminId,
          type: CourierAssignmentEventType.ASSIGNED,
          toStatus:
            CourierAssignmentStatus.ASSIGNED,
          note: `Ditugaskan kepada ${courier.name}.`,
        },
      });

      await tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: OrderStatus.SHIPPING,
        },
      });

      return assignment;
    });
  }

  static async getAssignableOrders(
    limit = 50,
  ) {
    return prisma.order.findMany({
      where: {
        deletedAt: null,

        paymentStatus:
          PaymentStatus.VERIFIED,

        status: {
          in: [
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPING,
          ],
        },

        courierAssignments: {
          none: {
            isActive: true,
          },
        },
      },

      select: {
        id: true,
        orderNumber: true,
        total: true,
        createdAt: true,

        user: {
          select: {
            name: true,
            phone: true,
          },
        },

        address: {
          select: {
            receiverName: true,
            city: true,
            district: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },

      take: Math.min(
        Math.max(limit, 1),
        100,
      ),
    });
  }

  static async getActiveAssignments() {
    const assignments =
      await prisma.courierAssignment.findMany({
        where: {
          isActive: true,

          status: {
            in: ACTIVE_STATUSES,
          },

          order: {
            deletedAt: null,
          },
        },

        select: {
          id: true,
          status: true,
          assignedAt: true,
          courierId: true,
          orderId: true,

          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,

              address: {
                select: {
                  receiverName: true,
                  city: true,
                  district: true,
                },
              },
            },
          },
        },

        orderBy: {
          assignedAt: "asc",
        },
      });

    const courierIds = [
      ...new Set(
        assignments.map(
          (assignment) =>
            assignment.courierId,
        ),
      ),
    ];

    const couriers =
      await prisma.user.findMany({
        where: {
          id: {
            in: courierIds,
          },

          role: "COURIER",
          isActive: true,
          deletedAt: null,
        },

        select: {
          id: true,
          name: true,
          phone: true,
        },
      });

    const courierMap = new Map(
      couriers.map((courier) => [
        courier.id,
        courier,
      ]),
    );

    return assignments.flatMap(
      (assignment) => {
        const courier = courierMap.get(
          assignment.courierId,
        );

        if (!courier) {
          return [];
        }

        return [
          {
            ...assignment,
            courier,
          },
        ];
      },
    );
  }

  static async getDeliveryAttention(
    limit = 50,
  ) {
    const safeLimit = Math.min(
      Math.max(limit, 1),
      100,
    );

    const assignments =
      await prisma.courierAssignment.findMany({
        where: {
          status:
            CourierAssignmentStatus.FAILED,

          order: {
            deletedAt: null,
          },
        },

        select: {
          id: true,
          orderId: true,
          courierId: true,
          status: true,
          failedAt: true,
          failureCode: true,
          failureReason: true,

          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,

              address: {
                select: {
                  receiverName: true,
                  receiverPhone: true,
                  city: true,
                  district: true,
                },
              },
            },
          },
        },

        orderBy: {
          failedAt: "desc",
        },

        take: safeLimit,
      });

    const courierIds = [
      ...new Set(
        assignments.map(
          (assignment) =>
            assignment.courierId,
        ),
      ),
    ];

    const couriers =
      await prisma.user.findMany({
        where: {
          id: {
            in: courierIds,
          },
        },

        select: {
          id: true,
          name: true,
          phone: true,
        },
      });

    const courierMap = new Map(
      couriers.map((courier) => [
        courier.id,
        courier,
      ]),
    );

    return assignments.flatMap(
      (assignment) => {
        const courier = courierMap.get(
          assignment.courierId,
        );

        if (!courier) {
          return [];
        }

        return [
          {
            ...assignment,
            total: Number(
              assignment.order.total,
            ),
            failedAt:
              assignment.failedAt?.toISOString() ??
              null,
            courier,
          },
        ];
      },
    );
  }

  static async retryFailedAssignment(
    adminId: string,
    failedAssignmentId: string,
    courierId: string,
  ) {
    if (
      !adminId ||
      !failedAssignmentId ||
      !courierId
    ) {
      throw new Error(
        "INVALID_RETRY_INPUT",
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const [
          failedAssignment,
          courier,
        ] = await Promise.all([
          tx.courierAssignment.findFirst({
            where: {
              id: failedAssignmentId,
              status:
                CourierAssignmentStatus.FAILED,
              isActive: false,
            },

            select: {
              id: true,
              orderId: true,
              courierId: true,
              failureCode: true,
              failureReason: true,
            },
          }),

          tx.user.findFirst({
            where: {
              id: courierId,
              role: "COURIER",
              isActive: true,
              deletedAt: null,
            },

            select: {
              id: true,
              name: true,
            },
          }),
        ]);

        if (!failedAssignment) {
          throw new Error(
            "FAILED_ASSIGNMENT_NOT_FOUND",
          );
        }

        if (!courier) {
          throw new Error(
            "COURIER_NOT_FOUND",
          );
        }

        const order =
          await tx.order.findFirst({
            where: {
              id: failedAssignment.orderId,
              deletedAt: null,
            },

            select: {
              id: true,
              status: true,
              paymentStatus: true,
            },
          });

        if (!order) {
          throw new Error(
            "ORDER_NOT_FOUND",
          );
        }

        if (
          order.paymentStatus !==
          PaymentStatus.VERIFIED
        ) {
          throw new Error(
            "ORDER_PAYMENT_NOT_VERIFIED",
          );
        }

        if (
          order.status !==
            OrderStatus.PROCESSING &&
          order.status !==
            OrderStatus.SHIPPING
        ) {
          throw new Error(
            "ORDER_NOT_READY_FOR_RETRY",
          );
        }

        const activeAssignment =
          await tx.courierAssignment.findFirst({
            where: {
              orderId: order.id,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

        if (activeAssignment) {
          throw new Error(
            "ORDER_ALREADY_ASSIGNED",
          );
        }

        const sla =
          await getCourierSlaSnapshot(tx);

        let replacement;

        try {
          replacement =
            await tx.courierAssignment.create({
              data: {
                orderId: order.id,
                courierId: courier.id,
                assignedById: adminId,
                status:
                  CourierAssignmentStatus.ASSIGNED,

                slaAssignmentToStartMinutes:
                  sla.assignmentToStartMinutes,

                slaStartToPickupMinutes:
                  sla.startToPickupMinutes,

                slaPickupToDeliveryMinutes:
                  sla.pickupToDeliveryMinutes,

                slaTotalDeliveryMinutes:
                  sla.totalDeliveryMinutes,

                isActive: true,
                activeAssignmentKey:
                  order.id,
              },
            });
        } catch (error) {
          if (
            isActiveAssignmentUniqueConflict(
              error,
            )
          ) {
            throw new Error(
              "ORDER_ALREADY_ASSIGNED",
            );
          }

          throw error;
        }

        await tx.courierAssignmentEvent.create({
          data: {
            assignmentId:
              failedAssignment.id,
            actorId: adminId,
            type:
              CourierAssignmentEventType.REASSIGNED,
            fromStatus:
              CourierAssignmentStatus.FAILED,
            toStatus:
              CourierAssignmentStatus.FAILED,
            note: `Pengantaran diulang kepada ${courier.name}.`,
          },
        });

        await tx.courierAssignmentEvent.create({
          data: {
            assignmentId:
              replacement.id,
            actorId: adminId,
            type:
              CourierAssignmentEventType.REASSIGNED,
            toStatus:
              CourierAssignmentStatus.ASSIGNED,
            note:
              "Percobaan pengantaran baru setelah kegagalan sebelumnya.",
          },
        });

        await tx.order.update({
          where: {
            id: order.id,
          },

          data: {
            status: OrderStatus.SHIPPING,
          },
        });

        return replacement;
      },
    );
  }

  static async reassignOrder(
    adminId: string,
    assignmentId: string,
    courierId: string,
  ) {
    if (
      !assignmentId ||
      !courierId ||
      !adminId
    ) {
      throw new Error(
        "INVALID_REASSIGNMENT_INPUT",
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const [current, courier] =
          await Promise.all([
            tx.courierAssignment.findFirst({
              where: {
                id: assignmentId,
                isActive: true,
              },

              select: {
                id: true,
                orderId: true,
                courierId: true,
                status: true,
              },
            }),

            tx.user.findFirst({
              where: {
                id: courierId,
                role: "COURIER",
                isActive: true,
                deletedAt: null,
              },

              select: {
                id: true,
                name: true,
              },
            }),
          ]);

        if (!current) {
          throw new Error(
            "COURIER_ASSIGNMENT_NOT_FOUND",
          );
        }

        if (!courier) {
          throw new Error(
            "COURIER_NOT_FOUND",
          );
        }

        if (
          current.courierId === courierId
        ) {
          throw new Error(
            "COURIER_ALREADY_ASSIGNED",
          );
        }

        if (
          current.status !==
          CourierAssignmentStatus.ASSIGNED
        ) {
          throw new Error(
            "REASSIGNMENT_NOT_ALLOWED",
          );
        }

        const existingTarget =
          await tx.courierAssignment.findFirst(
            {
              where: {
                orderId: current.orderId,
                isActive: true,
                id: {
                  not: current.id,
                },
              },

              select: {
                id: true,
              },
            },
          );

        if (existingTarget) {
          throw new Error(
            "ORDER_ALREADY_ASSIGNED",
          );
        }

        /**
         * Close the old assignment first so
         * activeAssignmentKey can be reused safely.
         */
        const closed =
          await tx.courierAssignment.updateMany(
            {
              where: {
                id: current.id,
                isActive: true,
                status:
                  CourierAssignmentStatus.ASSIGNED,
              },

              data: {
                status:
                  CourierAssignmentStatus.CANCELLED,
                isActive: false,
                activeAssignmentKey: null,
              },
            },
          );

        if (closed.count !== 1) {
          throw new Error(
            "COURIER_ASSIGNMENT_CONFLICT",
          );
        }

        await tx.courierAssignmentEvent.create({
          data: {
            assignmentId: current.id,
            actorId: adminId,
            type:
              CourierAssignmentEventType.CANCELLED,
            fromStatus:
              CourierAssignmentStatus.ASSIGNED,
            toStatus:
              CourierAssignmentStatus.CANCELLED,
            note:
              "Assignment dialihkan ke kurir baru.",
          },
        });

        const sla =
          await getCourierSlaSnapshot(tx);

        let replacement;

        try {
          replacement =
            await tx.courierAssignment.create({
              data: {
                orderId: current.orderId,
                courierId,
                assignedById: adminId,
                status:
                  CourierAssignmentStatus.ASSIGNED,

                slaAssignmentToStartMinutes:
                  sla.assignmentToStartMinutes,

                slaStartToPickupMinutes:
                  sla.startToPickupMinutes,

                slaPickupToDeliveryMinutes:
                  sla.pickupToDeliveryMinutes,

                slaTotalDeliveryMinutes:
                  sla.totalDeliveryMinutes,

                isActive: true,
                activeAssignmentKey:
                  current.orderId,
              },
            });
        } catch (error) {
          if (
            isActiveAssignmentUniqueConflict(
              error,
            )
          ) {
            throw new Error(
              "COURIER_ASSIGNMENT_CONFLICT",
            );
          }

          throw error;
        }

        await tx.courierAssignmentEvent.create({
          data: {
            assignmentId: replacement.id,
            actorId: adminId,
            type:
              CourierAssignmentEventType.REASSIGNED,
            toStatus:
              CourierAssignmentStatus.ASSIGNED,
            note:
              "Menggantikan assignment courier sebelumnya.",
          },
        });

        return replacement;
      },
    );
  }

  static async createDeliveryProof(
    courierId: string,
    assignmentId: string,
    input: {
      recipientName: string;
      recipientNote?: string | null;
      photo?: File | null;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
    const recipientName =
      input.recipientName.trim();

    if (!recipientName) {
      throw new Error(
        "RECIPIENT_NAME_REQUIRED",
      );
    }

    if (
      input.recipientNote &&
      input.recipientNote.length > 1000
    ) {
      throw new Error(
        "RECIPIENT_NOTE_TOO_LONG",
      );
    }

    if (
      input.latitude !== null &&
      input.latitude !== undefined &&
      (input.latitude < -90 ||
        input.latitude > 90)
    ) {
      throw new Error(
        "INVALID_PROOF_LOCATION",
      );
    }

    if (
      input.longitude !== null &&
      input.longitude !== undefined &&
      (input.longitude < -180 ||
        input.longitude > 180)
    ) {
      throw new Error(
        "INVALID_PROOF_LOCATION",
      );
    }

    const assignment =
      await prisma.courierAssignment.findFirst({
        where: {
          id: assignmentId,
          courierId,
          isActive: true,
          status:
            CourierAssignmentStatus.PICKED_UP,
        },

        select: {
          id: true,
        },
      });

    if (!assignment) {
      throw new Error(
        "DELIVERY_PROOF_NOT_ALLOWED",
      );
    }

    const existing =
      await prisma.courierDeliveryProof.findUnique(
        {
          where: {
            assignmentId,
          },

          select: {
            id: true,
            photoUrl: true,
            usedAt: true,
          },
        },
      );

    if (existing?.usedAt) {
      throw new Error(
        "DELIVERY_PROOF_ALREADY_USED",
      );
    }

    const photoUrl = input.photo
      ? await StorageService.saveCourierDeliveryProof(
          input.photo,
        )
      : existing?.photoUrl ?? null;

    try {
      const proof =
        await prisma.courierDeliveryProof.upsert(
          {
            where: {
              assignmentId,
            },

            create: {
              assignmentId,
              recipientName,
              recipientNote:
                input.recipientNote?.trim() ||
                null,
              photoUrl,
              latitude:
                input.latitude ?? null,
              longitude:
                input.longitude ?? null,
              createdById: courierId,
            },

            update: {
              recipientName,
              recipientNote:
                input.recipientNote?.trim() ||
                null,
              photoUrl,
              latitude:
                input.latitude ?? null,
              longitude:
                input.longitude ?? null,
              createdById: courierId,
              capturedAt: new Date(),
            },
          },
        );

      if (
        input.photo &&
        existing?.photoUrl &&
        existing.photoUrl !== photoUrl
      ) {
        await StorageService.deleteCourierDeliveryProof(
          existing.photoUrl,
        );
      }

      return {
        id: proof.id,
        recipientName:
          proof.recipientName,
        recipientNote:
          proof.recipientNote,
        photoUrl: proof.photoUrl,

        latitude:
          proof.latitude === null
            ? null
            : Number(proof.latitude),

        longitude:
          proof.longitude === null
            ? null
            : Number(proof.longitude),

        capturedAt:
          proof.capturedAt.toISOString(),
      };
    } catch (error) {
      if (
        input.photo &&
        photoUrl &&
        photoUrl !== existing?.photoUrl
      ) {
        await StorageService.deleteCourierDeliveryProof(
          photoUrl,
        );
      }

      throw error;
    }
  }

  static async getCouriers() {
    return prisma.user.findMany({
      where: {
        role: "COURIER",
        isActive: true,
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },

      orderBy: {
        name: "asc",
      },
    });
  }
}