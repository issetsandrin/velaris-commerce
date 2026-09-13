"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  getAuthToken,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  me,
  register as apiRegister,
  setAuthToken,
  type LoginPayload,
  type RegisterPayload,
  type User,
} from "@/lib/api";

type Status = "loading" | "ready";

interface AuthValue {
  status: Status;
  user: User | null;
  login: (payload: LoginPayload, cartToken: string | null) => Promise<User>;
  register: (payload: RegisterPayload, cartToken: string | null) => Promise<User>;
  loginWithGoogle: (credential: string, cartToken: string | null) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const load = async () => {
      if (!getAuthToken()) {
        setStatus("ready");
        return;
      }
      try {
        setUser(await me());
      } catch (error) {
        // token expirado ou revogado: volta a visitante
        if (error instanceof ApiError && error.status === 401) setAuthToken(null);
      } finally {
        setStatus("ready");
      }
    };
    void load();
  }, []);

  const login = useCallback(async (payload: LoginPayload, cartToken: string | null) => {
    const response = await apiLogin(payload, cartToken);
    setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload, cartToken: string | null) => {
    const response = await apiRegister(payload, cartToken);
    setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, cartToken: string | null) => {
    const response = await apiLoginWithGoogle(credential, cartToken);
    setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // token já inválido: segue com a saída local
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ status, user, login, register, loginWithGoogle, logout, setUser }),
    [status, user, login, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return context;
}
