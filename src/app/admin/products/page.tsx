import { ProductService } from "@/services/product/product.service";

import { ProductToolbar } from "@/components/admin/products/ProductToolbar";
import {
  ProductTable,
  type ProductTableItem,
} from "@/components/admin/products/ProductTable";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    category?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = (await searchParams) ?? {};

  const products = await ProductService.getProducts({
    search: params.search,
    categoryId:
      params.category && params.category !== "all"
        ? params.category
        : undefined,
    published:
      params.status === "published"
        ? true
        : params.status === "draft"
          ? false
          : undefined,
    featured:
      params.status === "featured"
        ? true
        : undefined,
  });

  const tableData: ProductTableItem[] =
    products.map((product: Awaited<typeof products>[number]) => ({
      id: product.id,

      name: product.name,

      category: product.category.name,

      sku: product.sku,

      price: Number(product.price),

      stock: product.stock,

      stockItems: product.skus.map((sku) => ({
        skuId: sku.id,
        sku: sku.sku,
        stock: sku.stock,
        optionLabels: sku.skuOptions
          .map((skuOption) => ({
            groupName: skuOption.variantOption.group.name,
            optionLabel: skuOption.variantOption.label,
          }))
          .sort((a, b) =>
            `${a.groupName} ${a.optionLabel}`.localeCompare(
              `${b.groupName} ${b.optionLabel}`,
              "id-ID"
            )
          )
          .map((option) => `${option.groupName}: ${option.optionLabel}`),
      })),

      priceItems: product.skus.map((sku) => ({
        skuId: sku.id,
        sku: sku.sku,
        price: Number(sku.price),
        optionLabels: sku.skuOptions
          .map((skuOption) => ({
            groupName: skuOption.variantOption.group.name,
            optionLabel: skuOption.variantOption.label,
          }))
          .sort((a, b) =>
            `${a.groupName} ${a.optionLabel}`.localeCompare(
              `${b.groupName} ${b.optionLabel}`,
              "id-ID"
            )
          )
          .map((option) => `${option.groupName}: ${option.optionLabel}`),
      })),

      featured: product.featured,

      published: product.isPublished,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Product Management
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kelola seluruh produk marketplace.
        </p>
      </div>

      <ProductToolbar
        search={params.search}
        status={params.status}
        category={params.category}
      />

      <ProductTable
        products={tableData}
      />
    </div>
  );
}
