"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart/CartContext";
import { useAuth } from "./auth/AuthContext";
import { Icon } from "./Icon";
import { AccountMenu } from "./AccountMenu";
import { ShoppingBag, UserRound } from "lucide-react";
import styles from "./Header.module.css";

const links = [
  { href: "/colecao", label: "Coleção" },
  { href: "/#colecoes", label: "Aromas" },
  { href: "/#como-fazemos", label: "Como fazemos" },
];

export function Header() {
  const { count, open } = useCart();
  const { user, status } = useAuth();
  const pathname = usePathname();

  // Telas de entrar e criar conta não mostram a navbar.
  if (pathname === "/entrar" || pathname === "/cadastro") return null;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Velaris, página inicial">
          Velaris
        </Link>

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
    </header>
  );
}
