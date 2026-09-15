"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  getAuthToken,
  isTwoFactor,
  login as apiLogin,
  loginWithCode as apiLoginWithCode,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  me,
  register as apiRegister,
  setAuthToken,
  type CodePayload,
  type LoginPayload,
  type LoginResult,
  type RegisterPayload,
  type RegisterResult,
  type User,
} from "@/lib/api";

type Status = "loading" | "ready";

interface AuthValue {
  status: Status;
  user: User | null;
  /** Primeiro passo: devolve o desafio do código quando a senha bate. */
  login: (payload: LoginPayload, cartToken: string | null) => Promise<LoginResult>;
  /** Segundo passo: o código do e-mail vira sessão. */
  loginWithCode: (payload: CodePayload, cartToken: string | null) => Promise<User>;
  /** Cadastrar não entra na conta: devolve o aviso de confirmação pendente. */
  register: (payload: RegisterPayload, cartToken: string | null) => Promise<RegisterResult>;
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

    // Com o segundo passo em pé, a sessão só nasce depois do código.
    if (!isTwoFactor(response)) {
      setAuthToken(response.token);
      setUser(response.user);
    }

    return response;
  }, []);

  const loginWithCode = useCallback(async (payload: CodePayload, cartToken: string | null) => {
    const response = await apiLoginWithCode(payload, cartToken);
    setAuthToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(
    (payload: RegisterPayload, cartToken: string | null) => apiRegister(payload, cartToken),
    [],
  );

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
    () => ({ status, user, login, loginWithCode, register, loginWithGoogle, logout, setUser }),
    [status, user, login, loginWithCode, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return context;
}
