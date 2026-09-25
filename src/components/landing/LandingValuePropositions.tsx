"use client";

import { Fish, ShieldCheck, Smartphone, Truck } from "lucide-react";

interface ValueProposition {
  title: string;
  description: string;
  icon: typeof Fish;
}

const valuePropositions: ValueProposition[] = [
  {
    title: "Segar & Tanpa Pengawet",
    description:
      "Ikan dan seafood pilihan dengan kualitas terjaga untuk keluarga Anda.",
    icon: Fish,
  },
  {
    title: "Diproses dengan Higienis",
    description:
      "Produk disiapkan dengan proses yang bersih dan rapi sebelum dikirim.",
    icon: ShieldCheck,
  },
  {
    title: "Pengiriman Area Jogja",
    description:
      "Pesanan diproses dan dikirim langsung ke alamat Anda di wilayah Jogja.",
    icon: Truck,
  },
  {
    title: "Tanpa Perlu Download",
    description: "Belanja langsung lewat browser dengan mudah dan aman.",
    icon: Smartphone,
  },
];

interface LandingValuePropositionsProps {
  section?: {
    enabled?: boolean;
    eyebrow?: string;
    title?: string;
    description?: string;
    items?: Array<{ title: string; description: string; icon?: string }>;
  };
}

const iconMap = { Fish, ShieldCheck, Truck, Smartphone } as const;

export default function LandingValuePropositions({
  section,
}: LandingValuePropositionsProps) {
  if (section?.enabled === false) {
    return null;
  }

  const items = section?.items?.length
    ? section.items.map((item) => ({
        ...item,
        icon: iconMap[item.icon as keyof typeof iconMap] ?? Fish,
      }))
    : valuePropositions;

  return (
    <section
      aria-labelledby="landing-value-propositions-title"
      className="relative isolate overflow-hidden bg-[#eaf7ff] py-12 sm:py-16 lg:py-20"
    >
      {/* OCEAN BACKGROUND DECORATION */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* TOP OCEAN GLOW */}
        <div className="absolute -left-[12%] -top-[45%] h-[100%] w-[70%] rounded-[50%] bg-sky-300/50 blur-3xl" />

        <div className="absolute -right-[18%] -top-[38%] h-[95%] w-[70%] rounded-[50%] bg-blue-300/40 blur-3xl" />

        {/* CENTER LIGHT */}
        <div className="absolute left-1/2 top-0 h-[65%] w-[60%] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />

        {/* BOTTOM OCEAN ACCENTS */}
        <div className="absolute -bottom-[55%] -left-[15%] h-[95%] w-[75%] rounded-[50%] bg-sky-300/45 blur-3xl" />

        <div className="absolute -bottom-[55%] -right-[15%] h-[95%] w-[75%] rounded-[50%] bg-blue-200/55 blur-3xl" />

        {/* SOFT WAVES */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-300/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sky-200/70 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1370px] px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          {/* EYEBROW */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-blue-600 shadow-sm backdrop-blur-sm sm:text-xs">
            <Fish className="h-3.5 w-3.5" />
            {section?.eyebrow ?? "Keunggulan PISJO Market"}
          </div>

          {/* TITLE */}
          <h2
            id="landing-value-propositions-title"
            className="text-2xl font-black leading-tight tracking-tight text-[#071b67] sm:text-3xl lg:text-[42px]"
          >
            {section?.title ?? "Lebih dari sekadar belanja seafood"}
          </h2>

          {/* DESCRIPTION */}
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-[#7182ae] sm:text-base sm:leading-7">
            {section?.description ??
              "Nikmati pengalaman belanja seafood yang praktis dengan produk pilihan dan manfaat untuk pelanggan."}
          </p>
        </div>

        {/* BENEFIT CARDS */}
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 lg:mt-9 lg:grid-cols-4 lg:gap-5">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="flex min-h-[210px] flex-col items-center rounded-2xl border border-white/80 bg-white/95 px-2.5 py-4 text-center shadow-[0_8px_24px_rgba(36,112,190,0.10)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,112,190,0.18)] sm:min-h-[230px] sm:px-6 sm:py-6"
              >
                {/* ICON */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-50 text-blue-600 shadow-inner sm:h-[76px] sm:w-[76px]">
                  <Icon
                    className="h-7 w-7 stroke-[2.2] sm:h-9 sm:w-9"
                    aria-hidden="true"
                  />
                </div>

                {/* CARD TITLE */}
                <h3 className="mt-3 text-[11px] font-black leading-4 tracking-tight text-[#10215e] sm:mt-4 sm:text-lg sm:leading-5">
                  {item.title}
                </h3>

                {/* CARD DESCRIPTION */}
                <p className="mt-2 text-[10px] font-medium leading-4 text-[#7182ae] sm:text-sm sm:leading-6">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
