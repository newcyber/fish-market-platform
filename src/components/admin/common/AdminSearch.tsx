"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface AdminSearchProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function AdminSearch({
  value,
  placeholder = "Cari...",
  onChange,
  className,
}: AdminSearchProps) {
  return (
    <div
      className={`relative flex-1 ${
        className ?? ""
      }`}
    >
      <Search
        className="
          absolute
          left-3
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="pl-10"
      />
    </div>
  );
}