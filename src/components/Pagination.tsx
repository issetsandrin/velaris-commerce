"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "./Icon";
import styles from "./Pagination.module.css";

/**
 * Paginador das listas longas (coleção, pedidos, notificações).
 * Fica fora da tela quando há uma página só: quem chama decide o corte.
 */
export function Pagination({
  page,
  pages,
  onChange,
  label,
}: {
  page: number;
  pages: number;
  onChange: (numero: number) => void;
  /** Rótulo do bloco para quem navega por leitor de tela. */
  label: string;
}) {
  if (pages <= 1) return null;

  return (
    <nav className={styles.paginacao} aria-label={label}>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Página anterior">
        <Icon icon={ChevronLeft} size={16} />
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1).map((numero) => (
        <button
          key={numero}
          type="button"
          onClick={() => onChange(numero)}
          aria-current={numero === page ? "page" : undefined}
          aria-label={`Página ${numero}`}
        >
          {numero}
        </button>
      ))}

      <button type="button" onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Próxima página">
        <Icon icon={ChevronRight} size={16} />
      </button>
    </nav>
  );
}
