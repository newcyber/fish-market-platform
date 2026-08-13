"use client";

import {
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  dragging: boolean;

  disabled?: boolean;

  onClick(): void;

  onDragEnter(
    event: React.DragEvent<HTMLDivElement>
  ): void;

  onDragLeave(
    event: React.DragEvent<HTMLDivElement>
  ): void;

  onDragOver(
    event: React.DragEvent<HTMLDivElement>
  ): void;

  onDrop(
    event: React.DragEvent<HTMLDivElement>
  ): void;
}

export default function UploadDropzone({
  dragging,

  disabled = false,

  onClick,

  onDragEnter,

  onDragLeave,

  onDragOver,

  onDrop,
}: UploadDropzoneProps) {
  return (
    <div
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "cursor-pointer",
        "rounded-xl",
        "border-2",
        "border-dashed",
        "transition-all",
        "duration-200",

        "flex",
        "min-h-[220px]",
        "items-center",
        "justify-center",

        disabled
          ? "cursor-not-allowed opacity-60"

          : dragging

          ? "border-primary bg-primary/5"

          : "border-border hover:border-primary/50",
      ].join(" ")}
    >
      <div className="space-y-5 text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />

        <div>
          <p className="font-semibold">
            Drag & Drop gambar
          </p>

          <p className="text-sm text-muted-foreground">
            atau klik area ini
            untuk memilih gambar
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={disabled}
        >
          Pilih Gambar
        </Button>
      </div>
    </div>
  );
}