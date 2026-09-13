"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./PageTransition.module.css";

/**
 * A `key` pelo caminho faz o <main> ser recriado a cada navegação, e o elemento
 * novo replica a animação de entrada. Só opacidade: o deslocamento fica por
 * conta da revelação de cada bloco, para os dois não se somarem.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main key={pathname} className={styles.main}>
      {children}
    </main>
  );
}
