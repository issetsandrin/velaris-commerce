import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPage() {
  return <ForgotForm />;
}
