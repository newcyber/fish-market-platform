import type { Metadata } from "next";

import ContactUsPage from "@/components/customer/contact/ContactUsPage";

/**
 * Contact data comes from StoreSettings at request time.
 *
 * Store Settings dapat berubah dari Admin Settings tanpa
 * membutuhkan production rebuild.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kontak Kami | Pisjo Market",
  description:
    "Hubungi Pisjo Market untuk informasi produk, pemesanan, pengiriman, dan kebutuhan seafood segar.",
};

export default function ContactPage() {
  return <ContactUsPage />;
}