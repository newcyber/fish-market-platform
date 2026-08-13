"use client";

import { ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  setProductThumbnailAction,
} from "@/actions/product/set-product-thumbnail";

interface SetThumbnailButtonProps {
  imageId: string;

  productId: string;

  isThumbnail: boolean;
}

export default function SetThumbnailButton({
  imageId,
  productId,
  isThumbnail,
}: SetThumbnailButtonProps) {
  return (
    <form
      action={setProductThumbnailAction}
      className="w-full"
    >
      <input
        type="hidden"
        name="imageId"
        value={imageId}
      />

      <input
        type="hidden"
        name="productId"
        value={productId}
      />

      <Button
        type="submit"
        variant={
          isThumbnail
            ? "default"
            : "outline"
        }
        className="w-full"
        disabled={isThumbnail}
      >
        <ImageIcon className="mr-2 h-4 w-4" />

        {isThumbnail
          ? "Cover Aktif"
          : "Jadikan Cover"}
      </Button>
    </form>
  );
}