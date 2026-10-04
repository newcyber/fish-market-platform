import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { CourierService } from "@/services/courier/courier.service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Anda harus login." },
      { status: 401 },
    );
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Akses admin diperlukan." },
      { status: 403 },
    );
  }

  const [orders, couriers, activeAssignments] = await Promise.all([
    CourierService.getAssignableOrders(),
    CourierService.getCouriers(),
    CourierService.getActiveAssignments(),
  ]);

  return NextResponse.json({
    data: {
      orders: orders.map((order) => ({
        ...order,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
      })),
      couriers,
      activeAssignments: activeAssignments.map((assignment) => ({
        ...assignment,
        assignedAt: assignment.assignedAt.toISOString(),
        order: { ...assignment.order, total: Number(assignment.order.total) },
      })),
    },
  });
}
