"use client";

import { Fish } from "lucide-react";

interface AuthHeaderProps {
  title: string;
  description?: string;
}

export function AuthHeader({
  title,
  description,
}: AuthHeaderProps) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <div
        className="
          mx-auto
          mb-4
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-[var(--pisjo-primary)]
          text-white
          shadow-lg
          shadow-[rgba(7,136,232,0.22)]
          ring-4
          ring-[var(--pisjo-soft-blue)]
          sm:mb-5
          sm:h-16
          sm:w-16
        "
      >
        <Fish
          aria-hidden="true"
          className="h-7 w-7 sm:h-8 sm:w-8"
        />
      </div>

      <h1
        className="
          text-2xl
          font-bold
          tracking-tight
          text-[var(--pisjo-navy)]
          sm:text-3xl
        "
      >
        {title}
      </h1>

      {description ? (
        <p
          className="
            mx-auto
            mt-2
            max-w-sm
            text-sm
            leading-6
            text-[var(--pisjo-text-secondary)]
            sm:mt-3
          "
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
