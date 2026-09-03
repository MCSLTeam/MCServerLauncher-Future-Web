/**
 * Trust-root store for signed `.mpx` packages.
 *
 * The offline validator only admits signed packages whose signing key
 * matches a *locally trusted* root (publisher + key id + SPKI fingerprint).
 * This module persists that allowlist and turns it into validator options.
 */

export interface TrustRoot {
  readonly publisher: string;
  readonly keyId: string;
  /** SPKI of the trusted key, base64 (DER) — needed to verify signatures. */
  readonly publicKeySpkiBase64: string;
  readonly publicKeySha256: string;
  readonly addedAt: string;
}

const STORAGE_KEY = "mcsl.trust-roots.v1";

export interface TrustRootStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadTrustRoots(storage: TrustRootStorage = globalThis.localStorage): readonly TrustRoot[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTrustRoot);
  } catch {
    return [];
  }
}

export function saveTrustRoots(roots: readonly TrustRoot[], storage: TrustRootStorage = globalThis.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(roots));
}

export function addTrustRoot(
  root: Omit<TrustRoot, "addedAt">,
  storage: TrustRootStorage = globalThis.localStorage,
): readonly TrustRoot[] {
  const roots = loadTrustRoots(storage);
  const next = [
    ...roots.filter(
      (existing) =>
        existing.publisher !== root.publisher || existing.publicKeySha256 !== root.publicKeySha256,
    ),
    { ...root, addedAt: new Date().toISOString() },
  ];
  saveTrustRoots(next, storage);
  return next;
}

export function removeTrustRoot(
  publisher: string,
  publicKeySha256: string,
  storage: TrustRootStorage = globalThis.localStorage,
): readonly TrustRoot[] {
  const next = loadTrustRoots(storage).filter(
    (root) => !(root.publisher === publisher && root.publicKeySha256 === publicKeySha256),
  );
  saveTrustRoots(next, storage);
  return next;
}

export function isTrusted(
  publisher: string,
  publicKeySha256: string,
  storage: TrustRootStorage = globalThis.localStorage,
): boolean {
  return loadTrustRoots(storage).some(
    (root) => root.publisher === publisher && root.publicKeySha256 === publicKeySha256,
  );
}

/** SPKI base64 (DER) → bytes for the validator's trusted-publisher option. */
export function spkiFromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Build the validator's `trustedPublishers` option from the stored roots.
 * `MpxTrustedPublisher` lives in the validator module, so the return type is
 * shaped here to stay import-light; cast at the call site.
 */
export function toTrustedPublishers(
  storage: TrustRootStorage = globalThis.localStorage,
): readonly {
  readonly publisher: string;
  readonly keyId: string;
  readonly publicKeySubjectPublicKeyInfo: Uint8Array;
}[] {
  return loadTrustRoots(storage).map((root) => ({
    publisher: root.publisher,
    keyId: root.keyId,
    publicKeySubjectPublicKeyInfo: spkiFromBase64(root.publicKeySpkiBase64),
  }));
}

function isTrustRoot(value: unknown): value is TrustRoot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.publisher === "string" &&
    typeof candidate.keyId === "string" &&
    typeof candidate.publicKeySpkiBase64 === "string" &&
    /^[a-f0-9]{64}$/.test(String(candidate.publicKeySha256 ?? ""))
  );
}
