"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../Icon";
import { Spinner } from "../Spinner";
import { ApiError, setTwoFactor } from "@/lib/api";
import styles from "./Profile.module.css";

/**
 * Liga e desliga a verificação em dois passos. Ligada, cada entrada com senha
 * pede o código de seis dígitos que sai por e-mail.
 */
export function TwoFactorCard() {
  const { user, setUser } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!user) return null;

  async function alternar(ativo: boolean) {
    setSalvando(true);
    setErro(null);
    try {
      setUser((await setTwoFactor(ativo)).user);
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não foi possível salvar a preferência agora.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="dois-passos">
      <div className={styles.cardHead}>
        <div>
          <h2 id="dois-passos" className={`title-icon ${styles.cardTitle}`}>
            <Icon icon={ShieldCheck} size={22} />
            Verificação em dois passos
          </h2>
          <p className={styles.muted}>
            {user.twoFactor
              ? "Ligada: ao entrar com senha, pedimos um código de seis dígitos enviado para o seu e-mail."
              : "Desligada: a entrada pede só e-mail e senha. Ligue para somar um código enviado por e-mail."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={user.twoFactor}
          aria-label="Verificação em dois passos"
          className={styles.switch}
          onClick={() => alternar(!user.twoFactor)}
          disabled={salvando}
        >
          <span className={styles.switchDot}>{salvando && <Spinner size={12} />}</span>
        </button>
      </div>

      {erro && (
        <p className={styles.formError} role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}
