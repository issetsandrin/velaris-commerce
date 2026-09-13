"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { useAuth } from "@/components/auth/AuthContext";
import { useStoreConfig } from "@/components/config/StoreConfigContext";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Spinner";
import { Check, Clock, ShoppingBag, Zap } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product, SizeKey } from "@/lib/products";
import styles from "./AddToCart.module.css";

export function AddToCart({ product }: { product: Product }) {
  const { add, close, status, busy, error } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { config } = useStoreConfig();
  const MAX_QUANTITY = config.maxQuantityPerItem;
  const [sizeKey, setSizeKey] = useState<SizeKey>(() => {
    const media = product.sizes.find((item) => item.key === "m");
    if (media?.inStock) return "m";
    return product.sizes.find((item) => item.inStock)?.key ?? "m";
  });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const size = product.sizes.find((item) => item.key === sizeKey) ?? product.sizes[1];
  const total = size.price * quantity;
  const maxQuantity = Math.max(1, Math.min(MAX_QUANTITY, size.stock));

  function changeQuantity(delta: number) {
    setQuantity((current) => Math.min(maxQuantity, Math.max(1, current + delta)));
  }

  function chooseSize(key: SizeKey) {
    setSizeKey(key);
    setQuantity(1);
  }

  async function handleAdd() {
    const ok = await add(product.slug, size.key, quantity);
    if (!ok) return;
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 1800);
  }

  /** Põe no carrinho e segue direto para o fechamento, sem abrir a gaveta. */
  async function handleBuyNow() {
    const ok = await add(product.slug, size.key, quantity);
    if (!ok) return;
    close();
    router.push(user ? "/checkout" : "/entrar?next=%2Fcheckout");
  }

  const disabled = status !== "ready" || busy || !size.inStock;
  const label = !size.inStock
    ? "Esgotado"
    : status === "loading"
      ? "Carregando…"
      : busy
        ? "Adicionando…"
        : added
          ? "Adicionada ao carrinho"
          : "Adicionar ao carrinho";

  return (
    <div className={styles.root}>
      <fieldset className={styles.sizes}>
        <legend className={styles.legend}>Tamanho</legend>
        <div className={styles.options}>
          {product.sizes.map((option, index) => {
            const active = option.key === sizeKey;
            return (
              <label
                key={option.key}
                className={styles.option}
                data-active={active || undefined}
                data-soldout={!option.inStock || undefined}
                data-sale={option.onSale || undefined}
              >
                <input
                  type="radio"
                  name="tamanho"
                  value={option.key}
                  checked={active}
                  onChange={() => chooseSize(option.key)}
                  className="visually-hidden"
                />
                {option.onSale && option.inStock && <span className={styles.saleTag}>Promoção</span>}
                <span className={styles.check} aria-hidden="true">
                  <Check size={14} strokeWidth={3} />
                </span>
                <span className={styles.silhouette} aria-hidden="true">
                  <MiniCandle level={index} wax={product.wax} />
                </span>
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionMeta}>{option.weight}</span>
                <span className={styles.optionMeta}>
                  <Icon icon={Clock} size={13} />
                  {option.burnHours} h de queima
                </span>
                <span className={styles.optionPrice}>
                  {option.onSale && <s className={styles.optionListPrice}>{formatPrice(option.listPrice)}</s>}
                  <span className="price">{formatPrice(option.price)}</span>
                </span>
                <span className={styles.optionStock} data-soldout={!option.inStock || undefined}>
                  {!option.inStock ? "Esgotado" : option.lowStock ? `Últimas ${option.stock} unidades` : "Em estoque"}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.buy}>
        <div className={styles.priceBlock}>
          <span className={`price ${styles.price}`} data-sale={size.onSale || undefined}>
            {formatPrice(total)}
          </span>
          {quantity > 1 ? (
            <span className={styles.unitPrice}>
              {quantity} × {formatPrice(size.price)}
            </span>
          ) : size.onSale ? (
            <span className={styles.unitPrice}>
              de <s>{formatPrice(size.listPrice)}</s>
              {size.promoEndsAt
                ? ` até ${new Date(size.promoEndsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
                : ""}
            </span>
          ) : null}
        </div>

        <div className={styles.actions}>
          <div className={styles.qty} role="group" aria-label="Quantidade">
            <button
              type="button"
              onClick={() => changeQuantity(-1)}
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => changeQuantity(1)}
              disabled={quantity >= maxQuantity}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className={`btn btn-primary ${styles.button}`}
            onClick={() => void handleAdd()}
            disabled={disabled}
            aria-busy={busy}
          >
            {busy ? <Spinner size={17} /> : <Icon icon={ShoppingBag} size={17} />}
            {label}
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${styles.button}`}
            onClick={() => void handleBuyNow()}
            disabled={disabled}
          >
            <Icon icon={Zap} size={17} />
            Comprar agora
          </button>
        </div>
      </div>
      {status === "error" && error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Silhueta da vela em três alturas, para dar escala visual aos tamanhos. */
function MiniCandle({ level, wax }: { level: number; wax: string }) {
  const height = 22 + level * 9;
  const width = 26 + level * 4;
  const x = (48 - width) / 2;
  const y = 48 - height;
  return (
    <svg viewBox="0 0 48 50" width="48" height="50">
      <rect x={x} y={y + 5} width={width} height={height - 5} rx="3" fill={wax} />
      <rect x={x} y={y} width={width} height={height} rx="3" fill="rgba(255,255,255,0.35)" stroke="rgba(122,93,41,0.5)" />
      <rect x="23.2" y={y - 5} width="1.6" height="6" rx="0.8" fill="#4a3818" />
      <ellipse cx="24" cy="49" rx={width / 2} ry="1.5" fill="rgba(122,93,41,0.12)" />
    </svg>
  );
}
