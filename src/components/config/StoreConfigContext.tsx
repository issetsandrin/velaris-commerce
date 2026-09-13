"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STORE_CONFIG, getStoreConfig, type StoreConfig } from "@/lib/api";

interface StoreConfigValue {
  config: StoreConfig;
  loaded: boolean;
}

const StoreConfigContext = createContext<StoreConfigValue>({ config: DEFAULT_STORE_CONFIG, loaded: false });

/** Regras comerciais vindas do painel: frete, limites e formas de pagamento. */
export function StoreConfigProvider({ initial, children }: { initial?: StoreConfig | null; children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(initial ?? (DEFAULT_STORE_CONFIG));
  const [loaded, setLoaded] = useState(Boolean(initial));

  useEffect(() => {
    if (initial) return;
    getStoreConfig()
      .then((remote) => {
        setConfig(remote);
        setLoaded(true);
      })
      .catch(() => {
        // mantém os padrões; a API valida tudo de novo ao fechar o pedido
      });
  }, [initial]);

  const value = useMemo(() => ({ config, loaded }), [config, loaded]);

  return <StoreConfigContext.Provider value={value}>{children}</StoreConfigContext.Provider>;
}

export function useStoreConfig(): StoreConfigValue {
  return useContext(StoreConfigContext);
}
