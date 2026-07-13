import { createId } from "@/lib/validation";
import type { SavedNode } from "@/lib/types";

const STORAGE_KEY = "mcsl-web-nodes";
const TOKEN_PREFIX = "mcsl-web-node-token:";

export type NodeInput = {
  name: string;
  host: string;
  port: string;
  secure: boolean;
  token?: string;
};

function readAll(): SavedNode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedNode[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(nodes: SavedNode[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}

function setToken(id: string, token: string | undefined) {
  if (!token) {
    window.localStorage.removeItem(TOKEN_PREFIX + id);
    return;
  }
  window.localStorage.setItem(TOKEN_PREFIX + id, token);
}

export function listNodes(): SavedNode[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getNode(id: string): SavedNode | undefined {
  return readAll().find((n) => n.id === id);
}

export function getNodeToken(id: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_PREFIX + id);
}

export function addNode(input: NodeInput): SavedNode {
  const id = createId();
  const now = Date.now();
  const node: SavedNode = {
    id,
    name: input.name.trim(),
    type: "mcsl-daemon",
    host: input.host.trim(),
    port: input.port.trim(),
    secure: input.secure,
    hasToken: Boolean(input.token?.trim()),
    createdAt: now,
    updatedAt: now,
  };
  const nodes = readAll();
  nodes.push(node);
  writeAll(nodes);
  if (input.token?.trim()) setToken(id, input.token.trim());
  return node;
}

export function updateNode(id: string, input: NodeInput): SavedNode | null {
  const nodes = readAll();
  const index = nodes.findIndex((n) => n.id === id);
  if (index < 0) return null;
  const prev = nodes[index];
  const next: SavedNode = {
    ...prev,
    name: input.name.trim(),
    host: input.host.trim(),
    port: input.port.trim(),
    secure: input.secure,
    hasToken: input.token?.trim() ? true : prev.hasToken,
    updatedAt: Date.now(),
  };
  nodes[index] = next;
  writeAll(nodes);
  if (input.token?.trim()) setToken(id, input.token.trim());
  return next;
}

export function removeNode(id: string): void {
  writeAll(readAll().filter((n) => n.id !== id));
  setToken(id, undefined);
}

export function nodeAddress(node: SavedNode): string {
  const scheme = node.secure ? "wss" : "ws";
  return `${scheme}://${node.host}:${node.port}`;
}
