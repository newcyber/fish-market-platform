"use client";

import { useEffect } from "react";

import { toast } from "sonner";

import type { ActionResult } from "@/types/action-result";

export function useActionToast(
  state: ActionResult | null
) {
  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success(
        state.message ??
          "Berhasil."
      );

      return;
    }

    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);
}