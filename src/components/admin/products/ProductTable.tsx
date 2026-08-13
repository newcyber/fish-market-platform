import Link from "next/link";
import DeleteProductButton from "@/components/admin/products/DeleteProductButton";
import TogglePublishButton from "@/components/admin/products/TogglePublishButton";

import {
  Pencil,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ProductTableItem {
  id: string;

  name: string;

  category: string;

  sku: string | null;

  price: number;

  stock: number;

  unit: string;

  featured: boolean;

  published: boolean;
}

interface ProductTableProps {
  products: ProductTableItem[];
}

export function ProductTable({
  products,
}: ProductTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daftar Produk</CardTitle>

          <CardDescription>
            Kelola seluruh produk marketplace.
          </CardDescription>
        </div>


      </CardHeader>

      <CardContent>
        <Table>

          <TableHeader>
            <TableRow>

              <TableHead>Produk</TableHead>

              <TableHead>Kategori</TableHead>

              <TableHead>SKU</TableHead>

              <TableHead className="text-right">
                Harga
              </TableHead>

              <TableHead className="text-center">
                Stock
              </TableHead>

              <TableHead>Status</TableHead>

              <TableHead className="text-right">
                Aksi
              </TableHead>

            </TableRow>
          </TableHeader>

          <TableBody>

            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  Belum ada produk.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>

                  <TableCell>

                    <div className="flex flex-col">

                      <span className="font-medium">
                        {product.name}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {product.unit}
                      </span>

                    </div>

                  </TableCell>

                  <TableCell>
                    {product.category}
                  </TableCell>

                  <TableCell>
                    {product.sku ?? "-"}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    Rp{" "}
                    {product.price.toLocaleString(
                      "id-ID"
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    {product.stock}
                  </TableCell>

                  <TableCell>

                    <div className="flex gap-2">

                      <Badge
                        variant={
                          product.published
                            ? "default"
                            : "secondary"
                        }
                      >
                        {product.published
                          ? "Published"
                          : "Draft"}
                      </Badge>

                      {product.featured && (
                        <Badge variant="outline">
                          Featured
                        </Badge>
                      )}

                    </div>

                  </TableCell>

                  <TableCell>

                    <div className="flex justify-end gap-2">

                      <Link
  href={`/admin/products/${product.id}/edit`}
>
  <Button
    type="button"
    variant="outline"
    size="icon"
  >
    <Pencil className="h-4 w-4" />
  </Button>
</Link>

                      <TogglePublishButton
  id={product.id}
  published={product.published}
/>

                      <DeleteProductButton
  id={product.id}
  name={product.name}
/>

                    </div>

                  </TableCell>

                </TableRow>
              ))
            )}

          </TableBody>

        </Table>
      </CardContent>
    </Card>
  );
}

export default ProductTable;