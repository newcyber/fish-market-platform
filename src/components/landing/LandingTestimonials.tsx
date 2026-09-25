"use client";

import { Quote, Star } from "lucide-react";

import type { LandingPageTestimonialsSectionConfig } from "@/repositories/landing-page/landing-page.types";

interface LandingTestimonialsProps {
  section?: LandingPageTestimonialsSectionConfig;
}

export default function LandingTestimonials({
  section,
}: LandingTestimonialsProps) {
  if (
    section?.enabled === false ||
    !section?.items ||
    section.items.length === 0
  ) {
    return null;
  }

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="relative overflow-hidden bg-[#f4fbff]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#8cddff]/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#ffe9a8]/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          {section.eyebrow ? (
            <p className="text-sm font-bold text-[var(--pisjo-primary)]">
              {section.eyebrow}
            </p>
          ) : null}

          {section.title ? (
            <h2
              id="testimonials-title"
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

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {section.items.map((item, index) => {
            const rating = Math.min(
              5,
              Math.max(0, Math.round(item.rating ?? 5)),
            );

            return (
              <article
                key={`${item.name}-${index}`}
                className="relative flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
              >
                <Quote className="h-8 w-8 text-[var(--pisjo-primary)]/25" />

                <div
                  className="mt-4 flex items-center gap-1"
                  aria-label={`Rating ${rating} dari 5`}
                >
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className={`h-4 w-4 ${
                        starIndex < rating
                          ? "fill-[#fbbf24] text-[#fbbf24]"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">
                  “{item.message}”
                </p>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="text-sm font-black text-[var(--pisjo-navy)]">
                    {item.name}
                  </p>

                  {item.role ? (
                    <p className="mt-1 text-xs text-slate-500">{item.role}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
