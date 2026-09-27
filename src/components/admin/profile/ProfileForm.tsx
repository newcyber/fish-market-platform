"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  Loader2,
  Save,
  Smartphone,
  UserRound,
} from "lucide-react";

import {
  updateAdminProfileAction,
} from "@/actions/admin/update-profile";

interface ProfileFormProps {
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

function formatRole(
  role: string
) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

export default function ProfileForm({
  name,
  email,
  phone,
  role,
}: ProfileFormProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    currentName,
    setCurrentName,
  ] = useState(name);

  const [
    currentPhone,
    setCurrentPhone,
  ] = useState(
    phone ?? ""
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage(null);
    setError(null);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    startTransition(
      async () => {
        const result =
          await updateAdminProfileAction(
            formData
          );

        if (!result.success) {
          setError(
            result.message
          );
          return;
        }

        setMessage(
          result.message
        );
      }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* SUCCESS */}
      {message ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Berhasil
            </p>

            <p className="mt-0.5">
              {message}
            </p>
          </div>
        </div>
      ) : null}

      {/* ERROR */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">
            Gagal menyimpan
          </p>

          <p className="mt-0.5">
            {error}
          </p>
        </div>
      ) : null}

      {/* NAME */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nama Lengkap
        </label>

        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            id="name"
            name="name"
            type="text"
            value={currentName}
            onChange={(event) =>
              setCurrentName(
                event.target.value
              )
            }
            disabled={isPending}
            autoComplete="name"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
            placeholder="Nama lengkap"
          />
        </div>
      </div>

      {/* EMAIL */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          disabled
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
        />

        <p className="mt-2 text-xs text-slate-400">
          Email login tidak dapat diubah dari halaman profile.
        </p>
      </div>

      {/* PHONE */}
      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nomor WhatsApp
        </label>

        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            id="phone"
            name="phone"
            type="tel"
            value={currentPhone}
            onChange={(event) =>
              setCurrentPhone(
                event.target.value
              )
            }
            disabled={isPending}
            autoComplete="tel"
            inputMode="tel"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
            placeholder="628xxxxxxxxxx"
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Nomor ini akan menjadi data kontak WhatsApp
          untuk kebutuhan notifikasi admin Pisjo Market.
        </p>
      </div>

      {/* ROLE */}
      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Role
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {formatRole(role)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Role hanya dapat diubah melalui manajemen user.
          </p>
        </div>
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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