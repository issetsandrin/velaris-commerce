"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart/CartContext";
import { useStoreConfig } from "./config/StoreConfigContext";
import { LOGO_PADRAO } from "@/lib/marca";
import { eRotaDeConta } from "@/lib/rotas";
import { useAuth } from "./auth/AuthContext";
import { Icon } from "./Icon";
import { AccountMenu } from "./AccountMenu";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

const links = [
  { href: "/colecao", label: "Coleção" },
  { href: "/#colecoes", label: "Aromas" },
  { href: "/#como-fazemos", label: "Como fazemos" },
];

export function Header() {
  const { count, open } = useCart();
  const { user, status } = useAuth();
  const { config } = useStoreConfig();
  const pathname = usePathname();
  // No celular a navegação não cabe na barra: vira um painel que abre aqui.
  const [menuAberto, setMenuAberto] = useState(false);

  // Trocar de página fecha o painel: ajuste na renderização, não num efeito.
  const [rotaAnterior, setRotaAnterior] = useState(pathname);
  if (rotaAnterior !== pathname) {
    setRotaAnterior(pathname);
    setMenuAberto(false);
  }

  useEffect(() => {
    if (!menuAberto) return;

    const noTeclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setMenuAberto(false);
    };

    document.addEventListener("keydown", noTeclado);
    return () => document.removeEventListener("keydown", noTeclado);
  }, [menuAberto]);

  // Telas de conta têm barra própria dentro do painel.
  if (eRotaDeConta(pathname)) return null;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Velaris, página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.brand.logo ?? LOGO_PADRAO} alt="Velaris" className={styles.logo} />
        </Link>

        <button
          type="button"
          className={styles.menuBotao}
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-expanded={menuAberto}
          aria-controls="menu-celular"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        >
          <Icon icon={menuAberto ? X : Menu} size={20} />
        </button>

        <nav className={styles.nav} aria-label="Principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          {status === "ready" && (
            user ? (
              <AccountMenu name={user.name} />
            ) : (
              <Link href="/entrar" className={styles.account} aria-current={pathname === "/entrar" ? "page" : undefined}>
                <Icon icon={UserRound} size={17} />
                Entrar
              </Link>
            )
          )}
        <button type="button" className={styles.cart} onClick={open} aria-label={`Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}`}>
          <Icon icon={ShoppingBag} size={17} />
          <span>Carrinho</span>
          <span key={count} className={styles.count} data-empty={count === 0 || undefined}>
            {count}
          </span>
        </button>
        </div>
      </div>

      <nav
        id="menu-celular"
        className={styles.menu}
        data-aberto={menuAberto || undefined}
        aria-label="Principal"
        hidden={!menuAberto}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={styles.menuLink}
            onClick={() => setMenuAberto(false)}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
