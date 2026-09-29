"use client";

import { useRef, useState } from "react";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_FILES = 5;
const ACCEPTED_TYPES = [
  "video/mp4",
  "video/webm",
];

interface ProductVideoUploadPanelProps {
  productId: string;
}

interface VideoPreview {
  id: string;
  file: File;
  url: string;
}

export default function ProductVideoUploadPanel({
  productId,
}: ProductVideoUploadPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [previews, setPreviews] = useState<VideoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = (files: File[]) => {
    const available = Math.max(
      0,
      MAX_VIDEO_FILES - previews.length,
    );

    const next = files.slice(0, available);

    for (const file of next) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(
          `${file.name}: format video harus MP4 atau WebM.`,
        );
        continue;
      }

      if (file.size > MAX_VIDEO_SIZE) {
        toast.error(
          `${file.name}: ukuran video maksimal 50 MB.`,
        );
        continue;
      }

      if (
        previews.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified,
        )
      ) {
        continue;
      }

      setPreviews((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
        },
      ]);
    }
  };

  const removePreview = (id: string) => {
    setPreviews((current) => {
      const item = current.find(
        (preview) => preview.id === id,
      );

      if (item) {
        URL.revokeObjectURL(item.url);
      }

      return current.filter(
        (preview) => preview.id !== id,
      );
    });
  };

  const clearPreviews = () => {
    previews.forEach((preview) =>
      URL.revokeObjectURL(preview.url),
    );

    setPreviews([]);
    setProgress(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const upload = () => {
    if (uploading || previews.length === 0) {
      return;
    }

    const formData = new FormData();

    previews.forEach((preview) => {
      formData.append(
        "videos",
        preview.file,
      );
    });

    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `/api/admin/products/${encodeURIComponent(productId)}/videos`,
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(
          Math.round(
            (event.loaded / event.total) * 100,
          ),
        );
      }
    };

    xhr.onload = () => {
      setUploading(false);

      let result: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        result.message =
          "Respons server tidak valid.";
      }

      if (
        xhr.status >= 200 &&
        xhr.status < 300 &&
        result.success
      ) {
        toast.success(
          result.message ??
            "Video berhasil diupload.",
        );
        clearPreviews();
        router.refresh();
        return;
      }

      toast.error(
        result.message ??
          "Upload video gagal.",
      );
    };

    xhr.onerror = () => {
      setUploading(false);
      toast.error(
        "Tidak dapat terhubung ke server.",
      );
    };

    xhr.onabort = () => {
      setUploading(false);
      toast.error("Upload video dibatalkan.");
    };

    setUploading(true);
    setProgress(0);
    xhr.send(formData);
  };

  return (
    <Card className="space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Film className="h-5 w-5" />
          Video Gallery
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Upload video produk untuk ditampilkan di gallery.
          Format MP4 atau WebM, maksimal 50 MB per video.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept="video/mp4,video/webm"
        onChange={(event) => {
          addFiles(
            Array.from(
              event.target.files ?? [],
            ),
          );
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={
          uploading ||
          previews.length >= MAX_VIDEO_FILES
        }
        onClick={() =>
          inputRef.current?.click()
        }
        className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <span className="text-sm font-medium">
          Klik untuk memilih video
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          Maksimal {MAX_VIDEO_FILES} video sekaligus
        </span>
      </button>

      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="overflow-hidden rounded-xl border bg-muted"
              >
                <video
                  src={preview.url}
                  controls
                  muted
                  preload="metadata"
                  playsInline
                  className="aspect-video w-full object-cover"
                />

                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(
                        preview.file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    disabled={uploading}
                    onClick={() =>
                      removePreview(preview.id)
                    }
                    aria-label="Hapus video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Upload video...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

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
                : "Upload Video"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={clearPreviews}
              disabled={uploading}
            >
              Bersihkan
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
