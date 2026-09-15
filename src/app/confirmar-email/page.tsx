import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmEmail } from "./ConfirmEmail";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmail />
    </Suspense>
  );
}
