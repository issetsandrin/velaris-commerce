import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Icon } from "../Icon";
import { LoginCarousel } from "./LoginCarousel";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <section className={styles.page}>
      <aside className={styles.panel}>
        <div className={styles.glow} aria-hidden="true" />
        <LoginCarousel />
      </aside>

      <div className={styles.formSide}>
        <div className={styles.topbar}>
          <Link href="/" className={styles.brand} aria-label="Velaris, página inicial">
            Velaris
          </Link>
          <Link href="/" className={styles.back}>
            <Icon icon={ArrowLeft} size={16} />
            Voltar à loja
          </Link>
        </div>
        <div className={styles.card}>{children}</div>
      </div>
    </section>
  );
}
