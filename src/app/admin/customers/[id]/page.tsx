import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/admin";

import CustomerDetail from "@/components/admin/customers/CustomerDetail";
import CustomerService from "@/services/customer/customer.service";

export const dynamic = "force-dynamic";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  const customer =
    await CustomerService.getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const totalOrders =
    customer.orders.length;

  const totalSpent =
    customer.orders.reduce(
      (sum, order) =>
        sum + Number(order.total),
      0,
    );

  const lastOrderAt =
    customer.orders[0]?.createdAt ?? null;

  const segment =
    CustomerService.resolveSegment({
      createdAt: customer.createdAt,
      totalOrders,
      totalSpent,
      lastOrderAt,
    });

  return (
    <CustomerDetail
      customer={customer}
      segment={segment}
    />
  );
}
