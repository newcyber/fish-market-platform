"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileArchive,
  Save,
  Smartphone,
  Upload,
} from "lucide-react";

import {
  updateAndroidAppAction,
  type UpdateAndroidAppActionInput,
} from "@/actions/admin/landing-page/update-android-app";

interface LandingPageAndroidFormProps {
  androidApp: {
    enabled: boolean;
    appName: string;
    version: string;
    description: string | null;
    fileName: string | null;
    fileUrl: string | null;
    mimeType: string | null;
    fileSize: number | null;
    sha256: string | null;
  };
}

interface AndroidFileMetadata {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
}

const MAX_APK_SIZE =
  100 * 1024 * 1024;

function formatFileSize(
  bytes: number | null,
): string {
  if (!bytes || bytes <= 0) {
    return "-";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.min(
    Math.floor(
      Math.log(bytes) / Math.log(1024),
    ),
    units.length - 1,
  );

  const size =
    bytes /
    Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : 2,
  )} ${units[index]}`;
}

export default function LandingPageAndroidForm({
  androidApp,
}: LandingPageAndroidFormProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [enabled, setEnabled] =
    useState(androidApp.enabled);

  const [appName, setAppName] =
    useState(androidApp.appName);

  const [version, setVersion] =
    useState(androidApp.version);

  const [description, setDescription] =
    useState(
      androidApp.description ?? "",
    );

  const [apk, setApk] =
    useState<AndroidFileMetadata | null>(
      androidApp.fileName &&
        androidApp.fileUrl
        ? {
            fileName:
              androidApp.fileName,
            fileUrl:
              androidApp.fileUrl,
            mimeType:
              androidApp.mimeType ??
              "application/vnd.android.package-archive",
            fileSize:
              androidApp.fileSize ?? 0,
            sha256:
              androidApp.sha256 ?? "",
          }
        : null,
    );

  const [selectedFileName, setSelectedFileName] =
    useState<string | null>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isPending, setIsPending] =
    useState(false);

  const [message, setMessage] =
    useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setMessage(null);

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFileName(null);
      return;
    }

    const fileName =
      file.name.trim();

    if (
      !fileName
        .toLowerCase()
        .endsWith(".apk")
    ) {
      event.target.value = "";

      setSelectedFileName(null);

      setMessage({
        type: "error",
        text:
          "File harus menggunakan ekstensi .apk.",
      });

      return;
    }

    if (file.size <= 0) {
      event.target.value = "";

      setSelectedFileName(null);

      setMessage({
        type: "error",
        text: "File APK kosong.",
      });

      return;
    }

    if (file.size > MAX_APK_SIZE) {
      event.target.value = "";

      setSelectedFileName(null);

      setMessage({
        type: "error",
        text:
          "Ukuran APK maksimal 100 MB.",
      });

      return;
    }

    setSelectedFileName(
      file.name,
    );
  }

  async function handleUploadApk() {
    const file =
      fileInputRef.current?.files?.[0];

    if (!file) {
      setMessage({
        type: "error",
        text:
          "Pilih file APK terlebih dahulu.",
      });

      return;
    }

    const fileName =
      file.name.trim();

    if (
      !fileName
        .toLowerCase()
        .endsWith(".apk")
    ) {
      setMessage({
        type: "error",
        text:
          "File harus menggunakan ekstensi .apk.",
      });

      return;
    }

    if (file.size <= 0) {
      setMessage({
        type: "error",
        text: "File APK kosong.",
      });

      return;
    }

    if (file.size > MAX_APK_SIZE) {
      setMessage({
        type: "error",
        text:
          "Ukuran APK maksimal 100 MB.",
      });

      return;
    }

    setMessage(null);
    setIsUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/admin/landing-page/android",
          {
            method: "POST",
            body: formData,
          },
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengupload APK.",
        );
      }

      setApk({
        fileName:
          result.data.fileName,
        fileUrl:
          result.data.fileUrl,
        mimeType:
          result.data.mimeType,
        fileSize:
          result.data.fileSize,
        sha256:
          result.data.sha256,
      });

      setSelectedFileName(null);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      setMessage({
        type: "success",
        text:
          "APK berhasil diupload dan metadata berhasil disimpan.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Gagal mengupload APK.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setIsPending(true);

    const input: UpdateAndroidAppActionInput =
      {
        enabled,
        appName: appName.trim(),
        version: version.trim(),
        description:
          description.trim() || null,
      };

    try {
      const result =
        await updateAndroidAppAction(
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
            : "Gagal menyimpan pengaturan Android.",
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Smartphone className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Android App
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Kelola aplikasi Android
                yang ditampilkan pada
                Landing Page.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Enable */}

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) =>
                setEnabled(
                  event.target.checked,
                )
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Aktifkan Android App
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Jika aktif dan APK
                tersedia, tombol
                Landing Page akan
                mengarah ke file APK.
              </span>
            </span>
          </label>

          {/* App Name */}

          <div>
            <label
              htmlFor="android-app-name"
              className="block text-sm font-medium text-slate-900"
            >
              Nama Aplikasi
            </label>

            <input
              id="android-app-name"
              type="text"
              value={appName}
              onChange={(event) =>
                setAppName(
                  event.target.value,
                )
              }
              placeholder="Pisjo Market"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Version */}

          <div>
            <label
              htmlFor="android-app-version"
              className="block text-sm font-medium text-slate-900"
            >
              Versi
            </label>

            <input
              id="android-app-version"
              type="text"
              value={version}
              onChange={(event) =>
                setVersion(
                  event.target.value,
                )
              }
              placeholder="1.0.0"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}

          <div>
            <label
              htmlFor="android-app-description"
              className="block text-sm font-medium text-slate-900"
            >
              Deskripsi
            </label>

            <textarea
              id="android-app-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Deskripsi singkat aplikasi Android."
              rows={4}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* APK Upload */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileArchive className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  APK Android
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Upload file APK resmi
                  Pisjo Market. Maksimal
                  ukuran file 100 MB.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <input
                ref={fileInputRef}
                id="android-apk-file"
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                onChange={handleFileChange}
                disabled={isUploading}
                className="sr-only"
              />

              <label
                htmlFor="android-apk-file"
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30 ${
                  isUploading
                    ? "pointer-events-none opacity-60"
                    : ""
                }`}
              >
                <Upload className="h-7 w-7 text-slate-400" />

                <span className="mt-3 text-sm font-semibold text-slate-700">
                  Pilih File APK
                </span>

                <span className="mt-1 text-xs text-slate-400">
                  Format .apk · maksimal
                  100 MB
                </span>

                {selectedFileName && (
                  <span className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                    {selectedFileName}
                  </span>
                )}
              </label>
            </div>

            {selectedFileName && (
              <button
                type="button"
                onClick={handleUploadApk}
                disabled={isUploading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />

                {isUploading
                  ? "Mengupload APK..."
                  : "Upload APK"}
              </button>
            )}
          </div>

          {/* APK Status */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />

              <p className="text-sm font-semibold text-slate-900">
                Status APK
              </p>
            </div>

            {apk ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-800">
                        APK tersedia
                      </p>

                      <p className="mt-1 break-all text-xs text-emerald-700">
                        {apk.fileName}
                      </p>
                    </div>

                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Ukuran
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatFileSize(
                        apk.fileSize,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      MIME Type
                    </p>

                    <p className="mt-1 break-all text-xs font-medium text-slate-700">
                      {apk.mimeType ||
                        "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    SHA-256
                  </p>

                  <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-700">
                    {apk.sha256 || "-"}
                  </p>
                </div>

                {apk.fileUrl && (
                  <a
                    href={apk.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" />

                    Buka / Download APK
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Belum ada APK yang
                  diupload.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Message */}

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

      {/* Save metadata */}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isPending ||
            isUploading
          }
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {isPending
            ? "Menyimpan..."
            : "Simpan Android"}
        </button>
      </div>
    </form>
  );
}