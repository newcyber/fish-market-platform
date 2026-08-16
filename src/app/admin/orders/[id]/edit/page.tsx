import Link from "next/link";

import {
  ArrowLeft,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import {
  Role,
} from "@prisma/client";

import OrderService from "@/services/order/order.service";

import CustomerService from "@/services/customer/customer.service";

import ProductService from "@/services/product/product.service";

import EditOrderForm from "@/components/admin/orders/EditOrderForm";

export const dynamic =
  "force-dynamic";

interface EditOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOrderPage({
  params,
}: EditOrderPageProps) {
  const { id } =
    await params;

  const [
    order,
    customers,
    products,
  ] = await Promise.all([
    OrderService.getOrderById(id),

    CustomerService.getCustomers({
      role: Role.CUSTOMER,

      isActive: true,

      take: 100,

      orderBy: "name",

      order: "asc",
    }),

    ProductService.getProducts({
      published: true,
    }),
  ]);

  if (!order) {
    notFound();
  }

  if (
    order.status !==
    "PENDING"
  ) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Order
          </Link>
        </div>

        <div className="rounded-xl border bg-background p-6">
          <h1 className="text-2xl font-bold">
            Order Tidak Dapat Diedit
          </h1>

          <p className="mt-2 text-muted-foreground">
            Order hanya dapat diedit ketika
            statusnya masih PENDING.
          </p>
        </div>
      </div>
    );
  }

  const customerOptions =
    customers.map(
      (customer) => ({
        id: customer.id,

        name: customer.name,

        email: customer.email,

        addresses:
          customer.addresses,
      })
    );

  const productOptions =
    products.map(
      (product) => ({
        id: product.id,

        name: product.name,

        sku: product.sku,

        price: Number(
          product.price
        ),

        stock: product.stock,

      })
    );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Order
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold">
            Edit Order
          </h1>

          <p className="mt-1 text-muted-foreground">
            Perbarui isi order{" "}
            <span className="font-medium">
              {order.orderNumber}
            </span>
            .
          </p>
        </div>
      </div>

      <EditOrderForm
        order={{
          id: order.id,

          userId:
            order.userId,

          addressId:
            order.addressId,

          shippingCost:
            Number(
              order.shippingCost
            ),

          notes:
            order.notes ?? "",

          items:
            order.items.map(
              (item) => ({
                productId:
                  item.productId,

                quantity:
                  item.quantity,
              })
            ),
        }}
        customers={
          customerOptions
        }
        products={
          productOptions
        }
      />
    </div>
  );
}