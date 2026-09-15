"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleCheckBig, Loader, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Icon } from "@/components/Icon";
import { ApiError, confirmEmail } from "@/lib/api";
import styles from "@/components/auth/AuthCard.module.css";

type Estado = "conferindo" | "pronto" | "erro";

export function ConfirmEmail() {
  const token = useSearchParams().get("token") ?? "";
  const { user, setUser } = useAuth();
  const [estado, setEstado] = useState<Estado>(token ? "conferindo" : "erro");
  const [mensagem, setMensagem] = useState("Este link de confirmação está incompleto.");
  const [jaEstava, setJaEstava] = useState(false);
  const pedido = useRef(false);

  useEffect(() => {
    if (!token || pedido.current) return;
    pedido.current = true;

    confirmEmail(token)
      .then((resposta) => {
        setEstado("pronto");
        setJaEstava(resposta.jaEstava);
        // Quem já está logado vê o selo sumir sem precisar recarregar.
        if (user && user.id === resposta.user.id) setUser(resposta.user);
      })
      .catch((erro) => {
        setEstado("erro");
        setMensagem(erro instanceof ApiError ? erro.message : "Não foi possível confirmar o e-mail agora.");
      });
    // Uma confirmação por carregamento: o token serve uma vez só.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (estado === "conferindo") {
    return (
      <AuthLayout>
        <div>
          <Icon icon={Loader} size={30} className="spin" />
          <h1 className={styles.title}>Confirmando…</h1>
          <p className={styles.lead}>Só um instante enquanto validamos o link.</p>
        </div>
      </AuthLayout>
    );
  }

  if (estado === "erro") {
    return (
      <AuthLayout>
        <div>
          <Icon icon={TriangleAlert} size={30} />
          <h1 className={styles.title}>Link inválido</h1>
          <p className={styles.lead}>{mensagem}</p>
        </div>

        <Link href={user ? "/conta" : "/entrar"} className={`btn btn-primary ${styles.submit}`}>
          {user ? "Ir para minha conta" : "Entrar na conta"}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div>
        <Icon icon={CircleCheckBig} size={30} />
        <h1 className={styles.title}>E‑mail confirmado</h1>
        <p className={styles.lead}>
          {jaEstava
            ? "Este endereço já estava confirmado. Não precisa fazer mais nada: é só entrar na sua conta."
            : "Tudo certo. Agora o andamento dos seus pedidos, do pagamento à entrega, chega na sua caixa de entrada."}
        </p>
      </div>

      <Link href={user ? "/conta" : "/entrar"} className={`btn btn-primary ${styles.submit}`}>
        {user ? "Ir para minha conta" : "Entrar na conta"}
      </Link>
    </AuthLayout>
  );
}
