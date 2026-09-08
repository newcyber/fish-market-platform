"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import HomeProductQuickAddSheet from "@/components/customer/home/HomeProductQuickAddSheet";

interface CustomerProductQuickAddProps {
  productId: string;
  productName: string;
  disabled?: boolean;
}

export default function CustomerProductQuickAdd({
  productId,
  productName,
  disabled = false,
}: CustomerProductQuickAddProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={`Tambah ${productName} ke keranjang`}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-(--fresh-500)
          text-white
          shadow-sm
          transition
          hover:bg-(--fresh-600)
          active:scale-95
          disabled:cursor-not-allowed
          disabled:bg-slate-200
          disabled:text-slate-400
          sm:h-9
          sm:w-9
        "
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
      </button>

      <HomeProductQuickAddSheet
        productId={productId}
        productName={productName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
