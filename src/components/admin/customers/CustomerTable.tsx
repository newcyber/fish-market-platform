import Link from "next/link";

import AdminDataTable from "@/components/admin/common/AdminDataTable";
import AdminStatusBadge from "@/components/admin/common/AdminStatusBadge";
import DeleteCustomerButton from "./DeleteCustomerButton";

import { Button } from "@/components/ui/button";

import type {
  CustomerListItem,
  CustomerSegment,
} from "@/services/customer/customer.service";

interface CustomerTableProps {
  customers: CustomerListItem[];
  mode?: "active" | "trash";
  startIndex?: number;
}

const segmentConfig: Record<
  CustomerSegment,
  {
    label: string;
    className: string;
  }
> = {
  BARU: {
    label: "Baru",
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  REPEAT: {
    label: "Repeat",
    className:
      "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  LOYAL: {
    label: "Loyal",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  VIP: {
    label: "VIP",
    className:
      "bg-rose-50 text-rose-700 ring-rose-600/20",
  },
  AKTIF: {
    label: "Aktif",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  DORMANT: {
    label: "Dormant",
    className:
      "bg-gray-100 text-gray-600 ring-gray-500/20",
  },
};

function SegmentBadge({
  segment,
}: {
  segment: CustomerSegment;
}) {
  const config = segmentConfig[segment];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-medium ring-1 ring-inset",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatPhone(phone: string | null) {
  if (!phone) {
    return "-";
  }

  return phone;
}

export default function CustomerTable({
  customers,
  mode = "active",
  startIndex = 0,
}: CustomerTableProps) {
  return (
    <AdminDataTable
      headers={[
        "No",
        "Nama",
        "HP/WA",
        "Email",
        "Area",
        "Total Order",
        "Total Belanja",
        "Poin",
        "Segmen",
        "Terakhir Belanja",
        "Status",
        "Aksi",
      ]}
    >
      {customers.length === 0 ? (
        <tr>
          <td
            colSpan={12}
            className="py-10 text-center text-muted-foreground"
          >
            Belum ada customer.
          </td>
        </tr>
      ) : (
        customers.map((customer, index) => (
          <tr
            key={customer.id}
            className="border-b last:border-0 hover:bg-muted/30"
          >
            <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
              {startIndex + index + 1}
            </td>

            <td className="min-w-[180px] px-4 py-4">
              <Link
                href={`/admin/customers/${customer.id}`}
                className="font-medium hover:underline"
              >
                {customer.name}
              </Link>
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-sm">
              {formatPhone(customer.phone)}
            </td>

            <td className="min-w-[220px] px-4 py-4 text-sm">
              {customer.email || "-"}
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-sm">
              {customer.area}
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium">
              {customer.totalOrders}
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">
              {formatCurrency(customer.totalSpent)}
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-sm">
              {customer.rewardPointsBalance.toLocaleString(
                "id-ID"
              )}
            </td>

            <td className="whitespace-nowrap px-4 py-4">
              <SegmentBadge
                segment={customer.segment}
              />
            </td>

            <td className="whitespace-nowrap px-4 py-4 text-sm">
              {formatDate(customer.lastOrderAt)}
            </td>

            <td className="whitespace-nowrap px-4 py-4">
              <AdminStatusBadge
                active={customer.isActive}
              />
            </td>

            <td className="whitespace-nowrap px-4 py-4">
              <div className="flex gap-2">
                <Link
                  href={`/admin/customers/${customer.id}`}
                >
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    Detail
                  </Button>
                </Link>

                {mode === "active" && (
                  <DeleteCustomerButton
                    id={customer.id}
                    name={customer.name}
                  />
                )}
              </div>
            </td>
          </tr>
        ))
      )}
    </AdminDataTable>
  );
}
