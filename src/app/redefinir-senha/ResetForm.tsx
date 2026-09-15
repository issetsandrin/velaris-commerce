"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CircleCheckBig, LockKeyhole, TriangleAlert } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/Icon";
import { resetPassword } from "@/lib/api";
import styles from "@/components/auth/AuthCard.module.css";

export function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const [pronto, setPronto] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await resetPassword({
        token,
        email,
        senha: String(form.get("senha") ?? ""),
        senha_confirmation: String(form.get("senha_confirmation") ?? ""),
      });
      setPronto(true);
    });
  }

  // Link truncado ou digitado à mão: não adianta mostrar o formulário.
  if (!token || !email) {
    return (
      <AuthLayout>
        <div>
          <Icon icon={TriangleAlert} size={30} />
          <h1 className={styles.title}>Link incompleto</h1>
          <p className={styles.lead}>
            Este endereço não traz os dados da redefinição. Peça um link novo para continuar.
          </p>
        </div>

        <Link href="/esqueci-senha" className={`btn btn-primary ${styles.submit}`}>
          Pedir outro link
        </Link>
      </AuthLayout>
    );
  }

  if (pronto) {
    return (
      <AuthLayout>
        <div>
          <Icon icon={CircleCheckBig} size={30} />
          <h1 className={styles.title}>Senha alterada</h1>
          <p className={styles.lead}>
            Pronto. Por segurança, encerramos as sessões abertas em outros aparelhos: entre de novo com a senha nova.
          </p>
        </div>

        <button type="button" className={`btn btn-primary ${styles.submit}`} onClick={() => router.push("/entrar")}>
          Entrar na conta
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={LockKeyhole} size={30} />
        <h1 className={styles.title}>Escolher nova senha</h1>
        <p className={styles.lead}>
          Definindo a senha da conta <strong>{email}</strong>.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          label="Nova senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          errors={fieldErrors.senha}
        />
        <Field
          label="Repita a senha"
          name="senha_confirmation"
          type="password"
          autoComplete="new-password"
          required
          errors={fieldErrors.senha_confirmation}
        />
        {(formError || fieldErrors.token) && (
          <p className={styles.formError} role="alert">
            {fieldErrors.token?.[0] ?? formError}
          </p>
        )}
        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
          {submitting ? "Salvando…" : "Salvar senha"}
        </button>
      </form>

      <p className={styles.alt}>
        <Link href="/esqueci-senha" className="link-underline">
          Pedir outro link
        </Link>
      </p>
    </AuthLayout>
  );
}
