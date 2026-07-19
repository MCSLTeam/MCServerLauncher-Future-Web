import assert from "node:assert/strict";
import test from "node:test";
import {
  BINARY_FRAME_HEADER_SIZE,
  BINARY_FRAME_KIND_DOWNLOAD,
  BINARY_FRAME_KIND_UPLOAD,
  buildBinaryFrame,
  bytesToGuidBigEndian,
  guidToBytesBigEndian,
  tryReadBinaryFrame,
} from "./binary.ts";

const SESSION = "01234567-89ab-cdef-0123-456789abcdef";

test("guid big-endian roundtrip", () => {
  const bytes = guidToBytesBigEndian(SESSION);
  assert.equal(bytes.length, 16);
  assert.equal(bytesToGuidBigEndian(bytes), SESSION);
});

test("build + read upload frame", () => {
  const payload = new Uint8Array([1, 2, 3, 4, 5]);
  const frame = buildBinaryFrame(BINARY_FRAME_KIND_UPLOAD, SESSION, 1024, payload);
  assert.equal(frame.byteLength, BINARY_FRAME_HEADER_SIZE + payload.byteLength);
  const parsed = tryReadBinaryFrame(frame);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.header.kind, BINARY_FRAME_KIND_UPLOAD);
  assert.equal(parsed.header.sessionId, SESSION);
  assert.equal(parsed.header.offset, 1024);
  assert.equal(parsed.header.payloadLength, 5);
  assert.deepEqual(Array.from(parsed.payload), [1, 2, 3, 4, 5]);
});

test("build + read download frame", () => {
  const payload = new TextEncoder().encode("hello");
  const frame = buildBinaryFrame(
    BINARY_FRAME_KIND_DOWNLOAD,
    SESSION,
    0,
    payload,
  );
  const parsed = tryReadBinaryFrame(frame);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.header.kind, BINARY_FRAME_KIND_DOWNLOAD);
  assert.equal(new TextDecoder().decode(parsed.payload), "hello");
});

test("rejects short frame", () => {
  const parsed = tryReadBinaryFrame(new Uint8Array(10));
  assert.equal(parsed.ok, false);
});

test("rejects payload length mismatch", () => {
  const payload = new Uint8Array([9, 9]);
  const frame = buildBinaryFrame(BINARY_FRAME_KIND_UPLOAD, SESSION, 0, payload);
  // Truncate payload bytes while keeping header length field
  const broken = frame.subarray(0, BINARY_FRAME_HEADER_SIZE + 1);
  const parsed = tryReadBinaryFrame(broken);
  assert.equal(parsed.ok, false);
});
