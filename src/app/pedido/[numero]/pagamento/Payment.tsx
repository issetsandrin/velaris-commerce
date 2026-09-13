"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard, Loader, QrCode, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { OrderReceipt } from "@/components/order/OrderReceipt";
import { CardForm } from "./CardForm";
import { ApiError, createPixCharge, getOrder, getPayment, type Order, type Payment as Cobranca } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import styles from "./Payment.module.css";

/** De quanto em quanto tempo a loja pergunta ao servidor se o Pix caiu. */
const INTERVALO_CONSULTA_MS = 4000;

function faltando(ateIso: string | null): string | null {
  if (!ateIso) return null;
  const segundos = Math.round((new Date(ateIso).getTime() - Date.now()) / 1000);
  if (segundos <= 0) return null;

  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, "0")}`;
}

export function Payment({ number }: { number: string }) {
  const router = useRouter();
  const { status: authStatus, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Cobranca | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [semNoticia, setSemNoticia] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [restante, setRestante] = useState<string | null>(null);
  const pago = payment?.status === "pago" || order?.status === "pago";

  useEffect(() => {
    if (authStatus === "ready" && !user) {
      router.replace(`/entrar?next=${encodeURIComponent(`/pedido/${number}/pagamento`)}`);
    }
  }, [authStatus, user, router, number]);

  useEffect(() => {
    if (authStatus !== "ready" || !user) return;
    let cancelado = false;

    Promise.all([getOrder(number), getPayment(number)])
      .then(([pedido, cobranca]) => {
        if (cancelado) return;
        setOrder(pedido);
        setPayment(cobranca);
      })
      .catch((erro) => {
        if (!cancelado) setError(erro instanceof ApiError ? erro.message : "Não foi possível carregar o pedido.");
      });

    return () => {
      cancelado = true;
    };
  }, [authStatus, user, number]);

  // Enquanto o Pix não cai, a loja fica perguntando ao servidor.
  useEffect(() => {
    if (!order || order.paymentMethod !== "pix" || pago) return;

    // Quando o pagamento cai, `pago` muda e este efeito se desmonta sozinho.
    const timer = window.setInterval(() => {
      getPayment(number)
        .then((cobranca) => {
          setPayment(cobranca);
          if (cobranca.status === "pago") {
            setConfirmando(true);
            void getOrder(number).then(setOrder);
          }
        })
        .catch(() => {
          // uma consulta que falha não derruba a tela: a próxima tenta de novo
        });
    }, INTERVALO_CONSULTA_MS);

    return () => window.clearInterval(timer);
  }, [order, number, pago]);

  // Contagem regressiva do QR.
  useEffect(() => {
    if (!payment?.pixExpiresAt || pago) return;
    const atualizar = () => setRestante(faltando(payment.pixExpiresAt));
    atualizar();
    const timer = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(timer);
  }, [payment?.pixExpiresAt, pago]);

  const abrirPix = useCallback(async () => {
    try {
      setPayment(await createPixCharge(number));
    } catch (erro) {
      setError(erro instanceof ApiError ? erro.message : "Não foi possível gerar o Pix.");
    }
  }, [number]);

  /** Pergunta ao servidor se a cobrança já foi compensada, sem esperar a consulta automática. */
  async function verificarPagamento() {
    setVerificando(true);
    setSemNoticia(false);
    try {
      const cobranca = await getPayment(number);
      setPayment(cobranca);

      if (cobranca.status === "pago") {
        setConfirmando(true);
        setOrder(await getOrder(number));
        return;
      }

      setSemNoticia(true);
    } catch (erro) {
      setError(erro instanceof ApiError ? erro.message : "Não foi possível verificar o pagamento.");
    } finally {
      setVerificando(false);
    }
  }

  async function copiar() {
    if (!payment?.pixPayload) return;
    try {
      await navigator.clipboard.writeText(payment.pixPayload);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o código e copie à mão.");
    }
  }

  if (error && !order) {
    return (
      <section className={`container ${styles.page}`}>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <Link href="/conta/pedidos" className="btn btn-ghost">
          Ver meus pedidos
        </Link>
      </section>
    );
  }

  if (!order) {
    return (
      <section className={`container ${styles.page}`}>
        <p className={styles.muted}>Carregando o pedido…</p>
      </section>
    );
  }

  if (pago && confirmando && order.status !== "pago") {
    return (
      <section className={`container ${styles.page}`}>
        <div className={styles.confirmando} role="status">
          <Spinner size={28} />
          <p className={styles.confirmandoTitulo}>Confirmando o pagamento…</p>
          <p className={styles.muted}>Já recebemos a cobrança. Estamos fechando o pedido {order.number}.</p>
        </div>
      </section>
    );
  }

  if (pago) return <OrderReceipt order={order} />;

  const noCartao = order.paymentMethod !== "pix";

  return (
    <section className={`container ${styles.page}`}>
      <header className={styles.head}>
        <p className={styles.pedido}>
          <Icon icon={noCartao ? CreditCard : QrCode} size={18} />
          Pedido <strong>{order.number}</strong>
        </p>
        <h1 className={styles.title}>{noCartao ? "Pagar com cartão" : "Pagar com Pix"}</h1>
        <p className={styles.lead}>
          {noCartao
            ? "Preencha os dados do cartão para fechar o pedido. Nada é guardado além da bandeira e dos quatro últimos dígitos."
            : "Abra o aplicativo do seu banco, leia o QR ou use o código copia e cola. A confirmação chega aqui sozinha."}
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {noCartao ? (
            <CardForm
              number={order.number}
              total={order.total}
              installments={order.installments}
              onPaid={(cobranca) => {
                setPayment(cobranca);
                setConfirmando(true);
                void getOrder(number).then(setOrder);
              }}
            />
          ) : (
            <div className={styles.pix}>
              {payment?.pixQrCode ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={payment.pixQrCode} alt={`QR code do Pix do pedido ${order.number}`} className={styles.qr} />

                  <div className={styles.codeBlock}>
                    <span className={styles.codeLabel}>Pix copia e cola</span>
                    <code className={styles.code}>{payment.pixPayload}</code>
                    <button type="button" className="btn btn-ghost" onClick={() => void copiar()}>
                      <Icon icon={copiado ? Check : Copy} size={17} />
                      {copiado ? "Código copiado" : "Copiar código"}
                    </button>
                  </div>

                  <p className={styles.waiting}>
                    <Icon icon={Loader} size={16} className={styles.spin} />
                    Aguardando o pagamento
                    {restante ? `, o código vale por mais ${restante}` : ", o código expirou"}
                  </p>

                  {restante === null && (
                    <button type="button" className="btn btn-ghost" onClick={() => void abrirPix()}>
                      Gerar outro código
                    </button>
                  )}

                  <button type="button" className="btn btn-primary" onClick={() => void verificarPagamento()} disabled={verificando}>
                    {verificando ? <Spinner size={17} /> : <Icon icon={RefreshCw} size={17} />}
                    {verificando ? "Verificando…" : "Verificar pagamento"}
                  </button>

                  {semNoticia && (
                    <p className={styles.pending} role="status">
                      Ainda não identificamos o pagamento. Se você acabou de pagar, aguarde alguns
                      segundos: a confirmação chega sozinha.
                    </p>
                  )}
                </>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => void abrirPix()}>
                  <Icon icon={QrCode} size={17} />
                  Gerar código Pix
                </button>
              )}
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              <Icon icon={TriangleAlert} size={16} />
              {error}
            </p>
          )}
        </div>

        <aside className={styles.summary}>
          <h2 className={styles.summaryTitle}>Resumo</h2>
          <dl className={styles.lines}>
            <div>
              <dt>Pedido</dt>
              <dd>{order.number}</dd>
            </div>
            <div>
              <dt>Forma</dt>
              <dd>
                {order.paymentMethodName}
                {order.installments > 1 ? `, ${order.installments}x` : ""}
              </dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>{order.shippingMethodName ?? "—"}</dd>
            </div>
          </dl>
          <div className={styles.amount}>
            <span>Total</span>
            <span className="price">{formatPrice(order.total)}</span>
          </div>
          <p className={styles.safe}>
            <Icon icon={ShieldCheck} size={15} />
            Ambiente de demonstração: nenhuma cobrança real é feita.
          </p>
          <Link href="/conta/pedidos" className={`link-underline ${styles.later}`}>
            Pagar depois
          </Link>
        </aside>
      </div>
    </section>
  );
}
