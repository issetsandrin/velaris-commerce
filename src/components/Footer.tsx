"use client";

import Link from "next/link";
import { useStoreConfig } from "./config/StoreConfigContext";
import { formatPrice } from "@/lib/format";
import { Icon } from "./Icon";
import { AtSign, Flame, Mail, RotateCcw, Truck } from "lucide-react";
import styles from "./Footer.module.css";

export function Footer() {
  const { config } = useStoreConfig();
  return (
    <footer className={styles.footer}>
      <div className={`container reveal-stagger ${styles.inner}`}>
        <div data-reveal>
          <p className={styles.brand}>Velaris</p>
          <p className={styles.note}>
            Velas de cera de coco, feitas à mão em pequenos lotes em Curitiba. Fragrâncias sem
            ftalatos, pavio de algodão, potes que você vai querer reaproveitar.
          </p>
        </div>

        <nav className={styles.cols} aria-label="Rodapé" data-reveal>
          <div>
            <p className={styles.colTitle}>Loja</p>
            <Link href="/colecao">Toda a coleção</Link>
            <Link href="/colecao?colecao=casa">Casa</Link>
            <Link href="/colecao?colecao=jardim">Jardim</Link>
            <Link href="/colecao?colecao=noite">Noite</Link>
          </div>
          <div>
            <p className={styles.colTitle}>Ajuda</p>
            <Link href="/#como-fazemos" className={styles.iconLink}>
              <Icon icon={Flame} size={16} />
              Como cuidar da vela
            </Link>
            <Link href="/#como-fazemos" className={styles.iconLink}>
              <Icon icon={Truck} size={16} />
              Envio e prazos
            </Link>
            <Link href="/#como-fazemos" className={styles.iconLink}>
              <Icon icon={RotateCcw} size={16} />
              Trocas
            </Link>
          </div>
          <div>
            <p className={styles.colTitle}>Contato</p>
            <a href="mailto:ola@velaris.com.br" className={styles.iconLink}>
              <Icon icon={Mail} size={16} />
              ola@velaris.com.br
            </a>
            <a href="https://instagram.com" rel="noreferrer" target="_blank" className={styles.iconLink}>
              <Icon icon={AtSign} size={16} />
              Instagram
            </a>
          </div>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>Velaris Velas Ltda.</span>
        <span className={styles.iconLink}>
          <Icon icon={Truck} size={15} />
          Frete grátis a partir de {formatPrice(config.shipping.freeFrom)} para todo o Brasil.
        </span>
      </div>
    </footer>
  );
}
