import type { Metadata } from "next";

import HelpCenter from "./HelpCenter";

export const metadata: Metadata = {
  title: "Bantuan",
  description:
    "Temukan jawaban atas pertanyaan seputar akun, produk, pesanan, pembayaran, pengiriman, voucher, dan layanan Pisjo Market.",
};

export default function HelpPage() {
  return <HelpCenter />;
}