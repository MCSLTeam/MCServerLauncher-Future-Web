/** .NET Guid.TryWriteBytes 混合端序布局 */
export function guidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }
  const bytes = new Uint8Array(16);
  // Data1 LE
  bytes[0] = Number.parseInt(hex.slice(6, 8), 16);
  bytes[1] = Number.parseInt(hex.slice(4, 6), 16);
  bytes[2] = Number.parseInt(hex.slice(2, 4), 16);
  bytes[3] = Number.parseInt(hex.slice(0, 2), 16);
  // Data2 LE
  bytes[4] = Number.parseInt(hex.slice(10, 12), 16);
  bytes[5] = Number.parseInt(hex.slice(8, 10), 16);
  // Data3 LE
  bytes[6] = Number.parseInt(hex.slice(14, 16), 16);
  bytes[7] = Number.parseInt(hex.slice(12, 14), 16);
  // Data4 BE
  for (let i = 0; i < 8; i += 1) {
    bytes[8 + i] = Number.parseInt(hex.slice(16 + i * 2, 18 + i * 2), 16);
  }
  return bytes;
}

export function bytesToGuid(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error("GUID bytes too short");
  const h = (n: number) => n.toString(16).padStart(2, "0");
  const data1 = [bytes[3], bytes[2], bytes[1], bytes[0]].map(h).join("");
  const data2 = [bytes[5], bytes[4]].map(h).join("");
  const data3 = [bytes[7], bytes[6]].map(h).join("");
  const data4a = [bytes[8], bytes[9]].map(h).join("");
  const data4b = Array.from(bytes.slice(10, 16)).map(h).join("");
  return `${data1}-${data2}-${data3}-${data4a}-${data4b}`;
}

export async function sha1Hex(data: ArrayBuffer | ArrayBufferView): Promise<string> {
  const buffer =
    data instanceof ArrayBuffer
      ? data
      : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const digest = await crypto.subtle.digest("SHA-1", buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha1Bytes(
  data: ArrayBuffer | ArrayBufferView,
): Promise<Uint8Array> {
  const buffer =
    data instanceof ArrayBuffer
      ? data
      : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return new Uint8Array(await crypto.subtle.digest("SHA-1", buffer as ArrayBuffer));
}

/** 构造二进制上传帧: [16 Guid][8 offset LE][20 SHA1][data] */
export function buildBinaryUploadFrame(
  fileId: string,
  offset: number,
  chunk: Uint8Array,
  checksum: Uint8Array,
): Uint8Array {
  const payload = new Uint8Array(16 + 8 + 20 + chunk.byteLength);
  payload.set(guidToBytes(fileId), 0);
  const view = new DataView(payload.buffer);
  // BitConverter little-endian
  view.setBigInt64(16, BigInt(offset), true);
  payload.set(checksum, 24);
  payload.set(chunk, 44);
  return payload;
}
