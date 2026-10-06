"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loginRequest,
  logoutRequest,
  refreshSession,
  registerRequest,
  setAccessToken,
  setSessionLostHandler,
  type PublicUser,
  type RegisterInput,
} from "@/lib/api";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: PublicUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (input: RegisterInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// `tb_role` is a non-sensitive hint cookie set by the API. It tells us whether a
// refresh attempt is worth making, and it is what Next's proxy.ts reads.
const hasRoleHint = () => document.cookie.split("; ").some((c) => c.startsWith("tb_role="));
const clearRoleHint = () => {
  document.cookie = "tb_role=; Max-Age=0; path=/";
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;

    setSessionLostHandler(() => {
      clearRoleHint();
      queryClient.clear();
      setUser(null);
      setStatus("anonymous");
    });

    async function bootstrap() {
      const session = hasRoleHint() ? await refreshSession() : await Promise.resolve(null);
      if (!active) return;
      if (session) {
        setUser(session.user);
        setStatus("authenticated");
      } else {
        clearRoleHint();
        setUser(null);
        setStatus("anonymous");
      }
    }
    void bootstrap();

    return () => {
      active = false;
      setSessionLostHandler(null);
    };
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await loginRequest(email, password);
    setUser(user);
    setStatus("authenticated");
    return user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user } = await registerRequest(input);
    setUser(user);
    setStatus("authenticated");
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      clearRoleHint();
      queryClient.clear();
      setUser(null);
      setStatus("anonymous");
    }
  }, [queryClient]);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}