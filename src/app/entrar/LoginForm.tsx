"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { safeNext } from "@/components/auth/safeNext";
import { useCart } from "@/components/cart/CartContext";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/Icon";
import styles from "@/components/auth/AuthCard.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { login, loginWithGoogle } = useAuth();
  const { token: cartToken } = useCart();
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await login({ email: String(form.get("email") ?? ""), senha: String(form.get("senha") ?? "") }, cartToken);
      router.push(next);
    });
  }

  function handleGoogle(credential: string) {
    void run(async () => {
      await loginWithGoogle(credential, cartToken);
      router.push(next);
    });
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={LogIn} size={30} />
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.lead}>
          {next === "/checkout"
            ? "Entre na sua conta para finalizar a compra."
            : "Bom te ver de novo. Seus pedidos e seu carrinho estão aqui."}
        </p>
      </div>

      <GoogleSignInButton text="signin_with" onCredential={handleGoogle} disabled={submitting} />

      <p className={styles.divider}>ou com e-mail</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
        <Field label="Senha" name="senha" type="password" autoComplete="current-password" required errors={fieldErrors.senha} />
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className={styles.alt}>
        Ainda não tem conta?{" "}
        <Link href={`/cadastro${nextQuery}`} className="link-underline">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
