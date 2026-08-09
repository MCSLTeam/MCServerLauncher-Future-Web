"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { authApi, publicApi, setUnauthorizedHandler } from "@/lib/api";
import { clearToken, readToken, writeToken } from "@/lib/auth-storage";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import type { SessionInfo, UserInfo } from "@/lib/types";
import { tKey } from "@/lib/i18n/translate";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: UserInfo | null;
  refreshUser: () => Promise<UserInfo | null>;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  register: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: (clearAllSessions?: boolean) => Promise<void>;
  listSessions: () => Promise<SessionInfo[] | null>;
  deleteSession: (
    tokenId: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  changePassword: (
    oldPassword: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  listUsers: () => Promise<UserInfo[] | null>;
  createUser: (input: {
    username: string;
    password: string;
    permissions: string[];
  }) => Promise<{ ok: boolean; message?: string }>;
  deleteUser: (username: string) => Promise<{ ok: boolean; message?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (
      isTauriRuntime() &&
      (pathname?.startsWith("/login") ||
        pathname?.startsWith("/register") ||
        pathname?.startsWith("/account") ||
        pathname?.startsWith("/users") ||
        pathname?.startsWith("/welcome"))
    ) {
      router.replace("/dashboard/");
    }
  }, [pathname, router]);

  const refreshUser = useCallback(async () => {
    const current = readToken();
    if (!current) {
      setUser(null);
      setToken(null);
      return null;
    }
    const result = await authApi<UserInfo>("/api/user/info/self");
    if (!result.ok || !result.data) {
      setUser(null);
      if (result.err === "invalid-token") {
        setToken(null);
      }
      return null;
    }
    setToken(current);
    setUser(result.data);
    return result.data;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      if (isTauriRuntime()) return;
      if (
        !pathname?.startsWith("/login") &&
        !pathname?.startsWith("/register") &&
        !pathname?.startsWith("/welcome")
      ) {
        void import("@/lib/auth-routing").then(
          ({ resolveUnauthedDestination }) => {
            void resolveUnauthedDestination().then((dest) =>
              router.replace(dest),
            );
          },
        );
      }
    });
    void (async () => {
      // Tauri 跳过登录页，但节点/创建实例仍依赖 Actix 会话与权限。
      // 本机 bootstrap 一个 desktop session，再 hydrate 用户权限。
      if (isTauriRuntime()) {
        const existing = readToken();
        if (existing) {
          setToken(existing);
          const userInfo = await refreshUser();
          if (userInfo) {
            setReady(true);
            return;
          }
        }
        const bootstrap = await publicApi<string>(
          "/api/account/desktop-session",
          {
            method: "POST",
          },
        );
        if (bootstrap.ok && bootstrap.data) {
          writeToken(bootstrap.data, true);
          setToken(bootstrap.data);
          await refreshUser();
        }
        setReady(true);
        return;
      }
      const existing = readToken();
      setToken(existing);
      if (existing) {
        await refreshUser();
      }
      setReady(true);
    })();
    return () => setUnauthorizedHandler(null);
  }, [pathname, refreshUser, router]);

  const login = useCallback(
    async (username: string, password: string, remember: boolean) => {
      const result = await publicApi<string>("/api/account/login", {
        method: "POST",
        body: { username, password, remember },
      });
      if (!result.ok || !result.data) {
        return {
          ok: false as const,
          message: result.message ?? tKey("web.auth.login-failed"),
        };
      }
      writeToken(result.data, remember);
      setToken(result.data);
      await refreshUser();
      return { ok: true as const };
    },
    [refreshUser],
  );

  const register = useCallback(async (username: string, password: string) => {
    const result = await publicApi<unknown>("/api/account/register", {
      method: "POST",
      body: { username, password },
    });
    if (!result.ok) {
      return {
        ok: false as const,
        message: result.message ?? tKey("web.auth.register-failed"),
      };
    }
    // 公开注册仅创建首个管理员；成功后需自行登录（与 Vue 一致）
    return { ok: true as const };
  }, []);

  const logout = useCallback(
    async (clearAllSessions = false) => {
      if (clearAllSessions) {
        await authApi("/api/session/self", {
          method: "DELETE",
          silentAuthError: true,
        });
      } else {
        await authApi("/api/account/logout", {
          method: "GET",
          silentAuthError: true,
        });
      }
      clearToken();
      setToken(null);
      setUser(null);
      router.replace("/login/");
    },
    [router],
  );

  const listSessions = useCallback(async () => {
    if (isTauriRuntime()) return [];
    const result = await authApi<SessionInfo[]>("/api/session/self");
    if (!result.ok) return null;
    return result.data ?? [];
  }, []);

  const deleteSession = useCallback(async (tokenId: string) => {
    const result = await authApi(
      `/api/session/${encodeURIComponent(tokenId)}`,
      {
        method: "DELETE",
      },
    );
    return { ok: result.ok, message: result.message };
  }, []);

  const changePassword = useCallback(
    async (oldPassword: string, password: string) => {
      const result = await authApi("/api/user/password", {
        method: "PUT",
        body: { old_password: oldPassword, password },
      });
      return { ok: result.ok, message: result.message };
    },
    [],
  );

  const listUsers = useCallback(async () => {
    const result = await authApi<UserInfo[]>("/api/user/info/all");
    if (!result.ok) return null;
    return result.data ?? [];
  }, []);

  const createUser = useCallback(
    async (input: {
      username: string;
      password: string;
      permissions: string[];
    }) => {
      const result = await authApi("/api/user/create", {
        method: "POST",
        body: {
          username: input.username,
          password: input.password,
          permissions: input.permissions,
        },
      });
      return { ok: result.ok, message: result.message };
    },
    [],
  );

  const deleteUser = useCallback(async (username: string) => {
    const result = await authApi(`/api/user/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    return { ok: result.ok, message: result.message };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      refreshUser,
      login,
      register,
      logout,
      listSessions,
      deleteSession,
      changePassword,
      listUsers,
      createUser,
      deleteUser,
    }),
    [
      ready,
      token,
      user,
      refreshUser,
      login,
      register,
      logout,
      listSessions,
      deleteSession,
      changePassword,
      listUsers,
      createUser,
      deleteUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export async function fetchShouldRegister(): Promise<boolean> {
  const result = await publicApi<boolean>("/api/account/should-register");
  return Boolean(result.ok && result.data);
}
