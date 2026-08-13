import Link from "next/link";

import {
  ArrowLeft,
} from "lucide-react";

import {
  Role,
} from "@prisma/client";

import CreateOrderForm from "@/components/admin/orders/CreateOrderForm";

import CustomerService from "@/services/customer/customer.service";

import ProductService from "@/services/product/product.service";

export const dynamic =
  "force-dynamic";

export default async function CreateOrderPage() {
  const [
    customers,
    products,
  ] = await Promise.all([
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

  const customerOptions =
  customers.map((customer) => ({
    id: customer.id,

    name: customer.name,

    email: customer.email,

    addresses:
      customer.addresses.map(
        (address) => ({
          id: address.id,

          label:
            address.label,

          name:
            address.receiverName,

          address:
            address.fullAddress,

          city:
            address.city,

          province:
            address.province,

          postalCode:
            address.postalCode,

          phone:
            address.receiverPhone,
        })
      ),
  }));

const productOptions =
  products.map((product) => ({
    id: product.id,

    name: product.name,

    sku: product.sku,

    price:
      Number(product.price),

    stock:
      product.stock,

    unit:
      product.unit,
  }));

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Order
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold">
            Buat Order
          </h1>

          <p className="mt-1 text-muted-foreground">
            Buat order baru untuk customer.
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* FORM */}
      {/* ================================================== */}

      <CreateOrderForm
        customers={customerOptions}
        products={productOptions}
      />
    </div>
  );
}