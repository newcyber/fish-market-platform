import Link from "next/link";

import { Pencil } from "lucide-react";

import DeleteCategoryButton from "./DeleteCategoryButton";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CategoryTableItem {
  id: string;

  name: string;

  slug: string;

  sortOrder: number;

  isActive: boolean;

  totalProducts: number;
}

interface CategoryTableProps {
  categories: CategoryTableItem[];
}

export function CategoryTable({
  categories,
}: CategoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Daftar Kategori
        </CardTitle>

        <CardDescription>
          Kelola seluruh kategori produk.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>

              <TableHead>Slug</TableHead>

              <TableHead className="text-center">
                Produk
              </TableHead>

              <TableHead className="text-center">
                Urutan
              </TableHead>

              <TableHead>Status</TableHead>

              <TableHead className="text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  Belum ada kategori.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>

                  <TableCell>
                    {category.slug}
                  </TableCell>

                  <TableCell className="text-center">
                    {category.totalProducts}
                  </TableCell>

                  <TableCell className="text-center">
                    {category.sortOrder}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        category.isActive
                          ? "default"
                          : "secondary"
                      }
                    >
                      {category.isActive
                        ? "Aktif"
                        : "Nonaktif"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>

                      <DeleteCategoryButton
  id={category.id}
  name={category.name}
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

export default CategoryTable;