"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleCheckBig,
  CircleX,
  Clock,
  CreditCard,
  MapPin,
  PackageCheck,
  QrCode,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { CandleArt } from "../CandleArt";
import { Icon } from "../Icon";
import { formatPostalCode } from "../address/AddressCard";
import { formatCpf, formatPhone, formatPrice } from "@/lib/format";
import { ApiError, getOrder, getProducts, type Order } from "@/lib/api";
import type { Product } from "@/lib/products";
import styles from "./Orders.module.css";

const statusInfo: Record<string, { label: string; icon: LucideIcon }> = {
  recebido: { label: "Recebido", icon: Clock },
  pago: { label: "Pago", icon: CircleCheckBig },
  enviado: { label: "Enviado", icon: Truck },
  entregue: { label: "Entregue", icon: PackageCheck },
  cancelado: { label: "Cancelado", icon: CircleX },
};

export function OrderDetail({ number }: { number: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    getOrder(number)
      .then((pedido) => {
        if (!cancelado) setOrder(pedido);
      })
      .catch((erro) => {
        if (!cancelado) setError(erro instanceof ApiError ? erro.message : "Não foi possível carregar o pedido.");
      });

    getProducts()
      .then((lista) => {
        if (!cancelado) setProducts(Object.fromEntries(lista.map((produto) => [produto.slug, produto])));
      })
      .catch(() => {
        // sem catálogo, os itens ficam sem miniatura
      });

    return () => {
      cancelado = true;
    };
  }, [number]);

  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <Link href="/conta/pedidos" className={`link-underline ${styles.detail}`}>
          Voltar para Meus pedidos
        </Link>
      </div>
    );
  }

  if (!order) return <p className={styles.muted}>Carregando pedido…</p>;

  const status = statusInfo[order.status] ?? { label: order.status, icon: Clock };
  const data = new Date(order.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const aguardandoPagamento = order.status === "recebido";

  return (
    <div className={styles.wrap}>
      <Link href="/conta/pedidos" className={`link-underline ${styles.back}`}>
        <Icon icon={ArrowLeft} size={15} />
        Meus pedidos
      </Link>

      <article className={styles.order}>
        <header className={styles.head}>
          <div>
            <p className={styles.number}>Pedido {order.number}</p>
            <p className={styles.muted}>Feito em {data}</p>
          </div>
          <span className={styles.status} data-status={order.status}>
            <Icon icon={status.icon} size={16} />
            {status.label}
          </span>
        </header>

        <ul className={styles.items}>
          {order.items.map((item, index) => {
            const produto = products[item.productSlug];
            return (
              <li key={index} className={styles.item}>
                <span className={styles.thumb}>
                  {produto ? <CandleArt wax={produto.wax} collection={produto.collection} /> : null}
                </span>
                <span className={styles.itemBody}>
                  <Link href={`/produto/${item.productSlug}`} className={styles.itemName}>
                    {item.productName}
                  </Link>
                  <span className={styles.muted}>
                    {item.sizeLabel}, {item.sizeWeight}, {item.quantity} un. x {formatPrice(item.unitPrice)}
                  </span>
                </span>
                <span className="price">{formatPrice(item.unitPrice * item.quantity)}</span>
              </li>
            );
          })}
        </ul>

        <footer className={styles.foot}>
          <div className={styles.meta}>
            <p>
              <Icon icon={MapPin} size={16} />
              {order.address.street}, {order.address.streetNumber}
              {order.address.complement ? `, ${order.address.complement}` : ""}.{" "}
              {order.address.neighborhood ? `${order.address.neighborhood}, ` : ""}
              {order.address.city}, CEP {formatPostalCode(order.address.postalCode)}
            </p>
            <p>
              <Icon icon={Truck} size={16} />
              {order.shippingMethodName ?? "Entrega"}
              {order.shipping > 0 ? `, ${formatPrice(order.shipping)}` : ", grátis"}
            </p>
            <p>
              <Icon icon={order.paymentMethod === "pix" ? QrCode : CreditCard} size={16} />
              {order.paymentMethodName}
              {order.installments > 1 ? `, ${order.installments}x de ${formatPrice(order.total / order.installments)}` : ""}
            </p>
            <p>
              <Icon icon={CircleCheckBig} size={16} />
              {order.customerName}
              {order.phone ? `, ${formatPhone(order.phone)}` : ""}
              {order.cpf ? `, CPF ${formatCpf(order.cpf)}` : ""}
            </p>
          </div>

          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd className="price">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.couponDiscount > 0 && (
              <div>
                <dt>Cupom {order.couponCode}</dt>
                <dd className="price">− {formatPrice(order.couponDiscount)}</dd>
              </div>
            )}
            {order.discount > 0 && (
              <div>
                <dt>Desconto {order.paymentMethodName}</dt>
                <dd className="price">− {formatPrice(order.discount)}</dd>
              </div>
            )}
            <div>
              <dt>Frete</dt>
              <dd className="price">{order.shipping === 0 ? "Grátis" : formatPrice(order.shipping)}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd className="price">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </footer>

        {aguardandoPagamento && (
          <div className={styles.actions}>
            <span className={styles.muted}>Este pedido ainda não foi pago.</span>
            <Link href={`/pedido/${order.number}/pagamento`} className={`btn btn-primary ${styles.pay}`}>
              <Icon icon={order.paymentMethod === "pix" ? QrCode : CreditCard} size={16} />
              {order.paymentMethod === "pix" ? "Pagar com Pix" : "Pagar com cartão"}
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
