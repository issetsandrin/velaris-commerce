"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomeBanner } from "@/lib/api";
import styles from "./HeroBanner.module.css";

interface HeroBannerProps {
  banners: HomeBanner[];
  /** Segundos entre um banner e outro. Com um banner só, nada gira. */
  interval: number;
}

export function HeroBanner({ banners, interval }: HeroBannerProps) {
  const [atual, setAtual] = useState(0);
  const gira = banners.length > 1;

  useEffect(() => {
    if (!gira) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setAtual((indice) => (indice + 1) % banners.length),
      Math.max(3, interval) * 1000,
    );

    return () => window.clearInterval(timer);
  }, [gira, banners.length, interval]);

  if (banners.length === 0) return null;

  return (
    <section className={styles.hero} aria-label="Destaques da loja">
      {banners.map((banner, indice) => (
        <div
          key={banner.id}
          className={styles.slide}
          data-ativo={indice === atual || undefined}
          data-align={banner.align}
          aria-hidden={indice !== atual}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.image} alt={banner.title ?? ""} className={styles.imagem} />
          <div className={styles.veu} />

          {(banner.title || banner.text || banner.buttonLabel) && (
            <div className={`container ${styles.conteudo}`}>
              {banner.title && <h1 className={styles.titulo}>{banner.title}</h1>}
              {banner.text && <p className={styles.texto}>{banner.text}</p>}
              {banner.buttonLabel && (
                <Link href={banner.buttonLink || "/colecao"} className={`btn btn-primary ${styles.botao}`} tabIndex={indice === atual ? 0 : -1}>
                  {banner.buttonLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {gira && (
        <div className={styles.pontos} role="tablist" aria-label="Escolher destaque">
          {banners.map((banner, indice) => (
            <button
              key={banner.id}
              type="button"
              role="tab"
              aria-selected={indice === atual}
              aria-label={banner.title ?? `Destaque ${indice + 1}`}
              className={styles.ponto}
              onClick={() => setAtual(indice)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
