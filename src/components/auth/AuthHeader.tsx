import { Fish } from "lucide-react";

interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({
  title,
  description,
}: AuthHeaderProps) {
  return (
    <div
      className="
        mb-6
        flex
        flex-col
        items-center
        text-center
        sm:mb-8
      "
    >
      {/* BRAND ICON */}

      <div
        className="
          mb-4
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-cyan-600
          text-white
          shadow-lg
          shadow-cyan-600/20
          ring-4
          ring-cyan-50
          transition-transform
          duration-300
          hover:scale-105
          sm:h-16
          sm:w-16
        "
      >
        <Fish
          className="
            h-7
            w-7
            sm:h-8
            sm:w-8
          "
          strokeWidth={2}
        />
      </div>

      {/* TITLE */}

      <h1
        className="
          max-w-full
          text-2xl
          font-bold
          leading-tight
          tracking-tight
          text-slate-950
          sm:text-3xl
        "
      >
        {title}
      </h1>

      {/* DESCRIPTION */}

      <p
        className="
          mt-2
          max-w-sm
          px-2
          text-sm
          leading-6
          text-slate-500
          sm:px-0
        "
      >
        {description}
      </p>
    </div>
  );
}