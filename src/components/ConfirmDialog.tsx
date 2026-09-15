"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";
import styles from "./ConfirmDialog.module.css";

/**
 * Pergunta antes de uma ação que não tem volta. Fecha pelo Esc, pelo fundo e
 * pelo botão de cancelar, que é onde o foco cai ao abrir: quem sai no reflexo
 * do teclado cancela, não confirma.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Remover",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelar.current?.focus();

    const noTeclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", noTeclado);
    return () => document.removeEventListener("keydown", noTeclado);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.root}>
      <button type="button" className={styles.backdrop} onClick={onCancel} aria-label="Cancelar" tabIndex={-1} />

      <div className={styles.panel} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <p className={styles.icon}>
          <Icon icon={TriangleAlert} size={22} />
        </p>

        <h2 id="confirm-title" className={styles.title}>
          {title}
        </h2>

        <div className={styles.text}>{children}</div>

        <div className={styles.actions}>
          <button type="button" className="btn" onClick={onCancel} disabled={busy} ref={cancelar}>
            Cancelar
          </button>
          <button type="button" className={`btn ${styles.confirm}`} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={15} />}
            {busy ? "Removendo…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
