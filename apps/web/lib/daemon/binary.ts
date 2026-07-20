/** MCSL Future Protocol V2 binary frames (32-byte header + payload). */

export const BINARY_FRAME_HEADER_SIZE = 32;
export const BINARY_FRAME_VERSION = 1;
export const BINARY_FRAME_KIND_UPLOAD = 1;
export const BINARY_FRAME_KIND_DOWNLOAD = 2;
export const BINARY_FRAME_KIND_CONSOLE_INPUT = 3;
export const BINARY_FRAME_KIND_CONSOLE_OUTPUT = 4;
export const DEFAULT_MAX_CHUNK_SIZE = 1024 * 1024;

export type BinaryFrameKind =
  | typeof BINARY_FRAME_KIND_UPLOAD
  | typeof BINARY_FRAME_KIND_DOWNLOAD
  | typeof BINARY_FRAME_KIND_CONSOLE_INPUT
  | typeof BINARY_FRAME_KIND_CONSOLE_OUTPUT;

export type BinaryFrameHeader = {
  version: number;
  kind: BinaryFrameKind;
  sessionId: string;
  offset: number;
  payloadLength: number;
};

/** RFC 4122 UUID string → 16 big-endian bytes (matches .NET Guid bigEndian:true). */
export function guidToBytesBigEndian(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  if (hex.length !== 32 || !/^[0-9a-f]+$/.test(hex)) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToGuidBigEndian(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error("GUID bytes too short");
  const h = (n: number) => n.toString(16).padStart(2, "0");
  const parts = Array.from(bytes.subarray(0, 16)).map(h).join("");
  return `${parts.slice(0, 8)}-${parts.slice(8, 12)}-${parts.slice(12, 16)}-${parts.slice(16, 20)}-${parts.slice(20, 32)}`;
}

export async function sha256Hex(
  data: ArrayBuffer | ArrayBufferView,
): Promise<string> {
  const buffer =
    data instanceof ArrayBuffer
      ? data
      : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const digest = await crypto.subtle.digest("SHA-256", buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function buildBinaryFrame(
  kind: BinaryFrameKind,
  sessionId: string,
  offset: number,
  payload: Uint8Array,
  maximumChunkSize = DEFAULT_MAX_CHUNK_SIZE,
): Uint8Array {
  if (offset < 0) throw new Error("Binary frame offset cannot be negative");
  if (payload.byteLength > maximumChunkSize) {
    throw new Error(
      `Binary frame payload exceeds maximum chunk size ${maximumChunkSize}`,
    );
  }
  const frame = new Uint8Array(BINARY_FRAME_HEADER_SIZE + payload.byteLength);
  frame[0] = BINARY_FRAME_VERSION;
  frame[1] = kind;
  frame[2] = 0;
  frame[3] = 0;
  frame.set(guidToBytesBigEndian(sessionId), 4);
  const view = new DataView(frame.buffer);
  view.setBigInt64(20, BigInt(offset), true);
  view.setUint32(28, payload.byteLength, true);
  frame.set(payload, BINARY_FRAME_HEADER_SIZE);
  return frame;
}

export function tryReadBinaryFrame(
  frame: ArrayBuffer | ArrayBufferView,
  maximumChunkSize = DEFAULT_MAX_CHUNK_SIZE,
):
  | { ok: true; header: BinaryFrameHeader; payload: Uint8Array }
  | { ok: false; error: string } {
  const bytes =
    frame instanceof ArrayBuffer
      ? new Uint8Array(frame)
      : new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength);

  if (bytes.byteLength < BINARY_FRAME_HEADER_SIZE) {
    return { ok: false, error: "frame_too_short" };
  }
  if (bytes[0] !== BINARY_FRAME_VERSION) {
    return { ok: false, error: "unsupported_version" };
  }
  const kind = bytes[1] as BinaryFrameKind;
  if (
    kind !== BINARY_FRAME_KIND_UPLOAD &&
    kind !== BINARY_FRAME_KIND_DOWNLOAD &&
    kind !== BINARY_FRAME_KIND_CONSOLE_INPUT &&
    kind !== BINARY_FRAME_KIND_CONSOLE_OUTPUT
  ) {
    return { ok: false, error: "unknown_kind" };
  }
  if (bytes[2] !== 0 || bytes[3] !== 0) {
    return { ok: false, error: "reserved_not_zero" };
  }

  const sessionId = bytesToGuidBigEndian(bytes.subarray(4, 20));
  if (sessionId === "00000000-0000-0000-0000-000000000000") {
    return { ok: false, error: "empty_session_id" };
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offset = Number(view.getBigInt64(20, true));
  if (offset < 0) return { ok: false, error: "negative_offset" };

  const payloadLength = view.getUint32(28, true);
  const actualPayloadLength = bytes.byteLength - BINARY_FRAME_HEADER_SIZE;
  if (payloadLength !== actualPayloadLength) {
    return { ok: false, error: "payload_length_mismatch" };
  }
  if (payloadLength > maximumChunkSize) {
    return { ok: false, error: "payload_too_large" };
  }

  return {
    ok: true,
    header: {
      version: BINARY_FRAME_VERSION,
      kind,
      sessionId,
      offset,
      payloadLength,
    },
    payload: bytes.subarray(BINARY_FRAME_HEADER_SIZE),
  };
}
