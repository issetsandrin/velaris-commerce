"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { Icon } from "../Icon";
import { ApiError, me, resendEmailConfirmation } from "@/lib/api";
import { eRotaDeConta } from "@/lib/rotas";
import styles from "./VerifyEmailBanner.module.css";

/**
 * Faixa discreta para quem ainda não confirmou o e-mail. Não bloqueia nada:
 * lembra e oferece o reenvio do link. Fechar vale enquanto a aba estiver aberta.
 */
export function VerifyEmailBanner() {
  const { user, setUser } = useAuth();
  const pathname = usePathname();
  const [fechado, setFechado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  if (!user || user.emailVerified || fechado || eRotaDeConta(pathname)) return null;

  async function reenviar() {
    setEnviando(true);
    try {
      setMensagem((await resendEmailConfirmation()).message);
    } catch (error) {
      // Confirmou em outra aba: a faixa aqui está velha. Recarrega o usuário
      // e ela some sozinha, em vez de insistir num link que não existe.
      if (error instanceof ApiError && error.status === 422) {
        try {
          setUser(await me());
          return;
        } catch {
          // sem resposta da API, segue mostrando o aviso
        }
      }

      setMensagem(error instanceof ApiError ? error.message : "Não foi possível enviar o link agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <aside className={styles.banner} data-aviso-email aria-label="Confirmação de e-mail">
      <div className={styles.inner}>
        <Icon icon={MailWarning} size={17} />
        <p className={styles.text}>
          {mensagem ?? (
            <>
              Confirme seu e-mail para receber o andamento dos pedidos. Enviamos um link para{" "}
              <strong>{user.email}</strong>.
            </>
          )}
        </p>

        {!mensagem && (
          <button type="button" className={`link-underline ${styles.action}`} onClick={reenviar} disabled={enviando}>
            {enviando ? "Enviando…" : "Reenviar link"}
          </button>
        )}

        <button type="button" className={styles.close} onClick={() => setFechado(true)} aria-label="Fechar aviso">
          <Icon icon={X} size={16} />
        </button>
      </div>
    </aside>
  );
}
