"use client";

import Image from "next/image";

import { Trash2, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { PreviewImage } from "./types";

interface UploadPreviewGridProps {
  previews: PreviewImage[];

  onRemove(id: string): void;
}

export default function UploadPreviewGrid({
  previews,
  onRemove,
}: UploadPreviewGridProps) {
  if (previews.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {previews.map((preview) => (
        <Card
          key={preview.id}
          className="overflow-hidden p-0"
        >
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={preview.url}
              alt={preview.file.name}
              fill
              className="object-cover"
              unoptimized
            />

            <div className="absolute right-2 top-2">
              {preview.uploaded ? (
                <Badge className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Uploaded
                </Badge>
              ) : preview.uploading ? (
                <Badge
                  variant="secondary"
                  className="gap-1"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading
                </Badge>
              ) : (
                <Badge variant="outline">
                  Ready
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 p-3">
  <div>
    <p className="truncate text-sm font-medium">
      {preview.file.name}
    </p>

    <p className="text-xs text-muted-foreground">
      {(preview.file.size / 1024 / 1024).toFixed(2)} MB
    </p>
  </div>

  <div className="space-y-2">
    <Progress
      value={preview.progress}
    />

    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {preview.uploaded
          ? "Selesai"
          : preview.uploading
          ? "Uploading..."
          : preview.error
          ? "Gagal"
          : "Siap"}
      </span>

      <span>
        {preview.progress}%
      </span>
    </div>
  </div>

  {preview.error && (
    <Badge
      variant="destructive"
      className="w-full justify-center"
    >
      {preview.error}
    </Badge>
  )}

  <Button
    type="button"
    variant="destructive"
    size="sm"
    className="w-full"
    onClick={() =>
      onRemove(preview.id)
    }
    disabled={preview.uploading}
  >
    <Trash2 className="mr-2 h-4 w-4" />

    Hapus
  </Button>
</div>
        </Card>
      ))}
    </div>
  );
}