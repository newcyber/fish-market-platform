"use client";

import Image from "next/image";
import { ChevronDown, CircleHelp, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface LandingFaqItem {
  question: string;
  answer: string;
}

interface LandingFaqSection {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  backgroundImage?: string | null;
  illustrationImage?: string | null;
  illustrationAlt?: string | null;
  items?: LandingFaqItem[];
}

interface LandingFaqProps {
  section?: LandingFaqSection | null;
}

export default function LandingFaq({ section }: LandingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = section?.items ?? [];

  if (section?.enabled !== true || items.length === 0) {
    return null;
  }

  const toggleFaq = (index: number) => {
    setOpenIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  const backgroundImage = section.backgroundImage || null;
  const illustrationImage = section.illustrationImage || null;

  return (
    <section
      aria-labelledby="landing-faq-title"
      className="relative isolate overflow-hidden bg-white py-10 sm:py-14 lg:py-16"
    >
      {/* BACKGROUND IMAGE */}
      {backgroundImage && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <Image
            src={backgroundImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
          />

          <div className="absolute inset-0 bg-white/65" />
        </div>
      )}

      {/* SOFT BACKGROUND DECORATION */}
      {!backgroundImage && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-sky-50/50 to-white"
        />
      )}

      <div className="relative mx-auto w-full max-w-[1370px] px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            {/* EYEBROW */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-600 sm:text-xs">
              <CircleHelp className="h-3.5 w-3.5" />
              {section.eyebrow || "Pertanyaan yang Sering Ditanya"}
            </div>

            {/* TITLE */}
            <h2
              id="landing-faq-title"
              className="text-2xl font-black leading-tight tracking-tight text-[#071b67] sm:text-3xl lg:text-[40px]"
            >
              {section.title || "Masih Ada Pertanyaan?"}
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-2 max-w-2xl text-xs font-medium leading-5 text-[#7182ae] sm:text-base">
              {section.description ||
                "Berikut beberapa pertanyaan yang sering ditanyakan oleh pelanggan."}
            </p>
          </div>

          {/* ILLUSTRATION */}
          {illustrationImage && (
            <div className="relative mx-auto h-40 w-full max-w-[360px] shrink-0 sm:h-52 sm:max-w-[430px] lg:-mt-8 lg:mr-2 lg:h-64 lg:max-w-[470px]">
              <Image
                src={illustrationImage}
                alt={section.illustrationAlt || "Ilustrasi hadiah PISJO"}
                fill
                sizes="(max-width: 1023px) 90vw, 470px"
                className="object-contain object-center lg:object-right"
              />
            </div>
          )}
        </div>

        {/* FAQ GRID */}
        <div className="mt-6 grid gap-3 sm:mt-8 lg:grid-cols-2 lg:gap-x-5 lg:gap-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={`${item.question}-${index}`}
                className={`overflow-hidden rounded-xl border bg-white/95 shadow-[0_4px_16px_rgba(36,112,190,0.06)] transition ${
                  isOpen
                    ? "border-blue-200 shadow-[0_6px_20px_rgba(36,112,190,0.10)]"
                    : "border-sky-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  aria-controls={`landing-faq-answer-${index}`}
                  className="flex min-h-[54px] w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-sky-50/50 sm:min-h-[58px] sm:px-5"
                >
                  <span className="text-xs font-extrabold leading-5 text-[#26386e] sm:text-sm">
                    {item.question}
                  </span>

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-blue-600">
                    {isOpen ? (
                      <Minus className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`landing-faq-answer-${index}`}
                    className="border-t border-sky-50 px-4 pb-4 pt-3 sm:px-5"
                  >
                    <p className="text-xs font-medium leading-6 text-[#7182ae] sm:text-sm">
                      {item.answer}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
