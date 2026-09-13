"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, Lock } from "lucide-react";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { Field } from "@/components/form/Field";
import { CardPreview } from "./CardPreview";
import { ApiError, payWithCard, type Payment } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import styles from "./Payment.module.css";

/** Números de teste do gateway de demonstração, mostrados na própria tela. */
const TESTE = [
  { numero: "4111 1111 1111 1111", resultado: "aprova" },
  { numero: "4000 0000 0000 0002", resultado: "recusa pelo emissor" },
  { numero: "4000 0000 0000 9995", resultado: "recusa por limite" },
];

function mascaraNumero(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 19);
  return digitos.replace(/(.{4})/g, "$1 ").trim();
}

function mascaraValidade(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  return digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

interface CardFormProps {
  number: string;
  total: number;
  installments: number;
  onPaid: (payment: Payment) => void;
}

export function CardForm({ number, total, installments, onPaid }: CardFormProps) {
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [virado, setVirado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [recusa, setRecusa] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setRecusa(null);
    setFieldErrors({});

    try {
      const cobranca = await payWithCard(number, { numero, nome, validade, cvv, parcelas: installments });

      if (cobranca.status === "recusado") {
        setRecusa(cobranca.failureReason ?? "Pagamento não autorizado.");
        return;
      }

      onPaid(cobranca);
    } catch (erro) {
      if (erro instanceof ApiError) {
        setFieldErrors(erro.errors ?? {});
        setRecusa(erro.errors ? null : erro.message);
      } else {
        setRecusa("Não foi possível processar o cartão.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <div className={styles.cardArt}>
        <CardPreview numero={numero} nome={nome} validade={validade} cvv={cvv} virado={virado} />
      </div>

      <div className={styles.cardFields}>
        <Field
          label="Número do cartão"
          name="numero"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={numero}
          onChange={(event) => setNumero(mascaraNumero(event.target.value))}
          errors={fieldErrors.numero}
          required
        />
        <Field
          label="Nome impresso no cartão"
          name="nome"
          autoComplete="cc-name"
          placeholder="COMO ESTÁ NO CARTÃO"
          value={nome}
          onChange={(event) => setNome(event.target.value.toUpperCase())}
          errors={fieldErrors.nome}
          required
        />
        <div className={styles.cardRow}>
          <Field
            label="Validade"
            name="validade"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={validade}
            onChange={(event) => setValidade(mascaraValidade(event.target.value))}
            errors={fieldErrors.validade}
            required
          />
          <Field
            label="Código de segurança"
            name="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="000"
            value={cvv}
            onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
            onFocus={() => setVirado(true)}
            onBlur={() => setVirado(false)}
            errors={fieldErrors.cvv}
            required
          />
      </div>

      {installments > 1 && (
        <p className={styles.installments}>
          {installments}x de {formatPrice(total / installments)} sem juros, como escolhido no checkout.
        </p>
      )}

      {recusa && (
        <p className={styles.error} role="alert">
          {recusa}
        </p>
      )}

      <button type="submit" className={`btn btn-primary ${styles.pay}`} disabled={enviando}>
        {enviando ? <Spinner size={17} /> : <Icon icon={CreditCard} size={17} />}
        {enviando ? "Processando…" : `Pagar ${formatPrice(total)}`}
      </button>

      <p className={styles.safe}>
        <Icon icon={Lock} size={15} />
        Os dados do cartão não são gravados: ficam só a bandeira e os quatro últimos dígitos.
      </p>

      <details className={styles.testCards}>
        <summary>Cartões de teste</summary>
        <ul>
          {TESTE.map((cartao) => (
            <li key={cartao.numero}>
              <button type="button" onClick={() => setNumero(cartao.numero)}>
                {cartao.numero}
              </button>
              <span>{cartao.resultado}</span>
            </li>
          ))}
        </ul>
          <p>Qualquer nome, validade futura e três dígitos no código.</p>
        </details>
      </div>
    </form>
  );
}
