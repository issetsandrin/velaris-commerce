"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/Icon";
import { forgotPassword } from "@/lib/api";
import styles from "@/components/auth/AuthCard.module.css";

export function ForgotForm() {
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    void run(async () => {
      await forgotPassword(email);
      setEnviadoPara(email);
    });
  }

  if (enviadoPara) {
    return (
      <AuthLayout>
        <div>
          <Icon icon={MailCheck} size={30} />
          <h1 className={styles.title}>Confira seu e‑mail</h1>
          <p className={styles.lead}>
            Se houver uma conta com <strong>{enviadoPara}</strong>, o link para escolher uma senha nova chega em
            instantes. Ele vale por uma hora.
          </p>
        </div>

        <p className={styles.alt}>
          <Link href="/entrar" className="link-underline">
            Voltar para a entrada
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={KeyRound} size={30} />
        <h1 className={styles.title}>Esqueci minha senha</h1>
        <p className={styles.lead}>Informe o e-mail da sua conta e enviamos um link para você escolher outra senha.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
          {submitting ? "Enviando…" : "Enviar link"}
        </button>
      </form>

      <p className={styles.alt}>
        Lembrou a senha?{" "}
        <Link href="/entrar" className="link-underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
