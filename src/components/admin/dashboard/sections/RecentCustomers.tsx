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
  data: RecentCustomerItem[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function RecentCustomers({ data }: RecentCustomersProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">
            Pelanggan Terbaru
          </CardTitle>

          <CardDescription className="mt-1">
            Customer yang baru bergabung.
          </CardDescription>
        </div>

        <Link
          href="/admin/customers"
          className="shrink-0 self-start text-sm font-medium text-primary transition-colors hover:underline sm:self-auto"
        >
          Lihat Semua
        </Link>
      </CardHeader>

      <CardContent className="px-0 sm:px-6">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px] whitespace-nowrap px-3">
                  Pelanggan
                </TableHead>

                <TableHead className="w-[250px] whitespace-nowrap px-3">
                  Email
                </TableHead>

                <TableHead className="w-[150px] whitespace-nowrap px-3">
                  Telepon
                </TableHead>

                <TableHead className="w-[140px] whitespace-nowrap px-3">
                  Bergabung
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 px-3 text-center text-muted-foreground"
                  >
                    Belum ada pelanggan.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="w-[220px] px-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback>
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>

                        <span
                          className="block min-w-0 truncate font-medium text-foreground"
                          title={customer.name}
                        >
                          {customer.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="w-[250px] px-3">
                      <span
                        className="block truncate text-foreground"
                        title={customer.email}
                      >
                        {customer.email}
                      </span>
                    </TableCell>

                    <TableCell className="w-[150px] px-3">
                      <span
                        className="block truncate text-muted-foreground"
                        title={customer.phone ?? "-"}
                      >
                        {customer.phone ?? "-"}
                      </span>
                    </TableCell>

                    <TableCell className="w-[140px] whitespace-nowrap px-3 text-muted-foreground">
                      {customer.joinedAt.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
