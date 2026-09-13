"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
  type Cart,
  type CartItem,
} from "@/lib/api";
import type { SizeKey } from "@/lib/products";
import { useAuth } from "../auth/AuthContext";

const TOKEN_KEY = "velaris.cart.token";

type Status = "loading" | "ready" | "error";

interface CartValue {
  status: Status;
  error: string | null;
  busy: boolean;
  token: string | null;
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, size: SizeKey, quantity?: number) => Promise<boolean>;
  setQuantity: (itemId: number, quantity: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  clearLocal: () => void;
  reload: () => Promise<void>;
  quantityOf: (slug: string, size: SizeKey) => CartItem | undefined;
}

const CartContext = createContext<CartValue | null>(null);

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // armazenamento indisponível
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Algo deu errado ao atualizar o carrinho.";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const { status: authStatus, user } = useAuth();
  const userId = user?.id ?? null;

  const applyCart = useCallback((next: Cart) => {
    tokenRef.current = next.token;
    writeToken(next.token);
    setCart(next);
    setStatus("ready");
    setError(null);
  }, []);

  const load = useCallback(async () => {
    try {
      applyCart(await fetchCart(tokenRef.current));
    } catch (fetchError) {
      setStatus("error");
      setError(messageFrom(fetchError));
    }
  }, [applyCart]);

  const reload = useCallback(async () => {
    setStatus("loading");
    await load();
  }, [load]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    tokenRef.current = readToken();
    void load();
  }, [load, authStatus, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const mutate = useCallback(
    async (action: () => Promise<Cart>): Promise<boolean> => {
      setBusy(true);
      try {
        applyCart(await action());
        return true;
      } catch (mutationError) {
        setError(messageFrom(mutationError));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [applyCart],
  );

  const add = useCallback(
    async (slug: string, size: SizeKey, quantity = 1) => {
      const ok = await mutate(() => addCartItem(tokenRef.current, slug, size, quantity));
      setOpen(true);
      return ok;
    },
    [mutate],
  );

  const setQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      const token = tokenRef.current;
      if (!token) return;
      await mutate(() =>
        quantity <= 0 ? removeCartItem(token, itemId) : updateCartItem(token, itemId, quantity),
      );
    },
    [mutate],
  );

  const remove = useCallback(
    async (itemId: number) => {
      const token = tokenRef.current;
      if (!token) return;
      await mutate(() => removeCartItem(token, itemId));
    },
    [mutate],
  );

  const clearLocal = useCallback(() => {
    setCart((current) => (current ? { ...current, items: [], count: 0, subtotal: 0 } : current));
  }, []);

  const value = useMemo<CartValue>(() => {
    const items = cart?.items ?? [];
    return {
      status,
      error,
      busy,
      token: cart?.token ?? null,
      items,
      count: cart?.count ?? 0,
      subtotal: cart?.subtotal ?? 0,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity,
      remove,
      clearLocal,
      reload,
      quantityOf: (slug, size) =>
        items.find((item) => item.product.slug === slug && item.size.key === size),
    };
  }, [cart, status, error, busy, isOpen, add, setQuantity, remove, clearLocal, reload]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider");
  return context;
}
