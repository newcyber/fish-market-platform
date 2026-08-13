import type { ReactNode } from "react";

interface FormGridProps {
  children: ReactNode;

  columns?: 1 | 2 | 3;
}

export default function FormGrid({
  children,
  columns = 1,
}: FormGridProps) {
  const gridClass = {
    1: "grid gap-5",
    2: "grid gap-5 md:grid-cols-2",
    3: "grid gap-5 lg:grid-cols-3",
  };

  return (
    <div className={gridClass[columns]}>
      {children}
    </div>
  );
}