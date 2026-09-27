"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";

import {
  ExternalLink,
  Camera,
  Link2,
  Loader2,
  Save,
  ShoppingBag,
  Smartphone,
  Store,
  Music2,
} from "lucide-react";

import { updateSocialStoreLinksAction } from "@/actions/admin/social-store-links/update-social-store-links";

interface SocialStoreLinksFormProps {
  initialValues: {
    googlePlayUrl: string;
    shopeeUrl: string;
    tokopediaUrl: string;
    tiktokUrl: string;
    instagramUrl: string;
  };
}

interface FormValues {
  googlePlayUrl: string;
  shopeeUrl: string;
  tokopediaUrl: string;
  tiktokUrl: string;
  instagramUrl: string;
}

export default function SocialStoreLinksForm({
  initialValues,
}: SocialStoreLinksFormProps) {
  const [values, setValues] =
    useState<FormValues>({
      googlePlayUrl:
        initialValues.googlePlayUrl ?? "",

      shopeeUrl:
        initialValues.shopeeUrl ?? "",

      tokopediaUrl:
        initialValues.tokopediaUrl ?? "",

      tiktokUrl:
        initialValues.tiktokUrl ?? "",

      instagramUrl:
        initialValues.instagramUrl ?? "",
    });

  const [message, setMessage] =
    useState("");

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [isPending, startTransition] =
    useTransition();

  const notificationRef =
    useRef<HTMLDivElement>(null);

  const updateValue = (
    field: keyof FormValues,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setMessage("");
    setIsSuccess(false);

    startTransition(async () => {
      const result =
        await updateSocialStoreLinksAction(
          values,
        );

      setMessage(result.message);
      setIsSuccess(result.success);

      requestAnimationFrame(() => {
        notificationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ================================================== */}
      {/* NOTIFICATION */}
      {/* ================================================== */}

      {message && (
        <div
          ref={notificationRef}
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      {/* ================================================== */}
      {/* GOOGLE PLAY */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Smartphone className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Google Play
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Link aplikasi Pisjo Market di Google Play.
            </p>
          </div>

        </div>

        <div className="mt-5">
          <label
            htmlFor="googlePlayUrl"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            URL Google Play
          </label>

          <input
            id="googlePlayUrl"
            type="url"
            value={values.googlePlayUrl}
            onChange={(event) =>
              updateValue(
                "googlePlayUrl",
                event.target.value,
              )
            }
            placeholder="https://play.google.com/store/apps/..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </section>

      {/* ================================================== */}
      {/* MARKETPLACE */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ShoppingBag className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Marketplace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Link toko resmi Pisjo Market pada marketplace.
            </p>
          </div>

        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          {/* SHOPEE */}

          <div>
            <label
              htmlFor="shopeeUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Shopee
            </label>

            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="shopeeUrl"
                type="url"
                value={values.shopeeUrl}
                onChange={(event) =>
                  updateValue(
                    "shopeeUrl",
                    event.target.value,
                  )
                }
                placeholder="https://shopee.co.id/..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          {/* TOKOPEDIA */}

          <div>
            <label
              htmlFor="tokopediaUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tokopedia
            </label>

            <div className="relative">
              <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="tokopediaUrl"
                type="url"
                value={values.tokopediaUrl}
                onChange={(event) =>
                  updateValue(
                    "tokopediaUrl",
                    event.target.value,
                  )
                }
                placeholder="https://www.tokopedia.com/..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* SOCIAL MEDIA */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Link2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Social Media
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Link akun resmi social media Pisjo Market.
            </p>
          </div>

        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          {/* TIKTOK */}

          <div>
            <label
              htmlFor="tiktokUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              TikTok
            </label>

            <div className="relative">
              <Music2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="tiktokUrl"
                type="url"
                value={values.tiktokUrl}
                onChange={(event) =>
                  updateValue(
                    "tiktokUrl",
                    event.target.value,
                  )
                }
                placeholder="https://www.tiktok.com/@..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          {/* INSTAGRAM */}

          <div>
            <label
              htmlFor="instagramUrl"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Instagram
            </label>

            <div className="relative">
              <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="instagramUrl"
                type="url"
                value={values.instagramUrl}
                onChange={(event) =>
                  updateValue(
                    "instagramUrl",
                    event.target.value,
                  )
                }
                placeholder="https://www.instagram.com/..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ================================================== */}
      {/* SAVE */}
      {/* ================================================== */}

      <div className="flex justify-end">

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </button>

      </div>
    </form>
  );
}