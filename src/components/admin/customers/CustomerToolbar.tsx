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

interface CustomerToolbarProps {
  search?: string;
  role?: string;
  status?: string;
}

export default function CustomerToolbar({
  search = "",
  role = "all",
  status = "all",
}: CustomerToolbarProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams =
    useSearchParams();

  const [searchValue, setSearchValue] =
  useState<string>(search);

const [roleValue, setRoleValue] =
  useState<string>(role);

const [statusValue, setStatusValue] =
  useState<string>(status);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      if (searchValue.trim()) {
        params.set(
          "search",
          searchValue.trim()
        );
      } else {
        params.delete("search");
      }

      if (roleValue !== "all") {
        params.set("role", roleValue);
      } else {
        params.delete("role");
      }

      if (statusValue !== "all") {
        params.set(
          "status",
          statusValue
        );
      } else {
        params.delete("status");
      }

      router.replace(
        `${pathname}?${params.toString()}`
      );
    }, 400);

    return () =>
      clearTimeout(timeout);
  }, [
    searchValue,
    roleValue,
    statusValue,
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
          placeholder="Cari customer..."
        />
      }
      filters={
        <>
          <Select
  value={roleValue}
  onValueChange={(value) => {
    setRoleValue(value ?? "all");
  }}
>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Role" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Role
              </SelectItem>

              <SelectItem value="CUSTOMER">
                Customer
              </SelectItem>

              <SelectItem value="ADMIN">
                Admin
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
  value={statusValue}
  onValueChange={(value) => {
    setStatusValue(value ?? "all");
  }}
>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Semua Status
              </SelectItem>

              <SelectItem value="active">
                Aktif
              </SelectItem>

              <SelectItem value="inactive">
                Nonaktif
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      actions={
        <Link href="/admin/customers/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Customer
          </Button>
        </Link>
      }
    />
  );
}