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
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">
            Pelanggan Terbaru
          </CardTitle>

          <CardDescription>
            Customer yang baru bergabung.
          </CardDescription>
        </div>

        <Link
          href="/admin/customers"
          className="shrink-0 self-start text-sm font-medium text-primary hover:underline sm:self-auto"
        >
          Lihat Semua
        </Link>
      </CardHeader>

      <CardContent className="px-0 sm:px-6">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  Pelanggan
                </TableHead>

                <TableHead className="whitespace-nowrap">
                  Email
                </TableHead>

                <TableHead className="whitespace-nowrap">
                  Telepon
                </TableHead>

                <TableHead className="whitespace-nowrap">
                  Bergabung
                </TableHead>
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
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback>
                            {getInitials(
                              customer.name
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <span className="max-w-50 truncate font-medium">
                          {customer.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-60 truncate">
                      {customer.email}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {customer.phone ?? "-"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
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
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentCustomers;
