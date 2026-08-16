"use client";

import {
  Printer,
} from "lucide-react";

export default function PrintShippingLabelButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        bg-slate-900
        px-5
        py-2.5
        text-sm
        font-semibold
        text-white
        transition
        hover:bg-slate-800
      "
    >
      <Printer className="h-4 w-4" />

      Cetak Resi
    </button>
  );
}