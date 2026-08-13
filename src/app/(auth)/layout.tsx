import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | Fish Market Platform",
  },
  description: "Authentication - Fish Market Platform",
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side */}
        <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-cyan-700 via-sky-700 to-blue-900 p-16 text-white">
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <span className="text-xl font-bold">FM</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Fish Market Platform
                </h1>

                <p className="text-sm text-white/80">
                  Enterprise Seafood Management System
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-4xl font-bold leading-tight">
              Digitalisasi Bisnis Perikanan
              <br />
              Menjadi Lebih Modern.
            </h2>

            <p className="mt-6 text-lg text-white/80 leading-8">
              Kelola produk, kategori, pelanggan, pesanan,
              pembayaran, dan operasional marketplace ikan
              dalam satu platform enterprise yang aman,
              cepat, dan mudah digunakan.
            </p>
          </div>

          <div className="text-sm text-white/70">
            © {new Date().getFullYear()} Fish Market Platform
          </div>
        </section>

        {/* Right Side */}
        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}