"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useRef } from "react";

interface LandingTestimonialItem {
  name: string;
  role?: string | null;
  message: string;
  rating?: number | null;
  avatar?: string | null;
  productImage?: string | null;
  productName?: string | null;
}

interface LandingTestimonialsSection {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  items?: LandingTestimonialItem[];
}

interface LandingTestimonialsProps {
  section?: LandingTestimonialsSection | null;
}

function RatingStars({ rating = 5 }: { rating?: number }) {
  const normalizedRating = Math.max(0, Math.min(5, rating));

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rating ${normalizedRating} dari 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < normalizedRating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-200"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function LandingTestimonials({
  section,
}: LandingTestimonialsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = section?.items ?? [];

  if (section?.enabled !== true || items.length === 0) {
    return null;
  }

  const averageRating =
    items.reduce((total, item) => total + (item.rating ?? 5), 0) / items.length;

  const displayedRating = averageRating.toFixed(1);

  const scrollTestimonials = (direction: "left" | "right") => {
    if (!scrollRef.current) {
      return;
    }

    const scrollAmount = scrollRef.current.clientWidth * 0.8;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      aria-labelledby="landing-testimonials-title"
      className="relative overflow-hidden bg-[#f3fbff] py-10 sm:py-14 lg:py-16"
    >
      {/* SOFT OCEAN BACKGROUND */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl" />

        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/80 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1370px] px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* EYEBROW */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-600 sm:text-xs">
              <Quote className="h-3.5 w-3.5" />
              {section.eyebrow || "Testimoni Pelanggan"}
            </div>

            {/* TITLE */}
            <h2
              id="landing-testimonials-title"
              className="text-2xl font-black leading-tight tracking-tight text-[#071b67] sm:text-3xl lg:text-[40px]"
            >
              {section.title || "Sudah Dipercaya Banyak Pelanggan"}
            </h2>

            {/* DESCRIPTION */}
            <p className="mt-2 max-w-3xl text-xs font-medium leading-5 text-[#7182ae] sm:text-base">
              {section.description ||
                "Review dari pelanggan yang sudah membeli produk kami."}
            </p>
          </div>

          {/* RATING SUMMARY */}
          <div className="hidden shrink-0 items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[0_5px_18px_rgba(25,86,145,0.12)] sm:flex sm:min-w-[205px]">
            <Star className="h-12 w-12 fill-amber-400 text-amber-400" />

            <div>
              <div className="text-3xl font-black leading-none text-[#071b67]">
                {displayedRating}/5
              </div>

              <div className="mt-1 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="mt-1 text-[10px] font-semibold text-[#7182ae]">
                dari ulasan pelanggan
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE RATING SUMMARY */}
        <div className="mt-4 flex w-fit items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm sm:hidden">
          <Star className="h-7 w-7 fill-amber-400 text-amber-400" />

          <div>
            <div className="text-xl font-black leading-none text-[#071b67]">
              {displayedRating}/5
            </div>

            <div className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="h-3 w-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>

          <span className="text-[10px] font-semibold text-[#7182ae]">
            dari ulasan pelanggan
          </span>
        </div>

        {/* CAROUSEL CONTROLS */}
        <div className="mt-5 flex justify-end gap-2 sm:mt-6">
          <button
            type="button"
            onClick={() => scrollTestimonials("left")}
            aria-label="Testimoni sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => scrollTestimonials("right")}
            aria-label="Testimoni berikutnya"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-100 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* TESTIMONIAL CARDS */}
        <div
          ref={scrollRef}
          className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none] sm:mt-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden"
        >
          {items.slice(0, 5).map((item, index) => {
            const rating = item.rating ?? 5;

            return (
              <article
                key={`${item.name}-${index}`}
                className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/90 bg-white shadow-[0_5px_18px_rgba(25,86,145,0.10)] sm:w-auto"
              >
                {/* CARD CONTENT */}
                <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
                  {/* RATING */}
                  <RatingStars rating={rating} />

                  {/* REVIEW */}
                  <p className="mt-3 line-clamp-5 min-h-[105px] text-xs font-semibold leading-5 text-[#27386e] sm:text-[13px]">
                    {"“"}
                    {item.message}
                    {"”"}
                  </p>
                </div>

                {/* PRODUCT IMAGE */}
                <div className="relative mx-3 aspect-[1.65] overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-blue-100">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName || "Produk PISJO"}
                      fill
                      sizes="(max-width: 639px) 240px, (max-width: 1023px) 30vw, 18vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FishPlaceholder />
                    </div>
                  )}
                </div>

                {/* CUSTOMER INFORMATION */}
                <div className="flex items-center gap-2.5 px-4 py-3">
                  {item.avatar ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm">
                      <Image
                        src={item.avatar}
                        alt={item.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200 text-xs font-black text-blue-700">
                      {getInitials(item.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[#10215e] sm:text-sm">
                      {item.name}
                    </p>

                    <p className="truncate text-[10px] font-semibold text-[#8a9bc0] sm:text-xs">
                      {item.productName || item.role || "Pelanggan PISJO"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FishPlaceholder() {
  return (
    <svg
      viewBox="0 0 160 90"
      className="h-16 w-28 text-sky-300"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 45C50 22 88 20 112 45C88 70 50 68 32 45Z"
        fill="currentColor"
        opacity="0.65"
      />

      <path d="M112 45L143 24V66L112 45Z" fill="currentColor" opacity="0.8" />

      <circle cx="86" cy="39" r="4" fill="white" />

      <path
        d="M48 45H95"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
