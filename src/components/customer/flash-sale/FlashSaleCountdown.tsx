"use client";

import {
  useEffect,
  useState,
} from "react";

interface FlashSaleCountdownProps {
  endsAt:
    string |
    Date;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

/**
 * ==========================================================
 * CALCULATE TIME REMAINING
 * ==========================================================
 */

function getTimeRemaining(
  endsAt:
    string |
    Date
): TimeRemaining {
  const endTime =
    new Date(
      endsAt
    ).getTime();

  const now =
    Date.now();

  const difference =
    Math.max(
      0,
      endTime - now
    );

  if (
    difference <= 0
  ) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  const totalSeconds =
    Math.floor(
      difference / 1000
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) / 60
    );

  const seconds =
    totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,
    expired: false,
  };
}

/**
 * ==========================================================
 * PAD NUMBER
 * ==========================================================
 */

function padNumber(
  value: number
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}

/**
 * ==========================================================
 * FLASH SALE COUNTDOWN
 * ==========================================================
 */

export function FlashSaleCountdown({
  endsAt,
}: FlashSaleCountdownProps) {
  const [
    timeRemaining,
    setTimeRemaining,
  ] = useState<
    TimeRemaining | null
  >(null);

  /**
   * ========================================================
   * COUNTDOWN TIMER
   * ========================================================
   */

  useEffect(() => {
    function updateCountdown() {
      const nextTimeRemaining =
        getTimeRemaining(
          endsAt
        );

      setTimeRemaining(
        nextTimeRemaining
      );
    }

    updateCountdown();

    const interval =
      window.setInterval(
        updateCountdown,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    endsAt,
  ]);

  /**
   * ========================================================
   * PREVENT HYDRATION MISMATCH
   * ========================================================
   */

  if (
    timeRemaining === null
  ) {
    return (
      <div
        className="
          h-8
          w-42.5
          animate-pulse
          rounded-md
          bg-white/20
        "
      />
    );
  }

  /**
   * ========================================================
   * EXPIRED
   * ========================================================
   */

  if (
    timeRemaining.expired
  ) {
    return (
      <div
        className="
          flex
          items-center
          gap-2
          text-sm
          font-semibold
          text-white
        "
      >
        <span>
          Flash Sale telah berakhir
        </span>
      </div>
    );
  }

  /**
   * ========================================================
   * COUNTDOWN DISPLAY
   * ========================================================
   */

  return (
    <div
      className="
        flex
        items-center
        gap-2
        text-white
      "
    >
      <span
        className="
          hidden
          text-xs
          font-medium
          uppercase
          tracking-wide
          sm:inline
        "
      >
        Berakhir dalam
      </span>

      <div
        className="
          flex
          items-center
          gap-1
        "
      >
        {/* HOURS */}

        <span
          className="
            inline-flex
            min-w-8
            items-center
            justify-center
            rounded
            bg-slate-950
            px-1.5
            py-1
            font-mono
            text-sm
            font-bold
            leading-none
            text-white
          "
        >
          {padNumber(
            timeRemaining.hours
          )}
        </span>

        <span
          className="
            font-bold
            text-white
          "
        >
          :
        </span>

        {/* MINUTES */}

        <span
          className="
            inline-flex
            min-w-8
            items-center
            justify-center
            rounded
            bg-slate-950
            px-1.5
            py-1
            font-mono
            text-sm
            font-bold
            leading-none
            text-white
          "
        >
          {padNumber(
            timeRemaining.minutes
          )}
        </span>

        <span
          className="
            font-bold
            text-white
          "
        >
          :
        </span>

        {/* SECONDS */}

        <span
          className="
            inline-flex
            min-w-8
            items-center
            justify-center
            rounded
            bg-slate-950
            px-1.5
            py-1
            font-mono
            text-sm
            font-bold
            leading-none
            text-white
          "
        >
          {padNumber(
            timeRemaining.seconds
          )}
        </span>
      </div>
    </div>
  );
}