"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CircleCheckBig, CircleX, Clock, CreditCard, ListFilter, MapPin, PackageCheck, PackageOpen, QrCode, Search, SearchX, Truck, type LucideIcon } from "lucide-react";
import { CandleArt } from "../CandleArt";
import { Icon } from "../Icon";
import { SkeletonOrder } from "../Skeleton";
import { Select } from "../form/Select";
import { formatPostalCode } from "../address/AddressCard";
import { formatPrice } from "@/lib/format";
import { ApiError, getProducts, myOrders, type Order } from "@/lib/api";
import type { Product } from "@/lib/products";
import styles from "./Orders.module.css";

const statusInfo: Record<string, { label: string; icon: LucideIcon }> = {
  recebido: { label: "Recebido", icon: Clock },
  pago: { label: "Pago", icon: CircleCheckBig },
  enviado: { label: "Enviado", icon: Truck },
  entregue: { label: "Entregue", icon: PackageCheck },
  cancelado: { label: "Cancelado", icon: CircleX },
};

export function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [numero, setNumero] = useState("");
  const [situacao, setSituacao] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    myOrders()
      .then(setOrders)
      .catch((loadError) => setError(loadError instanceof ApiError ? loadError.message : "Não foi possível carregar os pedidos."));
    getProducts()
      .then((list) => setProducts(Object.fromEntries(list.map((product) => [product.slug, product]))))
      .catch(() => {
        // sem catálogo, os itens ficam sem miniatura
      });
  }, []);

  // A lista já vem inteira da API: filtrar aqui responde na tecla, sem ida ao servidor.
  const filtrados = (orders ?? []).filter((order) => {
    const busca = numero.trim().toLowerCase();
    if (busca && !order.number.toLowerCase().includes(busca)) return false;
    if (situacao && order.status !== situacao) return false;

    // en-CA dá a data local no formato AAAA-MM-DD, igual ao do campo de data.
    const dia = new Date(order.createdAt).toLocaleDateString("en-CA");
    if (de && dia < de) return false;
    if (ate && dia > ate) return false;

    return true;
  });

  const filtrando = Boolean(numero.trim() || de || ate || situacao);

  if (error) {
    return (
      <p className={styles.error} role="alert">
        {error}
      </p>
    );
  }

  if (orders === null) {
    return (
      <div className={styles.wrap} role="status" aria-label="Carregando pedidos">
        <ul className={styles.list}>
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <SkeletonOrder />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon={PackageOpen} size={40} />
        <p className={styles.emptyTitle}>Você ainda não fez nenhum pedido.</p>
        <p className={styles.muted}>Quando fizer, ele aparece aqui com status, itens e endereço de entrega.</p>
        <Link href="/colecao" className="btn btn-primary">
          Ver a coleção
        </Link>
      </div>
    );
  }

  const filtros = (
    <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
      <label className={styles.filterField}>
        <span>Número do pedido</span>
        <span className={styles.control}>
          <Icon icon={Search} size={15} />
          <input
            type="search"
            value={numero}
            onChange={(event) => setNumero(event.target.value)}
            placeholder="Ex.: VL123456"
            autoComplete="off"
          />
        </span>
      </label>
      <label className={styles.filterField}>
        <span>Situação</span>
        <Select
          value={situacao}
          onChange={setSituacao}
          label="Filtrar por situação"
          icon={ListFilter}
          className={styles.situacao}
          options={[
            { value: "", label: "Todas" },
            ...Object.entries(statusInfo).map(([chave, info]) => ({ value: chave, label: info.label })),
          ]}
        />
      </label>
      <label className={styles.filterField}>
        <span>Feito a partir de</span>
        <DateField value={de} max={ate || undefined} onChange={setDe} />
      </label>
      <label className={styles.filterField}>
        <span>Até</span>
        <DateField value={ate} min={de || undefined} onChange={setAte} />
      </label>
      {filtrando && (
        <button
          type="button"
          className={`link-underline ${styles.clearFilters}`}
          onClick={() => {
            setNumero("");
            setSituacao("");
            setDe("");
            setAte("");
          }}
        >
          Limpar filtros
        </button>
      )}
    </form>
  );

  if (filtrados.length === 0) {
    return (
      <div className={styles.wrap}>
        {filtros}
        <div className={styles.empty}>
          <Icon icon={SearchX} size={40} />
          <p className={styles.emptyTitle}>Nenhum pedido com esses filtros.</p>
          <p className={styles.muted}>Confira o número digitado ou amplie o período.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {filtros}
      <p className={styles.count} aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? "pedido" : "pedidos"}
        {filtrando ? ` de ${orders.length}` : ""}
      </p>
      <ul className={styles.list}>
      {filtrados.map((order) => {
        const status = statusInfo[order.status] ?? { label: order.status, icon: Clock };
        const date = new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        return (
          <li key={order.number} className={styles.order}>
            <header className={styles.head}>
              <div>
                <p className={styles.number}>Pedido {order.number}</p>
                <p className={styles.muted}>{date}</p>
              </div>
              <span className={styles.status} data-status={order.status}>
                <Icon icon={status.icon} size={16} />
                {status.label}
              </span>
            </header>

            <ul className={styles.items}>
              {order.items.map((item, index) => {
                const product = products[item.productSlug];
                return (
                  <li key={index} className={styles.item}>
                    <span className={styles.thumb}>
                      {product ? <CandleArt wax={product.wax} collection={product.collection} /> : null}
                    </span>
                    <span className={styles.itemBody}>
                      <Link href={`/produto/${item.productSlug}`} className={styles.itemName}>
                        {item.productName}
                      </Link>
                      <span className={styles.muted}>
                        {item.sizeLabel}, {item.sizeWeight}, {item.quantity} un.
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
                  {order.address.city}, CEP{" "}
                  {formatPostalCode(order.address.postalCode)}
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

            <div className={styles.actions}>
              <Link href={`/conta/pedidos/${order.number}`} className={`link-underline ${styles.detail}`}>
                Ver detalhes
              </Link>
              {order.status === "recebido" && (
                <Link href={`/pedido/${order.number}/pagamento`} className={`btn btn-primary ${styles.pay}`}>
                  <Icon icon={order.paymentMethod === "pix" ? QrCode : CreditCard} size={16} />
                  Pagar agora
                </Link>
              )}
            </div>
          </li>
        );
      })}
      </ul>
    </div>
  );
}

/**
 * Campo de data com o ícone da marca: o seletor nativo do navegador fica
 * invisível por cima do campo, então clicar em qualquer ponto abre o calendário.
 */
function DateField({
  value,
  min,
  max,
  onChange,
}: {
  value: string;
  min?: string;
  max?: string;
  onChange: (valor: string) => void;
}) {
  return (
    <span className={styles.control}>
      <Icon icon={CalendarDays} size={15} />
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        data-empty={value === "" || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}
