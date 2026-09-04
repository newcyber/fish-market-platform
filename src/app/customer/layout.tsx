import { redirect } from "next/navigation";

import { auth } from "@/auth";

import CustomerService from "@/services/customer/customer.service";
import WishlistService from "@/services/wishlist/wishlist.service";

import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";
import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default async function CustomerLayout({
  children,
}: CustomerLayoutProps) {
  /* ============================================================
   * AUTHENTICATION
   * ============================================================ */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /* ============================================================
   * ACCOUNT STATUS
   * ============================================================ */

  if (!session.user.isActive) {
    redirect("/login");
  }

  /* ============================================================
   * CUSTOMER ROLE
   * ============================================================ */

  if (session.user.role !== "CUSTOMER") {
    redirect("/admin");
  }

  /* ============================================================
   * LOAD CUSTOMER DATA
   * ============================================================ */

  const [customer, wishlist] = await Promise.all([
    CustomerService.getCustomerById(session.user.id),

    WishlistService.getWishlist(session.user.id),
  ]);

  /* ============================================================
   * VALIDATE CUSTOMER
   * ============================================================ */

  if (!customer) {
    redirect("/login");
  }

  /* ============================================================
   * WISHLIST COUNT
   * ============================================================ */

  const wishlistCount =
    wishlist?.items.length ?? 0;

  /* ============================================================
   * CUSTOMER DISPLAY DATA
   * ============================================================ */

  const customerName =
    customer.name?.trim() ||
    "Customer";

  const customerInitial =
    customerName
      .charAt(0)
      .toUpperCase();

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">

      {/* ====================================================== */}
      {/* GLOBAL CUSTOMER HEADER                                */}
      {/* ====================================================== */}

      <DynamicSiteHeader
        mode="customer"
        customerName={customerName}
        customerInitial={customerInitial}
        wishlistCount={wishlistCount}
      />

      {/* ====================================================== */}
      {/* MAIN CONTENT                                           */}
      {/* ====================================================== */}

      <main className="flex-1">
        {children}
      </main>

      {/* ====================================================== */}
      {/* FOOTER                                                  */}
      {/* ====================================================== */}

      <DynamicSiteFooter />

    </div>
  );
}
