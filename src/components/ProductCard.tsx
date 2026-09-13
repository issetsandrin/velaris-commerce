"use client";

import Link from "next/link";
import { CandleArt } from "./CandleArt";
import { Icon } from "./Icon";
import { ShoppingBag, Tag } from "lucide-react";
import { useCart } from "./cart/CartContext";
import { collections, families, defaultSize, isSoldOut, type Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import styles from "./ProductCard.module.css";

export function ProductCard({ product, layout = "grade" }: { product: Product; layout?: "grade" | "linha" }) {
  const { add, setQuantity, quantityOf, status, busy } = useCart();
  // O card adiciona o tamanho Média (ou o primeiro com estoque); os três tamanhos ficam na página do produto.
  const size = defaultSize(product);
  const soldOut = isSoldOut(product);
  const inCart = quantityOf(product.slug, size.key);
  const disabled = status !== "ready" || busy || soldOut;
  const canIncrease = !inCart || inCart.quantity < size.stock;
  const href = `/produto/${product.slug}`;

  return (
    <article className={styles.card} data-layout={layout}>
      <Link href={href} className={styles.art} aria-label={`Ver detalhes de ${product.name}`}>
        <CandleArt wax={product.wax} collection={product.collection} className={styles.svg} />
        {soldOut ? (
          <span className={`${styles.badge} ${styles.badgeMuted}`}>Esgotado</span>
        ) : size.onSale ? (
          <span className={styles.badge}>
            <Icon icon={Tag} size={12} />
            Promoção
          </span>
        ) : size.lowStock ? (
          <span className={`${styles.badge} ${styles.badgeSoft}`}>Últimas unidades</span>
        ) : null}
      </Link>

      <div className={styles.body}>
        <div className={styles.heading}>
          <h3 className={styles.name}>
            <Link href={href}>{product.name}</Link>
          </h3>
          <p className={styles.meta}>
            {collections[product.collection].name}, {families[product.family].toLowerCase()}
          </p>
        </div>

        <div className={styles.buy}>
          <div className={styles.priceBlock}>
            {size.onSale && <s className={styles.listPrice}>{formatPrice(size.listPrice)}</s>}
            <span className={`price ${styles.price}`} data-sale={size.onSale || undefined}>
              {formatPrice(size.price)}
            </span>
            <span className={styles.sizeNote}>
              {size.label}, {size.weight}
            </span>
          </div>

          {inCart ? (
            <div className={styles.qty} role="group" aria-label={`Quantidade de ${product.name} no carrinho`}>
              <button type="button" onClick={() => void setQuantity(inCart.id, inCart.quantity - 1)} disabled={disabled} aria-label="Diminuir">
                −
              </button>
              <span aria-live="polite">{inCart.quantity}</span>
              <button type="button" onClick={() => void setQuantity(inCart.id, inCart.quantity + 1)} disabled={disabled || !canIncrease} aria-label="Aumentar" title={canIncrease ? undefined : "Sem mais unidades em estoque"}>
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`btn btn-ghost ${styles.add}`}
              onClick={() => void add(product.slug, size.key, 1)}
              disabled={disabled}
              data-pending={status === "loading" || undefined}
            >
              <Icon icon={ShoppingBag} size={16} />
              {soldOut ? "Esgotado" : status === "loading" ? "Carregando…" : "Adicionar"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
