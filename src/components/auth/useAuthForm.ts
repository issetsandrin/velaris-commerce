"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";

/**
 * Estado compartilhado dos formulários de conta: envio, erro geral e erros por campo.
 */
export function useAuthForm() {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function run(action: () => Promise<void>) {
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await action();
    } catch (error) {
      if (error instanceof ApiError) {
        const hasFieldErrors = Boolean(error.errors && Object.keys(error.errors).length);
        setFieldErrors(error.errors ?? {});
        setFormError(hasFieldErrors ? "Confira os campos destacados." : error.message);
      } else {
        setFormError("Não foi possível concluir a operação. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, formError, fieldErrors, run };
}
