"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Revela ao rolar qualquer elemento marcado com `data-reveal`, sem exigir que
 * ele vire componente cliente: basta o atributo no JSX, inclusive em página
 * renderizada no servidor.
 *
 * O CSS só esconde o elemento quando `data-motion` está no <html>, e esse
 * atributo é ligado aqui, depois do primeiro quadro. Assim, se o JavaScript não
 * rodar, a loja continua inteira na tela — nada de página em branco.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal-seen", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    let queued = 0;

    const scan = () => {
      queued = 0;
      const limit = window.innerHeight * 0.9;
      document.querySelectorAll("[data-reveal]:not([data-reveal-seen])").forEach((element) => {
        // O que já está na tela entra direto: evita piscada no topo da página.
        if (element.getBoundingClientRect().top < limit) {
          element.setAttribute("data-reveal-seen", "");
          return;
        }
        observer.observe(element);
      });
      document.documentElement.setAttribute("data-motion", "");
    };

    const schedule = () => {
      if (queued) return;
      queued = window.requestAnimationFrame(scan);
    };

    // A primeira passada espera o navegador ficar ocioso, o que na prática é
    // depois da hidratação: marcar um elemento antes disso faz o React
    // reclamar de atributo que ele não renderizou.
    const first = window.requestIdleCallback
      ? window.requestIdleCallback(schedule, { timeout: 300 })
      : window.setTimeout(schedule, 100);

    // Conteúdo que chega depois (filtros, listas que carregam da API).
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(first);
      else window.clearTimeout(first);
      if (queued) window.cancelAnimationFrame(queued);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
