/**
 * Ports — the id-keyed collection of `PortGeometry` a `WithPorts`
 * implementor reports (`SheetBlock2#getPorts`, `MethodsOrFieldsArea`'s
 * member-row port lookups, SI1 scope, not this task) so an edge targeting
 * `entity::portName` can resolve a precise y-band on the entity's edge
 * instead of the whole box.
 *
 * Upstream: svek/Ports.java. Ported in full: `encodePortNameToId`,
 * `toString`, `translateY`, `add` (score-gated overwrite — a lower-score
 * report for the same port id never replaces a higher one), `addThis`
 * (same score-gated merge, keyed by the ALREADY-encoded id), and
 * `getAllPortGeometry` (sorted ascending by position, per
 * `PortGeometry#compareTo`).
 *
 * `encodePortNameToId` needs an MD5 hex digest
 * (`SignatureUtils.getMD5Hex`, `utils/SignatureUtils.java`). That file is
 * NOT ported here — it is a much larger, general-purpose utility (SHA-512,
 * PBKDF2 salting, file hashing, a TeaVM/browser native fallback) with
 * callers far outside this task's scope (`UmlSource`, `SvgGraphics`,
 * `Version`, ...). Porting it in full would silently widen this task's
 * write-set well past `Ports.ts`. Instead, this file carries a minimal,
 * self-contained, spec-faithful MD5 hex-digest implementation (RFC 1321),
 * scoped to the ONE thing `encodePortNameToId` needs — a UTF-8-bytes-in,
 * lowercase-hex-out digest matching Java's
 * `MessageDigest.getInstance("MD5")` byte-for-byte (cross-checked against
 * the standard RFC 1321 test vectors in this file's own test suite).
 */
import { PortGeometry } from './PortGeometry.js';

/** Left-rotates a 32-bit unsigned value by `bits`. */
function rotateLeft32(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

/** Upstream: `MD5Cycle`'s per-round `K[i] = floor(abs(sin(i+1)) * 2^32)`
 *  (RFC 1321 §3.4) — computed rather than transcribed, to keep this table
 *  provably correct against the spec instead of a 64-entry literal that
 *  could silently typo. */
const MD5_K: readonly number[] = Array.from({ length: 64 }, (_unused, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0,
);

/** Upstream: RFC 1321 §3.4's per-round left-rotate amounts, 4 values
 *  repeated 4 times per round. */
const MD5_S: readonly number[] = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

/** RFC 1321 §3.1-3.2: pads `bytes` to a multiple of 64 bytes — a single
 *  `0x80` bit, zero bytes up to `56 mod 64`, then the ORIGINAL bit length
 *  as a little-endian 64-bit integer (this port never hashes a port name
 *  long enough to overflow 2^32 bits, so the high 32 bits are always 0). */
function md5Pad(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8;
  const paddedLength = ((bytes.length + 8) >> 6) * 64 + 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true);
  return padded;
}

/** RFC 1321 §3.4's main compression loop, one 512-bit (16-word) chunk. */
function md5ProcessChunk(state: Uint32Array, chunk: DataView, chunkOffset: number): void {
  const m: number[] = [];
  for (let j = 0; j < 16; j++) m.push(chunk.getUint32(chunkOffset + j * 4, true));

  let [a, b, c, d] = [state[0] as number, state[1] as number, state[2] as number, state[3] as number];
  for (let i = 0; i < 64; i++) {
    let f: number;
    let g: number;
    if (i < 16) {
      f = (b & c) | (~b & d);
      g = i;
    } else if (i < 32) {
      f = (d & b) | (~d & c);
      g = (5 * i + 1) % 16;
    } else if (i < 48) {
      f = b ^ c ^ d;
      g = (3 * i + 5) % 16;
    } else {
      f = c ^ (b | ~d);
      g = (7 * i) % 16;
    }
    f = (f + a + (MD5_K[i] as number) + (m[g] as number)) >>> 0;
    a = d;
    d = c;
    c = b;
    b = (b + rotateLeft32(f, MD5_S[i] as number)) >>> 0;
  }
  state[0] = (state[0] as number) + a;
  state[1] = (state[1] as number) + b;
  state[2] = (state[2] as number) + c;
  state[3] = (state[3] as number) + d;
}

function toHex(n: number): string {
  const bytes = [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** MD5 hex digest of `s`'s UTF-8 bytes — matches Java's
 *  `MessageDigest.getInstance("MD5").digest(s.getBytes(UTF_8))` then
 *  `SignatureUtils.toHexString`. Not exported: the sole caller is
 *  `encodePortNameToId` below. */
function md5Hex(s: string): string {
  const bytes = new TextEncoder().encode(s);
  const padded = md5Pad(bytes);
  const view = new DataView(padded.buffer);
  const state = Uint32Array.from([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]);
  for (let offset = 0; offset < padded.length; offset += 64) md5ProcessChunk(state, view, offset);
  return toHex(state[0] as number) + toHex(state[1] as number) + toHex(state[2] as number) + toHex(state[3] as number);
}

export class Ports {
  private readonly ids = new Map<string, PortGeometry>();

  /** Upstream: `Ports#encodePortNameToId` — `"p" + SignatureUtils
   *  .getMD5Hex(portName)`. */
  static encodePortNameToId(portName: string): string {
    return `p${md5Hex(portName)}`;
  }

  toString(): string {
    const entries = [...this.ids.entries()].map(([key, value]) => `${key}=${value.toString()}`);
    return `{${entries.join(', ')}}`;
  }

  translateY(deltaY: number): Ports {
    const result = new Ports();
    for (const [key, value] of this.ids) result.ids.set(key, value.translateY(deltaY));
    return result;
  }

  /** Upstream: `Ports#add` — encodes `portName`, then keeps whichever of
   *  the new/existing `PortGeometry` for that id has the HIGHER `score`. */
  add(portName: string, score: number, position: number, height: number): void {
    const id = Ports.encodePortNameToId(portName);
    const already = this.ids.get(id);
    if (already === undefined || already.getScore() < score) {
      this.ids.set(id, new PortGeometry(id, position, height, score));
    }
  }

  /** Upstream: `Ports#addThis` — same score-gated merge as `add`, but
   *  `other`'s entries are ALREADY id-encoded (merging one `Ports` into
   *  another, not adding a raw port name). */
  addThis(other: Ports): void {
    for (const [key, value] of other.ids) {
      const already = this.ids.get(key);
      if (already === undefined || already.getScore() < value.getScore()) {
        this.ids.set(key, value);
      }
    }
  }

  /** Upstream: `Ports#getAllPortGeometry` — an unmodifiable, position-sorted
   *  snapshot (`Collections.sort` + `Collections.unmodifiableCollection`). */
  getAllPortGeometry(): readonly PortGeometry[] {
    const result = [...this.ids.values()];
    result.sort((a, b) => a.compareTo(b));
    return result;
  }
}
