"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LogIn, MailCheck, MailWarning } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthForm } from "@/components/auth/useAuthForm";
import { safeNext } from "@/components/auth/safeNext";
import { useCart } from "@/components/cart/CartContext";
import { Field } from "@/components/form/Field";
import { Icon } from "@/components/Icon";
import { ApiError, isTwoFactor, resendConfirmationLink, resendLoginCode, type TwoFactorChallenge } from "@/lib/api";
import styles from "@/components/auth/AuthCard.module.css";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { login, loginWithGoogle } = useAuth();
  const { token: cartToken } = useCart();
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const [desafio, setDesafio] = useState<TwoFactorChallenge | null>(null);
  // Conta criada mas ainda sem confirmar: a entrada é recusada com 403.
  const [pendente, setPendente] = useState<string | null>(null);
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    void run(async () => {
      let resposta;

      try {
        resposta = await login({ email, senha: String(form.get("senha") ?? ""), lembrar: form.get("lembrar") === "on" }, cartToken);
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 403) {
          setPendente(email);
          return;
        }
        throw erro;
      }

      // Com senha certa o login não termina aqui: falta o código do e-mail.
      if (isTwoFactor(resposta)) {
        setDesafio(resposta);
        return;
      }

      router.push(next);
    });
  }

  function handleGoogle(credential: string) {
    void run(async () => {
      await loginWithGoogle(credential, cartToken);
      router.push(next);
    });
  }

  if (pendente) {
    return <PendingStep email={pendente} onBack={() => setPendente(null)} />;
  }

  if (desafio) {
    return <CodeStep desafio={desafio} onChange={setDesafio} onDone={() => router.push(next)} onBack={() => setDesafio(null)} />;
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={LogIn} size={30} />
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.lead}>
          {next === "/checkout"
            ? "É necessário entrar na conta para finalizar a compra."
            : "Bom te ver de novo. Seus pedidos e seu carrinho estão aqui."}
        </p>
      </div>

      <GoogleSignInButton text="signin_with" onCredential={handleGoogle} disabled={submitting} />

      <p className={styles.divider}>ou com e-mail</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required errors={fieldErrors.email} />
        <Field label="Senha" name="senha" type="password" autoComplete="current-password" required errors={fieldErrors.senha} />
        <div className={styles.options}>
          <label className={styles.remember}>
            <input type="checkbox" name="lembrar" />
            Manter logado
          </label>
          <Link href="/esqueci-senha" className="link-underline">
            Esqueci minha senha
          </Link>
        </div>
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

/** Segundo passo: o código de seis dígitos que chegou por e-mail. */
function CodeStep({
  desafio,
  onChange,
  onDone,
  onBack,
}: {
  desafio: TwoFactorChallenge;
  onChange: (desafio: TwoFactorChallenge) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const { loginWithCode } = useAuth();
  const { token: cartToken } = useCart();
  const { submitting, formError, fieldErrors, run } = useAuthForm();
  const [codigo, setCodigo] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const espera = useCountdown(desafio.expiraEm);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await loginWithCode({ desafio: desafio.desafio, codigo }, cartToken);
      onDone();
    });
  }

  async function reenviar() {
    setReenviando(true);
    setAviso(null);
    try {
      onChange(await resendLoginCode(desafio.desafio));
      setCodigo("");
      setAviso("Enviamos um código novo.");
    } catch (error) {
      setAviso(error instanceof ApiError ? error.message : "Não foi possível enviar outro código.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={MailCheck} size={30} />
        <h1 className={styles.title}>Confirme que é você</h1>
        <p className={styles.lead}>
          Enviamos um código de seis dígitos para <strong>{desafio.email}</strong>. Ele serve uma vez só.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.codeField}>
          <span>Código de acesso</span>
          <input
            className={styles.code}
            value={codigo}
            onChange={(event) => setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={fieldErrors.codigo ? true : undefined}
            autoFocus
          />
          {fieldErrors.codigo?.map((erro) => (
            <span key={erro} className={styles.codeError}>
              {erro}
            </span>
          ))}
        </label>

        <p className={styles.hint}>
          {espera > 0 ? `O código expira em ${formatarEspera(espera)}` : "Este código expirou. Peça outro abaixo."}
        </p>

        {/* Um campo só: o erro dele basta, sem repetir "confira os campos". */}
        {formError && !fieldErrors.codigo && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        {aviso && (
          <p className={styles.hint} role="status">
            {aviso}
          </p>
        )}

        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting || codigo.length < 6}>
          {submitting ? "Conferindo…" : "Entrar"}
        </button>
      </form>

      <div className={styles.codeActions}>
        <button type="button" className="link-underline" onClick={reenviar} disabled={reenviando}>
          {reenviando ? "Enviando…" : "Enviar outro código"}
        </button>
        <button type="button" className={`link-underline ${styles.codeBack}`} onClick={onBack}>
          <Icon icon={ArrowLeft} size={14} />
          Usar outro e-mail
        </button>
      </div>
    </AuthLayout>
  );
}

/** Conta criada e ainda não confirmada: sem link aberto, não há entrada. */
function PendingStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function reenviar() {
    setEnviando(true);
    setAviso(null);
    try {
      setAviso((await resendConfirmationLink(email)).message);
    } catch (erro) {
      setAviso(erro instanceof ApiError ? erro.message : "Não foi possível enviar outro link agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={MailWarning} size={30} />
        <h1 className={styles.title}>Confirme seu e‑mail</h1>
        <p className={styles.lead}>
          A conta de <strong>{email}</strong> existe, mas ainda não foi confirmada. Abra o link que enviamos e entre em
          seguida.
        </p>
      </div>

      <p className={styles.hint}>Se o link não chegou, veja a pasta de spam ou peça outro abaixo.</p>

      {aviso && (
        <p className={styles.hint} role="status">
          {aviso}
        </p>
      )}

      <div className={styles.codeActions}>
        <button type="button" className="link-underline" onClick={reenviar} disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar outro link"}
        </button>
        <button type="button" className={`link-underline ${styles.codeBack}`} onClick={onBack}>
          <Icon icon={ArrowLeft} size={14} />
          Usar outro e-mail
        </button>
      </div>
    </AuthLayout>
  );
}

/** Segundos que faltam até o código vencer, contados na tela. */
function useCountdown(ate: string): number {
  const restante = useCallback(() => Math.max(0, Math.round((new Date(ate).getTime() - Date.now()) / 1000)), [ate]);
  const [segundos, setSegundos] = useState(restante);

  // Código novo, contagem nova: ajuste na renderização, não num efeito.
  const [alvoAnterior, setAlvoAnterior] = useState(ate);
  if (alvoAnterior !== ate) {
    setAlvoAnterior(ate);
    setSegundos(restante());
  }

  useEffect(() => {
    const timer = window.setInterval(() => setSegundos(restante()), 1000);
    return () => window.clearInterval(timer);
  }, [restante]);

  return segundos;
}

/** Contagem regressiva no formato de relógio: 9:39, 0:40. */
function formatarEspera(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return `${minutos}:${String(resto).padStart(2, "0")}`;
}
