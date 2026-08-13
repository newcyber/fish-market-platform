import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProductForm from "@/components/admin/products/ProductForm";
import ProductGallery from "@/components/admin/products/ProductGallery";

import { ProductService } from "@/services/product/product.service";

import {
  updateProductAction,
} from "@/actions/product/update-product";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const [product, categories] =
    await Promise.all([
      ProductService.getProductById(id),

      prisma.category.findMany({
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
      }),
    ]);

  if (!product) {
    notFound();
  }

  async function action(
    formData: FormData
  ) {
    "use server";

    await updateProductAction(
      id,
      {
        success: false,
      },
      formData
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Edit Produk
        </h1>

        <p className="text-muted-foreground">
          Perbarui informasi produk dan
          kelola gallery gambar produk.
        </p>
      </div>

      <ProductGallery
        productId={product.id}
        images={product.images}
      />

      <ProductForm
        categories={categories}
        submitLabel="Update Produk"
        action={action}
        defaultValues={{
          categoryId:
            product.categoryId,

          name:
            product.name,

          slug:
            product.slug,

          description:
            product.description ??
            "",

          sku:
            product.sku ?? "",

          unit:
            product.unit,

          price:
            Number(product.price),

          stock:
            product.stock,

          weight:
            Number(product.weight),

          isPublished:
            product.isPublished,

          featured:
            product.featured,
        }}
      />
    </div>
  );
}