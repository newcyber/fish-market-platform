"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ProductDescriptionProps {
  description: string;
}

const COLLAPSED_MAX_HEIGHT = 196;

export default function ProductDescription({
  description,
}: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] =
    useState(false);

  const descriptionRef =
    useRef<HTMLDivElement>(null);

  const normalizedDescription =
    description.trim();

  useEffect(() => {
    const element = descriptionRef.current;

    if (!element) {
      return;
    }

    const checkOverflow = () => {
      setIsOverflowing(
        element.scrollHeight >
          COLLAPSED_MAX_HEIGHT + 1
      );
    };

    checkOverflow();

    const resizeObserver =
      new ResizeObserver(checkOverflow);

    resizeObserver.observe(element);

    window.addEventListener(
      "resize",
      checkOverflow
    );

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener(
        "resize",
        checkOverflow
      );
    };
  }, [normalizedDescription]);

  if (!normalizedDescription) {
    return (
      <div
        className="
          flex
          items-center
          justify-center
          py-4
          text-sm
          text-slate-400
        "
      >
        Belum ada deskripsi produk.
      </div>
    );
  }

  const isCollapsed =
    isOverflowing && !expanded;

  return (
    <div>
      <div
        ref={descriptionRef}
        className="
          whitespace-pre-line
          text-sm
          leading-7
          text-slate-700
          transition-[max-height]
          duration-300
          ease-in-out
        "
        style={
          isCollapsed
            ? {
                maxHeight:
                  `${COLLAPSED_MAX_HEIGHT}px`,
                overflow: "hidden",
              }
            : undefined
        }
      >
        {normalizedDescription}
      </div>

      {isOverflowing && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() =>
              setExpanded(
                (current) => !current
              )
            }
            className="
              inline-flex
              min-h-9
              items-center
              gap-1.5
              rounded-lg
              text-sm
              font-semibold
              text-cyan-600
              transition-colors
              hover:text-cyan-700
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-cyan-500
              focus-visible:ring-offset-2
            "
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Sembunyikan
                <ChevronUp
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                Baca selengkapnya
                <ChevronDown
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
