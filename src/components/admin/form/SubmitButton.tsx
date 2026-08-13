"use client";

import { Save } from "lucide-react";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  label?: string;
}

export default function SubmitButton({
  label = "Simpan",
}: SubmitButtonProps) {
  const { pending } =
    useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      <Save className="mr-2 h-4 w-4" />

      {pending
        ? "Menyimpan..."
        : label}
    </Button>
  );
}