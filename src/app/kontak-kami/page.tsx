import type { Metadata } from "next";

import ContactUsPage from "@/components/customer/contact/ContactUsPage";

export const metadata: Metadata = {
  title: "Kontak Kami | Pisjo Market",
  description:
    "Hubungi Pisjo Market untuk informasi produk, pemesanan, pengiriman, dan kebutuhan seafood segar.",
};

export default function ContactPage() {
  return <ContactUsPage />;
}
