"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Save, Upload } from "lucide-react";

import {
  updateLandingPageImagesAction,
  type UpdateLandingPageImagesActionInput,
} from "@/actions/admin/landing-page/update-landing-page-images";

type ImageSlot = "hero" | "app" | "ogImage";

interface LandingPageImagesFormProps {
  images?: {
    hero?: string | null;
    app?: string | null;
    ogImage?: string | null;
  };
}

function ImageField({
  slot,
  label,
  description,
  value,
  onChange,
}: {
  slot: ImageSlot;
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploadError(null);

    const formData = new FormData();

    formData.append("file", file);
    formData.append("slot", slot);

    setUploading(true);

    try {
      const response = await fetch(
        "/api/admin/landing-page/images",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: {
          slot?: string;
          path?: string;
        };
      };

      if (
        !response.ok ||
        !result.success ||
        !result.data?.path
      ) {
        throw new Error(
          result.message ||
            "Gagal mengupload gambar.",
        );
      }

      onChange(result.data.path);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Gagal mengupload gambar.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-900">
          {label}
        </label>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Hidden file input */}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void handleUpload(file);
            }
          }}
        />

        {/* Upload button */}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}

          {uploading
            ? "Mengupload..."
            : "Upload Gambar"}
        </button>

        {/* Image URL / Public Path */}

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="atau masukkan URL/path gambar"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {uploadError && (
        <p className="text-xs text-red-600">
          {uploadError}
        </p>
      )}

      {value ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          Belum ada gambar
        </div>
      )}
    </div>
  );
}

export default function LandingPageImagesForm({
  images,
}: LandingPageImagesFormProps) {
  const [hero, setHero] = useState(
    images?.hero ?? "",
  );

  const [app, setApp] = useState(
    images?.app ?? "",
  );

  const [ogImage, setOgImage] = useState(
    images?.ogImage ?? "",
  );

  const [isPending, setIsPending] =
    useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setIsPending(true);

    const input: UpdateLandingPageImagesActionInput = {
      hero: hero.trim() || null,
      app: app.trim() || null,
      ogImage: ogImage.trim() || null,
    };

    try {
      const result =
        await updateLandingPageImagesAction(
          input,
        );

      setMessage({
        type: result.success
          ? "success"
          : "error",
        text: result.message,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui gambar Landing Page.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}

        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Images
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Kelola gambar Landing Page.
                Anda dapat mengupload file atau
                menggunakan URL/path gambar.
              </p>
            </div>
          </div>
        </div>

        {/* Image fields */}

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <ImageField
            slot="hero"
            label="Hero Image"
            description="Gambar utama yang digunakan pada bagian Hero."
            value={hero}
            onChange={setHero}
          />

          <ImageField
            slot="app"
            label="App Showcase Image"
            description="Gambar yang digunakan untuk menampilkan aplikasi Android."
            value={app}
            onChange={setApp}
          />

          <div className="md:col-span-2">
            <ImageField
              slot="ogImage"
              label="OG Image"
              description="Gambar untuk Open Graph ketika Landing Page dibagikan."
              value={ogImage}
              onChange={setOgImage}
            />
          </div>
        </div>
      </section>

      {/* Save message */}

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save button */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {isPending
            ? "Menyimpan..."
            : "Simpan Images"}
        </button>
      </div>
    </form>
  );
}