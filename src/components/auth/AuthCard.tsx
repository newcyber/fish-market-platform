"use client";

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({
  children,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={[
        `
          w-full
          max-w-md
          overflow-hidden
          rounded-2xl
          border
          border-slate-200/80
          bg-white/95
          shadow-xl
          shadow-slate-900/5
          backdrop-blur-sm
          sm:rounded-3xl
        `,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardContent
        className="
          px-4
          py-6
          sm:px-6
          sm:py-8
          md:px-8
          md:py-10
        "
      >
        {children}
      </CardContent>
    </Card>
  );
}