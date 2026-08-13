"use client";

import { useTransition } from "react";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toggleProductPublishAction } from "@/actions/product/toggle-product-publish";

interface TogglePublishButtonProps {
  id: string;
  published: boolean;
}

export default function TogglePublishButton({
  id,
  published,
}: TogglePublishButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleProductPublishAction(id);
        });
      }}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : published ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  );
}