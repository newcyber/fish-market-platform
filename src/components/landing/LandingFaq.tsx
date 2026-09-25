"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { LandingPageFaqSectionConfig } from "@/repositories/landing-page/landing-page.types";

interface LandingFaqProps {
  section?: LandingPageFaqSectionConfig;
}

export default function LandingFaq({ section }: LandingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (
    section?.enabled === false ||
    !section?.items ||
    section.items.length === 0
  ) {
    return null;
  }

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-white"
    >
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {section.eyebrow ? (
            <p className="text-sm font-bold text-[var(--pisjo-primary)]">
              {section.eyebrow}
            </p>
          ) : null}

          {section.title ? (
            <h2
              id="faq-title"
              className="mt-3 text-3xl font-black tracking-tight text-[var(--pisjo-navy)] sm:text-4xl"
            >
              {section.title}
            </h2>
          ) : null}

          {section.description ? (
            <p className="mt-4 text-base leading-7 text-[var(--pisjo-text-secondary)]">
              {section.description}
            </p>
          ) : null}
        </div>

        <div className="mt-10 space-y-3">
          {section.items.map((item, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;

            return (
              <div
                key={`${item.question}-${index}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() =>
                    setOpenIndex((current) =>
                      current === index ? null : index,
                    )
                  }
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                >
                  <span className="text-sm font-bold leading-6 text-[var(--pisjo-navy)] sm:text-base">
                    {item.question}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[var(--pisjo-primary)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen ? (
                  <div
                    id={answerId}
                    className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6"
                  >
                    <p className="text-sm leading-7 text-slate-600">
                      {item.answer}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
