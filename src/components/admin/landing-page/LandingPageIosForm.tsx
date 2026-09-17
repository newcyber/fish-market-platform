"use client";

import { FormEvent, useState } from "react";

import { updateIosAppAction } from "@/actions/admin/landing-page/update-ios-app";

type LandingPageIosApp = {
  id: string;
  key: string;
  enabled: boolean;
  appName: string;
  version: string;
  description: string | null;
  appStoreUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface LandingPageIosFormProps {
  iosApp: LandingPageIosApp;
}

export default function LandingPageIosForm({
  iosApp,
}: LandingPageIosFormProps) {
  const [enabled, setEnabled] = useState(
    iosApp.enabled,
  );

  const [appName, setAppName] = useState(
    iosApp.appName ?? "",
  );

  const [version, setVersion] = useState(
    iosApp.version ?? "",
  );

  const [description, setDescription] = useState(
    iosApp.description ?? "",
  );

  const [appStoreUrl, setAppStoreUrl] = useState(
    iosApp.appStoreUrl ?? "",
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] = useState<
    string | null
  >(null);

  const [error, setError] = useState<
    string | null
  >(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);
    setError(null);

    const trimmedAppName =
      appName.trim();

    const trimmedVersion =
      version.trim();

    const trimmedDescription =
      description.trim();

    const trimmedAppStoreUrl =
      appStoreUrl.trim();

    if (!trimmedAppName) {
      setError(
        "Nama aplikasi iOS wajib diisi.",
      );
      return;
    }

    if (!trimmedVersion) {
      setError(
        "Versi aplikasi iOS wajib diisi.",
      );
      return;
    }

    if (trimmedAppStoreUrl) {
      try {
        const url = new URL(
          trimmedAppStoreUrl,
        );

        if (url.protocol !== "https:") {
          setError(
            "URL App Store harus menggunakan HTTPS.",
          );
          return;
        }
      } catch {
        setError(
          "URL App Store tidak valid.",
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await updateIosAppAction({
        enabled,
        appName: trimmedAppName,
        version: trimmedVersion,
        description:
          trimmedDescription || undefined,
        appStoreUrl:
          trimmedAppStoreUrl || undefined,
      });

      setMessage(
        "Pengaturan aplikasi iOS berhasil disimpan.",
      );
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan pengaturan aplikasi iOS.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
            
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              iOS App
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Atur informasi aplikasi iOS dan
              tautan resmi App Store untuk landing
              page.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          FORM
          ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 px-5 py-6 sm:px-6"
      >
        {/* ===================================================
            ENABLED
            =================================================== */}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Tampilkan aplikasi iOS
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Jika aktif, tombol App Store dapat
                ditampilkan pada landing page.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Tampilkan aplikasi iOS"
              onClick={() =>
                setEnabled((current) => !current)
              }
              className={[
                "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                enabled
                  ? "bg-slate-900"
                  : "bg-slate-300",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform",
                  enabled
                    ? "translate-x-5"
                    : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        {/* ===================================================
            APP NAME
            =================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="ios-app-name"
            className="block text-sm font-medium text-slate-800"
          >
            Nama Aplikasi
          </label>

          <input
            id="ios-app-name"
            type="text"
            value={appName}
            onChange={(event) =>
              setAppName(event.target.value)
            }
            placeholder="Pisjo Market"
            autoComplete="off"
            disabled={isSubmitting}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        {/* ===================================================
            VERSION
            =================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="ios-app-version"
            className="block text-sm font-medium text-slate-800"
          >
            Versi
          </label>

          <input
            id="ios-app-version"
            type="text"
            value={version}
            onChange={(event) =>
              setVersion(event.target.value)
            }
            placeholder="1.0.0"
            autoComplete="off"
            disabled={isSubmitting}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <p className="text-xs text-slate-500">
            Gunakan versi aplikasi yang sedang
            tersedia di App Store.
          </p>
        </div>

        {/* ===================================================
            DESCRIPTION
            =================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="ios-app-description"
            className="block text-sm font-medium text-slate-800"
          >
            Deskripsi
          </label>

          <textarea
            id="ios-app-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            placeholder="Download aplikasi Pisjo Market di App Store."
            rows={4}
            disabled={isSubmitting}
            className="block w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        {/* ===================================================
            APP STORE URL
            =================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="ios-app-store-url"
            className="block text-sm font-medium text-slate-800"
          >
            App Store URL
          </label>

          <input
            id="ios-app-store-url"
            type="url"
            value={appStoreUrl}
            onChange={(event) =>
              setAppStoreUrl(
                event.target.value,
              )
            }
            placeholder="https://apps.apple.com/id/app/..."
            autoComplete="url"
            inputMode="url"
            disabled={isSubmitting}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <p className="text-xs leading-5 text-slate-500">
            Masukkan URL halaman aplikasi Pisjo
            Market di Apple App Store. URL harus
            menggunakan HTTPS.
          </p>
        </div>

        {/* ===================================================
            STATUS
            =================================================== */}

        {message ? (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {/* ===================================================
            FOOTER
            =================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Pengaturan ini hanya mengatur tautan
            App Store. File aplikasi iOS dikelola
            melalui Apple App Store.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Menyimpan..."
              : "Simpan Pengaturan"}
          </button>
        </div>
      </form>
    </section>
  );
}