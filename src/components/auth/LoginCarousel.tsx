"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Package, Quote, Truck } from "lucide-react";
import { Icon } from "../Icon";
import { useStoreConfig } from "../config/StoreConfigContext";
import { formatPrice } from "@/lib/format";
import styles from "./LoginCarousel.module.css";

const INTERVAL_MS = 6000;

type Slide =
  | { kind: "brand"; title: string; text: string }
  | { kind: "quote"; text: string; author: string; place: string }
  | { kind: "perks" };

const slides: Slide[] = [
  {
    kind: "brand",
    title: "Feitas à mão, em lotes de vinte.",
    text: "Cera de coco, pavio de algodão e fragrâncias compostas em Curitiba. Velas para acender todo dia, não só na visita.",
  },
  {
    kind: "quote",
    text: "Comprei a Cedro & Fumaça para o escritório e agora ninguém quer trabalhar em outra sala. Queima limpa, sem cheiro de queimado.",
    author: "Mariana R.",
    place: "Curitiba, PR",
  },
  {
    kind: "quote",
    text: "Pedi na terça, chegou na quinta, embalada como presente. A Figo & Vetiver virou a minha vela de todo fim de tarde.",
    author: "Paulo H.",
    place: "Florianópolis, SC",
  },
  { kind: "perks" },
];

export function LoginCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);
  const { config } = useStoreConfig();

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, index]);

  return (
    <div
      className={styles.root}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Sobre a Velaris"
    >
      <div className={styles.stage}>
        {slides.map((slide, position) => (
          <div
            key={position}
            className={styles.slide}
            data-active={position === index || undefined}
            aria-hidden={position !== index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} de ${slides.length}`}
          >
            {slide.kind === "brand" && (
              <>
                <Icon icon={Flame} size={28} className={styles.glyph} />
                <p className={styles.title}>{slide.title}</p>
                <p className={styles.text}>{slide.text}</p>
              </>
            )}
            {slide.kind === "quote" && (
              <>
                <Icon icon={Quote} size={28} className={styles.glyph} />
                <p className={styles.quote}>{slide.text}</p>
                <p className={styles.author}>
                  {slide.author}
                  <span>{slide.place}</span>
                </p>
              </>
            )}
            {slide.kind === "perks" && (
              <>
                <p className={styles.title}>Sua conta na Velaris</p>
                <ul className={styles.perks}>
                  <li>
                    <Icon icon={Package} size={18} className={styles.perkIcon} />
                    Histórico de pedidos e endereços salvos
                  </li>
                  <li>
                    <Icon icon={Truck} size={18} className={styles.perkIcon} />
                    Frete grátis a partir de {formatPrice(config.shipping.freeFrom)}
                  </li>
                  <li>
                    <Icon icon={Flame} size={18} className={styles.perkIcon} />
                    Carrinho guardado em qualquer dispositivo
                  </li>
                </ul>
              </>
            )}
          </div>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label="Escolher slide">
        {slides.map((_, position) => (
          <button
            key={position}
            type="button"
            role="tab"
            aria-selected={position === index}
            aria-label={`Slide ${position + 1}`}
            className={styles.dot}
            onClick={() => setIndex(position)}
          />
        ))}
      </div>
    </div>
  );
}
