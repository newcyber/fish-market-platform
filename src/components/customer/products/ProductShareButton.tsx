"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface ProductShareButtonProps {
  productName: string;
  productSlug: string;
}

export default function ProductShareButton({
  productName,
  productSlug,
}: ProductShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const productPath = `/products/${encodeURIComponent(productSlug)}`;
    const productUrl =
      typeof window !== "undefined"
        ? new URL(productPath, window.location.origin).toString()
        : productPath;

    const shareData = {
      title: productName,
      text: `Lihat produk ${productName} di PISJO Market`,
      url: productUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(productUrl);
        setCopied(true);
      } catch {
        // Clipboard tidak tersedia pada browser/perangkat tersebut.
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Link produk disalin" : "Bagikan produk"}
      title={copied ? "Link disalin" : "Bagikan produk"}
      className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        border-slate-200/80
        bg-white/95
        text-slate-700
        shadow-md
        backdrop-blur-sm
        transition-all
        duration-200
        hover:scale-105
        hover:bg-white
        hover:text-cyan-600
        active:scale-95
        md:hidden
      "
    >
      {copied ? (
        <Check className="h-5 w-5 text-emerald-600" />
      ) : (
        <Share2 className="h-5 w-5" />
      )}
    </button>
  );
}
