import Link from "next/link";

import {
  Printer,
} from "lucide-react";

interface PrintInternalShippingLabelButtonProps {
  orderId: string;
  trackingNumber?: string | null;
}

export default function PrintInternalShippingLabelButton({
  orderId,
  trackingNumber,
}: PrintInternalShippingLabelButtonProps) {
  if (!trackingNumber) {
    return null;
  }

  return (
    <Link
      href={`/admin/orders/${orderId}/shipping-label`}
      className="
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        border
        border-slate-300
        bg-white
        px-4
        py-2.5
        text-sm
        font-semibold
        text-slate-700
        transition
        hover:bg-slate-50
        hover:text-slate-950
      "
    >
      <Printer className="h-4 w-4" />

      Cetak Resi
    </Link>
  );
}