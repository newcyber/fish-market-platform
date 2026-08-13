import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProductForm from "@/components/admin/products/ProductForm";

import {
  createProductAction,
} from "@/actions/product/create-product";

export const dynamic = "force-dynamic";

export default async function CreateProductPage() {
  const categories =
    await prisma.category.findMany({
      where: {
        deletedAt: null,
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  async function action(
    formData: FormData
  ) {
    "use server";

    const result =
      await createProductAction(
        {
          success: false,
        },
        formData
      );

    if (!result.success) {
      console.error(result);

      return;
    }

    redirect("/admin/products");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Tambah Produk
        </h1>

        <p className="text-muted-foreground">
          Tambahkan produk baru ke katalog.
        </p>
      </div>

      <ProductForm
        categories={categories}
        submitLabel="Simpan Produk"
        action={action}
      />
    </div>
  );
}