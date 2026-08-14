import Link from "next/link";

import {
  ArrowRight,
  Check,
  Fish,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";

import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";

import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";

/**
 * ============================================================
 * DATA
 * ============================================================
 */

const categories = [
  {
    title: "Ikan Segar",
    description:
      "Pilihan ikan segar berkualitas untuk kebutuhan rumah tangga dan bisnis.",
    icon: Fish,
  },
  {
    title: "Seafood",
    description:
      "Berbagai pilihan seafood segar yang siap untuk Anda pesan.",
    icon: ShoppingBag,
  },
  {
    title: "Produk Olahan",
    description:
      "Produk seafood olahan praktis dengan kualitas terbaik.",
    icon: Fish,
  },
];

const benefits = [
  {
    title: "Produk Berkualitas",
    description:
      "Produk dipilih dan dikelola untuk memberikan kualitas terbaik.",
    icon: ShieldCheck,
  },
  {
    title: "Pemesanan Mudah",
    description:
      "Temukan produk, masukkan ke keranjang, dan selesaikan pesanan dengan mudah.",
    icon: ShoppingBag,
  },
  {
    title: "Pengiriman Terpercaya",
    description:
      "Informasi pengiriman dan pesanan dapat dipantau dengan lebih mudah.",
    icon: Truck,
  },
];

/**
 * ============================================================
 * HOME PAGE
 * ============================================================
 */

export default function Home() {

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <DynamicSiteHeader activePage="home" />

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.12),transparent_28%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          {/* ================================================== */}
          {/* HERO CONTENT */}
          {/* ================================================== */}

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />

              Marketplace Seafood Modern
            </div>

            <h1 className="mt-7 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
              Seafood segar

              <span className="block text-cyan-600">
                untuk kebutuhan Anda.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Temukan berbagai pilihan ikan dan seafood berkualitas
              dengan pengalaman belanja yang lebih mudah, cepat,
              dan nyaman.
            </p>

            {/* ================================================== */}
            {/* SEARCH CTA */}
            {/* ================================================== */}

            <Link
              href="/products"
              className="group mt-9 flex max-w-2xl items-center gap-4 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5 transition hover:border-cyan-200 hover:shadow-2xl"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-cyan-50 group-hover:text-cyan-600">
                <Search className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700">
                  Cari produk seafood
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                  Ikan, udang, cumi, kerang, dan lainnya
                </p>
              </div>

              <div className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition group-hover:bg-cyan-600">
                Cari

                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>

            {/* ================================================== */}
            {/* CTA */}
            {/* ================================================== */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-7 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mulai Belanja

                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Buat Akun
              </Link>
            </div>

            {/* ================================================== */}
            {/* TRUST */}
            {/* ================================================== */}

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-600" />

                Produk pilihan
              </div>

              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-600" />

                Pemesanan mudah
              </div>

              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-cyan-600" />

                Pengiriman terpercaya
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* HERO VISUAL */}
          {/* ================================================== */}

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-cyan-200/30 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-linear-to-br from-cyan-50 via-white to-slate-100 p-5 shadow-2xl shadow-slate-900/10 sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.12),transparent_32%)]" />

              <div className="relative">
                {/* HERO CARD HEADER */}

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                      <Fish className="h-4 w-4" />

                      Fresh Selection
                    </div>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      Pilihan seafood hari ini
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                </div>

                {/* HERO PRODUCT */}

                <div className="mt-7 rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
                  <div className="flex items-center gap-5">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-linear-to-br from-cyan-100 to-sky-50 text-cyan-600">
                      <Fish className="h-12 w-12" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Tersedia
                      </span>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        Seafood Segar Pilihan
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Temukan berbagai produk berkualitas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* HERO STATS */}

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-slate-950">
                      Fresh
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Produk pilihan
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-slate-950">
                      Easy
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Belanja mudah
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-slate-950">
                      Safe
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Transaksi aman
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CATEGORY */}
      {/* ====================================================== */}

      <section className="border-y border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">
                Jelajahi Produk
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Temukan kategori yang Anda butuhkan
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Pilih berbagai kategori produk seafood untuk
                menemukan produk yang sesuai dengan kebutuhan Anda.
              </p>
            </div>

            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
              Lihat Semua Produk

              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.title}
                  href="/products"
                  className="group rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-600 group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-slate-900">
                    {category.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {category.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-cyan-600">
                    Jelajahi Produk

                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* BENEFITS */}
      {/* ====================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Users className="h-6 w-6" />
              </div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">
                Mengapa Fish Market
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Pengalaman belanja seafood yang lebih sederhana.
              </h2>

              <p className="mt-5 max-w-xl leading-8 text-slate-600">
                Kami membangun platform yang membantu Anda
                menemukan produk, melakukan pemesanan, dan
                mengelola kebutuhan seafood dengan lebih mudah.
              </p>

              <Link
                href="/customer"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mulai Sekarang

                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="mt-6 font-bold text-slate-900">
                      {benefit.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CTA */}
      {/* ====================================================== */}

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-16 text-white sm:px-12 sm:py-20">
          <div className="relative">
            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                Siap Mulai?
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                Temukan produk seafood pilihan Anda sekarang.
              </h2>

              <p className="mt-5 max-w-2xl leading-8 text-slate-300">
                Jelajahi berbagai produk yang tersedia dan mulai
                pengalaman belanja Anda bersama Fish Market.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-cyan-400 px-7 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Lihat Produk

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

     <DynamicSiteFooter />
    </main>
  );
}