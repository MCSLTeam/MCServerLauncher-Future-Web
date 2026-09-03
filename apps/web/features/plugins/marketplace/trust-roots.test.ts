import test from "node:test";
import assert from "node:assert/strict";

import {
  addTrustRoot,
  isTrusted,
  loadTrustRoots,
  removeTrustRoot,
  saveTrustRoots,
  type TrustRootStorage,
} from "./trust-roots.ts";

class MemoryStorage implements TrustRootStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const SPKI = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE_placeholder";
const FINGERPRINT = "a".repeat(64);

test("trust roots persist, deduplicate and can be removed", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(loadTrustRoots(storage), []);

  addTrustRoot(
    { publisher: "acme", keyId: "k1", publicKeySpkiBase64: SPKI, publicKeySha256: FINGERPRINT },
    storage,
  );
  addTrustRoot(
    { publisher: "acme", keyId: "k1", publicKeySpkiBase64: SPKI, publicKeySha256: FINGERPRINT },
    storage,
  );
  addTrustRoot(
    { publisher: "beta", keyId: "k2", publicKeySpkiBase64: SPKI, publicKeySha256: "b".repeat(64) },
    storage,
  );

  const roots = loadTrustRoots(storage);
  assert.equal(roots.length, 2, "duplicate publisher+key pairs collapse");
  assert.equal(isTrusted("acme", FINGERPRINT, storage), true);
  assert.equal(isTrusted("beta", FINGERPRINT, storage), false);

  removeTrustRoot("acme", FINGERPRINT, storage);
  assert.equal(isTrusted("acme", FINGERPRINT, storage), false);
  assert.equal(loadTrustRoots(storage).length, 1);

  // corrupt storage falls back to empty
  storage.setItem("mcsl.trust-roots.v1", "{not json");
  assert.deepEqual(loadTrustRoots(storage), []);
});

test("invalid entries are filtered on load", () => {
  const storage = new MemoryStorage();
  saveTrustRoots(
    [
      { publisher: "acme", keyId: "k1", publicKeySpkiBase64: SPKI, publicKeySha256: FINGERPRINT, addedAt: "now" },
      { publisher: 42 as unknown as string, keyId: "k2", publicKeySpkiBase64: SPKI, publicKeySha256: "short", addedAt: "now" },
    ],
    storage,
  );
  const roots = loadTrustRoots(storage);
  assert.equal(roots.length, 1);
  assert.equal(roots[0]?.publisher, "acme");
});
