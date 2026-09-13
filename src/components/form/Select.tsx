"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Icon } from "../Icon";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  /** Texto de apoio à direita, como o valor da parcela. */
  hint?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  /** Ícone à esquerda, para casar com os outros campos do filtro. */
  icon?: React.ComponentProps<typeof Icon>["icon"];
  className?: string;
}

/**
 * Seleção com lista própria: o select nativo não deixa desenhar as opções, e a
 * lista do sistema destoa do resto da loja. Segue como listbox de verdade, com
 * teclado e leitor de tela.
 */
export function Select({ value, options, onChange, label, icon, className }: SelectProps) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const listaId = useId();
  const escolhida = options.find((opcao) => opcao.value === value) ?? options[0];

  useEffect(() => {
    if (!aberto) return;

    const foraDaLista = (evento: PointerEvent) => {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    };

    document.addEventListener("pointerdown", foraDaLista);
    return () => document.removeEventListener("pointerdown", foraDaLista);
  }, [aberto]);

  // Ao abrir, o foco vai para a opção em uso: as setas seguem dali.
  useEffect(() => {
    if (!aberto) return;
    const marcada = listaRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    const primeira = listaRef.current?.querySelector<HTMLElement>("[role=option]");
    (marcada ?? primeira)?.focus();
  }, [aberto]);

  function escolher(opcao: SelectOption) {
    onChange(opcao.value);
    setAberto(false);
  }

  function navegar(evento: React.KeyboardEvent<HTMLDivElement>) {
    const itens = Array.from(listaRef.current?.querySelectorAll<HTMLElement>("[role=option]") ?? []);
    const atual = itens.indexOf(document.activeElement as HTMLElement);

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      const passo = evento.key === "ArrowDown" ? 1 : -1;
      itens[(atual + passo + itens.length) % itens.length]?.focus();
      return;
    }

    if (evento.key === "Home" || evento.key === "End") {
      evento.preventDefault();
      (evento.key === "Home" ? itens[0] : itens[itens.length - 1])?.focus();
      return;
    }

    if (evento.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className={`${styles.root} ${className ?? ""}`} ref={raizRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={label}
        onClick={() => setAberto((estava) => !estava)}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowDown" || evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setAberto(true);
          }
        }}
      >
        {icon && <Icon icon={icon} size={15} />}
        <span className={styles.valor}>{escolhida?.label}</span>
        <Icon icon={ChevronDown} size={15} className={styles.chevron} />
      </button>

      {aberto && (
        <div
          id={listaId}
          role="listbox"
          aria-label={label}
          className={styles.lista}
          ref={listaRef}
          onKeyDown={navegar}
        >
          {options.map((opcao) => {
            const marcada = opcao.value === escolhida?.value;
            return (
              <div
                key={opcao.value}
                role="option"
                aria-selected={marcada}
                tabIndex={-1}
                className={styles.opcao}
                onClick={() => escolher(opcao)}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    escolher(opcao);
                  }
                }}
              >
                <span className={styles.tique}>{marcada && <Icon icon={Check} size={14} />}</span>
                <span className={styles.rotulo}>{opcao.label}</span>
                {opcao.hint && <span className={styles.hint}>{opcao.hint}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
