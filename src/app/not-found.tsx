import Link from "next/link";
import {
  Fish,
  Home,
  Waves,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-16">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-cyan-100/70" />

        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-blue-100/70" />

        <div className="absolute left-1/2 top-1/4 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300" />

        <div className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-blue-300" />

        <div className="absolute right-[20%] top-[22%] h-2.5 w-2.5 rounded-full bg-cyan-300" />

        <Waves className="absolute bottom-8 left-1/2 h-32 w-32 -translate-x-1/2 text-cyan-100/80" />
      </div>

      <div className="relative z-10 w-full max-w-xl text-center">
        {/* Fish icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-cyan-200 bg-white shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50">
            <Fish
              className="h-9 w-9 text-cyan-600"
              strokeWidth={1.8}
            />
          </div>
        </div>

        {/* Error code */}
        <p className="text-7xl font-bold tracking-tight text-slate-900 sm:text-8xl">
          404
        </p>

        <div className="mx-auto mt-5 max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Halaman Tidak Ditemukan
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            Sepertinya halaman yang Anda cari sudah dipindahkan,
            dihapus, atau alamatnya tidak tersedia.
          </p>
        </div>

        {/* Action */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Brand */}
        <div className="mt-10 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <Fish className="h-3.5 w-3.5 text-cyan-500" />
          <span>Pisjo Market</span>
        </div>
      </div>
    </main>
  );
}