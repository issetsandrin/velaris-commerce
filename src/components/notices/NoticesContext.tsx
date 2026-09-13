"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getNotices, readNotices, type Notice } from "@/lib/api";
import { useAuth } from "../auth/AuthContext";

const LIDOS_VISITANTE = "velaris.avisos.lidos";

interface NoticesValue {
  notices: Notice[];
  unread: number;
  loading: boolean;
  markAllRead: () => void;
}

const NoticesContext = createContext<NoticesValue | null>(null);

/** Visitante não tem conta para guardar leitura: fica no próprio navegador. */
function lidosLocais(): string[] {
  try {
    const bruto = window.localStorage.getItem(LIDOS_VISITANTE);
    return bruto ? (JSON.parse(bruto) as string[]) : [];
  } catch {
    return [];
  }
}

function guardarLocais(chaves: string[]): void {
  try {
    window.localStorage.setItem(LIDOS_VISITANTE, JSON.stringify(chaves.slice(-200)));
  } catch {
    // navegador sem armazenamento: o indicador volta a acender, e tudo bem
  }
}

export function NoticesProvider({ children }: { children: ReactNode }) {
  const { user, status: authStatus } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "ready") return;
    let cancelado = false;

    getNotices()
      .then((lista) => {
        if (cancelado) return;
        const locais = user ? [] : lidosLocais();
        setNotices(lista.map((aviso) => ({ ...aviso, read: aviso.read || locais.includes(aviso.key) })));
      })
      .catch(() => {
        // API fora: a lista fica vazia em vez de mostrar erro
        if (!cancelado) setNotices([]);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [authStatus, user]);

  const marcarTodosLidos = useCallback(() => {
    const chaves = notices.filter((aviso) => !aviso.read).map((aviso) => aviso.key);
    if (chaves.length === 0) return;

    setNotices((atuais) => atuais.map((aviso) => ({ ...aviso, read: true })));

    if (user) {
      void readNotices(chaves).catch(() => {
        // se o servidor recusar, a próxima carga traz o estado verdadeiro
      });
      return;
    }

    guardarLocais([...lidosLocais(), ...chaves]);
  }, [notices, user]);

  const value = useMemo<NoticesValue>(
    () => ({
      notices,
      unread: notices.filter((aviso) => !aviso.read).length,
      loading,
      markAllRead: marcarTodosLidos,
    }),
    [notices, loading, marcarTodosLidos],
  );

  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>;
}

export function useNotices(): NoticesValue {
  const context = useContext(NoticesContext);
  if (!context) throw new Error("useNotices precisa estar dentro de NoticesProvider");
  return context;
}
