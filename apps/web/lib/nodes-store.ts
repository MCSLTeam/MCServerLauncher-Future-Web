import { requestApi } from "@/lib/api";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import type { SavedNode } from "@/lib/types";

const LEGACY_STORAGE_KEY = "mcsl-web-nodes";
const LEGACY_TOKEN_PREFIX = "mcsl-web-node-token:";
const MIGRATED_FLAG = "mcsl-web-nodes-migrated";

export type NodeVisibilityMode = "all" | "selected" | "admins";

export type NodeInput = {
  name: string;
  host: string;
  port: string;
  secure: boolean;
  token?: string;
  visibility?: NodeVisibilityMode;
  visibleTo?: string[];
};

type ApiNode = {
  id: string;
  name: string;
  type?: string;
  host: string;
  port: string;
  secure: boolean;
  has_token?: boolean;
  hasToken?: boolean;
  visibility?: NodeVisibilityMode;
  visible_to?: string[];
  visibleTo?: string[];
  created_at?: number;
  createdAt?: number;
  updated_at?: number;
  updatedAt?: number;
};

let cache: SavedNode[] = [];
/** 内存中的 daemon token（连接用，不写 localStorage） */
const tokenCache = new Map<string, string>();
let hydratePromise: Promise<SavedNode[]> | null = null;

function mapNode(raw: ApiNode): SavedNode {
  return {
    id: raw.id,
    name: raw.name,
    type: "mcsl-daemon",
    host: raw.host,
    port: String(raw.port),
    secure: Boolean(raw.secure),
    hasToken: Boolean(raw.has_token ?? raw.hasToken),
    visibility: raw.visibility ?? "all",
    visibleTo: raw.visible_to ?? raw.visibleTo ?? [],
    createdAt: Number(raw.created_at ?? raw.createdAt ?? Date.now()),
    updatedAt: Number(raw.updated_at ?? raw.updatedAt ?? Date.now()),
  };
}

/** 同步读缓存（需先 await refreshNodes / hydrateNodes） */
export function listNodes(): SavedNode[] {
  return [...cache].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getNode(id: string): SavedNode | undefined {
  return cache.find((n) => n.id === id);
}

/** 同步读内存 token；若未缓存返回 null（请用 getNodeTokenAsync） */
export function getNodeToken(id: string): string | null {
  return tokenCache.get(id) ?? null;
}

export async function getNodeTokenAsync(id: string): Promise<string | null> {
  const cached = tokenCache.get(id);
  if (cached) return cached;
  if (isTauriRuntime()) {
    const token = window.localStorage.getItem(LEGACY_TOKEN_PREFIX + id);
    if (token) tokenCache.set(id, token);
    return token;
  }
  const res = await requestApi<{ token: string }>(`/api/nodes/${id}/token`, {
    auth: true,
  });
  if (!res.ok || !res.data?.token) return null;
  tokenCache.set(id, res.data.token);
  return res.data.token;
}

export function nodeAddress(node: SavedNode): string {
  const scheme = node.secure ? "wss" : "ws";
  return `${scheme}://${node.host}:${node.port}`;
}

export async function refreshNodes(): Promise<SavedNode[]> {
  if (isTauriRuntime()) {
    cache = readLegacyLocalNodes().map((node) => ({
      id: node.id,
      name: node.name,
      type: "mcsl-daemon",
      host: node.host,
      port: node.port,
      secure: node.secure,
      hasToken: true,
      visibility: "all",
      visibleTo: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    for (const node of cache) {
      const token = window.localStorage.getItem(LEGACY_TOKEN_PREFIX + node.id);
      if (token) tokenCache.set(node.id, token);
    }
    return listNodes();
  }
  const res = await requestApi<ApiNode[]>("/api/nodes", { auth: true });
  if (!res.ok || !Array.isArray(res.data)) {
    return listNodes();
  }
  cache = res.data.map(mapNode);
  return listNodes();
}

/** 并发安全的首次拉取（含 localStorage 迁移） */
export function hydrateNodes(): Promise<SavedNode[]> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      if (isTauriRuntime()) return refreshNodes();
      await maybeMigrateLegacyNodes();
      return refreshNodes();
    })();
  }
  return hydratePromise;
}

export async function addNode(input: NodeInput): Promise<SavedNode | null> {
  if (isTauriRuntime()) {
    const now = Date.now();
    const node: SavedNode = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      type: "mcsl-daemon",
      host: input.host.trim(),
      port: input.port.trim(),
      secure: input.secure,
      hasToken: Boolean(input.token?.trim()),
      visibility: "all",
      visibleTo: [],
      createdAt: now,
      updatedAt: now,
    };
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([...cache, node]));
    if (input.token?.trim()) {
      tokenCache.set(node.id, input.token.trim());
      window.localStorage.setItem(
        LEGACY_TOKEN_PREFIX + node.id,
        input.token.trim(),
      );
    }
    cache = [...cache, node];
    return node;
  }
  const res = await requestApi<ApiNode>("/api/nodes", {
    method: "POST",
    auth: true,
    body: {
      name: input.name.trim(),
      host: input.host.trim(),
      port: input.port.trim(),
      secure: input.secure,
      token: input.token?.trim() || null,
      visibility: input.visibility ?? "all",
      visible_to: input.visibleTo ?? [],
    },
  });
  if (!res.ok || !res.data) return null;
  const node = mapNode(res.data);
  if (input.token?.trim()) tokenCache.set(node.id, input.token.trim());
  cache = [...cache.filter((n) => n.id !== node.id), node];
  return node;
}

export async function updateNode(
  id: string,
  input: NodeInput,
): Promise<SavedNode | null> {
  if (isTauriRuntime()) {
    const existing = getNode(id);
    if (!existing) return null;
    const node: SavedNode = {
      ...existing,
      name: input.name.trim(),
      host: input.host.trim(),
      port: input.port.trim(),
      secure: input.secure,
      hasToken: Boolean(input.token?.trim()) || existing.hasToken,
      updatedAt: Date.now(),
    };
    cache = cache.map((item) => (item.id === id ? node : item));
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cache));
    if (input.token?.trim()) {
      tokenCache.set(id, input.token.trim());
      window.localStorage.setItem(LEGACY_TOKEN_PREFIX + id, input.token.trim());
    }
    return node;
  }
  const res = await requestApi<ApiNode>(`/api/nodes/${id}`, {
    method: "PUT",
    auth: true,
    body: {
      name: input.name.trim(),
      host: input.host.trim(),
      port: input.port.trim(),
      secure: input.secure,
      token: input.token?.trim() || null,
      visibility: input.visibility,
      visible_to: input.visibleTo,
    },
  });
  if (!res.ok || !res.data) return null;
  const node = mapNode(res.data);
  if (input.token?.trim()) tokenCache.set(id, input.token.trim());
  cache = cache.map((n) => (n.id === id ? node : n));
  return node;
}

export async function setNodeVisibility(
  id: string,
  visibility: NodeVisibilityMode,
  visibleTo: string[] = [],
): Promise<SavedNode | null> {
  const res = await requestApi<ApiNode>(`/api/nodes/${id}/visibility`, {
    method: "PUT",
    auth: true,
    body: {
      visibility,
      visible_to: visibleTo,
    },
  });
  if (!res.ok || !res.data) return null;
  const node = mapNode(res.data);
  cache = cache.map((n) => (n.id === id ? node : n));
  return node;
}

export async function removeNode(id: string): Promise<boolean> {
  if (isTauriRuntime()) {
    cache = cache.filter((node) => node.id !== id);
    tokenCache.delete(id);
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cache));
    window.localStorage.removeItem(LEGACY_TOKEN_PREFIX + id);
    return true;
  }
  const res = await requestApi<unknown>(`/api/nodes/${id}`, {
    method: "DELETE",
    auth: true,
  });
  if (!res.ok) return false;
  cache = cache.filter((n) => n.id !== id);
  tokenCache.delete(id);
  return true;
}

function readLegacyLocalNodes(): Array<{
  id: string;
  name: string;
  host: string;
  port: string;
  secure: boolean;
  token: string;
}> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedNode[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((n) => {
        const token =
          window.localStorage.getItem(LEGACY_TOKEN_PREFIX + n.id) ?? "";
        return {
          id: n.id,
          name: n.name,
          host: n.host,
          port: n.port,
          secure: Boolean(n.secure),
          token,
        };
      })
      .filter((n) => n.name && n.host && n.port && n.token);
  } catch {
    return [];
  }
}

function clearLegacyLocalNodes() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedNode[];
      if (Array.isArray(parsed)) {
        for (const n of parsed) {
          window.localStorage.removeItem(LEGACY_TOKEN_PREFIX + n.id);
        }
      }
    }
  } catch {
    // ignore
  }
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  window.localStorage.setItem(MIGRATED_FLAG, "1");
}

/** 管理员把浏览器里的旧节点导入后端（全局共享） */
async function maybeMigrateLegacyNodes(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_FLAG) === "1") return;
  const legacy = readLegacyLocalNodes();
  if (legacy.length === 0) {
    window.localStorage.setItem(MIGRATED_FLAG, "1");
    return;
  }
  const list = await requestApi<ApiNode[]>("/api/nodes", { auth: true });
  if (list.ok && Array.isArray(list.data) && list.data.length > 0) {
    clearLegacyLocalNodes();
    return;
  }
  const imported = await requestApi<ApiNode[]>("/api/nodes/import", {
    method: "POST",
    auth: true,
    body: { nodes: legacy },
  });
  if (imported.ok || imported.status === 403) {
    clearLegacyLocalNodes();
  }
}
