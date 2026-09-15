"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellOff, CreditCard, Package, Tag, Truck, type LucideIcon } from "lucide-react";
import { useNotices } from "./NoticesContext";
import { Icon } from "../Icon";
import { Pagination } from "../Pagination";
import { Skeleton } from "../Skeleton";
import type { Notice } from "@/lib/api";
import styles from "./Notices.module.css";

/** Quantos avisos cabem numa página antes de a lista virar paginada. */
const POR_PAGINA = 10;

const icones: Record<Notice["type"], LucideIcon> = {
  promocao: Tag,
  entrega: Truck,
  pagamento: CreditCard,
  pedido: Package,
  aviso: Tag,
};

function quando(iso: string): string {
  const data = new Date(iso);
  const minutos = Math.round((Date.now() - data.getTime()) / 60000);

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 60 * 24) return `há ${Math.round(minutos / 60)} h`;
  if (minutos < 60 * 24 * 7) return `há ${Math.round(minutos / (60 * 24))} dias`;

  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function Notices() {
  const { notices, loading, markAllRead } = useNotices();
  const [pagina, setPagina] = useState(1);

  // Abrir a aba é ler: o indicador zera depois de um instante, tempo de ver o que era novo.
  useEffect(() => {
    const timer = window.setTimeout(markAllRead, 1500);
    return () => window.clearTimeout(timer);
  }, [markAllRead]);

  if (loading) {
    return (
      <ul className={styles.list} role="status" aria-label="Carregando notificações">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={styles.item}>
            <div className={styles.row}>
              <Skeleton width="2.3rem" height="2.3rem" radius="999px" />
              <span className={styles.body}>
                <Skeleton width="12rem" height="1.05rem" />
                <Skeleton width="90%" height="0.9rem" />
                <Skeleton width="4rem" height="0.8rem" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (notices.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon={BellOff} size={40} />
        <p className={styles.emptyTitle}>Nenhuma notificação.</p>
        <p className={styles.muted}>
          Promoções e o andamento dos seus pedidos, do pagamento à entrega, aparecem aqui.
        </p>
      </div>
    );
  }

  const paginas = Math.max(1, Math.ceil(notices.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas);
  const visiveis = notices.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function irPara(numero: number) {
    setPagina(numero);
    document.getElementById("notificacoes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="notificacoes" className={styles.wrap}>
      <ul className={styles.list}>
      {visiveis.map((aviso) => {
        const corpo = (
          <>
            <span className={styles.icon}>
              <Icon icon={icones[aviso.type] ?? Tag} size={18} />
            </span>
            <span className={styles.body}>
              <span className={styles.title}>{aviso.title}</span>
              <span className={styles.text}>{aviso.text}</span>
              <span className={styles.time}>{quando(aviso.at)}</span>
            </span>
          </>
        );

        return (
          <li key={aviso.key} className={styles.item} data-unread={!aviso.read || undefined}>
            {aviso.link ? (
              <Link href={aviso.link} className={styles.row}>
                {corpo}
              </Link>
            ) : (
              <div className={styles.row}>{corpo}</div>
            )}
          </li>
        );
      })}
      </ul>

      <Pagination page={paginaAtual} pages={paginas} onChange={irPara} label="Páginas das notificações" />
    </div>
  );
}
