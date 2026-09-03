"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import {
  addTrustRoot,
  loadTrustRoots,
  removeTrustRoot,
  type TrustRoot,
} from "./trust-roots";

function base64ToBytes(base64: string): Uint8Array | null {
  try {
    const binary = atob(base64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function fingerprintOf(base64: string): Promise<string | null> {
  const bytes = base64ToBytes(base64);
  if (!bytes) return null;
  try {
    const buffer = new Uint8Array(bytes).buffer;
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export function TrustRootsPanel({ onChange }: { onChange?: () => void }) {
  const [roots, setRoots] = useState<readonly TrustRoot[]>([]);
  const [publisher, setPublisher] = useState("");
  const [keyId, setKeyId] = useState("");
  const [spki, setSpki] = useState("");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setRoots(loadTrustRoots());
    onChange?.();
  };

  useEffect(refresh, []);

  useEffect(() => {
    let cancelled = false;
    if (!spki.trim()) {
      setFingerprint(null);
      return;
    }
    fingerprintOf(spki).then((value) => {
      if (!cancelled) setFingerprint(value);
    });
    return () => {
      cancelled = true;
    };
  }, [spki]);

  async function add() {
    setError(null);
    const fp = await fingerprintOf(spki);
    if (!publisher.trim() || !keyId.trim() || !spki.trim() || !fp) {
      setError("Publisher, key id and a valid base64 SPKI are required.");
      return;
    }
    addTrustRoot({ publisher: publisher.trim(), keyId: keyId.trim(), publicKeySpkiBase64: spki.trim(), publicKeySha256: fp });
    setPublisher("");
    setKeyId("");
    setSpki("");
    setFingerprint(null);
    refresh();
  }

  return (
    <ConsolePanel>
      <ConsolePanelHeader
        title="Trusted publishers"
        description="Signed .mpx packages are only admitted when their signing key matches one of these roots."
      />
      <div className="space-y-3">
        {roots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trust roots configured. Until a root is added, signed packages are
            rejected by the offline validator.
          </p>
        ) : (
          <div className="space-y-1.5">
            {roots.map((root) => (
              <div key={`${root.publisher}/${root.publicKeySha256}`} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <KeyRound className="size-4 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{root.publisher}</span>
                    <Badge variant="outline">{root.keyId}</Badge>
                  </div>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    SPKI sha256 {root.publicKeySha256}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeTrustRoot(root.publisher, root.publicKeySha256);
                    refresh();
                  }}
                >
                  <Trash2 className="size-3.5 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Add a publisher public key (SPKI)
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={publisher}
              onChange={(event) => setPublisher(event.target.value)}
              placeholder="publisher (e.g. acme)"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            <input
              value={keyId}
              onChange={(event) => setKeyId(event.target.value)}
              placeholder="key id"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <textarea
            value={spki}
            onChange={(event) => setSpki(event.target.value)}
            placeholder="-----BEGIN PUBLIC KEY----- (base64 SPKI)"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs outline-none focus:border-primary"
          />
          {fingerprint ? (
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              sha256 {fingerprint}
            </p>
          ) : null}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <Button type="button" size="sm" onClick={add} disabled={!publisher.trim() || !keyId.trim() || !spki.trim()}>
            Add trust root
          </Button>
        </div>
      </div>
    </ConsolePanel>
  );
}
