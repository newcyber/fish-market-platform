import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export interface RecentCustomerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  joinedAt: Date;
}

interface RecentCustomersProps {
  customers: RecentCustomerItem[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function RecentCustomers({
  customers,
}: RecentCustomersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            Pelanggan Terbaru
          </CardTitle>

          <CardDescription>
            Customer yang baru bergabung.
          </CardDescription>
        </div>

        <Link
          href="/admin/customers"
          className="text-sm font-medium text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pelanggan</TableHead>

              <TableHead>Email</TableHead>

              <TableHead>Telepon</TableHead>

              <TableHead>Bergabung</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Belum ada pelanggan.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {getInitials(
                            customer.name
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <span className="font-medium">
                        {customer.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {customer.email}
                  </TableCell>

                  <TableCell>
                    {customer.phone ?? "-"}
                  </TableCell>

                  <TableCell>
                    {customer.joinedAt.toLocaleDateString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
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

export default RecentCustomers;