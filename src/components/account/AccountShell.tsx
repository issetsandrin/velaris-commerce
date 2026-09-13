"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Bell, LogOut, Package, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../Icon";
import styles from "./AccountShell.module.css";

const links = [
  { href: "/conta", label: "Perfil", icon: UserRound },
  { href: "/conta/pedidos", label: "Meus pedidos", icon: Package },
  { href: "/conta/notificacoes", label: "Notificações", icon: Bell },
];

/** Layout comum das páginas de conta: exige login e mostra a navegação lateral. */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, logout } = useAuth();
  const leavingRef = useRef(false);

  useEffect(() => {
    if (status === "ready" && !user && !leavingRef.current) {
      router.replace(`/entrar?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, user, router, pathname]);

  if (status === "loading" || !user) {
    return (
      <section className={`container ${styles.page}`}>
        <p className={styles.muted}>Carregando…</p>
      </section>
    );
  }

  async function handleLogout() {
    leavingRef.current = true;
    await logout();
    router.push("/");
  }

  return (
    <section className={`container ${styles.page}`}>
      <div className={styles.layout}>
        <aside className={styles.side}>
          <div className={styles.who}>
            <span className={styles.avatar} aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className={styles.whoName}>{user.name}</p>
              <p className={styles.muted}>{user.email}</p>
            </div>
          </div>
          <nav className={styles.nav} aria-label="Minha conta">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink} aria-current={pathname === link.href ? "page" : undefined}>
                <Icon icon={link.icon} size={18} />
                {link.label}
              </Link>
            ))}
            <button type="button" className={styles.navLink} onClick={() => void handleLogout()}>
              <Icon icon={LogOut} size={18} />
              Sair
            </button>
          </nav>
        </aside>

        <div className={styles.content}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}
