import type { StoreConfig } from "./api";

export interface FreteGratis {
  /** Menor valor de compra que libera frete grátis em alguma entrega, ou null se nenhuma oferece. */
  limite: number | null;
  /** Quanto falta para alcançar esse limite. */
  falta: number;
  /** Já vale frete grátis em pelo menos uma entrega. */
  disponivel: boolean;
  /** Vale em todas as entregas ativas. */
  emTodas: boolean;
  /** Nome da entrega mais barata que sai de graça agora. */
  entrega: string | null;
}

/**
 * O frete grátis é por forma de entrega: dizer "frete grátis" olhando só o
 * limite geral da loja mente quando a entrega escolhida não oferece o benefício.
 */
export function freteGratisDe(config: StoreConfig, subtotal: number): FreteGratis {
  const entregas = config.shippingMethods;
  const comBeneficio = entregas.filter((entrega) => entrega.freeFrom !== null);

  if (comBeneficio.length === 0) {
    return { limite: null, falta: 0, disponivel: false, emTodas: false, entrega: null };
  }

  const limite = Math.min(...comBeneficio.map((entrega) => entrega.freeFrom as number));
  const liberadas = comBeneficio.filter((entrega) => subtotal >= (entrega.freeFrom as number));

  return {
    limite,
    falta: Math.max(0, limite - subtotal),
    disponivel: subtotal > 0 && liberadas.length > 0,
    emTodas: liberadas.length === entregas.length && entregas.length > 0,
    entrega: liberadas[0]?.name ?? null,
  };
}
