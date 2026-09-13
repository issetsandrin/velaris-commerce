"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Package, UserRound } from "lucide-react";
import { useAuth } from "./auth/AuthContext";
import { useNotices } from "./notices/NoticesContext";
import { Icon } from "./Icon";
import styles from "./AccountMenu.module.css";

export function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { unread } = useNotices();
  const firstName = name.split(" ")[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span>{firstName}</span>
        <Icon icon={ChevronDown} size={15} className={styles.chevron} />
      </button>

      <div id={menuId} role="menu" className={styles.menu} hidden={!open}>
        <p className={styles.menuName}>{name}</p>
        <Link href="/conta" role="menuitem" className={styles.item} aria-current={pathname === "/conta" ? "page" : undefined} onClick={() => setOpen(false)}>
          <Icon icon={UserRound} size={17} />
          Perfil
        </Link>
        <Link href="/conta/pedidos" role="menuitem" className={styles.item} aria-current={pathname === "/conta/pedidos" ? "page" : undefined} onClick={() => setOpen(false)}>
          <Icon icon={Package} size={17} />
          Meus pedidos
        </Link>
        <Link
          href="/conta/notificacoes"
          role="menuitem"
          className={styles.item}
          aria-current={pathname === "/conta/notificacoes" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Icon icon={Bell} size={17} />
          Notificações
          {unread > 0 && <span className={styles.badge}>{unread}</span>}
        </Link>
        <button type="button" role="menuitem" className={styles.item} onClick={() => void handleLogout()}>
          <Icon icon={LogOut} size={17} />
          Sair
        </button>
      </div>
    </div>
  );
}
