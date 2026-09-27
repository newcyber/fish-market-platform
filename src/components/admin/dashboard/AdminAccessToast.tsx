"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminAccessToastProps {
  error?: string;
}

export default function AdminAccessToast({
  error,
}: AdminAccessToastProps) {
  const router = useRouter();

  useEffect(() => {
    if (error !== "super-admin-required") {
      return;
    }

    toast.error("Akses Ditolak", {
      description:
        "Anda tidak diizinkan untuk mengakses halaman tersebut. Halaman ini membutuhkan role Super Admin.",
      duration: 5000,
    });

    router.replace("/admin");
  }, [error, router]);

  return null;
}