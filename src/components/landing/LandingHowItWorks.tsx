"use client";

import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  ShoppingCart,
  Truck,
} from "lucide-react";

interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    number: 1,
    title: "Pilih Produk",
    description: "Cari ikan atau seafood favorit Anda.",
    icon: ShoppingCart,
  },
  {
    number: 2,
    title: "Pilih Berat & Kondisi",
    description: "Pilih varian berat dan opsi dibersihkan.",
    icon: ClipboardList,
  },
  {
    number: 3,
    title: "Checkout",
    description: "Isi alamat dan selesaikan pembayaran.",
    icon: CreditCard,
  },
  {
    number: 4,
    title: "Pesanan Diproses",
    description: "Kami siapkan dan kirim ke alamat Anda.",
    icon: Truck,
  },
];

export default function LandingHowItWorks() {
  return (
    <section
      aria-labelledby="landing-how-it-works-title"
      className="relative isolate overflow-hidden bg-[#eaf7ff] py-10 sm:py-14 lg:py-16"
    >
      {/* OCEAN BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* TOP LEFT WAVE */}
        <div className="absolute -left-[18%] -top-[58%] h-[105%] w-[70%] rounded-[50%] bg-sky-300/55 blur-3xl" />

        {/* TOP RIGHT WAVE */}
        <div className="absolute -right-[18%] -top-[58%] h-[105%] w-[70%] rounded-[50%] bg-blue-300/45 blur-3xl" />

        {/* CENTER LIGHT */}
        <div className="absolute left-1/2 -top-[30%] h-[90%] w-[70%] -translate-x-1/2 rounded-full bg-white/90 blur-3xl" />

        {/* BOTTOM LIGHT */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-sky-200/75 to-transparent" />

        {/* SOFT HORIZONTAL WAVE */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1370px] px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          {/* EYEBROW */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-blue-600 shadow-sm backdrop-blur-sm sm:text-xs">
            <ShoppingCart className="h-3.5 w-3.5" />
            Cara Belanja
          </div>

          {/* TITLE */}
          <h2
            id="landing-how-it-works-title"
            className="text-2xl font-black leading-tight tracking-tight text-[#071b67] sm:text-3xl lg:text-[42px]"
          >
            Mudah, Cepat dan Praktis
          </h2>

          {/* DESCRIPTION */}
          <p className="mt-2 text-xs font-medium leading-5 text-[#7182ae] sm:text-base">
            Belanja ikan dan seafood di PISJO hanya dalam beberapa langkah.
          </p>
        </div>

        {/* STEPS */}
        <div className="relative mt-7 sm:mt-9">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-5">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative">
                  {/* STEP CARD */}
                  <article className="relative flex min-h-[205px] flex-col rounded-2xl border border-white/90 bg-white/95 px-3 pb-4 pt-5 shadow-[0_8px_24px_rgba(36,112,190,0.10)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,112,190,0.18)] sm:min-h-[215px] sm:px-5 sm:pb-5 sm:pt-6 lg:min-h-[215px]">
                    {/* STEP NUMBER */}
                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#087cf5] text-lg font-black text-white shadow-[0_4px_10px_rgba(8,124,245,0.20)] sm:left-5 sm:top-5 sm:h-12 sm:w-12 sm:text-xl">
                      {step.number}
                    </div>

                    {/* ICON */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-50 text-blue-600 sm:h-[76px] sm:w-[76px]">
                      <Icon
                        className="h-8 w-8 stroke-[2.2] sm:h-9 sm:w-9"
                        aria-hidden="true"
                      />
                    </div>

                    {/* STEP TITLE */}
                    <h3 className="mt-4 text-center text-sm font-black leading-5 tracking-tight text-[#10215e] sm:text-lg">
                      {step.title}
                    </h3>

                    {/* STEP DESCRIPTION */}
                    <p className="mt-2 text-center text-[11px] font-medium leading-5 text-[#7182ae] sm:text-sm sm:leading-6">
                      {step.description}
                    </p>
                  </article>

                  {/* DESKTOP ARROW */}
                  {index < howItWorksSteps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-[#087cf5] lg:block"
                    >
                      <ArrowRight className="h-7 w-7 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
