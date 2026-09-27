import {
  redirect,
} from "next/navigation";

import {
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  auth,
} from "@/auth";

import UserService from "@/services/user/user.service";

import EntityAvatar from "@/components/admin/avatar/EntityAvatar";

import ProfileForm from "@/components/admin/profile/ProfileForm";

function getInitials(
  name: string | null
) {
  return (name ?? "U")
    .split(" ")
    .map(
      (word) =>
        word.charAt(0)
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

export default async function AdminProfilePage() {
  const session =
    await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user =
    await UserService.getById(
      session.user.id
    );

  if (!user) {
    redirect("/login");
  }

  const joinedAt =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    ).format(
      user.createdAt
    );

  const roleLabel =
    formatRole(
      String(user.role)
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <User className="h-6 w-6 text-slate-700" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Profil Saya
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Kelola informasi akun dan kontak Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

          {/* PROFILE */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            {/* PROFILE HEADER */}
            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
              <EntityAvatar
                src={user.avatar}
                alt={user.name ?? "Profile"}
                fallback={getInitials(
                  user.name
                )}
                className="h-16 w-16"
              />

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-900">
                  {user.name ?? "User"}
                </h2>

                <p className="truncate text-sm text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Informasi Pribadi
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Perbarui nama dan nomor WhatsApp yang digunakan sebagai kontak admin.
              </p>
            </div>

            <ProfileForm
              name={
                user.name ?? ""
              }
              email={
                user.email
              }
              phone={
                user.phone ?? null
              }
              role={
                String(user.role)
              }
            />
          </section>

          {/* ACCOUNT INFORMATION */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-base font-semibold text-slate-900">
              Informasi Akun
            </h2>

            <div className="mt-5 space-y-5">

              {/* STATUS */}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Status Akun
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {user.isActive
                      ? "Aktif"
                      : "Tidak Aktif"}
                  </p>
                </div>
              </div>

              {/* ROLE */}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <ShieldCheck className="h-4 w-4 text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* JOINED */}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <CalendarDays className="h-4 w-4 text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Bergabung Sejak
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {joinedAt}
                  </p>
                </div>
              </div>

            </div>

            {/* WAPI INFORMATION */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Kontak Notifikasi
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Nomor WhatsApp pada profile ini disiapkan sebagai sumber kontak admin untuk sistem notifikasi WAPI Pisjo Market.
              </p>
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}