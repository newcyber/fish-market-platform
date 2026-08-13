"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import UploadDropzone from "./UploadDropzone";
import UploadPreviewGrid from "./UploadPreviewGrid";

import { useImageUpload } from "./useImageUpload";

import type {
  ImageUploadPanelProps,
} from "./types";

export default function ImageUploadPanel({
  productId,
}: ImageUploadPanelProps) {
  const {
    previews,

    dragging,

    uploading,

    uploadProgress,

    inputRef,

    openPicker,

    handleFiles,

    handleDragEnter,

    handleDragLeave,

    handleDragOver,

    handleDrop,

    removePreview,

    upload,

    clearPreview,
  } = useImageUpload({
    productId,
  });

  return (
    <Card className="space-y-6 p-6">
      {/* Hidden File Input */}
      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        accept="image/*"
        onChange={(event) => {
          handleFiles(event.target.files);
        }}
      />

      {/* Upload Dropzone */}
      <UploadDropzone
        dragging={dragging}
        disabled={uploading}
        onClick={openPicker}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Preview */}
      {previews.length > 0 && (
        <>
          <UploadPreviewGrid
            previews={previews}
            onRemove={removePreview}
          />

          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Progress Upload
                </span>

                <span className="text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>

              <Progress
                value={uploadProgress}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                onClick={upload}
                disabled={
                  uploading ||
                  previews.length === 0
                }
              >
                {uploading
                  ? "Uploading..."
                  : "Upload Semua"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={clearPreview}
                disabled={uploading}
              >
                Bersihkan
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}