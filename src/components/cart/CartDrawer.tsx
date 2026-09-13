"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { useAuth } from "../auth/AuthContext";
import { CandleArt } from "../CandleArt";
import { Icon } from "../Icon";
import { Info, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useStoreConfig } from "../config/StoreConfigContext";
import { formatPrice } from "@/lib/format";
import styles from "./CartDrawer.module.css";

export function CartDrawer() {
  const { items, subtotal, isOpen, close, setQuantity, remove, status, error, busy, reload } = useCart();
  const { user } = useAuth();
  const checkoutHref = user ? "/checkout" : "/entrar?next=%2Fcheckout";
  const { config } = useStoreConfig();
  const missing = Math.max(0, config.shipping.freeFrom - subtotal);
  const tab = isOpen ? 0 : -1;

  return (
    <div className={styles.root} data-open={isOpen || undefined} aria-hidden={!isOpen}>
      <button type="button" className={styles.backdrop} onClick={close} aria-label="Fechar carrinho" tabIndex={tab} />

      <aside className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-busy={busy}>
        <header className={styles.head}>
          <h2 id="cart-title" className={styles.title}>
            Carrinho
          </h2>
          <button type="button" onClick={close} className={styles.close} tabIndex={tab}>
            Fechar
            <Icon icon={X} size={16} />
          </button>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            <Icon icon={Info} size={17} />
            <div className={styles.errorBody}>
              <p>{error}</p>
              {status === "error" && (
                <button type="button" onClick={() => void reload()} className="link-underline" tabIndex={tab}>
                  Tentar de novo
                </button>
              )}
            </div>
          </div>
        )}

        {status === "loading" && items.length === 0 ? (
          <div className={styles.empty}>
            <p>Carregando…</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <Icon icon={ShoppingBag} size={32} />
            <p>Nada por aqui ainda.</p>
            <Link href="/colecao" onClick={close} className="link-underline" tabIndex={tab}>
              Ver a coleção
            </Link>
          </div>
        ) : (
          <>
            <ul className={styles.list} data-busy={busy || undefined}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <Link href={`/produto/${item.product.slug}`} onClick={close} className={styles.thumb} tabIndex={tab}>
                    <CandleArt wax={item.product.wax} collection={item.product.collection} />
                  </Link>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <Link href={`/produto/${item.product.slug}`} onClick={close} className={styles.itemName} tabIndex={tab}>
                        {item.product.name}
                      </Link>
                      <span className={`price ${styles.itemPrice}`}>
                        {formatPrice(item.size.price * item.quantity)}
                      </span>
                    </div>
                    <p className={styles.itemMeta}>
                      {item.size.label}, {item.size.weight}
                    </p>
                    <div className={styles.itemActions}>
                      <div className={styles.qty} role="group" aria-label="Quantidade">
                        <button type="button" onClick={() => void setQuantity(item.id, item.quantity - 1)} aria-label="Diminuir" tabIndex={tab} disabled={busy}>
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => void setQuantity(item.id, item.quantity + 1)} aria-label="Aumentar" tabIndex={tab} disabled={busy}>
                          +
                        </button>
                      </div>
                      <button type="button" className={styles.remove} onClick={() => void remove(item.id)} tabIndex={tab} disabled={busy}>
                        <Icon icon={Trash2} size={14} />
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className={styles.foot}>
              <p className={styles.shipping}>
                <Icon icon={Truck} size={16} />
                {missing > 0 ? `Faltam ${formatPrice(missing)} para o frete grátis.` : "Frete grátis liberado."}
              </p>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <span key={subtotal} className={`price ${styles.subtotalValue}`}>
                  {formatPrice(subtotal)}
                </span>
              </div>
              <Link href={checkoutHref} onClick={close} className={`btn btn-primary ${styles.checkout}`} tabIndex={tab}>
                {user ? "Finalizar compra" : "Entrar para finalizar"}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
