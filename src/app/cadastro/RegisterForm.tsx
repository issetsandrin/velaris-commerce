"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { UserRoundPlus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { safeNext } from "@/components/auth/safeNext";
import { useCart } from "@/components/cart/CartContext";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/Icon";
import styles from "@/components/auth/AuthCard.module.css";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { register, loginWithGoogle } = useAuth();
  const { token: cartToken } = useCart();
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await register(
        {
          nome: String(form.get("nome") ?? ""),
          email: String(form.get("email") ?? ""),
          senha: String(form.get("senha") ?? ""),
          senha_confirmation: String(form.get("senha_confirmation") ?? ""),
        },
        cartToken,
      );
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
        <Icon icon={UserRoundPlus} size={30} />
        <h1 className={styles.title}>Criar conta</h1>
        <p className={styles.lead}>Leva um minuto. Seu carrinho atual vem junto.</p>
      </div>

      <GoogleSignInButton text="signup_with" onCredential={handleGoogle} disabled={submitting} />

      <p className={styles.divider}>ou com e-mail</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field label="Nome completo" name="nome" autoComplete="name" required errors={fieldErrors.nome} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
        <Field label="Senha, com pelo menos 8 caracteres" name="senha" type="password" autoComplete="new-password" required minLength={8} errors={fieldErrors.senha} />
        <Field label="Confirmar senha" name="senha_confirmation" type="password" autoComplete="new-password" required errors={fieldErrors.senha_confirmation} />
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
          {submitting ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className={styles.alt}>
        Já tem conta?{" "}
        <Link href={`/entrar${nextQuery}`} className="link-underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
