"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, CircleCheckBig, CreditCard, Hash, MapPin, PackageOpen, Truck, UserRound } from "lucide-react";
import { Icon } from "@/components/Icon";
import { formatPostalCode } from "@/components/address/AddressCard";
import { formatCpf, formatPhone, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/api";
import styles from "./OrderReceipt.module.css";

/** Comprovante do pedido: usado ao fechar a compra e depois do pagamento. */
export function OrderReceipt({ order }: { order: Order }) {
  const pecas = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
      <section className={`container ${styles.done}`}>
        <Icon icon={CircleCheckBig} size={40} />
        <h1 className={styles.doneTitle}>Pedido recebido.</h1>
        <p className={styles.doneText}>
          Enviamos a confirmação para <strong>{order.email}</strong>. Seu pedido é o número{" "}
          <strong>{order.number}</strong>, no valor de{" "}
          <strong className="price">{formatPrice(order.total)}</strong>
          {(order.discount > 0 || order.couponDiscount > 0) && (
            <>
              {" "}
              (já com{" "}
              {[
                order.couponDiscount > 0 ? `${formatPrice(order.couponDiscount)} do cupom ${order.couponCode}` : null,
                order.discount > 0 ? `${formatPrice(order.discount)} de desconto no ${order.paymentMethodName}` : null,
              ]
                .filter(Boolean)
                .join(" e ")}
              )
            </>
          )}. Postamos
          em até dois dias úteis e avisamos por e-mail quando sair.
        </p>
        <div className={styles.doneOrder}>
          <dl className={styles.doneHead}>
            <div>
              <dt>
                <Icon icon={Hash} size={14} />
                Pedido
              </dt>
              <dd>{order.number}</dd>
            </div>
            <div>
              <dt>
                <Icon icon={CalendarDays} size={14} />
                Data
              </dt>
              <dd>
                {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt>
                <Icon icon={CreditCard} size={14} />
                Pagamento
              </dt>
              <dd>
                {order.paymentMethodName}
                {order.installments > 1
                  ? `, ${order.installments}x de ${formatPrice(order.total / order.installments)}`
                  : ", à vista"}
              </dd>
            </div>
            <div>
              <dt>
                <Icon icon={Truck} size={14} />
                Envio
              </dt>
              <dd>
                {order.shippingMethodName ?? "Entrega"}
                {order.shipping > 0 ? `, ${formatPrice(order.shipping)}` : ", grátis"}
              </dd>
            </div>
            <div className={styles.doneHeadWide}>
              <dt>
                <Icon icon={UserRound} size={14} />
                Contato
              </dt>
              <dd>
                {order.customerName}
                {order.phone ? `, ${formatPhone(order.phone)}` : ""}
                {order.cpf ? `, CPF ${formatCpf(order.cpf)}` : ""}
              </dd>
            </div>
            <div className={styles.doneHeadWide}>
              <dt>
                <Icon icon={MapPin} size={14} />
                Entrega
              </dt>
              <dd>
                {order.address.street}, {order.address.streetNumber}
                {order.address.complement ? `, ${order.address.complement}` : ""}
                {order.address.neighborhood ? `, ${order.address.neighborhood}` : ""}, {order.address.city}, CEP{" "}
                {formatPostalCode(order.address.postalCode)}
              </dd>
            </div>
          </dl>

          {/* Os itens ficam recolhidos: o comprovante abre curto e quem quiser confere o detalhe. */}
          <details className={styles.items}>
            <summary className={styles.itemsSummary}>
              <span className={styles.itemsCount}>
                {pecas} {pecas === 1 ? "item" : "itens"}
                <span className={styles.itemsHint}>
                  {order.items.length === 1
                    ? order.items[0].productName
                    : `${order.items.length} ${order.items.length === 1 ? "vela" : "velas"} diferentes`}
                </span>
              </span>
              <span className={`price ${styles.itemsTotal}`}>{formatPrice(order.subtotal)}</span>
              <Icon icon={ChevronDown} size={18} className={styles.itemsChevron} />
            </summary>

            <ul className={styles.doneItems}>
              {order.items.map((item, index) => (
                <li key={index} className={styles.doneItem}>
                  <span className={styles.doneItemBody}>
                    <Link href={`/produto/${item.productSlug}`} className={styles.doneItemName}>
                      {item.productName}
                    </Link>
                    <span className={styles.doneItemMeta}>
                      {item.sizeLabel}, {item.sizeWeight}, {item.quantity} un. x {formatPrice(item.unitPrice)}
                    </span>
                  </span>
                  <span className="price">{formatPrice(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </details>

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
              <dt>Frete{order.shippingMethodName ? `, ${order.shippingMethodName.toLowerCase()}` : ""}</dt>
              <dd className="price">{order.shipping === 0 ? "Grátis" : formatPrice(order.shipping)}</dd>
            </div>
            <div className={styles.total}>
              <dt>Total</dt>
              <dd className="price">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.doneActions}>
          <Link href="/conta/pedidos" className="btn btn-primary">
            <Icon icon={PackageOpen} size={18} />
            Meus pedidos
          </Link>
          <Link href="/colecao" className="btn btn-ghost">
            Voltar à coleção
          </Link>
        </div>
      </section>
  );
}
