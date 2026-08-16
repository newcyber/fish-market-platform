"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface ShippingBarcodeProps {
  value: string;
}

export default function ShippingBarcode({
  value,
}: ShippingBarcodeProps) {
  const barcodeRef =
    useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!barcodeRef.current || !value) {
      return;
    }

    try {
      JsBarcode(
        barcodeRef.current,
        value,
        {
          format: "CODE128",
          width: 2,
          height: 70,
          displayValue: false,
          margin: 0,
          lineColor: "#000000",
          background: "#FFFFFF",
        }
      );
    } catch (error) {
      console.error(
        "Failed to generate shipping barcode:",
        error
      );
    }
  }, [value]);

  return (
    <div className="w-full">
      <svg
        ref={barcodeRef}
        className="h-auto w-full"
        aria-label={`Barcode ${value}`}
      />

      <p className="mt-2 text-center font-mono text-sm font-bold tracking-[0.2em] text-black">
        {value}
      </p>
    </div>
  );
}