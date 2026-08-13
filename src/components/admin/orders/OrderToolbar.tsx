"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { Plus } from "lucide-react";

import AdminToolbar from "@/components/admin/common/AdminToolbar";
import AdminSearch from "@/components/admin/common/AdminSearch";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

interface OrderToolbarProps {
  search?: string;
  status?: string;
  paymentStatus?: string;
}

export default function OrderToolbar({
  search = "",
  status = "all",
  paymentStatus = "all",
}: OrderToolbarProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams =
    useSearchParams();

  const [searchValue, setSearchValue] =
    useState(search);

  const [statusValue, setStatusValue] =
    useState(status);

  const [
    paymentStatusValue,
    setPaymentStatusValue,
  ] = useState(paymentStatus);

  /**
   * Update query parameter dengan
   * debounce 400ms.
   */
  useEffect(() => {
    const timeout =
      setTimeout(() => {
        const params =
          new URLSearchParams(
            searchParams.toString()
          );

        /**
         * Search
         */
        if (
          searchValue.trim()
        ) {
          params.set(
            "search",
            searchValue.trim()
          );
        } else {
          params.delete(
            "search"
          );
        }

        /**
         * Order status
         */
        if (
          statusValue !== "all"
        ) {
          params.set(
            "status",
            statusValue
          );
        } else {
          params.delete(
            "status"
          );
        }

        /**
         * Payment status
         */
        if (
          paymentStatusValue !==
          "all"
        ) {
          params.set(
            "paymentStatus",
            paymentStatusValue
          );
        } else {
          params.delete(
            "paymentStatus"
          );
        }

        const query =
          params.toString();

        router.replace(
          query
            ? `${pathname}?${query}`
            : pathname
        );
      }, 400);

    return () =>
      clearTimeout(timeout);
  }, [
    searchValue,
    statusValue,
    paymentStatusValue,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <AdminToolbar
      search={
        <AdminSearch
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Cari nomor order atau customer..."
        />
      }
      filters={
        <>
          <Select
            value={statusValue}
            onValueChange={(value) => {
              setStatusValue(
                value ?? "all"
              );
            }}
          >
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Status Order" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Status
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.PENDING
                }
              >
                Pending
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.WAITING_PAYMENT
                }
              >
                Menunggu Pembayaran
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.WAITING_VERIFICATION
                }
              >
                Menunggu Verifikasi
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.PROCESSING
                }
              >
                Diproses
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.SHIPPING
                }
              >
                Dikirim
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.COMPLETED
                }
              >
                Selesai
              </SelectItem>

              <SelectItem
                value={
                  OrderStatus.CANCELLED
                }
              >
                Dibatalkan
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              paymentStatusValue
            }
            onValueChange={(value) => {
              setPaymentStatusValue(
                value ?? "all"
              );
            }}
          >
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Pembayaran" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Pembayaran
              </SelectItem>

              <SelectItem
                value={
                  PaymentStatus.PENDING
                }
              >
                Pending
              </SelectItem>

              <SelectItem
                value={
                  PaymentStatus.VERIFIED
                }
              >
                Terverifikasi
              </SelectItem>

              <SelectItem
                value={
                  PaymentStatus.REJECTED
                }
              >
                Ditolak
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      actions={
        <Link href="/admin/orders/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Order
          </Button>
        </Link>
      }
    />
  );
}