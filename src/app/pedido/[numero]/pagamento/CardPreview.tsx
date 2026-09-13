"use client";

import styles from "./CardPreview.module.css";

export type Bandeira = "visa" | "mastercard" | "amex" | "elo" | "diners" | "outra";

/** Mesmas regras do `DadosCartao::bandeira()` da API, para a tela não discordar do servidor. */
export function bandeiraDe(numero: string): Bandeira {
  const digitos = numero.replace(/\D/g, "");

  if (digitos.startsWith("4")) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(digitos)) return "mastercard";
  if (/^3[47]/.test(digitos)) return "amex";
  if (/^(36|38|30[0-5])/.test(digitos)) return "diners";
  if (/^(4011|4312|4389|5041|6062)/.test(digitos)) return "elo";

  return "outra";
}

const nomes: Record<Bandeira, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  elo: "Elo",
  diners: "Diners Club",
  outra: "Cartão",
};

/** Arquivos em public/bandeiras, vindos do pacote payment-icons (ver ORIGEM.txt). */
const arquivos: Record<Bandeira, string> = {
  visa: "/bandeiras/visa.svg",
  mastercard: "/bandeiras/mastercard.svg",
  amex: "/bandeiras/amex.svg",
  elo: "/bandeiras/elo.svg",
  diners: "/bandeiras/diners.svg",
  outra: "/bandeiras/default.svg",
};

interface CardPreviewProps {
  numero: string;
  nome: string;
  validade: string;
  cvv: string;
  virado: boolean;
}

export function CardPreview({ numero, nome, validade, cvv, virado }: CardPreviewProps) {
  const bandeira = bandeiraDe(numero);
  const digitos = numero.replace(/\D/g, "").padEnd(16, "•");
  const grupos = [digitos.slice(0, 4), digitos.slice(4, 8), digitos.slice(8, 12), digitos.slice(12, 16)];

  return (
    <div className={styles.palco} data-bandeira={bandeira} data-virado={virado || undefined}>
      <div className={styles.cartao}>
        <div className={`${styles.face} ${styles.frente}`}>
          <div className={styles.topo}>
            <span className={styles.chip} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={arquivos[bandeira]} alt={nomes[bandeira]} className={styles.bandeira} />
          </div>

          <p className={styles.numero}>
            {grupos.map((grupo, indice) => (
              <span key={indice}>{grupo}</span>
            ))}
          </p>

          <div className={styles.rodape}>
            <span className={styles.campo}>
              <span className={styles.rotulo}>Titular</span>
              {nome || "NOME NO CARTÃO"}
            </span>
            <span className={styles.campo}>
              <span className={styles.rotulo}>Validade</span>
              {validade || "MM/AA"}
            </span>
          </div>
        </div>

        <div className={`${styles.face} ${styles.verso}`}>
          <span className={styles.tarja} aria-hidden="true" />
          <span className={styles.assinatura}>
            <span className={styles.cvv}>{cvv || "•••"}</span>
          </span>
          <span className={styles.versoNota}>Código de segurança</span>
        </div>
      </div>
    </div>
  );
}
